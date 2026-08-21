import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { success: false, error: "Session ID mancante o non valido." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const isPaid =
      session.payment_status === "paid" || session.status === "complete";

    if (!isPaid) {
      return NextResponse.json(
        { success: false, error: "Pagamento non completato." },
        { status: 400 }
      );
    }

    const amount = session.amount_total ? session.amount_total / 100 : 1.0;
    const currency = (session.currency || "EUR").toUpperCase();

    const res = NextResponse.json({
      success: true,
      isPro: true,
      message: "Sessione verificata con successo!",
      amount,
      currency,
      transactionId: session.id,
    });

    // Imposta il cookie HTTP-only docushield_pro=true per sbloccare le analisi (durata 1 anno)
    res.cookies.set("docushield_pro", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 anno
      path: "/",
    });

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe-verify]", message);
    return NextResponse.json(
      { success: false, error: "Impossibile verificare la sessione Stripe." },
      { status: 500 }
    );
  }
}
