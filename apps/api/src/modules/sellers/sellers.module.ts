import { Module } from "@nestjs/common";
import { SellerApplicationsController } from "./seller-applications.controller";
import { SellerApplicationsService } from "./seller-applications.service";
import { SellerOrdersController } from "./seller-orders.controller";
import { SellerOrdersService } from "./seller-orders.service";
import { AdminSellerApplicationsController } from "./admin-seller-applications.controller";
import { AdminSellerApplicationsService } from "./admin-seller-applications.service";
import { SellerOrderExpiryWorker } from "./seller-order-expiry.worker";
import { AdminNotificationsController } from "./admin-notifications.controller";
import { AdminNotificationsService } from "./admin-notifications.service";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminReturnsController } from "./admin-returns.controller";
import { SellerFinanceController } from "./seller-finance.controller";
import { AdminSellerFinanceController } from "./admin-seller-finance.controller";
import { SellerFinanceService } from "./seller-finance.service";

@Module({
  controllers: [SellerApplicationsController, SellerOrdersController, AdminSellerApplicationsController, AdminNotificationsController, AdminOrdersController, AdminReturnsController, SellerFinanceController, AdminSellerFinanceController],
  providers: [SellerApplicationsService, SellerOrdersService, AdminSellerApplicationsService, AdminNotificationsService, SellerOrderExpiryWorker, SellerFinanceService],
})
export class SellersModule {}
