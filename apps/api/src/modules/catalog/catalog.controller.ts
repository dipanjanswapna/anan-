import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogQueryDto } from "./dto/catalog-query.dto";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  getCategories() {
    return this.catalog.getCategories();
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    return this.catalog.getProductBySlug(slug);
  }

  @Get("stores/:storeSlug")
  getStorefront(@Param("storeSlug") storeSlug: string, @Query() query: CatalogQueryDto) {
    return this.catalog.getStorefront(storeSlug, query);
  }

  @Get("products")
  getProducts(@Query() query: CatalogQueryDto) {
    return this.catalog.getProducts(query);
  }
}
