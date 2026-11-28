import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReportSocialPostDto {
  @IsIn(["SPAM", "HARASSMENT", "HATE", "VIOLENCE", "SEXUAL_CONTENT", "MISINFORMATION", "COPYRIGHT", "OTHER"])
  reason!: "SPAM" | "HARASSMENT" | "HATE" | "VIOLENCE" | "SEXUAL_CONTENT" | "MISINFORMATION" | "COPYRIGHT" | "OTHER";

  @IsOptional() @IsString() @MaxLength(1000) details?: string;
}
