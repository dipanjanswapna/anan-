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
import { ProductImagesController } from "./product-images.controller";
import { ProductImagesService } from "./product-images.service";
import { SellerProductsController } from "./seller-products.controller";
import { SellerProductsService } from "./seller-products.service";
import { AdminProductsController } from "./admin-products.controller";
import { AdminProductsService } from "./admin-products.service";

@Module({
  controllers: [
    SellerApplicationsController,
    SellerOrdersController,
    AdminSellerApplicationsController,
    AdminNotificationsController,
    AdminOrdersController,
    AdminReturnsController,
    ProductImagesController,
    SellerProductsController,
    AdminProductsController,
  ],
  providers: [
    SellerApplicationsService,
    SellerOrdersService,
    AdminSellerApplicationsService,
    AdminNotificationsService,
    SellerOrderExpiryWorker,
    ProductImagesService,
    SellerProductsService,
    AdminProductsService,
  ],
})
export class SellersModule {}
