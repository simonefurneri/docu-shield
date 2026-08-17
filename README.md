# DocuShield 🛡️

MVP — Web application B2B per analizzare **contratti e documenti di conformità** (PDF/DOCX) usando le API di **DeepSeek**.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **lucide-react**
- **pdf-parse** (estrazione testo PDF lato server, single-thread tramite pdf.js) + **mammoth** (DOCX)
- **DeepSeek API** (`deepseek-chat` / `deepseek-reasoner`)

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
    extract.ts               # Estrazione testo PDF/DOCX (pdf.js + mammoth)
    deepseek.ts              # Client DeepSeek + prompt + parsing JSON
  types/
    pdfjs-worker.d.ts        # Dichiarazione modulo per pdfjs-dist worker
```

## Configurazione

1. Installa le dipendenze:
   ```bash
   npm install
   ```

2. Crea il file `.env.local` con la tua chiave DeepSeek (vedi `.env.local.example`):
   ```bash
   cp .env.local.example .env.local
   # DEEPSEEK_API_KEY=sk-...
   ```

3. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
   Apri `http://localhost:3000`.

4. (Opzionale) Modello DeepSeek: imposta `DEEPSEEK_MODEL=deepseek-reasoner` in `.env.local` per usare la modalità reasoning.

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
- La chiave API DeepSeek viene letta da una variabile d'ambiente lato server: **non è mai esposta al client**.

## Verifica

```bash
npm run lint     # ESLint
npm run build    # Build di produzione
```
