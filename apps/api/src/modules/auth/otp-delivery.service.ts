import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OtpDeliveryService {
  constructor(private readonly config: ConfigService) {}

  async send(phone: string, code: string): Promise<void> {
    const endpoint = this.config.get<string>("OTP_DELIVERY_URL");
    const token = this.config.get<string>("OTP_DELIVERY_TOKEN");
    if (!endpoint || !token) {
      throw new ServiceUnavailableException("Phone verification is not configured yet.");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        message: `Your ANAN verification code is ${code}. It expires in 5 minutes.`,
      }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);

    if (!response?.ok) {
      throw new ServiceUnavailableException("Unable to deliver the verification code. Please try again later.");
    }
  }
}
