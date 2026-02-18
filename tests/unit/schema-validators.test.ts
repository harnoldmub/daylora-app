import { describe, it, expect } from "vitest";
import {
  signupSchema,
  loginSchema,
  insertRsvpResponseSchema,
  updateRsvpResponseSchema,
  insertContributionSchema,
} from "@shared/schema";

describe("signupSchema", () => {
  it("accepts valid signup data", () => {
    const result = signupSchema.safeParse({
      email: "lea@nocely.fr",
      password: "MonMotDePasse123",
      firstName: "Léa",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = signupSchema.safeParse({
      password: "MonMotDePasse123",
      firstName: "Léa",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "MonMotDePasse123",
      firstName: "Léa",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      email: "lea@nocely.fr",
      password: "short",
      firstName: "Léa",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("8 caractères");
    }
  });

  it("rejects empty firstName", () => {
    const result = signupSchema.safeParse({
      email: "lea@nocely.fr",
      password: "MonMotDePasse123",
      firstName: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts accented characters in firstName", () => {
    const result = signupSchema.safeParse({
      email: "lea@nocely.fr",
      password: "MonMotDePasse123",
      firstName: "Éloïse-Marie",
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "lea@nocely.fr",
      password: "password",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "lea@nocely.fr",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "something" });
    expect(result.success).toBe(false);
  });
});

describe("insertRsvpResponseSchema", () => {
  it("accepts a valid RSVP", () => {
    const result = insertRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      email: "marie@test.fr",
      partySize: 2,
      availability: "confirmed",
    });
    expect(result.success).toBe(true);
  });

  it("accepts RSVP without email (optional)", () => {
    const result = insertRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      partySize: 1,
      availability: "confirmed",
    });
    expect(result.success).toBe(true);
  });

  it("transforms empty email to null", () => {
    const result = insertRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      email: "",
      partySize: 1,
      availability: "confirmed",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
    }
  });

  it("rejects invalid email format", () => {
    const result = insertRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      email: "not-valid",
      partySize: 1,
      availability: "confirmed",
    });
    expect(result.success).toBe(false);
  });

  it("rejects partySize > 2", () => {
    const result = insertRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      partySize: 3,
      availability: "confirmed",
    });
    expect(result.success).toBe(false);
  });

  it("rejects partySize = 0", () => {
    const result = insertRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      partySize: 0,
      availability: "confirmed",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid availability value", () => {
    const result = insertRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      partySize: 1,
      availability: "maybe",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all three availability values", () => {
    for (const val of ["confirmed", "declined", "pending"]) {
      const result = insertRsvpResponseSchema.safeParse({
        firstName: "Marie",
        lastName: "Dupont",
        partySize: 1,
        availability: val,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects empty firstName", () => {
    const result = insertRsvpResponseSchema.safeParse({
      firstName: "",
      lastName: "Dupont",
      partySize: 1,
      availability: "confirmed",
    });
    expect(result.success).toBe(false);
  });
});

describe("insertContributionSchema", () => {
  it("accepts a valid contribution", () => {
    const result = insertContributionSchema.safeParse({
      donorName: "Paul Martin",
      donorEmail: "paul@test.fr",
      amount: 5000,
      message: "Félicitations !",
    });
    expect(result.success).toBe(true);
  });

  it("rejects amount below 100 cents (1€)", () => {
    const result = insertContributionSchema.safeParse({
      donorName: "Paul",
      amount: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer amount", () => {
    const result = insertContributionSchema.safeParse({
      donorName: "Paul",
      amount: 49.99,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty donorName", () => {
    const result = insertContributionSchema.safeParse({
      donorName: "",
      amount: 5000,
    });
    expect(result.success).toBe(false);
  });

  it("transforms empty message to null", () => {
    const result = insertContributionSchema.safeParse({
      donorName: "Paul",
      amount: 5000,
      message: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBeNull();
    }
  });

  it("rejects empty donorEmail (invalid email)", () => {
    const result = insertContributionSchema.safeParse({
      donorName: "Paul",
      amount: 5000,
      donorEmail: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateRsvpResponseSchema", () => {
  it("accepts partySize up to 5 for update", () => {
    const result = updateRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      partySize: 5,
      availability: "confirmed",
    });
    expect(result.success).toBe(true);
  });

  it("rejects partySize > 5 for update", () => {
    const result = updateRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      partySize: 6,
      availability: "confirmed",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = updateRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      partySize: 2,
      availability: "confirmed",
      tableNumber: 5,
      notes: "Allergie gluten",
      phone: "+33612345678",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null tableNumber", () => {
    const result = updateRsvpResponseSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      partySize: 1,
      availability: "confirmed",
      tableNumber: null,
    });
    expect(result.success).toBe(true);
  });
});
