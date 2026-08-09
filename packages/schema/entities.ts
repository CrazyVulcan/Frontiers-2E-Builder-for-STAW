export type FactionId = "federation" | "klingon";

export type CardType =
  | "ship"
  | "captain"
  | "admiral"
  | "crew"
  | "tech"
  | "weapon"
  | "talent";

export type UpgradeType = Extract<CardType, "crew" | "tech" | "weapon" | "talent">;

export type UniquenessRestriction =
  | "fleet-unique"
  | "ship-unique"
  | "mirror-universe-unique";

export type UpgradeKeyword = "ordnance";

export type ActionId =
  | "evade"
  | "target-lock"
  | "scan"
  | "battlestations"
  | "cloak";

export interface BaseCard {
  id: string;
  legacyId: string;
  legacySetId: "2017core";
  type: CardType;
  name: string;
  factions: FactionId[];
  cost: number | null;
  unique: boolean;
  uniquenessRestrictions?: UniquenessRestriction[];
  image?: string;
  /** Rules copy may contain semantic icon tokens such as `[time]` or `[hit]`. */
  rulesSummary?: string;

  /**
   * Optional identity for a single physical card that exposes more than one
   * playable face/record. This keeps printing/collection identity separate
   * from rules identity.
   */
  physicalCardId?: string;
  alternateFaceId?: string;
}

export interface ShipCard extends BaseCard {
  type: "ship";
  className: string;
  /** Presentation asset for the ship-class silhouette printed beside the class name. */
  classIcon?: string;
  attack: number;
  agility: number;
  hull: number;
  shields: number;
  /** Maximum upgrade SP that may be equipped to this ship. */
  upgradeSpLimit?: number;
  /** Auxiliary Power tokens tolerated before the ship loses its action. */
  auxiliaryPowerReserve?: number;
  actions: ActionId[];
  upgradeSlots: UpgradeType[];
  generic: boolean;
}

export interface CaptainCard extends BaseCard {
  type: "captain";
  skill: number;
  talentSlots: number;
  range?: string;
}

export interface AdmiralCard extends BaseCard {
  type: "admiral";
  skill: number;
  talentSlots: number;
  range?: string;
}

export interface UpgradeCard extends BaseCard {
  type: UpgradeType;
  attack?: number;
  range?: string;
  arc?: "front" | "rear" | "front-and-rear";
  costMode?: "fixed" | "primary-weapon";
  keywords?: UpgradeKeyword[];
  grantsTalentSlots?: number;
}

export type GameCard = ShipCard | CaptainCard | AdmiralCard | UpgradeCard;

export interface GameSet {
  id: string;
  legacyId: "2017core";
  name: string;
  releaseDate: string;
  parentSet: "Core";
  factions: FactionId[];
}

export interface FleetShipV1 {
  instanceId: string;
  shipId: string;
  captainId?: string;
  upgradeIds: string[];
}

export interface FleetFileV1 {
  formatVersion: 1;
  name: string;
  ships: FleetShipV1[];
}
