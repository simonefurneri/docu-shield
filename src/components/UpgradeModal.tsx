"use client";

import { useState } from "react";
import { Check, Crown, Loader2, Sparkles, X, Zap } from "lucide-react";
import { PlanType } from "@/lib/stripe";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleCheckout = async (plan: PlanType) => {
    try {
      setLoadingPlan(plan);
      setError("");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(
          data.error ?? "Impossibile avviare il checkout. Riprova più tardi."
        );
      }

      // Reindirizza l'utente alla pagina sicura di Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto.");
      setLoadingPlan(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi modale"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Hai utilizzato la tua analisi gratuita
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
            Scegli il piano più adatto alle tue esigenze per continuare ad analizzare
            contratti, identificare criticità e garantire la conformità legale.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Plans Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {/* Opzione A: Pacchetto 5 Analisi */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-slate-300">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">
                  Pacchetto 5 Analisi
                </span>
                <Zap className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Pagamento singolo senza abbonamento
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  15€
                </span>
                <span className="text-xs text-slate-500">una tantum</span>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>5 analisi complete di contratti</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Nessuna scadenza sui crediti</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Esportazione report in TXT</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => handleCheckout("pack")}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPlan === "pack" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reindirizzamento…
                </>
              ) : (
                "Acquista 5 Analisi"
              )}
            </button>
          </div>

          {/* Opzione B: Piano Illimitato */}
          <div className="relative flex flex-col justify-between rounded-xl border-2 border-indigo-600 bg-indigo-50/20 p-5 shadow-sm">
            <div className="absolute -top-3 right-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
              Consigliato
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-indigo-900">
                  Piano Illimitato
                </span>
                <Crown className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-1 text-xs text-indigo-600/80">
                Per professionisti e studi legali
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  29€
                </span>
                <span className="text-xs text-slate-500">/ mese</span>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="font-medium text-slate-900">
                    Analisi illimitate di contratti
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Supporto per NDA, GDPR e Contratti IT</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Accesso prioritario ai modelli AI</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Disdici in qualsiasi momento</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={loadingPlan !== null}
              onClick={() => handleCheckout("unlimited")}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPlan === "unlimited" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reindirizzamento…
                </>
              ) : (
                "Attiva Piano Illimitato"
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Pagamenti sicuri e crittografati gestiti tramite Stripe Checkout.
        </p>
      </div>
    </div>
  );
}
