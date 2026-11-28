import { Module } from "@nestjs/common";
import { SocialStudioController } from "./social-studio.controller";
import { SocialStudioService } from "./social-studio.service";

@Module({ controllers: [SocialStudioController], providers: [SocialStudioService] })
export class SocialStudioModule {}
