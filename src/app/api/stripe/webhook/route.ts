import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramAlert } from "@/lib/telegram";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET non configurato.");
    return NextResponse.json(
      { error: "Webhook secret non configurato." },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Firma stripe-signature mancante." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] Errore verifica firma webhook:", message);
    return NextResponse.json(
      { error: `Webhook error: ${message}` },
      { status: 400 }
    );
  }

  const supabaseAdmin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id || session.metadata?.userId;
        const mode = session.mode;
        const customerEmail =
          session.customer_details?.email ||
          session.customer_email ||
          "Email non disponibile";
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        const purchaseType =
          mode === "payment" ? "Pacchetto Crediti" : "Abbonamento PRO";

        if (!userId) {
          console.warn(
            "[stripe-webhook] Nessun userId trovato nella sessione di checkout:",
            session.id
          );
          break;
        }

        if (mode === "payment") {
          // Pacchetto 5 Analisi: aggiunge +5 crediti al profilo
          console.log(
            `[stripe-webhook] Aggiunta di +5 crediti per utente ${userId}`
          );
          const { error: creditError } = await supabaseAdmin.rpc(
            "increment_credits",
            {
              user_id: userId,
              amount: 5,
            }
          );

          if (creditError) {
            // Fallback diretto su query update se RPC non esiste
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("credits")
              .eq("id", userId)
              .single();

            const currentCredits = profile?.credits ?? 0;
            await supabaseAdmin
              .from("profiles")
              .update({
                credits: currentCredits + 5,
                updated_at: new Date().toISOString(),
              })
              .eq("id", userId);
          }
        } else if (mode === "subscription") {
          // Piano Illimitato: attiva is_pro = true
          console.log(
            `[stripe-webhook] Attivazione abbonamento Pro per utente ${userId}`
          );
          await supabaseAdmin
            .from("profiles")
            .update({
              is_pro: true,
              stripe_customer_id:
                typeof session.customer === "string"
                  ? session.customer
                  : null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }

        // Alert Telegram: Nuovo Pagamento Ricevuto
        await sendTelegramAlert(
          `💰 *Nuovo Pagamento Ricevuto!*\n• *Tipo:* ${purchaseType}\n• *Importo:* ${amount} €\n• *Cliente:* ${customerEmail}`
        );

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        let customerEmail = "Email non disponibile";

        if (customerId) {
          console.log(
            `[stripe-webhook] Cancellazione abbonamento per customer: ${customerId}`
          );
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .update({
              is_pro: false,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId)
            .select("email")
            .single();

          if (profile?.email) {
            customerEmail = profile.email;
          } else {
            // Tentativo di recupero email da Stripe
            try {
              const stripe = getStripe();
              const stripeCustomer = await stripe.customers.retrieve(customerId);
              if ("email" in stripeCustomer && stripeCustomer.email) {
                customerEmail = stripeCustomer.email;
              }
            } catch (stripeErr) {
              console.warn(
                "[stripe-webhook] Impossibile recuperare email da Stripe per customer:",
                customerId,
                stripeErr
              );
            }
          }

          // Alert Telegram: Abbonamento Cancellato
          await sendTelegramAlert(
            `⚠️ *Abbonamento Cancellato*\n• *Cliente:* ${customerEmail}`
          );
        }
        break;
      }

      default:
        // Ignora altri eventi
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] Errore elaborazione evento:", message);
    return NextResponse.json(
      { error: "Errore durante l'elaborazione del webhook." },
      { status: 500 }
    );
  }
}
