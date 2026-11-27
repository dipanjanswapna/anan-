import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { CreateSellerApplicationDto } from "./dto/create-seller-application.dto";

@Injectable()
export class SellerApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSellerApplicationDto) {
    const baseSlug = input.storeName
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "store";
    const storeSlug = `${baseSlug}-${randomBytes(3).toString("hex")}`;

    try {
      const application = await this.prisma.sellerApplication.create({
        data: {
          contactName: input.contactName.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(),
          storeName: input.storeName.trim(),
          storeSlug,
          businessType: input.businessType.trim(),
          message: input.message?.trim() || null,
        },
        select: { id: true, storeName: true, status: true, createdAt: true },
      });
      return {
        message: "Your seller application has been received. Our team will review it.",
        application,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("An application already exists for this email address or phone number.");
      }
      throw error;
    }
  }
}
