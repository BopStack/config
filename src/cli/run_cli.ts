/**
 * CLI command router.
 *
 * Routes subcommands to their handlers and handles
 * --help/-h, unknown commands, and top-level errors.
 */

import { exit } from 'node:process'

import { init } from './init_command.js'

/**
 * Run the CLI with the given arguments.
 */
export function run_cli(argv: string[]): void {
	const [cmd, ...args] = argv

	const main = async (): Promise<void> => {
		switch (cmd) {
			case 'init':
				await init(args)
				break
			case '--help':
			case '-h':
			case undefined:
				console.log(`Usage: bopstack-config <command> [options]

Commands:
  init     Install @bopstack/* config packages into a target project.
           --target=<path>    Target project directory (default: cwd)
           --kind=<type>      Project kind (default: "default")
           --dry-run          Preview changes without writing
`)
				break
			default:
				console.error(`Unknown command: ${cmd}`)
				console.error('Run `bopstack-config --help` for usage.')
				exit(1)
		}
	}

	main().catch((err) => {
		console.error('bopstack-config: unexpected error:', err)
		exit(1)
	})
}