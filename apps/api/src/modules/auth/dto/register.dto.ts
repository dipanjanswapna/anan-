import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @ValidateIf((value: RegisterDto) => !value.phone)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ValidateIf((value: RegisterDto) => !value.email)
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  password!: string;
}
