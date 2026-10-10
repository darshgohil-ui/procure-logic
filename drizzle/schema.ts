import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const decisionRooms = mysqlTable("decision_rooms", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  evidenceCoverage: decimal("evidenceCoverage", { precision: 5, scale: 2 }).default("0").notNull(),
  resolvedRequirements: int("resolvedRequirements").default(0).notNull(),
  totalRequirements: int("totalRequirements").default(0).notNull(),
  activeVendorId: int("activeVendorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  name: varchar("name", { length: 255 }).notNull(),
  initials: varchar("initials", { length: 8 }).notNull(),
  fitLabel: varchar("fitLabel", { length: 255 }),
  score: decimal("score", { precision: 5, scale: 2 }).default("0").notNull(),
  comparableTco: decimal("comparableTco", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("INR").notNull(),
  delta: decimal("delta", { precision: 6, scale: 2 }),
  note: text("note"),
  tone: varchar("tone", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  name: varchar("name", { length: 255 }).notNull(),
  documentType: varchar("documentType", { length: 64 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }),
  storageUrl: varchar("storageUrl", { length: 1024 }),
  mimeType: varchar("mimeType", { length: 128 }),
  processingStatus: mysqlEnum("processingStatus", ["UPLOADING", "PROCESSING", "PROCESSED", "REVIEW_REQUIRED", "FAILED"]).default("UPLOADING").notNull(),
  totalPages: int("totalPages").default(0).notNull(),
  processedPages: int("processedPages").default(0).notNull(),
  failedPages: int("failedPages").default(0).notNull(),
  reviewRequiredPages: int("reviewRequiredPages").default(0).notNull(),
  coverageMetric: varchar("coverageMetric", { length: 32 }).default("pages").notNull(),
  totalUnits: int("totalUnits").default(0).notNull(),
  processedUnits: int("processedUnits").default(0).notNull(),
  failedUnits: int("failedUnits").default(0).notNull(),
  reviewRequiredUnits: int("reviewRequiredUnits").default(0).notNull(),
  latestVersion: varchar("latestVersion", { length: 32 }).default("v1").notNull(),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documentVersions = mysqlTable("document_versions", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull().references(() => documents.id),
  version: varchar("version", { length: 32 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  extractedText: text("extractedText"),
  extractedData: text("extractedData"),
  changeSummary: text("changeSummary"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const requirements = mysqlTable("requirements", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  name: varchar("name", { length: 255 }).notNull(),
  originalWording: text("originalWording"),
  normalizedConcept: varchar("normalizedConcept", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  classification: mysqlEnum("classification", ["MANDATORY", "PREFERRED", "HARD_CONSTRAINT"]).default("PREFERRED").notNull(),
  weight: decimal("weight", { precision: 5, scale: 2 }).default("0").notNull(),
  source: varchar("source", { length: 512 }),
  status: mysqlEnum("status", ["AI_SUGGESTED", "USER_CONFIRMED"]).default("USER_CONFIRMED").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const requirementEvaluations = mysqlTable("requirement_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  requirementId: int("requirementId").notNull().references(() => requirements.id),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  normalizedValue: varchar("normalizedValue", { length: 255 }),
  originalClaim: text("originalClaim"),
  status: mysqlEnum("status", ["EXCEEDS", "MEETS", "UNKNOWN", "RISK", "DOES_NOT_MEET", "CONFLICT"]).notNull(),
  interpretation: text("interpretation"),
  evidenceStrength: mysqlEnum("evidenceStrength", ["HIGH", "MEDIUM", "LOW"]).default("MEDIUM").notNull(),
  confidence: mysqlEnum("confidence", ["HIGH", "MEDIUM", "LOW"]).default("MEDIUM").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  documentId: int("documentId").notNull().references(() => documents.id),
  documentVersionId: int("documentVersionId").references(() => documentVersions.id),
  requirementId: int("requirementId").references(() => requirements.id),
  label: varchar("label", { length: 255 }).notNull(),
  normalizedValue: varchar("normalizedValue", { length: 255 }),
  originalText: text("originalText"),
  page: int("page"),
  classification: mysqlEnum("classification", ["FACT", "DERIVED", "INFERENCE", "UNKNOWN", "RISK", "CONFLICT"]).default("FACT").notNull(),
  evidenceStrength: mysqlEnum("evidenceStrength", ["HIGH", "MEDIUM", "LOW"]).default("MEDIUM").notNull(),
  completeness: mysqlEnum("completeness", ["HIGH", "MEDIUM", "LOW"]).default("MEDIUM").notNull(),
  confidence: mysqlEnum("confidence", ["HIGH", "MEDIUM", "LOW"]).default("MEDIUM").notNull(),
  interpretation: text("interpretation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const commercialItems = mysqlTable("commercial_items", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  documentId: int("documentId").references(() => documents.id),
  category: varchar("category", { length: 128 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("INR").notNull(),
  periodMonths: int("periodMonths"),
  classification: mysqlEnum("classification", ["EXPLICIT", "DERIVED", "USER_ASSUMPTION", "UNKNOWN"]).default("EXPLICIT").notNull(),
  included: boolean("included").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tcoCalculations = mysqlTable("tco_calculations", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  horizonYears: int("horizonYears").notNull(),
  knownCosts: decimal("knownCosts", { precision: 12, scale: 2 }).notNull(),
  estimatedTotal: decimal("estimatedTotal", { precision: 12, scale: 2 }),
  unknownCosts: text("unknownCosts"),
  assumptions: text("assumptions"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});

export const risks = mysqlTable("risks", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  vendorId: int("vendorId").references(() => vendors.id),
  evidenceId: int("evidenceId").references(() => evidence.id),
  severity: mysqlEnum("severity", ["CRITICAL", "HIGH", "MEDIUM", "LOW"]).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  explanation: text("explanation").notNull(),
  impact: text("impact"),
  recommendedAction: text("recommendedAction"),
  status: mysqlEnum("status", ["OPEN", "MITIGATED", "ACCEPTED"]).default("OPEN").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const clarificationQuestions = mysqlTable("clarification_questions", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  vendorId: int("vendorId").references(() => vendors.id),
  evidenceId: int("evidenceId").references(() => evidence.id),
  question: text("question").notNull(),
  status: mysqlEnum("status", ["OPEN", "SENT", "ANSWERED", "CLOSED"]).default("OPEN").notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const evaluationProfiles = mysqlTable("evaluation_profiles", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  name: varchar("name", { length: 255 }).notNull(),
  weightsJson: text("weightsJson").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  actorId: int("actorId").notNull().references(() => users.id),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  entityType: varchar("entityType", { length: 128 }).notNull(),
  entityId: int("entityId"),
  payloadJson: text("payloadJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const decisions = mysqlTable("decisions", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull().references(() => decisionRooms.id),
  selectedVendorId: int("selectedVendorId").references(() => vendors.id),
  status: mysqlEnum("status", ["DRAFT", "ACCEPTED", "REOPENED"]).default("DRAFT").notNull(),
  rationale: text("rationale"),
  acceptedBy: int("acceptedBy").references(() => users.id),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  roomId: int("roomId").references(() => decisionRooms.id),
  kind: varchar("kind", { length: 128 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type DecisionRoom = typeof decisionRooms.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Requirement = typeof requirements.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type Risk = typeof risks.$inferSelect;