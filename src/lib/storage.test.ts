// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  addToHistory,
  getHistory,
  clearHistory,
  saveReminder,
  getReminders,
  dismissReminder,
  saveDepartureReminder,
  getDepartureReminders,
  dismissDepartureReminder,
  setAnnualEntitlement,
  getAnnualEntitlement,
  getTotalDaysUsed,
  getLeaveTypeLabel,
} from "./storage";

beforeEach(() => {
  localStorage.clear();
});

describe("addToHistory / getHistory", () => {
  it("adds a record to history", () => {
    const ok = addToHistory({
      departureDate: "2026-07-01",
      durationDays: 5,
      returnDate: "2026-07-06",
      resumeDate: "2026-07-07",
      overlaps: 0,
      leaveType: "annual",
    });
    expect(ok).toBe(true);
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].departureDate).toBe("2026-07-01");
    expect(history[0].durationDays).toBe(5);
    expect(history[0].id).toBeDefined();
    expect(history[0].createdAt).toBeDefined();
  });

  it("rejects duplicate departureDate + durationDays", () => {
    addToHistory({
      departureDate: "2026-07-01",
      durationDays: 5,
      returnDate: "2026-07-06",
      resumeDate: "2026-07-07",
      overlaps: 0,
      leaveType: "annual",
    });
    const ok = addToHistory({
      departureDate: "2026-07-01",
      durationDays: 5,
      returnDate: "2026-07-06",
      resumeDate: "2026-07-07",
      overlaps: 0,
      leaveType: "annual",
    });
    expect(ok).toBe(false);
    expect(getHistory()).toHaveLength(1);
  });

  it("allows same departureDate with different durationDays", () => {
    addToHistory({
      departureDate: "2026-07-01",
      durationDays: 5,
      returnDate: "2026-07-06",
      resumeDate: "2026-07-07",
      overlaps: 0,
      leaveType: "annual",
    });
    addToHistory({
      departureDate: "2026-07-01",
      durationDays: 3,
      returnDate: "2026-07-04",
      resumeDate: "2026-07-05",
      overlaps: 0,
      leaveType: "annual",
    });
    expect(getHistory()).toHaveLength(2);
  });

  it("orders newest first", () => {
    addToHistory({
      departureDate: "2026-01-01",
      durationDays: 1,
      returnDate: "2026-01-02",
      resumeDate: "2026-01-03",
      overlaps: 0,
      leaveType: "annual",
    });
    addToHistory({
      departureDate: "2026-02-01",
      durationDays: 1,
      returnDate: "2026-02-02",
      resumeDate: "2026-02-03",
      overlaps: 0,
      leaveType: "sick",
    });
    expect(getHistory()).toHaveLength(2);
    expect(getHistory()[0].departureDate).toBe("2026-02-01");
  });

  it("limits history to 50 records", () => {
    for (let i = 0; i < 60; i++) {
      addToHistory({
        departureDate: `2026-01-${String(i + 1).padStart(2, "0")}`,
        durationDays: 1,
        returnDate: "2026-01-02",
        resumeDate: "2026-01-03",
        overlaps: 0,
        leaveType: "annual",
      });
    }
    expect(getHistory()).toHaveLength(50);
  });

  it("returns empty array when storage is empty", () => {
    expect(getHistory()).toEqual([]);
  });

  it("handles corrupted storage gracefully", () => {
    localStorage.setItem("permission-calculations", "not-json");
    expect(getHistory()).toEqual([]);
  });
});

describe("clearHistory", () => {
  it("removes all history records", () => {
    addToHistory({
      departureDate: "2026-07-01",
      durationDays: 5,
      returnDate: "2026-07-06",
      resumeDate: "2026-07-07",
      overlaps: 0,
      leaveType: "annual",
    });
    clearHistory();
    expect(getHistory()).toHaveLength(0);
  });
});

describe("saveReminder / getReminders", () => {
  it("saves a reminder and retrieves it", () => {
    saveReminder("2026-08-01");
    const reminders = getReminders();
    expect(reminders).toHaveLength(1);
    expect(reminders[0].resumeDate).toBe("2026-08-01");
    expect(reminders[0].dismissed).toBe(false);
  });

  it("does not duplicate reminders for the same date", () => {
    saveReminder("2026-08-01");
    saveReminder("2026-08-01");
    expect(getReminders()).toHaveLength(1);
  });

  it("saves multiple reminders for different dates", () => {
    saveReminder("2026-08-01");
    saveReminder("2026-09-01");
    expect(getReminders()).toHaveLength(2);
  });

  it("handles corrupted storage gracefully", () => {
    localStorage.setItem("permission-reminders", "bad-data");
    expect(getReminders()).toEqual([]);
  });
});

describe("dismissReminder", () => {
  it("marks a reminder as dismissed", () => {
    saveReminder("2026-08-01");
    const reminders = getReminders();
    dismissReminder(reminders[0].id);
    expect(getReminders()[0].dismissed).toBe(true);
  });

  it("does nothing for a non-existent id", () => {
    saveReminder("2026-08-01");
    dismissReminder("nonexistent-id");
    expect(getReminders()[0].dismissed).toBe(false);
  });
});

describe("saveDepartureReminder / getDepartureReminders", () => {
  it("saves and retrieves departure reminders", () => {
    saveDepartureReminder("2026-09-01");
    const reminders = getDepartureReminders();
    expect(reminders).toHaveLength(1);
    expect(reminders[0].departureDate).toBe("2026-09-01");
  });

  it("filters out dismissed and past reminders", () => {
    saveDepartureReminder("2026-09-01");
    const reminders = getDepartureReminders();
    dismissDepartureReminder(reminders[0].id);
    expect(getDepartureReminders()).toHaveLength(0);
  });
});

describe("setAnnualEntitlement / getAnnualEntitlement", () => {
  it("stores and retrieves entitlement", () => {
    setAnnualEntitlement(30);
    expect(getAnnualEntitlement()).toBe(30);
  });

  it("returns 0 when not set", () => {
    expect(getAnnualEntitlement()).toBe(0);
  });

  it("returns 0 for non-numeric storage", () => {
    localStorage.setItem("permission-entitlement", "abc");
    expect(getAnnualEntitlement()).toBe(0);
  });

  it("updates existing entitlement", () => {
    setAnnualEntitlement(30);
    setAnnualEntitlement(45);
    expect(getAnnualEntitlement()).toBe(45);
  });
});

describe("getTotalDaysUsed", () => {
  it("sums durationDays across all records", () => {
    addToHistory({
      departureDate: "2026-07-01",
      durationDays: 5,
      returnDate: "2026-07-06",
      resumeDate: "2026-07-07",
      overlaps: 0,
      leaveType: "annual",
    });
    addToHistory({
      departureDate: "2026-08-01",
      durationDays: 3,
      returnDate: "2026-08-04",
      resumeDate: "2026-08-05",
      overlaps: 0,
      leaveType: "sick",
    });
    expect(getTotalDaysUsed()).toBe(8);
  });

  it("returns 0 when no records exist", () => {
    expect(getTotalDaysUsed()).toBe(0);
  });
});

describe("getLeaveTypeLabel", () => {
  it("returns translated labels for known types", () => {
    const mockT = (key: string) => key;
    expect(getLeaveTypeLabel("Conge", mockT)).toBe("leaveType.conge");
    expect(getLeaveTypeLabel("Permission", mockT)).toBe("leaveType.permission");
    expect(getLeaveTypeLabel("Convalescence", mockT)).toBe("leaveType.convalescence");
    expect(getLeaveTypeLabel("Absent", mockT)).toBe("leaveType.absent");
    // backward compat for old history entries
    expect(getLeaveTypeLabel("annual", mockT)).toBe("leaveType.annual");
    expect(getLeaveTypeLabel("sick", mockT)).toBe("leaveType.sick");
    expect(getLeaveTypeLabel("monthly", mockT)).toBe("leaveType.monthly");
    expect(getLeaveTypeLabel("other", mockT)).toBe("leaveType.other");
  });

  it("returns the raw type for unknown types", () => {
    const mockT = (key: string) => key;
    expect(getLeaveTypeLabel("custom-type", mockT)).toBe("custom-type");
  });
});
