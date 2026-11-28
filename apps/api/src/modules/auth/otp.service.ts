import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OtpPurpose, UserRole } from "@prisma/client";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { OtpDeliveryService } from "./otp-delivery.service";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_WINDOW_MS = 15 * 60 * 1000;
const OTP_MAX_REQUESTS = 3;
const OTP_MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly delivery: OtpDeliveryService,
  ) {}

  private digest(challengeId: string, code: string): string {
    const secret = this.config.get<string>("OTP_HASH_SECRET");
    if (!secret || secret.length < 32) {
      throw new Error("OTP_HASH_SECRET must be configured with at least 32 characters.");
    }
    return createHmac("sha256", secret).update(`${challengeId}:${code}`).digest("hex");
  }

  async request(phone: string, purpose: OtpPurpose) {
    if (purpose === OtpPurpose.SELLER_PHONE_VERIFICATION) {
      const eligible = await this.prisma.user.findFirst({
        where: { phone, role: UserRole.SELLER, isActive: true, sellerProfile: { is: { status: "APPROVED" } } },
        select: { id: true },
      });
      if (!eligible) return { message: "If this number can receive messages, a verification code has been sent." };
    }
    const now = new Date();
    const windowStart = new Date(now.getTime() - OTP_WINDOW_MS);
    const recentCount = await this.prisma.otpChallenge.count({
      where: { phone, purpose, createdAt: { gte: windowStart } },
    });
    const lastRequest = await this.prisma.otpChallenge.findFirst({
      where: { phone, purpose },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (lastRequest && now.getTime() - lastRequest.createdAt.getTime() < OTP_COOLDOWN_MS) {
      throw new HttpException("Please wait before requesting another code.", HttpStatus.TOO_MANY_REQUESTS);
    }
    if (recentCount >= OTP_MAX_REQUESTS) {
      throw new HttpException("Too many verification requests. Try again in 15 minutes.", HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const challenge = await this.prisma.otpChallenge.create({
      data: {
        phone,
        purpose,
        codeHash: "pending",
        expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      },
      select: { id: true },
    });

    try {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { codeHash: this.digest(challenge.id, code) },
      });
      await this.delivery.send(phone, code);
    } catch (error) {
      await this.prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => undefined);
      throw error;
    }

    return { message: "If this number can receive messages, a verification code has been sent." };
  }

  async verify(phone: string, purpose: OtpPurpose, code: string) {
    if (![OtpPurpose.CUSTOMER_LOGIN, OtpPurpose.CUSTOMER_SIGNUP, OtpPurpose.SELLER_PHONE_VERIFICATION].includes(purpose)) {
      throw new ForbiddenException("This verification purpose cannot create a session.");
    }
    const now = new Date();
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phone, purpose, consumedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge || challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException("The verification code is invalid or expired.");
    }

    const attempt = await this.prisma.otpChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (attempt.count !== 1) {
      throw new UnauthorizedException("The verification code is invalid or expired.");
    }

    const expected = Buffer.from(challenge.codeHash, "hex");
    const supplied = Buffer.from(this.digest(challenge.id, code), "hex");
    const valid = expected.length === supplied.length && timingSafeEqual(expected, supplied);

    if (!valid) {
      if (challenge.attempts + 1 >= OTP_MAX_ATTEMPTS) {
        await this.prisma.otpChallenge.updateMany({
          where: { id: challenge.id, consumedAt: null },
          data: { consumedAt: now },
        });
      }
      throw new BadRequestException("The verification code is incorrect.");
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    const user = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.otpChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException("The verification code is invalid or expired.");
      }
      let account = await tx.user.findUnique({ where: { phone }, include: { sellerProfile: true } });
      if (purpose === OtpPurpose.SELLER_PHONE_VERIFICATION) {
        if (!account || account.role !== UserRole.SELLER || !account.isActive || account.sellerProfile?.status !== "APPROVED") {
          throw new ForbiddenException("This seller account is not approved or active.");
        }
      } else {
        if (account && account.role !== UserRole.CUSTOMER) {
          throw new ForbiddenException("This mobile number is linked to a non-customer account.");
        }
        if (account && !account.isActive) {
          throw new ForbiddenException("This customer account is disabled.");
        }
        account = account
          ? await tx.user.update({ where: { id: account.id }, data: { phoneVerifiedAt: now } })
          : await tx.user.create({ data: { phone, role: UserRole.CUSTOMER, phoneVerifiedAt: now } });
      }
      if (!account) throw new UnauthorizedException("The account could not be verified.");
      await tx.user.update({ where: { id: account.id }, data: { phoneVerifiedAt: now } });
      await tx.customerSession.create({ data: { userId: account.id, tokenHash, expiresAt } });
      return { id: account.id, phone: account.phone, role: account.role };
    });
    return {
      authenticated: true,
      sessionToken: rawToken,
      expiresAt: expiresAt.toISOString(),
      user,
      message: "You are now signed in to ANAN.",
    };
  }
}
