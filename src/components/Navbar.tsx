"use client";

import { Crown, LogIn, LogOut, ShieldCheck, Sparkles, User, Zap } from "lucide-react";
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
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-sm overflow-hidden p-1">
            <svg
              viewBox="0 0 32 32"
              className="h-full w-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Document */}
              <path
                d="M7.5 7A1.5 1.5 0 0 1 9 5.5H18L23.5 11V23.5A1.5 1.5 0 0 1 22 25H9A1.5 1.5 0 0 1 7.5 23.5V7Z"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.5 5.5V11.5H23.5"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line x1="11" y1="11.5" x2="14.5" y2="11.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
              <line x1="11" y1="15.5" x2="14" y2="15.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />

              {/* Shield with Check */}
              <path
                d="M21 16.5C21 16.5 23.8 17.3 25 17.5C25 21.5 23.2 24.8 21 26.5C18.8 24.8 17 21.5 17 17.5C18.2 17.3 21 16.5 21 16.5Z"
                fill="#3730a3"
                stroke="#ffffff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.2 21.2L20.4 22.4L22.8 19.8"
                stroke="#ffffff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* AI Sparkle */}
              <path
                d="M11 5.5C11 7.2 12.2 8.5 12.2 8.5C12.2 8.5 11 9.8 11 11.5C11 9.8 9.8 8.5 9.8 8.5C9.8 8.5 11 7.2 11 5.5Z"
                fill="#ffffff"
                opacity="0.95"
              />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            DocuShield
          </span>
          <span className="ml-1 hidden items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 sm:inline-flex">
            <Sparkles className="h-3 w-3 text-indigo-600" />
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
