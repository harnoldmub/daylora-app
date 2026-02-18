import { describe, it, expect, beforeEach } from "vitest";
import { MockStorage } from "../helpers/mock-storage";
import { buildUser, buildWedding, resetCounter } from "../helpers/factories";

describe("Permissions & Role-Based Access", () => {
  let storage: MockStorage;
  let owner: any;
  let editor: any;
  let viewer: any;
  let stranger: any;
  let admin: any;
  let wedding: any;

  beforeEach(async () => {
    storage = new MockStorage();
    resetCounter();

    owner = await storage.upsertUser(buildUser({ email: "owner@test.fr", firstName: "Owner" }));
    editor = await storage.upsertUser(buildUser({ email: "editor@test.fr", firstName: "Editor" }));
    viewer = await storage.upsertUser(buildUser({ email: "viewer@test.fr", firstName: "Viewer" }));
    stranger = await storage.upsertUser(buildUser({ email: "stranger@test.fr", firstName: "Stranger" }));
    admin = await storage.upsertUser(buildUser({ email: "admin@test.fr", firstName: "Admin", isAdmin: true }));

    wedding = await storage.createWedding(buildWedding(owner.id, { slug: "test-wedding" }));

    await storage.createMembership({ userId: editor.id, weddingId: wedding.id, role: "editor" });
    await storage.createMembership({ userId: viewer.id, weddingId: wedding.id, role: "viewer" });
  });

  describe("requireRole middleware logic", () => {
    function checkAccess(
      user: any,
      weddingData: any,
      requiredRoles: string[],
      membershipsData: any[]
    ): { allowed: boolean; reason: string } {
      if (!user) return { allowed: false, reason: "Not authenticated" };
      if (!weddingData) return { allowed: false, reason: "Wedding not found" };
      if (user.isAdmin) return { allowed: true, reason: "Global admin" };
      if (weddingData.ownerId === user.id) return { allowed: true, reason: "Owner" };

      const membership = membershipsData.find((m) => m.userId === user.id);
      if (!membership || !requiredRoles.includes(membership.role)) {
        return { allowed: false, reason: "Insufficient role" };
      }
      return { allowed: true, reason: `Has role: ${membership.role}` };
    }

    it("CASE: owner has access to all operations", async () => {
      const memberships = await storage.getMembershipsByWedding(wedding.id);
      const result = checkAccess(owner, wedding, ["owner", "admin"], memberships);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe("Owner");
    });

    it("CASE: editor has access to editor-allowed operations", async () => {
      const memberships = await storage.getMembershipsByWedding(wedding.id);
      const result = checkAccess(editor, wedding, ["owner", "admin", "editor"], memberships);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe("Has role: editor");
    });

    it("CASE: viewer has access to view operations", async () => {
      const memberships = await storage.getMembershipsByWedding(wedding.id);
      const result = checkAccess(viewer, wedding, ["owner", "admin", "editor", "viewer"], memberships);
      expect(result.allowed).toBe(true);
    });

    it("CASE: viewer denied for owner-only operations", async () => {
      const memberships = await storage.getMembershipsByWedding(wedding.id);
      const result = checkAccess(viewer, wedding, ["owner", "admin"], memberships);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Insufficient role");
    });

    it("CASE: editor denied for owner-only operations", async () => {
      const memberships = await storage.getMembershipsByWedding(wedding.id);
      const result = checkAccess(editor, wedding, ["owner"], memberships);
      expect(result.allowed).toBe(false);
    });

    it("CASE: stranger has no access", async () => {
      const memberships = await storage.getMembershipsByWedding(wedding.id);
      const result = checkAccess(stranger, wedding, ["owner", "admin", "editor", "viewer"], memberships);
      expect(result.allowed).toBe(false);
    });

    it("CASE: global admin bypasses all checks", async () => {
      const memberships = await storage.getMembershipsByWedding(wedding.id);
      const result = checkAccess(admin, wedding, ["owner"], memberships);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe("Global admin");
    });

    it("CASE: unauthenticated user denied", async () => {
      const memberships = await storage.getMembershipsByWedding(wedding.id);
      const result = checkAccess(null, wedding, ["viewer"], memberships);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Not authenticated");
    });
  });

  describe("Wedding ownership", () => {
    it("CASE: only owner's weddings returned by getWeddingsByOwner", async () => {
      const editorWedding = await storage.createWedding(
        buildWedding(editor.id, { slug: "editor-wedding" })
      );

      const ownerWeddings = await storage.getWeddingsByOwner(owner.id);
      expect(ownerWeddings).toHaveLength(1);
      expect(ownerWeddings[0].ownerId).toBe(owner.id);

      const editorWeddings = await storage.getWeddingsByOwner(editor.id);
      expect(editorWeddings).toHaveLength(1);
      expect(editorWeddings[0].id).toBe(editorWedding.id);
    });

    it("CASE: getWeddingsForUser includes owned + member weddings", async () => {
      const userWeddings = await storage.getWeddingsForUser(editor.id);
      expect(userWeddings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Premium gating", () => {
    it("CASE: free plan wedding is not premium", () => {
      expect(wedding.currentPlan).toBe("free");
    });

    it("CASE: premium plan is detected from subscription", async () => {
      await storage.upsertStripeSubscription({
        weddingId: wedding.id,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        status: "active",
      });

      const sub = await storage.getSubscriptionByWedding(wedding.id);
      const isPremium = !!sub && ["active", "trialing"].includes(sub.status);
      expect(isPremium).toBe(true);
    });

    it("CASE: canceled subscription is not premium", async () => {
      await storage.upsertStripeSubscription({
        weddingId: wedding.id,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        status: "canceled",
      });

      const sub = await storage.getSubscriptionByWedding(wedding.id);
      const isPremium = !!sub && ["active", "trialing"].includes(sub.status);
      expect(isPremium).toBe(false);
    });

    it("CASE: trialing subscription is premium", async () => {
      await storage.upsertStripeSubscription({
        weddingId: wedding.id,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        status: "trialing",
      });

      const sub = await storage.getSubscriptionByWedding(wedding.id);
      const isPremium = !!sub && ["active", "trialing"].includes(sub.status);
      expect(isPremium).toBe(true);
    });
  });
});
