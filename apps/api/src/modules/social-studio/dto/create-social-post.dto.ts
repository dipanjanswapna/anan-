import { IsIn, IsOptional, IsString, MaxLength, Matches } from "class-validator";

export class CreateSocialPostDto {
  @IsIn(["IMAGE", "VIDEO"]) mediaType!: "IMAGE" | "VIDEO";
  @IsString() @MaxLength(2048) @Matches(/^https:\/\//i) mediaUrl!: string;
  @IsOptional() @IsString() @MaxLength(2000) caption?: string;
}
