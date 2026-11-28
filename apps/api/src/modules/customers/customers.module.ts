import { Module } from "@nestjs/common";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";
import { CustomerCommerceController } from "./customer-commerce.controller";
import { CustomerCommerceService } from "./customer-commerce.service";

@Module({
  controllers: [CustomersController, CustomerCommerceController],
  providers: [CustomersService, CustomerCommerceService],
})
export class CustomersModule {}
