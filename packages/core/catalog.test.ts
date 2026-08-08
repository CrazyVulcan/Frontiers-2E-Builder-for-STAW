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
