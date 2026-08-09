import { describe, expect, it } from "vitest";
import {
  starter2017Admirals,
  starter2017Captains,
  starter2017Cards,
  starter2017Ships,
  starter2017Upgrades,
} from "../data/starter2017";
import { filterCatalog } from "./catalog";

describe("2017 Starter catalog fixture", () => {
  it("contains exactly 36 migrated records", () => {
    expect(starter2017Cards).toHaveLength(36);
  });

  it("contains the expected type counts", () => {
    expect(starter2017Ships).toHaveLength(8);
    expect(starter2017Captains).toHaveLength(7);
    expect(starter2017Admirals).toHaveLength(1);
    expect(starter2017Upgrades).toHaveLength(20);
  });

  it("contains only Federation and Klingon cards", () => {
    const factions = new Set(starter2017Cards.flatMap((card) => card.factions));
    expect([...factions].sort()).toEqual(["federation", "klingon"]);
  });

  it("records supplied 2E ship values without inventing values for other ships", () => {
    const enterprise = starter2017Ships.find((card) => card.legacyId === "S274")!;

    expect(enterprise).toMatchObject({
      cost: 25,
      attack: 4,
      agility: 2,
      hull: 6,
      shields: 3,
      upgradeSpLimit: 28,
      auxiliaryPowerReserve: 2,
      upgradeSlots: ["tech", "weapon", "crew", "crew", "crew"],
    });
    expect(starter2017Ships
      .filter((ship) => ship.legacyId !== "S274")
      .every((ship) => ship.upgradeSpLimit === undefined && ship.auxiliaryPowerReserve === undefined))
      .toBe(true);
  });

  it("prints Cloak without a separate Sensor Echo action", () => {
    const cloakingShips = starter2017Ships.filter((ship) => ship.actions.includes("cloak"));

    expect(cloakingShips).toHaveLength(4);
    expect(cloakingShips.every((ship) => ship.actions.length === 3)).toBe(true);
  });

  it("retains the populated workbook's readable icon tokens in canonical rules text", () => {
    const nonShipCards = [
      ...starter2017Captains,
      ...starter2017Admirals,
      ...starter2017Upgrades,
    ];
    const picard = starter2017Captains.find((card) => card.legacyId === "Cap818")!;

    expect(nonShipCards.every((card) => Boolean(card.rulesSummary))).toBe(true);
    expect(picard.rulesSummary).toContain("[time]");
    expect(picard.rulesSummary).toContain("[battlestations]");
  });

  it("records an attack value for every Weapon upgrade", () => {
    const weaponAttacks = Object.fromEntries(starter2017Upgrades
      .filter((card) => card.type === "weapon")
      .map((card) => [card.name, card.attack]));

    expect(weaponAttacks).toEqual({
      "Photon Torpedoes": "special",
      "Tactical Station": "special",
      "Disruptor Cannon": 5,
      "Torpedo Fusillade": "special",
    });
  });

  it("records supplied Photon Torpedoes firing-arc restrictions", () => {
    const photonTorpedoes = starter2017Upgrades.find((card) => card.legacyId === "W204")!;

    expect(photonTorpedoes.restrictions).toEqual([
      { kind: "firing-arc", arc: "primary" },
      { kind: "firing-arc", arc: "auxiliary" },
    ]);
    expect(starter2017Upgrades
      .filter((card) => card.id !== photonTorpedoes.id)
      .every((card) => card.restrictions === undefined)).toBe(true);
  });

  it("filters by faction and type without UI logic", () => {
    const klingonShips = filterCatalog(starter2017Cards, {
      query: "",
      faction: "klingon",
      type: "ship",
    });

    expect(klingonShips).toHaveLength(4);
  });
  it("models alternate playable faces without duplicating physical-card identity", () => {
    const lursa = starter2017Cards.find((card) => card.legacyId === "Cap445")!;
    const betor = starter2017Cards.find((card) => card.legacyId === "Cap444")!;
    const captainKmpec = starter2017Cards.find((card) => card.legacyId === "Cap543")!;
    const admiralKmpec = starter2017Cards.find((card) => card.legacyId === "A031")!;

    expect(lursa.physicalCardId).toBe(betor.physicalCardId);
    expect(lursa.alternateFaceId).toBe(betor.id);
    expect(captainKmpec.physicalCardId).toBe(admiralKmpec.physicalCardId);
    expect(captainKmpec.alternateFaceId).toBe(admiralKmpec.id);
  });

});
