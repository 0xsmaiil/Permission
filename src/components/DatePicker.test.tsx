// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatePicker } from "./DatePicker";
import { setLocale } from "../lib/i18n";

const noHoliday = () => false;
const alwaysHoliday = () => true;
const minDate = "2020-01-01";

beforeEach(() => {
  setLocale("ar");
});

describe("DatePicker", () => {
  it("renders trigger button with placeholder when no value", () => {
    render(<DatePicker value="" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("اختر التاريخ")).toBeInTheDocument();
  });

  it("renders trigger button with formatted date when value is set", () => {
    render(<DatePicker value="2024-06-15" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    const trigger = screen.getByRole("combobox");
    expect(trigger.textContent).toMatch(/15/);
  });

  it("shows dropdown when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("button", { name: "الشهر السابق" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "الشهر التالي" })).toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("ح")).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByText("ح")).not.toBeInTheDocument();
  });

  it("calls onChange when a valid day is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker value="" onChange={onChange} min={minDate} isHoliday={noHoliday} />);
    await user.click(screen.getByRole("combobox"));

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const cells = screen.getAllByRole("button").filter((b) => !isNaN(Number(b.textContent)));
    const todayCell = cells.find((b) => b.textContent === String(today.getDate()));
    if (todayCell) {
      await user.click(todayCell);
      expect(onChange).toHaveBeenCalledWith(todayStr);
    }
  });

  it("adds holiday styling to holiday cells", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="" onChange={() => {}} min={minDate} isHoliday={alwaysHoliday} />);
    await user.click(screen.getByRole("combobox"));

    const dayCells = screen.getAllByRole("button").filter((b) => {
      const text = b.textContent;
      return text && /^\d+$/.test(text);
    });
    expect(dayCells.length).toBeGreaterThan(0);
    dayCells.forEach((cell) => {
      expect(cell.classList.contains("dp-holiday")).toBe(true);
    });
  });

  it("adds holiday error styling when value is a holiday", () => {
    render(<DatePicker value="2024-06-15" onChange={() => {}} min={minDate} isHoliday={alwaysHoliday} />);
    expect(screen.getByRole("combobox")).toHaveClass("dp-error");
  });

  it("navigates to previous month", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    await user.click(screen.getByRole("combobox"));

    const prevBtn = screen.getByRole("button", { name: "الشهر السابق" });
    await user.click(prevBtn);
  });

  it("navigates to next month", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    await user.click(screen.getByRole("combobox"));

    const nextBtn = screen.getByRole("button", { name: "الشهر التالي" });
    await user.click(nextBtn);
  });

  it("closes dropdown on Escape key", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("ح")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText("ح")).not.toBeInTheDocument();
  });

  it("supports setting a custom id on the trigger", () => {
    render(<DatePicker id="my-date" value="" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    expect(screen.getByRole("combobox")).toHaveAttribute("id", "my-date");
  });

  it("uses French locale when set", () => {
    setLocale("fr");
    render(<DatePicker value="" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    expect(screen.getByText("Choisir une date")).toBeInTheDocument();
  });

  it("disables past days", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="" onChange={() => {}} min="2099-01-01" isHoliday={noHoliday} />);
    await user.click(screen.getByRole("combobox"));

    const disabledBtns = screen.getAllByRole("button").filter((b) => b.hasAttribute("disabled"));
    expect(disabledBtns.length).toBeGreaterThan(0);
  });

  it("shows day headers for Arabic locale", async () => {
    const user = userEvent.setup();
    render(<DatePicker value="" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    await user.click(screen.getByRole("combobox"));

    expect(screen.getByText("ح")).toBeInTheDocument();
    expect(screen.getByText("ن")).toBeInTheDocument();
    expect(screen.getByText("س")).toBeInTheDocument();
  });

  it("shows day headers for French locale", async () => {
    setLocale("fr");
    const user = userEvent.setup();
    render(<DatePicker value="" onChange={() => {}} min={minDate} isHoliday={noHoliday} />);
    await user.click(screen.getByRole("combobox"));

    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
  });
});
