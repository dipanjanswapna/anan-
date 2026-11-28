import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateSocialPostDto } from "./dto/create-social-post.dto";
import { UpsertCreatorProfileDto } from "./dto/upsert-creator-profile.dto";
import { SocialStudioService } from "./social-studio.service";

@Controller()
export class SocialStudioController {
  constructor(private readonly social: SocialStudioService) {}

  @Get("creators/me/profile")
  myProfile(@Headers("authorization") auth?: string) { return this.social.myProfile(auth); }

  @Post("creators/me/profile")
  saveProfile(@Headers("authorization") auth: string | undefined, @Body() input: UpsertCreatorProfileDto) {
    return this.social.saveProfile(auth, input);
  }

  @Get("creators/:handle")
  publicProfile(@Param("handle") handle: string) { return this.social.publicProfile(handle); }

  @Get("creators/me/posts")
  myPosts(@Headers("authorization") auth?: string) { return this.social.myPosts(auth); }

  @Post("creators/me/posts")
  createPost(@Headers("authorization") auth: string | undefined, @Body() input: CreateSocialPostDto) {
    return this.social.createPost(auth, input);
  }

  @Post("creators/me/posts/:id/submit")
  submitPost(@Headers("authorization") auth: string | undefined, @Param("id") id: string) {
    return this.social.submitPost(auth, id);
  }

  @Get("social/posts")
  publicFeed(@Query("limit") limit?: string) { return this.social.publicFeed(limit); }

  @Get("admin/social/posts")
  moderationQueue(@Headers("authorization") auth: string | undefined, @Query("status") status?: string) {
    return this.social.moderationQueue(auth, status);
  }

  @Patch("admin/social/posts/:id/review")
  reviewPost(@Headers("authorization") auth: string | undefined, @Param("id") id: string, @Body() input: { action: "APPROVE" | "REJECT"; notes?: string }) {
    return this.social.reviewPost(auth, id, input);
  }
}
