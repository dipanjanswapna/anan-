import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class SellerOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private async sellerContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("A valid seller session is required.");
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await this.prisma.customerSession.findFirst({
      where: {
        tokenHash, revokedAt: null, expiresAt: { gt: new Date() },
        user: { role: "SELLER", isActive: true, sellerProfile: { is: { status: "APPROVED" } } },
      },
      select: { id: true, userId: true, user: { select: { sellerProfile: { select: { id: true, storeName: true, storeSlug: true } } } } },
    });
    if (!session?.user.sellerProfile) throw new UnauthorizedException("An approved seller session is required.");
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    return { userId: session.userId, seller: session.user.sellerProfile };
  }

  async dashboard(authorization?: string) {
    const { seller } = await this.sellerContext(authorization);
    const [pending, active, completed, recent] = await Promise.all([
      this.prisma.sellerOrder.count({ where: { sellerId: seller.id, status: "PENDING_ACCEPTANCE" } }),
      this.prisma.sellerOrder.count({ where: { sellerId: seller.id, status: { in: ["ACCEPTED", "PROCESSING", "SHIPPED"] } } }),
      this.prisma.sellerOrder.count({ where: { sellerId: seller.id, status: "DELIVERED" } }),
      this.prisma.sellerOrder.findMany({
        where: { sellerId: seller.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { order: { select: { id: true, createdAt: true, addressSnapshot: true, user: { select: { name: true, phone: true } } } }, items: true },
      }),
    ]);
    return {
      seller,
      stats: { pending, active, completed },
      orders: recent.map((item) => ({
        id: item.id, status: item.status, subtotalPaisa: item.subtotalPaisa.toString(),
        acceptanceDeadlineAt: item.acceptanceDeadlineAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        order: item.order,
        items: item.items.map((line) => ({ id: line.id, productNameEn: line.productNameEn, productNameBn: line.productNameBn, quantity: line.quantity, unitPricePaisa: line.unitPricePaisa.toString(), lineTotalPaisa: line.lineTotalPaisa.toString() })),
      })),
    };
  }

  async changeOrderStatus(authorization: string | undefined, sellerOrderId: string, action: "accept" | "reject") {
    const { seller, userId } = await this.sellerContext(authorization);
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const item = await tx.sellerOrder.findFirst({
        where: { id: sellerOrderId, sellerId: seller.id },
        include: { items: true, order: { select: { id: true } } },
      });
      if (!item) throw new NotFoundException("Seller order not found.");
      if (item.status !== "PENDING_ACCEPTANCE") throw new ConflictException("This order is no longer awaiting acceptance.");

      const expired = action === "accept" && item.acceptanceDeadlineAt !== null && item.acceptanceDeadlineAt <= now;
      const nextStatus = expired ? "CANCELLED" : action === "accept" ? "ACCEPTED" : "REJECTED";
      if (action === "reject" || expired) {
        for (const line of item.items) {
          await tx.product.update({ where: { id: line.productId }, data: { stockOnHand: { increment: line.quantity } } });
        }
      }
      await tx.sellerOrder.update({ where: { id: item.id }, data: { status: nextStatus } });
      await tx.orderEvent.create({
        data: {
          orderId: item.order.id, actorUserId: userId, actorRole: "SELLER",
          eventType: expired ? "SELLER_ORDER_ACCEPTANCE_TIMEOUT" : action === "accept" ? "SELLER_ORDER_ACCEPTED" : "SELLER_ORDER_REJECTED",
          note: expired ? "The seller acceptance window expired; stock was restored." : action === "accept" ? "Seller accepted the order." : "Seller rejected the order; stock was restored.",
          metadata: { sellerOrderId: item.id, sellerId: seller.id },
        },
      });
      const siblings = await tx.sellerOrder.findMany({ where: { orderId: item.order.id }, select: { status: true } });
      if (siblings.every((row) => row.status !== "PENDING_ACCEPTANCE")) {
        const allRejected = siblings.every((row) => row.status === "REJECTED" || row.status === "CANCELLED");
        await tx.order.update({ where: { id: item.order.id }, data: { status: allRejected ? "CANCELLED" : "PROCESSING" } });
      }
      return { id: item.id, status: nextStatus, expired };
    }, { isolationLevel: "Serializable" });
    return {
      sellerOrder: result,
      message: result.expired ? "The 24-hour acceptance window expired. The order was cancelled and stock restored." : action === "accept" ? "Order accepted." : "Order rejected and stock restored.",
    };
  }
}
