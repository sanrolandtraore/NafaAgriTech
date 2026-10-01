import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import App from "@/App";

describe("Mounting App Root Component", () => {
  it("renders App without crashing", async () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});
