import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateProductDto, SellerProductQueryDto, UpdateProductDto } from "./dto/product.dto";
import { SellerProductsService } from "./seller-products.service";

@Controller("sellers/me/products")
export class SellerProductsController {
  constructor(private readonly products: SellerProductsService) {}

  @Get()
  list(@Headers("authorization") authorization?: string, @Query() query?: SellerProductQueryDto) {
    return this.products.list(authorization, query ?? new SellerProductQueryDto());
  }

  @Post()
  create(@Headers("authorization") authorization: string | undefined, @Body() input: CreateProductDto) {
    return this.products.create(authorization, input);
  }

  @Get(":productId")
  get(@Headers("authorization") authorization: string | undefined, @Param("productId") productId: string) {
    return this.products.get(authorization, productId);
  }

  @Patch(":productId")
  update(
    @Headers("authorization") authorization: string | undefined,
    @Param("productId") productId: string,
    @Body() input: UpdateProductDto,
  ) {
    return this.products.update(authorization, productId, input);
  }

  @Post(":productId/submit")
  submit(@Headers("authorization") authorization: string | undefined, @Param("productId") productId: string) {
    return this.products.submit(authorization, productId);
  }

  @Post(":productId/archive")
  archive(@Headers("authorization") authorization: string | undefined, @Param("productId") productId: string) {
    return this.products.archive(authorization, productId);
  }

  @Post(":productId/restore")
  restore(@Headers("authorization") authorization: string | undefined, @Param("productId") productId: string) {
    return this.products.restore(authorization, productId);
  }
}
