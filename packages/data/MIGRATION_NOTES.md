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
