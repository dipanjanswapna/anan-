import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from "class-validator";

export const PRODUCT_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "ARCHIVED"] as const;

export class SellerProductQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: (typeof PRODUCT_STATUSES)[number];

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
  limit = 20;
}

export class CreateProductDto {
  @IsString()
  @Length(3, 160)
  nameEn!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nameBn?: string;

  @IsString()
  @Length(1, 64)
  categoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionBn?: string;

  @IsInt()
  @Min(100)
  @Max(1_000_000_000)
  pricePaisa!: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(1_000_000_000)
  compareAtPricePaisa?: number | null;

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stockOnHand!: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(3, 160)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nameBn?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionBn?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(1_000_000_000)
  pricePaisa?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(1_000_000_000)
  compareAtPricePaisa?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stockOnHand?: number;
}

export class ReviewProductDto {
  @IsIn(["APPROVE", "REJECT"])
  action!: "APPROVE" | "REJECT";

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AdminProductQueryDto extends SellerProductQueryDto {
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  declare status?: (typeof PRODUCT_STATUSES)[number];
}
