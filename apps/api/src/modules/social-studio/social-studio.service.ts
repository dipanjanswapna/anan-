import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, TooManyRequestsException, UnauthorizedException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { CreateSocialPostDto } from "./dto/create-social-post.dto";
import { UpsertCreatorProfileDto } from "./dto/upsert-creator-profile.dto";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

@Injectable()
export class SocialStudioService {
  constructor(private readonly prisma: PrismaService) {}

  private async userContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("Sign in to use Creator Studio.");
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash: sha256(match[1]), revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true, role: { in: ["CUSTOMER", "SELLER"] } } },
      select: { id: true, userId: true },
    });
    if (!session) throw new UnauthorizedException("Your session has expired.");
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastUsedAt: new Date() } });
    return session.userId;
  }

  private async enforceSocialRateLimit(userId: string, action: string, maximum: number) {
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
    const bucket = await this.prisma.socialRateLimitBucket.upsert({
      where: { userId_action_windowStart: { userId, action, windowStart } },
      create: { userId, action, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    if (bucket.count > maximum) throw new TooManyRequestsException("You are doing that too often. Please try again in a minute.");
  }

  private async adminContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("An administrator session is required.");
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash: sha256(match[1]), revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true, role: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true, userId: true, user: { select: { role: true } } },
    });
    if (!session) throw new UnauthorizedException("An active administrator session is required.");
    if (session.user.role !== "ADMIN") {
      const permission = await this.prisma.adminPermission.findUnique({
        where: { userId_permission: { userId: session.userId, permission: "SOCIAL_MODERATION" } }, select: { id: true },
      });
      if (!permission) throw new ForbiddenException("SOCIAL_MODERATION permission is required.");
    }
    return session.userId;
  }

  async myProfile(authorization?: string) {
    const userId = await this.userContext(authorization);
    return this.prisma.creatorProfile.findUnique({ where: { userId }, include: { _count: { select: { posts: true } } } });
  }

  async saveProfile(authorization: string | undefined, input: UpsertCreatorProfileDto) {
    const userId = await this.userContext(authorization);
    try {
      return await this.prisma.creatorProfile.upsert({
        where: { userId },
        create: { userId, handle: input.handle.toLowerCase(), displayName: input.displayName.trim(), bio: input.bio?.trim(), avatarUrl: input.avatarUrl },
        update: { handle: input.handle.toLowerCase(), displayName: input.displayName.trim(), bio: input.bio?.trim(), avatarUrl: input.avatarUrl },
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new ConflictException("That creator handle is already taken.");
      throw error;
    }
  }

  async publicProfile(handle: string, authorization?: string) {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (match) {
      const session = await this.prisma.customerSession.findFirst({ where: { tokenHash: sha256(match[1]), revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true } }, select: { userId: true } });
      if (session) {
        const blocked = await this.prisma.creatorBlock.findFirst({ where: { blockerUserId: session.userId, creator: { handle: handle.toLowerCase() } }, select: { id: true } });
        if (blocked) throw new NotFoundException("Creator not found.");
      }
    }
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { handle: handle.toLowerCase() },
      select: {
        handle: true, displayName: true, bio: true, avatarUrl: true, createdAt: true,
        user: { select: { isActive: true } },
        posts: {
          where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 30,
          select: { id: true, mediaType: true, mediaUrl: true, caption: true, createdAt: true },
        },
      },
    });
    if (!profile || !profile.user.isActive) throw new NotFoundException("Creator not found.");
    const { user: _user, ...publicProfile } = profile;
    return publicProfile;
  }

  async myPosts(authorization?: string) {
    const userId = await this.userContext(authorization);
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!creator) return [];
    return this.prisma.socialPost.findMany({ where: { creatorProfileId: creator.id }, orderBy: { createdAt: "desc" }, take: 50 });
  }

  async createPost(authorization: string | undefined, input: CreateSocialPostDto) {
    void authorization; void input;
    throw new BadRequestException("External media URLs are disabled. Upload media through the controlled Creator Studio upload flow.");
  }

  async submitPost(authorization: string | undefined, id: string) {
    const userId = await this.userContext(authorization);
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!creator) throw new NotFoundException("Creator profile not found.");
    const result = await this.prisma.socialPost.updateMany({
      where: { id, creatorProfileId: creator.id, status: "DRAFT" },
      data: { status: "PENDING_REVIEW" },
    });
    if (!result.count) throw new ConflictException("Only your draft posts can be submitted for review.");
    return this.prisma.socialPost.findUnique({ where: { id } });
  }

  private async feedViewer(authorization?: string) {
    const match = authorization?.match(/^Bearer\\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) return null;
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash: sha256(match[1]), revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true } },
      select: { userId: true },
    });
    return session?.userId ?? null;
  }

  private async feedBlockFilter(userId: string | null) {
    if (!userId) return [];
    const [blockedByMe, blockingMe] = await Promise.all([
      this.prisma.creatorBlock.findMany({ where: { blockerUserId: userId }, select: { creatorProfileId: true } }),
      this.prisma.creatorBlock.findMany({ where: { creator: { userId } }, select: { blockerUserId: true } }),
    ]);
    const blockedCreatorIds = blockedByMe.map((item) => item.creatorProfileId);
    const blockingUserIds = blockingMe.map((item) => item.blockerUserId);
    const blockerProfiles = blockingUserIds.length
      ? await this.prisma.creatorProfile.findMany({ where: { userId: { in: blockingUserIds } }, select: { id: true } })
      : [];
    return [...new Set([...blockedCreatorIds, ...blockerProfiles.map((item) => item.id)])];
  }

  async publicFeed(limit?: string, authorization?: string, cursor?: string) {
    const parsed = Number(limit ?? 20);
    const take = Number.isInteger(parsed) ? Math.min(50, Math.max(1, parsed)) : 20;
    const blockedCreatorIds = await this.feedBlockFilter(await this.feedViewer(authorization));
    const items = await this.prisma.socialPost.findMany({
      where: { status: "PUBLISHED", creator: { user: { isActive: true } },
        ...(blockedCreatorIds.length ? { creatorProfileId: { notIn: blockedCreatorIds } } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, mediaType: true, mediaUrl: true, caption: true, createdAt: true,
        creator: { select: { handle: true, displayName: true, avatarUrl: true } } },
    });
    return { items: items.slice(0, take), nextCursor: items.length > take ? items[take - 1]?.id ?? null : null };
  }

  async followingFeed(authorization: string | undefined, limit?: string, cursor?: string) {
    const userId = await this.userContext(authorization);
    const parsed = Number(limit ?? 20);
    const take = Number.isInteger(parsed) ? Math.min(50, Math.max(1, parsed)) : 20;
    const blockedCreatorIds = await this.feedBlockFilter(userId);
    const follows = await this.prisma.creatorFollow.findMany({ where: { followerUserId: userId }, select: { creatorProfileId: true } });
    const followedIds = follows.map((item) => item.creatorProfileId).filter((id) => !blockedCreatorIds.includes(id));
    if (!followedIds.length) return { items: [], nextCursor: null };
    const items = await this.prisma.socialPost.findMany({
      where: { status: "PUBLISHED", creatorProfileId: { in: followedIds }, creator: { user: { isActive: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, mediaType: true, mediaUrl: true, caption: true, createdAt: true,
        creator: { select: { handle: true, displayName: true, avatarUrl: true } } },
    });
    return { items: items.slice(0, take), nextCursor: items.length > take ? items[take - 1]?.id ?? null : null };
  }

  async moderationQueue(authorization: string | undefined, status?: string) {
    await this.adminContext(authorization);
    if (status && !["PENDING_REVIEW", "PUBLISHED", "REJECTED", "HIDDEN"].includes(status)) throw new BadRequestException("Invalid moderation status.");
    return this.prisma.socialPost.findMany({
      where: status ? { status: status as "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "HIDDEN" } : { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" }, take: 100,
      include: { creator: { select: { handle: true, displayName: true } } },
    });
  }

  async reviewPost(authorization: string | undefined, id: string, input: { action: "APPROVE" | "REJECT"; notes?: string }) {
    const adminUserId = await this.adminContext(authorization);
    if (!["APPROVE", "REJECT"].includes(input.action) || (input.notes?.length ?? 0) > 1000) throw new BadRequestException("Invalid moderation decision.");
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.socialPost.updateMany({
        where: { id, status: "PENDING_REVIEW" },
        data: {
          status: input.action === "APPROVE" ? "PUBLISHED" : "REJECTED",
          moderationNotes: input.notes?.trim() || null, reviewedAt: new Date(), reviewedByUserId: adminUserId,
        },
      });
      if (!result.count) {
        const exists = await tx.socialPost.findUnique({ where: { id }, select: { id: true } });
        if (!exists) throw new NotFoundException("Post not found.");
        throw new ConflictException("Only pending posts can be reviewed.");
      }
      const updated = await tx.socialPost.findUniqueOrThrow({ where: { id } });
      await tx.adminAuditLog.create({ data: {
        actorUserId: adminUserId, action: "SOCIAL_POST_" + input.action, targetType: "SocialPost", targetId: id,
        metadata: { notes: input.notes?.trim() || null },
      } });
      return updated;
    });
  }

  async reportPost(authorization: string | undefined, postId: string, input: { reason: string; details?: string }) {
    const reporterUserId = await this.userContext(authorization);
    const post = await this.prisma.socialPost.findFirst({
      where: { id: postId, status: "PUBLISHED", creator: { user: { isActive: true } } },
      select: { id: true, creator: { select: { userId: true } } },
    });
    if (!post) throw new NotFoundException("Published post not found.");
    if (post.creator.userId === reporterUserId) throw new BadRequestException("You cannot report your own post.");
    await this.enforceSocialRateLimit(reporterUserId, "REPORT", 5);
    try {
      return await this.prisma.socialPostReport.create({
        data: { postId, reporterUserId, reason: input.reason as never, details: input.details?.trim() || null },
        select: { id: true, reason: true, status: true, createdAt: true },
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        throw new ConflictException("You have already reported this post.");
      }
      throw error;
    }
  }

  async blockCreator(authorization: string | undefined, handle: string) {
    const blockerUserId = await this.userContext(authorization);
    const creator = await this.prisma.creatorProfile.findFirst({
      where: { handle: handle.toLowerCase(), user: { isActive: true } }, select: { id: true, userId: true },
    });
    if (!creator) throw new NotFoundException("Creator not found.");
    if (creator.userId === blockerUserId) throw new BadRequestException("You cannot block your own creator profile.");
    await this.prisma.creatorBlock.upsert({
      where: { blockerUserId_creatorProfileId: { blockerUserId, creatorProfileId: creator.id } },
      create: { blockerUserId, creatorProfileId: creator.id },
      update: {},
    });
    return { blocked: true, handle: handle.toLowerCase() };
  }

  async myBlockedCreators(authorization?: string) {
    const blockerUserId = await this.userContext(authorization);
    const blocks = await this.prisma.creatorBlock.findMany({
      where: { blockerUserId }, orderBy: { createdAt: "desc" },
      select: { createdAt: true, creator: { select: { handle: true, displayName: true, avatarUrl: true } } },
    });
    return blocks.map((block) => ({ ...block.creator, blockedAt: block.createdAt }));
  }

  async creatorBlockStatus(authorization: string | undefined, handle: string) {
    const blockerUserId = await this.userContext(authorization);
    const creator = await this.prisma.creatorProfile.findUnique({ where: { handle: handle.toLowerCase() }, select: { id: true } });
    if (!creator) throw new NotFoundException("Creator not found.");
    const block = await this.prisma.creatorBlock.findUnique({ where: { blockerUserId_creatorProfileId: { blockerUserId, creatorProfileId: creator.id } }, select: { id: true } });
    return { blocked: Boolean(block), handle: handle.toLowerCase() };
  }

  async unblockCreator(authorization: string | undefined, handle: string) {
    const blockerUserId = await this.userContext(authorization);
    const creator = await this.prisma.creatorProfile.findUnique({ where: { handle: handle.toLowerCase() }, select: { id: true } });
    if (!creator) return { blocked: false, handle: handle.toLowerCase() };
    await this.prisma.creatorBlock.deleteMany({ where: { blockerUserId, creatorProfileId: creator.id } });
    return { blocked: false, handle: handle.toLowerCase() };
  }

  async moderationReports(authorization: string | undefined, status?: string) {
    await this.adminContext(authorization);
    if (status && !["OPEN", "DISMISSED", "ACTION_TAKEN"].includes(status)) throw new BadRequestException("Invalid report status.");
    return this.prisma.socialPostReport.findMany({
      where: status ? { status: status as "OPEN" | "DISMISSED" | "ACTION_TAKEN" } : { status: "OPEN" },
      orderBy: { createdAt: "asc" }, take: 100,
      select: {
        id: true, reason: true, details: true, status: true, createdAt: true,
        post: { select: { id: true, mediaType: true, mediaUrl: true, caption: true, status: true, creator: { select: { handle: true, displayName: true } } } },
      },
    });
  }

  async reviewReport(authorization: string | undefined, id: string, input: { action: "DISMISS" | "HIDE_POST"; notes?: string }) {
    const adminUserId = await this.adminContext(authorization);
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.socialPostReport.findUnique({ where: { id }, select: { id: true, postId: true, status: true } });
      if (!report) throw new NotFoundException("Report not found.");
      if (report.status !== "OPEN") throw new ConflictException("This report has already been reviewed.");
      if (input.action === "HIDE_POST") {
        await tx.socialPost.updateMany({ where: { id: report.postId, status: "PUBLISHED" }, data: { status: "HIDDEN" } });
      }
      const updated = await tx.socialPostReport.update({
        where: { id },
        data: {
          status: input.action === "DISMISS" ? "DISMISSED" : "ACTION_TAKEN",
          reviewNotes: input.notes?.trim() || null, reviewedByUserId: adminUserId, reviewedAt: new Date(),
        },
        select: { id: true, status: true, reviewNotes: true, reviewedAt: true },
      });
      await tx.adminAuditLog.create({
        data: {
          actorUserId: adminUserId, action: "SOCIAL_REPORT_" + input.action,
          targetType: "SocialPostReport", targetId: id,
          metadata: { postId: report.postId, notes: input.notes?.trim() || null },
        },
      });
      return updated;
    });
  }


  async followCreator(authorization: string | undefined, handle: string) {
    const followerUserId = await this.userContext(authorization);
    const creator = await this.prisma.creatorProfile.findFirst({ where: { handle: handle.toLowerCase(), user: { isActive: true } }, select: { id: true, userId: true, displayName: true } });
    if (!creator) throw new NotFoundException("Creator not found.");
    await this.enforceSocialRateLimit(followerUserId, "FOLLOW", 20);
    if (creator.userId === followerUserId) throw new BadRequestException("You cannot follow yourself.");
    const existing = await this.prisma.creatorFollow.findUnique({ where: { followerUserId_creatorProfileId: { followerUserId, creatorProfileId: creator.id } }, select: { id: true } });
    if (!existing) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.creatorFollow.create({ data: { followerUserId, creatorProfileId: creator.id } });
          await tx.socialNotification.create({ data: {
            recipientUserId: creator.userId, actorUserId: followerUserId, type: "NEW_FOLLOW",
            message: "Someone started following your creator profile.",
          } });
        });
      } catch (error) {
        if (!(typeof error === "object" && error !== null && "code" in error && error.code === "P2002")) throw error;
      }
    }
    return { following: true, handle: handle.toLowerCase() };
  }

  async unfollowCreator(authorization: string | undefined, handle: string) {
    const followerUserId = await this.userContext(authorization);
    const creator = await this.prisma.creatorProfile.findUnique({ where: { handle: handle.toLowerCase() }, select: { id: true } });
    if (!creator) return { following: false, handle: handle.toLowerCase() };
    await this.prisma.creatorFollow.deleteMany({ where: { followerUserId, creatorProfileId: creator.id } });
    return { following: false, handle: handle.toLowerCase() };
  }

  async creatorStats(handle: string, authorization?: string) {
    const creator = await this.prisma.creatorProfile.findFirst({
      where: { handle: handle.toLowerCase(), user: { isActive: true } },
      select: { id: true, userId: true, handle: true, displayName: true, _count: { select: { followers: true, posts: true } } },
    });
    if (!creator) throw new NotFoundException("Creator not found.");
    const [publishedPosts, likes, following] = await Promise.all([
      this.prisma.socialPost.count({ where: { creatorProfileId: creator.id, status: "PUBLISHED" } }),
      this.prisma.socialPostLike.count({ where: { post: { creatorProfileId: creator.id, status: "PUBLISHED" } } }),
      this.optionalUserId(authorization).then((userId) => userId ? this.prisma.creatorFollow.findUnique({ where: { followerUserId_creatorProfileId: { followerUserId: userId, creatorProfileId: creator.id } }, select: { id: true } }) : null),
    ]);
    return { handle: creator.handle, displayName: creator.displayName, followers: creator._count.followers, publishedPosts, likes, following: Boolean(following) };
  }

  private async optionalUserId(authorization?: string): Promise<string | null> {
    const match = authorization?.match(/^Bearer\\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) return null;
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash: sha256(match[1]), revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true } },
      select: { userId: true },
    });
    return session?.userId ?? null;
  }

  async toggleLike(authorization: string | undefined, postId: string) {
    const userId = await this.userContext(authorization);
    const post = await this.prisma.socialPost.findFirst({ where: { id: postId, status: "PUBLISHED", creator: { user: { isActive: true } } }, select: { id: true, creator: { select: { userId: true } } } });
    if (!post) throw new NotFoundException("Published post not found.");
    await this.enforceSocialRateLimit(userId, "LIKE", 60);
    const existing = await this.prisma.socialPostLike.findUnique({ where: { userId_postId: { userId, postId } }, select: { id: true } });
    if (existing) {
      await this.prisma.socialPostLike.delete({ where: { id: existing.id } });
      return { liked: false, likes: await this.prisma.socialPostLike.count({ where: { postId } }) };
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.socialPostLike.create({ data: { userId, postId } });
      if (post.creator.userId !== userId) await tx.socialNotification.create({ data: {
        recipientUserId: post.creator.userId, actorUserId: userId, postId, type: "POST_LIKE", message: "Someone liked your post.",
      } });
    });
    return { liked: true, likes: await this.prisma.socialPostLike.count({ where: { postId } }) };
  }

  async createComment(authorization: string | undefined, postId: string, input: { body: string }) {
    const userId = await this.userContext(authorization);
    const post = await this.prisma.socialPost.findFirst({ where: { id: postId, status: "PUBLISHED", creator: { user: { isActive: true } } }, select: { id: true } });
    if (!post) throw new NotFoundException("Published post not found.");
    await this.enforceSocialRateLimit(userId, "COMMENT", 8);
    const body = input.body.trim();
    if (!body || body.length > 1000) throw new BadRequestException("Comment must be between 1 and 1000 characters.");
    return this.prisma.socialPostComment.create({
      data: { userId, postId, body, status: "PENDING_REVIEW" },
      select: { id: true, body: true, status: true, createdAt: true },
    });
  }

  async publicComments(postId: string, limit?: string) {
    const parsed = Number(limit ?? 30);
    const take = Number.isInteger(parsed) ? Math.min(50, Math.max(1, parsed)) : 30;
    const post = await this.prisma.socialPost.findFirst({ where: { id: postId, status: "PUBLISHED", creator: { user: { isActive: true } } }, select: { id: true } });
    if (!post) throw new NotFoundException("Published post not found.");
    return this.prisma.socialPostComment.findMany({
      where: { postId, status: "PUBLISHED", user: { isActive: true } }, orderBy: { createdAt: "asc" }, take,
      select: { id: true, body: true, createdAt: true, user: { select: { name: true } } },
    });
  }

  async reviewComment(authorization: string | undefined, id: string, input: { action: "APPROVE" | "HIDE" | "REMOVE"; notes?: string }) {
    const adminUserId = await this.adminContext(authorization);
    const status = input.action === "APPROVE" ? "PUBLISHED" : input.action === "HIDE" ? "HIDDEN" : "REMOVED";
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.socialPostComment.findUnique({ where: { id }, select: { id: true, status: true, post: { select: { creator: { select: { userId: true } } } } } });
      if (!comment) throw new NotFoundException("Comment not found.");
      if (comment.status !== "PENDING_REVIEW") throw new ConflictException("Only pending comments can be reviewed.");
      const updated = await tx.socialPostComment.update({ where: { id }, data: { status, moderationNote: input.notes?.trim() || null, reviewedAt: new Date(), reviewedByUserId: adminUserId }, select: { id: true, status: true, reviewedAt: true } });
      if (status === "PUBLISHED") await tx.socialNotification.create({ data: { recipientUserId: comment.post.creator.userId, actorUserId: adminUserId, type: "NEW_COMMENT", message: "A new comment on your post was approved." } });
      await tx.adminAuditLog.create({ data: { actorUserId: adminUserId, action: "SOCIAL_COMMENT_" + input.action, targetType: "SocialPostComment", targetId: id, metadata: { notes: input.notes?.trim() || null } } });
      return updated;
    });
  }

  async toggleSave(authorization: string | undefined, postId: string) {
    const userId = await this.userContext(authorization);
    const post = await this.prisma.socialPost.findFirst({ where: { id: postId, status: "PUBLISHED", creator: { user: { isActive: true } } }, select: { id: true } });
    if (!post) throw new NotFoundException("Published post not found.");
    const existing = await this.prisma.socialPostSave.findUnique({ where: { userId_postId: { userId, postId } }, select: { id: true } });
    if (existing) {
      await this.prisma.socialPostSave.delete({ where: { id: existing.id } });
      return { saved: false };
    }
    await this.prisma.socialPostSave.create({ data: { userId, postId } });
    return { saved: true };
  }

  async savedPosts(authorization: string | undefined) {
    const userId = await this.userContext(authorization);
    return this.prisma.socialPostSave.findMany({
      where: { userId, post: { status: "PUBLISHED", creator: { user: { isActive: true } } } },
      orderBy: { createdAt: "desc" }, take: 100,
      select: { createdAt: true, post: { select: { id: true, mediaType: true, mediaUrl: true, caption: true, createdAt: true, creator: { select: { handle: true, displayName: true, avatarUrl: true } } } } },
    });
  }

  async notifications(authorization: string | undefined) {
    const userId = await this.userContext(authorization);
    return this.prisma.socialNotification.findMany({
      where: { recipientUserId: userId }, orderBy: { createdAt: "desc" }, take: 50,
      select: { id: true, type: true, message: true, readAt: true, createdAt: true, actor: { select: { name: true } }, post: { select: { id: true } } },
    });
  }

  async markNotificationRead(authorization: string | undefined, id: string) {
    const userId = await this.userContext(authorization);
    const result = await this.prisma.socialNotification.updateMany({ where: { id, recipientUserId: userId, readAt: null }, data: { readAt: new Date() } });
    if (!result.count) {
      const exists = await this.prisma.socialNotification.findFirst({ where: { id, recipientUserId: userId }, select: { id: true } });
      if (!exists) throw new NotFoundException("Notification not found.");
    }
    return { read: true };
  }

  async adminCommentQueue(authorization: string | undefined) {
    await this.adminContext(authorization);
    return this.prisma.socialPostComment.findMany({
      where: { status: "PENDING_REVIEW" }, orderBy: { createdAt: "asc" }, take: 100,
      select: { id: true, body: true, createdAt: true, user: { select: { name: true } }, post: { select: { id: true, caption: true, creator: { select: { handle: true } } } } },
    });
  }

}
