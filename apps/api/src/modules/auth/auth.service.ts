import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Prisma, UserRole } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../database/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const REFRESH_COOKIE = "anan_refresh";
const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async issueSession(user: { id: string; role: UserRole; displayName: string | null; email: string | null; phone: string | null }) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    const sessionId = randomBytes(18).toString("hex");
    const secret = randomBytes(48).toString("base64url");
    const days = this.config.get<number>("AUTH_REFRESH_TTL_DAYS", 30);
    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: hashToken(secret),
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });
    return {
      accessToken,
      refreshToken: `${sessionId}.${secret}`,
      tokenType: "Bearer",
      expiresIn: this.config.get<string>("JWT_ACCESS_TTL", "15m"),
      user: { id: user.id, displayName: user.displayName, email: user.email, phone: user.phone, role: user.role },
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email?.trim().toLowerCase() || null;
    const phone = dto.phone?.trim() || null;
    const passwordHash = await bcrypt.hash(dto.password, 12);
    try {
      const user = await this.prisma.user.create({
        data: { displayName: dto.displayName.trim(), email, phone, passwordHash, role: UserRole.CUSTOMER },
        select: { id: true, role: true, displayName: true, email: true, phone: true },
      });
      return this.issueSession(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("An account already exists with this email or phone");
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] },
      select: { id: true, role: true, displayName: true, email: true, phone: true, passwordHash: true, isActive: true },
    });
    if (!user || user.role !== UserRole.CUSTOMER || !user.passwordHash || !user.isActive || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email/phone or password");
    }
    return this.issueSession(user);
  }

  async refresh(refreshToken: string) {
    const [sessionId, secret, extra] = refreshToken.split(".");
    if (!sessionId || !secret || extra) throw new UnauthorizedException("Invalid refresh session");
    const now = new Date();
    const nextSecret = randomBytes(48).toString("base64url");
    const days = this.config.get<number>("AUTH_REFRESH_TTL_DAYS", 30);
    const { user, nextSessionId } = await this.prisma.$transaction(async (tx) => {
      const session = await tx.authSession.findFirst({
        where: { id: sessionId, tokenHash: hashToken(secret), revokedAt: null, expiresAt: { gt: now } },
        select: { userId: true },
      });
      if (!session) throw new UnauthorizedException("Refresh session expired or revoked");
      const changed = await tx.authSession.updateMany({
        where: { id: sessionId, tokenHash: hashToken(secret), revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now },
      });
      if (changed.count !== 1) throw new UnauthorizedException("Refresh session already used");
      const account = await tx.user.findFirst({
        where: { id: session.userId, isActive: true, role: UserRole.CUSTOMER },
        select: { id: true, role: true, displayName: true, email: true, phone: true },
      });
      if (!account) throw new UnauthorizedException("Account is unavailable");
      const newId = randomBytes(18).toString("hex");
      await tx.authSession.create({
        data: { id: newId, userId: account.id, tokenHash: hashToken(nextSecret), expiresAt: new Date(now.getTime() + days * 86400000) },
      });
      return { user: account, nextSessionId: newId };
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return {
      accessToken,
      refreshToken: `${nextSessionId}.${nextSecret}`,
      tokenType: "Bearer",
      expiresIn: this.config.get<string>("JWT_ACCESS_TTL", "15m"),
      user: { id: user.id, displayName: user.displayName, email: user.email, phone: user.phone, role: user.role },
    };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    const [sessionId, secret, extra] = refreshToken.split(".");
    if (!sessionId || !secret || extra) return;
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, tokenHash: hashToken(secret), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: { id: true, displayName: true, email: true, phone: true, role: true, emailVerifiedAt: true, phoneVerifiedAt: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException("Account is unavailable");
    return user;
  }

  static readonly refreshCookieName = REFRESH_COOKIE;
}
