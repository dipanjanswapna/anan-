import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { SellerOrdersService } from "./seller-orders.service";

@Controller("sellers/me")
export class SellerOrdersController {
  constructor(private readonly orders: SellerOrdersService) {}

  @Get("returns")\n  listReturnRequests(@Headers("authorization") authorization?: string) { return this.orders.listReturnRequests(authorization); }\n\n  @Patch("returns/:id")\n  reviewReturnRequest(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() input: { decision: "APPROVED" | "REJECTED"; notes?: string }) { return this.orders.reviewReturnRequest(authorization, id, input); }\n\n  @Get("dashboard")
  dashboard(@Headers("authorization") authorization?: string) {
    return this.orders.dashboard(authorization);
  }

  @Post("orders/:id/shipment")
  upsertShipment(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() input: { courierName: string; trackingNumber: string; trackingUrl?: string; estimatedDeliveryAt?: string }) {
    return this.orders.upsertShipment(authorization, id, input);
  }

  @Patch("orders/:id/shipment/status")
  updateShipmentStatus(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() input: { status: "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "DELIVERY_FAILED" | "RETURNED"; description?: string }) {
    return this.orders.updateShipmentStatus(authorization, id, input);
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
