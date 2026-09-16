import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "ads_txt_content" } });
  const content = typeof setting?.value === "string" ? setting.value : "";

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
