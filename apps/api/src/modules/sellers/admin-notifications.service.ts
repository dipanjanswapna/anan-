import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AdminNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async authorize(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("An administrator session is required.");
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await this.prisma.customerSession.findFirst({
      where: {
        tokenHash, revokedAt: null, expiresAt: { gt: new Date() },
        user: { isActive: true, role: { in: ["ADMIN", "STAFF"] } },
      },
      select: { id: true },
    });
    if (!session) throw new UnauthorizedException("An active administrator session is required.");
    await this.prisma.customerSession.updateMany({
      where: { id: session.id, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { lastUsedAt: new Date() },
    });
  }

  async list(authorization?: string) {
    await this.authorize(authorization);
    const [unreadCount, notifications] = await Promise.all([
      this.prisma.adminNotification.count({ where: { readAt: null } }),
      this.prisma.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    ]);
    return {
      unreadCount,
      notifications: notifications.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        readAt: item.readAt?.toISOString() ?? null,
      })),
    };
  }

  async markRead(authorization: string | undefined, id: string) {
    await this.authorize(authorization);
    const result = await this.prisma.adminNotification.updateMany({
      where: { id, readAt: null },
      data: { readAt: new Date() },
    });
    if (!result.count) {
      const exists = await this.prisma.adminNotification.findUnique({ where: { id }, select: { id: true, readAt: true } });
      if (!exists) throw new NotFoundException("Notification not found.");
      return { id, read: true };
    }
    return { id, read: true };
  }
}
