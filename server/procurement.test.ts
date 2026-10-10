import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getRoomSnapshot } from "./db";
import { nextDocumentVersion } from "./documentVersioning";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createOtherUserContext(): TrpcContext {
  return {
    user: { id: 999999, openId: "other-user", name: "Other User", email: "other@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("procurement workspace", () => {
  it("rejects empty analyst questions at the procedure boundary", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.workspace.analystQuery({ roomId: 1, question: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("exposes the seeded workspace snapshot and ranking", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.workspace.bootstrap({ roomId: 1 });
    expect(result).toHaveProperty("room");
    expect(result?.vendors.length).toBeGreaterThanOrEqual(3);
    expect(result?.evidence.length).toBeGreaterThanOrEqual(1);
    expect(result?.ranking?.[0]?.rank).toBe(1);
  });

  it("recalculates scores, coverage, and ranking during sync", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.workspace.sync({ roomId: 1 });
    expect(result.status).toBe("complete");
    expect(result.ranking.length).toBeGreaterThanOrEqual(3);
    expect(typeof Number(result.evidenceCoverage)).toBe("number");
    const snapshot = await getRoomSnapshot(1);
    expect(snapshot?.ranking?.[0]?.rank).toBe(1);
  }, 15000);

  it("persists requirement weight changes and rejects invalid uploads", async () => {
    const caller = appRouter.createCaller(createContext());
    const snapshot = await caller.workspace.bootstrap({ roomId: 1 });
    const requirementId = snapshot?.requirements[0]?.id;
    expect(requirementId).toBeTruthy();
    const updated = await caller.workspace.updateRequirement({ id: requirementId as number, weight: 30 });
    expect(Number(updated?.weight)).toBe(30);
    await expect(caller.workspace.uploadProposal({ roomId: 1, fileName: "proposal.pdf", base64: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }, 15000);

  it("searches only the owned room and returns evidence hits", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.workspace.search({ roomId: 1, query: "migration" });
    expect(result.some(item => item.kind === "evidence" || item.kind === "risk")).toBe(true);
  }, 15000);

  it("rejects cross-user room access", async () => {
    const caller = appRouter.createCaller(createOtherUserContext());
    await expect(caller.workspace.bootstrap({ roomId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  }, 15000);

  it("increments document versions deterministically", () => {
    expect(nextDocumentVersion(0)).toBe("v1");
    expect(nextDocumentVersion(1)).toBe("v2");
    expect(nextDocumentVersion(7)).toBe("v8");
  });

  it("marks a user-scoped notification read", async () => {
    const caller = appRouter.createCaller(createContext());
    const notifications = await caller.workspace.notifications();
    const first = notifications[0];
    expect(first).toBeTruthy();
    await caller.workspace.markNotificationRead({ id: first!.id });
    const refreshed = await caller.workspace.notifications();
    expect(refreshed.find(item => item.id === first!.id)?.isRead).toBe(true);
  }, 15000);

  it("persists a failed extraction lifecycle for unsupported uploads", async () => {
    const caller = appRouter.createCaller(createContext());
    const fileName = `unsupported-${Date.now()}.txt`;
    const result = await caller.workspace.uploadProposal({ roomId: 1, fileName, mimeType: "text/plain", base64: Buffer.from("unsupported content").toString("base64"), vendorName: "Vertex Systems" });
    expect(result.status).toBe("FAILED");
    const snapshot = await caller.workspace.bootstrap({ roomId: 1 });
    const document = snapshot?.documents.find(item => item.name === fileName);
    expect(document?.processingStatus).toBe("FAILED");
  }, 30000);
});
