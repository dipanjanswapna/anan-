import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class SellerFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async sellerContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("A valid seller session is required.");
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() }, user: { role: "SELLER", isActive: true, sellerProfile: { is: { status: "APPROVED" } } } },
      select: { id: true, userId: true, user: { select: { sellerProfile: { select: { id: true, storeName: true, commissionBps: true } } } } },
    });
    if (!session?.user.sellerProfile) throw new UnauthorizedException("An approved seller session is required.");
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    return { userId: session.userId, seller: session.user.sellerProfile };
  }

  private async adminContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("An administrator session is required.");
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true, role: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true, userId: true, user: { select: { role: true } } },
    });
    if (!session) throw new UnauthorizedException("An active administrator session is required.");
    if (session.user.role !== "ADMIN") {
      const permission = await this.prisma.adminPermission.findUnique({ where: { userId_permission: { userId: session.userId, permission: "PAYOUTS_MANAGE" } }, select: { id: true } });
      if (!permission) throw new ForbiddenException("You do not have permission to manage seller payouts.");
    }
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    return { userId: session.userId };
  }

  async sellerSummary(authorization?: string) {
    const { seller } = await this.sellerContext(authorization);
    const [available, paid, pending, recent, earnings] = await Promise.all([
      this.prisma.sellerEarning.aggregate({ where: { sellerId: seller.id, status: "AVAILABLE", payoutRequestId: null }, _sum: { netPaisa: true } }),
      this.prisma.sellerEarning.aggregate({ where: { sellerId: seller.id, status: "PAID" }, _sum: { netPaisa: true } }),
      this.prisma.sellerPayoutRequest.aggregate({ where: { sellerId: seller.id, status: { in: ["REQUESTED", "APPROVED"] } }, _sum: { amountPaisa: true } }),
      this.prisma.sellerPayoutRequest.findMany({ where: { sellerId: seller.id }, orderBy: { requestedAt: "desc" }, take: 20, select: { id: true, amountPaisa: true, status: true, payoutMethod: true, payoutReference: true, requestedAt: true, paidAt: true, adminNotes: true } }),
      this.prisma.sellerEarning.findMany({ where: { sellerId: seller.id }, orderBy: { deliveredAt: "desc" }, take: 50, include: { sellerOrder: { select: { id: true, orderId: true, status: true } } } }),
    ]);
    return {
      seller: { storeName: seller.storeName, commissionBps: seller.commissionBps },
      balance: { availablePaisa: (available._sum.netPaisa ?? 0n).toString(), paidPaisa: (paid._sum.netPaisa ?? 0n).toString(), pendingPayoutPaisa: (pending._sum.amountPaisa ?? 0n).toString() },
      payoutRequests: recent.map((p) => ({ ...p, amountPaisa: p.amountPaisa.toString() })),
      earnings: earnings.map((e) => ({ id: e.id, sellerOrderId: e.sellerOrderId, orderId: e.sellerOrder.orderId, grossPaisa: e.grossPaisa.toString(), commissionPaisa: e.commissionPaisa.toString(), netPaisa: e.netPaisa.toString(), status: e.status, deliveredAt: e.deliveredAt.toISOString(), releasedAt: e.releasedAt.toISOString() })),
    };
  }

  async requestPayout(authorization: string | undefined, input: { payoutMethod: string; payoutDestination: string }) {
    const { seller } = await this.sellerContext(authorization);
    const method = input.payoutMethod;
    const destination = typeof input.payoutDestination === "string" ? input.payoutDestination.trim() : "";
    if (!["BKASH", "NAGAD", "ROCKET", "BANK_TRANSFER"].includes(method)) throw new ConflictException("Choose a supported payout method.");
    if (destination.length < 8 || destination.length > 120 || /[<>]/.test(destination)) throw new ConflictException("Enter a valid payout account or mobile number.");
    return this.prisma.$transaction(async (tx) => {
      const open = await tx.sellerPayoutRequest.findFirst({ where: { sellerId: seller.id, status: { in: ["REQUESTED", "APPROVED"] } }, select: { id: true } });
      if (open) throw new ConflictException("You already have a payout request awaiting completion.");
      const entries = await tx.sellerEarning.findMany({ where: { sellerId: seller.id, status: "AVAILABLE", payoutRequestId: null }, orderBy: { releasedAt: "asc" } });
      const amount = entries.reduce((sum, entry) => sum + entry.netPaisa, 0n);
      if (amount <= 0n) throw new ConflictException("There is no available seller balance to withdraw.");
      const request = await tx.sellerPayoutRequest.create({ data: { sellerId: seller.id, amountPaisa: amount, payoutMethod: method, payoutDestination: destination } });
      await tx.sellerEarning.updateMany({ where: { id: { in: entries.map((entry) => entry.id) }, payoutRequestId: null }, data: { payoutRequestId: request.id } });
      return { payoutRequest: { id: request.id, amountPaisa: amount.toString(), status: request.status, payoutMethod: request.payoutMethod }, message: "Payout request submitted for Admin approval." };
    }, { isolationLevel: "Serializable" });
  }

  async releaseDeliveredOrder(authorization: string | undefined, sellerOrderId: string) {
    const actor = await this.adminContext(authorization);
    const windowDays = Math.min(30, Math.max(1, Number(process.env.RETURN_REQUEST_WINDOW_DAYS || 7)));
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.sellerOrder.findUnique({ where: { id: sellerOrderId }, include: { shipment: true, returnRequest: true, seller: { select: { id: true, commissionBps: true } } } });
      if (!order) throw new NotFoundException("Seller order not found.");
      if (order.status !== "DELIVERED" || !order.shipment?.deliveredAt) throw new ConflictException("Only courier-confirmed delivered orders can be released.");
      if (order.returnRequest && order.returnRequest.status !== "REJECTED") throw new ConflictException("A return request is active or has not been finally resolved.");
      const deliveredAt = order.shipment.deliveredAt;
      const releaseAt = new Date(deliveredAt.getTime() + windowDays * 86400000);
      if (releaseAt > new Date()) throw new ConflictException(`Return window ends at ${releaseAt.toISOString()}.`);
      if (order.seller.commissionBps < 0 || order.seller.commissionBps > 5000) throw new ConflictException("Seller commission configuration is invalid.");
      const gross = order.subtotalPaisa;
      const commission = (gross * BigInt(order.seller.commissionBps) + 5000n) / 10000n;
      const net = gross - commission;
      const earning = await tx.sellerEarning.create({ data: { sellerId: order.sellerId, sellerOrderId: order.id, grossPaisa: gross, commissionPaisa: commission, netPaisa: net, deliveredAt } });
      await tx.adminAuditLog.create({ data: { actorUserId: actor.userId, action: "SELLER_EARNING_RELEASED", targetType: "SELLER_ORDER", targetId: order.id, metadata: { grossPaisa: gross.toString(), commissionBps: order.seller.commissionBps, commissionPaisa: commission.toString(), netPaisa: net.toString(), deliveredAt: deliveredAt.toISOString(), returnWindowDays: windowDays } } });
      await tx.orderEvent.create({ data: { orderId: order.orderId, actorUserId: actor.userId, actorRole: "ADMIN", eventType: "SELLER_EARNING_RELEASED", note: "Seller earnings released after the return window and Admin review.", metadata: { sellerOrderId: order.id, earningId: earning.id, netPaisa: net.toString() } } });
      return { earning: { id: earning.id, grossPaisa: gross.toString(), commissionPaisa: commission.toString(), netPaisa: net.toString(), status: earning.status } };
    }, { isolationLevel: "Serializable" });
  }

  async adminListPayouts(authorization?: string, status?: string) {
    await this.adminContext(authorization);
    const allowed = ["REQUESTED", "APPROVED", "REJECTED", "PAID"];
    if (status && !allowed.includes(status)) throw new ConflictException("Invalid payout status filter.");
    const payouts = await this.prisma.sellerPayoutRequest.findMany({ where: status ? { status: status as never } : {}, orderBy: { requestedAt: "desc" }, take: 100, include: { seller: { select: { storeName: true, storeSlug: true, user: { select: { name: true, phone: true, email: true } } } }, earnings: { select: { id: true, sellerOrderId: true, grossPaisa: true, commissionPaisa: true, netPaisa: true } } } });
    return { payouts: payouts.map((p) => ({ ...p, amountPaisa: p.amountPaisa.toString(), earnings: p.earnings.map((e) => ({ ...e, grossPaisa: e.grossPaisa.toString(), commissionPaisa: e.commissionPaisa.toString(), netPaisa: e.netPaisa.toString() })) })) };
  }

  async reviewPayout(authorization: string | undefined, id: string, input: { action: "APPROVE" | "REJECT" | "PAID"; notes?: string; payoutReference?: string }) {
    const actor = await this.adminContext(authorization);
    const notes = input.notes?.trim() || "";
    if (notes.length > 1000) throw new ConflictException("Admin notes must be 1,000 characters or fewer.");
    if (!["APPROVE", "REJECT", "PAID"].includes(input.action)) throw new ConflictException("Unsupported payout action.");
    if (input.action === "PAID" && (!input.payoutReference || input.payoutReference.trim().length < 4 || input.payoutReference.trim().length > 100)) throw new ConflictException("A valid external payout transaction reference is required.");
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.sellerPayoutRequest.findUnique({ where: { id }, include: { earnings: true } });
      if (!payout) throw new NotFoundException("Payout request not found.");
      if (input.action === "APPROVE") {
        if (payout.status !== "REQUESTED") throw new ConflictException("Only a requested payout can be approved.");
        const updated = await tx.sellerPayoutRequest.update({ where: { id }, data: { status: "APPROVED", adminNotes: notes || null, reviewedAt: new Date(), reviewedByUserId: actor.userId } });
        await tx.adminAuditLog.create({ data: { actorUserId: actor.userId, action: "SELLER_PAYOUT_APPROVED", targetType: "SELLER_PAYOUT", targetId: id, metadata: { amountPaisa: payout.amountPaisa.toString(), notesProvided: Boolean(notes) } } });
        return { payoutRequest: { id, status: updated.status, amountPaisa: updated.amountPaisa.toString() } };
      }
      if (input.action === "REJECT") {
        if (payout.status !== "REQUESTED" && payout.status !== "APPROVED") throw new ConflictException("This payout can no longer be rejected.");
        await tx.sellerEarning.updateMany({ where: { payoutRequestId: id, status: "AVAILABLE" }, data: { payoutRequestId: null } });
        const updated = await tx.sellerPayoutRequest.update({ where: { id }, data: { status: "REJECTED", adminNotes: notes || null, reviewedAt: new Date(), reviewedByUserId: actor.userId } });
        await tx.adminAuditLog.create({ data: { actorUserId: actor.userId, action: "SELLER_PAYOUT_REJECTED", targetType: "SELLER_PAYOUT", targetId: id, metadata: { notesProvided: Boolean(notes) } } });
        return { payoutRequest: { id, status: updated.status, amountPaisa: updated.amountPaisa.toString() } };
      }
      if (payout.status !== "APPROVED") throw new ConflictException("Only an approved payout can be marked paid.");
      const now = new Date();
      await tx.sellerEarning.updateMany({ where: { payoutRequestId: id, status: "AVAILABLE" }, data: { status: "PAID", paidAt: now } });
      const updated = await tx.sellerPayoutRequest.update({ where: { id }, data: { status: "PAID", payoutReference: input.payoutReference!.trim(), paidAt: now, adminNotes: notes || payout.adminNotes } });
      await tx.adminAuditLog.create({ data: { actorUserId: actor.userId, action: "SELLER_PAYOUT_PAID", targetType: "SELLER_PAYOUT", targetId: id, metadata: { amountPaisa: payout.amountPaisa.toString(), payoutReference: input.payoutReference!.trim(), notesProvided: Boolean(notes) } } });
      return { payoutRequest: { id, status: updated.status, amountPaisa: updated.amountPaisa.toString(), payoutReference: updated.payoutReference }, message: "Manual payout recorded. ANAN did not send funds." };
    }, { isolationLevel: "Serializable" });
  }
}
