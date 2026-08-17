import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse v2 si appoggia a pdfjs-dist. Il worker, ormai attivato via import
  // statico (vedi src/lib/extract.ts), viene richiesto nativamente lato server:
  // esternalizziamo i due pacchetti così che il caricamento avvenga fuori dal
  // bundler Turbopack solo nelle route server (runtime nodejs).
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
