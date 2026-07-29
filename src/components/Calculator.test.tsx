// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calculator } from "./Calculator";
import { setLocale } from "../lib/i18n";

vi.mock("./Results", () => ({
  Results: vi.fn(() => <div data-testid="results" />),
}));

vi.mock("./BottomSheet", () => ({
  BottomSheet: vi.fn(
    ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
      isOpen ? <div data-testid="bottom-sheet">{children}</div> : null,
  ),
}));

vi.mock("./DatePicker", () => ({
  DatePicker: vi.fn(
    ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
      <input
        data-testid="date-picker"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
  ),
}));

vi.mock("../lib/holidays", () => ({
  calculateDates: vi.fn(() => ({
    returnDate: new Date("2026-07-10"),
    resumeDate: new Date("2026-07-11"),
    overlaps: [],
  })),
  isHoliday: vi.fn(() => false),
}));

const mockAddToHistory = vi.fn(() => true);
const mockSaveReminder = vi.fn();
const mockSaveDepartureReminder = vi.fn();
vi.mock("../lib/storage", () => ({
  addToHistory: (...args: unknown[]) => mockAddToHistory(...args),
  saveReminder: (...args: unknown[]) => mockSaveReminder(...args),
  saveDepartureReminder: (...args: unknown[]) => mockSaveDepartureReminder(...args),
}));

vi.mock("../lib/dates", () => ({
  toLocalDateStr: vi.fn(() => "2026-07-01"),
}));

vi.mock("../lib/toast", () => ({
  toast: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  setLocale("ar");
});

describe("Calculator", () => {
  it("renders leave type chips, duration input, date picker, and calculate button", () => {
    render(<Calculator />);
    expect(screen.getByText("سنوية")).toBeInTheDocument();
    expect(screen.getByText("إجازة")).toBeInTheDocument();
    expect(screen.getByText("مرضية")).toBeInTheDocument();
    expect(screen.getByText("غياب")).toBeInTheDocument();
    expect(screen.getByLabelText("مدة العطلة (بالأيام)")).toBeInTheDocument();
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    expect(screen.getByText("احسب")).toBeInTheDocument();
  });

  it("selects leave type when a chip is clicked", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    const congeChip = screen.getByText("سنوية");
    await user.click(congeChip);
    expect(congeChip).toHaveClass("chip-active");
  });

  it("shows custom type input when 'أخرى' chip is clicked", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await user.click(screen.getByText("أخرى"));
    expect(
      screen.getByPlaceholderText("اكتب نوع العطلة..."),
    ).toBeInTheDocument();
  });

  it("accepts duration input via number field", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    const input = screen.getByLabelText<HTMLInputElement>(
      "مدة العطلة (بالأيام)",
    );
    await user.clear(input);
    await user.type(input, "7");
    expect(input).toHaveValue(7);
  });

  it("calculate button is disabled when fields are empty", () => {
    render(<Calculator />);
    expect(screen.getByText("احسب").closest("button")).toBeDisabled();
  });

  it("calculate button is enabled when duration and date are provided", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    const durInput = screen.getByLabelText("مدة العطلة (بالأيام)");
    await user.clear(durInput);
    await user.type(durInput, "5");

    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2026-07-01" },
    });

    expect(screen.getByText("احسب").closest("button")).not.toBeDisabled();
  });

  it("opens bottom sheet with results after calculation", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    const durInput = screen.getByLabelText("مدة العطلة (بالأيام)");
    await user.clear(durInput);
    await user.type(durInput, "5");

    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2026-07-01" },
    });

    await user.click(screen.getByText("احسب").closest("button")!);
    expect(screen.getByTestId("bottom-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("results")).toBeInTheDocument();
  });

  it("shows reset button after calculation", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    const durInput = screen.getByLabelText("مدة العطلة (بالأيام)");
    await user.clear(durInput);
    await user.type(durInput, "5");

    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2026-07-01" },
    });

    await user.click(screen.getByText("احسب").closest("button")!);
    expect(screen.getByText("حساب جديد")).toBeInTheDocument();
  });

  it("reset button clears inputs and hides results", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    const durInput = screen.getByLabelText("مدة العطلة (بالأيام)");
    await user.clear(durInput);
    await user.type(durInput, "5");

    fireEvent.change(screen.getByTestId("date-picker"), {
      target: { value: "2026-07-01" },
    });

    await user.click(screen.getByText("احسب").closest("button")!);
    await user.click(screen.getByText("حساب جديد"));

    expect(durInput).toHaveValue(null);
    expect(screen.getByTestId<HTMLInputElement>("date-picker")).toHaveValue("");
    await waitFor(() => {
      expect(screen.queryByTestId("bottom-sheet")).not.toBeInTheDocument();
    });
  });

  it("loads data from loadData prop", () => {
    render(
      <Calculator
        loadData={{
          departure: "2026-08-15",
          duration: "10",
          leaveType: "Convalescence",
        }}
      />,
    );
    expect(
      screen.getByLabelText<HTMLInputElement>("مدة العطلة (بالأيام)"),
    ).toHaveValue(10);
    expect(screen.getByTestId<HTMLInputElement>("date-picker")).toHaveValue(
      "2026-08-15",
    );
    expect(screen.getByText("مرضية")).toHaveClass("chip-active");
  });

  it("calls onDataLoaded when loadData is provided", () => {
    const onDataLoaded = vi.fn();
    render(
      <Calculator
        loadData={{ departure: "2026-08-15", duration: "10" }}
        onDataLoaded={onDataLoaded}
      />,
    );
    expect(onDataLoaded).toHaveBeenCalledOnce();
  });

  it("handles custom leave type from loadData", () => {
    render(
      <Calculator
        loadData={{
          departure: "2026-08-15",
          duration: "5",
          leaveType: "إجازة استثنائية",
        }}
      />,
    );
    expect(
      screen.getByPlaceholderText("اكتب نوع العطلة..."),
    ).toBeInTheDocument();
  });
});
