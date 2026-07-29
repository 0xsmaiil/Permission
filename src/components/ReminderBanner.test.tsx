// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { ReminderBanner } from "./ReminderBanner";
import { setLocale } from "../lib/i18n";

const REMINDER_KEY = "permission-reminders";
const DEPARTURE_KEY = "permission-departure-reminders";

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function seedResume(daysUntil: number) {
  localStorage.setItem(
    REMINDER_KEY,
    JSON.stringify([
      {
        id: "resume-1",
        resumeDate: isoInDays(daysUntil),
        daysUntil,
        createdAt: new Date().toISOString(),
        dismissed: false,
      },
    ]),
  );
}

function seedDeparture(daysUntil: number) {
  localStorage.setItem(
    DEPARTURE_KEY,
    JSON.stringify([
      {
        id: "dep-1",
        departureDate: isoInDays(daysUntil),
        daysUntil,
        createdAt: new Date().toISOString(),
        dismissed: false,
      },
    ]),
  );
}

beforeEach(() => {
  localStorage.clear();
  // setLocale keeps module-level state that outlives cleanup().
  setLocale("ar");
});

describe("ReminderBanner", () => {
  it("renders nothing when there are no reminders", () => {
    const { container } = render(<ReminderBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a resume reminder", () => {
    seedResume(5);
    render(<ReminderBanner />);
    expect(screen.getByRole("button", { name: /.+/ })).toBeInTheDocument();
    expect(screen.getAllByText(/\d/).length).toBeGreaterThan(0);
  });

  it("renders both resume and departure reminders", () => {
    seedResume(5);
    seedDeparture(3);
    const { container } = render(<ReminderBanner />);
    expect(container.querySelectorAll(".reminder-item")).toHaveLength(2);
  });

  // Regression: labels were formatted once inside a ref-guarded effect and
  // frozen in state, so switching language left the text in the old locale
  // while the dismiss button's aria-label correctly re-translated.
  it("re-translates reminder text when the locale changes", () => {
    seedResume(5);
    const { container } = render(<ReminderBanner />);

    const textEl = container.querySelector(".reminder-text");
    const arabic = textEl?.textContent ?? "";
    expect(arabic).not.toBe("");

    act(() => setLocale("fr"));

    const french = container.querySelector(".reminder-text")?.textContent ?? "";
    expect(french).not.toBe("");
    expect(french).not.toBe(arabic);
  });

  it("keeps the dismiss aria-label and reminder text in the same locale", () => {
    seedResume(5);
    const { container } = render(<ReminderBanner />);
    act(() => setLocale("fr"));

    const item = container.querySelector(".reminder-item");
    expect(item).not.toBeNull();
    const label = within(item as HTMLElement)
      .getByRole("button")
      .getAttribute("aria-label");
    const text = item?.querySelector(".reminder-text")?.textContent ?? "";

    // Arabic script must not linger in either once French is active.
    const hasArabic = /[\u0600-\u06FF]/;
    expect(hasArabic.test(text)).toBe(false);
    expect(hasArabic.test(label ?? "")).toBe(false);
  });

  it("removes a reminder when dismissed", async () => {
    const user = userEvent.setup();
    seedResume(5);
    seedDeparture(3);
    const { container } = render(<ReminderBanner />);

    expect(container.querySelectorAll(".reminder-item")).toHaveLength(2);
    await user.click(container.querySelectorAll(".reminder-dismiss")[0] as HTMLElement);
    expect(container.querySelectorAll(".reminder-item")).toHaveLength(1);
  });

  it("hides the banner once every reminder is dismissed", async () => {
    const user = userEvent.setup();
    seedResume(5);
    const { container } = render(<ReminderBanner />);

    await user.click(container.querySelector(".reminder-dismiss") as HTMLElement);
    expect(container).toBeEmptyDOMElement();
  });

  it("persists dismissal to storage", async () => {
    const user = userEvent.setup();
    seedResume(5);
    const { container } = render(<ReminderBanner />);

    await user.click(container.querySelector(".reminder-dismiss") as HTMLElement);
    const stored = JSON.parse(localStorage.getItem(REMINDER_KEY) ?? "[]");
    expect(stored[0].dismissed).toBe(true);
  });

  it("uses different wording for imminent vs distant reminders", () => {
    seedResume(1);
    const { container, unmount } = render(<ReminderBanner />);
    const soon = container.querySelector(".reminder-text")?.textContent ?? "";
    unmount();

    localStorage.clear();
    seedResume(10);
    const { container: later } = render(<ReminderBanner />);
    const distant = later.querySelector(".reminder-text")?.textContent ?? "";

    expect(soon).not.toBe("");
    expect(distant).not.toBe("");
    expect(soon).not.toBe(distant);
  });
});
