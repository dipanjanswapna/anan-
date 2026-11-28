import { Body, Controller, Get, Headers, Param, Patch, Query } from "@nestjs/common";
import { AdminProductQueryDto, ReviewProductDto } from "./dto/product.dto";
import { AdminProductsService } from "./admin-products.service";

@Controller("admin/products")
export class AdminProductsController {
  constructor(private readonly products: AdminProductsService) {}

  @Get()
  list(@Headers("authorization") authorization?: string, @Query() query?: AdminProductQueryDto) {
    return this.products.list(authorization, query ?? new AdminProductQueryDto());
  }

  @Patch(":productId/review")
  review(
    @Headers("authorization") authorization: string | undefined,
    @Param("productId") productId: string,
    @Body() input: ReviewProductDto,
  ) {
    return this.products.review(authorization, productId, input);
  }
}
