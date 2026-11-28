import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class SellerOrderExpiryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SellerOrderExpiryWorker.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  onModuleInit() {
    const interval = this.config.get<number>("ORDER_EXPIRY_POLL_INTERVAL_MS", 60_000);
    this.timer = setInterval(() => void this.sweep(), interval);
    this.timer.unref();
    void this.sweep();
    this.logger.log(`Seller order expiry worker started (poll interval: ${interval}ms).`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async sweep() {
    if (this.running) return;
    this.running = true;
    try {
      const due = await this.prisma.sellerOrder.findMany({
        where: { status: "PENDING_ACCEPTANCE", acceptanceDeadlineAt: { lte: new Date() } },
        select: { id: true },
        orderBy: { acceptanceDeadlineAt: "asc" },
        take: 100,
      });
      for (const candidate of due) {
        try {
          await this.expireOne(candidate.id);
        } catch (error) {
          this.logger.error(`Could not expire seller order ${candidate.id}.`, error instanceof Error ? error.stack : String(error));
        }
      }
      if (due.length) this.logger.log(`Processed ${due.length} overdue seller-order candidate(s).`);
    } catch (error) {
      this.logger.error("Seller order expiry sweep failed.", error instanceof Error ? error.stack : String(error));
    } finally {
      this.running = false;
    }
  }

  private async expireOne(sellerOrderId: string) {
    await this.prisma.$transaction(async (tx) => {
      const item = await tx.sellerOrder.findUnique({
        where: { id: sellerOrderId },
        include: { items: true, seller: { select: { storeName: true } }, order: { select: { id: true } } },
      });
      const now = new Date();
      if (!item || item.status !== "PENDING_ACCEPTANCE" || !item.acceptanceDeadlineAt || item.acceptanceDeadlineAt > now) return;

      for (const line of item.items) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stockOnHand: { increment: line.quantity } },
        });
      }
      await tx.sellerOrder.update({ where: { id: item.id }, data: { status: "CANCELLED" } });
      await tx.orderEvent.create({
        data: {
          orderId: item.order.id,
          actorRole: "SYSTEM",
          eventType: "SELLER_ORDER_ACCEPTANCE_TIMEOUT",
          note: "The 24-hour seller acceptance deadline elapsed; reserved stock was restored automatically.",
          metadata: { sellerOrderId: item.id, sellerStoreName: item.seller.storeName },
        },
      });

      const siblings = await tx.sellerOrder.findMany({
        where: { orderId: item.order.id },
        select: { status: true },
      });
      if (siblings.every((row) => row.status !== "PENDING_ACCEPTANCE")) {
        const hasAcceptedWork = siblings.some((row) => ["ACCEPTED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(row.status));
        await tx.order.update({
          where: { id: item.order.id },
          data: { status: hasAcceptedWork ? "PROCESSING" : "CANCELLED" },
        });
      }

      await tx.adminNotification.create({
        data: {
          type: "SELLER_ORDER_ACCEPTANCE_TIMEOUT",
          title: "Seller order automatically cancelled",
          message: `Seller order ${item.id} for ${item.seller.storeName} passed its 24-hour acceptance deadline. Stock was restored.`,
          targetType: "SELLER_ORDER",
          targetId: item.id,
          dedupeKey: `seller-order-expiry:${item.id}`,
        },
      });
    }, { isolationLevel: "Serializable" });
  }
}
