import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY non configurata: imposta la variabile d'ambiente in .env.local"
    );
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia" as unknown as undefined,
    });
  }

  return stripeInstance;
}

export type PlanType = "pack" | "unlimited";

export const PLANS_CONFIG = {
  pack: {
    name: "DocuShield — Pacchetto 5 Analisi",
    description: "Accesso a 5 analisi complete senza scadenza.",
    priceAmount: 1500, // 15.00 EUR
    mode: "payment" as const,
  },
  unlimited: {
    name: "DocuShield — Piano Illimitato",
    description: "Analisi illimitate di contratti e conformità legale.",
    priceAmount: 2900, // 29.00 EUR / mese
    mode: "subscription" as const,
  },
};
