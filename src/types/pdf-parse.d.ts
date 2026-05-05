declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfData = { text: string; numpages: number; numrender: number; info: unknown; metadata: unknown; version: string };
  function pdfParse(buffer: Buffer | Uint8Array): Promise<PdfData>;
  export default pdfParse;
}
