import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// PDF.js, quando eseguito in un bundler (Turbopack/Next.js), tenta di caricare il
// proprio worker con un `import()` dinamico del path, che il bundler non risolve.
// Registriamo il WorkerMessageHandler sul global *staticamente*: in tal modo
// PDF.js usa il "fake worker" in single-thread senza alcuna importazione dinamica,
// il che funziona in modo affidabile nelle route server di Next.js.
const g = globalThis as unknown as { pdfjsWorker?: typeof pdfjsWorker };
g.pdfjsWorker = g.pdfjsWorker ?? pdfjsWorker;

export type ExtractedText = {
  text: string;
  /** true se il documento sembra senza estratto/testo (ad es. solo immagini). */
  empty: boolean;
};

/**
 * Estrae il testo grezzo da un documento PDF o DOCX.
 * - PDF: via pdf-parse v2 (pdf.js single-thread)
 * - DOCX: via mammoth (estrazione da Buffer senza file system)
 */
export async function extractText(
  file: Buffer
): Promise<ExtractedText> {
  let text = "";

  if (isPdf(file)) {
    const parser = new PDFParse({ data: file });
    try {
      const result = await parser.getText();
      text = result.text ?? "";
    } finally {
      await parser.destroy();
    }
  } else if (isDocx(file)) {
    // gestione DOCX (OOXML) via mammoth, da Buffer senza file system
    const result = await mammoth.extractRawText({ buffer: file });
    text = result.value ?? "";
  } else {
    // fallback: prova comunque come DOCX/OOXML (es. mime non affidabile)
    try {
      const result = await mammoth.extractRawText({ buffer: file });
      text = result.value ?? "";
    } catch {
      text = "";
    }
  }

  const normalized = text.replace(/\u0000/g, "").trim().replace(/\s+/g, " ");

  return { text: normalized, empty: normalized.length === 0 };
}

function isPdf(file: Buffer): boolean {
  return file.length >= 5 && file.subarray(0, 5).toString("latin1") === "%PDF-";
}

function isDocx(file: Buffer): boolean {
  // Un file OOXML (DOCX) è uno ZIP e inizia con il magic "PK\x03\x04".
  return (
    file.length >= 4 &&
    file[0] === 0x50 &&
    file[1] === 0x4b &&
    file[2] === 0x03 &&
    file[3] === 0x04
  );
}
