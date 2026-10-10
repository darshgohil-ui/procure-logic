declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfPage = { getTextContent: () => Promise<{ items: Array<{ str?: string }> }> };
  type PdfOptions = { pagerender?: (pageData: PdfPage) => Promise<string> };
  type PdfResult = { numpages: number; text: string };
  export default function pdfParse(data: Buffer, options?: PdfOptions): Promise<PdfResult>;
}
