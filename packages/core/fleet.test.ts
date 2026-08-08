import { describe, expect, it } from "vitest";
import {
  starter2017Cards,
  starter2017Captains,
  starter2017Ships,
  starter2017Upgrades,
} from "../data/starter2017";
import {
  addShip,
  assignCaptain,
  calculateBaseFleetCost,
  calculateFleetCostBreakdown,
  canAddShip,
  canAssignCaptain,
  canEquipUpgrade,
  createEmptyFleet,
  createFleetCardIndex,
  equipUpgrade,
  getUpgradeSlotCapacity,
  placeCardInFleet,
  removeUpgrade,
  validateFleet,
} from "./fleet";

const index = createFleetCardIndex(starter2017Cards);

function cardByLegacyId<T extends { legacyId: string }>(cards: T[], legacyId: string): T {
  return cards.find((card) => card.legacyId === legacyId)!;
}

describe("fleet core", () => {
  it("creates versioned fleet files", () => {
    expect(createEmptyFleet().formatVersion).toBe(1);
  });

  it("calculates base ship SP without React", () => {
    const enterprise = cardByLegacyId(starter2017Ships, "S274");
    const vorn = cardByLegacyId(starter2017Ships, "S268");

    let fleet = createEmptyFleet();
    fleet = addShip(fleet, enterprise, "one");
    fleet = addShip(fleet, vorn, "two");

    const byId = new Map(starter2017Ships.map((ship) => [ship.id, ship]));

    expect(calculateBaseFleetCost(fleet, byId)).toBe(50);
  });

  it("assigns captains and equips upgrades as immutable fleet operations", () => {
    const enterprise = cardByLegacyId(starter2017Ships, "S274");
    const picard = cardByLegacyId(starter2017Captains, "Cap818");
    const photonTorpedoes = cardByLegacyId(starter2017Upgrades, "W204");
    const original = addShip(createEmptyFleet(), enterprise, "enterprise");

    let fleet = assignCaptain(original, "enterprise", picard.id);
    fleet = equipUpgrade(fleet, "enterprise", photonTorpedoes.id);

    expect(original.ships[0].captainId).toBeUndefined();
    expect(fleet.ships[0]).toMatchObject({
      captainId: picard.id,
      upgradeIds: [photonTorpedoes.id],
    });

    expect(removeUpgrade(fleet, "enterprise", 0).ships[0].upgradeIds).toEqual([]);
  });

  it("derives talent slots from the assigned captain", () => {
    const enterprise = cardByLegacyId(starter2017Ships, "S274");
    const picard = cardByLegacyId(starter2017Captains, "Cap818");

    expect(getUpgradeSlotCapacity(enterprise, picard)).toEqual({
      crew: 3,
      tech: 1,
      weapon: 1,
      talent: 2,
    });
  });

  it("checks slot capacity and fleet-wide uniqueness in core", () => {
    const enterprise = cardByLegacyId(starter2017Ships, "S274");
    const sutherland = cardByLegacyId(starter2017Ships, "S272");
    const picard = cardByLegacyId(starter2017Captains, "Cap818");
    const makeItSo = cardByLegacyId(starter2017Upgrades, "E175");

    let fleet = addShip(createEmptyFleet(), enterprise, "enterprise");
    fleet = addShip(fleet, sutherland, "sutherland");

    expect(canEquipUpgrade(fleet, "enterprise", makeItSo, index)).toMatchObject({
      allowed: false,
      reason: "No open talent slot on U.S.S. Enterprise-D.",
    });

    fleet = assignCaptain(fleet, "enterprise", picard.id);
    expect(canEquipUpgrade(fleet, "enterprise", makeItSo, index).allowed).toBe(true);

    fleet = equipUpgrade(fleet, "enterprise", makeItSo.id);
    expect(canEquipUpgrade(fleet, "sutherland", makeItSo, index).allowed).toBe(false);
    expect(canAssignCaptain(fleet, "sutherland", picard).allowed).toBe(false);
    expect(canAddShip(fleet, enterprise).allowed).toBe(false);
  });

  it("calculates loadout costs, faction penalties, and variable weapon costs", () => {
    const enterprise = cardByLegacyId(starter2017Ships, "S274");
    const duras = cardByLegacyId(starter2017Captains, "Cap656");
    const torpedoFusillade = cardByLegacyId(starter2017Upgrades, "W167");
    const photonTorpedoes = cardByLegacyId(starter2017Upgrades, "W204");

    let fleet = addShip(createEmptyFleet(), enterprise, "enterprise");
    fleet = assignCaptain(fleet, "enterprise", duras.id);
    fleet = equipUpgrade(fleet, "enterprise", torpedoFusillade.id);
    fleet = equipUpgrade(fleet, "enterprise", photonTorpedoes.id);

    expect(calculateFleetCostBreakdown(fleet, index)).toEqual({
      ships: 26,
      captains: 5,
      upgrades: 6,
      factionPenalties: 2,
      total: 39,
    });
  });

  it("reports invalid imported fleet structures", () => {
    const enterprise = cardByLegacyId(starter2017Ships, "S274");
    const picard = cardByLegacyId(starter2017Captains, "Cap818");
    const makeItSo = cardByLegacyId(starter2017Upgrades, "E175");

    let fleet = addShip(createEmptyFleet(), enterprise, "one");
    fleet = addShip(fleet, enterprise, "two");
    fleet = assignCaptain(fleet, "one", picard.id);
    fleet = assignCaptain(fleet, "two", picard.id);
    fleet = equipUpgrade(fleet, "one", makeItSo.id);
    fleet = equipUpgrade(fleet, "one", makeItSo.id);
    fleet = equipUpgrade(fleet, "one", makeItSo.id);

    const codes = validateFleet(fleet, index).map((issue) => issue.code);

    expect(codes).toContain("unique-card-repeated");
    expect(codes).toContain("upgrade-slot-overflow");
  });

  it("routes drag-and-drop placement through the core rules engine", () => {
    const enterprise = cardByLegacyId(starter2017Ships, "S274");
    const picard = cardByLegacyId(starter2017Captains, "Cap818");
    const makeItSo = cardByLegacyId(starter2017Upgrades, "E175");
    let fleet = createEmptyFleet();

    const shipDrop = placeCardInFleet(
      fleet,
      enterprise.id,
      { kind: "fleet", newInstanceId: "enterprise" },
      index,
    );
    expect(shipDrop.placed).toBe(true);
    fleet = shipDrop.fleet;

    const captainDrop = placeCardInFleet(
      fleet,
      picard.id,
      { kind: "ship", shipInstanceId: "enterprise" },
      index,
    );
    expect(captainDrop.placed).toBe(true);
    fleet = captainDrop.fleet;

    const upgradeDrop = placeCardInFleet(
      fleet,
      makeItSo.id,
      { kind: "ship", shipInstanceId: "enterprise" },
      index,
    );

    expect(upgradeDrop.placed).toBe(true);
    expect(upgradeDrop.fleet.ships[0]).toMatchObject({
      captainId: picard.id,
      upgradeIds: [makeItSo.id],
    });
  });

  it("rejects card drops on the wrong target without mutating the fleet", () => {
    const picard = cardByLegacyId(starter2017Captains, "Cap818");
    const fleet = createEmptyFleet();

    const result = placeCardInFleet(
      fleet,
      picard.id,
      { kind: "fleet", newInstanceId: "not-used" },
      index,
    );

    expect(result.placed).toBe(false);
    expect(result.fleet).toBe(fleet);
    expect(result.message).toContain("onto a ship");
  });
});
