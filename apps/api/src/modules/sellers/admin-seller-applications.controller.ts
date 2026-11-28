import { Body, Controller, Get, Headers, Param, Patch, Query } from "@nestjs/common";
import { ReviewSellerApplicationDto } from "./dto/review-seller-application.dto";
import { AdminSellerApplicationsService } from "./admin-seller-applications.service";

@Controller("admin/seller-applications")
export class AdminSellerApplicationsController {
  constructor(private readonly applications: AdminSellerApplicationsService) {}

  @Get()
  list(@Headers("authorization") authorization?: string, @Query("status") status?: string) {
    return this.applications.list(authorization, status);
  }

  @Patch(":id/review")
  review(@Headers("authorization") authorization: string | undefined, @Param("id") id: string, @Body() input: ReviewSellerApplicationDto) {
    return this.applications.review(authorization, id, input);
  }
}
