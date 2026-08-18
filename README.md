# DocuShield 🛡️

MVP — Web application B2B per analizzare **contratti e documenti di conformità** (PDF/DOCX) usando le API di **Google Gemini**.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **lucide-react**
- **unpdf** (estrazione testo PDF serverless/edge-ready per Vercel/Node.js) + **mammoth** (DOCX)
- **Google Gen AI SDK** (`@google/genai` con `gemini-3.6-flash` / `gemini-3.6-pro`)

## Struttura

```
src/
  app/
    page.tsx                 # Landing/Dashboard (header + Analyzer + footer)
    layout.tsx               # Layout root, metadata
    globals.css              # Tema Tailwind
    api/analyze/route.ts     # POST /api/analyze
  components/
    Analyzer.tsx             # Upload + risultati (client)
  lib/
    types.ts                 # Tipi condivisi (AnalysisResult, CheckType, ecc.)
    extract.ts               # Estrazione testo PDF/DOCX (unpdf + mammoth)
    gemini.ts                # Client Google Gemini + prompt + parsing JSON
```

## Configurazione

1. Installa le dipendenze:
   ```bash
   npm install
   ```

2. Crea il file `.env.local` con la tua chiave Gemini (vedi `.env.local.example`):
   ```bash
   cp .env.local.example .env.local
   # GEMINI_API_KEY=AIzaSy...
   ```

3. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

4. Configura le variabili Stripe in `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

5. (Opzionale) Modello Gemini: imposta `GEMINI_MODEL=gemini-3.6-pro` in `.env.local` per analisi più complesse o personalizzate.

## Monetizzazione & Stripe

- **Free Tier**: 1 analisi gratuita per browser/sessione (tracciata tramite cookie sicuro e localStorage).
- **Upgrade Modal**: Si attiva al secondo tentativo di analisi, offrendo:
  - **Pacchetto 5 Analisi**: 15€ una tantum (`mode: 'payment'`).
  - **Piano Illimitato**: 29€/mese abbonamento ricorrente (`mode: 'subscription'`).
- **Endpoint Stripe**:
  - `POST /api/stripe/checkout`: genera la sessione di pagamento Stripe Checkout.
  - `POST /api/stripe/verify-session`: convalida la sessione dopo il redirect e imposta il cookie HTTP-only `docushield_pro=true`.
  - `GET /api/stripe/status`: restituisce lo stato Pro e il numero di analisi effettuate.

## API

### `POST /api/analyze`

Riceve un `multipart/form-data` con:
- `file` — il documento (PDF o DOCX, max 10 MB)
- `check` — uno tra `NDA` | `SOFTWARE_SUPPLIER_CONTRACT` | `GDPR_COMPLIANCE`

Risposta di successo (200):
```json
{
  "success": true,
  "fileName": "contratto.pdf",
  "result": {
    "score": 68,
    "livello_rischio": "Medio",
    "riassunto": "…",
    "criticita": [
      { "sezione": "…", "problema": "…", "gravita": "Alta" }
    ],
    "clausole_mancanti": ["…"],
    "consigli_azione": ["…"]
  }
}
```

Risposta d'errore (4xx/5xx):
```json
{ "success": false, "error": "descrizione" }
```

## Note tecniche

- **pdf-parse v2** usa pdf.js. Per evitare il fallimento del "fake worker" sotto Turbopack, il worker di pdfjs-dist viene importato staticamente e registrato su `globalThis.pdfjsWorker` (single-thread), così `pdf.worker.min.mjs` viene bundle-ato correttamente invece di essere `import()`-ato a runtime.
- **Google Gen AI**: utilizza lo schema JSON strutturato (`responseMimeType: "application/json"`, `responseSchema`) per garantire risposte formattate e tipizzate.
- La chiave API Gemini viene letta da una variabile d'ambiente lato server: **non è mai esposta al client**.

## Verifica

```bash
npm run lint     # ESLint
npm run build    # Build di produzione
```
