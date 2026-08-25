import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import * as dshOpenspec from '../src/index.ts'
import { OPENSPEC_SKILLS, OPSX_TO_SKILL } from '../src/skills.ts'

async function setup(aliases = true): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SkillRegistry)
  await ctx.plugin(dshOpenspec, { aliases })
  return ctx
}

describe('dsh-openspec skill registration', () => {
  it('registers all 12 canonical openspec-* skills as model+user invocable', async () => {
    const ctx = await setup()
    const byName = new Map((await ctx.skills.list()).map((skill) => [skill.name, skill]))

    expect(OPENSPEC_SKILLS.length).toBe(12)
    for (const skill of OPENSPEC_SKILLS) {
      const summary = byName.get(skill.name)
      expect(summary, skill.name).toBeDefined()
      expect(summary?.description).toBe(skill.description)
      expect(summary?.invocation).toEqual({ modelInvocable: true, userInvocable: true })
    }
  })

  it('registers /opsx-* aliases as user-only and content-identical to their canonical skill', async () => {
    const ctx = await setup()
    const byName = new Map((await ctx.skills.list()).map((skill) => [skill.name, skill]))

    expect(Object.keys(OPSX_TO_SKILL).length).toBe(12)
    for (const [id, canonicalName] of Object.entries(OPSX_TO_SKILL)) {
      const aliasName = `opsx-${id}`
      const summary = byName.get(aliasName)
      expect(summary, aliasName).toBeDefined()
      expect(summary?.invocation).toEqual({ modelInvocable: false, userInvocable: true })

      const alias = await ctx.skills.get(aliasName)
      const canonical = await ctx.skills.get(canonicalName)
      expect(alias, aliasName).toBeDefined()
      expect(canonical, canonicalName).toBeDefined()
      expect(alias?.content).toBe(canonical?.content)
    }
  })

  it('omits aliases when config.aliases is false', async () => {
    const ctx = await setup(false)
    const names = new Set((await ctx.skills.list()).map((skill) => skill.name))
    expect(names.has('opsx-new')).toBe(false)
    expect(names.has('openspec-new-change')).toBe(true)
  })

  it('generated bodies carry only /openspec-* cross-references (no /opsx: colon form)', async () => {
    for (const skill of OPENSPEC_SKILLS) {
      expect(skill.content, skill.name).not.toMatch(/\/opsx:/)
    }
  })
})
