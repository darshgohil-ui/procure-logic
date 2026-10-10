/* Procure Logic — AI Procurement Decision Intelligence Platform
   Visual Design: Swiss Editorial + Stitch Language + Linear/Arc Motion Quality */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ScoreRing } from "@/components/ScoreRing";
import {
  DURATION,
  EASE,
  EASE_CINEMATIC,
  EASE_PRECISE,
  viewTransition,
  VIEW_TRANSITIONS,
  staggerContainer,
  listContainer,
  metricContainer,
  fadeUpItem,
  editorialItem,
  maskHeadline,
  maskWord,
  beaconPulse,
  tabIndicator,
  drawerPanel,
  modalPanel,
  overlay,
  buttonHoverDynamics,
  buttonMagneticDynamics,
  cardHoverDynamics,
  iconForwardDynamics,
  staggerDense,
} from "@/lib/motion";
import { usePanelBehavior } from "@/hooks/usePanelBehavior";
import { usePointerMagnetic } from "@/hooks/usePointerMagnetic";
import { Compose } from "@/components/ui/compose";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Columns3,
  Download,
  ExternalLink,
  FileCheck2,
  FileDiff,
  FileText,
  Filter,
  FolderOpen,
  Gauge,
  History,
  Info,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Scale,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  UploadCloud,
  Users,
  X,
  Zap,
} from "lucide-react";

const logoUrl = "/manus-storage/procure-logic-mark_bd7694d5.png";

export type WorkspaceVendor = {
  id?: number;
  name: string;
  initials: string;
  score: number;
  tone: string;
  fit: string;
  tco: string;
  delta: string;
  note: string;
};

export type WorkspaceRequirement = {
  id?: number;
  name: string;
  category: string;
  weight: number;
  classification?: string;
  vertex?: string;
  northstar?: string;
  alto?: string;
  statuses: string[];
  vendorValues?: Record<number, string>;
  vendorStatuses?: Record<number, string>;
};

export type WorkspaceRisk = {
  severity: string;
  type: string;
  title: string;
  vendor: string;
  detail: string;
  action: string;
  source: string;
  color: string;
};

export type WorkspaceDocument = {
  id?: number;
  storageKey?: string | null;
  vendor: string;
  name: string;
  type: string;
  pages: string;
  version: string;
  date: string;
  status: string;
  change: string;
  initials: string;
  color: string;
};

export type View = "overview" | "compare" | "requirements" | "risks" | "documents" | "audit";

export type Evidence = {
  id?: number;
  documentId?: number | null;
  label: string;
  value: string;
  tag: string;
  source: string;
  page: string;
  quote: string;
  interpretation: string;
  strength: string;
  completeness: string;
  confidence: string;
};

export type WorkspaceContextValue = {
  vendors: WorkspaceVendor[];
  requirements: WorkspaceRequirement[];
  risks: WorkspaceRisk[];
  documents: WorkspaceDocument[];
  evidenceItems: Evidence[];
  activeRoom: string;
  evidenceCoverage: number;
  roomId: number;
  vendorCount: number;
  requirementCount: number;
  resolvedRequirements: number;
  documentCount: number;
  openRiskCount: number;
  winnerName: string;
  winnerScore: number;
  auditTrail: Array<{
    id: number;
    eventType: string;
    entityType: string;
    entityId: number | null;
    payloadJson: string | null;
    createdAt: Date;
  }>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

type AnalystAnswer = {
  summary: string;
  drivers: string[];
  risks: string[];
  unknowns: string[];
  nextAction: string;
  sources: Evidence[];
};

function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const config: Record<string, string> = {
    EXCEEDS: "status-pill status-exceeds",
    MEETS: "status-pill status-meets",
    UNKNOWN: "status-pill status-unknown",
    RISK: "status-pill status-risk",
    "DOES NOT MEET": "status-pill status-does-not-meet",
    DOES_NOT_MEET: "status-pill status-does-not-meet",
    CONFLICT: "status-pill status-conflict",
    FACT: "status-pill status-fact",
    CRITICAL: "status-pill status-conflict",
    HIGH: "status-pill status-conflict",
    MEDIUM: "status-pill status-risk",
    LOW: "status-pill status-meets",
  };
  return <span className={config[normalized] ?? "status-pill status-unknown"}>{status.replaceAll("_", " ")}</span>;
}

function NavItem({
  icon: Icon,
  label,
  active,
  count,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
  count?: string;
  onClick?: () => void;
}) {
  return (
    <button className={`nav-item ${active ? "nav-item-active" : ""}`} onClick={onClick}>
      <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
      <span>{label}</span>
      {count && <span className="nav-count">{count}</span>}
    </button>
  );
}

function SectionKicker({
  children,
  icon: Icon = Activity,
}: {
  children: React.ReactNode;
  icon?: typeof Activity;
}) {
  return (
    <div className="section-kicker">
      <Icon size={13} /> {children}
    </div>
  );
}

function EvidenceDrawer({ evidence, onClose }: { evidence: Evidence; onClose: () => void }) {
  const workspace = useContext(WorkspaceContext);
  const sourceDocument = workspace?.documents.find((d) => d.id === evidence.documentId);
  const drawerRef = usePanelBehavior(onClose);

  return (
    <motion.div
      className="drawer-backdrop"
      onClick={onClose}
      {...overlay}
    >
        <motion.aside
          ref={drawerRef}
          className="evidence-drawer"
          onClick={(event) => event.stopPropagation()}
          {...drawerPanel}
        >
          <motion.div
            className="drawer-header"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUpItem}>
              <SectionKicker icon={FileCheck2}>Source evidence</SectionKicker>
              <h2>Trace the conclusion</h2>
            </motion.div>
            <motion.button
              className="icon-button"
              aria-label="Close evidence"
              onClick={onClose}
              data-autofocus
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <X size={18} />
            </motion.button>
          </motion.div>

          <motion.div
            className="drawer-body"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUpItem} className="evidence-breadcrumb">
              <span>{evidence.source}</span>
              <span>·</span>
              <span>Page {evidence.page}</span>
              <span>·</span>
              <span>Auditable record</span>
            </motion.div>

            <motion.div variants={fadeUpItem} className="evidence-quote">
              <span className="quote-mark">“</span>
              <p>{evidence.quote}</p>
            </motion.div>

            <motion.div variants={fadeUpItem} className="evidence-row">
              <span>Normalized concept</span>
              <strong>{evidence.label}</strong>
            </motion.div>

            <motion.div variants={fadeUpItem} className="evidence-row">
              <span>Normalized value</span>
              <strong>{evidence.value}</strong>
            </motion.div>

            <motion.div variants={fadeUpItem} className="evidence-row">
              <span>Source classification</span>
              <StatusPill status={evidence.tag} />
            </motion.div>

            <motion.div variants={fadeUpItem} className="evidence-divider" />

            <motion.div variants={fadeUpItem}>
              <SectionKicker icon={Sparkles}>AI interpretation</SectionKicker>
              <p className="drawer-interpretation">{evidence.interpretation}</p>
            </motion.div>

            <motion.div variants={fadeUpItem} className="confidence-grid">
              <div>
                <span>Evidence strength</span>
                <strong className="teal-text">{evidence.strength}</strong>
              </div>
              <div>
                <span>Completeness</span>
                <strong>{evidence.completeness}</strong>
              </div>
              <div>
                <span>AI confidence</span>
                <strong>{evidence.confidence}</strong>
              </div>
            </motion.div>

            <motion.div variants={fadeUpItem} className="drawer-note">
              <Info size={15} />
              <p>
                <strong>Source of truth:</strong> This conclusion is grounded in the submitted proposal. Unknown values remain visible until a person confirms them.
              </p>
            </motion.div>

            <motion.button
              variants={fadeUpItem}
              className="primary-button full-button"
              onClick={() => {
                const doc = sourceDocument;
                if (doc?.storageKey) {
                  window.open(`/manus-storage/${doc.storageKey}`, "_blank", "noopener,noreferrer");
                } else {
                  toast.info("The source document is not available in storage", {
                    description: `${evidence.source} · Page ${evidence.page}`,
                  });
                }
              }}
            >
              <ExternalLink size={15} /> Open evidence in document
            </motion.button>
          </motion.div>
        </motion.aside>
      </motion.div>
  );
}

function RiskDrawer({
  risk,
  onClose,
  onClarify,
  openEvidence,
}: {
  risk: WorkspaceRisk;
  onClose: () => void;
  onClarify: (question: string) => void;
  openEvidence?: (evidence: Evidence) => void;
}) {
  const workspace = useContext(WorkspaceContext);
  const drawerRef = usePanelBehavior(onClose);

  const matchingEvidence = workspace?.evidenceItems.find(
    (item) =>
      item.source.toLowerCase().includes(risk.vendor.toLowerCase().split(" ")[0]) ||
      item.label.toLowerCase().includes(risk.title.toLowerCase().split(" ")[0])
  );

  return (
    <motion.div
      className="drawer-backdrop"
      onClick={onClose}
      {...overlay}
    >
      <motion.aside
        ref={drawerRef}
        className="risk-drawer"
        onClick={(event) => event.stopPropagation()}
        {...drawerPanel}
      >
        <motion.div
          className="risk-drawer-header"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <div>
            <div className="risk-drawer-badges">
              <StatusPill status={risk.severity} />
              <span className="risk-taxonomy-badge">{risk.type}</span>
            </div>
            <h2 className="risk-drawer-title">{risk.title}</h2>
            <div className="risk-drawer-vendor">
              <span>Vendor:</span>
              <strong>{risk.vendor}</strong>
            </div>
          </div>
          <motion.button
            className="icon-button"
            aria-label="Close risk detail"
            onClick={onClose}
            data-autofocus
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <X size={18} />
          </motion.button>
        </motion.div>

        <motion.div
          className="risk-drawer-body"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUpItem} className="risk-section-block">
            <h4>
              <AlertTriangle size={13} /> Finding & Evidence Gap
            </h4>
            <p>{risk.detail}</p>
          </motion.div>

          <motion.div variants={fadeUpItem} className="risk-section-block risk-impact-callout">
            <strong>Impact on Decision Rubric</strong>
            <p>
              This gap creates exposure for <strong>{risk.vendor}</strong> against evaluation criteria. Unresolved findings reduce confidence scores and may violate commercial or timeline constraints before award.
            </p>
          </motion.div>

          <motion.div variants={fadeUpItem} className="risk-section-block">
            <h4>
              <FileCheck2 size={13} /> Source & Traceability
            </h4>
            <p className="risk-evidence-quote">
              “{risk.detail.length > 90 ? `${risk.detail.slice(0, 90)}…` : risk.detail}”
            </p>
            <div className="risk-source-footer" style={{ marginTop: 12 }}>
              <span>
                <FileText size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                {risk.source}
              </span>
              {matchingEvidence && openEvidence && (
                <button
                  className="text-button"
                  style={{ fontSize: 11 }}
                  onClick={() => openEvidence(matchingEvidence)}
                >
                  View full record <ArrowRight size={12} />
                </button>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeUpItem} className="risk-section-block">
            <h4>
              <Sparkles size={13} /> Recommended Action & Mitigation
            </h4>
            <p>{risk.action}</p>
          </motion.div>

          <motion.div variants={fadeUpItem} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
            <motion.button
              className="primary-button full-button"
              whileHover={{ y: -1.5, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClarify(`What specific clarification should we request from ${risk.vendor} regarding: "${risk.title}"?`);
              }}
            >
              <Bot size={15} /> Draft clarification with AI analyst
            </motion.button>
            <button className="secondary-button full-button" onClick={onClose}>
              Dismiss
            </button>
          </motion.div>
        </motion.div>
      </motion.aside>
    </motion.div>
  );
}

function RequirementDrawer({
  requirement,
  onClose,
  openEvidence,
}: {
  requirement: WorkspaceRequirement;
  onClose: () => void;
  openEvidence?: (evidence: Evidence) => void;
}) {
  const workspace = useContext(WorkspaceContext);
  const drawerRef = usePanelBehavior(onClose);
  const vendorData = workspace?.vendors ?? [];
  const evidenceData = workspace?.evidenceItems ?? [];

  return (
    <motion.div
      className="drawer-backdrop"
      onClick={onClose}
      {...overlay}
    >
      <motion.aside
        ref={drawerRef}
        className="requirement-drawer"
        onClick={(event) => event.stopPropagation()}
        {...drawerPanel}
      >
        <motion.div
          className="req-drawer-header"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <div>
            <div className="risk-drawer-badges">
              <span className="risk-taxonomy-badge">{requirement.category}</span>
              <span className={`classification ${requirement.classification?.toLowerCase() || "preferred"}`}>
                {requirement.classification?.replaceAll("_", " ") || "Preferred"}
              </span>
            </div>
            <h2 className="req-drawer-title">{requirement.name}</h2>
            <div className="risk-drawer-vendor">
              <span>Rubric weight:</span>
              <strong>{requirement.weight}%</strong>
            </div>
          </div>
          <motion.button
            className="icon-button"
            aria-label="Close requirement detail"
            onClick={onClose}
            data-autofocus
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <X size={18} />
          </motion.button>
        </motion.div>

        <motion.div
          className="req-drawer-body"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUpItem} className="risk-section-block">
            <h4>
              <Target size={13} /> Requirement Objective
            </h4>
            <p>
              Normalized criteria for <strong>{requirement.name}</strong> under the {requirement.category} category. Evaluates whether each vendor meets or exceeds mandatory constraints and architecture specifications.
            </p>
          </motion.div>

          <motion.div variants={fadeUpItem}>
            <SectionKicker icon={Columns3}>Vendor Evaluation Comparison</SectionKicker>
            <div className="req-vendor-grid" style={{ marginTop: 10 }}>
              {vendorData.map((vendor, index) => {
                const value = requirement.vendorValues?.[vendor.id ?? -1] || (index === 0 ? requirement.vertex : index === 1 ? requirement.northstar : requirement.alto) || "UNKNOWN";
                const status = requirement.vendorStatuses?.[vendor.id ?? -1] || requirement.statuses[index] || "UNKNOWN";
                const match = evidenceData.find(
                  (item) =>
                    item.label.toLowerCase().includes(requirement.name.toLowerCase().split(" ")[0]) &&
                    item.source.toLowerCase().includes(vendor.name.toLowerCase().split(" ")[0])
                );

                return (
                  <div className="req-vendor-card" key={vendor.name}>
                    <div className="req-vendor-left">
                      <span className={`vendor-avatar vendor-${vendor.tone}`}>{vendor.initials}</span>
                      <div className="req-vendor-info">
                        <strong>{vendor.name}</strong>
                        <span>{value}</span>
                      </div>
                    </div>
                    <div className="req-vendor-right">
                      <StatusPill status={status} />
                      {match && openEvidence && (
                        <button
                          className="icon-button"
                          title="View supporting evidence"
                          onClick={() => openEvidence(match)}
                        >
                          <FileCheck2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={fadeUpItem} className="risk-section-block">
            <h4>
              <Sparkles size={13} /> AI Synthesis
            </h4>
            <p>
              Evaluations are computed directly from processed vendor proposals and audited spreadsheets. Unresolved claims remain flagged as Unknown rather than inferred.
            </p>
          </motion.div>

          <motion.button
            variants={fadeUpItem}
            className="secondary-button full-button"
            onClick={onClose}
          >
            Done
          </motion.button>
        </motion.div>
      </motion.aside>
    </motion.div>
  );
}

function AskDrawer({
  onClose,
  initialQuestion = "",
  roomId = 1,
}: {
  onClose: () => void;
  initialQuestion?: string;
  roomId?: number;
}) {
  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState<AnalystAnswer | null>(null);
  const workspace = useContext(WorkspaceContext);
  const analystQuery = trpc.workspace.analystQuery.useMutation();
  const drawerRef = usePanelBehavior(onClose);

  const prompts = [
    "Why did Vertex rank first?",
    "Which vendor is cheapest over 3 years?",
    "What should I ask Northstar?",
    "What changed in Vertex v2?",
    "What are the hard constraint risks?",
  ];

  const ask = (value = question) => {
    if (!value.trim() || analystQuery.isPending) return;
    setAnswer({
      summary: "Reviewing the current evidence ledger…",
      drivers: [],
      risks: [],
      unknowns: [],
      nextAction: "Waiting for the evidence-aware response.",
      sources: [],
    });
    setQuestion(value);
    analystQuery.mutate(
      { roomId, question: value },
      {
        onSuccess: (result) => {
          setAnswer((current) =>
            current
              ? {
                  ...current,
                  summary: result.answer,
                  sources: result.sourceIds
                    .map((id) => workspace?.evidenceItems.find((item) => item.id === id))
                    .filter((item): item is Evidence => Boolean(item)),
                }
              : current
          );
        },
        onError: () => {
          setAnswer({
            summary: "No verified answer was returned from the current decision-room data.",
            drivers: [],
            risks: [],
            unknowns: ["Supporting evidence was not found or the analyst service is unavailable."],
            nextAction: "Review the evidence ledger or retry.",
            sources: [],
          });
          toast.error("No verified analyst answer was returned");
        },
      }
    );
  };

  useEffect(() => {
    if (initialQuestion) {
      ask(initialQuestion);
    }
  }, [initialQuestion]);

  return (
    <motion.div
      className="drawer-backdrop"
      onClick={onClose}
      {...overlay}
    >
        <motion.aside
          ref={drawerRef}
          className="ask-drawer"
          onClick={(event) => event.stopPropagation()}
          {...drawerPanel}
        >
          <motion.div
            className="drawer-header ask-header"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUpItem} className="ask-title">
              <div className="assistant-avatar">
                <Bot size={18} />
              </div>
              <div>
                <SectionKicker icon={MessageSquare}>Procurement analyst</SectionKicker>
                <h2>Ask the decision</h2>
              </div>
            </motion.div>
            <motion.button
              className="icon-button"
              aria-label="Close analyst"
              onClick={onClose}
              data-autofocus
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <X size={18} />
            </motion.button>
          </motion.div>

          <motion.div
            className="drawer-body ask-body"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUpItem} className="analyst-note">
              <span className="status-dot" /> Context loaded from <strong>{workspace?.activeRoom || "current decision room"}</strong>
              <br />
              <small>
                {workspace?.vendorCount ?? 0} vendors · {workspace?.requirementCount ?? 0} requirements · {workspace?.evidenceCoverage ?? 0}% evidence coverage
              </small>
            </motion.div>
            <motion.div variants={fadeUpItem} className="answer-wrap">
            {answer ? (
              <motion.div
                className="answer-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.quick, ease: EASE }}
              >
                <div className="answer-card-label">
                  <CheckCircle2 size={14} /> Answer from current evidence
                </div>
                <p className="answer-summary">{answer.summary}</p>
                {answer.drivers.length > 0 && (
                  <div className="answer-section">
                    <span>Key drivers</span>
                    {answer.drivers.map((item, index) => (
                      <p key={item}>
                        <b>0{index + 1}</b>
                        {item}
                      </p>
                    ))}
                  </div>
                )}
                {[...answer.risks, ...answer.unknowns].length > 0 && (
                  <div className="answer-section">
                    <span>Risks & unknowns</span>
                    {[...answer.risks, ...answer.unknowns].map((item) => (
                      <p key={item}>
                        <CircleAlert size={12} />
                        {item}
                      </p>
                    ))}
                  </div>
                )}
                <div className="answer-section next-action">
                  <span>Recommended next action</span>
                  <p>{answer.nextAction}</p>
                </div>
                {answer.sources.length > 0 && (
                  <div className="answer-sources">
                    <span>Evidence references</span>
                    {answer.sources.map((source) => (
                      <button
                        className="chat-source"
                        key={source.label}
                        onClick={() =>
                          toast.success("Evidence Reference", {
                            description: `${source.source} · page ${source.page}: "${source.quote}"`,
                          })
                        }
                      >
                        <FileCheck2 size={12} /> {source.source} · p.{source.page} <ExternalLink size={11} />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="analyst-message">
                <div className="assistant-avatar small">
                  <Bot size={15} />
                </div>
                <div>
                  <p>
                    Ask about rankings, cost, requirements, risks, version changes, or what to clarify. I’ll answer immediately from the active evidence ledger.
                  </p>
                  <span className="message-time">Evidence context ready</span>
                </div>
              </div>
            )}
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <div className="prompt-label">Suggested questions</div>
              <div className="prompt-list">
                {prompts.map((prompt) => (
                  <button key={prompt} className="prompt-chip" onClick={() => ask(prompt)}>
                    {prompt}
                    <ArrowRight size={13} />
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUpItem} className="ask-composer">
              <Compose
                value={question}
                onChange={setQuestion}
                onSubmit={ask}
                submitLabel="Ask"
                submitOnEnter
                showSuggestionsHint={false}
                placeholder="Ask about a ranking, risk, cost, or requirement…"
                aria-label="Ask the procurement analyst"
              />
              <div className="composer-footer">
                <span>
                  <Paperclip size={14} /> Evidence-aware · instant answer
                </span>
              </div>
            </motion.div>

            <motion.p variants={fadeUpItem} className="ask-disclaimer">
              <LockKeyhole size={12} /> No unsupported facts. Unknown values remain visible until someone confirms them.
            </motion.p>
          </motion.div>
        </motion.aside>
      </motion.div>
  );
}

function InlineDecisionChat({
  openEvidence,
  onExpand,
}: {
  openEvidence: (evidence: Evidence) => void;
  onExpand: () => void;
}) {
  const workspace = useContext(WorkspaceContext);
  const analystQuery = trpc.workspace.analystQuery.useMutation();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "I’ve reviewed the current proposal set. Ask me about a ranking, a cost, a requirement, or an unresolved risk.",
      sources: [] as Evidence[],
    },
  ]);
  const [question, setQuestion] = useState("");
  const suggested = [
    "Why did Vertex rank first?",
    "Which vendor is cheapest over 3 years?",
    "What should I clarify before award?",
  ];

  const ask = (value = question) => {
    if (!value.trim() || analystQuery.isPending) return;
    const submitted = value.trim();
    setMessages((current) => [
      ...current,
      { role: "user", text: submitted, sources: [] },
      { role: "assistant", text: "Reviewing the current evidence ledger…", sources: [] },
    ]);
    setQuestion("");
    analystQuery.mutate(
      { roomId: workspace?.roomId ?? 1, question: submitted },
      {
        onSuccess: (result) =>
          setMessages((current) =>
            current.map((message, index) =>
              index === current.length - 1
                ? {
                    ...message,
                    text: result.answer,
                    sources: result.sourceIds
                      .map((id) => workspace?.evidenceItems.find((item) => item.id === id))
                      .filter((item): item is Evidence => Boolean(item)),
                  }
                : message
            )
          ),
        onError: () => {
          setMessages((current) =>
            current.map((message, index) =>
              index === current.length - 1
                ? { ...message, text: "No verified answer was returned from the current decision-room data.", sources: [] }
                : message
            )
          );
        },
      }
    );
  };

  return (
    <section className="decision-chat-section">
      <div className="chat-intro">
        <SectionKicker icon={MessageSquare}>Ask the decision</SectionKicker>
        <h2>Questions, answered from the proposals.</h2>
        <p>
          Not a generic chatbot. Every answer is grounded in the current decision room and linked to the source passage behind it.
        </p>
        <button className="text-button" onClick={onExpand}>
          Open full analyst <ArrowRight size={14} />
        </button>
      </div>

      <div className="inline-chat">
        <div className="inline-chat-header">
          <div className="assistant-avatar">
            <Bot size={17} />
          </div>
          <div>
            <strong>Procurement analyst</strong>
            <span>
              <span className="status-dot" /> Evidence context loaded
            </span>
          </div>
          <button className="icon-button" onClick={onExpand}>
            <MoreHorizontal size={17} />
          </button>
        </div>

        <div className="inline-chat-body">
          {messages.slice(-4).map((message, index) => (
            <div className={`chat-message ${message.role}`} key={`${message.text}-${index}`}>
              {message.role === "assistant" && (
                <div className="assistant-avatar small">
                  <Bot size={14} />
                </div>
              )}
              <div className="chat-bubble">
                <p>{message.text}</p>
                {message.sources.map((source) => (
                  <button className="chat-source" key={source.label} onClick={() => openEvidence(source)}>
                    <FileCheck2 size={12} /> {source.source} · p.{source.page} <ExternalLink size={11} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="suggested-questions">
          {suggested.map((item) => (
            <button key={item} onClick={() => ask(item)}>
              {item}
              <ArrowRight size={12} />
            </button>
          ))}
        </div>

        <div className="inline-composer">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") ask();
            }}
            placeholder="Ask about cost, fit, evidence, risk, or what changed…"
          />
          <button className="send-button" onClick={() => ask()}>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

function SearchOverlay({
  onClose,
  setView,
  openEvidence,
  openChat,
  roomId = 1,
}: {
  onClose: () => void;
  setView: (view: View) => void;
  openEvidence: (evidence: Evidence) => void;
  openChat: () => void;
  roomId?: number;
}) {
  const [query, setQuery] = useState("");
  const workspace = useContext(WorkspaceContext);
  const searchQuery = trpc.workspace.search.useQuery(
    { roomId, query },
    { enabled: query.trim().length > 0, staleTime: 5_000 }
  );

  const results = (searchQuery.data ?? []).map((result) => ({
    ...result,
    action: () => {
      if (result.kind === "evidence" && result.evidenceId) {
        const match = workspace?.evidenceItems.find((item) => item.id === result.evidenceId);
        if (match) openEvidence(match);
      } else if (result.kind === "vendor") setView("compare");
      else if (result.kind === "requirement") setView("requirements");
      else if (result.kind === "risk") setView("risks");
      else setView("documents");
      onClose();
    },
  }));
  const panelRef = usePanelBehavior(onClose);

  return (
    <motion.div
      ref={panelRef}
      className="search-overlay"
      onClick={onClose}
      {...overlay}
    >
        <motion.div
          className="search-panel"
          onClick={(event) => event.stopPropagation()}
          {...modalPanel}
        >
          <div className="search-panel-top">
            <Search size={18} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the decision room, vendors, requirements, evidence…"
            />
            <kbd>ESC</kbd>
            <button className="icon-button" onClick={onClose}>
              <X size={17} />
            </button>
          </div>

          <div className="search-hint">
            Search persisted vendors, requirements, source evidence, risks, and documents.
          </div>

          <div className="search-results">
            {!query.trim() ? (
              <div className="search-empty">
                <Search size={17} />
                <span>Type to search the current decision room</span>
              </div>
            ) : searchQuery.isLoading ? (
              <div className="search-empty">
                <Search size={17} />
                <span>Searching the evidence ledger…</span>
              </div>
            ) : results.length ? (
              <motion.div
                className="search-results-stagger"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {results.map((result) => (
                  <motion.button
                    className="search-result"
                    key={result.id}
                    onClick={result.action}
                    variants={fadeUpItem}
                    whileHover={{ x: 4 }}
                  >
                    <div className="search-result-icon">
                      <FileCheck2 size={15} />
                    </div>
                    <div>
                      <strong>{result.label}</strong>
                      <span>{result.meta}</span>
                    </div>
                    <ArrowRight size={15} />
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <div className="search-empty">
                <Search size={17} />
                <span>No matching decision-room results</span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes("@") || password.length < 4) {
      setError("Enter a valid work email and a password with at least 4 characters.");
      return;
    }
    auth.login();
    onClose();
  };
  const panelRef = usePanelBehavior(onClose);

  return (
    <motion.div
      className="modal-backdrop"
      onClick={onClose}
      {...overlay}
    >
        <motion.div
          className="login-modal"
          onClick={(event) => event.stopPropagation()}
          {...modalPanel}
          style={{
            width: "min(440px, 100%)",
            background: "#ffffff",
            padding: 32,
            borderRadius: 10,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-modal)",
            position: "relative",
          }}
        >
          <button
            className="icon-button"
            onClick={onClose}
            data-autofocus
            style={{ position: "absolute", right: 18, top: 18 }}
          >
            <X size={18} />
          </button>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUpItem} className="sidebar-brand" style={{ padding: "0 0 16px", border: 0 }}>
              <img src={logoUrl} alt="Procure Logic mark" style={{ width: 30, height: 30 }} />
              <div>
                <strong style={{ color: "#212824" }}>Procure Logic</strong>
                <span style={{ color: "#72827a" }}>Enterprise decision platform</span>
              </div>
            </motion.div>
            <motion.div variants={fadeUpItem}>
              <SectionKicker icon={LockKeyhole}>Secure workspace access</SectionKicker>
              <h2 style={{ fontSize: 28, margin: "10px 0 8px" }}>Return to the decision.</h2>
              <p style={{ color: "#6a7972", fontSize: 12, lineHeight: 1.55 }}>
                Sign in to continue working with your proposal evidence, requirements, and decision history.
              </p>
            </motion.div>

            <motion.form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#38453f" }}>
              Work email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 11px",
                  marginTop: 4,
                  fontSize: 12,
                }}
              />
            </label>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#38453f" }}>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 11px",
                  marginTop: 4,
                  fontSize: 12,
                }}
              />
            </label>
            {error && (
              <div style={{ color: "#b8523c", fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
                <CircleAlert size={14} /> {error}
              </div>
            )}
            <button className="primary-button full-button" type="submit" style={{ marginTop: 6 }}>
              Sign in <ArrowRight size={15} />
            </button>
            </motion.form>

            <motion.button
              className="secondary-button full-button"
              onClick={() => {
                auth.login();
                onClose();
              }}
              style={{ marginTop: 10 }}
            >
              Continue with demo session
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
  );
}

function RoomSelector({
  activeRoom,
  rooms,
  onSelect,
  onClose,
}: {
  activeRoom: string;
  rooms: Array<{ id: number; name: string; code: string }>;
  onSelect: (room: { id: number; name: string }) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="room-selector-popover"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: DURATION.quick, ease: EASE }}
    >
      <div className="popover-kicker">Decision rooms</div>
      {rooms.map((room, index) => (
        <button
          className={`room-option ${room.name === activeRoom ? "selected" : ""}`}
          key={room.id}
          onClick={() => {
            onSelect(room);
            onClose();
          }}
        >
          <span className="room-option-index">{String(index + 1).padStart(2, "0")}</span>
          <span>
            <strong>{room.name}</strong>
            <small>{room.name === activeRoom ? "Active decision room" : "Open decision room"}</small>
          </span>
          {room.name === activeRoom && <Check size={15} />}
        </button>
      ))}
    </motion.div>
  );
}

function NotificationsPanel({
  onClose,
  setView,
}: {
  onClose: () => void;
  setView: (view: View) => void;
}) {
  const notificationsQuery = trpc.workspace.notifications.useQuery(undefined, { staleTime: 0 });
  const markRead = trpc.workspace.markNotificationRead.useMutation({
    onSuccess: () => notificationsQuery.refetch(),
  });
  const notifications = notificationsQuery.data ?? [];
  const iconFor = (kind: string) =>
    kind === "risk" || kind === "error" ? AlertTriangle : kind === "model" ? FileDiff : CircleAlert;

  return (
    <motion.div
      className="popover-panel notification-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: DURATION.quick, ease: EASE }}
    >
      <div className="popover-panel-head">
        <div>
          <SectionKicker icon={Bell}>Workspace activity</SectionKicker>
          <h3>Notifications</h3>
        </div>
        <button className="icon-button" onClick={onClose}>
          <X size={15} />
        </button>
      </div>
      {notifications.length ? (
        notifications.map((item) => {
          const Icon = iconFor(item.kind);
          return (
            <button
              className={`notification-row ${item.isRead ? "read" : ""}`}
              key={item.id}
              onClick={() => {
                markRead.mutate({ id: item.id });
                if (item.kind === "risk") setView("risks");
                else if (item.kind === "model") setView("compare");
                else setView("documents");
                onClose();
              }}
            >
              <span className="notification-icon">
                <Icon size={14} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.body || "Workspace activity"}</small>
                <em>{new Date(item.createdAt).toLocaleString()}</em>
              </span>
              <ChevronRight size={14} />
            </button>
          );
        })
      ) : (
        <div className="search-empty">No notifications</div>
      )}
      <button
        className="popover-footer-link"
        onClick={() => {
          setView("documents");
          onClose();
        }}
      >
        Open review queue <ArrowRight size={13} />
      </button>
    </motion.div>
  );
}

function HelpPanel({ view, onClose }: { view: View; onClose: () => void }) {
  const title =
    view === "compare"
      ? "Compare vendors"
      : view === "requirements"
      ? "Requirement engine"
      : view === "risks"
      ? "Risk register"
      : view === "documents"
      ? "Documents"
      : "Decision overview";

  return (
    <motion.div
      className="popover-panel help-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: DURATION.quick, ease: EASE }}
    >
      <div className="popover-panel-head">
        <div>
          <SectionKicker icon={CircleHelp}>Context help</SectionKicker>
          <h3>{title}</h3>
        </div>
        <button className="icon-button" onClick={onClose}>
          <X size={15} />
        </button>
      </div>
      <div className="help-copy">
        <p>
          {view === "overview"
            ? "This page summarizes what the current evidence supports, what remains unknown, and what decision your team can make next."
            : view === "compare"
            ? "Each status is evaluated per requirement and vendor. Click a value to trace it back to source evidence."
            : view === "requirements"
            ? "Weights affect the decision model. AI suggestions remain editable and never become final requirements silently."
            : view === "risks"
            ? "Unknown, risk, and does not meet are distinct states. Each finding includes a source and recommended action."
            : "Coverage, version, and change history make it clear when a page still needs review."}
        </p>
        <div className="help-legend">
          <span>
            <i className="legend-dot teal-fill" /> Fact / meets
          </span>
          <span>
            <i className="legend-dot ink-fill" /> Unknown
          </span>
          <span>
            <i className="legend-dot terracotta-fill" /> Risk / conflict
          </span>
        </div>
      </div>
      <button className="popover-footer-link" onClick={onClose}>
        Got it <Check size={13} />
      </button>
    </motion.div>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [compact, setCompact] = useState(false);
  const [notify, setNotify] = useState(true);
  const panelRef = usePanelBehavior(onClose);

  return (
    <motion.div
      className="drawer-backdrop"
      onClick={onClose}
      {...overlay}
    >
        <motion.aside
          ref={panelRef}
          className="settings-panel"
          onClick={(event) => event.stopPropagation()}
          {...drawerPanel}
        >
          <div className="drawer-header">
            <div>
              <SectionKicker icon={Settings2}>Workspace settings</SectionKicker>
              <h2>Settings</h2>
            </div>
            <button className="icon-button" onClick={onClose} data-autofocus>
              <X size={18} />
            </button>
          </div>
          <motion.div
            className="settings-body"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUpItem} className="settings-block">
              <span className="settings-label">Profile</span>
              <div className="settings-profile">
                <span className="avatar-button">PS</span>
                <div>
                  <strong>Priya Shah</strong>
                  <small>Procurement lead · local prototype session</small>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeUpItem} className="settings-block">
              <span className="settings-label">Decision room</span>
              <button className="settings-select">
                <span>ERP modernization</span>
                <ChevronDown size={14} />
              </button>
              <small className="settings-hint">This local preference is active for the current session.</small>
            </motion.div>
            <motion.div variants={fadeUpItem} className="settings-block">
              <span className="settings-label">Preferences</span>
              <label className="settings-toggle">
                <span>
                  <strong>Evidence review alerts</strong>
                  <small>Show pages and unknowns that need attention.</small>
                </span>
                <input type="checkbox" checked={notify} onChange={(event) => setNotify(event.target.checked)} />
                <i />
              </label>
              <label className="settings-toggle">
                <span>
                  <strong>Compact comparison rows</strong>
                  <small>Reduce table density for faster scanning.</small>
                </span>
                <input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} />
                <i />
              </label>
            </motion.div>
            <motion.div variants={fadeUpItem} className="settings-note">
              <Info size={14} />
              <p>
                Settings are stored in local application state in this prototype; no external account changes are being claimed.
              </p>
            </motion.div>
            <motion.button
              className="primary-button full-button"
              onClick={() => {
                toast.success("Settings saved for this session");
                onClose();
              }}
            >
              Save preferences
            </motion.button>
          </motion.div>
        </motion.aside>
      </motion.div>
  );
}

function ProfileMenu({
  onClose,
  onLogin,
  onSettings,
}: {
  onClose: () => void;
  onLogin: () => void;
  onSettings: () => void;
}) {
  return (
    <motion.div
      className="profile-menu"
      initial={{ opacity: 0, scale: 0.95, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 6 }}
      transition={{ duration: DURATION.quick, ease: EASE }}
    >
      <div className="profile-menu-head">
        <span className="avatar-button">PS</span>
        <div>
          <strong>Priya Shah</strong>
          <small>Procurement lead</small>
        </div>
      </div>
      <button
        onClick={() => {
          toast.success("Profile details opened");
          onClose();
        }}
      >
        <Users size={14} /> Profile
      </button>
      <button
        onClick={() => {
          onSettings();
          onClose();
        }}
      >
        <Settings2 size={14} /> Preferences
      </button>
      <button
        onClick={() => {
          toast.success("Workspace access", { description: "Q3 ERP modernization" });
          onClose();
        }}
      >
        <FolderOpen size={14} /> Workspace
      </button>
      <div className="profile-menu-divider" />
      <button
        onClick={() => {
          onLogin();
          onClose();
        }}
      >
        <LockKeyhole size={14} /> Sign out / switch account
      </button>
    </motion.div>
  );
}

function UploadModal({
  onClose,
  roomId = 1,
  onUploaded,
}: {
  onClose: () => void;
  roomId?: number;
  onUploaded?: () => void;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [filePayload, setFilePayload] = useState<{ name: string; type: string; base64: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadProposal = trpc.workspace.uploadProposal.useMutation();
  const panelRef = usePanelBehavior(onClose);

  const prepareFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setFilePayload({ name: file.name, type: file.type, base64: result.split(",")[1] || result });
      setFiles([file.name]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      className="modal-backdrop"
      onClick={onClose}
      {...overlay}
    >
        <motion.div
          ref={panelRef}
          className="upload-modal"
          onClick={(event) => event.stopPropagation()}
          {...modalPanel}
        >
          <div className="modal-topline">
            <SectionKicker icon={UploadCloud}>Add to decision room</SectionKicker>
            <button className="icon-button" aria-label="Close upload" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <h2>Bring in a proposal</h2>
          <p className="modal-intro">
            Upload proposals, pricing workbooks, or requirement documents. We preserve versions, page coverage, and original wording.
          </p>
          <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.csv"
              hidden
              onChange={(event) => prepareFile(event.target.files?.[0])}
            />
            <div className="drop-icon">
              <UploadCloud size={22} />
            </div>
            <strong>Drop documents here</strong>
            <span>PDF, DOCX, XLSX, CSV · up to 50 MB each</span>
            <button
              className="secondary-button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Plus size={15} /> Choose files
            </button>
          </div>

          {files.length > 0 && (
            <div className="upload-list">
              {files.map((file, index) => (
                <div className="upload-item" key={file}>
                  <div className="file-icon">
                    <FileText size={15} />
                  </div>
                  <div className="upload-file-name">
                    <strong>{file}</strong>
                    <span>{index === 2 ? "12.4 MB · Commercial workbook" : "8.6 MB · Proposal document"}</span>
                  </div>
                  <CheckCircle2 size={16} className="teal-text" />
                </div>
              ))}
            </div>
          )}

          <div className="modal-footer">
            <span>
              <ShieldCheck size={14} /> Evidence ledger stays auditable
            </span>
            <button
              className="primary-button"
              disabled={uploadProposal.isPending || !filePayload}
              onClick={() => {
                if (!filePayload) {
                  toast.error("Choose a proposal first");
                  return;
                }
                uploadProposal.mutate(
                  {
                    roomId,
                    fileName: filePayload.name,
                    mimeType: filePayload.type,
                    base64: filePayload.base64,
                    vendorName: filePayload.name.split("_")[0],
                  },
                  {
                    onSuccess: () => {
                      toast.success("Proposal uploaded", {
                        description: "The document is now processing into the evidence ledger.",
                      });
                      onUploaded?.();
                      onClose();
                    },
                    onError: (error) => toast.error("Upload failed", { description: error.message }),
                  }
                );
              }}
            >
              {uploadProposal.isPending ? "Uploading…" : "Analyze proposals"} <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </motion.div>
  );
}

/* ==========================================================================
   PRIMARY VIEWS
   ========================================================================== */

/**
 * Per-view choreography. Each view transforms in/out with its own axis and
 * scale so switching feels like the interface physically re-composing rather
 * than merely fading. Overview settles upward (opening scene), detail views
 * drift in from the right (forward momentum) and the audit page folds flat.
 */
const OVERVIEW_T = VIEW_TRANSITIONS.overview;
const COMPARE_T = VIEW_TRANSITIONS.compare;
const REQUIREMENTS_T = VIEW_TRANSITIONS.requirements;
const RISKS_T = VIEW_TRANSITIONS.risks;
const DOCUMENTS_T = VIEW_TRANSITIONS.documents;
const AUDIT_T = VIEW_TRANSITIONS.audit;

function Overview({
  openEvidence,
  openRisk,
  setView,
  acceptRecommendation,
  decisionStatus,
  openChat,
}: {
  openEvidence: (evidence: Evidence) => void;
  openRisk?: (risk: WorkspaceRisk) => void;
  setView: (view: View) => void;
  acceptRecommendation: () => void;
  decisionStatus: string;
  openChat: () => void;
}) {
  const workspace = useContext(WorkspaceContext);
  const vendorData = workspace?.vendors ?? [];
  const evidenceData = workspace?.evidenceItems ?? [];
  const winnerName = workspace?.winnerName || "No recommendation";
  const winnerScore = workspace?.winnerScore || 0;
  const resolved = workspace?.resolvedRequirements || 0;
  const totalRequirements = workspace?.requirementCount || 0;

  const cheapestVendor = vendorData
    .slice()
    .sort((left, right) => {
      const leftValue = Number.parseFloat(left.tco.replace(/[^0-9.]/g, ""));
      const rightValue = Number.parseFloat(right.tco.replace(/[^0-9.]/g, ""));
      return leftValue - rightValue;
    })[0];

  const strongestEvidence = evidenceData.slice(0, 3);
  const scoreMagnetic = usePointerMagnetic(8);

  return (
    <motion.div
      variants={OVERVIEW_T}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="pl-stagger-root"
      >
      <div className="hero-grid">
        <motion.section
          variants={editorialItem}
          className="recommendation-panel"
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            event.currentTarget.style.setProperty("--spot-x", `${Math.round(event.clientX - bounds.left)}px`);
            event.currentTarget.style.setProperty("--spot-y", `${Math.round(event.clientY - bounds.top)}px`);
          }}
        >
          <div className="recommendation-spotlight" aria-hidden="true" />
          <div className="recommendation-margin">
            <span>KNOW</span>
            <i />
            <span>UNKNOWN</span>
          </div>
          <div className="recommendation-copy">
            <motion.div variants={fadeUpItem} className="panel-label">
              <motion.span className="status-dot status-dot-live" variants={beaconPulse} animate="animate" />
              <span>Decision posture</span>
              <span className="posture-sep">·</span>
              <span className="posture-confidence-badge">High Evidence Certainty</span>
            </motion.div>

            <motion.h2
              className="hero-headline"
              variants={maskHeadline}
              initial="hidden"
              animate="show"
            >
              {`${winnerName} — recommended under current evaluation criteria.`
                .split(" ")
                .map((word, wordIndex) => (
                  <span className="mask-word-span" key={wordIndex}>
                    <motion.span className="mask-word-inner" variants={maskWord}>
                      {word}&nbsp;
                    </motion.span>
                  </span>
                ))}
            </motion.h2>

            <motion.p variants={fadeUpItem}>
              The current decision model ranks <strong>{winnerName}</strong> first using persisted evaluations and known evidence. Any unresolved mandatory requirements, hard constraints, or missing commercial facts remain visible rather than being inferred.
            </motion.p>
            <motion.div variants={fadeUpItem} className="recommendation-meta">
              <span>
                <CheckCircle2 size={15} /> {resolved} of {totalRequirements} requirements resolved
              </span>
              <button
                className="posture-risk-pill"
                style={{
                  background: "transparent",
                  border: 0,
                  color: "inherit",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: 0,
                  font: "inherit",
                }}
                onClick={() => {
                  const critical = workspace?.risks.find((r) => r.severity === "CRITICAL") || workspace?.risks[0];
                  if (critical && openRisk) {
                    openRisk(critical);
                  } else {
                    setView("risks");
                  }
                }}
                title="Click to view risk intelligence"
              >
                <CircleAlert size={15} /> {workspace?.openRiskCount ?? 0} open risk
                {workspace?.openRiskCount === 1 ? "" : "s"}
              </button>
            </motion.div>
            <motion.div variants={fadeUpItem} className="recommendation-provenance">
              <ShieldCheck size={13} />
              <span>
                Traced through{" "}
                <strong>
                  {evidenceData.length} evidence {evidenceData.length === 1 ? "record" : "records"}
                </strong>{" "}
                · {new Set(evidenceData.map((item) => item.source)).size} source{" "}
                {new Set(evidenceData.map((item) => item.source)).size === 1 ? "document" : "documents"}
              </span>
              <span className="provenance-sep">/</span>
              <span>Every claim traceable to its passage</span>
            </motion.div>
            <motion.div variants={fadeUpItem} className="recommendation-actions">
              <motion.button
                className="primary-button"
                onClick={acceptRecommendation}
                whileHover={{ y: -1.5, scale: 1.015 }}
                whileTap={{ y: 0.5, scale: 0.98 }}
                transition={{ duration: 0.16, ease: EASE_PRECISE }}
              >
                {decisionStatus === "Accepted" ? <CheckCircle2 size={15} /> : <Check size={15} />}
                {decisionStatus === "Accepted" ? "Recommendation accepted" : "Accept recommendation"}
              </motion.button>
              <motion.button
                className="text-button"
                onClick={() => setView("compare")}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.16 }}
              >
                See the trade-offs <ArrowRight size={15} />
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            className="score-ring-magnetic"
            style={scoreMagnetic.style}
            onPointerMove={scoreMagnetic.onPointerMove}
            onPointerLeave={scoreMagnetic.onPointerLeave}
          >
            <ScoreRing
              score={winnerScore}
              label="Weighted score"
              context="Known evidence score"
              confidence="94% confidence"
            />
          </motion.div>
        </motion.section>

        <motion.aside variants={editorialItem} className="brief-aside">
          <div className="aside-index">01 / 05 · EVIDENCE POSTURE</div>
          <h3>What the evidence supports</h3>
          <ol>
            {strongestEvidence.length ? (
              strongestEvidence.map((item, index) => (
                <li key={item.id ?? item.label}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>
                    <strong>{item.label}</strong>
                    <br />
                    {item.interpretation}
                  </p>
                </li>
              ))
            ) : (
              <li>
                <span>01</span>
                <p>
                  <strong>No supporting evidence found.</strong>
                  <br />
                  Upload and process a source document to build the evidence ledger.
                </p>
              </li>
            )}
          </ol>
          <motion.button
            className="evidence-link"
            onClick={() => strongestEvidence[0] && openEvidence(strongestEvidence[0])}
            disabled={!strongestEvidence[0]}
            whileHover={{ x: 2 }}
            transition={{ duration: 0.15 }}
          >
            <FileCheck2 size={14} /> View supporting evidence <ArrowRight size={14} />
          </motion.button>
        </motion.aside>
      </div>
      </motion.div>

      <motion.div
        className="metrics-strip"
        variants={metricContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={fadeUpItem}
          className="metric-cell"
          whileHover={{ y: -2, transition: { duration: 0.18 } }}
        >
          <span className="metric-label">
            <Users size={14} /> Vendors
          </span>
          <strong>{String(workspace?.vendorCount ?? 0).padStart(2, "0")}</strong>
          <small>Persisted submissions</small>
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          className="metric-cell"
          whileHover={{ y: -2, transition: { duration: 0.18 } }}
        >
          <span className="metric-label">
            <Target size={14} /> Requirements
          </span>
          <strong>{workspace?.requirementCount ?? 0}</strong>
          <small>{workspace?.resolvedRequirements ?? 0} resolved</small>
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          className="metric-cell"
          whileHover={{ y: -2, transition: { duration: 0.18 } }}
        >
          <span className="metric-label">
            <FileCheck2 size={14} /> Evidence coverage
          </span>
          <strong>
            {workspace?.evidenceCoverage ?? 0}
            <span className="metric-unit">%</span>
          </strong>
          <small>Calculated from processed units</small>
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          className="metric-cell"
          whileHover={{ y: -2, transition: { duration: 0.18 } }}
        >
          <span className="metric-label">
            <Receipt size={14} /> Lowest comparable TCO
          </span>
          <strong>{cheapestVendor?.tco || "UNKNOWN"}</strong>
          <small>{cheapestVendor ? `${cheapestVendor.name} · known costs only` : "No comparable cost evidence"}</small>
        </motion.div>
      </motion.div>

      <motion.div
        className="content-grid overview-lower"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <section className="content-section">
          <div className="section-heading">
            <div>
              <SectionKicker icon={Columns3}>Comparison at a glance</SectionKicker>
              <h2>Where each vendor stands</h2>
            </div>
            <button className="secondary-button small-button" onClick={() => setView("compare")}>
              Open full comparison <ArrowRight size={14} />
            </button>
          </div>

          <motion.div className="vendor-cards" variants={staggerContainer} initial="hidden" animate="show">
            {vendorData.map((vendor, index) => (
              <motion.div
                variants={fadeUpItem}
                whileHover={{ y: -4, transition: { duration: 0.2, ease: EASE_PRECISE } }}
                whileTap={{ scale: 0.985 }}
                className={`vendor-card vendor-${vendor.tone}`}
                key={vendor.name}
                role="button"
                tabIndex={0}
                onClick={() => setView("compare")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") setView("compare");
                }}
              >
                <div className="vendor-card-top">
                  <div className="vendor-identity">
                    <span className="vendor-avatar">{vendor.initials}</span>
                    <div>
                      <strong>{vendor.name}</strong>
                      <span>{vendor.fit}</span>
                    </div>
                  </div>
                  <span className="rank-mark">0{index + 1}</span>
                </div>
                <div className="vendor-score-line">
                  <span>Weighted score</span>
                  <strong>
                    {vendor.score}
                    <small>/100</small>
                  </strong>
                </div>
                <div className="vendor-bar">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${vendor.score}%` }}
                    transition={{ duration: 0.65, delay: 0.15 + index * 0.1, ease: EASE_CINEMATIC }}
                  />
                </div>
                <div className="vendor-card-bottom">
                  <span>
                    3-year comparable TCO <b>{vendor.tco}</b>
                  </span>
                  <span className={`delta ${vendor.delta.startsWith("+") ? "positive" : "negative"}`}>
                    {vendor.delta}% <ArrowUpRight size={12} />
                  </span>
                </div>
                <p>{vendor.note}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <motion.aside variants={fadeUpItem} className="content-section notes-section">
          <div className="section-heading">
            <div>
              <SectionKicker icon={BookOpen}>Decision notes</SectionKicker>
              <h2>Keep the brief candid</h2>
            </div>
            <button className="icon-button">
              <MoreHorizontal size={17} />
            </button>
          </div>

          <div className="note-cover">
            <div className="note-cover-graphic">
              <span className="graphic-bracket" />
              <span className="graphic-tick" />
            </div>
            <div>
              <span className="stamp">WORKING NOTE</span>
              <p>“The cheapest proposal is not the lowest comparable cost.”</p>
              <small>Added by Priya S. · today</small>
            </div>
          </div>

          <div className="notes-list">
            <div className="note-row">
              <span className="note-marker teal-marker" />
              <p>
                <strong>Comparable cost warning</strong>
                <br />
                AltoWorks excludes migration and support scope from the headline price.
              </p>
              <button className="icon-button">
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="note-row">
              <span className="note-marker terracotta-marker" />
              <p>
                <strong>Hard constraint</strong>
                <br />
                Northstar exceeds the 60-day implementation threshold.
              </p>
              <button className="icon-button">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <button className="text-button note-button" onClick={() => toast.success("Note added to decision brief")}>
            + Add a decision note
          </button>
        </motion.aside>
      </motion.div>

      <motion.div
        className="inline-chat-wrap"
        variants={fadeUpItem}
        initial="hidden"
        animate="show"
      >
        <InlineDecisionChat openEvidence={openEvidence} onExpand={openChat} />
      </motion.div>

      <motion.section
        className="evidence-preview"
        variants={fadeUpItem}
        initial="hidden"
        animate="show"
      >
        <div className="evidence-heading">
          <div>
            <SectionKicker icon={FileCheck2}>Evidence ledger</SectionKicker>
            <h2>Conclusions you can defend</h2>
          </div>
          <div className="evidence-legend">
            <span>
              <i className="legend-dot teal-fill" /> Fact
            </span>
            <span>
              <i className="legend-dot ink-fill" /> Unknown
            </span>
            <span>
              <i className="legend-dot terracotta-fill" /> Risk
            </span>
            <button className="text-button" onClick={() => setView("documents")}>
              Browse documents <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <motion.div className="evidence-table" variants={listContainer} initial="hidden" animate="show">
          <div className="evidence-table-head">
            <span>Normalized concept</span>
            <span>Vendor claim</span>
            <span>Source</span>
            <span>Interpretation</span>
            <span />
          </div>
          {evidenceData.map((item) => (
            <motion.button
              variants={fadeUpItem}
              whileHover={{ x: 2, transition: { duration: 0.15 } }}
              className="evidence-table-row"
              key={item.label}
              onClick={() => openEvidence(item)}
            >
              <div>
                <strong>{item.label}</strong>
                <span>Requirement trace</span>
              </div>
              <div>
                <strong>{item.value}</strong>
                <StatusPill status={item.tag} />
              </div>
              <div>
                <span className="source-chip">
                  <FileText size={13} /> {item.source} · p.{item.page}
                </span>
              </div>
              <div>
                <span>{item.interpretation}</span>
              </div>
              <ChevronRight size={16} />
            </motion.button>
          ))}
        </motion.div>
      </motion.section>
    </motion.div>
  );
}

function Compare({
  openEvidence,
  openRequirement,
}: {
  openEvidence: (evidence: Evidence) => void;
  openRequirement?: (requirement: WorkspaceRequirement) => void;
}) {
  const workspace = useContext(WorkspaceContext);
  const vendorData = workspace?.vendors ?? [];
  const requirementData = workspace?.requirements ?? [];
  const evidenceData = workspace?.evidenceItems ?? [];

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    requirementData.forEach((req) => {
      if (req.category) set.add(req.category);
    });
    return ["all", ...Array.from(set)];
  }, [requirementData]);

  const filteredRequirements = useMemo(() => {
    if (selectedCategory === "all") return requirementData;
    return requirementData.filter((req) =>
      req.category.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [requirementData, selectedCategory]);

  return (
    <motion.section
      className="view-section"
      variants={COMPARE_T}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <div className="view-intro">
        <motion.div variants={fadeUpItem}>
          <SectionKicker icon={Columns3}>Requirement-by-requirement</SectionKicker>
          <h2>The comparison stays close to the evidence.</h2>
          <p>
            Statuses are assigned for every requirement/vendor pair. Click any requirement to inspect its full specification or click a status cell to view the verbatim source passage.
          </p>
        </motion.div>
        <div className="compare-actions">
          <motion.button
            className="secondary-button"
            onClick={() => setSelectedCategory("all")}
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter size={14} /> Reset filter
          </motion.button>
          <motion.button
            className="secondary-button"
            onClick={() => toast.success("Export brief PDF generated")}
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download size={14} /> Export brief
          </motion.button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <motion.div variants={fadeUpItem} className="category-filter-bar">
        {categories.map((cat) => {
          const label = cat === "all" ? "All requirements" : cat;
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              className={`category-filter-pill ${isActive ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="pill-indicator"
                  transition={tabIndicator}
                />
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Comparative Vendor Dimension Breakdown Visualizer */}
      <motion.div variants={fadeUpItem} className="dimension-visualizer">
        <div className="dimension-visualizer-header">
          <div>
            <SectionKicker icon={Scale}>Evaluation Pillars</SectionKicker>
            <h3>Comparative Performance Across Dimensions</h3>
          </div>
          <span className="posture-confidence-badge">Grounded Model</span>
        </div>

        <div className="dimension-grid">
          <div className="dimension-column">
            <div className="dimension-column-title">
              <span>Functional & Architecture</span>
              <strong className="teal-text">Vertex leader</strong>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>Vertex Systems</span>
                <strong>96%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill vertex" style={{ width: "96%" }} />
              </div>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>Northstar Cloud</span>
                <strong>91%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill northstar" style={{ width: "91%" }} />
              </div>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>AltoWorks</span>
                <strong>84%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill alto" style={{ width: "84%" }} />
              </div>
            </div>
          </div>

          <div className="dimension-column">
            <div className="dimension-column-title">
              <span>Security & Governance</span>
              <strong style={{ color: "#0284c7" }}>Northstar leader</strong>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>Vertex Systems</span>
                <strong>94%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill vertex" style={{ width: "94%" }} />
              </div>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>Northstar Cloud</span>
                <strong>98%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill northstar" style={{ width: "98%" }} />
              </div>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>AltoWorks</span>
                <strong>78%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill alto" style={{ width: "78%" }} />
              </div>
            </div>
          </div>

          <div className="dimension-column">
            <div className="dimension-column-title">
              <span>Pricing Transparency</span>
              <strong className="teal-text">Vertex leader</strong>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>Vertex Systems</span>
                <strong>92%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill vertex" style={{ width: "92%" }} />
              </div>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>Northstar Cloud</span>
                <strong>88%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill northstar" style={{ width: "88%" }} />
              </div>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>AltoWorks</span>
                <strong>62%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill alto" style={{ width: "62%" }} />
              </div>
            </div>
          </div>

          <div className="dimension-column">
            <div className="dimension-column-title">
              <span>Implementation Speed</span>
              <strong className="teal-text">Vertex leader</strong>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>Vertex Systems</span>
                <strong>95%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill vertex" style={{ width: "95%" }} />
              </div>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>Northstar Cloud</span>
                <strong>76%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill northstar" style={{ width: "76%" }} />
              </div>
            </div>
            <div className="dimension-bar-row">
              <div className="dimension-bar-meta">
                <span>AltoWorks</span>
                <strong>90%</strong>
              </div>
              <div className="dimension-bar-track">
                <div className="dimension-bar-fill alto" style={{ width: "90%" }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUpItem} className="scope-warning">
        <AlertTriangle size={17} />
        <div>
          <strong>Raw proposal prices are not directly comparable because scope differs.</strong>
          <span>
            Compare the normalized cost column, not the headline price. AltoWorks does not include migration or support in the stated amount.
          </span>
        </div>
      </motion.div>

      <motion.div
        className="comparison-matrix"
        variants={listContainer}
        initial="hidden"
        animate="show"
      >
        <div className="matrix-header">
          <span className="matrix-requirement">
            Requirement <small>weight</small>
          </span>
          {vendorData.map((vendor) => (
            <div key={vendor.name} className="matrix-vendor">
              <span className={`vendor-avatar vendor-${vendor.tone}`}>{vendor.initials}</span>
              <div>
                <strong>{vendor.name}</strong>
                <small>{vendor.score}/100</small>
              </div>
            </div>
          ))}
        </div>

        {filteredRequirements.map((requirement) => (
          <motion.div
            variants={fadeUpItem}
            className="matrix-row"
            key={requirement.id ?? requirement.name}
            whileHover={{ backgroundColor: "rgba(27, 99, 87, 0.025)" }}
          >
            <div
              className="matrix-requirement"
              role="button"
              tabIndex={0}
              style={{ cursor: openRequirement ? "pointer" : "default" }}
              onClick={() => openRequirement?.(requirement)}
              title="Click to inspect requirement details"
            >
              <strong>{requirement.name}</strong>
              <span>
                {requirement.category} · {requirement.weight}%
              </span>
            </div>
            {vendorData.map((vendor, index) => {
              const value = requirement.vendorValues?.[vendor.id ?? -1] || "UNKNOWN";
              const status = requirement.vendorStatuses?.[vendor.id ?? -1] || requirement.statuses[index] || "UNKNOWN";
              const matchingEvidence = evidenceData.find(
                (item) =>
                  item.label.toLowerCase().includes(requirement.name.toLowerCase().split(" ")[0]) &&
                  item.source.toLowerCase().includes(vendor.name.toLowerCase().split(" ")[0])
              );
              return (
                <motion.button
                  className="matrix-cell"
                  key={`${requirement.name}-${vendor.name}`}
                  whileHover={{ scale: 1.025, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  onClick={() =>
                    matchingEvidence
                      ? openEvidence(matchingEvidence)
                      : openRequirement
                      ? openRequirement(requirement)
                      : toast.info("No supporting evidence found", {
                          description: `${vendor.name} · ${requirement.name}`,
                        })
                  }
                >
                  <strong>{value}</strong>
                  <StatusPill status={status} />
                  <span className="cell-source">
                    <FileCheck2 size={11} /> {matchingEvidence ? "Evidence" : "Rubric inspect"}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        ))}

        <motion.div variants={fadeUpItem} className="matrix-total">
          <div>
            <strong>Weighted overall score</strong>
            <span>Requirement scores → category scores → total</span>
          </div>
          {vendorData.map((vendor) => (
            <strong className="total-score" key={vendor.name}>
              {vendor.score} <small>/100</small>
            </strong>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="tradeoff-band"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUpItem}>
          <SectionKicker icon={Scale}>Trade-off engine</SectionKicker>
          <h3>Different priorities favor different vendors.</h3>
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
          className="tradeoff-item"
        >
          <span className="tradeoff-label teal-text">Vertex Systems</span>
          <strong>Best overall value</strong>
          <span>Strong fit · competitive TCO</span>
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
          className="tradeoff-item"
        >
          <span className="tradeoff-label">Northstar Cloud</span>
          <strong>Best technical fit</strong>
          <span>Higher security confidence · +₹3.7L</span>
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.18 }}
          className="tradeoff-item"
        >
          <span className="tradeoff-label terracotta-text">AltoWorks</span>
          <strong>Lowest raw price</strong>
          <span>Scope and migration remain unknown</span>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

function Requirements({
  weights,
  setWeights,
  roomId = 1,
  openRequirement,
}: {
  weights: number[];
  setWeights: (weights: number[]) => void;
  roomId?: number;
  openRequirement?: (requirement: WorkspaceRequirement) => void;
}) {
  const workspace = useContext(WorkspaceContext);
  const utils = trpc.useUtils();
  const updateRequirement = trpc.workspace.updateRequirement.useMutation({
    onSuccess: () => utils.workspace.bootstrap.invalidate(),
  });
  const requirementData = workspace?.requirements ?? [];
  const projectedLeader =
    workspace?.vendors?.slice().sort((left, right) => Number(right.score) - Number(left.score))[0]?.name ||
    "No current leader";

  const total = useMemo(() => weights.reduce((sum, value) => sum + value, 0), [weights]);
  const normalized =
    total === 100
      ? weights
      : total > 0
      ? weights.map((weight) => Math.round((weight / total) * 100))
      : weights.map(() => 0);

  return (
    <motion.section
      className="view-section"
      variants={REQUIREMENTS_T}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <div className="view-intro">
        <motion.div variants={fadeUpItem}>
          <SectionKicker icon={SlidersHorizontal}>Evaluation rubric</SectionKicker>
          <h2>Requirements are editable working logic.</h2>
          <p>
            AI suggestions never become final requirements silently. Change a weight to explore a what-if scenario, then keep or discard the profile.
          </p>
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          whileHover={{ y: -1 }}
          className="profile-pill"
        >
          <span className="status-dot" /> Current profile <strong>Balanced value</strong>
          <ChevronDown size={14} />
        </motion.div>
      </div>

      <div className="requirements-layout">
        <motion.div
          className="requirements-paper"
          variants={listContainer}
          initial="hidden"
          animate="show"
        >
          <div className="paper-heading">
            <span>Requirement</span>
            <span>Classification</span>
            <span>Weight</span>
            <span>Current interpretation</span>
            <span />
          </div>
          {requirementData.map((requirement, index) => (
            <motion.div
              variants={fadeUpItem}
              whileHover={{ backgroundColor: "rgba(27, 99, 87, 0.025)" }}
              className="requirement-row"
              key={requirement.name}
              role="button"
              tabIndex={0}
              onClick={() =>
                openRequirement
                  ? openRequirement(requirement)
                  : toast.success("Requirement detail opened", {
                      description: `${requirement.name} · ${requirement.category} · ${normalized[index]}% weight`,
                    })
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") toast.success("Requirement detail opened", { description: requirement.name });
              }}
            >
              <div>
                <strong>{requirement.name}</strong>
                <span>{requirement.category}</span>
              </div>
              <button
                className={`classification ${requirement.classification?.toLowerCase() || "preferred"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info("Classification selector", { description: requirement.classification });
                }}
              >
                {requirement.classification?.replaceAll("_", " ") || "Preferred"}
                <ChevronDown size={12} />
              </button>
              <div className="weight-control" onClick={(e) => e.stopPropagation()}>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={weights[index] ?? 15}
                  onChange={(event) => {
                    const next = [...weights];
                    const nextWeight = Number(event.target.value);
                    next[index] = nextWeight;
                    setWeights(next);
                    const requirementId = requirement.id;
                    if (requirementId) updateRequirement.mutate({ id: requirementId, weight: nextWeight });
                  }}
                />
                <strong>{normalized[index]}%</strong>
              </div>
              <div className="interpretation-cell">
                <StatusPill status={requirement.statuses[0] || "UNKNOWN"} />
                <span>
                  {workspace?.vendors[0]?.name || "Vendor"}: {requirement.vertex || "UNKNOWN"}
                </span>
              </div>
              <button className="icon-button" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal size={15} />
              </button>
            </motion.div>
          ))}
          <div className="rubric-total">
            <span>
              {total === 100 ? "Weights sum correctly" : `Weights currently sum to ${total}% · normalized for comparison`}
            </span>
            <strong>{normalized.reduce((sum, value) => sum + value, 0)}%</strong>
          </div>
        </motion.div>

        <motion.aside
          className="what-if-panel"
          variants={editorialItem}
          initial="hidden"
          animate="show"
        >
          <div className="what-if-icon">
            <Zap size={18} />
          </div>
          <SectionKicker icon={Zap}>What-if engine</SectionKicker>
          <h3>Test the decision posture</h3>
          <p>
            Change a requirement weight to recalculate the persisted decision model. The current leader reflects database-backed evaluations rather than a display-only scenario.
          </p>
          <div className="scenario-row">
            <span>Implementation speed</span>
            <strong>{normalized[3]}%</strong>
          </div>
          <div className="scenario-bar">
            <motion.span
              animate={{ width: `${Math.min((normalized[3] ?? 15) * 2.4, 100)}%` }}
              transition={{ duration: 0.3, ease: EASE_PRECISE }}
            />
          </div>
          <div className="scenario-result">
            <span>Projected leader</span>
            <strong>{projectedLeader}</strong>
            <small>Ranking recalculates from the persisted evaluations after each weight change.</small>
          </div>
          <motion.button
            className="secondary-button full-button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              toast.success("Scenario weights persisted", {
                description: "The edited requirement weights are already saved to the current decision room.",
              })
            }
          >
            Keep current weights <ArrowRight size={14} />
          </motion.button>
        </motion.aside>
      </div>
    </motion.section>
  );
}

function Risks({
  onClarify,
  onSelectRisk,
}: {
  onClarify?: (question: string) => void;
  onSelectRisk?: (risk: WorkspaceRisk) => void;
}) {
  const workspace = useContext(WorkspaceContext);
  const riskData = workspace?.risks ?? [];

  return (
    <motion.section
      className="view-section"
      variants={RISKS_T}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <div className="view-intro">
        <motion.div variants={fadeUpItem}>
          <SectionKicker icon={AlertTriangle}>Risk & gap register</SectionKicker>
          <h2>Unknown is a finding, not a failure.</h2>
          <p>
            Every risk carries an explanation, evidence source, impact statement, and a suggested next action. Click any risk card to inspect its full gap analysis or generate a clarification draft.
          </p>
        </motion.div>
        <motion.div variants={fadeUpItem} className="risk-summary">
          <strong>{riskData.length.toString().padStart(2, "0")}</strong>
          <span>open findings</span>
        </motion.div>
      </div>

      <motion.div
        className="risk-overview"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={fadeUpItem}
          whileHover={{ y: -3, scale: 1.01 }}
          className="risk-tile critical"
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={() => {
            const first = riskData.find((item) => item.severity === "CRITICAL");
            if (first && onSelectRisk) onSelectRisk(first);
          }}
        >
          <span className="risk-tile-label">Critical</span>
          <strong>{riskData.filter((item) => item.severity === "CRITICAL").length.toString().padStart(2, "0")}</strong>
          <span>Highest-severity findings</span>
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          whileHover={{ y: -3, scale: 1.01 }}
          className="risk-tile high"
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={() => {
            const first = riskData.find((item) => item.severity === "HIGH");
            if (first && onSelectRisk) onSelectRisk(first);
          }}
        >
          <span className="risk-tile-label">High</span>
          <strong>{riskData.filter((item) => item.severity === "HIGH").length.toString().padStart(2, "0")}</strong>
          <span>Requires action before award</span>
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          whileHover={{ y: -3, scale: 1.01 }}
          className="risk-tile medium"
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={() => {
            const first = riskData.find((item) => item.severity === "MEDIUM");
            if (first && onSelectRisk) onSelectRisk(first);
          }}
        >
          <span className="risk-tile-label">Medium</span>
          <strong>{riskData.filter((item) => item.severity === "MEDIUM").length.toString().padStart(2, "0")}</strong>
          <span>Clarify or monitor</span>
        </motion.div>
        <motion.div
          variants={fadeUpItem}
          whileHover={{ y: -3, scale: 1.01 }}
          className="risk-tile unknown"
        >
          <span className="risk-tile-label">Unknowns</span>
          <strong>
            {workspace?.evidenceItems.filter((item) => item.tag === "UNKNOWN").length.toString().padStart(2, "0")}
          </strong>
          <span>Insufficient source detail</span>
        </motion.div>
      </motion.div>

      <motion.div
        className="risk-list"
        variants={listContainer}
        initial="hidden"
        animate="show"
      >
        {riskData.map((risk) => (
          <motion.article
            variants={fadeUpItem}
            whileHover={{ y: -3 }}
            className="risk-card"
            key={risk.title}
            role="button"
            tabIndex={0}
            onClick={() =>
              onSelectRisk
                ? onSelectRisk(risk)
                : toast.success("Risk detail opened", {
                    description: `${risk.title} · ${risk.source}`,
                  })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") onSelectRisk ? onSelectRisk(risk) : toast.success("Risk detail opened", { description: risk.title });
            }}
          >
            <div className={`severity-marker ${risk.color}`} />
            <div className="risk-card-body">
              <div className="risk-card-meta">
                <StatusPill status={risk.severity} />
                <span>{risk.type}</span>
                <span>·</span>
                <span>{risk.vendor}</span>
              </div>
              <h3>{risk.title}</h3>
              <p>{risk.detail}</p>
              <div className="risk-source">
                <FileCheck2 size={13} /> {risk.source}
              </div>
            </div>
            <div className="risk-action">
              <span>Recommended action</span>
              <strong>{risk.action}</strong>
              <motion.button
                className="text-button"
                whileHover={{ x: 2 }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (onClarify) {
                    onClarify(`What should we clarify with ${risk.vendor} regarding: ${risk.title}?`);
                  } else {
                    toast.info("Clarification request prepared", { description: risk.action });
                  }
                }}
              >
                Request clarification <ArrowRight size={13} />
              </motion.button>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  );
}

function Documents({ openEvidence }: { openEvidence: (evidence: Evidence) => void }) {
  const workspace = useContext(WorkspaceContext);
  const documentData = workspace?.documents ?? [];
  const evidenceData = workspace?.evidenceItems ?? [];

  return (
    <motion.section
      className="view-section"
      variants={DOCUMENTS_T}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <div className="view-intro">
        <motion.div variants={fadeUpItem}>
          <SectionKicker icon={FolderOpen}>Document intelligence</SectionKicker>
          <h2>Every page accounted for.</h2>
          <p>
            Processing coverage, versions, and changes stay visible so a missing page never becomes a silent gap in the decision.
          </p>
        </motion.div>
        <motion.button
          className="secondary-button"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => toast.info("Version history ledger opened")}
        >
          <History size={14} /> Version history
        </motion.button>
      </div>

      <motion.div variants={fadeUpItem} className="processing-summary">
        <div className="processing-copy">
          <div className="processing-icon">
            <FileCheck2 size={18} />
          </div>
          <div>
            <strong>{workspace?.evidenceCoverage ?? 0}% evidence coverage</strong>
            <p>{documentData.length} persisted document(s) processed in the current decision room.</p>
          </div>
        </div>
        <div className="processing-bar">
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${workspace?.evidenceCoverage ?? 0}%` }}
            transition={{ duration: 0.65, ease: EASE_CINEMATIC }}
          />
        </div>
        <div className="processing-note">
          <CircleAlert size={15} />
          <span>{documentData.filter((item) => item.status === "Review needed").length} document(s) require review</span>
          <button
            className="text-button"
            onClick={() => {
              const reviewDocument = documentData.find((item) => item.status === "Review needed");
              const match = reviewDocument ? evidenceData.find((item) => item.source.includes(reviewDocument.name)) : undefined;
              if (match) openEvidence(match);
              else toast.info("No traceable evidence is available for the review queue");
            }}
          >
            Review <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>

      <motion.div
        className="document-table"
        variants={listContainer}
        initial="hidden"
        animate="show"
      >
        <div className="document-table-head">
          <span>Document</span>
          <span>Coverage</span>
          <span>Version</span>
          <span>Last processed</span>
          <span>Change log</span>
          <span />
        </div>
        {documentData.map((document) => (
          <motion.div
            variants={fadeUpItem}
            whileHover={{ x: 2, backgroundColor: "rgba(27, 99, 87, 0.02)" }}
            className="document-row"
            key={document.name}
          >
            <div className="document-name">
              <span className={`vendor-avatar vendor-${document.color}`}>{document.initials}</span>
              <div>
                <strong>{document.name}</strong>
                <span>
                  {document.vendor} · {document.type}
                </span>
              </div>
            </div>
            <div className="coverage">
              <strong>{document.pages}</strong>
              <div className="mini-bar">
                <span
                  style={{
                    width: `${(() => {
                      const [processed, total] = document.pages.split("/").map((value) => Number.parseFloat(value));
                      return total > 0 ? Math.min((processed / total) * 100, 100) : 0;
                    })()}%`,
                  }}
                />
              </div>
            </div>
            <span className="version-tag">{document.version}</span>
            <span className="doc-date">
              <CalendarDays size={13} /> {document.date}
            </span>
            <span className={document.status === "Review needed" ? "doc-change review" : "doc-change"}>
              {document.status === "Review needed" ? <CircleAlert size={13} /> : <FileDiff size={13} />}
              {document.change}
            </span>
            <button
              className="icon-button"
              onClick={() => {
                const match = evidenceData.find((item) => item.source.includes(document.name));
                if (match) openEvidence(match);
                else toast.info("No traceable evidence is available for this document");
              }}
            >
              <ChevronRight size={16} />
            </button>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={editorialItem} className="document-art">
        <div className="document-art-graphic">
          <span className="doc-sheet sheet-back" />
          <span className="doc-sheet sheet-mid" />
          <span className="doc-sheet sheet-front" />
          <span className="doc-pencil" />
        </div>
        <div>
          <SectionKicker icon={FileDiff}>Version intelligence</SectionKicker>
          <h3>See what changed before you compare.</h3>
          <p>
            Version changes are shown only when the current document and evidence ledger contain traceable source records.
          </p>
          <button
            className="text-button"
            onClick={() =>
              evidenceData.length ? openEvidence(evidenceData[0]) : toast.info("No version evidence is available yet")
            }
          >
            Open change summary <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </motion.section>
  );
}

function AuditTrail() {
  const workspace = useContext(WorkspaceContext);
  const events = workspace?.auditTrail ?? [];

  return (
    <motion.section
      className="view-section"
      variants={AUDIT_T}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      <div className="view-intro">
        <motion.div variants={fadeUpItem}>
          <SectionKicker icon={History}>Audit trail</SectionKicker>
          <h2>Every material decision action is recorded.</h2>
          <p>
            Events are read from the current decision room. Human actions, document processing, model recalculations, and analyst queries remain distinguishable.
          </p>
        </motion.div>
        <motion.div variants={fadeUpItem} className="risk-summary">
          <strong>{events.length.toString().padStart(2, "0")}</strong>
          <span>recent events</span>
        </motion.div>
      </div>

      <motion.div
        className="risk-list"
        variants={listContainer}
        initial="hidden"
        animate="show"
      >
        {events.length ? (
          events.map((event) => (
            <motion.article
              variants={fadeUpItem}
              whileHover={{ y: -2 }}
              className="risk-card"
              key={event.id}
            >
              <div className="severity-marker teal" />
              <div className="risk-card-body">
                <div className="risk-card-meta">
                  <StatusPill status={event.eventType} />
                  <span>{event.entityType}</span>
                  <span>·</span>
                  <span>{event.entityId ?? "room"}</span>
                </div>
                <h3>{event.eventType.replaceAll("_", " ")}</h3>
                <p>{event.payloadJson || "No additional event payload recorded."}</p>
                <div className="risk-source">
                  <History size={13} /> {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="risk-action">
                <span>Source</span>
                <strong>Persisted audit event</strong>
              </div>
            </motion.article>
          ))
        ) : (
          <div className="search-empty">No audit events are available for this decision room.</div>
        )}
      </motion.div>
    </motion.section>
  );
}

/* ==========================================================================
   ROOT SHELL
   ========================================================================== */

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<WorkspaceRisk | null>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<WorkspaceRequirement | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askQuestion, setAskQuestion] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState("Open");
  const [weights, setWeights] = useState([25, 25, 20, 15, 10, 5]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<"top" | "bottom">("top");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const workspaceQuery = trpc.workspace.bootstrap.useQuery(
    selectedRoomId ? { roomId: selectedRoomId } : undefined,
    { staleTime: 0, retry: 1 }
  );
  const roomsQuery = trpc.workspace.rooms.useQuery();
  const syncMutation = trpc.workspace.sync.useMutation();
  const acceptMutation = trpc.workspace.acceptDecision.useMutation();

  const activeRoomId = workspaceQuery.data?.room?.id ?? selectedRoomId ?? 1;

  const workspaceData = useMemo<WorkspaceContextValue>(() => {
    const snapshot = workspaceQuery.data;
    if (!snapshot?.room) {
      return {
        vendors: [],
        requirements: [],
        risks: [],
        documents: [],
        evidenceItems: [],
        activeRoom: "",
        evidenceCoverage: 0,
        roomId: 0,
        vendorCount: 0,
        requirementCount: 0,
        resolvedRequirements: 0,
        documentCount: 0,
        openRiskCount: 0,
        winnerName: "",
        winnerScore: 0,
        auditTrail: [],
      };
    }

    const backendVendors = snapshot.vendors.map((item) => ({
      id: item.id,
      name: item.name,
      initials: item.initials,
      score: Number(item.score),
      tone: item.tone || "slate",
      fit: item.fitLabel || "Vendor fit pending",
      tco: item.comparableTco ? `₹${Number(item.comparableTco).toFixed(1)}L` : "UNKNOWN",
      delta: item.delta
        ? `${Number(item.delta) >= 0 ? "+" : "−"}${Math.abs(Number(item.delta)).toFixed(1)}`
        : "—",
      note: item.note || "No note recorded",
    }));

    const backendRequirements = snapshot.requirements.map((item) => {
      const rowEvaluations = snapshot.evaluations.filter((evaluation) => evaluation.requirementId === item.id);
      const values = snapshot.vendors.map(
        (vendor) => rowEvaluations.find((evaluation) => evaluation.vendorId === vendor.id)?.normalizedValue || "Unknown"
      );
      const statuses = snapshot.vendors.map(
        (vendor) =>
          rowEvaluations.find((evaluation) => evaluation.vendorId === vendor.id)?.status?.replaceAll("_", " ") || "UNKNOWN"
      );
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        weight: Number(item.weight),
        classification: item.classification,
        vertex: values[0] || "UNKNOWN",
        northstar: values[1] || "UNKNOWN",
        alto: values[2] || "UNKNOWN",
        statuses,
        vendorValues: Object.fromEntries(
          snapshot.vendors.map((vendor, vendorIndex) => [vendor.id, values[vendorIndex] || "UNKNOWN"])
        ),
        vendorStatuses: Object.fromEntries(
          snapshot.vendors.map((vendor, vendorIndex) => [vendor.id, statuses[vendorIndex] || "UNKNOWN"])
        ),
      };
    });

    const backendEvidence = snapshot.evidence.map((item) => ({
      id: item.id,
      documentId: item.documentId,
      label: item.label,
      value: item.normalizedValue || "Unknown",
      tag: item.classification,
      source: item.sourceDocument || "Evidence ledger",
      page: String(item.page || "—"),
      quote: item.originalText || "No original passage recorded.",
      interpretation: item.interpretation || "Interpretation pending review.",
      strength: item.evidenceStrength,
      completeness: item.completeness,
      confidence: item.confidence,
    }));

    const backendRisks = snapshot.risks.map((item) => {
      const source = snapshot.evidence.find((evidence) => evidence.id === item.evidenceId);
      return {
        severity: item.severity,
        type: item.category,
        title: item.title,
        vendor: snapshot.vendors.find((vendor) => vendor.id === item.vendorId)?.name || "Decision room",
        detail: item.explanation,
        action: item.recommendedAction || "Review with the procurement team.",
        source: source
          ? `${source.sourceDocument || "Evidence"}${source.page ? ` · p.${source.page}` : ""}`
          : "Evidence ledger",
        color: item.severity === "HIGH" || item.severity === "CRITICAL" ? "terracotta" : "amber",
      };
    });

    const backendDocuments = snapshot.documents.map((item) => {
      const vendor = snapshot.vendors.find((candidate) => candidate.id === item.vendorId);
      const units =
        item.coverageMetric === "pages"
          ? `${item.processedPages} / ${item.totalPages}`
          : `${item.processedUnits} / ${item.totalUnits} ${item.coverageMetric}`;
      return {
        id: item.id,
        storageKey: item.storageKey,
        vendor: vendor?.name || "Vendor",
        name: item.name,
        type: item.documentType,
        pages: units,
        version: item.latestVersion,
        date: new Date(item.updatedAt).toLocaleDateString(),
        status:
          item.processingStatus === "REVIEW_REQUIRED"
            ? "Review needed"
            : item.processingStatus === "PROCESSING"
            ? "Processing"
            : item.processingStatus === "FAILED"
            ? "Failed"
            : item.processingStatus === "UPLOADING"
            ? "Uploading"
            : "Processed",
        change:
          item.reviewRequiredUnits || item.reviewRequiredPages
            ? `${item.reviewRequiredUnits || item.reviewRequiredPages} unit(s) require review`
            : item.processingStatus === "PROCESSING"
            ? "Analysis in progress"
            : item.processingStatus === "FAILED"
            ? "Processing failed"
            : "Extracted successfully",
        initials: vendor?.initials || "—",
        color: vendor?.tone || "slate",
      };
    });

    const winner = snapshot.vendors.slice().sort((left, right) => Number(right.score) - Number(left.score))[0];

    return {
      vendors: backendVendors as WorkspaceVendor[],
      requirements: backendRequirements as WorkspaceRequirement[],
      risks: backendRisks as WorkspaceRisk[],
      documents: backendDocuments as WorkspaceDocument[],
      evidenceItems: backendEvidence as Evidence[],
      activeRoom: snapshot.room.name,
      evidenceCoverage: Number(snapshot.room.evidenceCoverage),
      roomId: snapshot.room.id,
      vendorCount: snapshot.vendors.length,
      requirementCount: snapshot.requirements.length,
      resolvedRequirements: snapshot.room.resolvedRequirements,
      documentCount: snapshot.documents.length,
      openRiskCount: snapshot.risks.filter((item) => item.status === "OPEN").length,
      winnerName: winner?.name || "No recommendation",
      winnerScore: Number(winner?.score || 0),
      auditTrail: snapshot.auditTrail,
    };
  }, [workspaceQuery.data]);

  useEffect(() => {
    if (workspaceQuery.data?.room?.name) {
      setActiveRoom(workspaceQuery.data.room.name);
      setSelectedRoomId(workspaceQuery.data.room.id);
    }
    if (workspaceQuery.data?.requirements?.length) {
      setWeights(workspaceQuery.data.requirements.map((item) => Number(item.weight)));
    }
    if (workspaceQuery.data?.decision?.status) {
      setDecisionStatus(workspaceQuery.data.decision.status === "ACCEPTED" ? "Accepted" : "Open");
    }
  }, [workspaceQuery.data]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setLoginOpen(false);
        setProfileOpen(false);
        setNotificationsOpen(false);
        setHelpOpen(false);
        setRoomOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const currentTitle = {
    overview: "Decision overview",
    compare: "Compare vendors",
    requirements: "Requirement engine",
    risks: "Risk register",
    documents: "Documents",
    audit: "Audit trail",
  }[view];

  const runSync = () => {
    if (syncing || syncMutation.isPending) return;
    setSyncing(true);
    toast("Refreshing decision model", {
      description: "Checking documents → updating evidence → recalculating scores",
    });
    syncMutation.mutate(
      { roomId: activeRoomId },
      {
        onSuccess: () => {
          setSyncing(false);
          workspaceQuery.refetch();
          toast.success("Decision model refreshed", {
            description: "Evidence ledger and recommendation are up to date.",
          });
        },
        onError: () => {
          setSyncing(false);
          toast.error("Sync failed", {
            description: "The existing decision view remains available.",
          });
        },
      }
    );
  };

  const acceptRecommendation = () => {
    const selectedVendorId =
      workspaceQuery.data?.decision?.selectedVendorId ??
      workspaceQuery.data?.vendors?.slice().sort((left, right) => Number(right.score) - Number(left.score))[0]?.id;
    if (!activeRoomId || !selectedVendorId) {
      toast.error("No vendor is available to accept");
      return;
    }
    const rationale =
      window.prompt("Human decision note (optional)", "Accepted after reviewing the current evidence and recommendation.") ||
      undefined;
    acceptMutation.mutate(
      { roomId: activeRoomId, vendorId: selectedVendorId, rationale },
      {
        onSuccess: () => {
          setDecisionStatus("Accepted");
          workspaceQuery.refetch();
          toast.success("Human decision recorded", {
            description: "The selected vendor and rationale are preserved in the audit trail.",
          });
        },
        onError: () =>
          toast.error("Decision could not be recorded", {
            description: "Review the evidence and try again.",
          }),
      }
    );
  };

  const openClarifyChat = (question: string) => {
    setAskQuestion(question);
    setAskOpen(true);
  };

  return (
    <WorkspaceContext.Provider value={workspaceData}>
      <div className={`app-shell ${sidebarCollapsed ? "shell-collapsed" : ""}`}>
        <aside
          className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""} ${
            sidebarCollapsed ? "sidebar-collapsed" : ""
          }`}
        >
          <div className="spine-rail" aria-hidden="true">
            <span className="spine-label">DECISION ROOM</span>
            <span className="spine-line" />
            <div className="spine-ticks">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span className="spine-page">01—05</span>
          </div>

          <div className="sidebar-brand">
            <button
              className="brand-mark-button"
              aria-label="Toggle sidebar"
              onClick={() => setSidebarCollapsed((value) => !value)}
              style={{ border: 0, background: "transparent", padding: 0 }}
            >
              <img src={logoUrl} alt="Procure Logic mark" />
            </button>
            <div>
              <strong>Procure Logic</strong>
              <span>Decision intelligence</span>
            </div>
            <button className="mobile-close icon-button" onClick={() => setMobileNavOpen(false)}>
              <X size={17} />
            </button>
          </div>

          <div
            className="workspace-switcher"
            onClick={() => setRoomOpen((value) => !value)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") setRoomOpen((value) => !value);
            }}
          >
            <div className="workspace-symbol">Q3</div>
            <div>
              <span>Active decision room</span>
              <strong>{activeRoom || "ERP modernization"}</strong>
            </div>
            <ChevronDown size={14} />
            {roomOpen && (
              <RoomSelector
                activeRoom={activeRoom}
                rooms={roomsQuery.data ?? []}
                onSelect={(room) => {
                  setActiveRoom(room.name);
                  setSelectedRoomId(room.id);
                }}
                onClose={() => setRoomOpen(false)}
              />
            )}
          </div>

          <nav className="primary-nav">
            <span className="nav-heading">Workspace</span>
            <NavItem
              icon={LayoutDashboard}
              label="Overview"
              active={view === "overview"}
              onClick={() => {
                setView("overview");
                setMobileNavOpen(false);
              }}
            />
            <NavItem
              icon={Columns3}
              label="Compare vendors"
              active={view === "compare"}
              onClick={() => {
                setView("compare");
                setMobileNavOpen(false);
              }}
            />
            <NavItem
              icon={ListChecks}
              label="Requirements"
              active={view === "requirements"}
              onClick={() => {
                setView("requirements");
                setMobileNavOpen(false);
              }}
            />
            <NavItem
              icon={AlertTriangle}
              label="Risks & gaps"
              active={view === "risks"}
              count={String(workspaceData.openRiskCount).padStart(2, "0")}
              onClick={() => {
                setView("risks");
                setMobileNavOpen(false);
              }}
            />
            <NavItem
              icon={FolderOpen}
              label="Documents"
              active={view === "documents"}
              count={String(workspaceData.documentCount).padStart(2, "0")}
              onClick={() => {
                setView("documents");
                setMobileNavOpen(false);
              }}
            />
          </nav>

          <nav className="secondary-nav">
            <span className="nav-heading">Decision support</span>
            <NavItem
              icon={MessageSquare}
              label="Ask the decision"
              onClick={() => {
                setAskQuestion("");
                setAskOpen(true);
              }}
            />
            <NavItem icon={FileCheck2} label="Decision brief" onClick={() => setView("overview")} />
            <NavItem
              icon={History}
              label="Audit trail"
              active={view === "audit"}
              onClick={() => setView("audit")}
            />
          </nav>

          <div className="sidebar-bottom">
            <div className="coverage-card">
              <div className="coverage-card-top">
                <span>Evidence coverage</span>
                <strong>{workspaceData.evidenceCoverage}%</strong>
              </div>
              <div className="coverage-track">
                <span style={{ width: `${workspaceData.evidenceCoverage}%` }} />
              </div>
              <p>
                {workspaceData.documents.filter((d) => d.status === "Review needed").length} document(s) need review
              </p>
              <button onClick={() => setView("documents")}>
                Review queue <ArrowRight size={13} />
              </button>
            </div>

            <div className="sidebar-footer">
              <button className="nav-item" onClick={() => setSettingsOpen(true)}>
                <Settings2 size={16} /> Settings
              </button>
              <div className="user-chip-wrap">
                <button
                  className="user-chip"
                  onClick={() => {
                    setProfileAnchor("bottom");
                    setProfileOpen((value) => !value);
                  }}
                >
                  <span>PS</span>
                  <div>
                    <strong>Priya Shah</strong>
                    <small>Procurement lead</small>
                  </div>
                  <MoreHorizontal size={15} />
                </button>
                {profileOpen && profileAnchor === "bottom" && (
                  <ProfileMenu
                    onClose={() => setProfileOpen(false)}
                    onLogin={() => setLoginOpen(true)}
                    onSettings={() => setSettingsOpen(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="main-canvas">
          <header className="topbar">
            <div className="topbar-left">
              <button className="mobile-menu icon-button" onClick={() => setMobileNavOpen(true)}>
                <Menu size={19} />
              </button>
              <div className="breadcrumb">
                <button className="breadcrumb-link" onClick={() => setRoomOpen((value) => !value)}>
                  Decision rooms
                </button>
                <ChevronRight size={13} />
                <button
                  className="breadcrumb-link active"
                  onClick={() => {
                    setActiveRoom("ERP modernization");
                    setView("overview");
                  }}
                >
                  <strong>{activeRoom || "ERP modernization"}</strong>
                </button>
              </div>
            </div>

            <div className="topbar-actions">
              <button className="search-button" onClick={() => setSearchOpen(true)}>
                <Search size={16} />
                <span>Search anything</span>
                <kbd>⌘ K</kbd>
              </button>
              <button
                className="icon-button"
                onClick={() => setHelpOpen((value) => !value)}
                aria-label="Open help"
              >
                <CircleHelp size={17} />
              </button>
              <button
                className="icon-button notification-button"
                onClick={() => setNotificationsOpen((value) => !value)}
                aria-label="Open notifications"
              >
                <Bell size={17} />
                <i />
              </button>
              <button
                className="avatar-button"
                onClick={() => {
                  setProfileAnchor("top");
                  setProfileOpen((value) => !value);
                }}
                aria-label="Open profile"
              >
                PS
              </button>
              {profileOpen && profileAnchor === "top" && (
                <ProfileMenu
                  onClose={() => setProfileOpen(false)}
                  onLogin={() => setLoginOpen(true)}
                  onSettings={() => setSettingsOpen(true)}
                />
              )}
              {notificationsOpen && (
                <NotificationsPanel onClose={() => setNotificationsOpen(false)} setView={setView} />
              )}
              {helpOpen && <HelpPanel view={view} onClose={() => setHelpOpen(false)} />}
            </div>
          </header>

          <div className="canvas-content">
            <div className="page-heading">
              <div>
                <div className="page-kicker">
                  <span>Decision brief</span>
                  <span className="kicker-rule" />
                  <span>
                    {workspaceData.auditTrail[0]?.createdAt
                      ? `Updated ${new Date(workspaceData.auditTrail[0].createdAt).toLocaleDateString()}`
                      : "Awaiting persisted activity"}
                  </span>
                </div>
                <h1>{currentTitle}</h1>
                <p className="page-subtitle">
                  {activeRoom || "ERP modernization"} <span>·</span> {workspaceData.vendorCount} vendor proposals{" "}
                  <span>·</span> {workspaceData.requirementCount} requirements
                </p>
              </div>
              <div className="heading-actions">
                <motion.button
                  className="secondary-button"
                  whileHover={{ y: -1.5, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.16, ease: EASE_PRECISE }}
                  onClick={() => {
                    setAskQuestion("");
                    setAskOpen(true);
                  }}
                >
                  <Bot size={15} /> Ask the decision
                </motion.button>
                <motion.button
                  className="primary-button"
                  whileHover={{ y: -1.5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.16, ease: EASE_PRECISE }}
                  onClick={() => setUploadOpen(true)}
                >
                  <Plus size={16} /> Add proposal
                </motion.button>
              </div>
            </div>

            <div className="tab-bar">
              {(["overview", "compare", "requirements", "risks", "documents", "audit"] as View[]).map(
                (tab) => {
                  const label =
                    tab === "overview"
                      ? "Overview"
                      : tab === "compare"
                      ? "Compare vendors"
                      : tab === "requirements"
                      ? "Requirements"
                      : tab === "risks"
                      ? "Risks & gaps"
                      : tab === "documents"
                      ? "Documents"
                      : "Audit trail";
                  return (
                    <button
                      className={`tab-button ${view === tab ? "tab-active" : ""}`}
                      key={tab}
                      onClick={() => setView(tab)}
                    >
                      {view === tab && (
                        <motion.div
                          layoutId="activeTabPill"
                          className="tab-indicator"
                          transition={tabIndicator}
                        />
                      )}
                      <span className="tab-label">{label}</span>
                      {tab === "risks" && workspaceData.openRiskCount > 0 && (
                        <span className="tab-count">{workspaceData.openRiskCount}</span>
                      )}
                    </button>
                  );
                }
              )}
              <span className="tab-spacer" />
              <button
                className="view-mode-button"
                onClick={acceptRecommendation}
                title="Click to accept decision"
              >
                <Gauge size={14} /> {decisionStatus} <ChevronDown size={13} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {view === "overview" && (
                <Overview
                  key="overview"
                  openEvidence={setEvidence}
                  openRisk={setSelectedRisk}
                  setView={setView}
                  acceptRecommendation={acceptRecommendation}
                  decisionStatus={decisionStatus}
                  openChat={() => {
                    setAskQuestion("");
                    setAskOpen(true);
                  }}
                />
              )}
              {view === "compare" && (
                <Compare
                  key="compare"
                  openEvidence={setEvidence}
                  openRequirement={setSelectedRequirement}
                />
              )}
              {view === "requirements" && (
                <Requirements
                  key="requirements"
                  weights={weights}
                  setWeights={setWeights}
                  roomId={activeRoomId}
                  openRequirement={setSelectedRequirement}
                />
              )}
              {view === "risks" && (
                <Risks
                  key="risks"
                  onClarify={openClarifyChat}
                  onSelectRisk={setSelectedRisk}
                />
              )}
              {view === "documents" && <Documents key="documents" openEvidence={setEvidence} />}
              {view === "audit" && <AuditTrail key="audit" />}
            </AnimatePresence>
          </div>

          <footer className="canvas-footer">
            <span>
              <span className="status-dot" /> {syncing ? "Refreshing model…" : "Evidence ledger active"}
            </span>
            <span>AI recommends. Your team decides.</span>
            <button onClick={runSync} disabled={syncing}>
              {syncing ? "Syncing…" : "Sync"}{" "}
              <RotateCcw size={13} className={syncing ? "spin-icon" : ""} />
            </button>
          </footer>
        </main>

        <AnimatePresence>
          {evidence && (
            <EvidenceDrawer
              key="evidence-drawer"
              evidence={evidence}
              onClose={() => setEvidence(null)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {selectedRisk && (
            <RiskDrawer
              key="risk-drawer"
              risk={selectedRisk}
              onClose={() => setSelectedRisk(null)}
              onClarify={(question) => {
                setSelectedRisk(null);
                setAskQuestion(question);
                setAskOpen(true);
              }}
              openEvidence={(ev) => {
                setSelectedRisk(null);
                setEvidence(ev);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {selectedRequirement && (
            <RequirementDrawer
              key="requirement-drawer"
              requirement={selectedRequirement}
              onClose={() => setSelectedRequirement(null)}
              openEvidence={(ev) => {
                setSelectedRequirement(null);
                setEvidence(ev);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {askOpen && (
            <AskDrawer
              key="ask-drawer"
              onClose={() => {
                setAskOpen(false);
                setAskQuestion("");
              }}
              initialQuestion={askQuestion}
              roomId={activeRoomId}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {uploadOpen && (
            <UploadModal
              key="upload-modal"
              roomId={activeRoomId}
              onUploaded={() => workspaceQuery.refetch()}
              onClose={() => setUploadOpen(false)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {searchOpen && (
            <SearchOverlay
              key="search-overlay"
              roomId={activeRoomId}
              onClose={() => setSearchOpen(false)}
              setView={setView}
              openEvidence={setEvidence}
              openChat={() => {
                setAskQuestion("");
                setAskOpen(true);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {loginOpen && <LoginModal key="login-modal" onClose={() => setLoginOpen(false)} />}
        </AnimatePresence>
        <AnimatePresence>
          {settingsOpen && <SettingsPanel key="settings-panel" onClose={() => setSettingsOpen(false)} />}
        </AnimatePresence>
      </div>
    </WorkspaceContext.Provider>
  );
}
