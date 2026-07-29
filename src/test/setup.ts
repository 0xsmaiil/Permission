import { afterEach } from "vitest";

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Only wire up DOM helpers when a test actually opted into jsdom via
// `@vitest-environment jsdom`. Node-env tests (date logic, API handlers)
// must not pay for, or depend on, Testing Library.
if (typeof window !== "undefined") {
  // Tells React 19 it is running under a test runner so act() can flush
  // updates synchronously. Without it, state changes triggered outside
  // render (e.g. the i18n listener) may not be applied before assertions.
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");

  afterEach(() => {
    cleanup();
    // Components read locale/theme/history from localStorage. Leaking it
    // between tests would make execution order significant.
    localStorage.clear();
  });
}
