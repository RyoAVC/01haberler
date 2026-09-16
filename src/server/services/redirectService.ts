import { prisma } from "@/lib/db";

export async function getActiveRedirectFor(pathname: string) {
  return prisma.redirect.findFirst({ where: { fromPath: pathname, isActive: true } });
}

export async function listRedirects() {
  return prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
}
