import { NextResponse } from "next/server";
import { incrementViewCount } from "@/server/services/articleService";
import { incrementTodayViewCount } from "@/server/services/dailyStatService";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await rateLimit(`article-view:${ip}:${id}`, 1, 300);
  if (!allowed) return new NextResponse(null, { status: 204 });

  await incrementViewCount(id).catch(() => null);
  await incrementTodayViewCount().catch(() => null);

  return new NextResponse(null, { status: 204 });
}
