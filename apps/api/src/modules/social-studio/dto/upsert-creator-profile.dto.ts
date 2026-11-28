import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class UpsertCreatorProfileDto {
  @IsString() @Matches(/^[a-z0-9][a-z0-9_]{2,29}$/) handle!: string;
  @IsString() @MaxLength(80) displayName!: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(/^https:\/\//i) avatarUrl?: string;
}
