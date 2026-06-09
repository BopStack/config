/**
 * Changelog generator for @bopstack/config.
 *
 * Reads git history + tags, emits CHANGELOG.md in Keep a Changelog format.
 * Run: bun scripts/changelog.ts
 *
 * Conventions:
 *   - Tags: v<semver> (e.g. v0.1.0, v0.2.0)
 *   - Commits: Conventional Commits (feat:, fix:, chore:, docs:, etc.)
 */

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

// ─── Types ────────────────────────────────────────────────────────────────

type Commit = {
	hash: string
	date: string
	scope: string | null
	type: string
	breaking: boolean
	title: string
}

// ─── Config ────────────────────────────────────────────────────────────────

const REPO = 'BopStack/config'
const MAX_BUFFER = 10_485_760 // 10 MiB
const DEFAULT_PRIORITY = 99
const CONVENTIONAL_COMMIT_RE = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/

const TYPE_ORDER: Record<string, { label: string; priority: number }> = {
	feat: { label: 'Features', priority: 1 },
	fix: { label: 'Bug Fixes', priority: 2 },
	perf: { label: 'Performance', priority: 3 },
	refactor: { label: 'Refactors', priority: 4 },
	test: { label: 'Tests', priority: 5 },
	docs: { label: 'Documentation', priority: 6 },
	style: { label: 'Style', priority: 7 },
	build: { label: 'Build', priority: 8 },
	ci: { label: 'CI', priority: 9 },
	chore: { label: 'Chores', priority: 10 }
}

// ─── Git helpers ──────────────────────────────────────────────────────────

function git(cmd: string): string {
	return execSync(cmd, { encoding: 'utf-8', maxBuffer: MAX_BUFFER }).trim()
}

function get_tags(): string[] {
	return git('git tag -l --sort=version:refname')
		.split('\n')
		.filter(Boolean)
}

function get_tag_date(tag: string): string | null {
	try {
		return git(`git log -1 --format="%ad" --date=short ${tag}`)
	} catch {
		return null
	}
}

function parse_commit(hash: string, date: string, subject: string): Commit {
	const msg = subject.trim()
	let type = 'other'
	let scope: string | null = null
	let title = msg
	let breaking = false

	const match = msg.match(CONVENTIONAL_COMMIT_RE)
	if (match) {
		const [, conv_type, conv_scope, conv_breaking, conv_title] = match
		type = conv_type
		scope = conv_scope || null
		breaking = conv_breaking === '!'
		title = conv_title
	}

	return { hash, date, scope, type, breaking, title }
}

/** Get commits in range (from..to). from=null means (initial)..to. */
function get_commits(from: string | null, to: string): Commit[] {
	if (from === null) {
		const raw = git(`git log --format="%H||%ad||%s" --date=short ${to}`)
		return raw
			.split('\n')
			.filter(Boolean)
			.map((line) => {
				const [hash, date, ...rest] = line.split('||')
				return parse_commit(hash.trim(), date.trim(), rest.join('||').trim())
			})
	}

	const raw = git(`git log --format="%H||%ad||%s" --date=short ${from}..${to}`)
	const commits = raw
		.split('\n')
		.filter(Boolean)
		.map((line) => {
			const [hash, date, ...rest] = line.split('||')
			return parse_commit(hash.trim(), date.trim(), rest.join('||').trim())
		})

	const from_hash = git(`git rev-parse ${from}^{commit}`)
	return commits.filter((c) => c.hash !== from_hash)
}

function group_by_type(commits: Commit[]): Map<string, Commit[]> {
	const groups = new Map<string, Commit[]>()
	for (const c of commits) {
		const existing = groups.get(c.type) ?? []
		existing.push(c)
		groups.set(c.type, existing)
	}
	for (const [, entries] of groups) {
		entries.sort((a, b) => a.date.localeCompare(b.date) || a.hash.localeCompare(b.hash))
	}
	return groups
}

// ─── Rendering ────────────────────────────────────────────────────────────

function type_to_label(type: string): string {
	return TYPE_ORDER[type]?.label ?? (type.charAt(0).toUpperCase() + type.slice(1))
}

function type_priority(type: string): number {
	return TYPE_ORDER[type]?.priority ?? DEFAULT_PRIORITY
}

function tag_version(tag: string): string {
	return tag.startsWith('v') ? tag.slice(1) : tag
}

function render_commits(commits: Commit[], lines: string[]): void {
	const groups = group_by_type(commits)
	const sorted = [...groups.entries()].sort(
		(a, b) => type_priority(a[0]) - type_priority(b[0])
	)

	for (const [type, entries] of sorted) {
		lines.push(`### ${type_to_label(type)}`)
		for (const c of entries) {
			const brk = c.breaking ? ' **BREAKING**' : ''
			const scp = c.scope ? ` **${c.scope}:**` : ''
			lines.push(`-${scp} ${c.title}${brk}`)
		}
		lines.push('')
	}
}

// ─── Main ─────────────────────────────────────────────────────────────────

function render_version_references(
	tags: string[],
	lines: string[]
): void {
	const compare_base = `https://github.com/${REPO}/compare`
	const release_base = `https://github.com/${REPO}/releases/tag`

	lines.push(`[Unreleased]: ${compare_base}/${tags[tags.length - 1] ?? 'HEAD'}...HEAD`)

	for (let i = 0; i < tags.length; i += 1) {
		const ver = tag_version(tags[i])
		if (i === 0) {
			lines.push(`[${ver}]: ${release_base}/${tags[i]}`)
		} else {
			lines.push(`[${ver}]: ${compare_base}/${tags[i - 1]}...${tags[i]}`)
		}
	}
	lines.push('')
}

function render_unreleased(tags: string[], lines: string[]): void {
	lines.push('## [Unreleased]')
	lines.push('')
	const last_tag = tags[tags.length - 1] ?? null
	if (!last_tag) {
		lines.push('_(No unreleased changes)_')
		lines.push('')
		return
	}
	const unreleased = get_commits(last_tag, 'HEAD')
	if (unreleased.length === 0) {
		lines.push('_(No unreleased changes)_')
		lines.push('')
		return
	}
	render_commits(unreleased, lines)
}

function render_released_versions(tags: string[], lines: string[]): void {
	let prev: string | null = null
	for (const tag of tags) {
		const commits = get_commits(prev, tag)
		const date = get_tag_date(tag)
		lines.push(`## [${tag_version(tag)}] - ${date ?? 'unknown'}`)
		lines.push('')
		if (commits.length > 0) {
			render_commits(commits, lines)
		} else {
			lines.pop()
			lines.pop()
			prev = tag
			continue
		}
		prev = tag
	}
}

async function main(): Promise<void> {
	const tags = get_tags()
	const lines: string[] = [
		'# Changelog',
		'',
		'All notable changes to this project will be documented in this file.',
		'',
		'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),',
		'and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
		''
	]

	render_unreleased(tags, lines)
	render_released_versions(tags, lines)
	render_version_references(tags, lines)

	writeFileSync('CHANGELOG.md', lines.join('\n'), 'utf-8')
	console.log('✓ CHANGELOG.md generated')
}

void main()
