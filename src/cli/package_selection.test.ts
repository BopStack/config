/**
 * Tests for package selection logic.
 */

import { describe, it, expect } from "vitest";
import { get_packages, get_config_files, ProjectKindSchema } from "./package_selection.js";

describe("package_selection", () => {
  it("get_packages returns packages for default kind", () => {
    const packages = get_packages("default");
    expect(packages.length).toBeGreaterThanOrEqual(9);
    expect(packages).toContain("@bopstack/tsconfig");
    expect(packages).toContain("@bopstack/oxfmt");
    expect(packages).toContain("@bopstack/just");
    expect(packages).toContain("@bopstack/git-hook");
  });

  it("get_config_files returns files for default kind", () => {
    const files = get_config_files("default");
    expect(files.length).toBeGreaterThanOrEqual(7);
    expect(files.some((f) => f.packageName === "@bopstack/tsconfig")).toBe(true);
    expect(files.some((f) => f.packageName === "@bopstack/git-hook")).toBe(true);
  });

  it("lefthook.yml gets renamed to .lefthook.yml", () => {
    const files = get_config_files("default");
    const lefthookFile = files.find((f) => f.sourceFileName === "lefthook.yml");
    expect(lefthookFile).toBeDefined();
    expect(lefthookFile!.targetFileName).toBe(".lefthook.yml");
  });

  it("commitlintrc.ts maps to commitlint.config.ts", () => {
    const files = get_config_files("default");
    const commitlintFile = files.find((f) => f.sourceFileName === "commitlintrc.ts");
    expect(commitlintFile).toBeDefined();
    expect(commitlintFile!.targetFileName).toBe("commitlint.config.ts");
  });

  it('ProjectKindSchema accepts "default"', () => {
    expect(ProjectKindSchema("default")).toEqual("default");
  });
});
