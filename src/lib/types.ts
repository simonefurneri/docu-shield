// Modelli condivisi per DocuShield.

/** Tipo di controllo selezionato dall'utente. */
export type CheckType =
  | "NDA"
  | "SOFTWARE_SUPPLIER_CONTRACT"
  | "GDPR_COMPLIANCE";

export interface CheckTypeOption {
  value: CheckType;
  label: string;
}

/** Gravità di una singola criticità trovata nel documento. */
export type Severity = "Alta" | "Media" | "Bassa";

/** Livello di rischio complessivo del documento. */
export type RiskLevel = "Basso" | "Medio" | "Alto";

/** Struttura di una criticità rilevata. */
export interface Issue {
  sezione: string;
  problema: string;
  gravita: Severity;
}

/** Risposta strutturata restituita da Gemini. */
export interface AnalysisResult {
  score: number; // da 0 a 100
  livello_rischio: RiskLevel;
  riassunto: string;
  criticita: Issue[];
  clausole_mancanti: string[];
  consigli_azione: string[];
}

/** Risposta del backend /api/analyze */
export interface AnalyzeResponse {
  success: boolean;
  result?: AnalysisResult;
  fileName?: string;
  error?: string;
  code?: "UPGRADE_REQUIRED" | "AUTH_REQUIRED";
  credits?: number;
  isPro?: boolean;
}

/** Etichette leggibili per i tipi di controllo. */
export const CHECK_TYPE_OPTIONS: CheckTypeOption[] = [
  { value: "NDA", label: "Accordo di Riservatezza (NDA)" },
  {
    value: "SOFTWARE_SUPPLIER_CONTRACT",
    label: "Contratto Fornitore Software",
  },
  { value: "GDPR_COMPLIANCE", label: "Verifica Conformità GDPR" },
];
