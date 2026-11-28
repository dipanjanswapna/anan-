import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export const CATALOG_SORTS = ["newest", "price_asc", "price_desc", "name_asc"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export class CatalogQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  limit = 12;

  @IsOptional()
  @IsIn(CATALOG_SORTS)
  sort?: CatalogSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  maxPrice?: number;

  @IsOptional()
  @IsIn(["true", "false"])
  inStock?: "true" | "false";

  @IsOptional()
  @IsIn(["true", "false"])
  onSale?: "true" | "false";
}
