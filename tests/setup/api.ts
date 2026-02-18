import { beforeAll, afterAll } from "vitest";

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-secret-key-for-vitest";
process.env.SESSION_STORE = "memory";

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key_for_tests";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_fake_secret";
  process.env.RESEND_API_KEY = "re_test_fake_key";
});

afterAll(() => {
});
