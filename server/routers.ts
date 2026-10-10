import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { extractProposal, identifyProcurementFacts, identifyUnknownConcepts } from "./documentExtraction";
import { nextDocumentVersion } from "./documentVersioning";
import { invokeLLM } from "./_core/llm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { and, eq } from "drizzle-orm";
import { auditEvents, evidence as evidenceTable, decisionRooms, documentVersions, documents, notifications, requirements, vendors } from "../drizzle/schema";
import { storagePut } from "./storage";
import { acceptDecision, ensureSeedData, getDb, getMemStore, getRoomSnapshot, getUserByOpenId, markNotificationRead, processDocumentFacts, recalculateDecisionModel, updateRequirementWeight, upsertUser } from "./db";

const roomInput = z.object({ roomId: z.number().int().positive() });
const actorId = async (ctx: { user: { id: number } | null }) => {
  if (ctx.user?.id) return ctx.user.id;
  const openId = process.env.OWNER_OPEN_ID || "demo-procure-user";
  await upsertUser({ openId, name: process.env.OWNER_NAME || "Procure Logic Demo User", email: "demo@procure.logic", loginMethod: "demo" });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Unable to resolve demo actor");
  return user.id;
};

async function assertRoomAccess(ctx: { user: { id: number } | null }, roomId: number) {
  const db = await getDb();
  if (!db) {
    const aid = await actorId(ctx);
    const snap = await getRoomSnapshot(roomId);
    if (snap?.room && snap.room.ownerId !== aid) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Decision room is not available to this user" });
    }
    return roomId || 1;
  }
  const room = (await db.select().from(decisionRooms).where(and(eq(decisionRooms.id, roomId), eq(decisionRooms.ownerId, await actorId(ctx)))).limit(1))[0];
  if (!room) throw new TRPCError({ code: "FORBIDDEN", message: "Decision room is not available to this user" });
  return room.id;
}

async function getRoomId(ctx: { user: { id: number } | null }, requested?: number) {
  if (requested) return assertRoomAccess(ctx, requested);
  const room = await ensureSeedData(await actorId(ctx));
  if (!room?.id) return 1;
  return assertRoomAccess(ctx, room.id);
}

async function assertVendorAccess(ctx: { user: { id: number } | null }, vendorId: number) {
  const db = await getDb();
  if (!db) {
    const snap = await getRoomSnapshot(1);
    const v = snap?.vendors.find(item => item.id === vendorId) || snap?.vendors[0];
    if (!v) throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
    return v;
  }
  const row = (await db.select({ vendor: vendors }).from(vendors).innerJoin(decisionRooms, eq(vendors.roomId, decisionRooms.id)).where(and(eq(vendors.id, vendorId), eq(decisionRooms.ownerId, await actorId(ctx)))).limit(1))[0];
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "Vendor is not available to this user" });
  return row.vendor;
}

async function assertRequirementAccess(ctx: { user: { id: number } | null }, requirementId: number) {
  const db = await getDb();
  if (!db) {
    const snap = await getRoomSnapshot(1);
    const r = snap?.requirements.find(item => item.id === requirementId) || snap?.requirements[0];
    if (!r) throw new TRPCError({ code: "NOT_FOUND", message: "Requirement not found" });
    return r;
  }
  const row = (await db.select({ requirement: requirements }).from(requirements).innerJoin(decisionRooms, eq(requirements.roomId, decisionRooms.id)).where(and(eq(requirements.id, requirementId), eq(decisionRooms.ownerId, await actorId(ctx)))).limit(1))[0];
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "Requirement is not available to this user" });
  return row.requirement;
}

function textFromContent(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(item => typeof item === "string" ? item : (item as { text?: string }).text || "").join("\n");
  return "";
}

function deterministicAnswer(question: string, snapshot: Awaited<ReturnType<typeof getRoomSnapshot>>) {
  const lower = question.toLowerCase();
  const vendors = snapshot?.vendors ?? [];
  const relevant = (terms: string[]) => snapshot?.evidence.filter(item => terms.some(term => `${item.label} ${item.originalText || ""} ${item.interpretation || ""}`.toLowerCase().includes(term))).map(item => item.id) ?? [];
  const unknown = snapshot?.evidence.filter(item => item.classification === "UNKNOWN") ?? [];
  const winnerId = snapshot?.ranking?.[0]?.vendorId;
  const winner = vendors.find(vendor => vendor.id === winnerId) ?? vendors.slice().sort((a, b) => Number(b.score) - Number(a.score))[0];
  if (lower.includes("cheapest") || lower.includes("cost") || lower.includes("tco")) {
    const priced = vendors.filter(vendor => vendor.comparableTco !== null && vendor.comparableTco !== undefined).sort((a, b) => Number(a.comparableTco) - Number(b.comparableTco));
    const cheapest = priced[0];
    return { answer: cheapest ? `${cheapest.name} has the lowest recorded comparable TCO at ₹${Number(cheapest.comparableTco).toFixed(1)}L. This is a known-cost comparison only; UNKNOWN cost components are not estimated.` : "Supporting evidence was not found in the current evidence ledger for a comparable TCO.", sourceIds: relevant(["cost", "tco"]) };
  }
  if (lower.includes("risk") || lower.includes("clarif") || lower.includes("ask")) return { answer: unknown.length ? `The evidence ledger contains ${unknown.length} unknown finding(s). Resolve the cited source gaps before award; no missing value has been inferred.` : "No unresolved UNKNOWN evidence was found in the current evidence ledger.", sourceIds: unknown.slice(0, 5).map(item => item.id) };
  if (lower.includes("changed") || lower.includes("version")) {
    const versionSources = relevant(["version", "revision", "changed", "previous", "migration", "availability", "implementation"]);
    return { answer: versionSources.length ? "Version-related evidence was found in the current evidence ledger. Review the cited source passages for the exact changes; no change has been inferred where the source does not state one." : "Supporting evidence was not found in the current evidence ledger for a version comparison.", sourceIds: versionSources };
  }
  const sourceIds = relevant(["implementation", "availability", "tco", "security"]);
  return { answer: winner && sourceIds.length ? `${winner.name} currently ranks first under the current persisted decision model with a score of ${winner.score}. The recommendation remains subject to the model's recorded blocking issues and unknowns.` : "Supporting evidence was not found in the current evidence ledger.", sourceIds };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    bootstrap: publicProcedure.input(z.object({ roomId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
      const roomId = await getRoomId(ctx, input?.roomId);
      await recalculateDecisionModel(roomId);
      const snapshot = await getRoomSnapshot(roomId);
      return snapshot;
    }),
    rooms: publicProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        const snap = await getRoomSnapshot(1);
        return snap?.room ? [{ id: snap.room.id, code: snap.room.code, name: snap.room.name }] : [{ id: 1, code: "Q3", name: "ERP modernization" }];
      }
      const userId = await actorId(ctx);
      await ensureSeedData(userId);
      return db.select().from(decisionRooms).where(eq(decisionRooms.ownerId, userId));
    }),
    createRoom: protectedProcedure.input(z.object({ code: z.string().min(1).max(32), name: z.string().min(1).max(255), description: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const inserted = await db.insert(decisionRooms).values({ ownerId: ctx.user.id, code: input.code, name: input.name, description: input.description, status: "active" }).$returningId();
      return inserted[0];
    }),
    getRoom: publicProcedure.input(roomInput).query(async ({ ctx, input }) => getRoomSnapshot(await assertRoomAccess(ctx, input.roomId))),
    vendors: publicProcedure.input(roomInput).query(async ({ ctx, input }) => (await getRoomSnapshot(await assertRoomAccess(ctx, input.roomId)))?.vendors ?? []),
    addVendor: protectedProcedure.input(z.object({ roomId: z.number().int().positive(), name: z.string().min(1), initials: z.string().min(1).max(8), fitLabel: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await assertRoomAccess(ctx, input.roomId);
      return (await db.insert(vendors).values({ roomId: input.roomId, name: input.name, initials: input.initials, fitLabel: input.fitLabel, score: "0", tone: "slate" }).$returningId())[0];
    }),
    updateVendor: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().optional(), fitLabel: z.string().optional(), note: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const vendor = await assertVendorAccess(ctx, input.id);
      await db.update(vendors).set({ name: input.name, fitLabel: input.fitLabel, note: input.note }).where(eq(vendors.id, input.id));
      await db.insert(auditEvents).values({ roomId: vendor.roomId, actorId: await actorId(ctx), eventType: "VENDOR_UPDATED", entityType: "vendor", entityId: vendor.id, payloadJson: JSON.stringify({ name: input.name, fitLabel: input.fitLabel, note: input.note }) });
      return true;
    }),
    deleteVendor: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const vendor = await assertVendorAccess(ctx, input.id);
      await db.delete(vendors).where(eq(vendors.id, vendor.id));
      await db.insert(auditEvents).values({ roomId: vendor.roomId, actorId: await actorId(ctx), eventType: "VENDOR_DELETED", entityType: "vendor", entityId: vendor.id, payloadJson: JSON.stringify({ name: vendor.name }) });
      return true;
    }),
    requirements: publicProcedure.input(roomInput).query(async ({ ctx, input }) => (await getRoomSnapshot(await assertRoomAccess(ctx, input.roomId)))?.requirements ?? []),
    updateRequirement: publicProcedure.input(z.object({ id: z.number().int().positive(), weight: z.number().min(0).max(100), name: z.string().optional(), classification: z.enum(["MANDATORY", "PREFERRED", "HARD_CONSTRAINT"]).optional() })).mutation(async ({ ctx, input }) => {
      await assertRequirementAccess(ctx, input.id);
      const updated = await updateRequirementWeight(input.id, input.weight, await actorId(ctx));
      const db = await getDb();
      if (db && (input.name || input.classification)) { await db.update(requirements).set({ name: input.name, classification: input.classification }).where(eq(requirements.id, input.id)); await recalculateDecisionModel(updated?.roomId ?? 0, await actorId(ctx)); }
      return updated;
    }),
    addRequirement: protectedProcedure.input(z.object({ roomId: z.number().int().positive(), name: z.string().min(1), category: z.string().min(1), weight: z.number().min(0).max(100), classification: z.enum(["MANDATORY", "PREFERRED", "HARD_CONSTRAINT"]) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await assertRoomAccess(ctx, input.roomId);
      const inserted = (await db.insert(requirements).values({ roomId: input.roomId, name: input.name, originalWording: input.name, normalizedConcept: input.name, category: input.category, weight: input.weight.toFixed(2), classification: input.classification, status: "USER_CONFIRMED" }).$returningId())[0];
      await recalculateDecisionModel(input.roomId, ctx.user?.id);
      return inserted;
    }),
    deleteRequirement: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const requirement = await assertRequirementAccess(ctx, input.id);
      await db.delete(requirements).where(eq(requirements.id, requirement.id));
      await recalculateDecisionModel(requirement.roomId, ctx.user.id);
      return true;
    }),
    documents: publicProcedure.input(roomInput).query(async ({ ctx, input }) => (await getRoomSnapshot(await assertRoomAccess(ctx, input.roomId)))?.documents ?? []),
    uploadProposal: publicProcedure.input(z.object({ roomId: z.number().int().positive(), fileName: z.string().min(1).max(255), mimeType: z.string().max(128).optional(), base64: z.string().min(1), vendorId: z.number().int().positive().optional(), vendorName: z.string().min(1).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await assertRoomAccess(ctx, input.roomId);
      const userId = await actorId(ctx);
      const buffer = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
      if (buffer.byteLength > 50 * 1024 * 1024) throw new Error("Proposal exceeds the 50 MB limit");

      if (!db) {
        const store = getMemStore(userId);
        let vendor = store.vendors.find(v => input.vendorId ? v.id === input.vendorId : v.name === (input.vendorName || "New vendor"));
        if (!vendor) {
          vendor = { id: store.vendors.length + 1, roomId: input.roomId, name: input.vendorName || "New vendor", initials: (input.vendorName || "NV").slice(0, 2).toUpperCase(), fitLabel: null, score: "0", comparableTco: null, delta: null, tone: "slate", note: null };
          store.vendors.push(vendor);
        }
        const existingDocument = store.documents.find(d => d.roomId === input.roomId && d.vendorId === vendor!.id && d.name === input.fileName);
        const versionRows = existingDocument ? store.documentVersions.filter(dv => dv.documentId === existingDocument.id) : [];
        const version = nextDocumentVersion(versionRows.length);
        const now = new Date();
        const documentId = existingDocument ? existingDocument.id : store.documents.length + 1;
        let storedKey = `rooms/${input.roomId}/proposals/${input.fileName}`;
        let storedUrl = `https://storage.local/${storedKey}`;
        try {
          const stored = await storagePut(storedKey, buffer, input.mimeType || "application/octet-stream");
          storedKey = stored.key;
          storedUrl = stored.url;
        } catch {}

        try {
          const extraction = await extractProposal(buffer, input.fileName);
          if (!existingDocument) {
            store.documents.push({
              id: documentId,
              roomId: input.roomId,
              vendorId: vendor.id,
              name: input.fileName,
              documentType: input.fileName.split(".").pop()?.toUpperCase() || "PROPOSAL",
              storageKey: storedKey,
              processingStatus: extraction.processingStatus,
              totalPages: extraction.totalPages,
              processedPages: extraction.processedPages,
              reviewRequiredPages: extraction.reviewRequiredPages,
              totalUnits: extraction.totalUnits,
              processedUnits: extraction.processedUnits,
              reviewRequiredUnits: extraction.reviewRequiredUnits,
              coverageMetric: extraction.coverageMetric,
              latestVersion: version,
              uploadedBy: userId,
              createdAt: now,
              updatedAt: now,
            });
          } else {
            existingDocument.processingStatus = extraction.processingStatus;
            existingDocument.latestVersion = version;
            existingDocument.updatedAt = now;
          }
          return { id: documentId, key: storedKey, url: storedUrl, version, status: extraction.processingStatus, coverageMetric: extraction.coverageMetric, totalUnits: extraction.totalUnits, processedUnits: extraction.processedUnits };
        } catch (error) {
          if (!existingDocument) {
            store.documents.push({
              id: documentId,
              roomId: input.roomId,
              vendorId: vendor.id,
              name: input.fileName,
              documentType: input.fileName.split(".").pop()?.toUpperCase() || "PROPOSAL",
              storageKey: storedKey,
              processingStatus: "FAILED",
              totalPages: 0,
              processedPages: 0,
              reviewRequiredPages: 0,
              totalUnits: 0,
              processedUnits: 0,
              reviewRequiredUnits: 0,
              coverageMetric: "pages",
              latestVersion: version,
              uploadedBy: userId,
              createdAt: now,
              updatedAt: now,
            });
          } else {
            existingDocument.processingStatus = "FAILED";
            existingDocument.latestVersion = version;
            existingDocument.updatedAt = now;
          }
          return { id: documentId, key: storedKey, url: storedUrl, version, status: "FAILED" as const, coverageMetric: "pages" as const, totalUnits: 0, processedUnits: 0 };
        }
      }
      let vendorId = input.vendorId;
      if (!vendorId) {
        const existingVendor = (await db.select().from(vendors).where(and(eq(vendors.roomId, input.roomId), eq(vendors.name, input.vendorName || "New vendor"))).limit(1))[0];
        vendorId = existingVendor?.id;
        if (!vendorId) vendorId = (await db.insert(vendors).values({ roomId: input.roomId, name: input.vendorName || "New vendor", initials: (input.vendorName || "NV").slice(0, 2).toUpperCase(), score: "0", tone: "slate" }).$returningId())[0]?.id;
      }
      if (!vendorId) throw new Error("Unable to resolve proposal vendor");
      const stored = await storagePut(`rooms/${input.roomId}/proposals/${input.fileName}`, buffer, input.mimeType || "application/octet-stream");
      const existingDocument = (await db.select().from(documents).where(and(eq(documents.roomId, input.roomId), eq(documents.vendorId, vendorId), eq(documents.name, input.fileName))).limit(1))[0];
      const versionRows = existingDocument ? await db.select().from(documentVersions).where(eq(documentVersions.documentId, existingDocument.id)) : [];
      const version = nextDocumentVersion(versionRows.length);
      const documentId = existingDocument?.id ?? (await db.insert(documents).values({ roomId: input.roomId, vendorId, name: input.fileName, documentType: input.fileName.split(".").pop()?.toUpperCase() || "PROPOSAL", storageKey: stored.key, storageUrl: stored.url, mimeType: input.mimeType, processingStatus: "UPLOADING", uploadedBy: userId, coverageMetric: "pages" }).$returningId())[0]?.id;
      if (!documentId) throw new Error("Unable to create document record");
      await db.update(documents).set({ storageKey: stored.key, storageUrl: stored.url, mimeType: input.mimeType, processingStatus: "PROCESSING", latestVersion: version }).where(eq(documents.id, documentId));
      try {
        const extraction = await extractProposal(buffer, input.fileName);
        const insertedVersion = await db.insert(documentVersions).values({ documentId, version, fileName: input.fileName, extractedText: extraction.extractedText, extractedData: extraction.extractedData, changeSummary: extraction.changeSummary, createdBy: userId }).$returningId();
        const documentVersionId = insertedVersion[0]?.id;
        await db.update(documents).set({ processingStatus: extraction.processingStatus, totalPages: extraction.totalPages, processedPages: extraction.processedPages, failedPages: extraction.failedPages, reviewRequiredPages: extraction.reviewRequiredPages, coverageMetric: extraction.coverageMetric, totalUnits: extraction.totalUnits, processedUnits: extraction.processedUnits, failedUnits: extraction.failedUnits, reviewRequiredUnits: extraction.reviewRequiredUnits }).where(eq(documents.id, documentId));
        if (documentVersionId) {
          const facts = identifyProcurementFacts(extraction);
          const unknowns = identifyUnknownConcepts(extraction);
          await processDocumentFacts(input.roomId, vendorId, documentId, documentVersionId, [...facts, ...unknowns], userId);
          for (const unit of extraction.units.slice(0, 500)) await db.insert(evidenceTable).values({ roomId: input.roomId, vendorId, documentId, documentVersionId, label: `Extracted ${unit.location}`, normalizedValue: unit.originalText.slice(0, 255), originalText: unit.originalText, page: extraction.coverageMetric === "pages" ? Number(unit.location.split(":")[1]) || null : null, classification: "FACT", evidenceStrength: "MEDIUM", completeness: "HIGH", confidence: "HIGH", interpretation: "Raw extracted source text; procurement interpretation is recorded separately when a requirement match exists." });
        }
        await db.insert(auditEvents).values({ roomId: input.roomId, actorId: userId, eventType: "DOCUMENT_EXTRACTED", entityType: "document", entityId: documentId, payloadJson: JSON.stringify({ version, status: extraction.processingStatus, coverageMetric: extraction.coverageMetric, totalUnits: extraction.totalUnits, processedUnits: extraction.processedUnits }) });
        await db.insert(notifications).values({ userId, roomId: input.roomId, kind: extraction.processingStatus === "PROCESSED" ? "document" : "review", title: extraction.processingStatus === "PROCESSED" ? "Proposal extracted" : "Proposal needs review", body: `${input.fileName} · ${extraction.changeSummary}` });
        await recalculateDecisionModel(input.roomId, userId);
        return { id: documentId, key: stored.key, url: stored.url, version, status: extraction.processingStatus, coverageMetric: extraction.coverageMetric, totalUnits: extraction.totalUnits, processedUnits: extraction.processedUnits };
      } catch (error) {
        await db.insert(documentVersions).values({ documentId, version, fileName: input.fileName, extractedText: "", extractedData: JSON.stringify({ error: error instanceof Error ? error.message : "Extraction failed" }), changeSummary: "Extraction failed", createdBy: userId });
        await db.update(documents).set({ processingStatus: "FAILED", failedUnits: 1, failedPages: 0 }).where(eq(documents.id, documentId));
        await db.insert(auditEvents).values({ roomId: input.roomId, actorId: userId, eventType: "DOCUMENT_EXTRACTION_FAILED", entityType: "document", entityId: documentId, payloadJson: JSON.stringify({ version, error: error instanceof Error ? error.message : "Extraction failed" }) });
        await db.insert(notifications).values({ userId, roomId: input.roomId, kind: "error", title: "Proposal extraction failed", body: `${input.fileName} could not be interpreted.` });
        return { id: documentId, key: stored.key, url: stored.url, version, status: "FAILED" as const, coverageMetric: "pages" as const, totalUnits: 0, processedUnits: 0 };
      }
    }),
    evidence: publicProcedure.input(roomInput).query(async ({ ctx, input }) => (await getRoomSnapshot(await assertRoomAccess(ctx, input.roomId)))?.evidence ?? []),
    evidenceById: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const row = await db.select({ evidence: evidenceTable }).from(evidenceTable).innerJoin(decisionRooms, eq(evidenceTable.roomId, decisionRooms.id)).where(and(eq(evidenceTable.id, input.id), eq(decisionRooms.ownerId, await actorId(ctx)))).limit(1);
      return row[0]?.evidence ?? null;
    }),
    risks: publicProcedure.input(roomInput).query(async ({ ctx, input }) => (await getRoomSnapshot(await assertRoomAccess(ctx, input.roomId)))?.risks ?? []),
    comparison: publicProcedure.input(roomInput).query(async ({ ctx, input }) => {
      const snapshot = await getRoomSnapshot(await assertRoomAccess(ctx, input.roomId));
      return { vendors: snapshot?.vendors ?? [], requirements: snapshot?.requirements ?? [], evaluations: snapshot?.evaluations ?? [] };
    }),
    decisionModel: publicProcedure.input(roomInput).query(async ({ ctx, input }) => {
      await assertRoomAccess(ctx, input.roomId);
      const model = await recalculateDecisionModel(input.roomId);
      const snapshot = await getRoomSnapshot(input.roomId);
      return { room: snapshot?.room ?? null, vendors: snapshot?.vendors ?? [], decision: snapshot?.decision ?? null, weights: snapshot?.requirements.map(item => Number(item.weight)) ?? [], ranking: model?.ranking ?? snapshot?.ranking ?? [], recommendation: model?.recommendation ?? null, explanations: model?.explanations ?? [] };
    }),
    auditTrail: publicProcedure.input(roomInput).query(async ({ ctx, input }) => (await getRoomSnapshot(await assertRoomAccess(ctx, input.roomId)))?.auditTrail ?? []),
    notifications: publicProcedure.query(async ({ ctx }) => { const roomId = await getRoomId(ctx); const snapshot = await getRoomSnapshot(roomId); const userId = await actorId(ctx); return (snapshot?.notifications ?? []).filter(notification => notification.userId === userId); }),
    search: publicProcedure.input(z.object({ roomId: z.number().int().positive(), query: z.string().max(120).default("") })).query(async ({ ctx, input }) => {
      const snapshot = await getRoomSnapshot(await assertRoomAccess(ctx, input.roomId));
      const query = input.query.trim().toLowerCase();
      if (!snapshot || !query) return [];
      const results: Array<{ id: string; label: string; meta: string; kind: string; evidenceId?: number }> = [];
      snapshot.vendors.filter(item => `${item.name} ${item.fitLabel || ""} ${item.note || ""}`.toLowerCase().includes(query)).forEach(item => results.push({ id: `vendor-${item.id}`, label: item.name, meta: `Vendor · ${item.fitLabel || "Profile"}`, kind: "vendor" }));
      snapshot.requirements.filter(item => `${item.name} ${item.category} ${item.normalizedConcept}`.toLowerCase().includes(query)).forEach(item => results.push({ id: `requirement-${item.id}`, label: item.name, meta: `Requirement · ${item.category}`, kind: "requirement" }));
      snapshot.documents.filter(item => `${item.name} ${item.documentType}`.toLowerCase().includes(query)).forEach(item => results.push({ id: `document-${item.id}`, label: item.name, meta: `Document · ${item.processingStatus}`, kind: "document" }));
      snapshot.evidence.filter(item => `${item.label} ${item.originalText || ""} ${item.interpretation || ""}`.toLowerCase().includes(query)).forEach(item => results.push({ id: `evidence-${item.id}`, label: item.label, meta: `Evidence · ${item.page ? `p.${item.page}` : "structured source"}`, kind: "evidence", evidenceId: item.id }));
      snapshot.risks.filter(item => `${item.title} ${item.explanation} ${item.category}`.toLowerCase().includes(query)).forEach(item => results.push({ id: `risk-${item.id}`, label: item.title, meta: `Risk · ${item.severity}`, kind: "risk" }));
      return results.slice(0, 20);
    }),
    markNotificationRead: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const userId = await actorId(ctx);
      const result = await markNotificationRead(input.id, userId);
      const db = await getDb();
      if (db) {
        const notification = (await db.select().from(notifications).where(and(eq(notifications.id, input.id), eq(notifications.userId, userId))).limit(1))[0];
        if (notification?.roomId) await db.insert(auditEvents).values({ roomId: notification.roomId, actorId: userId, eventType: "NOTIFICATION_READ", entityType: "notification", entityId: notification.id, payloadJson: JSON.stringify({}) });
      }
      return result;
    }),
    analystQuery: publicProcedure.input(z.object({ roomId: z.number().int().positive(), question: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      await assertRoomAccess(ctx, input.roomId);
      const userId = await actorId(ctx);
      const snapshot = await getRoomSnapshot(input.roomId);
      const fallback = deterministicAnswer(input.question, snapshot);
      try {
        const context = JSON.stringify({ vendors: snapshot?.vendors, requirements: snapshot?.requirements, evaluations: snapshot?.evaluations, evidence: snapshot?.evidence, risks: snapshot?.risks, documents: snapshot?.documents, decision: snapshot?.decision, weights: snapshot?.requirements.map(item => Number(item.weight)), ranking: snapshot?.ranking });
        const response = await invokeLLM({ messages: [{ role: "system", content: "You are Procure Logic, an evidence-first procurement analyst. Answer only from the supplied procurement model. Never invent prices, dates, features, certifications, terms, requirements, or evidence. Use UNKNOWN when absent, CONFLICT when sources disagree, and DERIVED when reasoning from supplied values. Return only valid JSON with an answer and sourceIds containing only evidence IDs that directly support the answer. If no supporting evidence exists, sourceIds must be [] and the answer must say: Supporting evidence was not found in the current evidence ledger." }, { role: "user", content: `Decision room procurement model:\n${context}\n\nQuestion: ${input.question}` }], response_format: { type: "json_schema", json_schema: { name: "procurement_answer", strict: true, schema: { type: "object", properties: { answer: { type: "string" }, sourceIds: { type: "array", items: { type: "integer" } } }, required: ["answer", "sourceIds"], additionalProperties: false } } } });
        const answerText = textFromContent(response.choices?.[0]?.message?.content);
        const parsed = JSON.parse(answerText) as { answer?: string; sourceIds?: number[] };
        const validEvidenceIds = new Set((snapshot?.evidence ?? []).map(item => item.id));
        const sourceIds = (parsed.sourceIds ?? []).filter(id => validEvidenceIds.has(id));
        if (parsed.answer?.trim()) return { answer: parsed.answer, sourceIds, grounded: true };
      } catch (error) {
        console.warn("[Analyst] LLM unavailable; using deterministic evidence answer", error);
      }
      const db = await getDb();
      if (db) await db.insert(auditEvents).values({ roomId: input.roomId, actorId: userId, eventType: "ANALYST_QUERY", entityType: "decision_room", entityId: input.roomId, payloadJson: JSON.stringify({ question: input.question, sourceIds: fallback.sourceIds }) });
      return { ...fallback, grounded: true };
    }),
    sync: publicProcedure.input(roomInput).mutation(async ({ input, ctx }) => {
      await assertRoomAccess(ctx, input.roomId);
      const userId = await actorId(ctx);
      await ensureSeedData(userId);
      const model = await recalculateDecisionModel(input.roomId, userId);
      const snapshot = await getRoomSnapshot(input.roomId);
      return { syncedAt: new Date(), evidenceCoverage: model?.coverage ?? snapshot?.room?.evidenceCoverage ?? "0", resolvedRequirements: model?.resolvedRequirements ?? snapshot?.room?.resolvedRequirements ?? 0, ranking: model?.ranking ?? snapshot?.ranking ?? [], status: "complete" as const };
    }),
    acceptDecision: publicProcedure.input(z.object({ roomId: z.number().int().positive(), vendorId: z.number().int().positive(), rationale: z.string().min(1).optional() })).mutation(async ({ ctx, input }) => { await assertRoomAccess(ctx, input.roomId); await assertVendorAccess(ctx, input.vendorId); return acceptDecision(input.roomId, input.vendorId, await actorId(ctx), input.rationale); }),
  }),
});

export type AppRouter = typeof appRouter;
