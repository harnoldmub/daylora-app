import type { IStorage } from "../../apps/api/storage";

export class MockStorage implements Partial<IStorage> {
  users: Map<string, any> = new Map();
  weddings: Map<string, any> = new Map();
  rsvps: Map<number, any> = new Map();
  gifts: Map<number, any> = new Map();
  contributions: Map<number, any> = new Map();
  jokes: Map<number, any> = new Map();
  memberships: Map<string, any> = new Map();
  emailLogs: Map<number, any> = new Map();
  tokens: Map<number, any> = new Map();
  webhookEvents: Set<string> = new Set();
  subscriptions: Map<string, any> = new Map();

  private rsvpSeq = 0;
  private giftSeq = 0;
  private contributionSeq = 0;
  private jokeSeq = 0;
  private tokenSeq = 0;

  async getUser(id: string) {
    return this.users.get(id);
  }

  async getUserByEmail(email: string) {
    return Array.from(this.users.values()).find((u) => u.email === email.toLowerCase());
  }

  async upsertUser(data: any) {
    const existing = data.id ? this.users.get(data.id) : await this.getUserByEmail(data.email);
    if (existing) {
      const updated = { ...existing, ...data, updatedAt: new Date() };
      this.users.set(updated.id, updated);
      return updated;
    }
    const id = data.id || crypto.randomUUID();
    const user = { ...data, id, email: data.email.toLowerCase(), createdAt: new Date(), updatedAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: any) {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async getWedding(id: string) {
    return this.weddings.get(id);
  }

  async getWeddingBySlug(slug: string) {
    return Array.from(this.weddings.values()).find((w) => w.slug === slug);
  }

  async getWeddingsByOwner(ownerId: string) {
    return Array.from(this.weddings.values()).filter((w) => w.ownerId === ownerId);
  }

  async getWeddingsForUser(userId: string) {
    const owned = await this.getWeddingsByOwner(userId);
    const memberWeddingIds = Array.from(this.memberships.values())
      .filter((m) => m.userId === userId)
      .map((m) => m.weddingId);
    const memberWeddings = memberWeddingIds
      .map((id) => this.weddings.get(id))
      .filter(Boolean);
    return [...owned, ...memberWeddings];
  }

  async createWedding(data: any) {
    const id = data.id || crypto.randomUUID();
    const wedding = {
      ...data,
      id,
      status: data.status || "draft",
      currentPlan: data.currentPlan || "free",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.weddings.set(id, wedding);
    return wedding;
  }

  async updateWedding(id: string, data: any) {
    const wedding = this.weddings.get(id);
    if (!wedding) throw new Error("Wedding not found");
    const updated = { ...wedding, ...data, updatedAt: new Date() };
    this.weddings.set(id, updated);
    return updated;
  }

  async getMembershipsByWedding(weddingId: string) {
    return Array.from(this.memberships.values()).filter((m) => m.weddingId === weddingId);
  }

  async getMembershipByUserAndWedding(userId: string, weddingId: string) {
    return Array.from(this.memberships.values()).find(
      (m) => m.userId === userId && m.weddingId === weddingId
    );
  }

  async createMembership(data: any) {
    const key = `${data.userId}-${data.weddingId}`;
    const membership = { ...data, createdAt: new Date() };
    this.memberships.set(key, membership);
    return membership;
  }

  async createRsvpResponse(weddingId: string, data: any) {
    const id = ++this.rsvpSeq;
    const rsvp = {
      allowedOptionIds: [],
      selectedOptionIds: [],
      publicToken: crypto.randomUUID(),
      availability: "pending",
      partySize: 1,
      ...data,
      id,
      weddingId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rsvps.set(id, rsvp);
    return rsvp;
  }

  async getRsvpResponse(weddingId: string, id: number) {
    const rsvp = this.rsvps.get(id);
    return rsvp?.weddingId === weddingId ? rsvp : undefined;
  }

  async getRsvpResponseById(id: number) {
    return this.rsvps.get(id);
  }

  async getAllRsvpResponses(weddingId: string) {
    return Array.from(this.rsvps.values()).filter((r) => r.weddingId === weddingId);
  }

  async updateRsvpResponse(weddingId: string, id: number, data: any) {
    const rsvp = this.rsvps.get(id);
    if (!rsvp || rsvp.weddingId !== weddingId) throw new Error("RSVP not found");
    const updated = { ...rsvp, ...data, updatedAt: new Date() };
    this.rsvps.set(id, updated);
    return updated;
  }

  async deleteRsvpResponse(weddingId: string, id: number) {
    const rsvp = this.rsvps.get(id);
    if (rsvp?.weddingId === weddingId) this.rsvps.delete(id);
  }

  async getRsvpResponseByToken(_weddingId: string, _token: string) {
    return undefined;
  }

  async getRsvpResponseByPublicToken(_token: string) {
    return undefined;
  }

  async getRsvpByEmailAndFirstName(weddingId: string, email: string, firstName: string) {
    return Array.from(this.rsvps.values()).find(
      (r) => r.weddingId === weddingId && r.email === email && r.firstName === firstName
    );
  }

  async createGift(weddingId: string, data: any) {
    const id = ++this.giftSeq;
    const gift = { ...data, id, weddingId, createdAt: new Date() };
    this.gifts.set(id, gift);
    return gift;
  }

  async getGift(weddingId: string, id: number) {
    const gift = this.gifts.get(id);
    return gift?.weddingId === weddingId ? gift : undefined;
  }

  async getAllGifts(weddingId: string) {
    return Array.from(this.gifts.values()).filter((g) => g.weddingId === weddingId);
  }

  async updateGift(weddingId: string, id: number, data: any) {
    const gift = this.gifts.get(id);
    if (!gift || gift.weddingId !== weddingId) throw new Error("Gift not found");
    const updated = { ...gift, ...data };
    this.gifts.set(id, updated);
    return updated;
  }

  async deleteGift(weddingId: string, id: number) {
    const gift = this.gifts.get(id);
    if (gift?.weddingId === weddingId) this.gifts.delete(id);
  }

  async getAllGiftsPublic(weddingId: string) {
    return this.getAllGifts(weddingId);
  }

  async createContribution(data: any) {
    const id = ++this.contributionSeq;
    const contribution = { ...data, id, createdAt: new Date() };
    this.contributions.set(id, contribution);
    return contribution;
  }

  async getAllContributions(weddingId: string) {
    return Array.from(this.contributions.values()).filter((c) => c.weddingId === weddingId);
  }

  async getConfirmedContributions(weddingId: string) {
    return Array.from(this.contributions.values()).filter(
      (c) => c.weddingId === weddingId && c.status === "succeeded"
    );
  }

  async getTotalContributions(weddingId: string) {
    const confirmed = await this.getConfirmedContributions(weddingId);
    return confirmed.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  }

  async createLiveJoke(weddingId: string, data: any) {
    const id = ++this.jokeSeq;
    const joke = { ...data, id, weddingId, createdAt: new Date() };
    this.jokes.set(id, joke);
    return joke;
  }

  async getAllLiveJokes(weddingId: string) {
    return Array.from(this.jokes.values()).filter((j) => j.weddingId === weddingId);
  }

  async updateLiveJoke(weddingId: string, id: number, data: any) {
    const joke = this.jokes.get(id);
    if (!joke || joke.weddingId !== weddingId) throw new Error("Joke not found");
    const updated = { ...joke, ...data };
    this.jokes.set(id, updated);
    return updated;
  }

  async deleteLiveJoke(weddingId: string, id: number) {
    const joke = this.jokes.get(id);
    if (joke?.weddingId === weddingId) this.jokes.delete(id);
  }

  async getNextLiveJoke(weddingId: string) {
    const jokes = await this.getAllLiveJokes(weddingId);
    return jokes.find((j: any) => j.active) || null;
  }

  async createEmailVerificationToken(data: any) {
    const id = ++this.tokenSeq;
    const token = { ...data, id, createdAt: new Date() };
    this.tokens.set(id, token);
    return token;
  }

  async getEmailVerificationTokenByHash(tokenHash: string) {
    return Array.from(this.tokens.values()).find((t) => t.tokenHash === tokenHash);
  }

  async consumeEmailVerificationToken(id: number) {
    this.tokens.delete(id);
  }

  async deleteExpiredEmailVerificationTokens() {
    const now = new Date();
    for (const [id, token] of this.tokens) {
      if (token.expiresAt && token.expiresAt < now) this.tokens.delete(id);
    }
  }

  async createPasswordResetToken(data: any) {
    return this.createEmailVerificationToken(data);
  }

  async getPasswordResetTokenByHash(tokenHash: string) {
    return this.getEmailVerificationTokenByHash(tokenHash);
  }

  async consumePasswordResetToken(id: number) {
    this.tokens.delete(id);
  }

  async deleteExpiredPasswordResetTokens() {
    return this.deleteExpiredEmailVerificationTokens();
  }

  async isStripeWebhookEventProcessed(eventId: string) {
    return this.webhookEvents.has(eventId);
  }

  async markStripeWebhookEventProcessed(eventId: string) {
    this.webhookEvents.add(eventId);
  }

  async getSubscriptionByWedding(weddingId: string) {
    return this.subscriptions.get(weddingId);
  }

  async upsertStripeSubscription(data: any) {
    this.subscriptions.set(data.weddingId, { ...data, updatedAt: new Date() });
    return data;
  }

  reset() {
    this.users.clear();
    this.weddings.clear();
    this.rsvps.clear();
    this.gifts.clear();
    this.contributions.clear();
    this.jokes.clear();
    this.memberships.clear();
    this.emailLogs.clear();
    this.tokens.clear();
    this.webhookEvents.clear();
    this.subscriptions.clear();
    this.rsvpSeq = 0;
    this.giftSeq = 0;
    this.contributionSeq = 0;
    this.jokeSeq = 0;
    this.tokenSeq = 0;
  }
}
