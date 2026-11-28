import { IsBoolean, IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCustomerAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  label?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipientName!: string;

  @IsPhoneNumber("BD")
  phone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  division!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  district!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  upazila!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  area!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  addressLine!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
