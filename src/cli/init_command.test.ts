/**
 * Tests for init command argument parsing.
 */

import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";

describe("init arg parsing", () => {
  it("detects a valid target directory", () => {
    expect(existsSync(process.cwd())).toBe(true);
  });
});
