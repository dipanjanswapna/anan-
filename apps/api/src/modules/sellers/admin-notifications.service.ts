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

 
  async monitorOrders(authorization?: string, status?: string) {
    await this.authorize(authorization);
    const allowed = ["PENDING_SELLER_ACCEPTANCE", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (status && !allowed.includes(status)) throw new NotFoundException("Unsupported order status filter.");
    const where = status ? { status: status as never } : {};
    const [counts, orders] = await Promise.all([
      this.prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.order.findMany({
        where, orderBy: { createdAt: "desc" }, take: 100,
        include: {
          user: { select: { id: true, name: true, phone: true } },
          sellerOrders: { include: { seller: { select: { storeName: true, storeSlug: true } }, shipment: { include: { events: { orderBy: { occurredAt: "desc" }, take: 5 } } } } },
        },
      }),
    ]);
    return {
      counts: counts.map((item) => ({ status: item.status, count: item._count._all })),
      orders: orders.map((order) => ({
        id: order.id, status: order.status, paymentStatus: order.paymentStatus,
        totalPaisa: order.totalPaisa.toString(), createdAt: order.createdAt.toISOString(),
        customer: order.user,
        sellerOrders: order.sellerOrders.map((item) => ({
          id: item.id, status: item.status, seller: item.seller,
          shipment: item.shipment ? { ...item.shipment, events: item.shipment.events, createdAt: item.shipment.createdAt.toISOString(), updatedAt: item.shipment.updatedAt.toISOString() } : null,
        })),
      })),
    };
  }
