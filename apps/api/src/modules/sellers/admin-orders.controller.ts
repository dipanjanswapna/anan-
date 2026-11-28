import { Controller, Get, Headers, Query } from "@nestjs/common";
import { AdminNotificationsService } from "./admin-notifications.service";

@Controller("admin/orders")
export class AdminOrdersController {
  constructor(private readonly notifications: AdminNotificationsService) {}

  @Get()
  monitor(@Headers("authorization") authorization?: string, @Query("status") status?: string) {
    return this.notifications.monitorOrders(authorization, status);
  }
}
