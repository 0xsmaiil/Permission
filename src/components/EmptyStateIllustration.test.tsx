// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EmptyStateIllustration } from "./EmptyStateIllustration";

describe("EmptyStateIllustration", () => {
  it("renders an SVG element", () => {
    const { container } = render(<EmptyStateIllustration />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("has the correct dimensions", () => {
    const { container } = render(<EmptyStateIllustration />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "160");
    expect(svg).toHaveAttribute("height", "120");
  });

  it("has the empty-illustration class", () => {
    const { container } = render(<EmptyStateIllustration />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("empty-illustration");
  });

  it("renders 10 rect elements", () => {
    const { container } = render(<EmptyStateIllustration />);
    expect(container.querySelectorAll("rect").length).toBe(10);
  });

  it("renders a circle and a path", () => {
    const { container } = render(<EmptyStateIllustration />);
    expect(container.querySelectorAll("circle").length).toBe(1);
    expect(container.querySelectorAll("path").length).toBe(1);
  });

  it("has role=\"img\" and aria-label for accessibility", () => {
    const { container } = render(<EmptyStateIllustration />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("aria-label", "Empty state illustration");
  });
});
