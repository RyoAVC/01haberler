// One-time additive compatibility step for the merged local-news release.
// No rows or existing columns are modified or removed.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '5s'");
    await tx.$executeRawUnsafe('ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "city" TEXT');
    await tx.$executeRawUnsafe('ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "district" TEXT');
    await tx.$executeRawUnsafe('ALTER TABLE "Source" ADD COLUMN IF NOT EXISTS "defaultCity" TEXT');
  }, { timeout: 20000 });
  console.log('Local-news compatibility columns verified.');
}
main().catch(() => { console.error('Compatibility update failed; deployment must stop. Existing rows were not removed.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
