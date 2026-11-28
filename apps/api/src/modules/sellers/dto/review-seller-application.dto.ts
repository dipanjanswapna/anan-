import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewSellerApplicationDto {
  @IsIn(["UNDER_REVIEW", "APPROVED", "REJECTED"])
  action!: "UNDER_REVIEW" | "APPROVED" | "REJECTED";

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
