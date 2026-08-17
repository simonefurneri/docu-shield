import { ShieldCheck } from "lucide-react";
import Analyzer from "@/components/Analyzer";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              DocuShield
            </span>
            <span className="ml-1 hidden items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 sm:inline-flex">
              <ShieldCheck className="h-3 w-3" />
              Audit con DeepSeek AI
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 sm:flex">
            <a href="#esito" className="hover:text-slate-900">
              Risultati
            </a>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">B2B LegalTech</span>
          </nav>
        </div>
      </header>

      <Analyzer />

      <footer className="border-t border-slate-200 py-6">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-slate-400">
          DocuShield · MVP basato sulle API di DeepSeek. Gli esiti sono generati
          automaticamente e non costituiscono consulenza legale.
        </div>
      </footer>
    </>
  );
}
