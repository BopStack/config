#!/usr/bin/env node
/**
 * @bopstack/config — CLI entry point.
 *
 * Subcommands:
 *   init   Install @bopstack/* config packages into a target project.
 */

import { run_cli } from './cli/run_cli.js'

run_cli(process.argv.slice(2))