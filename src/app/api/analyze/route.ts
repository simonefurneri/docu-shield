import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/gemini";
import { extractText } from "@/lib/extract";
import { AnalyzeResponse, CheckType } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramAlert } from "@/lib/telegram";

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
  let userEmail = "Non autenticato";

  try {
    // 1. Verifica Autenticazione con Supabase
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return json(
        {
          success: false,
          error: "Devi effettuare l'accesso per analizzare un documento.",
          code: "AUTH_REQUIRED",
        },
        401
      );
    }

    userEmail = user.email || "Utente senza email";

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

    // 2. Controllo Profilo & Crediti su Supabase
    const supabaseAdmin = createAdminClient();
    let { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits, is_pro")
      .eq("id", user.id)
      .single();

    // Se il profilo non esiste ancora, crealo con 1 credito
    if (!profile) {
      const { data: newProfile } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          credits: 1,
          is_pro: false,
        })
        .select("credits, is_pro")
        .single();
      profile = newProfile;
    }

    const isPro = profile?.is_pro ?? false;
    let credits = profile?.credits ?? 0;

    // Se l'utente non è pro e non ha crediti, blocca l'analisi
    if (!isPro && credits <= 0) {
      return json(
        {
          success: false,
          error:
            "Hai esaurito i crediti per le analisi. Effettua l'upgrade o acquista un pacchetto per continuare.",
          code: "UPGRADE_REQUIRED",
          credits: 0,
          isPro: false,
        },
        403
      );
    }

    // 3. Estrazione testo
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

    // 4. Analisi con Gemini
    const result = await analyzeDocument(check as CheckType, text);

    // 5. Decrementa credito se l'utente non è pro
    let updatedCredits = credits;
    if (!isPro) {
      updatedCredits = Math.max(0, credits - 1);
      await supabaseAdmin
        .from("profiles")
        .update({
          credits: updatedCredits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    // Alert Telegram: Nuovo Audit Completato
    await sendTelegramAlert(
      `📄 *Nuovo Audit Completato!*\n• *Documento:* ${check}\n• *Score:* ${result.score}/100\n• *Rischio:* ${result.livello_rischio}\n• *Utente:* ${userEmail}`
    );

    return json(
      {
        success: true,
        result,
        fileName: file.name,
        credits: updatedCredits,
        isPro,
      },
      200
    );
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

    // Alert Telegram: Errore Analisi DocuShield
    await sendTelegramAlert(
      `🚨 *Errore Analisi DocuShield*\n• *Dettaglio:* ${message}\n• *Utente:* ${userEmail}`
    );

    return json({ success: false, error: message }, 500);
  }
}

function json(body: AnalyzeResponse, status: number) {
  return NextResponse.json(body, { status });
}
