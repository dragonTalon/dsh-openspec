import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { createUserMessage, type Message } from '@deepseek-ai/dsh-llm'
import { Session, SessionId, type UserMessage } from '@deepseek-ai/dsh-session'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import AgentRegistry, { agentEvents, Inbox, type Agent, type PreStepDecision } from '@deepseek-ai/dsh-agent'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import * as toolSkill from '@deepseek-ai/dsh-tool-skill'
import * as dshOpenspec from '../src/index.ts'
import { OPSX_TO_SKILL } from '../src/skills.ts'

async function setup(): Promise<Context> {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(SkillRegistry)
  await ctx.plugin(dshOpenspec)
  await ctx.plugin(toolSkill)
  return ctx
}

function sessionAgent(session: Session): Agent {
  return {
    id: SessionId('dsh-openspec-agent'),
    options: {},
    session,
    inbox: new Inbox(session, { inserted: () => {}, discarded: () => {}, claimed: () => {} }),
    status: 'running',
    ctx: new Context(),
    send: () => {},
    followup: () => {},
    steer: () => {},
    inject: () => { throw new Error('dsh-openspec invocation test does not use agent.inject()') },
    cancel() {},
    runMaintenance: (task) => task(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
}

function agentForCwd(cwd: string): Agent {
  const id = SessionId(`dsh-openspec-${cwd}`)
  const session = Session.create(id, [], { version: 0, id, createdAt: 0, cwd })
  return sessionAgent(session)
}

async function proposeStep(ctx: Context, agent: Agent, messages: UserMessage[]): Promise<PreStepDecision> {
  const signal = new AbortController().signal
  return await agentEvents(ctx, agent).waterfall(
    'agent/pre-step',
    { messages, turn: 1, step: 1, signal },
    () => Promise.resolve({ kind: 'enter' as const, messages }),
  )
}

function userMessage(text: string): UserMessage {
  return createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
}

function injectedTexts(decision: PreStepDecision): string[] {
  if (decision.kind !== 'enter') return []
  const texts: string[] = []
  for (const message of decision.messages) {
    if ((message.source as { kind?: unknown }).kind !== 'skill-invocation') continue
    for (const block of message.content as readonly Message['content'][number][]) {
      if (block.type === 'text') texts.push(block.text)
    }
  }
  return texts
}

describe('dsh-openspec slash-command invocation', () => {
  it('injects the openspec-new-change workflow for /opsx-new', async () => {
    const ctx = await setup()
    const agent = agentForCwd('/tmp/dsh-openspec-test')
    const decision = await proposeStep(ctx, agent, [userMessage('Please start /opsx-new add-user-auth')])
    expect(decision.kind).toBe('enter')
    const texts = injectedTexts(decision)
    expect(texts).toHaveLength(1)
    expect(texts[0]).toContain('openspec new change')
    expect(texts[0]).toContain('Start a new change')
  })

  it('injects the same workflow for the canonical /openspec-new-change', async () => {
    const ctx = await setup()
    const agent = agentForCwd('/tmp/dsh-openspec-test')
    const decision = await proposeStep(ctx, agent, [userMessage('run /openspec-new-change')])
    const texts = injectedTexts(decision)
    expect(texts).toHaveLength(1)
    expect(texts[0]).toContain('openspec new change')
  })

  it('maps every /opsx-* alias to its canonical workflow', async () => {
    const ctx = await setup()
    const agent = agentForCwd('/tmp/dsh-openspec-test')
    for (const id of Object.keys(OPSX_TO_SKILL)) {
      const decision = await proposeStep(ctx, agent, [userMessage(`please run /opsx-${id}`)])
      expect(injectedTexts(decision), `/opsx-${id}`).toHaveLength(1)
    }
  })

  it('does not inject for an unknown /opsx-* gesture', async () => {
    const ctx = await setup()
    const agent = agentForCwd('/tmp/dsh-openspec-test')
    const decision = await proposeStep(ctx, agent, [userMessage('use /opsx-nope')])
    expect(injectedTexts(decision)).toHaveLength(0)
  })
})
