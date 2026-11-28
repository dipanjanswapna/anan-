import { Module } from "@nestjs/common";
import { SellerApplicationsController } from "./seller-applications.controller";
import { SellerApplicationsService } from "./seller-applications.service";
import { SellerOrdersController } from "./seller-orders.controller";
import { SellerOrdersService } from "./seller-orders.service";

@Module({
  controllers: [SellerApplicationsController, SellerOrdersController],
  providers: [SellerApplicationsService, SellerOrdersService],
})
export class SellersModule {}
