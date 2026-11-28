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

 
  async upsertShipment(authorization: string | undefined, sellerOrderId: string, input: { courierName: string; trackingNumber: string; trackingUrl?: string; estimatedDeliveryAt?: string }) {
    const { seller, userId } = await this.sellerContext(authorization);
    const order = await this.prisma.sellerOrder.findFirst({
      where: { id: sellerOrderId, sellerId: seller.id },
      select: { id: true, status: true },
    });
    if (!order) throw new NotFoundException("Seller order not found.");
    if (!["ACCEPTED", "PROCESSING", "SHIPPED"].includes(order.status)) {
      throw new ConflictException("Shipment details can only be added after the seller accepts the order.");
    }
    const courierName = input.courierName.trim();
    const trackingNumber = input.trackingNumber.trim();
    if (!courierName || !trackingNumber) throw new ConflictException("Courier name and tracking number are required.");
    const estimatedDeliveryAt = input.estimatedDeliveryAt ? new Date(input.estimatedDeliveryAt) : undefined;
    if (estimatedDeliveryAt && Number.isNaN(estimatedDeliveryAt.getTime())) throw new ConflictException("Estimated delivery date is invalid.");
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.courierShipment.findUnique({ where: { sellerOrderId } });
      const shipment = await tx.courierShipment.upsert({
        where: { sellerOrderId },
        create: {
          sellerOrderId, courierName, trackingNumber, trackingUrl: input.trackingUrl || null,
          estimatedDeliveryAt, status: "LABEL_CREATED",
          events: { create: { status: "LABEL_CREATED", description: "Shipment tracking created by seller." } },
        },
        update: { courierName, trackingNumber, trackingUrl: input.trackingUrl || null, estimatedDeliveryAt },
        include: { events: { orderBy: { occurredAt: "asc" } } },
      });
      if (existing) {
        await tx.shipmentEvent.create({ data: { shipmentId: shipment.id, status: shipment.status, description: "Shipment details updated by seller." } });
      }
      await tx.orderEvent.create({
        data: { orderId: (await tx.sellerOrder.findUniqueOrThrow({ where: { id: sellerOrderId }, select: { orderId: true } })).orderId,
          actorUserId: userId, actorRole: "SELLER", eventType: "COURIER_TRACKING_UPDATED",
          note: "Seller created or updated courier tracking details.", metadata: { sellerOrderId, courierName } },
      });
      return { shipment, message: "Courier tracking details saved." };
    });
  }

  async updateShipmentStatus(authorization: string | undefined, sellerOrderId: string, input: { status: "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "DELIVERY_FAILED" | "RETURNED"; description?: string }) {
    const { seller, userId } = await this.sellerContext(authorization);
    const order = await this.prisma.sellerOrder.findFirst({ where: { id: sellerOrderId, sellerId: seller.id }, select: { id: true, orderId: true } });
    if (!order) throw new NotFoundException("Seller order not found.");
    const shipment = await this.prisma.courierShipment.findUnique({ where: { sellerOrderId } });
    if (!shipment) throw new NotFoundException("Create courier tracking details before updating shipment status.");
    const result = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.courierShipment.update({
        where: { id: shipment.id },
        data: {
          status: input.status,
          ...(input.status === "PICKED_UP" && !shipment.shippedAt ? { shippedAt: now } : {}),
          ...(input.status === "DELIVERED" ? { deliveredAt: now } : {}),
          events: { create: { status: input.status, description: input.description?.trim() || null, occurredAt: now } },
        },
        include: { events: { orderBy: { occurredAt: "asc" } } },
      });
      if (input.status === "PICKED_UP" || input.status === "IN_TRANSIT" || input.status === "OUT_FOR_DELIVERY") {
        await tx.sellerOrder.update({ where: { id: sellerOrderId }, data: { status: "SHIPPED" } });
      } else if (input.status === "DELIVERED") {
        await tx.sellerOrder.update({ where: { id: sellerOrderId }, data: { status: "DELIVERED" } });
      }
      await tx.orderEvent.create({
        data: { orderId: order.orderId, actorUserId: userId, actorRole: "SELLER", eventType: "COURIER_SHIPMENT_STATUS_UPDATED",
          note: input.description?.trim() || `Courier shipment status changed to ${input.status}.`,
          metadata: { sellerOrderId, shipmentId: shipment.id, status: input.status } },
      });
      const siblingStatuses = await tx.sellerOrder.findMany({ where: { orderId: order.orderId }, select: { status: true } });
      if (siblingStatuses.length && siblingStatuses.every((item) => item.status === "DELIVERED")) {
        await tx.order.update({ where: { id: order.orderId }, data: { status: "DELIVERED" } });
      } else if (siblingStatuses.some((item) => item.status === "SHIPPED" || item.status === "DELIVERED")) {
        await tx.order.update({ where: { id: order.orderId }, data: { status: "SHIPPED" } });
      }
      return updated;
    }, { isolationLevel: "Serializable" });
    return { shipment: result };
  }
