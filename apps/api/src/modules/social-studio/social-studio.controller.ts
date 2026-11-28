import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateSocialPostDto } from "./dto/create-social-post.dto";
import { UpsertCreatorProfileDto } from "./dto/upsert-creator-profile.dto";
import { ReviewSocialPostDto } from "./dto/review-social-post.dto";
import { ReportSocialPostDto } from "./dto/report-social-post.dto";
import { ReviewSocialReportDto } from "./dto/review-social-report.dto";
import { PrepareSocialMediaDto, CompleteSocialMediaDto } from "./dto/social-media-upload.dto";
import { SocialMediaStorageService } from "./social-media-storage.service";
import { SocialStudioService } from "./social-studio.service";

@Controller()
export class SocialStudioController {
  constructor(private readonly social: SocialStudioService, private readonly media: SocialMediaStorageService) {}

  @Get("creators/me/profile")
  myProfile(@Headers("authorization") auth?: string) { return this.social.myProfile(auth); }

  @Post("creators/me/profile")
  saveProfile(@Headers("authorization") auth: string | undefined, @Body() input: UpsertCreatorProfileDto) {
    return this.social.saveProfile(auth, input);
  }

  @Get("creators/:handle")
  publicProfile(@Param("handle") handle: string, @Headers("authorization") auth?: string) { return this.social.publicProfile(handle, auth); }

  @Get("creators/me/posts")
  myPosts(@Headers("authorization") auth?: string) { return this.social.myPosts(auth); }

  @Post("creators/me/posts/upload")
  prepareMedia(@Headers("authorization") auth: string | undefined, @Body() input: PrepareSocialMediaDto) {
    return this.media.prepare(auth, input);
  }

  @Post("creators/me/posts/complete")
  completeMedia(@Headers("authorization") auth: string | undefined, @Body() input: CompleteSocialMediaDto) {
    return this.media.complete(auth, input);
  }

  @Post("creators/me/posts")
  createPost(@Headers("authorization") auth: string | undefined, @Body() input: CreateSocialPostDto) {
    return this.social.createPost(auth, input);
  }

  @Post("creators/me/posts/:id/submit")
  submitPost(@Headers("authorization") auth: string | undefined, @Param("id") id: string) {
    return this.social.submitPost(auth, id);
  }

  @Get("social/posts")
  publicFeed(@Query("limit") limit?: string, @Headers("authorization") auth?: string) { return this.social.publicFeed(limit, auth); }

  @Post("social/posts/:id/report")
  reportPost(@Headers("authorization") auth: string | undefined, @Param("id") id: string, @Body() input: ReportSocialPostDto) {
    return this.social.reportPost(auth, id, input);
  }

  @Post("creators/:handle/block")
  blockCreator(@Headers("authorization") auth: string | undefined, @Param("handle") handle: string) {
    return this.social.blockCreator(auth, handle);
  }

  @Get("creators/:handle/block-status")
  creatorBlockStatus(@Headers("authorization") auth: string | undefined, @Param("handle") handle: string) {
    return this.social.creatorBlockStatus(auth, handle);
  }

  @Patch("creators/:handle/unblock")
  unblockCreator(@Headers("authorization") auth: string | undefined, @Param("handle") handle: string) {
    return this.social.unblockCreator(auth, handle);
  }

  @Get("admin/social/posts")
  moderationQueue(@Headers("authorization") auth: string | undefined, @Query("status") status?: string) {
    return this.social.moderationQueue(auth, status);
  }

  @Get("admin/social/reports")
  moderationReports(@Headers("authorization") auth: string | undefined, @Query("status") status?: string) {
    return this.social.moderationReports(auth, status);
  }

  @Patch("admin/social/reports/:id/review")
  reviewReport(@Headers("authorization") auth: string | undefined, @Param("id") id: string, @Body() input: ReviewSocialReportDto) {
    return this.social.reviewReport(auth, id, input);
  }

  @Patch("admin/social/posts/:id/review")
  reviewPost(@Headers("authorization") auth: string | undefined, @Param("id") id: string, @Body() input: ReviewSocialPostDto) {
    return this.social.reviewPost(auth, id, input);
  }
}
