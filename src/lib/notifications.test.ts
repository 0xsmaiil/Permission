// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addNotification, getNotifications, getUnreadCount, markAllRead } from "./notifications";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("addNotification / getNotifications", () => {
  it("returns an empty list when storage is empty", () => {
    expect(getNotifications()).toEqual([]);
  });

  it("prepends a notification and assigns id/read", () => {
    addNotification({ title: "0xSmail", body: "hello", timestamp: Date.now() });
    const list = getNotifications();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("0xSmail");
    expect(list[0].body).toBe("hello");
    expect(list[0].id).toBeDefined();
    expect(list[0].read).toBe(false);
  });

  it("keeps only the 30 most recent notifications", () => {
    for (let i = 0; i < 35; i++) {
      addNotification({ title: "t", body: `n${i}`, timestamp: Date.now() + i });
    }
    expect(getNotifications()).toHaveLength(30);
  });
});

describe("Friday weekly purge", () => {
  it("drops notifications older than the most recent Friday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 1, 12)); // Saturday 2026-08-01

    addNotification({ title: "old", body: "before friday", timestamp: new Date(2026, 6, 28, 10).getTime() });
    addNotification({ title: "friday", body: "on friday", timestamp: new Date(2026, 6, 31, 10).getTime() });
    addNotification({ title: "now", body: "saturday", timestamp: new Date(2026, 7, 1, 10).getTime() });

    const kept = getNotifications();
    expect(kept).toHaveLength(2);
    expect(kept.map((n) => n.title)).toEqual(["now", "friday"]);
  });

  it("keeps everything received on the current Friday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 31, 12)); // Friday 2026-07-31

    addNotification({ title: "a", body: "", timestamp: new Date(2026, 6, 31, 8).getTime() });
    addNotification({ title: "b", body: "", timestamp: new Date(2026, 6, 31, 12).getTime() });

    expect(getNotifications()).toHaveLength(2);
  });

  it("persists the purge to storage", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 1, 12)); // Saturday

    addNotification({ title: "old", body: "", timestamp: new Date(2026, 6, 20, 10).getTime() });
    getNotifications();

    vi.setSystemTime(new Date(2026, 7, 2, 12)); // Sunday
    expect(getNotifications()).toHaveLength(0);
  });
});

describe("markAllRead / getUnreadCount", () => {
  it("marks all notifications as read", () => {
    addNotification({ title: "t", body: "", timestamp: Date.now() });
    addNotification({ title: "t", body: "", timestamp: Date.now() });
    expect(getUnreadCount()).toBe(2);
    markAllRead();
    expect(getUnreadCount()).toBe(0);
  });
});
