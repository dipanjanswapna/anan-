import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { OtpService } from "./otp.service";

@Controller("auth/otp")
export class AuthController {
  constructor(private readonly otp: OtpService) {}

  @Post("request")
  @HttpCode(HttpStatus.ACCEPTED)
  request(@Body() input: RequestOtpDto) {
    return this.otp.request(input.phone, input.purpose);
  }

  @Post("verify")
  @HttpCode(HttpStatus.OK)
  verify(@Body() input: VerifyOtpDto) {
    return this.otp.verify(input.phone, input.purpose, input.code);
  }
}
