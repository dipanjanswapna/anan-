import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class PrepareSocialMediaDto {
  @IsIn(["IMAGE", "VIDEO"]) mediaType!: "IMAGE" | "VIDEO";
  @IsString() @MaxLength(100) contentType!: string;
  @IsInt() @Min(1) @Max(104857600) sizeBytes!: number;
}

export class CompleteSocialMediaDto {
  @IsString() @MaxLength(300) storageKey!: string;
  @IsIn(["IMAGE", "VIDEO"]) mediaType!: "IMAGE" | "VIDEO";
  @IsString() @MaxLength(100) contentType!: string;
  @IsInt() @Min(1) @Max(104857600) sizeBytes!: number;
  @IsOptional() @IsString() @MaxLength(2000) caption?: string;
}
