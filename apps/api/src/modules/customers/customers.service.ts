import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { CreateCustomerAddressDto } from "./dto/create-customer-address.dto";
import { UpdateCustomerAddressDto } from "./dto/update-customer-address.dto";
import { UpdateCustomerProfileDto } from "./dto/update-customer-profile.dto";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private async customerId(authorization?: string): Promise<string> {
    const match = authorization?.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/i);
    if (!match) throw new UnauthorizedException("A valid customer session is required.");
    const tokenHash = createHash("sha256").update(match[1]).digest("hex");
    const session = await this.prisma.customerSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { role: "CUSTOMER", isActive: true },
      },
      select: { id: true, userId: true },
    });
    if (!session) throw new UnauthorizedException("Your session has expired. Please sign in again.");
    await this.prisma.customerSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { lastUsedAt: new Date() },
    });
    return session.userId;
  }

  async profile(authorization?: string) {
    const userId = await this.customerId(authorization);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, phoneVerifiedAt: true, createdAt: true },
    });
    if (!user) throw new UnauthorizedException("Customer account not found.");
    return { user };
  }

  async updateProfile(authorization: string | undefined, input: UpdateCustomerProfileDto) {
    const userId = await this.customerId(authorization);
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.email !== undefined ? { email: input.email.trim().toLowerCase(), emailVerifiedAt: null } : {}),
        },
        select: { id: true, name: true, email: true, phone: true, phoneVerifiedAt: true, createdAt: true },
      });
      return { user, message: "Your profile has been updated." };
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        throw new ConflictException("This email address is already linked to another account.");
      }
      throw error;
    }
  }

  async listAddresses(authorization?: string) {
    const userId = await this.customerId(authorization);
    const addresses = await this.prisma.customerAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return { addresses };
  }

  async createAddress(authorization: string | undefined, input: CreateCustomerAddressDto) {
    const userId = await this.customerId(authorization);
    const makeDefault = input.isDefault === true || !(await this.prisma.customerAddress.findFirst({ where: { userId }, select: { id: true } }));
    const address = await this.prisma.$transaction(async (tx) => {
      if (makeDefault) await tx.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.customerAddress.create({
        data: {
          userId,
          label: input.label?.trim() || "Home",
          recipientName: input.recipientName.trim(),
          phone: input.phone,
          division: input.division.trim(),
          district: input.district.trim(),
          upazila: input.upazila.trim(),
          area: input.area.trim(),
          addressLine: input.addressLine.trim(),
          postalCode: input.postalCode?.trim() || null,
          isDefault: makeDefault,
        },
      });
    });
    return { address, message: "Delivery address saved." };
  }

  async updateAddress(authorization: string | undefined, id: string, input: UpdateCustomerAddressDto) {
    const userId = await this.customerId(authorization);
    const existing = await this.prisma.customerAddress.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) throw new NotFoundException("Address not found.");
    const address = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault === true) await tx.customerAddress.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.customerAddress.update({
        where: { id },
        data: {
          ...(input.label !== undefined ? { label: input.label.trim() } : {}),
          ...(input.recipientName !== undefined ? { recipientName: input.recipientName.trim() } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.division !== undefined ? { division: input.division.trim() } : {}),
          ...(input.district !== undefined ? { district: input.district.trim() } : {}),
          ...(input.upazila !== undefined ? { upazila: input.upazila.trim() } : {}),
          ...(input.area !== undefined ? { area: input.area.trim() } : {}),
          ...(input.addressLine !== undefined ? { addressLine: input.addressLine.trim() } : {}),
          ...(input.postalCode !== undefined ? { postalCode: input.postalCode.trim() || null } : {}),
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        },
      });
    });
    return { address, message: "Delivery address updated." };
  }

  async deleteAddress(authorization: string | undefined, id: string) {
    const userId = await this.customerId(authorization);
    const existing = await this.prisma.customerAddress.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException("Address not found.");
    await this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.delete({ where: { id } });
      if (existing.isDefault) {
        const next = await tx.customerAddress.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true } });
        if (next) await tx.customerAddress.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
    return { deleted: true, message: "Delivery address deleted." };
  }
}
