"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, LogIn, Mail, ShieldCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMagicLink, setLoadingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);
      setError("");

      const origin = window.location.origin;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (signInError) throw signInError;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Errore durante l'accesso con Google. Assicurati che il provider sia configurato su Supabase."
      );
      setLoadingGoogle(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoadingMagicLink(true);
      setError("");

      const origin = window.location.origin;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (otpError) throw otpError;

      setMagicLinkSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Errore durante l'invio del Magic Link."
      );
    } finally {
      setLoadingMagicLink(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
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
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Accedi a DocuShield
          </h2>
          <p className="mx-auto mt-1.5 text-xs text-slate-600">
            Accedi per ricevere la tua <strong>analisi gratuita</strong> e salvare i tuoi documenti.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {magicLinkSent ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center text-sm text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
            <h3 className="font-semibold text-slate-900">Controlla la tua email!</h3>
            <p className="mt-1 text-xs text-slate-600">
              Abbiamo inviato un link di accesso a <strong>{email}</strong>. Clicca sul link per entrare subito.
            </p>
            <button
              type="button"
              onClick={() => setMagicLinkSent(false)}
              className="mt-4 text-xs font-medium text-indigo-600 hover:underline cursor-pointer"
            >
              Usa un&apos;altra email
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingGoogle || loadingMagicLink}
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingGoogle ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continua con Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200" />
              <span className="bg-white px-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                oppure
              </span>
              <div className="w-full border-t border-slate-200" />
            </div>

            {/* Magic Link Form */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-slate-700"
                >
                  Indirizzo Email
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    placeholder="nome@azienda.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingGoogle || loadingMagicLink || !email}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMagicLink ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Invio link in corso…
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Ricevi Magic Link via Email
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Nessuna password richiesta. Autenticazione sicura gestita tramite Supabase.
        </p>
      </div>
    </div>
  );
}
