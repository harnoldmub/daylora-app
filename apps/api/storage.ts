import {
  users,
  rsvpResponses,
  contributions,
  weddings,
  gifts,
  liveJokes,
  emailVerificationTokens,
  passwordResetTokens,
  memberships,
  liveEvents,
  emailLogs,
  stripeSubscriptions,
  stripeWebhookEvents,
  referralCodes,
  type User,
  type InsertUser,
  type RsvpResponse,
  type InsertRsvpResponse,
  type UpdateRsvpResponse,
  type Contribution,
  type InsertContribution,
  type Wedding,
  type InsertWedding,
  type Gift,
  type InsertGift,
  type LiveJoke,
  type InsertLiveJoke,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  type PasswordResetToken,
  type ReferralCode,
  type InsertPasswordResetToken,
  type EmailLog,
  type InsertEmailLog,
  productFeedback,
  type ProductFeedback,
  type InsertProductFeedback,
  supportConversations,
  supportMessages,
  organizationChecklistCategories,
  organizationChecklistItems,
  organizationPlanningItems,
  organizationBudgetCategories,
  organizationBudgetItems,
  type SupportConversation,
  type InsertSupportConversation,
  type SupportMessage,
  type InsertSupportMessage,
  type OrganizationChecklistCategory,
  type InsertOrganizationChecklistCategory,
  type OrganizationChecklistItem,
  type InsertOrganizationChecklistItem,
  type OrganizationPlanningItem,
  type InsertOrganizationPlanningItem,
  type OrganizationBudgetCategory,
  type InsertOrganizationBudgetCategory,
  type OrganizationBudgetItem,
  type InsertOrganizationBudgetItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByAppleId(appleId: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;

  // Email verification token operations
  createEmailVerificationToken(data: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationToken | undefined>;
  consumeEmailVerificationToken(id: number): Promise<void>;
  deleteExpiredEmailVerificationTokens(): Promise<void>;

  // Password reset token operations
  createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | undefined>;
  consumePasswordResetToken(id: number): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;

  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  deleteUserAccount(id: string): Promise<void>;

  // Wedding operations
  getWedding(id: string): Promise<Wedding | undefined>;
  getWeddingBySlug(slug: string): Promise<Wedding | undefined>;
  getWeddingsByOwner(ownerId: string): Promise<Wedding[]>;
  getWeddingsForUser(userId: string): Promise<Wedding[]>;
  createWedding(wedding: InsertWedding): Promise<Wedding>;
  updateWedding(id: string, wedding: Partial<Wedding>): Promise<Wedding>;
  deleteWedding(id: string): Promise<void>;

  // Membership operations
  getMembershipsByWedding(weddingId: string): Promise<any[]>;
  getMembershipByUserAndWedding(userId: string, weddingId: string): Promise<any | undefined>;
  createMembership(data: { userId: string, weddingId: string, role: string }): Promise<any>;

  // RSVP (Guest) operations
  createRsvpResponse(weddingId: string, response: InsertRsvpResponse): Promise<RsvpResponse>;
  getRsvpResponse(weddingId: string, id: number): Promise<RsvpResponse | undefined>;
  getRsvpResponseById(id: number): Promise<RsvpResponse | undefined>;
  getAllRsvpResponses(weddingId: string): Promise<RsvpResponse[]>;
  updateRsvpResponse(weddingId: string, id: number, response: Partial<UpdateRsvpResponse>): Promise<RsvpResponse>;
  deleteRsvpResponse(weddingId: string, id: number): Promise<void>;
  getRsvpResponseByToken(weddingId: string, token: string): Promise<RsvpResponse | undefined>;
  getRsvpResponseByPublicToken(token: string): Promise<RsvpResponse | undefined>;
  getRsvpByEmailAndFirstName(weddingId: string, email: string, firstName: string): Promise<RsvpResponse | undefined>;

  // Contribution operations
  createContribution(weddingId: string, data: InsertContribution & { stripePaymentIntentId?: string, giftId?: number }): Promise<Contribution>;
  getContributionByPaymentIntent(paymentIntentId: string): Promise<Contribution | undefined>;
  updateContributionStatus(paymentIntentId: string, status: string): Promise<Contribution | undefined>;
  getCompletedContributions(weddingId: string): Promise<Contribution[]>;
  getTotalContributions(weddingId: string): Promise<number>;
  getRecentContributions(weddingId: string, limit?: number): Promise<Contribution[]>;

  // Gift operations
  getGifts(weddingId: string): Promise<Gift[]>;
  createGift(weddingId: string, gift: InsertGift): Promise<Gift>;
  updateGift(weddingId: string, id: number, gift: Partial<Gift>): Promise<Gift>;
  deleteGift(weddingId: string, id: number): Promise<void>;

  // Live Joke operations
  getJokes(weddingId: string): Promise<LiveJoke[]>;
  createJoke(weddingId: string, joke: InsertLiveJoke): Promise<LiveJoke>;
  updateJoke(weddingId: string, id: number, joke: Partial<LiveJoke>): Promise<LiveJoke>;
  deleteJoke(weddingId: string, id: number): Promise<void>;

  // Live Event operations
  createLiveEvent(weddingId: string, type: string, payload: any): Promise<any>;
  getLiveEvents(weddingId: string, limit?: number): Promise<any[]>;

  // Stripe operations
  upsertStripeSubscription(data: any): Promise<any>;
  getSubscriptionByWedding(weddingId: string): Promise<any | undefined>;
  logStripeWebhookEvent(id: string, type: string): Promise<void>;
  isStripeWebhookEventProcessed(id: string): Promise<boolean>;
  deleteStripeWebhookEvent(id: string): Promise<void>;

  // Email Log operations
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  getEmailLogs(weddingId: string): Promise<EmailLog[]>;

  // Product Feedback operations
  createProductFeedback(data: InsertProductFeedback): Promise<ProductFeedback>;
  listProductFeedback(status?: string): Promise<ProductFeedback[]>;
  getProductFeedbackByUser(userId: string): Promise<ProductFeedback[]>;
  updateProductFeedbackStatus(id: number, status: string): Promise<ProductFeedback>;

  // Support chat operations
  getSupportConversationById(id: number): Promise<SupportConversation | undefined>;
  getSupportConversationForUser(userId: string, weddingId?: string | null): Promise<SupportConversation | undefined>;
  listSupportConversations(): Promise<SupportConversation[]>;
  createSupportConversation(data: InsertSupportConversation): Promise<SupportConversation>;
  touchSupportConversation(id: number, updates: Partial<SupportConversation>): Promise<SupportConversation>;
  listSupportMessages(conversationId: number): Promise<SupportMessage[]>;
  createSupportMessage(data: InsertSupportMessage): Promise<SupportMessage>;
  markSupportMessagesRead(conversationId: number, role: "user" | "admin"): Promise<void>;

  // Organization - checklist
  getChecklistCategories(weddingId: string): Promise<OrganizationChecklistCategory[]>;
  createChecklistCategory(weddingId: string, data: InsertOrganizationChecklistCategory): Promise<OrganizationChecklistCategory>;
  updateChecklistCategory(weddingId: string, id: number, data: Partial<OrganizationChecklistCategory>): Promise<OrganizationChecklistCategory>;
  deleteChecklistCategory(weddingId: string, id: number): Promise<void>;
  getChecklistItems(weddingId: string): Promise<OrganizationChecklistItem[]>;
  createChecklistItem(weddingId: string, data: InsertOrganizationChecklistItem): Promise<OrganizationChecklistItem>;
  updateChecklistItem(weddingId: string, id: number, data: Partial<OrganizationChecklistItem>): Promise<OrganizationChecklistItem>;
  deleteChecklistItem(weddingId: string, id: number): Promise<void>;

  // Organization - planning
  getPlanningItems(weddingId: string): Promise<OrganizationPlanningItem[]>;
  createPlanningItem(weddingId: string, data: InsertOrganizationPlanningItem): Promise<OrganizationPlanningItem>;
  updatePlanningItem(weddingId: string, id: number, data: Partial<OrganizationPlanningItem>): Promise<OrganizationPlanningItem>;
  deletePlanningItem(weddingId: string, id: number): Promise<void>;

  // Organization - budget
  getBudgetCategories(weddingId: string): Promise<OrganizationBudgetCategory[]>;
  createBudgetCategory(weddingId: string, data: InsertOrganizationBudgetCategory): Promise<OrganizationBudgetCategory>;
  updateBudgetCategory(weddingId: string, id: number, data: Partial<OrganizationBudgetCategory>): Promise<OrganizationBudgetCategory>;
  deleteBudgetCategory(weddingId: string, id: number): Promise<void>;
  getBudgetItems(weddingId: string): Promise<OrganizationBudgetItem[]>;
  createBudgetItem(weddingId: string, data: InsertOrganizationBudgetItem): Promise<OrganizationBudgetItem>;
  updateBudgetItem(weddingId: string, id: number, data: Partial<OrganizationBudgetItem>): Promise<OrganizationBudgetItem>;
  deleteBudgetItem(weddingId: string, id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.appleId, appleId));
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: { ...userData, updatedAt: new Date() },
        })
        .returning();
      return user;
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async deleteUserAccount(id: string): Promise<void> {
    const ownedWeddings = await this.getWeddingsByOwner(id);
    for (const wedding of ownedWeddings) {
      await this.deleteWedding(wedding.id);
    }

    await db.transaction(async (tx) => {
      await tx.delete(supportMessages).where(eq(supportMessages.userId, id));
      await tx.delete(supportConversations).where(eq(supportConversations.userId, id));
      await tx.delete(productFeedback).where(eq(productFeedback.userId, id));
      await tx.delete(memberships).where(eq(memberships.userId, id));
      await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, id));
      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
      await tx.delete(referralCodes).where(eq(referralCodes.ownerUserId, id));
      await tx.delete(referralCodes).where(eq(referralCodes.usedByUserId, id));
      await tx.delete(users).where(eq(users.id, id));
    });
  }

  // Email verification token operations
  async createEmailVerificationToken(data: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    const [token] = await db.insert(emailVerificationTokens).values(data).returning();
    return token;
  }

  async getEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationToken | undefined> {
    const [token] = await db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.tokenHash, tokenHash));
    return token;
  }

  async consumeEmailVerificationToken(id: number): Promise<void> {
    await db.update(emailVerificationTokens).set({ usedAt: new Date() }).where(eq(emailVerificationTokens.id, id));
  }

  async deleteExpiredEmailVerificationTokens(): Promise<void> {
    await db.delete(emailVerificationTokens).where(sql`${emailVerificationTokens.expiresAt} < NOW()`);
  }

  // Password reset token operations
  async createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values(data).returning();
    return token;
  }

  async getPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
    return token;
  }

  async consumePasswordResetToken(id: number): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db.delete(passwordResetTokens).where(sql`${passwordResetTokens.expiresAt} < NOW()`);
  }

  async deleteStripeWebhookEvent(id: string): Promise<void> {
    await db.delete(stripeWebhookEvents).where(eq(stripeWebhookEvents.id, id));
  }

  async createEmailLog(log: InsertEmailLog): Promise<EmailLog> {
    const [result] = await db.insert(emailLogs).values(log).returning();
    return result;
  }

  async getEmailLogs(weddingId: string): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.weddingId, weddingId))
      .orderBy(desc(emailLogs.createdAt));
  }


  // Wedding operations
  async getWedding(id: string): Promise<Wedding | undefined> {
    const [wedding] = await db.select().from(weddings).where(eq(weddings.id, id));
    return wedding;
  }

  async getWeddingBySlug(slug: string): Promise<Wedding | undefined> {
    const [wedding] = await db.select().from(weddings).where(eq(weddings.slug, slug));
    return wedding;
  }

  async getWeddingsByOwner(ownerId: string): Promise<Wedding[]> {
    return await db.select().from(weddings).where(eq(weddings.ownerId, ownerId));
  }

  async getWeddingsForUser(userId: string): Promise<Wedding[]> {
    const ownerWeddings = await this.getWeddingsByOwner(userId);
    const membershipWeddings = await db
      .select()
      .from(weddings)
      .leftJoin(memberships, eq(memberships.weddingId, weddings.id))
      .where(eq(memberships.userId, userId));
    const fromMembership = membershipWeddings.map((row: any) => row.weddings).filter(Boolean);
    const merged = [...ownerWeddings, ...fromMembership];
    const unique = new Map(merged.map((w) => [w.id, w]));
    return Array.from(unique.values());
  }

  async createWedding(weddingData: InsertWedding): Promise<Wedding> {
    return await db.transaction(async (tx) => {
      const [wedding] = await tx.insert(weddings).values(weddingData).returning();
      // Auto-create owner membership
      await tx.insert(memberships).values({
        userId: wedding.ownerId,
        weddingId: wedding.id,
        role: 'owner',
      });
      return wedding;
    });
  }

  async updateWedding(id: string, weddingData: Partial<Wedding>): Promise<Wedding> {
    const [wedding] = await db
      .update(weddings)
      .set({ ...weddingData, updatedAt: new Date() })
      .where(eq(weddings.id, id))
      .returning();
    return wedding;
  }

  async deleteWedding(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(organizationChecklistItems).where(eq(organizationChecklistItems.weddingId, id));
      await tx.delete(organizationChecklistCategories).where(eq(organizationChecklistCategories.weddingId, id));
      await tx.delete(organizationPlanningItems).where(eq(organizationPlanningItems.weddingId, id));
      await tx.delete(organizationBudgetItems).where(eq(organizationBudgetItems.weddingId, id));
      await tx.delete(organizationBudgetCategories).where(eq(organizationBudgetCategories.weddingId, id));
      await tx.delete(supportMessages).where(eq(supportMessages.weddingId, id));
      await tx.delete(supportConversations).where(eq(supportConversations.weddingId, id));
      await tx.delete(productFeedback).where(eq(productFeedback.weddingId, id));
      await tx.delete(emailLogs).where(eq(emailLogs.weddingId, id));
      await tx.delete(liveEvents).where(eq(liveEvents.weddingId, id));
      await tx.delete(liveJokes).where(eq(liveJokes.weddingId, id));
      await tx.delete(contributions).where(eq(contributions.weddingId, id));
      await tx.delete(gifts).where(eq(gifts.weddingId, id));
      await tx.delete(stripeSubscriptions).where(eq(stripeSubscriptions.weddingId, id));
      await tx.delete(rsvpResponses).where(eq(rsvpResponses.weddingId, id));
      await tx.delete(memberships).where(eq(memberships.weddingId, id));
      await tx.delete(weddings).where(eq(weddings.id, id));
    });
  }

  // Membership operations
  async getMembershipsByWedding(weddingId: string): Promise<any[]> {
    return await db.select().from(memberships).where(eq(memberships.weddingId, weddingId));
  }

  async getMembershipByUserAndWedding(userId: string, weddingId: string): Promise<any | undefined> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.weddingId, weddingId)));
    return membership;
  }

  async createMembership(data: { userId: string, weddingId: string, role: string }): Promise<any> {
    const [membership] = await db.insert(memberships).values(data).returning();
    return membership;
  }

  // RSVP (Guest) operations
  async createRsvpResponse(weddingId: string, responseData: InsertRsvpResponse): Promise<RsvpResponse> {
    const [response] = await db
      .insert(rsvpResponses)
      .values({ ...responseData, weddingId })
      .returning();
    return response;
  }

  async getRsvpResponse(weddingId: string, id: number): Promise<RsvpResponse | undefined> {
    const [response] = await db
      .select()
      .from(rsvpResponses)
      .where(and(eq(rsvpResponses.id, id), eq(rsvpResponses.weddingId, weddingId)));
    return response;
  }

  async getRsvpResponseById(id: number): Promise<RsvpResponse | undefined> {
    const [response] = await db
      .select()
      .from(rsvpResponses)
      .where(eq(rsvpResponses.id, id));
    return response;
  }

  async getAllRsvpResponses(weddingId: string): Promise<RsvpResponse[]> {
    return await db.select().from(rsvpResponses).where(eq(rsvpResponses.weddingId, weddingId));
  }

  async updateRsvpResponse(weddingId: string, id: number, responseData: Partial<UpdateRsvpResponse>): Promise<RsvpResponse> {
    const [response] = await db
      .update(rsvpResponses)
      .set(responseData)
      .where(and(eq(rsvpResponses.id, id), eq(rsvpResponses.weddingId, weddingId)))
      .returning();
    return response;
  }

  async deleteRsvpResponse(weddingId: string, id: number): Promise<void> {
    await db.delete(rsvpResponses).where(and(eq(rsvpResponses.id, id), eq(rsvpResponses.weddingId, weddingId)));
  }

  async getRsvpResponseByToken(weddingId: string, token: string): Promise<RsvpResponse | undefined> {
    const [response] = await db
      .select()
      .from(rsvpResponses)
      .where(and(eq(rsvpResponses.publicToken, token), eq(rsvpResponses.weddingId, weddingId)));
    return response;
  }

  async getRsvpResponseByPublicToken(token: string): Promise<RsvpResponse | undefined> {
    const [response] = await db
      .select()
      .from(rsvpResponses)
      .where(eq(rsvpResponses.publicToken, token));
    return response;
  }

  async getRsvpByEmailAndFirstName(weddingId: string, email: string, firstName: string): Promise<RsvpResponse | undefined> {
    const [response] = await db
      .select()
      .from(rsvpResponses)
      .where(
        and(
          eq(rsvpResponses.weddingId, weddingId),
          eq(sql`lower(${rsvpResponses.email})`, email.toLowerCase()),
          eq(sql`lower(${rsvpResponses.firstName})`, firstName.toLowerCase())
        )
      );
    return response;
  }

  // Contribution operations
  async createContribution(weddingId: string, data: InsertContribution & { stripePaymentIntentId?: string, giftId?: number }): Promise<Contribution> {
    const [contribution] = await db
      .insert(contributions)
      .values({ ...data, weddingId })
      .returning();
    return contribution;
  }

  async getContributionByPaymentIntent(paymentIntentId: string): Promise<Contribution | undefined> {
    const [contribution] = await db
      .select()
      .from(contributions)
      .where(eq(contributions.stripePaymentIntentId, paymentIntentId));
    return contribution;
  }

  async updateContributionStatus(paymentIntentId: string, status: string): Promise<Contribution | undefined> {
    const [contribution] = await db
      .update(contributions)
      .set({ status, completedAt: status === 'paid' ? new Date() : null })
      .where(eq(contributions.stripePaymentIntentId, paymentIntentId))
      .returning();
    return contribution;
  }

  async getCompletedContributions(weddingId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(and(eq(contributions.status, 'paid'), eq(contributions.weddingId, weddingId)));
  }

  async getTotalContributions(weddingId: string): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${contributions.amount}), 0)` })
      .from(contributions)
      .where(and(eq(contributions.status, 'paid'), eq(contributions.weddingId, weddingId)));
    return result[0]?.total ?? 0;
  }

  async getRecentContributions(weddingId: string, limit: number = 10): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(and(eq(contributions.status, 'paid'), eq(contributions.weddingId, weddingId)))
      .orderBy(desc(contributions.createdAt))
      .limit(limit);
  }

  // Gift operations
  async getGifts(weddingId: string): Promise<Gift[]> {
    return await db.select().from(gifts).where(eq(gifts.weddingId, weddingId)).orderBy(gifts.createdAt);
  }

  async createGift(weddingId: string, giftData: InsertGift): Promise<Gift> {
    const [gift] = await db.insert(gifts).values({ ...giftData, weddingId }).returning();
    return gift;
  }

  async updateGift(weddingId: string, id: number, giftData: Partial<Gift>): Promise<Gift> {
    const [gift] = await db
      .update(gifts)
      .set(giftData)
      .where(and(eq(gifts.id, id), eq(gifts.weddingId, weddingId)))
      .returning();
    return gift;
  }

  async deleteGift(weddingId: string, id: number): Promise<void> {
    await db.delete(gifts).where(and(eq(gifts.id, id), eq(gifts.weddingId, weddingId)));
  }

  // Live Joke operations
  async getJokes(weddingId: string): Promise<LiveJoke[]> {
    return await db.select().from(liveJokes).where(eq(liveJokes.weddingId, weddingId)).orderBy(liveJokes.createdAt);
  }

  async createJoke(weddingId: string, jokeData: InsertLiveJoke): Promise<LiveJoke> {
    const [joke] = await db.insert(liveJokes).values({ ...jokeData, weddingId }).returning();
    return joke;
  }

  async updateJoke(weddingId: string, id: number, jokeData: Partial<LiveJoke>): Promise<LiveJoke> {
    const [joke] = await db
      .update(liveJokes)
      .set(jokeData)
      .where(and(eq(liveJokes.id, id), eq(liveJokes.weddingId, weddingId)))
      .returning();
    return joke;
  }

  async deleteJoke(weddingId: string, id: number): Promise<void> {
    await db.delete(liveJokes).where(and(eq(liveJokes.id, id), eq(liveJokes.weddingId, weddingId)));
  }

  // Live Event operations
  async createLiveEvent(weddingId: string, type: string, payload: any): Promise<any> {
    const [event] = await db.insert(liveEvents).values({ weddingId, type, payload }).returning();
    return event;
  }

  async getLiveEvents(weddingId: string, limit: number = 50): Promise<any[]> {
    return await db
      .select()
      .from(liveEvents)
      .where(eq(liveEvents.weddingId, weddingId))
      .orderBy(desc(liveEvents.createdAt))
      .limit(limit);
  }

  // Stripe operations
  async upsertStripeSubscription(data: any): Promise<any> {
    const [sub] = await db
      .insert(stripeSubscriptions)
      .values(data)
      .onConflictDoUpdate({
        target: stripeSubscriptions.stripeSubscriptionId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return sub;
  }

  async getSubscriptionByWedding(weddingId: string): Promise<any | undefined> {
    const [sub] = await db
      .select()
      .from(stripeSubscriptions)
      .where(eq(stripeSubscriptions.weddingId, weddingId));
    return sub;
  }

  async logStripeWebhookEvent(id: string, type: string): Promise<void> {
    await db.insert(stripeWebhookEvents).values({ id, type });
  }

  async isStripeWebhookEventProcessed(id: string): Promise<boolean> {
    const [event] = await db.select().from(stripeWebhookEvents).where(eq(stripeWebhookEvents.id, id));
    return !!event;
  }

  async getRsvpCount(weddingId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COALESCE(SUM(party_size), 0)::int` })
      .from(rsvpResponses)
      .where(eq(rsvpResponses.weddingId, weddingId));
    return result?.count ?? 0;
  }

  async createReferralCode(ownerUserId: string): Promise<ReferralCode> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      try {
        const [ref] = await db.insert(referralCodes).values({ code, ownerUserId }).returning();
        return ref;
      } catch (err: any) {
        if (err?.code === '23505' && attempt < 4) continue;
        throw err;
      }
    }
    throw new Error("Failed to generate unique referral code");
  }

  async getReferralCodeByUser(userId: string): Promise<ReferralCode | undefined> {
    const [ref] = await db.select().from(referralCodes).where(eq(referralCodes.ownerUserId, userId));
    return ref;
  }

  async getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    const [ref] = await db.select().from(referralCodes).where(eq(referralCodes.code, code.toUpperCase()));
    return ref;
  }

  async useReferralCode(code: string, usedByUserId: string): Promise<ReferralCode | null> {
    const ref = await this.getReferralCodeByCode(code);
    if (!ref || ref.usedByUserId || ref.ownerUserId === usedByUserId) return null;
    const [updated] = await db
      .update(referralCodes)
      .set({ usedByUserId, usedAt: new Date() })
      .where(eq(referralCodes.id, ref.id))
      .returning();
    return updated;
  }

  async getReferralUsageCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referralCodes)
      .where(and(eq(referralCodes.ownerUserId, userId), sql`${referralCodes.usedAt} IS NOT NULL`));
    return result?.count ?? 0;
  }

  async createProductFeedback(data: InsertProductFeedback): Promise<ProductFeedback> {
    const [row] = await db.insert(productFeedback).values(data).returning();
    return row;
  }

  async listProductFeedback(status?: string): Promise<ProductFeedback[]> {
    if (status) {
      return db.select().from(productFeedback).where(eq(productFeedback.status, status)).orderBy(desc(productFeedback.createdAt));
    }
    return db.select().from(productFeedback).orderBy(desc(productFeedback.createdAt));
  }

  async getProductFeedbackByUser(userId: string): Promise<ProductFeedback[]> {
    return db.select().from(productFeedback).where(eq(productFeedback.userId, userId)).orderBy(desc(productFeedback.createdAt));
  }

  async updateProductFeedbackStatus(id: number, status: string): Promise<ProductFeedback> {
    const [row] = await db.update(productFeedback).set({ status }).where(eq(productFeedback.id, id)).returning();
    return row;
  }

  async getSupportConversationById(id: number): Promise<SupportConversation | undefined> {
    const [row] = await db.select().from(supportConversations).where(eq(supportConversations.id, id));
    return row;
  }

  async getSupportConversationForUser(userId: string, weddingId?: string | null): Promise<SupportConversation | undefined> {
    const [row] = weddingId
      ? await db
          .select()
          .from(supportConversations)
          .where(and(eq(supportConversations.userId, userId), eq(supportConversations.weddingId, weddingId)))
          .limit(1)
      : await db
          .select()
          .from(supportConversations)
          .where(and(eq(supportConversations.userId, userId), sql`${supportConversations.weddingId} IS NULL`))
          .limit(1);
    return row;
  }

  async listSupportConversations(): Promise<SupportConversation[]> {
    return db.select().from(supportConversations).orderBy(desc(supportConversations.lastMessageAt), desc(supportConversations.updatedAt));
  }

  async createSupportConversation(data: InsertSupportConversation): Promise<SupportConversation> {
    const [row] = await db.insert(supportConversations).values(data).returning();
    return row;
  }

  async touchSupportConversation(id: number, updates: Partial<SupportConversation>): Promise<SupportConversation> {
    const [row] = await db
      .update(supportConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportConversations.id, id))
      .returning();
    return row;
  }

  async listSupportMessages(conversationId: number): Promise<SupportMessage[]> {
    return db
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.conversationId, conversationId))
      .orderBy(supportMessages.createdAt);
  }

  async createSupportMessage(data: InsertSupportMessage): Promise<SupportMessage> {
    const [row] = await db.insert(supportMessages).values(data).returning();
    return row;
  }

  async markSupportMessagesRead(conversationId: number, role: "user" | "admin"): Promise<void> {
    const readerRole = role === "admin" ? "user" : "admin";
    await db
      .update(supportMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(supportMessages.conversationId, conversationId),
          eq(supportMessages.role, readerRole),
          sql`${supportMessages.readAt} IS NULL`,
        ),
      );
  }

  async getChecklistCategories(weddingId: string): Promise<OrganizationChecklistCategory[]> {
    return db
      .select()
      .from(organizationChecklistCategories)
      .where(eq(organizationChecklistCategories.weddingId, weddingId))
      .orderBy(organizationChecklistCategories.sortOrder, organizationChecklistCategories.id);
  }

  async createChecklistCategory(weddingId: string, data: InsertOrganizationChecklistCategory): Promise<OrganizationChecklistCategory> {
    const [row] = await db.insert(organizationChecklistCategories).values({ ...data, weddingId }).returning();
    return row;
  }

  async updateChecklistCategory(weddingId: string, id: number, data: Partial<OrganizationChecklistCategory>): Promise<OrganizationChecklistCategory> {
    const [row] = await db
      .update(organizationChecklistCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(organizationChecklistCategories.id, id), eq(organizationChecklistCategories.weddingId, weddingId)))
      .returning();
    return row;
  }

  async deleteChecklistCategory(weddingId: string, id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(organizationChecklistItems).where(and(eq(organizationChecklistItems.categoryId, id), eq(organizationChecklistItems.weddingId, weddingId)));
      await tx.delete(organizationChecklistCategories).where(and(eq(organizationChecklistCategories.id, id), eq(organizationChecklistCategories.weddingId, weddingId)));
    });
  }

  async getChecklistItems(weddingId: string): Promise<OrganizationChecklistItem[]> {
    return db
      .select()
      .from(organizationChecklistItems)
      .where(eq(organizationChecklistItems.weddingId, weddingId))
      .orderBy(organizationChecklistItems.sortOrder, organizationChecklistItems.id);
  }

  async createChecklistItem(weddingId: string, data: InsertOrganizationChecklistItem): Promise<OrganizationChecklistItem> {
    const values = {
      ...data,
      weddingId,
      completedAt: data.status === "done" ? new Date() : null,
    };
    const [row] = await db.insert(organizationChecklistItems).values(values).returning();
    return row;
  }

  async updateChecklistItem(weddingId: string, id: number, data: Partial<OrganizationChecklistItem>): Promise<OrganizationChecklistItem> {
    const nextStatus = data.status;
    const [row] = await db
      .update(organizationChecklistItems)
      .set({
        ...data,
        updatedAt: new Date(),
        completedAt: nextStatus === "done" ? new Date() : nextStatus && nextStatus !== "done" ? null : data.completedAt,
      })
      .where(and(eq(organizationChecklistItems.id, id), eq(organizationChecklistItems.weddingId, weddingId)))
      .returning();
    return row;
  }

  async deleteChecklistItem(weddingId: string, id: number): Promise<void> {
    await db.delete(organizationChecklistItems).where(and(eq(organizationChecklistItems.id, id), eq(organizationChecklistItems.weddingId, weddingId)));
  }

  async getPlanningItems(weddingId: string): Promise<OrganizationPlanningItem[]> {
    return db
      .select()
      .from(organizationPlanningItems)
      .where(eq(organizationPlanningItems.weddingId, weddingId))
      .orderBy(organizationPlanningItems.dueAt, organizationPlanningItems.sortOrder, organizationPlanningItems.id);
  }

  async createPlanningItem(weddingId: string, data: InsertOrganizationPlanningItem): Promise<OrganizationPlanningItem> {
    const values = {
      ...data,
      weddingId,
      completedAt: data.status === "done" ? new Date() : null,
    };
    const [row] = await db.insert(organizationPlanningItems).values(values).returning();
    return row;
  }

  async updatePlanningItem(weddingId: string, id: number, data: Partial<OrganizationPlanningItem>): Promise<OrganizationPlanningItem> {
    const nextStatus = data.status;
    const [row] = await db
      .update(organizationPlanningItems)
      .set({
        ...data,
        updatedAt: new Date(),
        completedAt: nextStatus === "done" ? new Date() : nextStatus && nextStatus !== "done" ? null : data.completedAt,
      })
      .where(and(eq(organizationPlanningItems.id, id), eq(organizationPlanningItems.weddingId, weddingId)))
      .returning();
    return row;
  }

  async deletePlanningItem(weddingId: string, id: number): Promise<void> {
    await db.delete(organizationPlanningItems).where(and(eq(organizationPlanningItems.id, id), eq(organizationPlanningItems.weddingId, weddingId)));
  }

  async getBudgetCategories(weddingId: string): Promise<OrganizationBudgetCategory[]> {
    return db
      .select()
      .from(organizationBudgetCategories)
      .where(eq(organizationBudgetCategories.weddingId, weddingId))
      .orderBy(organizationBudgetCategories.sortOrder, organizationBudgetCategories.id);
  }

  async createBudgetCategory(weddingId: string, data: InsertOrganizationBudgetCategory): Promise<OrganizationBudgetCategory> {
    const [row] = await db.insert(organizationBudgetCategories).values({ ...data, weddingId }).returning();
    return row;
  }

  async updateBudgetCategory(weddingId: string, id: number, data: Partial<OrganizationBudgetCategory>): Promise<OrganizationBudgetCategory> {
    const [row] = await db
      .update(organizationBudgetCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(organizationBudgetCategories.id, id), eq(organizationBudgetCategories.weddingId, weddingId)))
      .returning();
    return row;
  }

  async deleteBudgetCategory(weddingId: string, id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(organizationBudgetItems).where(and(eq(organizationBudgetItems.categoryId, id), eq(organizationBudgetItems.weddingId, weddingId)));
      await tx.delete(organizationBudgetCategories).where(and(eq(organizationBudgetCategories.id, id), eq(organizationBudgetCategories.weddingId, weddingId)));
    });
  }

  async getBudgetItems(weddingId: string): Promise<OrganizationBudgetItem[]> {
    return db
      .select()
      .from(organizationBudgetItems)
      .where(eq(organizationBudgetItems.weddingId, weddingId))
      .orderBy(organizationBudgetItems.createdAt, organizationBudgetItems.id);
  }

  async createBudgetItem(weddingId: string, data: InsertOrganizationBudgetItem): Promise<OrganizationBudgetItem> {
    const [row] = await db.insert(organizationBudgetItems).values({ ...data, weddingId }).returning();
    return row;
  }

  async updateBudgetItem(weddingId: string, id: number, data: Partial<OrganizationBudgetItem>): Promise<OrganizationBudgetItem> {
    const [row] = await db
      .update(organizationBudgetItems)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(organizationBudgetItems.id, id), eq(organizationBudgetItems.weddingId, weddingId)))
      .returning();
    return row;
  }

  async deleteBudgetItem(weddingId: string, id: number): Promise<void> {
    await db.delete(organizationBudgetItems).where(and(eq(organizationBudgetItems.id, id), eq(organizationBudgetItems.weddingId, weddingId)));
  }
}

export const storage = new DatabaseStorage();
