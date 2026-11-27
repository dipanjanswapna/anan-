import { Controller, Get, Query } from "@nestjs/common";
import { CatalogQueryDto } from "./dto/catalog-query.dto";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  getCategories() {
    return this.catalog.getCategories();
  }

  @Get("products")
  getProducts(@Query() query: CatalogQueryDto) {
    return this.catalog.getProducts(query);
  }
}
