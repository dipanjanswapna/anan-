import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return {
      status: "ok",
      service: "anan-api",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ready",
        service: "anan-api",
        dependencies: { database: "ok" },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: "not_ready",
        service: "anan-api",
        dependencies: { database: "unavailable" },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
