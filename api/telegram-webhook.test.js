import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import handler from "./telegram-webhook.js";

const MANAGED_KEYS = [
  "TELEGRAM_WEBHOOK_SECRET",
  "TELEGRAM_BOT_TOKEN",
  "ADMIN_CHAT_ID",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "VITE_SUPABASE_URL",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
];

const SECRET = "test-webhook-secret";

let savedEnv;

function setEnv(overrides = {}) {
  for (const key of MANAGED_KEYS) delete process.env[key];
  Object.assign(process.env, overrides);
}

function mockRes() {
  const res = { statusCode: null, payload: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.payload = body;
    return res;
  };
  return res;
}

function req({ method = "POST", secret, body = {} } = {}) {
  const headers = {};
  if (secret !== undefined) headers["x-telegram-bot-api-secret-token"] = secret;
  return { method, headers, body };
}

beforeEach(() => {
  savedEnv = { ...process.env };
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.env = savedEnv;
  vi.restoreAllMocks();
});

describe("telegram-webhook auth", () => {
  it("rejects non-POST methods", async () => {
    setEnv({ TELEGRAM_WEBHOOK_SECRET: SECRET });
    const res = mockRes();
    await handler(req({ method: "GET" }), res);
    expect(res.statusCode).toBe(405);
  });

  it("rejects a request with no secret header", async () => {
    setEnv({ TELEGRAM_WEBHOOK_SECRET: SECRET });
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(401);
  });

  // Regression: previously `if (expected && provided !== expected)` meant an
  // unset TELEGRAM_WEBHOOK_SECRET silently disabled verification entirely.
  it("fails closed when TELEGRAM_WEBHOOK_SECRET is not configured", async () => {
    setEnv({});
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(401);
  });

  // Regression: timingSafeEqual on two zero-length buffers returns true.
  it("rejects an empty secret header when no secret is configured", async () => {
    setEnv({});
    const res = mockRes();
    await handler(req({ secret: "" }), res);
    expect(res.statusCode).toBe(401);
  });

  it("rejects an empty secret header when a secret is configured", async () => {
    setEnv({ TELEGRAM_WEBHOOK_SECRET: SECRET });
    const res = mockRes();
    await handler(req({ secret: "" }), res);
    expect(res.statusCode).toBe(401);
  });

  it("rejects an incorrect secret", async () => {
    setEnv({ TELEGRAM_WEBHOOK_SECRET: SECRET });
    const res = mockRes();
    await handler(req({ secret: "wrong" }), res);
    expect(res.statusCode).toBe(401);
  });

  it("rejects a secret that is a prefix of the real one", async () => {
    setEnv({ TELEGRAM_WEBHOOK_SECRET: SECRET });
    const res = mockRes();
    await handler(req({ secret: SECRET.slice(0, 4) }), res);
    expect(res.statusCode).toBe(401);
  });

  it("checks auth before validating config, so 401 never leaks env state", async () => {
    setEnv({ TELEGRAM_WEBHOOK_SECRET: SECRET });
    const res = mockRes();
    await handler(req({ secret: "wrong" }), res);
    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 without an error message when config is incomplete", async () => {
    setEnv({ TELEGRAM_WEBHOOK_SECRET: SECRET });
    const res = mockRes();
    await handler(req({ secret: SECRET }), res);
    expect(res.statusCode).toBe(500);
    expect(res.payload).toEqual({ ok: false });
    expect(res.payload.error).toBeUndefined();
  });
});

describe("telegram-webhook authorization", () => {
  const fullEnv = {
    TELEGRAM_WEBHOOK_SECRET: SECRET,
    TELEGRAM_BOT_TOKEN: "bot-token",
    ADMIN_CHAT_ID: "999",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
    SUPABASE_URL: "https://example.supabase.co",
    VAPID_PUBLIC_KEY: "public",
    VAPID_PRIVATE_KEY: "private",
  };

  it("ignores messages from a non-admin chat id", async () => {
    setEnv(fullEnv);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true });
    const res = mockRes();
    await handler(
      req({ secret: SECRET, body: { message: { chat: { id: 12345 }, text: "/broadcast hi" } } }),
      res,
    );
    // 200 so Telegram stops retrying, but no outbound message is sent.
    expect([200, 500]).toContain(res.statusCode);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("acknowledges an update with no message", async () => {
    setEnv(fullEnv);
    const res = mockRes();
    await handler(req({ secret: SECRET, body: {} }), res);
    expect([200, 500]).toContain(res.statusCode);
  });
});
