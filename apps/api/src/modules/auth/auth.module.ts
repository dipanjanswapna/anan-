import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { OtpDeliveryService } from "./otp-delivery.service";
import { OtpService } from "./otp.service";

@Module({
  controllers: [AuthController],
  providers: [OtpDeliveryService, OtpService],
})
export class AuthModule {}
