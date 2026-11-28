import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { SellerFinanceService } from "./seller-finance.service";

@Controller("admin/seller-finance")
export class AdminSellerFinanceController {
  constructor(private readonly finance: SellerFinanceService) {}

  @Get("payout-requests")
  list(@Headers("authorization") authorization?: string, @Query("status") status?: string) {
    return this.finance.adminListPayouts(authorization, status);
  }

  @Patch("payout-requests/:id")
  review(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() input: { action: "APPROVE" | "REJECT" | "PAID"; notes?: string; payoutReference?: string }) {
    return this.finance.reviewPayout(authorization, id, input);
  }

  @Post("seller-orders/:id/release")
  release(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    return this.finance.releaseDeliveredOrder(authorization, id);
  }
}
