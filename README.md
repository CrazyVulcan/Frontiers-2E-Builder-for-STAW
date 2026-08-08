# Frontiers — 2E Builder for STAW

Frontiers is a clean-room, community-built fleet builder for **Star Trek: Attack Wing**. The current
milestone turns the legacy `2017core` fixture into a working end-to-end builder while keeping game
data, rules, and presentation separate.

## What works

- browse and search all 36 logical records in the 2017 Starter fixture
- filter by faction and card type
- drag Ship cards from the left library into the fleet workspace
- drag Captain and Upgrade cards directly onto a ship
- use click-to-add and click-to-equip controls on touch and keyboard-driven devices
- add and remove ship cards
- assign one captain per ship
- equip upgrades into ship and captain-provided talent slots
- prevent duplicate use of the same unique card record
- calculate ship, captain, upgrade, variable weapon, and faction-penalty costs
- validate a fleet before exporting it as versioned JSON
- responsive fleet-building UI suitable for GitHub Pages
- project-supplied 2E faction, stat, action, command, and uniqueness iconography

Admirals remain catalog-only. Rule-of-three, resources, format point limits, collection tracking,
import, and the complete card catalog are future slices. See [docs/RULES_SCOPE.md](docs/RULES_SCOPE.md)
for the implemented rule boundary and the places where the schema still needs to grow.

## Fixture

| Logical type | Count |
| --- | ---: |
| Ship records | 8 |
| Captain faces/records | 7 |
| Admiral faces/records | 1 |
| Upgrade records | 20 |
| **Total** | **36** |

The physical starter has four named miniatures. The legacy database also associates a generic ship
card with each class, so all eight ship-card records are intentionally retained. Alternate playable
faces use `physicalCardId` and `alternateFaceId` rather than conflating physical-card identity with
rules identity.

## Development

Prerequisites: Node.js 22 or later and npm.

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm test
npm run check
npm run build
```

## Architecture

```text
packages/schema + packages/data
              ↓
         packages/core
              ↓
          src (React)
```

- `packages/schema` owns persistent domain shapes and IDs.
- `packages/data` owns canonical migrated records and provenance.
- `packages/core` owns filtering, drag/drop placement, fleet mutation, cost calculation, and validation.
- `src` renders the builder and calls the core API; it does not define game rules.
- `public/icons/2e` contains normalized presentation assets supplied by the project owner.

Saved fleet files currently use `formatVersion: 1`.

## Deploy to GitHub Pages

The repository includes a Pages workflow at `.github/workflows/deploy.yml`. After creating the
GitHub repository and pushing the `main` branch:

1. Open **Settings → Pages** in GitHub.
2. Set **Source** to **GitHub Actions**.
3. Run the **Test and deploy GitHub Pages** workflow, or push another commit to `main`.

Vite uses a relative asset base, so the generated site works at a repository subpath without
hard-coding a GitHub username or repository slug.

## Provenance

The starter fixture was mapped from
[`AngryTribble/STAW-Angry_SPUDS`](https://github.com/AngryTribble/STAW-Angry_SPUDS) using records
whose set list contains `2017core`. Each migrated record retains its legacy record and set IDs.

This is an unofficial community project and is not affiliated with or endorsed by WizKids or the
owners of Star Trek.
