import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { SellerFinanceService } from "./seller-finance.service";

@Controller("sellers/me/finance")
export class SellerFinanceController {
  constructor(private readonly finance: SellerFinanceService) {}

  @Get()
  summary(@Headers("authorization") authorization?: string) {
    return this.finance.sellerSummary(authorization);
  }

  @Post("payout-requests")
  request(@Headers("authorization") authorization: string | undefined, @Body() input: { payoutMethod: string; payoutDestination: string }) {
    return this.finance.requestPayout(authorization, input);
  }
}
