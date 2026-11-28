import { Module } from "@nestjs/common";
import { SocialStudioController } from "./social-studio.controller";
import { SocialStudioService } from "./social-studio.service";
import { SocialMediaStorageService } from "./social-media-storage.service";

@Module({ controllers: [SocialStudioController], providers: [SocialStudioService, SocialMediaStorageService] })
export class SocialStudioModule {}
