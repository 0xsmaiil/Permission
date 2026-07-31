// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { setLocale } from "./lib/i18n";
import { getStoredTheme } from "./lib/theme";

beforeEach(() => {
  localStorage.clear();
  setLocale("ar");
  localStorage.setItem("permission-onboarding", "1");
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(display-mode: standalone)",
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
});

describe("App smoke", () => {
  it("mounts without throwing", () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it("renders the app bar title", () => {
    render(<App />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Permission");
  });

  it("renders 3 tab buttons", () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(3);
  });

  it("renders the tab bar", () => {
    const { container } = render(<App />);
    expect(container.querySelector('[role="tablist"]')).toBeTruthy();
  });

  it("toggles locale and flips document direction", async () => {
    const user = userEvent.setup();
    render(<App />);

    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2] as HTMLElement);

    const initialDir = document.documentElement.dir;
    const toggle = screen.getByRole("button", { name: "الفرنسية" });
    await user.click(toggle);

    expect(document.documentElement.dir).not.toBe(initialDir);
  });

  it("selects the theme (dark class toggle)", async () => {
    const user = userEvent.setup();
    render(<App />);

    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2] as HTMLElement);

    await user.click(screen.getByRole("button", { name: "داكن" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(getStoredTheme()).toBe("dark");

    await user.click(screen.getByRole("button", { name: "تلقائي" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(getStoredTheme()).toBe("auto");

    await user.click(screen.getByRole("button", { name: "فاتح" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(getStoredTheme()).toBe("light");
  });

  it("switches tabs on click", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(3);

    await user.click(tabs[1] as HTMLElement);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");

    await user.click(tabs[0] as HTMLElement);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
  });
});
