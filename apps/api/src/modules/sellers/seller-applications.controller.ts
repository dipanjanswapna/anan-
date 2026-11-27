import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { CreateSellerApplicationDto } from "./dto/create-seller-application.dto";
import { SellerApplicationsService } from "./seller-applications.service";

@Controller("seller-applications")
export class SellerApplicationsController {
  constructor(private readonly applications: SellerApplicationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() input: CreateSellerApplicationDto) {
    return this.applications.create(input);
  }
}
