import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export type ExtractionUnit = {
  location: string;
  originalText: string;
  structuredValues?: unknown;
};

export type ExtractionResult = {
  extractedText: string;
  extractedData: string;
  units: ExtractionUnit[];
  coverageMetric: "pages" | "paragraphs" | "rows" | "records";
  totalUnits: number;
  processedUnits: number;
  failedUnits: number;
  reviewRequiredUnits: number;
  totalPages: number;
  processedPages: number;
  failedPages: number;
  reviewRequiredPages: number;
  processingStatus: "PROCESSED" | "REVIEW_REQUIRED" | "FAILED";
  changeSummary: string;
};

function extension(fileName: string) {
  return fileName.toLowerCase().split(".").pop() || "";
}

function csvRow(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) { current += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { values.push(current.trim()); current = ""; continue; }
    current += char;
  }
  values.push(current.trim());
  return values;
}

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const parsed = await pdfParse(buffer, { pagerender: (pageData: any) => pageData.getTextContent().then((content: any) => content.items.map((item: any) => item.str).join(" ") + "\f") } as any);
  const pages = String(parsed.text || "").split("\f").slice(0, parsed.numpages || undefined);
  const units = pages.map((text, index) => ({ location: `page:${index + 1}`, originalText: text.trim() })).filter(unit => unit.originalText.length > 0);
  const blankPages = Math.max((parsed.numpages || pages.length) - units.length, 0);
  return { extractedText: pages.join("\n\n--- PAGE BREAK ---\n\n"), extractedData: JSON.stringify({ type: "pdf", pages: pages.map((text, index) => ({ page: index + 1, text: text.trim() })) }), units, coverageMetric: "pages", totalUnits: parsed.numpages || pages.length, processedUnits: units.length, failedUnits: 0, reviewRequiredUnits: blankPages, totalPages: parsed.numpages || pages.length, processedPages: units.length, failedPages: 0, reviewRequiredPages: blankPages, processingStatus: blankPages > 0 ? "REVIEW_REQUIRED" : "PROCESSED", changeSummary: blankPages > 0 ? `${blankPages} PDF page(s) contained no extractable text; OCR is unavailable.` : "PDF text extracted with page boundaries." };
}

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });
  const paragraphs = result.value.split(/\n+/).map(item => item.trim()).filter(Boolean);
  const units = paragraphs.map((text, index) => ({ location: `paragraph:${index + 1}`, originalText: text }));
  return { extractedText: result.value, extractedData: JSON.stringify({ type: "docx", paragraphs }), units, coverageMetric: "paragraphs", totalUnits: paragraphs.length, processedUnits: paragraphs.length, failedUnits: 0, reviewRequiredUnits: result.messages.length, totalPages: 0, processedPages: 0, failedPages: 0, reviewRequiredPages: 0, processingStatus: result.messages.length ? "REVIEW_REQUIRED" : "PROCESSED", changeSummary: result.messages.length ? `DOCX extracted with ${result.messages.length} parser warning(s).` : "DOCX paragraphs and table text extracted." };
}

function extractWorkbook(buffer: Buffer): ExtractionResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheets = workbook.SheetNames.map(name => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
    return { name, rows };
  });
  const units = sheets.flatMap(sheet => sheet.rows.map((row, index) => ({ location: `sheet:${sheet.name}:row:${index + 1}`, originalText: row.map(value => String(value ?? "")).join(" | "), structuredValues: row })));
  return { extractedText: sheets.map(sheet => `SHEET: ${sheet.name}\n${sheet.rows.map(row => row.join(" | ")).join("\n")}`).join("\n\n"), extractedData: JSON.stringify({ type: "xlsx", sheets }), units, coverageMetric: "rows", totalUnits: units.length, processedUnits: units.length, failedUnits: 0, reviewRequiredUnits: 0, totalPages: 0, processedPages: 0, failedPages: 0, reviewRequiredPages: 0, processingStatus: "PROCESSED", changeSummary: `XLSX extracted across ${sheets.length} sheet(s) and ${units.length} row(s).` };
}

function extractCsv(buffer: Buffer): ExtractionResult {
  const lines = buffer.toString("utf8").split(/\r?\n/).filter(line => line.trim().length > 0);
  const rows = lines.map(csvRow);
  const units = rows.map((row, index) => ({ location: `row:${index + 1}`, originalText: row.join(" | "), structuredValues: row }));
  return { extractedText: rows.map(row => row.join(" | ")).join("\n"), extractedData: JSON.stringify({ type: "csv", rows }), units, coverageMetric: "records", totalUnits: rows.length, processedUnits: rows.length, failedUnits: 0, reviewRequiredUnits: 0, totalPages: 0, processedPages: 0, failedPages: 0, reviewRequiredPages: 0, processingStatus: "PROCESSED", changeSummary: `CSV extracted with ${rows.length} record(s).` };
}

export async function extractProposal(buffer: Buffer, fileName: string): Promise<ExtractionResult> {
  switch (extension(fileName)) {
    case "pdf": return extractPdf(buffer);
    case "docx": return extractDocx(buffer);
    case "xlsx":
    case "xls": return extractWorkbook(buffer);
    case "csv": return extractCsv(buffer);
    default: throw new Error(`Unsupported proposal format: .${extension(fileName)}`);
  }
}


export type ProcurementFact = {
  concept: string;
  category: "COMMERCIAL" | "TECHNICAL" | "IMPLEMENTATION" | "CONTRACT";
  normalizedValue: string | null;
  originalText: string;
  location: string;
  classification: "FACT" | "UNKNOWN";
};

const procurementConcepts: Array<{ concept: string; category: ProcurementFact["category"]; patterns: RegExp[] }> = [
  { concept: "implementation cost", category: "COMMERCIAL", patterns: [/implementation\s+(?:fee|cost|price)/i] },
  { concept: "license", category: "COMMERCIAL", patterns: [/licen[cs](?:e|ing)/i] },
  { concept: "subscription", category: "COMMERCIAL", patterns: [/subscription/i] },
  { concept: "maintenance", category: "COMMERCIAL", patterns: [/maintenance/i] },
  { concept: "support", category: "COMMERCIAL", patterns: [/support/i] },
  { concept: "migration", category: "IMPLEMENTATION", patterns: [/migration/i] },
  { concept: "training", category: "IMPLEMENTATION", patterns: [/training/i] },
  { concept: "integrations", category: "TECHNICAL", patterns: [/integration|API\b/i] },
  { concept: "deployment", category: "TECHNICAL", patterns: [/cloud|on[- ]prem|deployment/i] },
  { concept: "availability", category: "TECHNICAL", patterns: [/availability|uptime|SLA/i] },
  { concept: "security", category: "TECHNICAL", patterns: [/security|encryption|SSO|RBAC|authentication|compliance/i] },
  { concept: "implementation timeline", category: "IMPLEMENTATION", patterns: [/implementation|cutover|go[- ]live|timeline|\b\d+\s*(?:calendar\s+)?days?\b/i] },
  { concept: "renewal", category: "CONTRACT", patterns: [/renewal|auto[- ]renewal|price escalation/i] },
  { concept: "termination", category: "CONTRACT", patterns: [/termination|notice period/i] },
  { concept: "data ownership", category: "CONTRACT", patterns: [/data ownership|data belongs/i] },
];

function nearbySentence(text: string, index: number) {
  const start = Math.max(text.lastIndexOf(".", index - 1), text.lastIndexOf("\n", index - 1)) + 1;
  const endCandidates = [text.indexOf(".", index), text.indexOf("\n", index)].filter(value => value >= 0);
  const end = endCandidates.length ? Math.min(...endCandidates) + 1 : text.length;
  return text.slice(start, end).trim().replace(/\s+/g, " ");
}

export function identifyProcurementFacts(result: ExtractionResult): ProcurementFact[] {
  const facts: ProcurementFact[] = [];
  for (const unit of result.units) {
    for (const concept of procurementConcepts) {
      const match = concept.patterns.find(pattern => pattern.test(unit.originalText));
      if (!match) continue;
      const index = unit.originalText.search(match);
      const sentence = nearbySentence(unit.originalText, Math.max(index, 0));
      const valueMatch = sentence.match(/(?:\d+(?:\.\d+)?\s*%|\d+(?:\.\d+)?\s*(?:days?|months?|years?)|(?:₹|\$|€|£)\s*[\d,.]+(?:\s*[LMK])?)/i);
      facts.push({ concept: concept.concept, category: concept.category, normalizedValue: valueMatch?.[0]?.trim() || sentence || null, originalText: sentence || unit.originalText.slice(0, 1000), location: unit.location, classification: sentence ? "FACT" : "UNKNOWN" });
    }
  }
  return facts;
}

export function identifyUnknownConcepts(result: ExtractionResult): ProcurementFact[] {
  const present = new Set(identifyProcurementFacts(result).map(fact => fact.concept));
  return procurementConcepts.filter(item => !present.has(item.concept)).map(item => ({ concept: item.concept, category: item.category, normalizedValue: null, originalText: "No explicit statement was found in the extracted document text.", location: "document", classification: "UNKNOWN" }));
}
