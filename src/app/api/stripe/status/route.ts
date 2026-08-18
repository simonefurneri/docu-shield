import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const isPro = req.cookies.get("docushield_pro")?.value === "true";
  const usageCount = parseInt(
    req.cookies.get("docushield_usage_count")?.value ?? "0",
    10
  );

  return NextResponse.json({
    isPro,
    usageCount: Number.isNaN(usageCount) ? 0 : usageCount,
  });
}
