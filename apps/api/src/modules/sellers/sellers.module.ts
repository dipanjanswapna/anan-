import { Module } from "@nestjs/common";
import { SellerApplicationsController } from "./seller-applications.controller";
import { SellerApplicationsService } from "./seller-applications.service";
import { SellerOrdersController } from "./seller-orders.controller";
import { SellerOrdersService } from "./seller-orders.service";
import { AdminSellerApplicationsController } from "./admin-seller-applications.controller";
import { AdminSellerApplicationsService } from "./admin-seller-applications.service";

@Module({
  controllers: [SellerApplicationsController, SellerOrdersController, AdminSellerApplicationsController],
  providers: [SellerApplicationsService, SellerOrdersService, AdminSellerApplicationsService],
})
export class SellersModule {}
