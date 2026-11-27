import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { PrismaModule } from "./database/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { SellersModule } from "./modules/sellers/sellers.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
        PORT: Joi.number().port().default(4000),
        CORS_ORIGINS: Joi.string().default("http://localhost:3000"),
        JWT_ACCESS_SECRET: Joi.string().min(32).default("anan-local-development-secret-change-before-production"),
        JWT_ACCESS_TTL: Joi.string().default("15m"),
        AUTH_REFRESH_TTL_DAYS: Joi.number().integer().min(1).max(90).default(30),
        DATABASE_URL: Joi.string().uri({ scheme: ["postgres", "postgresql"] }).default(
          "postgresql://anan:anan_local_dev@localhost:5432/anan_dev?schema=public",
        ),
      }),
    }),
    PrismaModule,
    HealthModule,
    CustomersModule,
    SellersModule,
    CatalogModule,
    AuthModule,
  ],
})
export class AppModule {}
