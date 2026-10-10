# Spec Delta

## Purpose

Defines how dsh-openspec describes its registered OpenSpec workflow skills so the model-facing catalog routes each request to the intended workflow.

## ADDED Requirements

### Requirement: Fast-forward description signals batch creation

The description registered for the `openspec-ff-change` skill SHALL state that the skill creates every artifact needed to start implementation in a single run, without stopping between artifacts.

#### Scenario: Fast-forward description indicates batch creation

- **WHEN** a consumer reads the `openspec-ff-change` description
- **THEN** the description indicates creation of all required artifacts in one run

### Requirement: Continue description signals incremental creation

The description registered for the `openspec-continue-change` skill SHALL state that the skill creates exactly one next artifact and then stops.

#### Scenario: Continue description indicates single-artifact creation

- **WHEN** a consumer reads the `openspec-continue-change` description
- **THEN** the description indicates creation of one artifact per invocation followed by a stop

### Requirement: Fast-forward and continue descriptions are mutually distinct

The descriptions for `openspec-ff-change` and `openspec-continue-change` SHALL differ on the batch-vs-incremental axis so a model can distinguish which workflow a request selects.

#### Scenario: Batch and incremental descriptions differ

- **WHEN** the two descriptions are compared
- **THEN** the batch signal (all artifacts, one run) differs from the incremental signal (one artifact, then stop)
