/**
 * Tests for file copy logic.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { copy_config_file } from "./file_copy.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = join(__dirname, "..", "..", "tmp", "test-target");

describe("file_copy", () => {
  beforeEach(() => {
    rmSync(TMP_DIR, { recursive: true, force: true });
    mkdirSync(TMP_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  it("dry-run reports without writing", () => {
    const result = copy_config_file({
      targetDir: TMP_DIR,
      fileEntry: {
        packageName: "@bopstack/git-hook",
        sourceFileName: "lefthook.yml",
        targetFileName: ".lefthook.yml",
      },
      dryRun: true,
    });

    expect(result).not.toBeNull();
    expect(result!.written).toBe(false);
    expect(result!.existing).toBe(false);
  });
});
