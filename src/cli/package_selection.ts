/**
 * Package selection logic for bopstack-config init.
 *
 * Defines which @bopstack/* packages to install per project kind,
 * and which config files to copy with optional dotfile renaming.
 */

import { type } from "arktype";

/**
 * A single config file to copy.
 */
export interface ConfigFile {
  /** Source package name (e.g. '@bopstack/tsconfig'). */
  packageName: string;
  /** File name inside the package (e.g. 'tsconfig.base.json'). */
  sourceFileName: string;
  /** Target file name in the project (e.g. 'tsconfig.base.json'). */
  targetFileName: string;
}

/** Dotfile rename table: package files that need a leading dot on install. */
const DOTFILE_RENAMES: Record<string, string> = {
  "lefthook.yml": ".lefthook.yml",
  "markdownlint.json": ".markdownlint.json",
  "cspell.json": ".cspell.json",
};

/**
 * Get the correct target filename, handling dotfile renames.
 */
function resolve_target_name(fileName: string): string {
  return DOTFILE_RENAMES[fileName] ?? fileName;
}

/** Project kind schema. */
export const PROJECT_KINDS = ["default"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

export const ProjectKindSchema = type('"default"');

/** Default package set — all config packages for a standard TypeScript project. */
const DEFAULT_PACKAGES = [
  "@bopstack/tsconfig",
  "@bopstack/oxfmt",
  "@bopstack/oxlint",
  "@bopstack/oxc",
  "@bopstack/commitlint",
  "@bopstack/markdownlint",
  "@bopstack/spellcheck",
  "@bopstack/just",
  "@bopstack/custom-lint",
  "@bopstack/git-hook",
] as const;

const DEFAULT_CONFIG_FILES: ConfigFile[] = [
  {
    packageName: "@bopstack/tsconfig",
    sourceFileName: "tsconfig.base.json",
    targetFileName: "tsconfig.base.json",
  },
  {
    packageName: "@bopstack/oxfmt",
    sourceFileName: "oxfmtrc.json",
    targetFileName: "oxfmtrc.json",
  },
  {
    packageName: "@bopstack/oxlint",
    sourceFileName: "oxlintrc.json",
    targetFileName: "oxlintrc.json",
  },
  {
    packageName: "@bopstack/commitlint",
    sourceFileName: "commitlintrc.ts",
    targetFileName: "commitlint.config.ts",
  },
  { packageName: "@bopstack/just", sourceFileName: "justfile", targetFileName: "justfile" },
  {
    packageName: "@bopstack/git-hook",
    sourceFileName: "lefthook.yml",
    targetFileName: resolve_target_name("lefthook.yml"),
  },
  {
    packageName: "@bopstack/markdownlint",
    sourceFileName: "markdownlint.json",
    targetFileName: resolve_target_name("markdownlint.json"),
  },
  {
    packageName: "@bopstack/spellcheck",
    sourceFileName: "cspell.json",
    targetFileName: resolve_target_name("cspell.json"),
  },
];

/**
 * Get npm packages to install for a given project kind.
 */
export function get_packages(kind: ProjectKind): readonly string[] {
  switch (kind) {
    case "default":
      return DEFAULT_PACKAGES;
    default:
      return DEFAULT_PACKAGES;
  }
}

/**
 * Get config files to copy for a given project kind.
 */
export function get_config_files(kind: ProjectKind): ConfigFile[] {
  switch (kind) {
    case "default":
      return DEFAULT_CONFIG_FILES;
    default:
      return DEFAULT_CONFIG_FILES;
  }
}
