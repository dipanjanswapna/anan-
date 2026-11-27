import { IsEmail, IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSellerApplicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  contactName!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsPhoneNumber("BD")
  phone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  storeName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  businessType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
