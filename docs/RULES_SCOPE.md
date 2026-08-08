# Rules scope

This document separates the rules currently encoded by Frontiers from fixture facts and future
interpretations. It should be updated with every rules-engine slice.

## Implemented in `packages/core`

- A fleet is a versioned collection of ship instances.
- Each ship instance may carry one captain.
- Upgrade capacity is derived from the ship card's typed slots.
- A captain contributes the talent slots printed in the canonical captain record.
- A unique card record may appear only once in a fleet.
- A Captain or Upgrade Card that does not share a faction with its ship adds a 1 SP faction
  penalty. A 0 SP Captain is exempt. This follows the squad-building rule and published FAQ wording.
- An upgrade with `costMode: "primary-weapon"` uses the equipped ship's primary attack value as its
  base SP cost. The fixture uses this for Torpedo Fusillade.
- Missing catalog references, slot overflow, duplicate instance IDs, and repeated unique records are
  reported by `validateFleet`.

Rules reference:

- [STAW rulebook retained with the Utopia repository](https://angrytribble.github.io/Star-Trek-Attack-Wing-Utopia/assets/pdf/STAWRulebook.pdf)
- [December 2014 FAQ and errata](https://prudentandorian.github.io/staw-utopia/STAW%20FAQ%20%26%20Errata%20December%204%202014.pdf)

## Canonical fixture facts

- 36 logical records belong to the `2017core` migration slice.
- All records retain `legacyId` and `legacySetId`.
- Lursa/B'Etor and Captain/Admiral K'Mpec have explicit alternate-face relationships.
- Ship stats, slots, action lists, captain skills, costs, types, and faction membership come from the
  migrated fixture rather than the React UI.

See `packages/data/MIGRATION_NOTES.md` for the card-level migration notes.

## Deliberately unresolved

- Admiral assignment and fleet-level admiral effects
- persona-level uniqueness across multiple printings; current validation uses stable record ID
- Rule of 3 and other current organized-play construction rules
- resources, squadrons, missions, and scenario-specific construction
- format definitions, point caps, and restricted/banned lists
- special cards that alter slot types, faction penalties, or other construction rules
- collection ownership and physical-card availability
- full card text and in-game timing/ability resolution

These rules need explicit schema support and documented requirements before implementation. They
must not be inferred inside React components.
