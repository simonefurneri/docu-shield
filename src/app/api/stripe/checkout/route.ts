import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS_CONFIG, PlanType } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json().catch(() => ({}));
    const plan = (body.plan as PlanType) || "unlimited";

    if (!PLANS_CONFIG[plan]) {
      return NextResponse.json(
        { error: "Piano non valido. Scegli 'pack' o 'unlimited'." },
        { status: 400 }
      );
    }

    const config = PLANS_CONFIG[plan];
    const stripe = getStripe();

    const origin =
      req.headers.get("origin") ||
      req.nextUrl.origin ||
      "https://www.docushield.it";

    const sessionParams: import("stripe").Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: config.name,
              description: config.description,
            },
            unit_amount: config.priceAmount,
            ...(config.mode === "subscription"
              ? { recurring: { interval: "month" } }
              : {}),
          },
          quantity: 1,
        },
      ],
      mode: config.mode,
      success_url: `${origin}/?unlocked=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      client_reference_id: user?.id,
      customer_email: user?.email,
      metadata: {
        plan,
        userId: user?.id || "",
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe-checkout]", message);
    return NextResponse.json(
      { error: "Errore durante la creazione della sessione di pagamento Stripe." },
      { status: 500 }
    );
  }
}
