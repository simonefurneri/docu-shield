import { extractText as unpdfExtractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

export type ExtractedText = {
  text: string;
  /** true se il documento sembra senza estratto/testo (ad es. solo immagini). */
  empty: boolean;
};

/**
 * Estrae il testo grezzo da un documento PDF o DOCX.
 * - PDF: via unpdf (serverless/edge-ready PDF text extractor, compatibile Vercel)
 * - DOCX: via mammoth (estrazione da Buffer senza file system)
 */
export async function extractText(file: Buffer): Promise<ExtractedText> {
  let text = "";

  if (isPdf(file)) {
    const uint8Array = new Uint8Array(file);
    const pdf = await getDocumentProxy(uint8Array);
    const result = await unpdfExtractText(pdf, { mergePages: true });
    text = Array.isArray(result.text) ? result.text.join("\n") : (result.text ?? "");
  } else if (isDocx(file)) {
    // Gestione DOCX (OOXML) via mammoth da Buffer
    const result = await mammoth.extractRawText({ buffer: file });
    text = result.value ?? "";
  } else {
    // Fallback: prova comunque come DOCX/OOXML
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
