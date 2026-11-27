import { IsEnum, IsPhoneNumber, Matches } from "class-validator";
import { OtpPurpose } from "@prisma/client";

export class VerifyOtpDto {
  @IsPhoneNumber("BD")
  phone!: string;

  @Matches(/^\d{6}$/)
  code!: string;

  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}
