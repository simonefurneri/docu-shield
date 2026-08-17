import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/deepseek";
import { extractText } from "@/lib/extract";
import { AnalyzeResponse, CheckType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const VALID_TYPES: CheckType[] = ["NDA", "SOFTWARE_SUPPLIER_CONTRACT", "GDPR_COMPLIANCE"];

/**
 * Whitelist dei formati accettati. mammoth estrae solo OOXML:
 * - PDF  : mime "application/pdf" o magic bytes "%PDF-"
 * - DOCX : mime "…wordprocessingml.document" o magic bytes "PK\x03\x04"
 * Il vecchio formato binary ".doc" non è supportato.
 */
function isAllowedPdf(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

function isAllowedDocx(file: File): boolean {
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

/**
 * POST /api/analyze
 * Body multipart/form-data:
 *   - file:   il documento (PDF o DOCX)
 *   - check:  il tipo di controllo (NDA | SOFTWARE_SUPPLIER_CONTRACT | GDPR_COMPLIANCE)
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const check = form.get("check")?.toString() ?? "";

    if (!(file instanceof File) || file.size === 0) {
      return json({ success: false, error: "Nessun file caricato." }, 400);
    }
    if (file.size > MAX_FILE_BYTES) {
      return json(
        { success: false, error: "Il file supera i 10 MB consentiti." },
        400
      );
    }
    if (!VALID_TYPES.includes(check as CheckType)) {
      return json({ success: false, error: "Tipo di controllo non valido." }, 400);
    }
    if (!isAllowedPdf(file) && !isAllowedDocx(file)) {
      return json(
        {
          success: false,
          error: "Formato non supportato. Carica un file PDF o DOCX (.doc non è supportato).",
        },
        400
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, empty } = await extractText(buffer);

    if (empty) {
      return json(
        {
          success: false,
          error: "Nessun testo estraibile dal documento (PDF senza livello testo, scansione, etc.).",
        },
        422
      );
    }

    const result = await analyzeDocument(check as CheckType, text);

    return json({
      success: true,
      result,
      fileName: file.name,
    }, 200);
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    // Logga i dettagli (inclusi eventuali body di risposta DeepSeek) solo lato server.
    console.error("[analyze]", raw);
    const message = raw.includes("DEEPSEEK_API_KEY")
      ? raw
      : "Analisi fallita. Riprova più tardi o controlla la configurazione dell'integrazione AI.";
    return json({ success: false, error: message }, 500);
  }
}

function json(body: AnalyzeResponse, status: number) {
  return NextResponse.json(body, { status });
}
