import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { PrismaModule } from "./database/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { SellersModule } from "./modules/sellers/sellers.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { AuthModule } from "./modules/auth/auth.module";
import { SocialStudioModule } from "./modules/social-studio/social-studio.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
        PORT: Joi.number().port().default(4000),
        ORDER_EXPIRY_POLL_INTERVAL_MS: Joi.number().integer().min(10000).max(3600000).default(60000),
        RETURN_REQUEST_WINDOW_DAYS: Joi.number().integer().min(1).max(30).default(7),
        CORS_ORIGINS: Joi.string().default("http://localhost:3000"),
        DATABASE_URL: Joi.string().uri({ scheme: ["postgres", "postgresql"] }).default(
          "postgresql://anan:anan_local_dev@localhost:5432/anan_dev?schema=public",
        ),
        OTP_HASH_SECRET: Joi.string().min(32).when("NODE_ENV", {
          is: "production",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        OTP_DELIVERY_URL: Joi.string().uri().optional(),
        OTP_DELIVERY_TOKEN: Joi.string().optional(),
        AWS_REGION: Joi.string().allow("").optional(),
        AWS_S3_BUCKET: Joi.string().allow("").optional(),
        AWS_ACCESS_KEY_ID: Joi.string().allow("").optional(),
        AWS_SECRET_ACCESS_KEY: Joi.string().allow("").optional(),
        AWS_SESSION_TOKEN: Joi.string().allow("").optional(),
        MEDIA_PUBLIC_BASE_URL: Joi.string().allow("").uri({ scheme: ["http", "https"] }).optional(),
      }),
    }),
    PrismaModule,
    HealthModule,
    CustomersModule,
    SellersModule,
    CatalogModule,
    AuthModule,
    SocialStudioModule,
  ],
})
export class AppModule {}
