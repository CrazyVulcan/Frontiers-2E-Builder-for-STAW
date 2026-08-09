import { describe, expect, it } from "vitest";
import { parseRulesText, rulesGlyphs } from "./RulesText";

describe("rules text tokens", () => {
  it("converts known bracketed terms into STAW font glyphs", () => {
    expect(parseRulesText("Place 2 [time] Tokens and convert [hit] into [crit]."))
      .toEqual([
        { kind: "text", value: "Place 2 " },
        { kind: "icon", token: "time", glyph: rulesGlyphs.time },
        { kind: "text", value: " Tokens and convert " },
        { kind: "icon", token: "hit", glyph: rulesGlyphs.hit },
        { kind: "text", value: " into " },
        { kind: "icon", token: "crit", glyph: rulesGlyphs.crit },
        { kind: "text", value: "." },
      ]);
  });

  it("preserves unknown bracketed terms as readable text", () => {
    expect(parseRulesText("Keep [future-token] visible."))
      .toEqual([{ kind: "text", value: "Keep [future-token] visible." }]);
  });

  it("supports every token used by the populated starter workbook", () => {
    expect(Object.keys(rulesGlyphs).sort()).toEqual([
      "aux",
      "battlestations",
      "blank",
      "cloak",
      "crew",
      "crit",
      "evade",
      "hit",
      "scan",
      "talent",
      "target-lock",
      "tech",
      "time",
      "weapon",
    ]);
  });
});
