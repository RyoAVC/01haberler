import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/server/services/marketService";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";
export async function GET() {
  if (!await isModuleEnabled("currency")) return NextResponse.json({ disabled: true }, { status: 404 });
  return NextResponse.json(await getMarketSnapshot(), { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
}
