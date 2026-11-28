import { IsBoolean, IsEmail, IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateCustomerAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipientName?: string;

  @IsOptional()
  @IsPhoneNumber("BD")
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  division?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  district?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  upazila?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  area?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  addressLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
