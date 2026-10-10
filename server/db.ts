import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditEvents,
  decisionRooms,
  decisions,
  documentVersions,
  documents,
  evidence,
  evaluationProfiles,
  notifications,
  requirementEvaluations,
  requirements,
  risks,
  users,
  vendors,
  commercialItems,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// In-memory persistent demo store when MySQL is unconfigured
interface MemoryStore {
  rooms: Array<{ id: number; ownerId: number; code: string; name: string; description: string | null; status: string; evidenceCoverage: string; resolvedRequirements: number; totalRequirements: number }>;
  vendors: Array<{ id: number; roomId: number; name: string; initials: string; fitLabel: string | null; score: string; comparableTco: string | null; delta: string | null; tone: string | null; note: string | null }>;
  requirements: Array<{ id: number; roomId: number; name: string; originalWording: string | null; normalizedConcept: string; category: string; weight: string; classification: string; source: string | null; status: string }>;
  evaluations: Array<{ id: number; requirementId: number; vendorId: number; normalizedValue: string; originalClaim: string | null; status: string; interpretation: string | null; evidenceStrength: string; confidence: string }>;
  documents: Array<{ id: number; roomId: number; vendorId: number; name: string; documentType: string; storageKey: string | null; processingStatus: string; totalPages: number; processedPages: number; reviewRequiredPages: number; totalUnits: number; processedUnits: number; reviewRequiredUnits: number; coverageMetric: string; latestVersion: string; uploadedBy: number; createdAt: Date; updatedAt: Date }>;
  documentVersions: Array<{ id: number; documentId: number; version: string; fileName: string; extractedText: string | null; extractedData: string | null; changeSummary: string | null; createdBy: number; createdAt: Date }>;
  evidence: Array<{ id: number; roomId: number; vendorId: number; documentId: number | null; documentVersionId: number | null; requirementId: number | null; label: string; normalizedValue: string; originalText: string; page: number | null; classification: string; evidenceStrength: string; completeness: string; confidence: string; interpretation: string; sourceDocument?: string }>;
  risks: Array<{ id: number; roomId: number; vendorId: number | null; evidenceId: number | null; severity: string; category: string; title: string; explanation: string; impact: string; recommendedAction: string; status: string }>;
  decisions: Array<{ id: number; roomId: number; selectedVendorId: number; status: string; acceptedBy: number | null; acceptedAt: Date | null; rationale: string; updatedAt: Date }>;
  notifications: Array<{ id: number; userId: number; roomId: number; kind: string; title: string; body: string | null; isRead: boolean; createdAt: Date }>;
  auditEvents: Array<{ id: number; roomId: number; actorId: number; eventType: string; entityType: string; entityId: number | null; payloadJson: string | null; createdAt: Date }>;
}

let memStore: MemoryStore | null = null;

export function getMemStore(userId: number = 1): MemoryStore {
  if (memStore) return memStore;
  const now = new Date();
  const room = { id: 1, ownerId: userId, code: "Q3", name: "ERP modernization", description: "Q3 vendor selection for the ERP modernization program", status: "active", evidenceCoverage: "91.00", resolvedRequirements: 5, totalRequirements: 6 };
  const vList = seedVendors.map((v, i) => ({ id: i + 1, roomId: 1, name: v.name, initials: v.initials, fitLabel: v.fitLabel, score: v.score, comparableTco: v.comparableTco, delta: v.delta, tone: v.tone, note: v.note }));
  const reqList = seedRequirements.map((r, i) => ({ id: i + 1, roomId: 1, name: r[0], category: r[1], weight: r[2], classification: r[3], originalWording: r[0], normalizedConcept: r[0], source: "Q3 ERP modernization RFP", status: "USER_CONFIRMED" }));
  const evals: MemoryStore["evaluations"] = [];
  seedRequirements.forEach((r, rIdx) => {
    const vals = [r[4], r[5], r[6]];
    const stats = [r[7], r[8], r[9]];
    vals.forEach((vVal, vIdx) => {
      evals.push({
        id: evals.length + 1,
        requirementId: rIdx + 1,
        vendorId: vIdx + 1,
        normalizedValue: vVal,
        originalClaim: vVal,
        status: stats[vIdx],
        interpretation: stats[vIdx] === "UNKNOWN" ? "The submitted documents do not contain enough information to confirm this value." : `Vendor claim is ${stats[vIdx].toLowerCase().replaceAll("_", " ")} against the requirement.`,
        evidenceStrength: stats[vIdx] === "UNKNOWN" ? "LOW" : "HIGH",
        confidence: "HIGH",
      });
    });
  });
  const docList = [
    { id: 1, roomId: 1, vendorId: 1, name: "Vertex_Proposal_v2.pdf", documentType: "Proposal", storageKey: null, processingStatus: "PROCESSED", totalPages: 47, processedPages: 47, reviewRequiredPages: 0, totalUnits: 47, processedUnits: 47, reviewRequiredUnits: 0, coverageMetric: "pages", latestVersion: "v2", uploadedBy: userId, createdAt: now, updatedAt: now },
    { id: 2, roomId: 1, vendorId: 2, name: "Northstar_RFP_Response.docx", documentType: "RFP response", storageKey: null, processingStatus: "PROCESSED", totalPages: 38, processedPages: 38, reviewRequiredPages: 0, totalUnits: 38, processedUnits: 38, reviewRequiredUnits: 0, coverageMetric: "pages", latestVersion: "v1", uploadedBy: userId, createdAt: now, updatedAt: now },
    { id: 3, roomId: 1, vendorId: 3, name: "AltoWorks_Commercial.xlsx", documentType: "Pricing workbook", storageKey: null, processingStatus: "REVIEW_REQUIRED", totalPages: 14, processedPages: 12, reviewRequiredPages: 2, totalUnits: 14, processedUnits: 12, reviewRequiredUnits: 2, coverageMetric: "pages", latestVersion: "v1", uploadedBy: userId, createdAt: now, updatedAt: now },
  ];
  const docVers = [
    { id: 1, documentId: 1, version: "v2", fileName: "Vertex_Proposal_v2.pdf", extractedText: "Seeded evidence context", extractedData: null, changeSummary: "Commercial revision detected", createdBy: userId, createdAt: now },
    { id: 2, documentId: 2, version: "v1", fileName: "Northstar_RFP_Response.docx", extractedText: "Seeded evidence context", extractedData: null, changeSummary: "No prior version", createdBy: userId, createdAt: now },
    { id: 3, documentId: 3, version: "v1", fileName: "AltoWorks_Commercial.xlsx", extractedText: "Seeded evidence context", extractedData: null, changeSummary: "2 pages require review", createdBy: userId, createdAt: now },
  ];
  const evList = seedEvidence.map((e, i) => ({
    id: i + 1,
    roomId: 1,
    vendorId: 1,
    documentId: 1,
    documentVersionId: 1,
    requirementId: i + 1,
    label: e[0],
    normalizedValue: e[1],
    classification: e[2],
    page: e[3],
    originalText: e[5],
    interpretation: e[6],
    evidenceStrength: e[2] === "UNKNOWN" ? "LOW" : "HIGH",
    completeness: e[2] === "UNKNOWN" ? "LOW" : "HIGH",
    confidence: "HIGH",
    sourceDocument: e[4],
  }));
  const riskList = seedRisks.map((rk, i) => ({
    id: i + 1,
    roomId: 1,
    vendorId: 1,
    evidenceId: i + 1,
    severity: rk[0],
    category: rk[1],
    title: rk[2],
    explanation: rk[3],
    impact: rk[4],
    recommendedAction: rk[5],
    status: "OPEN",
  }));
  const decList = [
    { id: 1, roomId: 1, selectedVendorId: 1, status: "DRAFT", acceptedBy: null, acceptedAt: null, rationale: "Recommend Vertex Systems—pending one commercial clarification.", updatedAt: now }
  ];
  const notifList = [
    { id: 1, userId, roomId: 1, kind: "evidence", title: "Evidence review required", body: "2 pages in AltoWorks_Commercial.xlsx", isRead: false, createdAt: now },
    { id: 2, userId, roomId: 1, kind: "risk", title: "Risk detected", body: "Vertex migration scope is still unknown", isRead: false, createdAt: now },
    { id: 3, userId, roomId: 1, kind: "model", title: "Decision model updated", body: "Vertex v2 changed implementation and SLA", isRead: false, createdAt: now },
  ];
  const auditList = [
    { id: 1, roomId: 1, actorId: userId, eventType: "DECISION_MODEL_RECALCULATED", entityType: "decision_room", entityId: 1, payloadJson: JSON.stringify({ coverage: 91, winner: "Vertex Systems", score: 86 }), createdAt: now },
    { id: 2, roomId: 1, actorId: userId, eventType: "SEED_CREATED", entityType: "decision_room", entityId: 1, payloadJson: JSON.stringify({ vendors: 3, requirements: 6 }), createdAt: now },
  ];
  memStore = {
    rooms: [room],
    vendors: vList,
    requirements: reqList,
    evaluations: evals,
    documents: docList,
    documentVersions: docVers,
    evidence: evList,
    risks: riskList,
    decisions: decList,
    notifications: notifList,
    auditEvents: auditList,
  };
  return memStore;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name ?? null, email: user.email ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { name: values.name, email: values.email, loginMethod: values.loginMethod, lastSignedIn: values.lastSignedIn };
  if (user.role || user.openId === ENV.ownerOpenId) {
    values.role = user.role ?? "admin";
    updateSet.role = values.role;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return { id: 1, openId, name: "Procure Logic Demo User", email: "demo@procure.logic", role: "admin" as const, loginMethod: "demo", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const seedVendors = [
  { name: "Vertex Systems", initials: "VS", fitLabel: "Best overall value", score: "86", comparableTco: "22.7", delta: "4.8", tone: "teal", note: "Strong fit, one open migration gap" },
  { name: "Northstar Cloud", initials: "NC", fitLabel: "Best technical fit", score: "82", comparableTco: "26.4", delta: "2.1", tone: "slate", note: "Highest security confidence" },
  { name: "AltoWorks", initials: "AW", fitLabel: "Lowest raw price", score: "74", comparableTco: "19.8", delta: "-5.6", tone: "terracotta", note: "Scope is not directly comparable" },
] as const;

const seedRequirements = [
  ["Comparable 3-year TCO", "Commercial", "25", "MANDATORY", "₹22.7L", "₹26.4L", "₹19.8L*", "MEETS", "MEETS", "UNKNOWN"],
  ["Technical fit & integrations", "Technical", "25", "MANDATORY", "9 / 10", "9.5 / 10", "7 / 10", "MEETS", "EXCEEDS", "MEETS"],
  ["Security & data residency", "Security", "20", "MANDATORY", "India region", "India region", "Unclear", "MEETS", "MEETS", "UNKNOWN"],
  ["Implementation in ≤ 60 days", "Delivery", "15", "HARD_CONSTRAINT", "45 days", "75 days", "60 days", "EXCEEDS", "DOES_NOT_MEET", "MEETS"],
  ["Support coverage", "Operations", "10", "PREFERRED", "24 / 7", "24 / 7", "Business hours", "MEETS", "MEETS", "RISK"],
  ["Sustainability disclosure", "Governance", "5", "PREFERRED", "Reported", "Reported", "Not found", "MEETS", "MEETS", "UNKNOWN"],
] as const;

const seedEvidence = [
  ["Service availability", "99.95%", "FACT", 14, "Vertex_Proposal_v2.pdf", "The platform will maintain 99.95% service availability, excluding scheduled maintenance.", "Exceeds required 99.9% uptime."],
  ["Implementation timeline", "45 days", "FACT", 22, "Vertex_Proposal_v2.pdf", "Target production cutover is planned within forty-five (45) calendar days from kickoff.", "Exceeds the 60-day hard constraint."],
  ["Historical data migration", "Unknown", "UNKNOWN", 18, "Vertex_Proposal_v2.pdf", "No explicit commitment or cost for historical data migration appears in the submitted commercial schedule.", "Open commercial gap. No estimate has been inferred."],
] as const;

const seedRisks = [
  ["HIGH", "Commercial", "Migration cost is not stated", "The proposal includes implementation but does not state whether historical data migration is included or priced separately.", "Financial impact cannot be determined from submitted documents.", "Ask for a fixed migration scope and cost before award.", 0],
  ["MEDIUM", "Contract", "Renewal increase is undefined", "The commercial schedule references annual renewal but does not specify a cap on price escalation.", "Future price exposure is unknown.", "Request an explicit renewal cap in the order form.", 1],
  ["MEDIUM", "Technical", "Backup retention needs confirmation", "Backup frequency is stated, but retention duration and restore testing are not present in submitted documents.", "Recovery posture cannot be fully assessed.", "Confirm retention window and recovery test cadence.", 2],
] as const;

export async function ensureSeedData(userId: number) {
  const db = await getDb();
  if (!db) {
    const store = getMemStore(userId);
    return store.rooms[0] as unknown as typeof decisionRooms.$inferSelect;
  }
  const existing = await db.select().from(decisionRooms).where(and(eq(decisionRooms.code, "Q3"), eq(decisionRooms.ownerId, userId))).limit(1);
  if (existing[0]) return existing[0];

  const roomResult = await db.insert(decisionRooms).values({ ownerId: userId, code: "Q3", name: "ERP modernization", description: "Q3 vendor selection for the ERP modernization program", status: "active", evidenceCoverage: "91", resolvedRequirements: 21, totalRequirements: 28 }).$returningId();
  const roomId = roomResult[0]?.id;
  if (!roomId) throw new Error("Unable to seed decision room");

  const vendorIds: number[] = [];
  for (const vendor of seedVendors) {
    const inserted = await db.insert(vendors).values({ roomId, ...vendor }).$returningId();
    if (inserted[0]?.id) vendorIds.push(inserted[0].id);
  }
  const [vertexId, northstarId, altoId] = vendorIds;

  const requirementIds: number[] = [];
  for (const [name, category, weight, classification] of seedRequirements) {
    const inserted = await db.insert(requirements).values({ roomId, name, originalWording: name, normalizedConcept: name, category, weight, classification, source: "Q3 ERP modernization RFP", status: "USER_CONFIRMED" }).$returningId();
    if (inserted[0]?.id) requirementIds.push(inserted[0].id);
  }
  for (let index = 0; index < seedRequirements.length; index++) {
    const row = seedRequirements[index];
    const [name, , , , vertexValue, northstarValue, altoValue, vertexStatus, northstarStatus, altoStatus] = row;
    const requirementId = requirementIds[index];
    if (!requirementId) continue;
    const evaluations = [[vertexId, vertexValue, vertexStatus], [northstarId, northstarValue, northstarStatus], [altoId, altoValue, altoStatus]] as const;
    for (const [vendorId, normalizedValue, status] of evaluations) {
      if (!vendorId) continue;
      await db.insert(requirementEvaluations).values({ requirementId, vendorId, normalizedValue, originalClaim: normalizedValue, status, interpretation: status === "UNKNOWN" ? "The submitted documents do not contain enough information to confirm this value." : `Vendor claim is ${status.toLowerCase().replaceAll("_", " ")} against the requirement.`, evidenceStrength: status === "UNKNOWN" ? "LOW" : "HIGH", confidence: status === "UNKNOWN" ? "HIGH" : "HIGH" });
    }
  }

  const documentIds: number[] = [];
  for (const [vendorId, name, documentType, version, changeSummary, totalPages, processedPages, reviewRequiredPages] of [
    [vertexId, "Vertex_Proposal_v2.pdf", "Proposal", "v2", "Commercial revision detected", 47, 47, 0],
    [northstarId, "Northstar_RFP_Response.docx", "RFP response", "v1", "No prior version", 38, 38, 0],
    [altoId, "AltoWorks_Commercial.xlsx", "Pricing workbook", "v1", "2 pages require review", 14, 12, 2],
  ] as const) {
    if (!vendorId) continue;
    const inserted = await db.insert(documents).values({ roomId, vendorId, name, documentType, processingStatus: reviewRequiredPages > 0 ? "REVIEW_REQUIRED" : "PROCESSED", totalPages, processedPages, reviewRequiredPages, latestVersion: version, uploadedBy: userId }).$returningId();
    const documentId = inserted[0]?.id;
    if (!documentId) continue;
    documentIds.push(documentId);
    await db.insert(documentVersions).values({ documentId, version, fileName: name, extractedText: `Seeded evidence context for ${name}`, extractedData: JSON.stringify({ totalPages, processedPages }), changeSummary, createdBy: userId });
  }
  const vertexDocumentId = documentIds[0];
  const evidenceIds: number[] = [];
  for (let index = 0; index < seedEvidence.length; index++) {
    const [label, normalizedValue, classification, page, source, originalText, interpretation] = seedEvidence[index];
    const inserted = await db.insert(evidence).values({ roomId, vendorId: vertexId, documentId: vertexDocumentId, requirementId: requirementIds[index], label, normalizedValue, originalText, page, classification, evidenceStrength: classification === "UNKNOWN" ? "LOW" : "HIGH", completeness: classification === "UNKNOWN" ? "LOW" : "HIGH", confidence: "HIGH", interpretation }).$returningId();
    if (inserted[0]?.id) evidenceIds.push(inserted[0].id);
  }
  for (const [severity, category, title, explanation, impact, recommendedAction, evidenceIndex] of seedRisks) {
    await db.insert(risks).values({ roomId, vendorId: vertexId, evidenceId: evidenceIds[evidenceIndex], severity, category, title, explanation, impact, recommendedAction, status: "OPEN" });
  }
  await db.insert(evaluationProfiles).values({ roomId, name: "Balanced evaluation", weightsJson: JSON.stringify([25, 25, 20, 15, 10, 5]), createdBy: userId, isActive: true });
  await db.insert(decisions).values({ roomId, selectedVendorId: vertexId, status: "DRAFT", rationale: "Recommend Vertex Systems—pending one commercial clarification." });
  await db.insert(notifications).values([
    { userId, roomId, kind: "evidence", title: "Evidence review required", body: "2 pages in AltoWorks_Commercial.xlsx" },
    { userId, roomId, kind: "risk", title: "Risk detected", body: "Vertex migration scope is still unknown" },
    { userId, roomId, kind: "model", title: "Decision model updated", body: "Vertex v2 changed implementation and SLA" },
  ]);
  await db.insert(auditEvents).values({ roomId, actorId: userId, eventType: "SEED_CREATED", entityType: "decision_room", entityId: roomId, payloadJson: JSON.stringify({ vendors: vendorIds.length, requirements: requirementIds.length }) });
  return (await db.select().from(decisionRooms).where(eq(decisionRooms.id, roomId)).limit(1))[0];
}

export async function getRoomSnapshot(roomId: number) {
  const db = await getDb();
  if (!db) {
    const store = getMemStore(1);
    const room = store.rooms.find(r => r.id === roomId) || store.rooms[0];
    if (!room) return null;
    const roomVendors = store.vendors.filter(v => v.roomId === room.id);
    const roomRequirements = store.requirements.filter(r => r.roomId === room.id);
    const roomDocuments = store.documents.filter(d => d.roomId === room.id);
    const roomEvidence = store.evidence.filter(e => e.roomId === room.id);
    const roomRisks = store.risks.filter(rk => rk.roomId === room.id);
    const roomNotifications = store.notifications.filter(n => n.roomId === room.id);
    const roomDecision = store.decisions.find(d => d.roomId === room.id) ?? null;
    const roomAudit = store.auditEvents.filter(a => a.roomId === room.id);
    const evaluations = store.evaluations.filter(ev => roomRequirements.some(r => r.id === ev.requirementId));
    const ranking = [...roomVendors].sort((left, right) => Number(right.score) - Number(left.score)).map((vendor, index) => ({ vendorId: vendor.id, rank: index + 1, score: Number(vendor.score) }));
    const evidenceWithSources = roomEvidence.map(item => ({ ...item, sourceDocument: (item.sourceDocument || roomDocuments.find(document => document.id === item.documentId)?.name) ?? "Evidence ledger" }));
    return {
      room: room as unknown as typeof decisionRooms.$inferSelect,
      vendors: roomVendors as unknown as Array<typeof vendors.$inferSelect>,
      requirements: roomRequirements as unknown as Array<typeof requirements.$inferSelect>,
      documents: roomDocuments as unknown as Array<typeof documents.$inferSelect>,
      evidence: evidenceWithSources as unknown as Array<typeof evidence.$inferSelect & { sourceDocument: string }>,
      risks: roomRisks as unknown as Array<typeof risks.$inferSelect>,
      notifications: roomNotifications as unknown as Array<typeof notifications.$inferSelect>,
      decision: roomDecision as unknown as typeof decisions.$inferSelect | null,
      auditTrail: roomAudit as unknown as Array<typeof auditEvents.$inferSelect>,
      evaluations: evaluations as unknown as Array<typeof requirementEvaluations.$inferSelect>,
      ranking
    };
  }
  const [room, roomVendors, roomRequirements, roomDocuments, roomEvidence, roomRisks, roomNotifications, roomDecision, roomAudit] = await Promise.all([
    db.select().from(decisionRooms).where(eq(decisionRooms.id, roomId)).limit(1),
    db.select().from(vendors).where(eq(vendors.roomId, roomId)),
    db.select().from(requirements).where(eq(requirements.roomId, roomId)),
    db.select().from(documents).where(eq(documents.roomId, roomId)),
    db.select().from(evidence).where(eq(evidence.roomId, roomId)),
    db.select().from(risks).where(eq(risks.roomId, roomId)),
    db.select().from(notifications).where(eq(notifications.roomId, roomId)).orderBy(desc(notifications.createdAt)),
    db.select().from(decisions).where(eq(decisions.roomId, roomId)).orderBy(desc(decisions.updatedAt)).limit(1),
    db.select().from(auditEvents).where(eq(auditEvents.roomId, roomId)).orderBy(desc(auditEvents.createdAt)).limit(50),
  ]);
  if (!room[0]) return null;
  const evaluations = roomRequirements.length ? await db.select().from(requirementEvaluations).where(inArray(requirementEvaluations.requirementId, roomRequirements.map(item => item.id))) : [];
  const ranking = [...roomVendors].sort((left, right) => Number(right.score) - Number(left.score)).map((vendor, index) => ({ vendorId: vendor.id, rank: index + 1, score: Number(vendor.score) }));
  const evidenceWithSources = roomEvidence.map(item => ({ ...item, sourceDocument: roomDocuments.find(document => document.id === item.documentId)?.name ?? "Evidence ledger" }));
  return { room: room[0], vendors: roomVendors, requirements: roomRequirements, documents: roomDocuments, evidence: evidenceWithSources, risks: roomRisks, notifications: roomNotifications, decision: roomDecision[0] ?? null, auditTrail: roomAudit, evaluations, ranking };
}

export async function recalculateDecisionModel(roomId: number, actorId?: number) {
  const db = await getDb();
  if (!db) {
    const store = getMemStore(actorId || 1);
    const roomRequirements = store.requirements.filter(r => r.roomId === roomId);
    const roomVendors = store.vendors.filter(v => v.roomId === roomId);
    const roomDocuments = store.documents.filter(d => d.roomId === roomId);
    const evaluations = store.evaluations.filter(ev => roomRequirements.some(r => r.id === ev.requirementId));
    const scoreFor = (status: string) => ({ EXCEEDS: 1, MEETS: 0.9, RISK: 0.3, DOES_NOT_MEET: 0, CONFLICT: 0 } as Record<string, number>)[status];
    const explanations = roomVendors.map(vendor => {
      let knownWeighted = 0;
      let knownWeight = 0;
      let unknownWeight = 0;
      const hardConstraintViolations: number[] = [];
      const mandatoryUnknowns: number[] = [];
      const mandatoryFailures: number[] = [];
      const preferredUnknowns: number[] = [];
      const contributions = roomRequirements.map(requirement => {
        const evaluation = evaluations.find(item => item.requirementId === requirement.id && item.vendorId === vendor.id);
        const weight = Number(requirement.weight);
        const status = evaluation?.status || "UNKNOWN";
        const numeric = scoreFor(status);
        if (numeric === undefined) unknownWeight += weight; else { knownWeight += weight; knownWeighted += weight * numeric; }
        if (requirement.classification === "HARD_CONSTRAINT" && ["DOES_NOT_MEET", "RISK", "CONFLICT"].includes(status)) hardConstraintViolations.push(requirement.id);
        if (requirement.classification === "MANDATORY" && status === "UNKNOWN") mandatoryUnknowns.push(requirement.id);
        if (requirement.classification === "MANDATORY" && ["DOES_NOT_MEET", "RISK", "CONFLICT"].includes(status)) mandatoryFailures.push(requirement.id);
        if (requirement.classification === "PREFERRED" && status === "UNKNOWN") preferredUnknowns.push(requirement.id);
        return { requirementId: requirement.id, requirement: requirement.name, classification: requirement.classification, weight, status, scoreContribution: numeric === undefined ? null : Number((weight * numeric).toFixed(2)), unknown: numeric === undefined, constraintViolation: requirement.classification === "HARD_CONSTRAINT" && ["DOES_NOT_MEET", "RISK", "CONFLICT"].includes(status), evidence: evaluation?.originalClaim || null };
      });
      const knownScore = knownWeight ? Number(((knownWeighted / knownWeight) * 100).toFixed(2)) : 0;
      vendor.score = knownScore.toFixed(2);
      return { vendorId: vendor.id, knownScore, knownWeight, unknownWeight, hardConstraintViolations, mandatoryUnknowns, mandatoryFailures, preferredUnknowns, eligible: hardConstraintViolations.length === 0 && mandatoryFailures.length === 0 && mandatoryUnknowns.length === 0, contributions };
    });
    const resolvedRequirements = roomRequirements.filter(requirement => {
      const rows = evaluations.filter(item => item.requirementId === requirement.id);
      return rows.length > 0 && rows.every(item => item.status !== "UNKNOWN" && item.status !== "CONFLICT");
    }).length;
    const totalUnits = roomDocuments.reduce((sum, item) => sum + (item.totalUnits || item.totalPages), 0);
    const processedUnits = roomDocuments.reduce((sum, item) => sum + (item.processedUnits || item.processedPages), 0);
    const coverage = totalUnits ? Number(((processedUnits / totalUnits) * 100).toFixed(2)) : 0;
    const activeRoom = store.rooms.find(r => r.id === roomId);
    if (activeRoom) {
      activeRoom.evidenceCoverage = coverage.toFixed(2);
      activeRoom.resolvedRequirements = resolvedRequirements;
      activeRoom.totalRequirements = roomRequirements.length;
    }
    const rankedVendors = [...explanations].sort((left, right) => Number(right.eligible) - Number(left.eligible) || right.knownScore - left.knownScore).map((vendor, index) => ({ vendorId: vendor.vendorId, rank: index + 1, score: vendor.knownScore, eligible: vendor.eligible, hardConstraintViolations: vendor.hardConstraintViolations, mandatoryFailures: vendor.mandatoryFailures, mandatoryUnknowns: vendor.mandatoryUnknowns, preferredUnknowns: vendor.preferredUnknowns }));
    const winner = explanations.find(item => item.vendorId === rankedVendors[0]?.vendorId);
    const qualification = winner && winner.eligible ? "Qualified under current criteria." : "Recommended under current evaluation criteria; resolve blocking uncertainty before award.";
    const alternative = rankedVendors[1] ? { vendorId: rankedVendors[1].vendorId, score: rankedVendors[1].score } : null;
    const recommendation = { vendorId: winner?.vendorId ?? null, score: winner?.knownScore ?? 0, qualification, blockingIssues: winner ? [...winner.hardConstraintViolations, ...winner.mandatoryFailures, ...winner.mandatoryUnknowns] : [], hardConstraintViolations: winner?.hardConstraintViolations ?? [], mandatoryUnknowns: winner?.mandatoryUnknowns ?? [], majorRisks: winner?.mandatoryFailures ?? [], decisionDrivers: winner?.contributions.filter(item => item.scoreContribution !== null).sort((a, b) => Number(b.scoreContribution) - Number(a.scoreContribution)).slice(0, 3) ?? [], tradeoffs: winner?.contributions.filter(item => item.unknown || item.constraintViolation).slice(0, 5) ?? [], alternative };
    if (actorId) {
      store.auditEvents.unshift({ id: store.auditEvents.length + 1, roomId, actorId, eventType: "DECISION_MODEL_RECALCULATED", entityType: "decision_room", entityId: roomId, payloadJson: JSON.stringify({ coverage, resolvedRequirements, ranking: rankedVendors, recommendation }), createdAt: new Date() });
    }
    return { coverage, resolvedRequirements, totalRequirements: roomRequirements.length, ranking: rankedVendors, explanations, recommendation };
  }
  const [roomRequirements, roomVendors, roomDocuments] = await Promise.all([
    db.select().from(requirements).where(eq(requirements.roomId, roomId)),
    db.select().from(vendors).where(eq(vendors.roomId, roomId)),
    db.select().from(documents).where(eq(documents.roomId, roomId)),
  ]);
  const evaluations = roomRequirements.length ? await db.select().from(requirementEvaluations).where(inArray(requirementEvaluations.requirementId, roomRequirements.map(item => item.id))) : [];
  const scoreFor = (status: string) => ({ EXCEEDS: 1, MEETS: 0.9, RISK: 0.3, DOES_NOT_MEET: 0, CONFLICT: 0 } as Record<string, number>)[status];
  const explanations = roomVendors.map(vendor => {
    let knownWeighted = 0;
    let knownWeight = 0;
    let unknownWeight = 0;
    const hardConstraintViolations: number[] = [];
    const mandatoryUnknowns: number[] = [];
    const mandatoryFailures: number[] = [];
    const preferredUnknowns: number[] = [];
    const contributions = roomRequirements.map(requirement => {
      const evaluation = evaluations.find(item => item.requirementId === requirement.id && item.vendorId === vendor.id);
      const weight = Number(requirement.weight);
      const status = evaluation?.status || "UNKNOWN";
      const numeric = scoreFor(status);
      if (numeric === undefined) unknownWeight += weight; else { knownWeight += weight; knownWeighted += weight * numeric; }
      if (requirement.classification === "HARD_CONSTRAINT" && ["DOES_NOT_MEET", "RISK", "CONFLICT"].includes(status)) hardConstraintViolations.push(requirement.id);
      if (requirement.classification === "MANDATORY" && status === "UNKNOWN") mandatoryUnknowns.push(requirement.id);
      if (requirement.classification === "MANDATORY" && ["DOES_NOT_MEET", "RISK", "CONFLICT"].includes(status)) mandatoryFailures.push(requirement.id);
      if (requirement.classification === "PREFERRED" && status === "UNKNOWN") preferredUnknowns.push(requirement.id);
      return { requirementId: requirement.id, requirement: requirement.name, classification: requirement.classification, weight, status, scoreContribution: numeric === undefined ? null : Number((weight * numeric).toFixed(2)), unknown: numeric === undefined, constraintViolation: requirement.classification === "HARD_CONSTRAINT" && ["DOES_NOT_MEET", "RISK", "CONFLICT"].includes(status), evidence: evaluation?.originalClaim || null };
    });
    const knownScore = knownWeight ? Number(((knownWeighted / knownWeight) * 100).toFixed(2)) : 0;
    return { vendorId: vendor.id, knownScore, knownWeight, unknownWeight, hardConstraintViolations, mandatoryUnknowns, mandatoryFailures, preferredUnknowns, eligible: hardConstraintViolations.length === 0 && mandatoryFailures.length === 0 && mandatoryUnknowns.length === 0, contributions };
  });
  for (const explanation of explanations) await db.update(vendors).set({ score: explanation.knownScore.toFixed(2) }).where(eq(vendors.id, explanation.vendorId));
  const resolvedRequirements = roomRequirements.filter(requirement => {
    const rows = evaluations.filter(item => item.requirementId === requirement.id);
    return rows.length > 0 && rows.every(item => item.status !== "UNKNOWN" && item.status !== "CONFLICT");
  }).length;
  const totalUnits = roomDocuments.reduce((sum, item) => sum + (item.totalUnits || item.totalPages), 0);
  const processedUnits = roomDocuments.reduce((sum, item) => sum + (item.processedUnits || item.processedPages), 0);
  const coverage = totalUnits ? Number(((processedUnits / totalUnits) * 100).toFixed(2)) : 0;
  await db.update(decisionRooms).set({ evidenceCoverage: coverage.toFixed(2), resolvedRequirements, totalRequirements: roomRequirements.length }).where(eq(decisionRooms.id, roomId));
  const rankedVendors = [...explanations].sort((left, right) => Number(right.eligible) - Number(left.eligible) || right.knownScore - left.knownScore).map((vendor, index) => ({ vendorId: vendor.vendorId, rank: index + 1, score: vendor.knownScore, eligible: vendor.eligible, hardConstraintViolations: vendor.hardConstraintViolations, mandatoryFailures: vendor.mandatoryFailures, mandatoryUnknowns: vendor.mandatoryUnknowns, preferredUnknowns: vendor.preferredUnknowns }));
  const winner = explanations.find(item => item.vendorId === rankedVendors[0]?.vendorId);
  const qualification = winner && winner.eligible ? "Qualified under current criteria." : "Recommended under current evaluation criteria; resolve blocking uncertainty before award.";
  const alternative = rankedVendors[1] ? { vendorId: rankedVendors[1].vendorId, score: rankedVendors[1].score } : null;
  const recommendation = { vendorId: winner?.vendorId ?? null, score: winner?.knownScore ?? 0, qualification, blockingIssues: winner ? [...winner.hardConstraintViolations, ...winner.mandatoryFailures, ...winner.mandatoryUnknowns] : [], hardConstraintViolations: winner?.hardConstraintViolations ?? [], mandatoryUnknowns: winner?.mandatoryUnknowns ?? [], majorRisks: winner?.mandatoryFailures ?? [], decisionDrivers: winner?.contributions.filter(item => item.scoreContribution !== null).sort((a, b) => Number(b.scoreContribution) - Number(a.scoreContribution)).slice(0, 3) ?? [], tradeoffs: winner?.contributions.filter(item => item.unknown || item.constraintViolation).slice(0, 5) ?? [], alternative };
  if (actorId) await db.insert(auditEvents).values({ roomId, actorId, eventType: "DECISION_MODEL_RECALCULATED", entityType: "decision_room", entityId: roomId, payloadJson: JSON.stringify({ coverage, resolvedRequirements, ranking: rankedVendors, recommendation }) });
  return { coverage, resolvedRequirements, totalRequirements: roomRequirements.length, ranking: rankedVendors, explanations, recommendation };
}

export async function updateRequirementWeight(requirementId: number, weight: number, actorId: number) {
  const db = await getDb();
  if (!db) {
    const store = getMemStore(actorId);
    const req = store.requirements.find(r => r.id === requirementId);
    if (req) {
      req.weight = weight.toFixed(2);
      store.auditEvents.unshift({ id: store.auditEvents.length + 1, roomId: req.roomId, actorId, eventType: "REQUIREMENT_WEIGHT_UPDATED", entityType: "requirement", entityId: requirementId, payloadJson: JSON.stringify({ weight }), createdAt: new Date() });
      await recalculateDecisionModel(req.roomId, actorId);
      return req as unknown as typeof requirements.$inferSelect;
    }
    return null;
  }
  await db.update(requirements).set({ weight: weight.toFixed(2) }).where(eq(requirements.id, requirementId));
  const requirement = (await db.select().from(requirements).where(eq(requirements.id, requirementId)).limit(1))[0];
  if (requirement) {
    await db.insert(auditEvents).values({ roomId: requirement.roomId, actorId, eventType: "REQUIREMENT_WEIGHT_UPDATED", entityType: "requirement", entityId: requirementId, payloadJson: JSON.stringify({ weight }) });
    await recalculateDecisionModel(requirement.roomId, actorId);
  }
  return requirement;
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    const store = getMemStore(userId);
    const notif = store.notifications.find(n => n.id === notificationId && n.userId === userId);
    if (notif) notif.isRead = true;
    return true;
  }
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  return true;
}

export async function acceptDecision(roomId: number, vendorId: number, actorId: number, rationale?: string) {
  const db = await getDb();
  if (!db) {
    const store = getMemStore(actorId);
    const decisionRationale = rationale || "Accepted by the procurement team after reviewing current evidence.";
    const existing = store.decisions.find(d => d.roomId === roomId);
    const now = new Date();
    if (existing) {
      existing.selectedVendorId = vendorId;
      existing.status = "ACCEPTED";
      existing.acceptedBy = actorId;
      existing.acceptedAt = now;
      existing.rationale = decisionRationale;
      existing.updatedAt = now;
    } else {
      store.decisions.push({ id: store.decisions.length + 1, roomId, selectedVendorId: vendorId, status: "ACCEPTED", acceptedBy: actorId, acceptedAt: now, rationale: decisionRationale, updatedAt: now });
    }
    store.auditEvents.unshift({ id: store.auditEvents.length + 1, roomId, actorId, eventType: "DECISION_ACCEPTED", entityType: "vendor", entityId: vendorId, payloadJson: JSON.stringify({ vendorId, rationale: decisionRationale }), createdAt: now });
    return true;
  }
  const decisionRationale = rationale || "Accepted by the procurement team after reviewing current evidence.";
  await db.insert(decisions).values({ roomId, selectedVendorId: vendorId, status: "ACCEPTED", acceptedBy: actorId, acceptedAt: new Date(), rationale: decisionRationale });
  await db.insert(auditEvents).values({ roomId, actorId, eventType: "DECISION_ACCEPTED", entityType: "vendor", entityId: vendorId, payloadJson: JSON.stringify({ vendorId, rationale: decisionRationale }) });
  return true;
}


export type DocumentFactInput = {
  concept: string;
  category: string;
  normalizedValue: string | null;
  originalText: string;
  location: string;
  classification: "FACT" | "UNKNOWN" | "CONFLICT";
};

function evaluationStatus(requirement: typeof requirements.$inferSelect, fact: DocumentFactInput) {
  if (fact.classification === "UNKNOWN") return "UNKNOWN" as const;
  if (fact.classification === "CONFLICT") return "CONFLICT" as const;
  const requirementText = `${requirement.name} ${requirement.normalizedConcept}`.toLowerCase();
  const value = fact.normalizedValue || "";
  const requirementPercent = requirementText.match(/(\d+(?:\.\d+)?)\s*%/i)?.[1];
  const factPercent = value.match(/(\d+(?:\.\d+)?)\s*%/i)?.[1];
  const requirementDays = requirementText.match(/(?:≤|<=|under|within)\s*(\d+)\s*days?/i)?.[1];
  const factDays = value.match(/(\d+)\s*(?:calendar\s+)?days?/i)?.[1];
  if (requirementPercent && factPercent) return Number(factPercent) >= Number(requirementPercent) ? "EXCEEDS" as const : "DOES_NOT_MEET" as const;
  if (requirementDays && factDays) return Number(factDays) <= Number(requirementDays) ? "EXCEEDS" as const : "DOES_NOT_MEET" as const;
  return "MEETS" as const;
}

export async function processDocumentFacts(roomId: number, vendorId: number, documentId: number, documentVersionId: number, facts: DocumentFactInput[], actorId: number) {
  const db = await getDb();
  if (!db) return { evidenceIds: [], evaluations: 0, risks: 0 };
  const roomRequirements = await db.select().from(requirements).where(eq(requirements.roomId, roomId));
  const evidenceIds: number[] = [];
  let evaluations = 0;
  let risksCreated = 0;
  const existingFacts = await db.select().from(evidence).where(and(eq(evidence.roomId, roomId), eq(evidence.vendorId, vendorId)));
  for (const fact of facts) {
    const priorValues = existingFacts.filter(item => item.label.toLowerCase() === fact.concept.toLowerCase() && item.classification !== "UNKNOWN").map(item => (item.normalizedValue || "").trim().toLowerCase()).filter(Boolean);
    const incomingValue = (fact.normalizedValue || "").trim().toLowerCase();
    const hasConflict = fact.classification === "FACT" && Boolean(incomingValue) && priorValues.some(value => value !== incomingValue);
    const effectiveFact = hasConflict ? { ...fact, classification: "CONFLICT" as const } : fact;
    const matchingRequirements = roomRequirements.filter(requirement => {
      const haystack = `${requirement.name} ${requirement.normalizedConcept} ${requirement.category}`.toLowerCase();
      return haystack.includes(fact.concept.toLowerCase()) || fact.concept.toLowerCase().includes(requirement.normalizedConcept.toLowerCase());
    });
    const targets = matchingRequirements.length ? matchingRequirements : [null];
    for (const requirement of targets) {
      const inserted = await db.insert(evidence).values({ roomId, vendorId, documentId, documentVersionId, requirementId: requirement?.id, label: effectiveFact.concept, normalizedValue: effectiveFact.normalizedValue || "UNKNOWN", originalText: effectiveFact.originalText, page: Number(effectiveFact.location.match(/page:(\d+)/i)?.[1]) || null, classification: effectiveFact.classification, evidenceStrength: effectiveFact.classification === "UNKNOWN" ? "LOW" : effectiveFact.classification === "CONFLICT" ? "LOW" : "MEDIUM", completeness: effectiveFact.classification === "UNKNOWN" || effectiveFact.classification === "CONFLICT" ? "LOW" : "HIGH", confidence: "HIGH", interpretation: effectiveFact.classification === "UNKNOWN" ? "UNKNOWN: no explicit source statement was found." : effectiveFact.classification === "CONFLICT" ? "CONFLICT: source values disagree for this procurement concept." : `Exact source wording preserved from ${effectiveFact.location}; procurement interpretation is deterministic and evidence-based.` }).$returningId();
      const evidenceId = inserted[0]?.id;
      if (evidenceId) evidenceIds.push(evidenceId);
      if (!requirement) continue;
      const status = evaluationStatus(requirement, effectiveFact);
      const existing = (await db.select().from(requirementEvaluations).where(and(eq(requirementEvaluations.requirementId, requirement.id), eq(requirementEvaluations.vendorId, vendorId))).limit(1))[0];
      const values = { normalizedValue: effectiveFact.normalizedValue || "UNKNOWN", originalClaim: effectiveFact.originalText, status, interpretation: status === "UNKNOWN" ? "UNKNOWN: the source does not provide enough information." : status === "CONFLICT" ? "CONFLICT: source values disagree and require human resolution." : status === "DOES_NOT_MEET" ? "Hard or ordinary requirement is not met by the extracted claim." : `Source claim ${status.toLowerCase().replaceAll("_", " ")} the requirement.`, evidenceStrength: effectiveFact.classification === "UNKNOWN" || effectiveFact.classification === "CONFLICT" ? "LOW" as const : "MEDIUM" as const, confidence: "HIGH" as const };
      if (existing) await db.update(requirementEvaluations).set(values).where(eq(requirementEvaluations.id, existing.id));
      else await db.insert(requirementEvaluations).values({ requirementId: requirement.id, vendorId, ...values });
      evaluations += 1;
      if (status === "CONFLICT") {
        await db.insert(risks).values({ roomId, vendorId, evidenceId, severity: "HIGH", category: "Conflict", title: `${requirement.name} has conflicting source values`, explanation: "Multiple source statements disagree for this requirement; no value has been selected automatically.", impact: "The vendor cannot be scored as unconditionally qualified until a human resolves the conflict.", recommendedAction: "Review the cited documents and record the authoritative source.", status: "OPEN" });
        risksCreated += 1;
      } else if (requirement.classification === "HARD_CONSTRAINT" && status === "DOES_NOT_MEET") {
        await db.insert(risks).values({ roomId, vendorId, evidenceId, severity: "HIGH", category: "Hard constraint", title: `${requirement.name} is not met`, explanation: `The extracted claim ${fact.normalizedValue || "UNKNOWN"} does not satisfy the hard constraint.`, impact: "Vendor must not be treated as an unquestioned winner.", recommendedAction: "Confirm whether the requirement is truly binding before award.", status: "OPEN" });
        risksCreated += 1;
      } else if (requirement.classification === "MANDATORY" && status === "UNKNOWN") {
        await db.insert(risks).values({ roomId, vendorId, evidenceId, severity: "HIGH", category: "Mandatory unknown", title: `${requirement.name} remains unknown`, explanation: "No explicit source statement was found for this mandatory requirement.", impact: "The recommendation is conditional until the vendor provides evidence.", recommendedAction: "Request a direct written confirmation from the vendor.", status: "OPEN" });
        risksCreated += 1;
      }
    }
  }
  await db.insert(auditEvents).values({ roomId, actorId, eventType: "DOCUMENT_FACTS_IDENTIFIED", entityType: "document_version", entityId: documentVersionId, payloadJson: JSON.stringify({ evidenceIds, evaluations, risksCreated }) });
  return { evidenceIds, evaluations, risks: risksCreated };
}
