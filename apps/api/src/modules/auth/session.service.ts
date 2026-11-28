import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  private tokenFromHeader(authorization?: string): string {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("A valid customer session is required.");
    return match[1];
  }

  async current(authorization?: string) {
    const token = this.tokenFromHeader(authorization);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now }, user: { isActive: true, role: { in: ["CUSTOMER", "SELLER"] } } },
      select: {
        id: true,
        expiresAt: true,
        user: { select: { id: true, phone: true, email: true, role: true, createdAt: true, sellerProfile: { select: { status: true } } } },
      },
    });
    if (!session || (session.user.role === "SELLER" && session.user.sellerProfile?.status !== "APPROVED")) {
      throw new UnauthorizedException("Your session has expired. Please sign in again.");
    }
    await this.prisma.customerSession.updateMany({
      where: { id: session.id, revokedAt: null, expiresAt: { gt: now } },
      data: { lastUsedAt: now },
    });
    return { authenticated: true, user: { id: session.user.id, phone: session.user.phone, email: session.user.email, role: session.user.role, createdAt: session.user.createdAt }, session: { expiresAt: session.expiresAt } };
  }

  async revoke(authorization?: string) {
    const token = this.tokenFromHeader(authorization);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const result = await this.prisma.customerSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: now },
    });
    return { authenticated: false, revoked: result.count === 1, message: "You have been signed out." };
  }
}
