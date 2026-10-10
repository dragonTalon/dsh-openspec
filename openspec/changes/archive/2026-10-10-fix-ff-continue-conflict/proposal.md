# Proposal

## Why

The model conflates the fast-forward (`openspec-ff-change`) and continue (`openspec-continue-change`) skills because their descriptions are nearly identical — both read as "create artifacts for a change", distinguished only by a weak batch-vs-incremental signal. In practice a `/opsx-ff` run degrades into continue behavior: the model creates one artifact, stops, and the user must repeatedly say "continue" to finish. The installed OpenSpec CLI is now 1.14.1, but this package still pins skill content to 1.10.0, so the ff/continue descriptions lack the routing hints newer OpenSpec added — and even those hints only claim the slash command, they do not disambiguate the two skills from each other.

Separately, after upgrading DeepSeek Harness to 0.2.x, the plugin stopped loading entirely. DSH 0.2.x added a plugin-compatibility gate that rejects any plugin whose `@deepseek-ai/dsh*` peerDependencies do not satisfy the running runtime. This package still declared `^0.1.1-rc.2`, so the whole bundle was skipped at startup and the `/opsx-*` commands disappeared.

## What Changes

- Sharpen the `description` surfaced for `openspec-ff-change` so it unambiguously signals **batch**: create *all* artifacts needed for implementation in one run.
- Sharpen the `description` surfaced for `openspec-continue-change` so it unambiguously signals **incremental**: create exactly *one* next artifact, then stop.
- The 12 `/opsx-*` aliases keep resolving to the same canonical bodies; their content is unchanged. Only the canonical skill descriptions change.
- The description override is applied at the registration layer in a **non-generated** source file, so it survives `npm run sync:skills` re-generation.
- Update the tests that assert skill descriptions to match the sharpened values.
- Update `peerDependencies` (`@deepseek-ai/dsh-skill`, `@deepseek-ai/dsh-invariants`) from `^0.1.1-rc.2` to `^0.2.0-rc.2` so the plugin passes the DSH 0.2.x compatibility gate.

## Capabilities

### New Capabilities
- `skill-descriptions`: registered OpenSpec workflow skills present unambiguous, mutually-distinct routing descriptions so the model selects the intended workflow.
- `dsh-version-compatibility`: the plugin declares `@deepseek-ai/dsh*` peer ranges that satisfy the running DeepSeek Harness runtime's compatibility gate.

### Modified Capabilities
<!-- none -->

## Impact

- `src/index.ts` (non-generated registration override): canonical `openspec-ff-change` / `openspec-continue-change` descriptions.
- `tests/opsx-skills.spec.ts`: description assertions updated.
- `package.json`: `peerDependencies` `@deepseek-ai/dsh-skill` / `@deepseek-ai/dsh-invariants` bumped to `^0.2.0-rc.2`.
- No schema, `/opsx-*` alias mapping, or skill `content` changes.
