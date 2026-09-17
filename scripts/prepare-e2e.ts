import { PrismaClient } from "@prisma/client";
async function main() {
  const database = new URL(process.env.DATABASE_URL ?? "");
  if (process.env.CI !== "true" || !["localhost", "127.0.0.1"].includes(database.hostname) || database.pathname !== "/haberler01") throw new Error("This fixture is restricted to the isolated CI database.");
  const prisma = new PrismaClient();
  try { await prisma.siteSetting.upsert({ where: { key: "installed" }, create: { key: "installed", value: { installed: true } }, update: { value: { installed: true } } }); }
  finally { await prisma.$disconnect(); }
}
main().catch(() => { console.error("CI installation fixture failed."); process.exitCode = 1; });
