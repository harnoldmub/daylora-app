import { expect } from "vitest";

expect.extend({
  toBeValidSlug(received: string) {
    const pass = /^[a-z0-9-]+$/.test(received) && received.length >= 3 && received.length <= 100;
    return {
      pass,
      message: () => `expected "${received}" to be a valid wedding slug (lowercase, hyphens, 3-100 chars)`,
    };
  },
  toBeValidEmail(received: string) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass,
      message: () => `expected "${received}" to be a valid email address`,
    };
  },
});
