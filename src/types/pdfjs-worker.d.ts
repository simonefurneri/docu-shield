// pdfjs-dist's bundler worker ("pdf.worker.min.mjs") doesn't ship .d.ts types.
// Inizializza `globalThis.pdfjsWorker` da solo; per il nostro uso basta
// dichiararlo come modulo conosciuto.
declare module "pdfjs-dist/build/pdf.worker.min.mjs";
