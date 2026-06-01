/**
 * File copy utilities for bopstack-config init.
 *
 * Copies/renames config files from installed @bopstack/* packages
 * into a target project directory, handling dotfile renaming.
 */

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/** Options for copying a single config file. */
export interface CopyFileOptions {
  /** Target project root directory. */
  targetDir: string;
  /** Source config file entry describing what to copy. */
  fileEntry: {
    packageName: string;
    sourceFileName: string;
    targetFileName: string;
  };
  /** If true, only report what would be written. */
  dryRun: boolean;
}

/** Result from copying a file. */
export interface CopyFileResult {
  /** Target file path that was (or would be) written. */
  targetPath: string;
  /** Whether the file already exists. */
  existing: boolean;
  /** Whether the copy was performed (false in dry-run). */
  written: boolean;
}

/**
 * Resolve the source path for a package's config file.
 */
function resolve_package_config_path(packageName: string, fileName: string): string | null {
  const candidates = [
    join("node_modules", packageName, fileName),
    join("node_modules", packageName, "src", fileName),
    join("node_modules", packageName, "dist", fileName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Copy a config file from its package to the target project directory.
 * Handles dotfile renames (e.g. lefthook.yml → .lefthook.yml).
 */
export function copy_config_file(options: CopyFileOptions): CopyFileResult | null {
  const { targetDir, fileEntry, dryRun } = options;
  const { sourceFileName, targetFileName } = fileEntry;
  const targetPath = join(targetDir, targetFileName);
  const existing = existsSync(targetPath);

  if (dryRun) {
    console.log(
      `[dry-run] ${existing ? "overwrite" : "create"} ${targetPath}` +
        (targetFileName !== sourceFileName ? ` (from ${sourceFileName})` : ""),
    );
    return { targetPath, existing, written: false };
  }

  const sourcePath = resolve_package_config_path(fileEntry.packageName, sourceFileName);

  if (!sourcePath && !existing) {
    console.warn(`[skip] source not found for ${fileEntry.packageName}/${sourceFileName}`);
    return null;
  }

  // Ensure target directory exists
  const targetDirPath = dirname(targetPath);
  if (!existsSync(targetDirPath)) {
    mkdirSync(targetDirPath, { recursive: true });
  }

  if (sourcePath) {
    copyFileSync(sourcePath, targetPath);
    console.log(`[write] ${targetPath}`);
  } else {
    console.log(`[skip] ${targetPath} (already exists, no source to update)`);
  }

  return { targetPath, existing, written: true };
}

/**
 * Report summary of copied files to the user.
 */
export function report_summary(
  results: (CopyFileResult | null)[],
  packagesInstalled: string[],
): void {
  const written = results.filter((r): r is CopyFileResult => r !== null && r.written);
  const skipped = results.filter((r) => r === null).length;
  const existing = results.filter(
    (r): r is CopyFileResult => r !== null && r.existing && !r.written,
  );

  console.log("\n--- Summary ---");
  console.log(`Packages installed: ${packagesInstalled.length}`);
  console.log(`Config files written: ${written.length}`);
  if (existing.length > 0) {
    console.log(`Config files already existing (skipped): ${existing.length}`);
  }
  if (skipped > 0) {
    console.log(`Config files skipped (source not found): ${skipped}`);
  }
  console.log("\nSuggested next steps:");
  console.log("  Review the copied config files and adjust as needed.");
  console.log("  Run `just check` to verify the setup.");
}
