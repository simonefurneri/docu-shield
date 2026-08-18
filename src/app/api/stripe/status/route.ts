import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        isAuthenticated: false,
        user: null,
        credits: 0,
        isPro: false,
      });
    }

    // Recupera il profilo dal database
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits, is_pro, email")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
      credits: profile?.credits ?? 1,
      isPro: profile?.is_pro ?? false,
    });
  } catch (err) {
    console.error("[status-route]", err);
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
      credits: 0,
      isPro: false,
    });
  }
}
