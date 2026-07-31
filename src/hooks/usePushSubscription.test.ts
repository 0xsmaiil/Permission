// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePushSubscription } from "./usePushSubscription";

const mockSupabaseValue = vi.fn();
const mockInsert = vi.fn();

vi.mock("../lib/supabaseClient", () => ({
  get supabase() {
    return mockSupabaseValue();
  },
}));

function setSupabase(hasSupabase = true) {
  if (hasSupabase) {
    mockSupabaseValue.mockReturnValue({
      from: () => ({ insert: (...args: unknown[]) => mockInsert(...args) }),
    });
  } else {
    mockSupabaseValue.mockReturnValue(null);
  }
}

function mockNotificationPermission(val: NotificationPermission) {
  const requestPermission = vi.fn<() => Promise<NotificationPermission>>().mockResolvedValue(val);
  vi.stubGlobal("Notification", {
    permission: val,
    requestPermission,
  });
}

function mockPushEnvironment(subscription: object | null = null) {
  Object.defineProperty(window, "PushManager", {
    value: {},
    writable: true,
    configurable: true,
  });

  const mockPushManager = {
    getSubscription: vi.fn().mockResolvedValue(subscription),
    subscribe: vi.fn().mockResolvedValue({
      toJSON: () => ({
        endpoint: "https://example.com/push",
        keys: { p256dh: "key123", auth: "auth456" },
      }),
    }),
  };

  const mockRegistration = {
    pushManager: mockPushManager,
  };

  Object.defineProperty(navigator, "serviceWorker", {
    value: {
      ready: Promise.resolve(mockRegistration),
    },
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  setSupabase(true);
  mockInsert.mockResolvedValue({ error: null });

  vi.unstubAllGlobals();
  Object.defineProperty(window, "PushManager", {
    value: undefined,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, "serviceWorker", {
    value: undefined,
    writable: true,
    configurable: true,
  });
});

describe("usePushSubscription", () => {
  it("returns initial idle state with no subscription", () => {
    const { result } = renderHook(() => usePushSubscription());
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.permissionState).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("sets subscribed to true when flag is in localStorage, permission granted, and a push subscription exists", async () => {
    mockNotificationPermission("granted");
    mockPushEnvironment({ endpoint: "https://example.com/push" });
    localStorage.setItem("push_subscribed", "true");
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });
    expect(result.current.permissionState).toBe("granted");
  });

  it("removes localStorage flag when flag is set but no push subscription exists", async () => {
    mockNotificationPermission("granted");
    mockPushEnvironment(null);
    localStorage.setItem("push_subscribed", "true");
    renderHook(() => usePushSubscription());
    await waitFor(() => {
      expect(localStorage.getItem("push_subscribed")).toBeNull();
    });
  });

  it("removes localStorage flag when permission is not granted", () => {
    mockNotificationPermission("denied");
    localStorage.setItem("push_subscribed", "true");
    renderHook(() => usePushSubscription());
    expect(localStorage.getItem("push_subscribed")).toBeNull();
  });

  it("sets error when PushManager is unsupported", async () => {
    mockNotificationPermission("granted");
    const { result } = renderHook(() => usePushSubscription());

    await result.current.subscribe();

    await waitFor(() => {
      expect(result.current.permissionState).toBe("error");
    });
    expect(result.current.error).toBeTruthy();
  });

  it("sets denied state when permission is denied", async () => {
    mockNotificationPermission("denied");
    mockPushEnvironment();

    const { result } = renderHook(() => usePushSubscription());

    const res = await result.current.subscribe();
    expect(res).toBe(false);
    await waitFor(() => {
      expect(result.current.permissionState).toBe("denied");
    });
  });

  it("handles missing supabase gracefully", async () => {
    setSupabase(false);
    mockNotificationPermission("granted");
    mockPushEnvironment();

    const { result } = renderHook(() => usePushSubscription());

    await result.current.subscribe();

    await waitFor(() => {
      expect(result.current.permissionState).toBe("error");
    });
  });

  it("clears error on re-subscribe attempt", async () => {
    mockNotificationPermission("granted");
    mockPushEnvironment();

    const { result } = renderHook(() => usePushSubscription());
    await result.current.subscribe();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
