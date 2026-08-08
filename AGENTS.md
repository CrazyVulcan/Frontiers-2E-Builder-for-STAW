# STAW Community — Agent Contract

This repository is a clean-room successor to the Utopia / SPUDs fleet-building ecosystem.

## Non-negotiable architecture

1. Game data describes the game. UI state must never leak into canonical game data.
2. Rules logic lives in `packages/core`, not React components.
3. Domain schemas and types live in `packages/schema`.
4. Canonical game records live in `packages/data`.
5. React consumes core/data APIs; React components do not become the rules engine.
6. Every persistent entity has a stable ID that is independent from display name.
7. Preserve the legacy Utopia/SPUDs ID in `legacyId` when migrating an existing record.
8. Saved fleets always carry an explicit `formatVersion`.
9. Prefer small pure functions to mutable global state.
10. Do not port legacy implementation details unless a documented requirement needs them.

## Dependency direction

`schema + data -> core -> web UI`

Never reverse this dependency.

## 2017 starter vertical slice

The first canonical fixture is the legacy `2017core` set.

Expected contents:
- 2 factions: Federation and Klingon
- 8 ship-card records: four named ships and four generic class counterparts
- 7 captain cards
- 1 admiral card
- 20 upgrade cards
- 36 total records

The physical starter has four named miniatures. The additional four ship records are generic ship
cards and are intentionally retained because this project models game cards, not only miniatures.

## Current rules boundary

The prototype may:
- browse/search/filter the complete fixture
- add/remove ship cards
- calculate base ship SP totals
- serialize a versioned fleet file

Do not implement captain/upgrades legality inside React. That is the next core-rules slice.

## Migration discipline

When migrating legacy data:
- normalize naming/whitespace without changing meaning
- retain `legacyId`
- retain `legacySetId`
- distinguish facts copied from the legacy database from newly interpreted rules
- add tests for record counts and set/faction invariants
- do not silently invent missing values
