import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { mediaLibraryWhere } from "@/server/services/mediaLibraryService";
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "article:create")) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Math.min(10000, Number(params.get("page")) || 1));
  const items = await prisma.media.findMany({ where: mediaLibraryWhere(user, params.get("q") ?? ""), orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (Math.floor(page) - 1) * 24, take: 25, select: { id: true, url: true, altText: true, originalFilename: true, source: true } });
  return NextResponse.json({ items: items.slice(0, 24), hasMore: items.length > 24 }, { headers: { "Cache-Control": "private, no-store" } });
}
