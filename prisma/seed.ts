import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

const CATEGORIES: Array<{ name: string; slug: string; sortOrder: number; parentSlug?: string }> = [
  { name: "Son Dakika", slug: "son-dakika", sortOrder: 0 },
  { name: "Gündem", slug: "gundem", sortOrder: 1 },
  { name: "Politika", slug: "politika", sortOrder: 2 },
  { name: "Ekonomi", slug: "ekonomi", sortOrder: 3 },
  { name: "Dünya", slug: "dunya", sortOrder: 4 },
  { name: "Teknoloji", slug: "teknoloji", sortOrder: 5 },
  { name: "Spor", slug: "spor", sortOrder: 6 },
  { name: "Sağlık", slug: "saglik", sortOrder: 7 },
  { name: "Kültür-Sanat", slug: "kultur-sanat", sortOrder: 8 },
  { name: "Eğitim", slug: "egitim", sortOrder: 9 },
  { name: "Yaşam", slug: "yasam", sortOrder: 10 },
  { name: "Yerel Haberler", slug: "yerel-haberler", sortOrder: 11 },
  { name: "Adana", slug: "adana", sortOrder: 12, parentSlug: "yerel-haberler" },
];

async function main() {
  console.log("Kategoriler olusturuluyor...");
  const bySlug = new Map<string, string>();
  for (const cat of CATEGORIES.filter((c) => !c.parentSlug)) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder },
    });
    bySlug.set(cat.slug, created.id);
  }
  for (const cat of CATEGORIES.filter((c) => c.parentSlug)) {
    const parentId = bySlug.get(cat.parentSlug!);
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder, parentId },
    });
    bySlug.set(cat.slug, created.id);
  }

  console.log("Ornek etiketler olusturuluyor...");
  for (const tag of ["deprem", "secim", "enflasyon", "yapay-zeka", "transfer"]) {
    await prisma.tag.upsert({
      where: { slug: tag },
      update: {},
      create: { name: tag.replace(/-/g, " "), slug: tag },
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@01haberler.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "DegistirilecekParola123!";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    console.log(`Ilk super admin olusturuluyor: ${adminEmail}`);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        name: "Yönetici",
        role: "SUPER_ADMIN",
      },
    });
    console.log(`UYARI: Ilk giristen sonra bu parolayi degistirin: ${adminPassword}`);
  }

  console.log(
    "Not: Ornek RSS kaynagi otomatik eklenmez; kullanim sartlari dogrulanmis gercek bir " +
      "kaynagi /admin/kaynaklar sayfasindan lisans notunu belirterek elle ekleyin."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
