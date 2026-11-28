import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { CartItemDto } from "./dto/cart-item.dto";
import { CheckoutDto } from "./dto/checkout.dto";

@Injectable()
export class CustomerCommerceService {
  constructor(private readonly prisma: PrismaService) {}

  private async customerId(authorization?: string): Promise<string> {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("A valid customer session is required.");
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() }, user: { role: "CUSTOMER", isActive: true } },
      select: { id: true, userId: true },
    });
    if (!session) throw new UnauthorizedException("Your session has expired. Please sign in again.");
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    return session.userId;
  }

  private async eligibleProduct(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: "APPROVED", seller: { status: "APPROVED" }, category: { isActive: true } },
      select: { id: true, nameEn: true, nameBn: true, slug: true, pricePaisa: true, stockOnHand: true, seller: { select: { storeName: true, storeSlug: true } } },
    });
    if (!product) throw new NotFoundException("This product is not available.");
    return product;
  }

  async getCart(authorization?: string) {
    const userId = await this.customerId(authorization);
    const items = await this.prisma.cartItem.findMany({
      where: { userId }, orderBy: { updatedAt: "desc" },
      include: { product: { select: { id: true, nameEn: true, nameBn: true, slug: true, pricePaisa: true, stockOnHand: true, status: true, seller: { select: { status: true, storeName: true, storeSlug: true } }, category: { select: { isActive: true } } } } },
    });
    const available = items.filter((item) => item.product.status === "APPROVED" && item.product.seller.status === "APPROVED" && item.product.category.isActive);
    const subtotalPaisa = available.reduce((sum, item) => sum + item.product.pricePaisa * BigInt(item.quantity), 0n);
    return { items: available.map(({ product, ...item }) => ({ ...item, product: { id: product.id, nameEn: product.nameEn, nameBn: product.nameBn, slug: product.slug, pricePaisa: product.pricePaisa.toString(), stockOnHand: product.stockOnHand, seller: { storeName: product.seller.storeName, storeSlug: product.seller.storeSlug } }, available: product.stockOnHand >= item.quantity, maxQuantity: product.stockOnHand })), subtotalPaisa: subtotalPaisa.toString(), itemCount: available.reduce((sum, item) => sum + item.quantity, 0) };
  }

  async addCartItem(authorization: string | undefined, productId: string, input: CartItemDto) {
    const userId = await this.customerId(authorization);
    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, status: "APPROVED", seller: { status: "APPROVED" }, category: { isActive: true } },
        select: { stockOnHand: true },
      });
      if (!product) throw new NotFoundException("This product is not available.");
      const existing = await tx.cartItem.findUnique({ where: { userId_productId: { userId, productId } } });
      const quantity = (existing?.quantity ?? 0) + input.quantity;
      if (product.stockOnHand < quantity) throw new BadRequestException("Requested quantity exceeds available stock.");
      return tx.cartItem.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, quantity: input.quantity },
        update: { quantity },
      });
    }, { isolationLevel: "Serializable" });
    return { item: result, message: "Added to your cart." };
  }

  async updateCartItem(authorization: string | undefined, productId: string, input: CartItemDto) {
    const userId = await this.customerId(authorization);
    const item = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, status: "APPROVED", seller: { status: "APPROVED" }, category: { isActive: true } },
        select: { stockOnHand: true },
      });
      if (!product) throw new NotFoundException("This product is not available.");
      if (input.quantity > product.stockOnHand) throw new BadRequestException("Requested quantity exceeds available stock.");
      const existing = await tx.cartItem.findUnique({ where: { userId_productId: { userId, productId } } });
      if (!existing) throw new NotFoundException("Cart item not found.");
      return tx.cartItem.update({ where: { id: existing.id }, data: { quantity: input.quantity } });
    }, { isolationLevel: "Serializable" });
    return { item, message: "Cart quantity updated." };
  }

  async removeCartItem(authorization: string | undefined, productId: string) {
    const userId = await this.customerId(authorization);
    const result = await this.prisma.cartItem.deleteMany({ where: { userId, productId } });
    return { removed: result.count === 1, message: "Cart item removed." };
  }

  async getWishlist(authorization?: string) {
    const userId = await this.customerId(authorization);
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId, product: { status: "APPROVED", seller: { status: "APPROVED" }, category: { isActive: true } } },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, nameEn: true, nameBn: true, slug: true, pricePaisa: true, stockOnHand: true, seller: { select: { storeName: true, storeSlug: true } } } } },
    });
    return { items: items.map(({ product, ...item }) => ({ ...item, product: { ...product, pricePaisa: product.pricePaisa.toString() } })) };
  }

  async addWishlistItem(authorization: string | undefined, productId: string) {
    const userId = await this.customerId(authorization);
    await this.eligibleProduct(productId);
    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId }, update: {},
    });
    return { saved: true, message: "Added to your wishlist." };
  }

  async removeWishlistItem(authorization: string | undefined, productId: string) {
    const userId = await this.customerId(authorization);
    const result = await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return { removed: result.count === 1, message: "Removed from your wishlist." };
  }

  async checkout(authorization: string | undefined, input: CheckoutDto) {
    const userId = await this.customerId(authorization);
    const existing = await this.prisma.order.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
      include: { sellerOrders: { include: { items: true } } },
    });
    if (existing) return { order: this.serializeOrder(existing), replayed: true };

    try {
      const order = await this.prisma.$transaction(async (tx) => {
        const replay = await tx.order.findUnique({
          where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
          include: { sellerOrders: { include: { items: true } } },
        });
        if (replay) return replay;

        const address = await tx.customerAddress.findFirst({ where: { id: input.addressId, userId } });
        if (!address) throw new NotFoundException("Please select one of your saved delivery addresses.");
        const cart = await tx.cartItem.findMany({
          where: { userId },
          include: { product: { include: { seller: true, category: true } } },
          orderBy: { createdAt: "asc" },
        });
        if (!cart.length) throw new BadRequestException("Your cart is empty.");

        let subtotalPaisa = 0n;
        const groups = new Map<string, { sellerId: string; subtotalPaisa: bigint; lines: Array<{ productId: string; productNameEn: string; productNameBn: string | null; quantity: number; unitPricePaisa: bigint; lineTotalPaisa: bigint }> }>();
        for (const item of cart) {
          const product = item.product;
          if (product.status !== "APPROVED" || product.seller.status !== "APPROVED" || !product.category.isActive) {
            throw new BadRequestException(`"${product.nameEn}" is no longer available. Remove it from your cart and try again.`);
          }
          if (product.stockOnHand < item.quantity) {
            throw new BadRequestException(`Insufficient stock for "${product.nameEn}". Please update your cart.`);
          }
          const lineTotalPaisa = product.pricePaisa * BigInt(item.quantity);
          subtotalPaisa += lineTotalPaisa;
          const group = groups.get(product.sellerId) ?? { sellerId: product.sellerId, subtotalPaisa: 0n, lines: [] };
          group.subtotalPaisa += lineTotalPaisa;
          group.lines.push({
            productId: product.id,
            productNameEn: product.nameEn,
            productNameBn: product.nameBn,
            quantity: item.quantity,
            unitPricePaisa: product.pricePaisa,
            lineTotalPaisa,
          });
          groups.set(product.sellerId, group);
        }

        const deliveryFeePaisa = 0n;
        const created = await tx.order.create({
          data: {
            userId,
            idempotencyKey: input.idempotencyKey,
            status: "PENDING_SELLER_ACCEPTANCE",
            paymentMethod: "CASH_ON_DELIVERY",
            paymentStatus: "UNPAID",
            subtotalPaisa,
            deliveryFeePaisa,
            totalPaisa: subtotalPaisa + deliveryFeePaisa,
            addressSnapshot: {
              recipientName: address.recipientName,
              phone: address.phone,
              division: address.division,
              district: address.district,
              upazila: address.upazila,
              area: address.area,
              addressLine: address.addressLine,
              postalCode: address.postalCode,
              label: address.label,
            },
          },
        });

        for (const group of groups.values()) {
          const sellerOrder = await tx.sellerOrder.create({
            data: { orderId: created.id, sellerId: group.sellerId, subtotalPaisa: group.subtotalPaisa, acceptanceDeadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          });
          await tx.orderItem.createMany({
            data: group.lines.map((line) => ({ ...line, orderId: created.id, sellerOrderId: sellerOrder.id })),
          });
        }

        for (const item of cart) {
          const reserved = await tx.product.updateMany({
            where: {
              id: item.productId,
              status: "APPROVED",
              stockOnHand: { gte: item.quantity },
              seller: { status: "APPROVED" },
              category: { isActive: true },
            },
            data: { stockOnHand: { decrement: item.quantity } },
          });
          if (reserved.count !== 1) throw new BadRequestException("Stock changed while placing your order. Please review your cart.");
        }

        await tx.cartItem.deleteMany({ where: { userId } });
        return tx.order.findUniqueOrThrow({
          where: { id: created.id },
          include: { sellerOrders: { include: { items: true } } },
        });
      }, { isolationLevel: "Serializable" });

      return { order: this.serializeOrder(order), replayed: false, deliveryFeeNotice: "Delivery pricing is not configured yet; this release applies ৳0 delivery fee. Confirm delivery charges before production launch." };
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        const replay = await this.prisma.order.findUnique({
          where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
          include: { sellerOrders: { include: { items: true } } },
        });
        if (replay) return { order: this.serializeOrder(replay), replayed: true };
      }
      throw error;
    }
  }

  private serializeOrder<T extends { subtotalPaisa: bigint; deliveryFeePaisa: bigint; totalPaisa?: bigint; sellerOrders: Array<{ subtotalPaisa: bigint; deliveryFeePaisa: bigint; items: Array<{ unitPricePaisa: bigint; lineTotalPaisa: bigint }> }> }>(order: T) {
    return {
      ...order,
      subtotalPaisa: order.subtotalPaisa.toString(),
      deliveryFeePaisa: order.deliveryFeePaisa.toString(),
      ...("totalPaisa" in order ? { totalPaisa: order.totalPaisa?.toString() } : {}),
      sellerOrders: order.sellerOrders.map((sellerOrder) => ({
        ...sellerOrder,
        subtotalPaisa: sellerOrder.subtotalPaisa.toString(),
        deliveryFeePaisa: sellerOrder.deliveryFeePaisa.toString(),
        items: sellerOrder.items.map((item) => ({ ...item, unitPricePaisa: item.unitPricePaisa.toString(), lineTotalPaisa: item.lineTotalPaisa.toString() })),
      })),
    };
  }


  async cancelOrder(authorization: string | undefined, id: string) {
    const userId = await this.customerId(authorization);
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, userId },
        include: { sellerOrders: { include: { items: true } } },
      });
      if (!order) throw new NotFoundException("Order not found.");
      if (order.status === "CANCELLED") return { cancelled: true, replayed: true, message: "This order was already cancelled." };
      if (order.status !== "PENDING_SELLER_ACCEPTANCE" || order.sellerOrders.some((item) => item.status !== "PENDING_ACCEPTANCE")) {
        throw new BadRequestException("This order can no longer be cancelled online. Please contact customer support.");
      }

      for (const sellerOrder of order.sellerOrders) {
        for (const item of sellerOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockOnHand: { increment: item.quantity } },
          });
        }
      }
      await tx.sellerOrder.updateMany({
        where: { orderId: order.id, status: "PENDING_ACCEPTANCE" },
        data: { status: "CANCELLED" },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          actorUserId: userId,
          actorRole: "CUSTOMER",
          eventType: "CUSTOMER_CANCELLED",
          note: "Customer cancelled before seller acceptance.",
          metadata: { restoredStockLines: order.sellerOrders.reduce((n, sellerOrder) => n + sellerOrder.items.length, 0) },
        },
      });
      return { cancelled: true, replayed: false, message: "Order cancelled and reserved stock restored." };
    }, { isolationLevel: "Serializable" });
  }

  async listOrders(authorization?: string) {
    const userId = await this.customerId(authorization);
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { sellerOrders: { include: { items: true } } },
    });
    return { orders: orders.map((order) => this.serializeOrder(order)) };
  }

  async getOrder(authorization: string | undefined, id: string) {
    const userId = await this.customerId(authorization);
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { sellerOrders: { include: { items: true, shipment: { include: { events: { orderBy: { occurredAt: "asc" } } } } } },
    });
    if (!order) throw new NotFoundException("Order not found.");
    return { order: this.serializeOrder(order) };
  }

}
