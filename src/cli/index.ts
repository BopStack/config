#!/usr/bin/env node
/**
 * @bopstack/config — CLI entry point.
 *
 * Subcommands:
 *   init   Install @bopstack/* config packages into a target project.
 */

import { exit } from "node:process";
import { init } from "./init.js";

const [cmd, ...args] = process.argv.slice(2);

async function main() {
  switch (cmd) {
    case "init":
      await init(args);
      break;
    case "--help":
    case "-h":
    case undefined:
      console.log(`Usage: bopstack-config <command> [options]

Commands:
  init     Install @bopstack/* config packages into a target project.
           --target=<path>    Target project directory (default: cwd)
           --kind=<type>      Project kind (default: "default")
           --dry-run          Preview changes without writing
`);
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      console.error("Run `bopstack-config --help` for usage.");
      exit(1);
  }
}

main().catch((err) => {
  console.error("bopstack-config: unexpected error:", err);
  exit(1);
});
