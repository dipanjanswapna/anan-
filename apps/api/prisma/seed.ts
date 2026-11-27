import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { slug: "electronics", nameEn: "Electronics & Gadgets", nameBn: "ইলেকট্রনিক্স ও গ্যাজেটস" },
  { slug: "fashion", nameEn: "Fashion & Clothing", nameBn: "ফ্যাশন ও পোশাক" },
  { slug: "beauty", nameEn: "Beauty & Cosmetics", nameBn: "বিউটি ও কসমেটিকস" },
  { slug: "home-kitchen", nameEn: "Home & Kitchen", nameBn: "হোম ও কিচেন" },
  { slug: "grocery", nameEn: "Grocery & Food", nameBn: "গ্রোসারি ও খাবার" },
  { slug: "books", nameEn: "Books & Stationery", nameBn: "বই ও স্টেশনারি" },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { nameEn: category.nameEn, nameBn: category.nameBn, isActive: true },
      create: category,
    });
  }
  console.log(`Seeded ${categories.length} ANAN categories.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
