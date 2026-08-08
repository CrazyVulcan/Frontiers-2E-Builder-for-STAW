import type { ActionId, FactionId } from "../packages/schema/entities";

export type GameIconName =
  | "faction-federation"
  | "faction-klingon"
  | "stat-attack"
  | "stat-agility"
  | "stat-hull"
  | "stat-shield"
  | "stat-primary-weapon"
  | "card-captain"
  | "card-admiral"
  | "upgrade-talent"
  | "unique"
  | "one-per"
  | "keyword-ordnance"
  | "action-evade"
  | "action-target-lock"
  | "action-scan"
  | "action-battlestations"
  | "action-cloak"
  | "range";

const actionIcons: Partial<Record<ActionId, GameIconName>> = {
  evade: "action-evade",
  "target-lock": "action-target-lock",
  scan: "action-scan",
  battlestations: "action-battlestations",
  cloak: "action-cloak",
};

export function factionIconName(faction: FactionId): GameIconName {
  return faction === "federation" ? "faction-federation" : "faction-klingon";
}

export function actionIconName(action: ActionId): GameIconName | undefined {
  return actionIcons[action];
}

export function GameIcon({
  name,
  className = "",
  label,
}: {
  name: GameIconName;
  className?: string;
  label?: string;
}) {
  return (
    <img
      className={`gameIcon ${className}`.trim()}
      src={`./icons/2e/${name}.${name === "range" ? "svg" : "png"}`}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      draggable={false}
    />
  );
}
