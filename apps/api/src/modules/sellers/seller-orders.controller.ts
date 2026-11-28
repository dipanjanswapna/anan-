import { Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { SellerOrdersService } from "./seller-orders.service";

@Controller("sellers/me")
export class SellerOrdersController {
  constructor(private readonly orders: SellerOrdersService) {}

  @Get("dashboard")
  dashboard(@Headers("authorization") authorization?: string) {
    return this.orders.dashboard(authorization);
  }

  @Post("orders/:id/accept")
  accept(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return this.orders.changeOrderStatus(authorization, id, "accept");
  }

  @Post("orders/:id/reject")
  reject(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return this.orders.changeOrderStatus(authorization, id, "reject");
  }
}
