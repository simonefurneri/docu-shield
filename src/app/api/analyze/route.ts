import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/gemini";
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

    // Controllo Paywall / Free Tier (1 analisi gratuita)
    const isPro = req.cookies.get("docushield_pro")?.value === "true";
    const currentUsage = parseInt(
      req.cookies.get("docushield_usage_count")?.value ?? "0",
      10
    );

    if (!isPro && currentUsage >= 1) {
      return json(
        {
          success: false,
          error:
            "Hai utilizzato la tua analisi gratuita. Effettua l'upgrade per continuare ad analizzare i tuoi documenti.",
          code: "UPGRADE_REQUIRED",
        },
        402
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

    const response = json({
      success: true,
      result,
      fileName: file.name,
    }, 200);

    // Se l'utente non è pro, incrementa il contatore di analisi gratuite
    if (!isPro) {
      response.cookies.set("docushield_usage_count", String(currentUsage + 1), {
        httpOnly: false, // accessibile anche da client per sincronizzazione rapida
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }

    return response;
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    // Logga i dettagli lato server
    console.error("[analyze]", raw);

    let message = "Analisi fallita. Riprova più tardi o controlla la configurazione dell'integrazione AI.";
    if (raw.includes("GEMINI_API_KEY")) {
      message = "Chiave API Gemini mancante o non valida. Configura GEMINI_API_KEY nelle impostazioni.";
    } else if (
      raw.includes("503") ||
      raw.includes("high demand") ||
      raw.includes("UNAVAILABLE") ||
      raw.includes("overloaded")
    ) {
      message = "I server di Google AI sono temporaneamente sovraccarichi per picchi di traffico. Riprova tra qualche secondo.";
    } else if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
      message = "Raggiunto il limite di richieste API su Google Gemini. Riprova tra poco.";
    }

    return json({ success: false, error: message }, 500);
  }
}

function json(body: AnalyzeResponse, status: number) {
  return NextResponse.json(body, { status });
}
