import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await rateLimit(`ad-click:${ip}:${id}`, 10, 60);
  if (!allowed) return new NextResponse(null, { status: 204 });

  await prisma.advertisement.update({
    where: { id },
    data: { clickCount: { increment: 1 } },
  }).catch(() => null);

  return new NextResponse(null, { status: 204 });
}
