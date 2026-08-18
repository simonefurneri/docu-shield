"use client";

import { Crown, LogIn, LogOut, ShieldCheck, User, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  user: { id: string; email?: string } | null;
  credits: number;
  isPro: boolean;
  onOpenAuth: () => void;
  onOpenUpgrade: () => void;
  onSignOut: () => void;
}

export default function Navbar({
  user,
  credits,
  isPro,
  onOpenAuth,
  onOpenUpgrade,
  onSignOut,
}: NavbarProps) {
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            DocuShield
          </span>
          <span className="ml-1 hidden items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 sm:inline-flex">
            <ShieldCheck className="h-3 w-3" />
            Audit AI
          </span>
        </div>

        {/* User / Credits Nav */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {isPro ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-xs">
                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                  PRO
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenUpgrade}
                  title="Clicca per acquistare altri crediti"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                >
                  <Zap className="h-3.5 w-3.5 text-indigo-600" />
                  <span>
                    Crediti rimasti: <strong>{credits}</strong>
                  </span>
                </button>
              )}

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[150px] truncate font-medium">
                  {user.email}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Disconnetti"
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Esci</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <LogIn className="h-3.5 w-3.5" />
              Accedi
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
