import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { ProductImagesService } from "./product-images.service";

@Controller()
export class ProductImagesController {
  constructor(private readonly images: ProductImagesService) {}

  @Post("sellers/me/products/:productId/images/upload")
  createUpload(
    @Headers("authorization") authorization: string | undefined,
    @Param("productId") productId: string,
    @Body() input: { contentType: string; sizeBytes: number; altText: string },
  ) {
    return this.images.createUpload(authorization, productId, input);
  }

  @Post("sellers/me/products/:productId/images/complete")
  completeUpload(
    @Headers("authorization") authorization: string | undefined,
    @Param("productId") productId: string,
    @Body() input: { storageKey: string; contentType: string; sizeBytes: number; altText: string },
  ) {
    return this.images.completeUpload(authorization, productId, input);
  }

  @Get("sellers/me/products/:productId/images")
  listSellerImages(
    @Headers("authorization") authorization: string | undefined,
    @Param("productId") productId: string,
  ) {
    return this.images.listSellerImages(authorization, productId);
  }

  @Get("admin/product-images")
  listForReview(@Headers("authorization") authorization?: string, @Query("status") status?: string) {
    return this.images.listForReview(authorization, status);
  }

  @Patch("admin/product-images/:id/review")
  review(
    @Headers("authorization") authorization: string | undefined,
    @Param("id") id: string,
    @Body() input: { action: "APPROVE" | "REJECT"; notes?: string },
  ) {
    return this.images.review(authorization, id, input);
  }
}
