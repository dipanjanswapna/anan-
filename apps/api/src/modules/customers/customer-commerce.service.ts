import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { CartItemDto } from "./dto/cart-item.dto";

@Injectable()
export class CustomerCommerceService {
  constructor(private readonly prisma: PrismaService) {}

  private async customerId(authorization?: string): Promise<string> {
    const match = authorization?.match(/^Bearer\\s+([A-Za-z0-9_-]{40,})$/i);
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
    return { items: available.map(({ product, ...item }) => ({ ...item, product: { ...product, pricePaisa: product.pricePaisa.toString() }, available: product.stockOnHand >= item.quantity, maxQuantity: product.stockOnHand })), subtotalPaisa: subtotalPaisa.toString(), itemCount: available.reduce((sum, item) => sum + item.quantity, 0) };
  }

  async addCartItem(authorization: string | undefined, productId: string, input: CartItemDto) {
    const userId = await this.customerId(authorization);
    const product = await this.eligibleProduct(productId);
    const result = await this.prisma.$transaction(async (tx) => {
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
    const product = await this.eligibleProduct(productId);
    if (input.quantity > product.stockOnHand) throw new BadRequestException("Requested quantity exceeds available stock.");
    const existing = await this.prisma.cartItem.findUnique({ where: { userId_productId: { userId, productId } } });
    if (!existing) throw new NotFoundException("Cart item not found.");
    const item = await this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: input.quantity } });
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
}
