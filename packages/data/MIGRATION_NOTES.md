# 2017 Starter migration notes

## Scope

Source set key: `2017core`.

The migrated fixture intentionally includes every legacy record whose set list contains `2017core`.
Some cards also appeared in other releases; `legacySetId` indicates why they are present in this
fixture, while `legacyId` preserves the source record identity.

## Ship cards

The source contains eight ship cards:

Federation:
- S274 — U.S.S. Enterprise-D
- S273 — Federation Starship / Galaxy Class
- S272 — U.S.S. Sutherland
- S271 — Federation Starship / Nebula Class

Klingon:
- S270 — K'mpec's Attack Cruiser
- S269 — Klingon Starship / Vor'cha Class
- S268 — I.K.S. Vorn
- S172 — Klingon Starship / K'Vort Class

This is intentional even though the physical starter contains four named miniatures.

## Shared legacy records

Some records in `2017core` also belong to other products. For example `W204` Photon Torpedoes also
appears in other set lists. The new fixture retains one stable card identity and records `2017core`
as the migration context for this starter-set slice.

Migration policy: if a value cannot be verified from the source, leave it explicitly unresolved
rather than guessing.


## Physical cards versus logical records

The 2017 Starter is a useful schema test because physical-card identity is not always the same as
playable rules identity.

- Lursa (`Cap445`) and B'Etor (`Cap444`) are modeled as alternate logical faces sharing
  `physical-2017-lursa-betor`.
- K'Mpec Captain (`Cap543`) and K'Mpec Admiral (`A031`) are modeled as alternate logical faces
  sharing `physical-2017-kmpec-admiral`.

This relationship belongs in canonical data, not in React conditionals.

## Supplied 2E ship interpretation

The U.S.S. Enterprise-D (`S274`) values below come from the supplied 2E card mockup rather than
the legacy 2017 database: 25 SP ship cost, 28 SP upgrade limit, Auxiliary Reserve 2, and a
4 / 2 / 6 / 3 stat line. Its rules summary is transcribed from that mockup.

The Galaxy, Nebula, Vor'cha, and K'Vort class silhouettes and the Auxiliary Reserve icon are
presentation assets supplied for the 2E card layout; they do not add or infer rules values.

The remaining seven ship records deliberately leave `upgradeSpLimit` and
`auxiliaryPowerReserve` unresolved until their 2E cards are supplied.

Sensor Echo is not retained as a printed action. In 2E, a ship with Cloak may use Sensor Echo
while it has an active Cloak token; this gameplay condition is not duplicated on the builder's
action bar. Additional 2E actions remain unresolved pending supplied icon references.

## Rules-text icon tokens

Rules copy may use bracketed semantic tokens such as `[time]`, `[hit]`, `[crit]`,
`[battlestations]`, or `[crew]`. Canonical data keeps those readable tokens; the web renderer maps
the controlled vocabulary to the supplied STAW 2E font. Unknown tokens remain visible as text so a
misspelling or future symbol cannot silently disappear.

The exact rules copy added in version 0.10.0 was supplied in
`STAW-2E-Content-2017-Starter-Populated.xlsx`. Records marked as legacy seeds in that workbook
remain subject to 2E review; token rendering does not promote their rules or costs to confirmed 2E
values.

## Supplied 2E Weapon attack values

Every Weapon upgrade displays an attack value in the 2E card layout. A numeric printed value is
stored directly; a non-numeric or rules-derived value is stored as `special` and rendered with the
supplied red special-value symbol. The Primary Weapon Value icon is not used in the top attack
badge. `PWV` remains valid in the lower cost badge when a card's SP cost is tied to the equipped
ship's Primary Weapon Value.
