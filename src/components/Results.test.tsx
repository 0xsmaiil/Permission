// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Results } from "./Results";
import { setLocale } from "../lib/i18n";

vi.mock("./LeaveRequestForm", () => ({
  LeaveRequestForm: vi.fn(() => <div data-testid="leave-request-form" />),
}));

const mockGetAnnualEntitlement = vi.fn(() => 30);
const mockGetTotalDaysUsed = vi.fn(() => 10);
const mockGetLeaveTypeLabel = vi.fn(
  (type: string, _t: (k: string) => string) => {
    const labels: Record<string, string> = {
      annual: "سنوية",
      sick: "مرضية",
    };
    return labels[type] ?? type;
  },
);

vi.mock("../lib/storage", () => ({
  getAnnualEntitlement: (...args: unknown[]) =>
    mockGetAnnualEntitlement(...args),
  getTotalDaysUsed: (...args: unknown[]) => mockGetTotalDaysUsed(...args),
  getLeaveTypeLabel: (...args: unknown[]) => mockGetLeaveTypeLabel(...args),
}));

const mockToast = vi.fn();
vi.mock("../lib/toast", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

const mockClipboardWrite = vi.fn(() => Promise.resolve());

const baseProps = {
  returnDate: new Date("2026-07-10"),
  resumeDate: new Date("2026-07-11"),
  overlaps: [] as { name: string; date: string; type: "national" | "religious" }[],
  durationDays: 5,
  departureDate: new Date("2026-07-05"),
  leaveType: "annual",
};

beforeEach(() => {
  vi.clearAllMocks();
  setLocale("ar");
  vi.stubGlobal("navigator", {
    ...navigator,
    clipboard: { writeText: mockClipboardWrite },
  });
});

describe("Results", () => {
  it("displays return date in result card", () => {
    render(<Results {...baseProps} />);
    const labels = screen.getAllByText("تاريخ العودة");
    expect(labels).toHaveLength(2);
    const tens = screen.getAllByText("10");
    expect(tens.length).toBeGreaterThanOrEqual(1);
  });

  it("displays resume date in result card", () => {
    render(<Results {...baseProps} />);
    const labels = screen.getAllByText("تاريخ الاستئناف");
    expect(labels).toHaveLength(2);
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  it("displays departure date in details section", () => {
    render(<Results {...baseProps} />);
    expect(screen.getByText("تاريخ الانطلاق")).toBeInTheDocument();
  });

  it("displays duration in badge", () => {
    render(<Results {...baseProps} />);
    expect(screen.getByText("5 أيام")).toBeInTheDocument();
  });

  it("shows leave type badge", () => {
    render(<Results {...baseProps} />);
    expect(screen.getByText("سنوية")).toBeInTheDocument();
  });

  it("shows no-overlaps message when there are no holiday overlaps", () => {
    render(<Results {...baseProps} />);
    expect(
      screen.getByText("لا توجد أعياد رسمية خلال هذه الفترة"),
    ).toBeInTheDocument();
  });

  it("displays holiday overlaps when present", () => {
    const props = {
      ...baseProps,
      overlaps: [
        { name: "عيد العمال", date: "2026-07-05", type: "national" as const },
        { name: "عيد الاستقلال", date: "2026-07-05", type: "national" as const },
      ],
    };
    render(<Results {...props} />);
    expect(screen.getByText("عيد العمال")).toBeInTheDocument();
    expect(screen.getByText("عيد الاستقلال")).toBeInTheDocument();
    expect(screen.getAllByText("عطلة رسمية")).toHaveLength(2);
  });

  it("renders copy button", () => {
    render(<Results {...baseProps} />);
    expect(screen.getByText("نسخ الملخص")).toBeInTheDocument();
  });

  it("renders share (WhatsApp) button", () => {
    render(<Results {...baseProps} />);
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
  });

  it("renders print button", () => {
    render(<Results {...baseProps} />);
    expect(screen.getByText("طباعة")).toBeInTheDocument();
  });

  it("renders save button when onSave is provided and not saved", () => {
    render(<Results {...baseProps} onSave={vi.fn()} />);
    expect(screen.getByText("حفظ في السجل")).toBeInTheDocument();
  });

  it("calls onSave when save button is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Results {...baseProps} onSave={onSave} />);
    await user.click(screen.getByText("حفظ في السجل"));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("shows saved state instead of save button when saved is true", () => {
    render(<Results {...baseProps} saved onSave={vi.fn()} />);
    expect(screen.getByText("تم الحفظ ✓")).toBeInTheDocument();
    expect(screen.queryByText("حفظ في السجل")).not.toBeInTheDocument();
  });

  it("copies summary to clipboard and shows toast", async () => {
    const user = userEvent.setup();
    render(<Results {...baseProps} />);
    await user.click(screen.getByText("نسخ الملخص"));

    await vi.waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });
  });

  it("calls window.print when print button is clicked", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<Results {...baseProps} />);
    await user.click(screen.getByText("طباعة"));
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it("displays entitlement info when entitlement is set", () => {
    render(<Results {...baseProps} />);
    expect(screen.getByText("رصيد العطل")).toBeInTheDocument();
  });

  it("renders disclaimer text", () => {
    render(<Results {...baseProps} />);
    expect(
      screen.getByText(
        /هذه النتائج تقديرية — يرجى تأكيد التواريخ مع مصلحة الموارد البشرية/,
      ),
    ).toBeInTheDocument();
  });

  it("renders LeaveRequestForm", () => {
    render(<Results {...baseProps} />);
    expect(screen.getByTestId("leave-request-form")).toBeInTheDocument();
  });

  it("opens WhatsApp share URL when share button is clicked", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();
    render(<Results {...baseProps} />);
    await user.click(screen.getByText("WhatsApp"));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("wa.me"),
      "_blank",
    );
    openSpy.mockRestore();
  });
});
