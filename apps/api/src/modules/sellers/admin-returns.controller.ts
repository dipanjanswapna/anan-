import { Body, Controller, Get, Headers, Param, Patch, Query } from "@nestjs/common";
import { AdminNotificationsService } from "./admin-notifications.service";

@Controller("admin/returns")
export class AdminReturnsController {
  constructor(private readonly admin: AdminNotificationsService) {}

  @Get()
  list(@Headers("authorization") authorization?: string, @Query("status") status?: string) {
    return this.admin.listReturns(authorization, status);
  }

  @Patch(":id/review")
  review(
    @Headers("authorization") authorization: string | undefined,
    @Param("id") id: string,
    @Body() input: { action: "APPROVE" | "REJECT" | "ITEM_RECEIVED" | "REFUNDED"; notes?: string; refundReference?: string; refundMethod?: string; refundAmountPaisa?: string; confirmManualRefund?: boolean },
  ) {
    return this.admin.reviewReturn(authorization, id, input);
  }
}
