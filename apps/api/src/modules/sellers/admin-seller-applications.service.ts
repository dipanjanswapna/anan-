import {
  ConflictException, Injectable, NotFoundException, UnauthorizedException, ForbiddenException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { ReviewSellerApplicationDto } from "./dto/review-seller-application.dto";

const REVIEW_PERMISSION = "SELLER_APPLICATIONS_REVIEW";

@Injectable()
export class AdminSellerApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async adminContext(authorization?: string) {
    const match = authorization?.match(/^Bearer\\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("An administrator session is required.");
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await this.prisma.customerSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true, role: { in: ["ADMIN", "STAFF"] } } },
      select: { id: true, userId: true, user: { select: { role: true } } },
    });
    if (!session) throw new UnauthorizedException("An active administrator session is required.");
    if (session.user.role !== "ADMIN") {
      const permission = await this.prisma.adminPermission.findUnique({
        where: { userId_permission: { userId: session.userId, permission: REVIEW_PERMISSION } }, select: { id: true },
      });
      if (!permission) throw new ForbiddenException("You do not have permission to review seller applications.");
    }
    await this.prisma.customerSession.updateMany({ where: { id: session.id, revokedAt: null, expiresAt: { gt: new Date() } }, data: { lastUsedAt: new Date() } });
    return { userId: session.userId, role: session.user.role };
  }

  async list(authorization?: string, status?: string) {
    await this.adminContext(authorization);
    const allowed = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];
    if (status && !allowed.includes(status)) throw new ConflictException("Invalid application status filter.");
    const applications = await this.prisma.sellerApplication.findMany({
      where: status ? { status: status as "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" } : {},
      orderBy: { createdAt: "asc" }, take: 100,
    });
    return { applications };
  }

  async review(authorization: string | undefined, id: string, input: ReviewSellerApplicationDto) {
    const actor = await this.adminContext(authorization);
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.sellerApplication.findUnique({ where: { id } });
      if (!application) throw new NotFoundException("Seller application not found.");
      if (application.status === "APPROVED" || application.status === "REJECTED") {
        throw new ConflictException("This application has already reached a final decision.");
      }
      let provisionedUserId: string | null = null;
      if (input.action === "APPROVED") {
        const [byPhone, byEmail] = await Promise.all([
          tx.user.findUnique({ where: { phone: application.phone } }),
          tx.user.findUnique({ where: { email: application.email } }),
        ]);
        if (byPhone && byEmail && byPhone.id !== byEmail.id) {
          throw new ConflictException("The application phone and email belong to different accounts. Manual identity review is required.");
        }
        const existing = byPhone ?? byEmail;
        if (existing && (existing.role !== "SELLER" || existing.sellerProfile)) {
          throw new ConflictException("An account already uses this phone or email. Resolve identity linking manually before approval.");
        }
        const sellerUser = existing ?? await tx.user.create({
          data: { name: application.contactName, email: application.email, phone: application.phone, role: "SELLER", isActive: true },
          select: { id: true },
        });
        provisionedUserId = sellerUser.id;
        await tx.sellerProfile.create({
          data: { userId: sellerUser.id, storeName: application.storeName, storeSlug: application.storeSlug, status: "APPROVED" },
        });
      }
      const updated = await tx.sellerApplication.update({
        where: { id },
        data: { status: input.action, reviewNotes: input.notes?.trim() || null, reviewedAt: new Date(), reviewedByUserId: actor.userId },
        select: { id: true, status: true, reviewNotes: true, reviewedAt: true, reviewedByUserId: true },
      });
      await tx.adminAuditLog.create({
        data: {
          actorUserId: actor.userId,
          action: input.action === "APPROVED" ? "SELLER_APPLICATION_APPROVED" : input.action === "REJECTED" ? "SELLER_APPLICATION_REJECTED" : "SELLER_APPLICATION_MARKED_UNDER_REVIEW",
          targetType: "SELLER_APPLICATION", targetId: id,
          metadata: { provisionedUserId, notesProvided: Boolean(input.notes?.trim()) },
        },
      });
      return {
        application: updated, sellerAccountProvisioned: Boolean(provisionedUserId),
        message: input.action === "APPROVED"
          ? "Application approved. Seller account is provisioned; phone OTP verification is required before seller sign-in."
          : input.action === "REJECTED" ? "Application rejected." : "Application moved to review.",
      };
    }, { isolationLevel: "Serializable" });
  }
}
