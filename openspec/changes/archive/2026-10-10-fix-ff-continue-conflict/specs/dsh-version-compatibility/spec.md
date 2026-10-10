# Spec Delta

## Purpose

Defines how dsh-openspec declares its DeepSeek Harness peer ranges so the plugin passes the runtime's plugin-compatibility gate.

## ADDED Requirements

### Requirement: Plugin declares DSH-0.2.x-compatible peer ranges

The `@deepseek-ai/dsh-skill` and `@deepseek-ai/dsh-invariants` entries in `peerDependencies` SHALL use a semver range that satisfies the running DeepSeek Harness runtime (0.2.x), as evaluated by the runtime's `evaluatePluginCompatibility` check with prereleases included.

#### Scenario: 0.2.x runtime accepts the declared peers

- **WHEN** the plugin is loaded on a DeepSeek Harness 0.2.x runtime
- **THEN** every `@deepseek-ai/dsh*` peerDependency satisfies `semver.satisfies(runtimeVersion, range, { includePrerelease: true })` and the plugin is not rejected
