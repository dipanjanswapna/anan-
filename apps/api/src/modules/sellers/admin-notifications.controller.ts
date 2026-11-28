import { Controller, Get, Headers, Param, Patch, Query } from "@nestjs/common";
import { AdminNotificationsService } from "./admin-notifications.service";

@Controller("admin/notifications")
export class AdminNotificationsController {
  constructor(private readonly notifications: AdminNotificationsService) {}

  @Get()
  list(@Headers("authorization") authorization?: string) {
    return this.notifications.list(authorization);
  }

  @Get("orders")
  monitorOrders(@Headers("authorization") authorization?: string, @Query("status") status?: string) {
    return this.notifications.monitorOrders(authorization, status);
  }

  @Patch(":id/read")
  markRead(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return this.notifications.markRead(authorization, id);
  }
}
