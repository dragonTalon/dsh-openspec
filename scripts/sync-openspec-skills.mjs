#!/usr/bin/env node
/**
 * Generate `src/skills.ts` from the OpenSpec repository's `skills/*\/SKILL.md`.
 *
 * OpenSpec authors its 12 workflow skills as SKILL.md files. This script keeps
 * the plugin in lockstep with that upstream source:
 *
 *   - extracts `name`, `description`, and the instruction body (frontmatter
 *     keys like `allowed-tools`/`license`/`compatibility` are deliberately
 *     dropped — they carry no meaning for DSH's skill model);
 *   - preserves the canonical `openspec-*` skill names (these are valid DSH
 *     kebab-case skill names, so `/openspec-new-change` works natively and the
 *     bodies' `/openspec-*` cross-references stay valid);
 *   - emits the `opsx-*` command-alias map so the Claude-style commands
 *     (`/opsx:new` → `/opsx-new`) resolve to their canonical skill.
 *
 * Usage:
 *   node scripts/sync-openspec-skills.mjs [--openspec <path>] [--check]
 *
 * `--openspec <path>` overrides the OpenSpec checkout (default:
 * `~/Documents/github/OpenSpec`); `OPENSPEC_REPO` works too.
 * `--check` regenerates into memory and exits non-zero when the on-disk file
 * differs (used by CI to keep the generated file fresh).
 */

import { readFile, readdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const PKG_DIR = resolve(SCRIPT_DIR, '..')
const OUT_FILE = join(PKG_DIR, 'src', 'skills.ts')
const DEFAULT_OPENSPEC = join(homedir(), 'Documents', 'github', 'OpenSpec')

/**
 * `/opsx:<id>` command id -> canonical OpenSpec skill name.
 * Mirrors OpenSpec's `COMMAND_TO_SKILL_NAME` in
 * `src/utils/command-references.ts`; `verifyMapping()` cross-checks it.
 */
const OPSX_TO_SKILL = {
  explore: 'openspec-explore',
  new: 'openspec-new-change',
  continue: 'openspec-continue-change',
  apply: 'openspec-apply-change',
  update: 'openspec-update-change',
  ff: 'openspec-ff-change',
  sync: 'openspec-sync-specs',
  archive: 'openspec-archive-change',
  'bulk-archive': 'openspec-bulk-archive-change',
  verify: 'openspec-verify-change',
  onboard: 'openspec-onboard',
  propose: 'openspec-propose',
}

function parseArgs(argv) {
  let openspecPath = process.env.OPENSPEC_REPO
  let check = false
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--openspec') openspecPath = argv[++i]
    else if (argv[i] === '--check') check = true
  }
  return { openspecPath: openspecPath ?? DEFAULT_OPENSPEC, check }
}

/** Parse `---\n...\n---\n<body>`; return undefined when the file has no frontmatter. */
function parseFrontmatter(raw) {
  const firstLineEnd = raw.indexOf('\n')
  if (firstLineEnd < 0) return undefined
  const firstLine = raw.slice(0, firstLineEnd).replace(/\r$/, '')
  if (firstLine !== '---') return undefined
  const closing = findClosingFrontmatter(raw, firstLineEnd + 1)
  if (closing === undefined) return undefined
  const yaml = raw.slice(firstLineEnd + 1, closing.start)
  const name = /^name:\s*(.+?)\s*$/m.exec(yaml)?.[1]
  const description = /^description:\s*(.+?)\s*$/m.exec(yaml)?.[1]
  if (name === undefined || description === undefined) return undefined
  return {
    name: name.trim(),
    description: description.trim(),
    content: raw.slice(closing.bodyStart).trim(),
  }
}

function findClosingFrontmatter(raw, start) {
  let lineStart = start
  while (lineStart <= raw.length) {
    const nextNewline = raw.indexOf('\n', lineStart)
    const lineEnd = nextNewline < 0 ? raw.length : nextNewline
    const line = raw.slice(lineStart, lineEnd).replace(/\r$/, '')
    if (line === '---') {
      return { start: lineStart, bodyStart: nextNewline < 0 ? raw.length : nextNewline + 1 }
    }
    if (nextNewline < 0) return undefined
    lineStart = nextNewline + 1
  }
  return undefined
}

async function readOpenspecVersion(openspecPath) {
  try {
    const manifest = JSON.parse(await readFile(join(openspecPath, 'package.json'), 'utf8'))
    return manifest.version ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

/** Cross-check OPSX_TO_SKILL against OpenSpec's COMMAND_TO_SKILL_NAME; returns drift report. */
async function verifyMapping(openspecPath) {
  let raw
  try {
    raw = await readFile(join(openspecPath, 'src', 'utils', 'command-references.ts'), 'utf8')
  } catch {
    return { checked: false, missing: [], extra: [], mismatched: [] }
  }
  const match = /const COMMAND_TO_SKILL_NAME[\s\S]*?= \{([\s\S]*?)\n\}/.exec(raw)
  if (match === null) return { checked: false, missing: [], extra: [], mismatched: [] }
  const upstream = {}
  for (const line of match[1].split('\n')) {
    const pair = /^\s*'([a-z-]+)':\s*'([a-z0-9-]+)',?\s*$/.exec(line)
    if (pair !== null) upstream[pair[1]] = pair[2]
  }
  const mine = OPSX_TO_SKILL
  const missing = Object.keys(upstream).filter((key) => mine[key] === undefined)
  const extra = Object.keys(mine).filter((key) => upstream[key] === undefined)
  const mismatched = Object.keys(mine).filter(
    (key) => upstream[key] !== undefined && upstream[key] !== mine[key],
  )
  return { checked: true, missing, extra, mismatched }
}

async function collectSkills(openspecPath) {
  const skillsDir = join(openspecPath, 'skills')
  const entries = await readdir(skillsDir, { withFileTypes: true })
  const skills = []
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('openspec-')) continue
    const file = join(skillsDir, entry.name, 'SKILL.md')
    const raw = await readFile(file, 'utf8')
    const parsed = parseFrontmatter(raw)
    if (parsed === undefined) {
      throw new Error(`${file}: missing or malformed frontmatter`)
    }
    if (parsed.name !== entry.name) {
      throw new Error(`${file}: frontmatter name "${parsed.name}" != directory "${entry.name}"`)
    }
    skills.push(parsed)
  }
  skills.sort((a, b) => (a.name < b.name ? -1 : 1))
  return skills
}

function render(skills, version) {
  const skillEntries = skills
    .map((skill) => [
      `  {`,
      `    name: ${JSON.stringify(skill.name)},`,
      `    description: ${JSON.stringify(skill.description)},`,
      `    content: ${JSON.stringify(skill.content)},`,
      `  },`,
    ].join('\n'))
    .join('\n')
  const aliasEntries = Object.entries(OPSX_TO_SKILL)
    .map(([id, name]) => `  ${JSON.stringify(id)}: ${JSON.stringify(name)},`)
    .join('\n')
  return `// AUTO-GENERATED by scripts/sync-openspec-skills.mjs — do not edit by hand.
// Source: OpenSpec skills/*\/SKILL.md @ ${version}
// Re-generate: node scripts/sync-openspec-skills.mjs

export interface OpenspecSkill {
  readonly name: string
  readonly description: string
  readonly content: string
}

/** Canonical OpenSpec workflow skills (kebab-case; model- and user-invocable). */
export const OPENSPEC_SKILLS: readonly OpenspecSkill[] = [
${skillEntries}
]

/** \`/opsx-<id>\` command alias -> canonical OpenSpec skill name. */
export const OPSX_TO_SKILL: Readonly<Record<string, string>> = {
${aliasEntries}
}
`
}

async function main() {
  const { openspecPath, check } = parseArgs(process.argv.slice(2))
  const version = await readOpenspecVersion(openspecPath)
  const skills = await collectSkills(openspecPath)
  if (skills.length !== Object.keys(OPSX_TO_SKILL).length) {
    throw new Error(
      `expected ${Object.keys(OPSX_TO_SKILL).length} skills, found ${skills.length} in ${join(openspecPath, 'skills')}`,
    )
  }
  const drift = await verifyMapping(openspecPath)
  if (drift.checked && (drift.missing.length || drift.extra.length || drift.mismatched.length)) {
    throw new Error(
      `OPSX_TO_SKILL drifted from OpenSpec COMMAND_TO_SKILL_NAME: `
      + `missing=${JSON.stringify(drift.missing)} extra=${JSON.stringify(drift.extra)} `
      + `mismatched=${JSON.stringify(drift.mismatched)}`,
    )
  }
  const output = render(skills, version)
  if (check) {
    const existing = await readFile(OUT_FILE, 'utf8').catch(() => '')
    if (existing !== output) {
      process.stderr.write(`${OUT_FILE} is stale; run node scripts/sync-openspec-skills.mjs\n`)
      process.exitCode = 1
    }
    return
  }
  await writeFile(OUT_FILE, output)
  process.stdout.write(`wrote ${OUT_FILE} (${skills.length} skills, OpenSpec ${version})\n`)
}

main().catch((error) => {
  process.stderr.write(`sync-openspec-skills: ${error.stack ?? error}\n`)
  process.exitCode = 1
})
