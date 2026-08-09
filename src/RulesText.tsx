export const rulesGlyphs = {
  time: "&",
  hit: "a",
  crit: "z",
  blank: "7",
  aux: "x",
  battlestations: "b",
  cloak: "c",
  crew: "P",
  tech: "E",
  weapon: "W",
  "target-lock": "i",
  evade: "e",
  scan: "s",
  talent: "!",
} as const;

export type RulesIconToken = keyof typeof rulesGlyphs;

export type RulesTextPart =
  | { kind: "text"; value: string }
  | { kind: "icon"; token: RulesIconToken; glyph: string };

const bracketedToken = /\[([a-z0-9-]+)\]/gi;

export function parseRulesText(text: string): RulesTextPart[] {
  const parts: RulesTextPart[] = [];
  let cursor = 0;
  const pushText = (value: string) => {
    if (!value) return;
    const previous = parts.at(-1);
    if (previous?.kind === "text") previous.value += value;
    else parts.push({ kind: "text", value });
  };

  for (const match of text.matchAll(bracketedToken)) {
    const index = match.index ?? 0;
    if (index > cursor) pushText(text.slice(cursor, index));

    const token = match[1].toLowerCase();
    if (token in rulesGlyphs) {
      const typedToken = token as RulesIconToken;
      parts.push({ kind: "icon", token: typedToken, glyph: rulesGlyphs[typedToken] });
    } else {
      pushText(match[0]);
    }
    cursor = index + match[0].length;
  }

  if (cursor < text.length) pushText(text.slice(cursor));
  return parts;
}

function tokenLabel(token: RulesIconToken): string {
  return `${token.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")} symbol`;
}

export function RulesText({ text }: { text: string }) {
  return (
    <>
      {parseRulesText(text).map((part, index) => part.kind === "text"
        ? part.value
        : (
          <span
            className="rulesGlyph"
            data-rules-token={part.token}
            role="img"
            aria-label={tokenLabel(part.token)}
            key={`${part.token}-${index}`}
          >
            {part.glyph}
          </span>
        ))}
    </>
  );
}
