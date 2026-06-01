/**
 * init command — installs @bopstack/* config packages into a target project.
 *
 * Usage: bopstack-config init [--target=<path>] [--kind=<type>] [--dry-run]
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { exit } from "node:process";
import { type } from "arktype";
import {
  get_packages,
  get_config_files,
  ProjectKindSchema,
  type ProjectKind,
} from "./package_selection.js";
import { copy_config_file, report_summary } from "./file_copy.js";

/** Parsed CLI args for init. */
interface InitArgs {
  target: string;
  kind: ProjectKind;
  dryRun: boolean;
}

/**
 * Parse init command arguments.
 */
function parse_args(args: string[]): InitArgs {
  let target: string | undefined;
  let kind: string | undefined;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith("--target=")) {
      target = arg.slice("--target=".length);
    } else if (arg.startsWith("--kind=")) {
      kind = arg.slice("--kind=".length);
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }

  // Validate project kind
  const kindResult = ProjectKindSchema(kind ?? "default");
  if (kindResult instanceof type.errors) {
    console.error(`Invalid project kind: ${kind}`);
    exit(1);
  }

  return {
    target: target ?? process.cwd(),
    kind: kind as ProjectKind,
    dryRun,
  };
}

/**
 * Init command handler.
 */
export async function init(rawArgs: string[]): Promise<void> {
  const { target, kind, dryRun } = parse_args(rawArgs);

  if (!existsSync(target)) {
    console.error(`Target directory does not exist: ${target}`);
    exit(1);
  }

  const packages = get_packages(kind);
  const configFiles = get_config_files(kind);

  console.log(`Initializing @bopstack config in: ${target}`);
  console.log(`Project kind: ${kind}`);
  console.log(`Packages to install: ${packages.join(", ")}\n`);

  // Step 1: Install packages
  if (!dryRun) {
    console.log("Installing packages...");
    const installResult = spawnSync("pnpm", ["add", "-D", ...packages], {
      cwd: target,
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (installResult.status !== 0) {
      const stderr = installResult.stderr?.toString() ?? "";
      console.error("Package installation failed:");
      console.error(stderr);
      exit(1);
    }

    console.log("Packages installed successfully.\n");
  } else {
    console.log("[dry-run] Would install packages via: pnpm add -D " + packages.join(" ") + "\n");
  }

  // Step 2: Copy config files
  console.log("Copying config files...");
  const results = configFiles.map((file) =>
    copy_config_file({
      targetDir: target,
      fileEntry: {
        packageName: file.packageName,
        sourceFileName: file.sourceFileName,
        targetFileName: file.targetFileName,
      },
      dryRun,
    }),
  );

  // Step 3: Report summary
  report_summary(results, [...packages]);
}
