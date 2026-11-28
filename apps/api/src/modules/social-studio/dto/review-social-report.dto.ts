import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewSocialReportDto {
  @IsIn(["DISMISS", "HIDE_POST"]) action!: "DISMISS" | "HIDE_POST";
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
