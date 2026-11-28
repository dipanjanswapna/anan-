import { IsString, Length, Matches } from "class-validator";

export class CheckoutDto {
  @IsString()
  @Length(8, 100)
  @Matches(/^[A-Za-z0-9_-]+$/)
  idempotencyKey!: string;

  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Za-z0-9_-]+$/)
  addressId!: string;
}
