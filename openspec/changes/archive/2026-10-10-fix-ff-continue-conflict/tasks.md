# Tasks

## 1. Description override

- [x] 1.1 Add a name-keyed description override map and a `descriptionFor(name, fallback)` helper in `src/index.ts` carrying the ff and continue wording from design D2; verify `npm run build` type-checks and emits the exported helper
- [x] 1.2 Route the canonical skill registration loop through `descriptionFor` so `openspec-ff-change` and `openspec-continue-change` register the sharpened descriptions; verify `npm run build` succeeds
- [x] 1.3 Route the `/opsx-*` alias registration loop through `descriptionFor` so the aliases inherit the same sharpened descriptions; verify `npm run build` succeeds

## 2. Tests

- [x] 2.1 Update `tests/opsx-skills.spec.ts` to assert the effective (overridden) description for ff and continue, and the unchanged generated description for the other 10 skills; verify `npm test` passes
- [x] 2.2 Add explicit wording assertions pinning the ff "ALL … in ONE run" signal and the continue "exactly ONE … then stop" signal; verify `npm test` passes

## 3. Verification

- [x] 3.1 Confirm the override lives outside the generated `src/skills.ts` (`git diff -- src/skills.ts` is empty); `npm run sync:skills:check` reports pre-existing 1.10.0→1.14.1 drift, which is out of scope for this change (re-sync is a separate change)
- [x] 3.2 Run the full `npm test` and `npm run build`; verify both pass

## 4. DSH 0.2.x peer compatibility

- [x] 4.1 Update `peerDependencies` (`@deepseek-ai/dsh-skill`, `@deepseek-ai/dsh-invariants`) to `^0.2.0-rc.2`; verify `semver.satisfies('0.2.0-rc.2', range, { includePrerelease: true })` is true for both
- [x] 4.2 Verify the plugin passes the DSH 0.2.x compatibility gate and the `/opsx-*` commands load again after a profile restart
