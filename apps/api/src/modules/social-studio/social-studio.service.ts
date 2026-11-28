import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException,
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

  async publicProfile(handle: string) {
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
    const userId = await this.userContext(authorization);
    const creator = await this.prisma.creatorProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!creator) throw new BadRequestException("Create your Creator Profile before publishing a post.");
    let url: URL;
    try { url = new URL(input.mediaUrl); } catch { throw new BadRequestException("Media must use a valid HTTPS URL."); }
    if (url.protocol !== "https:" || url.username || url.password) throw new BadRequestException("Media must use a valid HTTPS URL.");
    return this.prisma.socialPost.create({ data: {
      creatorProfileId: creator.id, mediaType: input.mediaType, mediaUrl: url.toString(),
      caption: input.caption?.trim(), status: "DRAFT",
    } });
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

  async publicFeed(limit?: string, authorization?: string) {
    const parsed = Number(limit ?? 20);
    const take = Number.isInteger(parsed) ? Math.min(50, Math.max(1, parsed)) : 20;
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    let blockedCreatorIds: string[] = [];
    if (match) {
      const session = await this.prisma.customerSession.findFirst({
        where: { tokenHash: sha256(match[1]), revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true } },
        select: { userId: true },
      });
      if (session) {
        const blocks = await this.prisma.creatorBlock.findMany({
          where: { blockerUserId: session.userId }, select: { creatorProfileId: true },
        });
        blockedCreatorIds = blocks.map((block) => block.creatorProfileId);
      }
    }
    return this.prisma.socialPost.findMany({
      where: {
        status: "PUBLISHED", creator: { user: { isActive: true } },
        ...(blockedCreatorIds.length ? { creatorProfileId: { notIn: blockedCreatorIds } } : {}),
      },
      orderBy: { createdAt: "desc" }, take,
      select: { id: true, mediaType: true, mediaUrl: true, caption: true, createdAt: true,
        creator: { select: { handle: true, displayName: true, avatarUrl: true } } },
    });
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
}
