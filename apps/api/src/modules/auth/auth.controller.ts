import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

type AuthenticatedRequest = Request & { user: { userId: string; role: string }; cookies?: Record<string, string> };

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<string>("NODE_ENV") === "production",
      sameSite: "lax" as const,
      path: "/api/v1/auth",
      maxAge: this.config.get<number>("AUTH_REFRESH_TTL_DAYS", 30) * 86400000,
    };
  }

  private setRefreshCookie(response: Response, token: string) {
    response.cookie(AuthService.refreshCookieName, token, this.cookieOptions());
  }

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(dto);
    this.setRefreshCookie(response, result.refreshToken);
    const { refreshToken: _refreshToken, ...safe } = result;
    return safe;
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto);
    this.setRefreshCookie(response, result.refreshToken);
    const { refreshToken: _refreshToken, ...safe } = result;
    return safe;
  }

  @Post("refresh")
  async refresh(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const token = request.cookies?.[AuthService.refreshCookieName];
    if (!token) {
      const raw = request.headers.cookie?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${AuthService.refreshCookieName}=`));
      const value = raw?.slice(raw.indexOf("=") + 1);
      if (!value) return this.auth.refresh("");
      const result = await this.auth.refresh(decodeURIComponent(value));
      this.setRefreshCookie(response, result.refreshToken);
      const { refreshToken: _refreshToken, ...safe } = result;
      return safe;
    }
    const result = await this.auth.refresh(token);
    this.setRefreshCookie(response, result.refreshToken);
    const { refreshToken: _refreshToken, ...safe } = result;
    return safe;
  }

  @Post("logout")
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.[AuthService.refreshCookieName]);
    response.clearCookie(AuthService.refreshCookieName, { ...this.cookieOptions(), maxAge: undefined });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.getProfile(request.user.userId);
  }
}
