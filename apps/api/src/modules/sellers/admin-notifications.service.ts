import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
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
  private async returnAdminContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("An administrator session is required.");
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true, role: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true, userId: true, user: { select: { role: true } } },
    });
    if (!session) throw new UnauthorizedException("An active administrator session is required.");
    if (session.user.role !== "ADMIN") {
      const permission = await this.prisma.adminPermission.findUnique({
        where: { userId_permission: { userId: session.userId, permission: "RETURNS_REVIEW" } },
        select: { id: true },
      });
      if (!permission) throw new ForbiddenException("You do not have permission to review returns.");
    }
    await this.prisma.customerSession.updateMany({
      where: { id: session.id, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { lastUsedAt: new Date() },
    });
    return { userId: session.userId };
  }

  async listReturns(authorization?: string, status?: string) {
    await this.returnAdminContext(authorization);
    const allowed = ["REQUESTED", "APPROVED", "REJECTED", "ITEM_RECEIVED", "REFUNDED"];
    if (status && !allowed.includes(status)) throw new ConflictException("Invalid return status filter.");
    const requests = await this.prisma.returnRequest.findMany({
      where: status ? { status: status as never } : {},
      orderBy: { createdAt: "desc" }, take: 100,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        sellerOrder: {
          include: {
            seller: { select: { storeName: true, storeSlug: true } },
            items: { select: { id: true, productNameEn: true, productNameBn: true, quantity: true, lineTotalPaisa: true } },
            order: { select: { id: true, paymentMethod: true, paymentStatus: true, createdAt: true } },
          },
        },
      },
    });
    return { requests: requests.map((item) => ({
      ...item, sellerOrder: { ...item.sellerOrder, subtotalPaisa: item.sellerOrder.subtotalPaisa.toString(),
        items: item.sellerOrder.items.map((line) => ({ ...line, lineTotalPaisa: line.lineTotalPaisa.toString() })) },
      refundAmountPaisa: item.refundAmountPaisa?.toString() ?? null,
    })) };
  }

  async reviewReturn(
    authorization: string | undefined,
    id: string,
    input: { action: "APPROVE" | "REJECT" | "ITEM_RECEIVED" | "REFUNDED"; notes?: string; refundReference?: string; refundMethod?: string; refundAmountPaisa?: string; confirmManualRefund?: boolean },
  ) {
    const actor = await this.returnAdminContext(authorization);
    const notes = typeof input.notes === "string" ? input.notes.trim() : "";
    if (notes.length > 1500) throw new ConflictException("Admin notes must be 1,500 characters or fewer.");
    const action = input.action;
    if (!["APPROVE", "REJECT", "ITEM_RECEIVED", "REFUNDED"].includes(action)) throw new ConflictException("Unsupported return action.");
    if (action === "REFUNDED") {
      if (input.confirmManualRefund !== true) throw new ConflictException("Confirm that the refund was completed outside ANAN before recording it.");
      if (!input.refundReference || input.refundReference.trim().length < 4 || input.refundReference.trim().length > 100) throw new ConflictException("A valid external refund reference is required.");
      if (!["BKASH", "NAGAD", "ROCKET", "BANK_TRANSFER", "CASH"].includes(input.refundMethod || "")) throw new ConflictException("Choose a supported manual refund method.");
      if (!input.refundAmountPaisa || !/^\d+$/.test(input.refundAmountPaisa) || BigInt(input.refundAmountPaisa) <= 0n) throw new ConflictException("Refund amount must be a positive paisa value.");
    }
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.returnRequest.findUnique({
        where: { id },
        include: { sellerOrder: { select: { id: true, orderId: true, status: true, subtotalPaisa: true, seller: { select: { storeName: true } } } } },
      });
      if (!request) throw new NotFoundException("Return request not found.");
      let status: "APPROVED" | "REJECTED" | "ITEM_RECEIVED" | "REFUNDED";
      if (action === "APPROVE" || action === "REJECT") {
        if (!["REQUESTED", "APPROVED", "REJECTED"].includes(request.status)) throw new ConflictException("This return is already in fulfilment or refund processing.");
        status = action === "APPROVE" ? "APPROVED" : "REJECTED";
      } else if (action === "ITEM_RECEIVED") {
        if (request.status !== "APPROVED") throw new ConflictException("Only an approved return can be marked as received.");
        status = "ITEM_RECEIVED";
      } else {
        if (request.status !== "ITEM_RECEIVED") throw new ConflictException("The returned item must be received before recording a refund.");
        const amount = BigInt(input.refundAmountPaisa!);
        if (amount > request.sellerOrder.subtotalPaisa) throw new ConflictException("Refund amount cannot exceed the seller order item subtotal.");
        status = "REFUNDED";
      }
      const updated = await tx.returnRequest.update({
        where: { id },
        data: {
          status, adminNotes: notes || request.adminNotes, adminReviewedAt: new Date(), adminReviewedByUserId: actor.userId,
          ...(action === "REFUNDED" ? { refundReference: input.refundReference!.trim(), refundMethod: input.refundMethod, refundAmountPaisa: BigInt(input.refundAmountPaisa!) } : {}),
        },
      });
      await tx.orderEvent.create({
        data: {
          orderId: request.sellerOrder.orderId, actorUserId: actor.userId, actorRole: "ADMIN",
          eventType: `ADMIN_RETURN_${action}`,
          note: notes || `Admin changed return status to ${status}.`,
          metadata: { returnRequestId: id, sellerOrderId: request.sellerOrder.id, status, refundReference: action === "REFUNDED" ? input.refundReference!.trim() : null },
        },
      });
      await tx.adminAuditLog.create({
        data: { actorUserId: actor.userId, action: `RETURN_${action}`, targetType: "RETURN_REQUEST", targetId: id,
          metadata: { status, notesProvided: Boolean(notes), refundMethod: action === "REFUNDED" ? input.refundMethod : null, refundAmountPaisa: action === "REFUNDED" ? input.refundAmountPaisa : null, refundReference: action === "REFUNDED" ? input.refundReference!.trim() : null } },
      });
      return { returnRequest: { id: updated.id, status: updated.status, adminNotes: updated.adminNotes, refundReference: updated.refundReference, refundMethod: updated.refundMethod, refundAmountPaisa: updated.refundAmountPaisa?.toString() ?? null }, message: action === "REFUNDED" ? "Manual refund confirmation recorded. ANAN did not send funds." : `Return request updated to ${status}.` };
    }, { isolationLevel: "Serializable" });
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
}