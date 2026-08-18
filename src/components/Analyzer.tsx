"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  TriangleAlert,
  UploadCloud,
  X,
  ListChecks,
  Lightbulb,
} from "lucide-react";
import { AnalysisResult, CHECK_TYPE_OPTIONS, CheckType, Severity } from "@/lib/types";

type UploadState = "idle" | "loading" | "done" | "error";

export default function Analyzer() {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [checkType, setCheckType] = useState<CheckType>("NDA");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const ok = f.type === "application/pdf" || /\.(pdf|docx)$/i.test(f.name);
    if (!ok) {
      setFile(null);
      setError("Formato non supportato. Carica un file PDF o DOCX.");
      setUploadState("error");
      return;
    }
    setError("");
    setFile(f);
    setUploadState("idle");
    // reset result se cambi file dopo un'analisi
    setAnalysis(null);
  }, []);

  const handleAnalyze = async () => {
    if (!file) {
      setError("Seleziona un documento da analizzare.");
      return;
    }
    setError("");
    setUploadState("loading");
    setAnalysis(null);

    const form = new FormData();
    form.append("file", file);
    form.append("check", checkType);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Errore durante l'analisi.");
      }
      setAnalysis(data.result);
      setFileName(data.fileName ?? file.name);
      setUploadState("done");
    } catch (e) {
      setUploadState("error");
      setError(e instanceof Error ? e.message : "Errore sconosciuto.");
    }
  };

  const handleExport = () => {
    if (!analysis) return;
    const content = buildReportText(fileName, checkType, analysis);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DocuShield-report-${fileName ? fileName.replace(/\.[^.]+$/, "") : "documento"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-16">
      {/* ===== Hero ===== */}
      <section className="text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Audit con Google Gemini AI
        </div>
        <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Analizza contratti e documenti di conformità in pochi secondi
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Carica un PDF o documento Word, scegli il tipo di controllo e ottieni una
          valutazione di rischio, le criticità e i consigli operativi generati dall&apos;IA.
        </p>
      </section>

      {/* ===== Upload form ===== */}
      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Drag & drop */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              onFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              drag
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            {file ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <span className="max-w-[220px] truncate text-sm font-medium text-slate-800">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    aria-label="Rimuovi file"
                    className="text-slate-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setAnalysis(null);
                      setUploadState("idle");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500">Clicca o rilascia per sostituire il file</p>
              </>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Trascina qui il documento
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    oppure clicca per selezionarlo · PDF o DOCX (max 10 MB)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="check-type"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Tipo di controllo
              </label>
              <select
                id="check-type"
                value={checkType}
                onChange={(e) => setCheckType(e.target.value as CheckType)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {CHECK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={uploadState === "loading" || !file}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadState === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisi in corso…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Analizza Documento
                </>
              )}
            </button>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== Results ===== */}
      {analysis && <ResultsView analysis={analysis} fileName={fileName} onExport={handleExport} />}
    </main>
  );
}

/* ------------------------------------------------------------------ */

function ResultsView({
  analysis,
  fileName,
  onExport,
}: {
  analysis: AnalysisResult;
  fileName: string;
  onExport: () => void;
}) {
  const riskConfig: Record<string, { label: string; badge: string; bar: string }> = {
    Basso: { label: "Basso", badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
    Medio: { label: "Medio", badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
    Alto: { label: "Alto", badge: "bg-red-100 text-red-700", bar: "bg-red-500" },
  };
  const rc = riskConfig[analysis.livello_rischio] ?? riskConfig.Medio;

  const gravitaStyle: Record<Severity, string> = {
    Alta: "bg-red-100 text-red-700",
    Media: "bg-amber-100 text-amber-700",
    Bassa: "bg-slate-100 text-slate-600",
  };

  return (
    <section className="mt-10 space-y-6" id="esito">
      {/* Header results */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FileText className="h-4 w-4" />
          <span className="font-medium text-slate-700">{fileName || "Documento analizzato"}</span>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Esporta Report
        </button>
      </div>

      {/* Score card */}
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Rischio complessivo
          </div>
          <div className="relative mx-auto mt-4 flex h-32 w-32 items-center justify-center">
            <ScoreRing score={analysis.score} />
            <div className="absolute">
              <div className="text-3xl font-bold text-slate-900">{analysis.score}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">/ 100</div>
            </div>
          </div>
          <span
            className={`mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${rc.badge}`}
          >
            {analysis.livello_rischio === "Basso" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <TriangleAlert className="h-3.5 w-3.5" />
            )}
            Livello {rc.label}
          </span>
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ListChecks className="h-5 w-5 text-indigo-600" />
            Riassunto
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{analysis.riassunto}</p>
        </div>
      </div>

      {/* Criticità */}
      {analysis.criticita.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <TriangleAlert className="h-5 w-5 text-amber-500" />
              Criticità rilevate
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {analysis.criticita.length}
              </span>
            </h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {analysis.criticita.map((c, i) => (
              <li key={i} className="grid gap-2 px-6 py-4 sm:grid-cols-[140px_1fr_auto]">
                <div className="text-sm font-medium text-slate-700">{c.sezione}</div>
                <div className="text-sm text-slate-600">{c.problema}</div>
                <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${gravitaStyle[c.gravita]}`}>
                  {c.gravita}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Clausole mancanti */}
      {analysis.clausole_mancanti.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <X className="h-5 w-5 text-red-400" />
              Clausole mancanti
            </h3>
          </div>
          <ul className="space-y-2 px-6 py-4">
            {analysis.clausole_mancanti.map((clause, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {clause}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Consigli azione */}
      {analysis.consigli_azione.length > 0 && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Raccomandazioni pratiche
          </h3>
          <ol className="mt-3 space-y-2">
            {analysis.consigli_azione.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
                  {i + 1}
                </span>
                {a}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
      <circle cx="66" cy="66" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      <circle
        cx="66"
        cy="66"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

/* Genera un report testuale semplice per l'esportazione. */
function buildReportText(
  fileName: string,
  checkType: CheckType,
  a: AnalysisResult
): string {
  const typeLabel =
    CHECK_TYPE_OPTIONS.find((o) => o.value === checkType)?.label ?? checkType;
  const lines: string[] = [
    "=============================================",
    " DocuShield — Report di Audit",
    "=============================================",
    `Documento: ${fileName || "n/a"}`,
    `Tipo di controllo: ${typeLabel}`,
    `Score: ${a.score}/100`,
    `Livello di rischio: ${a.livello_rischio}`,
    "",
    "RIASSUNTO",
    "---------",
    a.riassunto,
    "",
    "CRITICITÀ",
    "---------",
  ];
  if (a.criticita.length === 0) lines.push("Nessuna criticità rilevata.");
  a.criticita.forEach((c, i) =>
    lines.push(`${i + 1}. [${c.gravita.toUpperCase()}] ${c.sezione} — ${c.problema}`)
  );
  lines.push("", "CLAUSOLE MANCANTI", "------------------");
  if (a.clausole_mancanti.length === 0) lines.push("Nessuna clausola mancante individuata.");
  a.clausole_mancanti.forEach((c) => lines.push(`- ${c}`));
  lines.push("", "RACCOMANDAZIONI", "--------------");
  a.consigli_azione.forEach((c, i) => lines.push(`${i + 1}. ${c}`));
  lines.push("", "Generato da DocuShield con Google Gemini AI.");
  return lines.join("\n");
}
