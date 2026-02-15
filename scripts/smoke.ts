/* eslint-disable no-console */

type Json = Record<string, unknown>;

const BASE_URL = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function pickSidCookie(setCookieHeader: string | null) {
  if (!setCookieHeader) return null;
  // Example: connect.sid=s%3A...; Path=/; Expires=...; HttpOnly; SameSite=Lax
  const match = setCookieHeader.match(/(?:^|,)\s*(connect\.sid=[^;]+)/);
  return match?.[1] || null;
}

class CookieJar {
  private sid: string | null = null;

  absorb(res: Response) {
    const setCookie = res.headers.get("set-cookie");
    const sid = pickSidCookie(setCookie);
    if (sid) this.sid = sid;
  }

  header() {
    return this.sid ? { cookie: this.sid } : {};
  }
}

async function requestJson(
  jar: CookieJar | null,
  method: string,
  path: string,
  body?: Json,
  headers?: Record<string, string>,
) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(headers || {}),
      ...(jar ? jar.header() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (jar) jar.absorb(res);
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return { res, json };
}

async function main() {
  console.log(`[smoke] base=${BASE_URL}`);

  // 1) Server reachable
  {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.ok, `[smoke] GET / failed: ${res.status}`);
    console.log("[smoke] ok server reachable");
  }

  const jar = new CookieJar();
  const now = Date.now();
  const email = `smoke+${now}@libala.dev`;
  const password = "Test1234!";

  // 2) Signup
  const signup = await requestJson(jar, "POST", "/api/auth/signup", {
    email,
    password,
    firstName: "Smoke",
  });
  assert(signup.res.status === 201, `[smoke] signup expected 201, got ${signup.res.status}`);
  assert(signup.json && typeof signup.json === "object", "[smoke] signup json missing");
  const debugVerifyToken = (signup.json as any).debugVerifyToken as string | undefined;
  assert(debugVerifyToken, "[smoke] signup did not return debugVerifyToken (dev mode required)");
  console.log("[smoke] ok signup");

  // 3) Verify email
  const verify = await requestJson(null, "GET", `/api/auth/verify-email?token=${encodeURIComponent(debugVerifyToken)}`);
  assert(verify.res.ok, `[smoke] verify-email failed: ${verify.res.status}`);
  console.log("[smoke] ok verify-email");

  // 4) Login (session cookie)
  const login = await requestJson(jar, "POST", "/api/auth/login", { email, password });
  assert(login.res.ok, `[smoke] login failed: ${login.res.status}`);
  console.log("[smoke] ok login");

  // 5) /me
  const me = await requestJson(jar, "GET", "/api/auth/me");
  assert(me.res.ok, `[smoke] /me failed: ${me.res.status}`);
  assert((me.json as any)?.email === email, "[smoke] /me email mismatch");
  console.log("[smoke] ok /me");

  // 6) Create wedding
  const slug = `smoke-${now}`.slice(0, 40);
  const createWedding = await requestJson(jar, "POST", "/api/weddings", {
    title: "Smoke Wedding",
    slug,
    weddingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    templateId: "modern",
    currentPlan: "free",
    toneId: "rose-sunset",
    features: {
      cagnotteEnabled: true,
      giftsEnabled: true,
      jokesEnabled: true,
      liveEnabled: true,
    },
  });
  assert(createWedding.res.status === 201, `[smoke] create wedding expected 201, got ${createWedding.res.status}`);
  const weddingId = (createWedding.json as any)?.id as string | undefined;
  assert(weddingId, "[smoke] wedding id missing");
  console.log(`[smoke] ok create wedding id=${weddingId}`);

  // 7) Create a joke (tenant header)
  const joke = await requestJson(
    jar,
    "POST",
    "/api/jokes",
    { content: "Smoke test joke", tone: "safe", frequency: 30, isActive: true },
    { "x-wedding-id": weddingId },
  );
  assert(joke.res.ok, `[smoke] create joke failed: ${joke.res.status}`);
  console.log("[smoke] ok jokes");

  // 8) Create a guest RSVP (public endpoint, tenant header)
  const rsvp = await requestJson(
    null,
    "POST",
    "/api/rsvp",
    {
      firstName: "Camille",
      lastName: "Durand",
      email: "camille@example.com",
      partySize: 2,
      availability: "confirmed",
      phone: "+33600000000",
      notes: "smoke",
    },
    { "x-wedding-id": weddingId },
  );
  assert(rsvp.res.ok, `[smoke] create rsvp failed: ${rsvp.res.status}`);
  console.log("[smoke] ok rsvp create");

  // 9) List guests (admin endpoint, tenant header)
  const list = await requestJson(jar, "GET", "/api/rsvp", undefined, { "x-wedding-id": weddingId });
  assert(list.res.ok, `[smoke] list rsvp failed: ${list.res.status}`);
  assert(Array.isArray(list.json), "[smoke] list rsvp expected array");
  assert((list.json as any[]).length >= 1, "[smoke] list rsvp expected at least 1 item");
  console.log("[smoke] ok rsvp list");

  console.log("[smoke] SUCCESS");
}

main().catch((err) => {
  console.error("[smoke] FAILED");
  console.error(err);
  process.exit(1);
});

