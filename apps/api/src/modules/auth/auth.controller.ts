import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { OtpService } from "./otp.service";
import { SessionService } from "./session.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly otp: OtpService, private readonly sessions: SessionService) {}

  @Post("otp/request")
  @HttpCode(HttpStatus.ACCEPTED)
  request(@Body() input: RequestOtpDto) {
    return this.otp.request(input.phone, input.purpose);
  }

  @Post("otp/verify")
  @HttpCode(HttpStatus.OK)
  verify(@Body() input: VerifyOtpDto) {
    return this.otp.verify(input.phone, input.purpose, input.code);
  }

  @Get("session")
  current(@Headers("authorization") authorization?: string) {
    return this.sessions.current(authorization);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Headers("authorization") authorization?: string) {
    return this.sessions.revoke(authorization);
  }
}
