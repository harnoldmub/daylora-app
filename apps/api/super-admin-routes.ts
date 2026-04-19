import { Express, Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { db } from "./db";
import { superAdmins, adminAuditLogs, promoCodes, weddings, users, rsvpResponses, contributions, stripeSubscriptions } from "@shared/schema";
import { eq, sql, desc, ilike, or, and, gte, lte, count } from "drizzle-orm";
import { authService } from "./auth-service";
import { storage } from "./storage";
import { insertSupportMessageSchema } from "@shared/schema";
import { supportChatService } from "./support-chat-service";
import { validateRequest } from "./middleware/guards";

declare module "express-session" {
  interface SessionData {
    superAdminId?: number;
  }
}

async function logAdminAction(
  adminId: number,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: any,
  ip: string
) {
  await db.insert(adminAuditLogs).values({
    adminId,
    action,
    targetType,
    targetId,
    details,
    ipAddress: ip,
  });
}

function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.superAdminId) {
    return next();
  }
  res.status(401).json({ message: "Accès non autorisé." });
}

function getClientIp(req: Request): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
}

export async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) return;

  const [existing] = await db.select().from(superAdmins).where(eq(superAdmins.email, email.toLowerCase()));
  if (existing) return;

  const passwordHash = await authService.hashPassword(password);
  await db.insert(superAdmins).values({
    email: email.toLowerCase(),
    passwordHash,
    mustChangePassword: true,
  });
  console.log(`[super-admin] Seeded super admin: ${email}`);
}

export function registerSuperAdminRoutes(app: Express) {
  const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV !== "production" ? 100 : 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
  });

  app.post("/api/super-admin/login", adminLoginLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis." });
      }

      const [admin] = await db.select().from(superAdmins).where(eq(superAdmins.email, email.toLowerCase()));
      if (!admin) {
        return res.status(401).json({ message: "Identifiants invalides." });
      }

      const valid = await authService.verifyPassword(password, admin.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Identifiants invalides." });
      }

      req.session.superAdminId = admin.id;

      await logAdminAction(admin.id, "login", "admin", String(admin.id), {}, getClientIp(req));

      res.json({
        id: admin.id,
        email: admin.email,
        mustChangePassword: admin.mustChangePassword,
      });
    } catch (error: any) {
      console.error("Super admin login error:", error?.message);
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.post("/api/super-admin/logout", isSuperAdmin, async (req: Request, res: Response) => {
    const adminId = req.session.superAdminId!;
    await logAdminAction(adminId, "logout", "admin", String(adminId), {}, getClientIp(req));
    delete req.session.superAdminId;
    res.json({ success: true });
  });

  app.get("/api/super-admin/me", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const [admin] = await db.select().from(superAdmins).where(eq(superAdmins.id, req.session.superAdminId!));
      if (!admin) {
        return res.status(401).json({ message: "Admin introuvable." });
      }
      res.json({
        id: admin.id,
        email: admin.email,
        mustChangePassword: admin.mustChangePassword,
      });
    } catch {
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.post("/api/super-admin/change-password", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Ancien et nouveau mot de passe requis." });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
      }

      const [admin] = await db.select().from(superAdmins).where(eq(superAdmins.id, req.session.superAdminId!));
      if (!admin) {
        return res.status(401).json({ message: "Admin introuvable." });
      }

      const valid = await authService.verifyPassword(oldPassword, admin.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Ancien mot de passe incorrect." });
      }

      const newHash = await authService.hashPassword(newPassword);
      await db.update(superAdmins).set({
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      }).where(eq(superAdmins.id, admin.id));

      await logAdminAction(admin.id, "change_password", "admin", String(admin.id), {}, getClientIp(req));

      res.json({ success: true });
    } catch (error: any) {
      console.error("Change password error:", error?.message);
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.get("/api/super-admin/stats", isSuperAdmin, async (_req: Request, res: Response) => {
    try {
      const [weddingStats] = await db.select({
        total: count(),
        premium: sql<number>`COUNT(*) FILTER (WHERE ${weddings.currentPlan} = 'premium')`,
      }).from(weddings);

      const [userStats] = await db.select({ total: count() }).from(users);
      const [rsvpStats] = await db.select({ total: count() }).from(rsvpResponses);
      const [contribStats] = await db.select({
        total: sql<number>`COALESCE(SUM(${contributions.amount}), 0)`,
      }).from(contributions).where(eq(contributions.status, "paid"));

      res.json({
        totalWeddings: weddingStats?.total || 0,
        premiumWeddings: Number(weddingStats?.premium) || 0,
        totalUsers: userStats?.total || 0,
        totalRsvps: rsvpStats?.total || 0,
        totalContributions: Number(contribStats?.total) || 0,
      });
    } catch (error: any) {
      console.error("Stats error:", error?.message);
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.get("/api/super-admin/tenants", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const q = (req.query.q as string || "").trim();
      const offset = (page - 1) * limit;

      let whereClause;
      if (q) {
        whereClause = or(
          ilike(weddings.slug, `%${q}%`),
          ilike(weddings.title, `%${q}%`),
          sql`${weddings.ownerId} IN (SELECT id FROM users WHERE LOWER(email) LIKE ${`%${q.toLowerCase()}%`})`
        );
      }

      const [{ total: totalCount }] = await db.select({ total: count() }).from(weddings).where(whereClause);

      const results = await db
        .select({
          id: weddings.id,
          slug: weddings.slug,
          title: weddings.title,
          currentPlan: weddings.currentPlan,
          status: weddings.status,
          isPublished: weddings.isPublished,
          createdAt: weddings.createdAt,
          ownerId: weddings.ownerId,
          ownerEmail: users.email,
          ownerFirstName: users.firstName,
          ownerLastName: users.lastName,
        })
        .from(weddings)
        .leftJoin(users, eq(weddings.ownerId, users.id))
        .where(whereClause)
        .orderBy(desc(weddings.createdAt))
        .limit(limit)
        .offset(offset);

      const weddingIds = results.map(r => r.id);
      let rsvpCounts: Record<string, number> = {};
      if (weddingIds.length > 0) {
        const rsvpData = await db
          .select({
            weddingId: rsvpResponses.weddingId,
            cnt: count(),
          })
          .from(rsvpResponses)
          .where(sql`${rsvpResponses.weddingId} IN (${sql.join(weddingIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(rsvpResponses.weddingId);
        for (const r of rsvpData) {
          rsvpCounts[r.weddingId] = r.cnt;
        }
      }

      const tenants = results.map(r => ({
        ...r,
        rsvpCount: rsvpCounts[r.id] || 0,
      }));

      res.json({
        tenants,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error: any) {
      console.error("Tenants list error:", error?.message);
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.get("/api/super-admin/tenants/:id", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      
      const [wedding] = await db.select().from(weddings).where(eq(weddings.id, id));
      if (!wedding) {
        return res.status(404).json({ message: "Mariage introuvable." });
      }

      const [owner] = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      }).from(users).where(eq(users.id, wedding.ownerId));

      const [rsvpData] = await db.select({ total: count() }).from(rsvpResponses).where(eq(rsvpResponses.weddingId, id));

      const [contribData] = await db.select({
        total: sql<number>`COALESCE(SUM(${contributions.amount}), 0)`,
        count: count(),
      }).from(contributions).where(and(eq(contributions.weddingId, id), eq(contributions.status, "paid")));

      const [sub] = await db.select().from(stripeSubscriptions).where(eq(stripeSubscriptions.weddingId, id));

      res.json({
        wedding,
        owner,
        rsvpCount: rsvpData?.total || 0,
        contributionTotal: Number(contribData?.total) || 0,
        contributionCount: contribData?.count || 0,
        subscription: sub || null,
      });
    } catch (error: any) {
      console.error("Tenant detail error:", error?.message);
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.patch("/api/super-admin/tenants/:id/status", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      
      const { status, isPublished } = req.body;
      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (isPublished !== undefined) updates.isPublished = isPublished;
      updates.updatedAt = new Date();

      const [updated] = await db.update(weddings).set(updates).where(eq(weddings.id, id)).returning();
      if (!updated) {
        return res.status(404).json({ message: "Mariage introuvable." });
      }

      await logAdminAction(req.session.superAdminId!, "update_status", "wedding", String(id), { status, isPublished }, getClientIp(req));

      res.json(updated);
    } catch (error: any) {
      console.error("Tenant status error:", error?.message);
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.patch("/api/super-admin/tenants/:id/plan", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      
      const { plan } = req.body;
      if (!["free", "premium"].includes(plan)) {
        return res.status(400).json({ message: "Plan invalide." });
      }

      const [updated] = await db.update(weddings).set({
        currentPlan: plan,
        updatedAt: new Date(),
      }).where(eq(weddings.id, id)).returning();

      if (!updated) {
        return res.status(404).json({ message: "Mariage introuvable." });
      }

      await logAdminAction(req.session.superAdminId!, "update_plan", "wedding", String(id), { plan }, getClientIp(req));

      res.json(updated);
    } catch (error: any) {
      console.error("Tenant plan error:", error?.message);
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.patch("/api/super-admin/tenants/:id/slug", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      
      const { slug } = req.body;
      if (!slug || slug.length < 3) {
        return res.status(400).json({ message: "Le slug doit contenir au moins 3 caractères." });
      }

      const [existing] = await db.select().from(weddings).where(eq(weddings.slug, slug));
      if (existing && existing.id !== id) {
        return res.status(409).json({ message: "Ce slug est déjà utilisé." });
      }

      const [updated] = await db.update(weddings).set({
        slug,
        updatedAt: new Date(),
      }).where(eq(weddings.id, id)).returning();

      if (!updated) {
        return res.status(404).json({ message: "Mariage introuvable." });
      }

      await logAdminAction(req.session.superAdminId!, "update_slug", "wedding", String(id), { slug }, getClientIp(req));

      res.json(updated);
    } catch (error: any) {
      console.error("Tenant slug error:", error?.message);
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.get("/api/super-admin/promos", isSuperAdmin, async (_req: Request, res: Response) => {
    try {
      const codes = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
      res.json(codes);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.post("/api/super-admin/promos", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const { code, type, value, durationMonths, startDate, endDate, maxUses, maxUsesPerUser, isActive } = req.body;

      if (!code || !type || value === undefined) {
        return res.status(400).json({ message: "Code, type et valeur sont requis." });
      }

      const [existing] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
      if (existing) {
        return res.status(409).json({ message: "Ce code promo existe déjà." });
      }

      const [created] = await db.insert(promoCodes).values({
        code: code.toUpperCase(),
        type,
        value,
        durationMonths: durationMonths || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        maxUses: maxUses || null,
        maxUsesPerUser: maxUsesPerUser ?? 1,
        isActive: isActive ?? true,
      }).returning();

      await logAdminAction(req.session.superAdminId!, "create_promo", "promo", String(created.id), { code: code.toUpperCase() }, getClientIp(req));

      res.status(201).json(created);
    } catch (error: any) {
      console.error("Create promo error:", error?.message);
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.patch("/api/super-admin/promos/:id", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { code, type, value, durationMonths, startDate, endDate, maxUses, maxUsesPerUser, isActive } = req.body;

      const updates: any = {};
      if (code !== undefined) updates.code = code.toUpperCase();
      if (type !== undefined) updates.type = type;
      if (value !== undefined) updates.value = value;
      if (durationMonths !== undefined) updates.durationMonths = durationMonths;
      if (startDate !== undefined) updates.startDate = new Date(startDate);
      if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
      if (maxUses !== undefined) updates.maxUses = maxUses;
      if (maxUsesPerUser !== undefined) updates.maxUsesPerUser = maxUsesPerUser;
      if (isActive !== undefined) updates.isActive = isActive;

      const [updated] = await db.update(promoCodes).set(updates).where(eq(promoCodes.id, id)).returning();
      if (!updated) {
        return res.status(404).json({ message: "Code promo introuvable." });
      }

      await logAdminAction(req.session.superAdminId!, "update_promo", "promo", String(id), updates, getClientIp(req));

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.delete("/api/super-admin/promos/:id", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [updated] = await db.update(promoCodes).set({ isActive: false }).where(eq(promoCodes.id, id)).returning();
      if (!updated) {
        return res.status(404).json({ message: "Code promo introuvable." });
      }

      await logAdminAction(req.session.superAdminId!, "deactivate_promo", "promo", String(id), { code: updated.code }, getClientIp(req));

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  app.post("/api/promo/validate", async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ valid: false, message: "Code requis." });
      }

      const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
      if (!promo || !promo.isActive) {
        return res.json({ valid: false, message: "Code promo invalide ou expiré." });
      }

      const now = new Date();
      if (promo.startDate && now < new Date(promo.startDate)) {
        return res.json({ valid: false, message: "Ce code promo n'est pas encore actif." });
      }
      if (promo.endDate && now > new Date(promo.endDate)) {
        return res.json({ valid: false, message: "Ce code promo a expiré." });
      }
      if (promo.maxUses && promo.currentUses >= promo.maxUses) {
        return res.json({ valid: false, message: "Ce code promo a atteint sa limite d'utilisation." });
      }

      res.json({
        valid: true,
        code: promo.code,
        type: promo.type,
        value: promo.value,
      });
    } catch (error: any) {
      res.status(500).json({ valid: false, message: "Erreur interne." });
    }
  });

  app.get("/api/super-admin/conversations", isSuperAdmin, async (_req: Request, res: Response) => {
    try {
      const conversations = await storage.listSupportConversations();
      const enriched = await Promise.all(
        conversations.map(async (conversation) => {
          const [user, wedding, messages] = await Promise.all([
            storage.getUser(conversation.userId),
            conversation.weddingId ? storage.getWedding(conversation.weddingId) : Promise.resolve(undefined),
            storage.listSupportMessages(conversation.id),
          ]);

          const lastMessage = messages[messages.length - 1] || null;
          const unreadCount = messages.filter((message) => (message.senderType || message.role) === "user" && !message.readAt).length;

          return {
            id: conversation.id,
            userId: conversation.userId,
            weddingId: conversation.weddingId,
            name: [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.email || "Utilisateur",
            email: user?.email || "",
            weddingSlug: wedding?.slug || null,
            weddingTitle: wedding?.title || null,
            lastMessage,
            unreadCount,
            status: conversation.status,
            isUnread: unreadCount > 0,
            sourcePage: conversation.sourcePage,
            sourcePlan: conversation.sourcePlan,
            updatedAt: conversation.updatedAt,
            lastMessageAt: conversation.lastMessageAt,
          };
        }),
      );

      res.json(enriched);
    } catch (error: any) {
      console.error("Conversations list error:", error?.message);
      res.status(500).json({ message: "Impossible de charger les conversations." });
    }
  });

  app.get("/api/super-admin/conversations/:id(\\d+)", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      if (!Number.isFinite(conversationId)) {
        return res.status(400).json({ message: "Conversation invalide." });
      }

      const conversation = await storage.getSupportConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation introuvable." });
      }

      await storage.markSupportMessagesRead(conversation.id, "admin");
      const updatedConversation = await storage.touchSupportConversation(conversation.id, {
        lastReadByAdminAt: new Date(),
      });

      const [user, wedding, messages] = await Promise.all([
        storage.getUser(updatedConversation.userId),
        updatedConversation.weddingId ? storage.getWedding(updatedConversation.weddingId) : Promise.resolve(undefined),
        storage.listSupportMessages(updatedConversation.id),
      ]);

      supportChatService.emitToUser(updatedConversation.userId, "support.read", {
        conversationId: updatedConversation.id,
        reader: "admin",
      });

      res.json({
        conversation: updatedConversation,
        user: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          : null,
        wedding: wedding
          ? {
              id: wedding.id,
              slug: wedding.slug,
              title: wedding.title,
            }
          : null,
        messages,
        quickActions: messages.find((message) => (message.senderType || message.role) === "bot")?.metadata?.quickActions || [],
      });
    } catch (error: any) {
      console.error("Conversation detail error:", error?.message);
      res.status(500).json({ message: "Impossible de charger cette conversation." });
    }
  });

  app.post("/api/super-admin/conversations/:id(\\d+)/messages", isSuperAdmin, validateRequest(insertSupportMessageSchema), async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      if (!Number.isFinite(conversationId)) {
        return res.status(400).json({ message: "Conversation invalide." });
      }

      const conversation = await storage.getSupportConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation introuvable." });
      }

      const now = new Date();
      const message = await storage.createSupportMessage({
        conversationId: conversation.id,
        userId: conversation.userId,
        weddingId: conversation.weddingId,
        role: "admin",
        senderType: "admin",
        senderId: String(req.session.superAdminId || ""),
        content: req.body.content.trim(),
        pageLabel: req.body.pageLabel || null,
        currentUrl: req.body.currentUrl || null,
      });

      const updatedConversation = await storage.touchSupportConversation(conversation.id, {
        lastMessageAt: now,
        lastReadByAdminAt: now,
        status: "answered",
      });

      const payload = {
        conversationId: updatedConversation.id,
        conversation: updatedConversation,
        message,
      };

      supportChatService.emitToUser(updatedConversation.userId, "support.message", payload);
      supportChatService.emitToAdmins("support.message", payload);
      await logAdminAction(req.session.superAdminId!, "reply_support_conversation", "support_conversation", String(conversation.id), {}, getClientIp(req));

      res.status(201).json(payload);
    } catch (error: any) {
      console.error("Conversation reply error:", error?.message);
      res.status(500).json({ message: "Impossible d'envoyer la réponse." });
    }
  });

  app.post("/api/super-admin/conversations/:id(\\d+)/read", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      if (!Number.isFinite(conversationId)) {
        return res.status(400).json({ message: "Conversation invalide." });
      }

      const conversation = await storage.getSupportConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation introuvable." });
      }

      await storage.markSupportMessagesRead(conversation.id, "admin");
      const updatedConversation = await storage.touchSupportConversation(conversation.id, {
        lastReadByAdminAt: new Date(),
      });

      supportChatService.emitToUser(updatedConversation.userId, "support.read", {
        conversationId: updatedConversation.id,
        reader: "admin",
      });

      res.json({ success: true, conversation: updatedConversation });
    } catch (error: any) {
      console.error("Conversation read error:", error?.message);
      res.status(500).json({ message: "Impossible de marquer la conversation comme lue." });
    }
  });

  app.post("/api/super-admin/conversations/:id(\\d+)/status", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id, 10);
      const nextStatus = String(req.body?.status || "");
      if (!Number.isFinite(conversationId)) {
        return res.status(400).json({ message: "Conversation invalide." });
      }
      if (!["open", "pending", "answered", "closed"].includes(nextStatus)) {
        return res.status(400).json({ message: "Statut invalide." });
      }

      const conversation = await storage.getSupportConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation introuvable." });
      }

      const updatedConversation = await storage.touchSupportConversation(conversation.id, {
        status: nextStatus as any,
      });

      supportChatService.emitToUser(updatedConversation.userId, "support.conversation", {
        conversation: updatedConversation,
      });
      supportChatService.emitToAdmins("support.conversation", {
        conversation: updatedConversation,
      });

      await logAdminAction(
        req.session.superAdminId!,
        "update_support_conversation_status",
        "support_conversation",
        String(conversation.id),
        { status: nextStatus },
        getClientIp(req),
      );

      res.json({ success: true, conversation: updatedConversation });
    } catch (error: any) {
      console.error("Conversation status error:", error?.message);
      res.status(500).json({ message: "Impossible de mettre à jour le statut." });
    }
  });

  app.get("/api/super-admin/conversations/stream", isSuperAdmin, async (req: Request, res: Response) => {
    supportChatService.addAdminConnection(req, res);
  });

  app.get("/api/super-admin/audit-logs", isSuperAdmin, async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));
      const offset = (page - 1) * limit;
      const action = req.query.action as string;
      const targetType = req.query.targetType as string;

      const conditions = [];
      if (action) conditions.push(eq(adminAuditLogs.action, action));
      if (targetType) conditions.push(eq(adminAuditLogs.targetType, targetType));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [{ total: totalCount }] = await db.select({ total: count() }).from(adminAuditLogs).where(whereClause);

      const logs = await db
        .select({
          id: adminAuditLogs.id,
          action: adminAuditLogs.action,
          targetType: adminAuditLogs.targetType,
          targetId: adminAuditLogs.targetId,
          details: adminAuditLogs.details,
          ipAddress: adminAuditLogs.ipAddress,
          createdAt: adminAuditLogs.createdAt,
          adminEmail: superAdmins.email,
        })
        .from(adminAuditLogs)
        .leftJoin(superAdmins, eq(adminAuditLogs.adminId, superAdmins.id))
        .where(whereClause)
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      res.json({
        logs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error: any) {
      console.error("Audit logs error:", error?.message);
      res.status(500).json({ message: "Erreur interne." });
    }
  });

  seedSuperAdmin().catch(err => console.error("Super admin seed error:", err.message));
}
