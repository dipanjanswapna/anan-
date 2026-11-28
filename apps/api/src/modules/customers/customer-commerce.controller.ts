import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { CartItemDto } from "./dto/cart-item.dto";
import { CustomerCommerceService } from "./customer-commerce.service";
import { CheckoutDto } from "./dto/checkout.dto";

@Controller("customers/me")
export class CustomerCommerceController {
  constructor(private readonly commerce: CustomerCommerceService) {}

  @Post("checkout")
  checkout(@Headers("authorization") authorization: string | undefined, @Body() input: CheckoutDto) { return this.commerce.checkout(authorization, input); }

  @Post("orders/:id/cancel")
  cancelOrder(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) { return this.commerce.cancelOrder(authorization, id); }

  @Get("orders")
  listOrders(@Headers("authorization") authorization?: string) { return this.commerce.listOrders(authorization); }

  @Get("orders/:id")
  getOrder(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) { return this.commerce.getOrder(authorization, id); }

  @Get("cart")
  getCart(@Headers("authorization") authorization?: string) { return this.commerce.getCart(authorization); }

  @Post("cart/items/:productId")
  addCartItem(@Headers("authorization") authorization: string | undefined, @Param("productId") productId: string, @Body() input: CartItemDto) {
    return this.commerce.addCartItem(authorization, productId, input);
  }

  @Patch("cart/items/:productId")
  updateCartItem(@Headers("authorization") authorization: string | undefined, @Param("productId") productId: string, @Body() input: CartItemDto) {
    return this.commerce.updateCartItem(authorization, productId, input);
  }

  @Delete("cart/items/:productId")
  removeCartItem(@Headers("authorization") authorization: string | undefined, @Param("productId") productId: string) {
    return this.commerce.removeCartItem(authorization, productId);
  }

  @Get("wishlist")
  getWishlist(@Headers("authorization") authorization?: string) { return this.commerce.getWishlist(authorization); }

  @Post("wishlist/:productId")
  addWishlistItem(@Headers("authorization") authorization: string | undefined, @Param("productId") productId: string) {
    return this.commerce.addWishlistItem(authorization, productId);
  }

  @Delete("wishlist/:productId")
  removeWishlistItem(@Headers("authorization") authorization: string | undefined, @Param("productId") productId: string) {
    return this.commerce.removeWishlistItem(authorization, productId);
  }
}
