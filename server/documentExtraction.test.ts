import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { extractProposal } from "./documentExtraction";

describe("proposal extraction", () => {
  it("extracts CSV records with structured values and record coverage", async () => {
    const result = await extractProposal(Buffer.from("vendor,price\nVertex,22.7\nNorthstar,26.4\n"), "pricing.csv");
    expect(result.processingStatus).toBe("PROCESSED");
    expect(result.coverageMetric).toBe("records");
    expect(result.totalUnits).toBe(3);
    expect(result.units[1]?.structuredValues).toEqual(["Vertex", "22.7"]);
    expect(result.extractedText).toContain("Northstar");
  });

  it("extracts XLSX sheets and rows without inventing page counts", async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Vendor", "TCO"], ["Vertex", 22.7]]), "Commercial");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const result = await extractProposal(buffer, "commercial.xlsx");
    expect(result.processingStatus).toBe("PROCESSED");
    expect(result.coverageMetric).toBe("rows");
    expect(result.totalPages).toBe(0);
    expect(result.units.some(unit => unit.location.includes("sheet:Commercial:row:2"))).toBe(true);
  });

  it("fails honestly for unsupported proposal formats", async () => {
    await expect(extractProposal(Buffer.from("data"), "proposal.txt")).rejects.toThrow("Unsupported proposal format");
  });
});
