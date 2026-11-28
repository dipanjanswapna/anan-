import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
export class ReviewSocialCommentDto {
  @IsIn(["APPROVE", "HIDE", "REMOVE"]) action!: "APPROVE" | "HIDE" | "REMOVE";
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}