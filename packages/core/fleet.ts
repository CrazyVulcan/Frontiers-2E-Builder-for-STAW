import type {
  CaptainCard,
  FleetFileV1,
  FleetShipV1,
  GameCard,
  ShipCard,
  UpgradeCard,
  UpgradeType,
} from "../schema/entities";

export interface FleetCardIndex {
  cardsById: ReadonlyMap<string, GameCard>;
  shipsById: ReadonlyMap<string, ShipCard>;
  captainsById: ReadonlyMap<string, CaptainCard>;
  upgradesById: ReadonlyMap<string, UpgradeCard>;
}

export interface CardCostBreakdown {
  base: number;
  factionPenalty: number;
  total: number;
}

export interface FleetCostBreakdown {
  ships: number;
  captains: number;
  upgrades: number;
  factionPenalties: number;
  total: number;
}

export type FleetRuleIssueCode =
  | "duplicate-instance-id"
  | "missing-ship"
  | "missing-captain"
  | "missing-upgrade"
  | "unique-card-repeated"
  | "upgrade-slot-overflow";

export interface FleetRuleIssue {
  code: FleetRuleIssueCode;
  message: string;
  shipInstanceId?: string;
  cardId?: string;
}

export interface EquipCheck {
  allowed: boolean;
  reason?: string;
}

const upgradeTypes: UpgradeType[] = ["crew", "tech", "weapon", "talent"];

export function createFleetCardIndex(cards: GameCard[]): FleetCardIndex {
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  return {
    cardsById,
    shipsById: new Map(
      cards.filter((card): card is ShipCard => card.type === "ship").map((card) => [card.id, card]),
    ),
    captainsById: new Map(
      cards
        .filter((card): card is CaptainCard => card.type === "captain")
        .map((card) => [card.id, card]),
    ),
    upgradesById: new Map(
      cards
        .filter(
          (card): card is UpgradeCard =>
            card.type === "crew" ||
            card.type === "tech" ||
            card.type === "weapon" ||
            card.type === "talent",
        )
        .map((card) => [card.id, card]),
    ),
  };
}

export function createEmptyFleet(name = "Untitled Fleet"): FleetFileV1 {
  return {
    formatVersion: 1,
    name,
    ships: [],
  };
}

export function addShip(
  fleet: FleetFileV1,
  ship: ShipCard,
  instanceId: string,
): FleetFileV1 {
  return {
    ...fleet,
    ships: [
      ...fleet.ships,
      {
        instanceId,
        shipId: ship.id,
        upgradeIds: [],
      },
    ],
  };
}

export function removeShip(fleet: FleetFileV1, instanceId: string): FleetFileV1 {
  return {
    ...fleet,
    ships: fleet.ships.filter((ship) => ship.instanceId !== instanceId),
  };
}

export function renameFleet(fleet: FleetFileV1, name: string): FleetFileV1 {
  return {
    ...fleet,
    name,
  };
}

export function assignCaptain(
  fleet: FleetFileV1,
  instanceId: string,
  captainId: string | undefined,
): FleetFileV1 {
  return updateFleetShip(fleet, instanceId, (entry) => ({
    ...entry,
    captainId,
  }));
}

export function equipUpgrade(
  fleet: FleetFileV1,
  instanceId: string,
  upgradeId: string,
): FleetFileV1 {
  return updateFleetShip(fleet, instanceId, (entry) => ({
    ...entry,
    upgradeIds: [...entry.upgradeIds, upgradeId],
  }));
}

export function removeUpgrade(
  fleet: FleetFileV1,
  instanceId: string,
  upgradeIndex: number,
): FleetFileV1 {
  return updateFleetShip(fleet, instanceId, (entry) => ({
    ...entry,
    upgradeIds: entry.upgradeIds.filter((_, index) => index !== upgradeIndex),
  }));
}

export function calculateBaseFleetCost(
  fleet: FleetFileV1,
  shipsById: ReadonlyMap<string, ShipCard>,
): number {
  return fleet.ships.reduce((total, entry) => {
    const ship = shipsById.get(entry.shipId);
    return total + (ship?.cost ?? 0);
  }, 0);
}

export function calculateCardCostForShip(
  ship: ShipCard,
  card: CaptainCard | UpgradeCard,
): CardCostBreakdown {
  const base = card.type === "weapon" && card.costMode === "primary-weapon"
    ? ship.attack
    : (card.cost ?? 0);
  const sharesFaction = card.factions.some((faction) => ship.factions.includes(faction));
  const factionPenalty = sharesFaction || (card.type === "captain" && base === 0) ? 0 : 1;

  return {
    base,
    factionPenalty,
    total: base + factionPenalty,
  };
}

export function calculateFleetCostBreakdown(
  fleet: FleetFileV1,
  index: FleetCardIndex,
): FleetCostBreakdown {
  let ships = 0;
  let captains = 0;
  let upgrades = 0;
  let factionPenalties = 0;

  for (const entry of fleet.ships) {
    const ship = index.shipsById.get(entry.shipId);
    if (!ship) continue;

    ships += ship.cost ?? 0;

    if (entry.captainId) {
      const captain = index.captainsById.get(entry.captainId);
      if (captain) {
        const cost = calculateCardCostForShip(ship, captain);
        captains += cost.base;
        factionPenalties += cost.factionPenalty;
      }
    }

    for (const upgradeId of entry.upgradeIds) {
      const upgrade = index.upgradesById.get(upgradeId);
      if (!upgrade) continue;

      const cost = calculateCardCostForShip(ship, upgrade);
      upgrades += cost.base;
      factionPenalties += cost.factionPenalty;
    }
  }

  return {
    ships,
    captains,
    upgrades,
    factionPenalties,
    total: ships + captains + upgrades + factionPenalties,
  };
}

export function calculateFleetCost(fleet: FleetFileV1, index: FleetCardIndex): number {
  return calculateFleetCostBreakdown(fleet, index).total;
}

export function getUpgradeSlotCapacity(
  ship: ShipCard,
  captain?: CaptainCard,
): Record<UpgradeType, number> {
  const capacity: Record<UpgradeType, number> = {
    crew: 0,
    tech: 0,
    weapon: 0,
    talent: captain?.talentSlots ?? 0,
  };

  for (const slot of ship.upgradeSlots) {
    capacity[slot] += 1;
  }

  return capacity;
}

export function getUsedUpgradeSlots(
  entry: FleetShipV1,
  upgradesById: ReadonlyMap<string, UpgradeCard>,
): Record<UpgradeType, number> {
  const used: Record<UpgradeType, number> = { crew: 0, tech: 0, weapon: 0, talent: 0 };

  for (const upgradeId of entry.upgradeIds) {
    const upgrade = upgradesById.get(upgradeId);
    if (upgrade) used[upgrade.type] += 1;
  }

  return used;
}

export function canAssignCaptain(
  fleet: FleetFileV1,
  shipInstanceId: string,
  captain: CaptainCard,
): EquipCheck {
  if (!fleet.ships.some((entry) => entry.instanceId === shipInstanceId)) {
    return { allowed: false, reason: "Ship instance not found." };
  }

  const usedElsewhere = captain.unique && fleet.ships.some(
    (entry) => entry.instanceId !== shipInstanceId && entry.captainId === captain.id,
  );

  return usedElsewhere
    ? { allowed: false, reason: `${captain.name} is unique and is already assigned.` }
    : { allowed: true };
}

export function canAddShip(fleet: FleetFileV1, ship: ShipCard): EquipCheck {
  const alreadyIncluded = ship.unique && fleet.ships.some((entry) => entry.shipId === ship.id);

  return alreadyIncluded
    ? { allowed: false, reason: `${ship.name} is unique and is already in the fleet.` }
    : { allowed: true };
}

export function canEquipUpgrade(
  fleet: FleetFileV1,
  shipInstanceId: string,
  upgrade: UpgradeCard,
  index: FleetCardIndex,
): EquipCheck {
  const entry = fleet.ships.find((candidate) => candidate.instanceId === shipInstanceId);
  if (!entry) return { allowed: false, reason: "Ship instance not found." };

  const ship = index.shipsById.get(entry.shipId);
  if (!ship) return { allowed: false, reason: "Ship card not found." };

  if (upgrade.unique) {
    const alreadyEquipped = fleet.ships.some((candidate) => candidate.upgradeIds.includes(upgrade.id));
    if (alreadyEquipped) {
      return { allowed: false, reason: `${upgrade.name} is unique and is already equipped.` };
    }
  }

  const captain = entry.captainId ? index.captainsById.get(entry.captainId) : undefined;
  const capacity = getUpgradeSlotCapacity(ship, captain);
  const used = getUsedUpgradeSlots(entry, index.upgradesById);

  return used[upgrade.type] < capacity[upgrade.type]
    ? { allowed: true }
    : { allowed: false, reason: `No open ${upgrade.type} slot on ${ship.name}.` };
}

export function validateFleet(fleet: FleetFileV1, index: FleetCardIndex): FleetRuleIssue[] {
  const issues: FleetRuleIssue[] = [];
  const instanceIds = new Set<string>();
  const uniqueCardUsage = new Map<string, number>();

  for (const entry of fleet.ships) {
    if (instanceIds.has(entry.instanceId)) {
      issues.push({
        code: "duplicate-instance-id",
        message: `Fleet ship instance ID ${entry.instanceId} is duplicated.`,
        shipInstanceId: entry.instanceId,
      });
    }
    instanceIds.add(entry.instanceId);

    const ship = index.shipsById.get(entry.shipId);
    if (!ship) {
      issues.push({
        code: "missing-ship",
        message: `Ship card ${entry.shipId} is not in the catalog.`,
        shipInstanceId: entry.instanceId,
        cardId: entry.shipId,
      });
      continue;
    }
    if (ship.unique) incrementUsage(uniqueCardUsage, ship.id);

    const captain = entry.captainId ? index.captainsById.get(entry.captainId) : undefined;
    if (entry.captainId && !captain) {
      issues.push({
        code: "missing-captain",
        message: `Captain card ${entry.captainId} is not in the catalog.`,
        shipInstanceId: entry.instanceId,
        cardId: entry.captainId,
      });
    }
    if (captain?.unique) incrementUsage(uniqueCardUsage, captain.id);

    const capacity = getUpgradeSlotCapacity(ship, captain);
    const used = getUsedUpgradeSlots(entry, index.upgradesById);

    for (const upgradeId of entry.upgradeIds) {
      const upgrade = index.upgradesById.get(upgradeId);
      if (!upgrade) {
        issues.push({
          code: "missing-upgrade",
          message: `Upgrade card ${upgradeId} is not in the catalog.`,
          shipInstanceId: entry.instanceId,
          cardId: upgradeId,
        });
      } else if (upgrade.unique) {
        incrementUsage(uniqueCardUsage, upgrade.id);
      }
    }

    for (const type of upgradeTypes) {
      if (used[type] > capacity[type]) {
        issues.push({
          code: "upgrade-slot-overflow",
          message: `${ship.name} uses ${used[type]} ${type} upgrades but has ${capacity[type]} slots.`,
          shipInstanceId: entry.instanceId,
        });
      }
    }
  }

  for (const [cardId, count] of uniqueCardUsage) {
    if (count <= 1) continue;
    const card = index.cardsById.get(cardId);
    issues.push({
      code: "unique-card-repeated",
      message: `${card?.name ?? cardId} is unique but appears ${count} times.`,
      cardId,
    });
  }

  return issues;
}

export function serializeFleet(fleet: FleetFileV1): string {
  return JSON.stringify(fleet, null, 2);
}

function updateFleetShip(
  fleet: FleetFileV1,
  instanceId: string,
  update: (entry: FleetShipV1) => FleetShipV1,
): FleetFileV1 {
  return {
    ...fleet,
    ships: fleet.ships.map((entry) => (entry.instanceId === instanceId ? update(entry) : entry)),
  };
}

function incrementUsage(usage: Map<string, number>, cardId: string) {
  usage.set(cardId, (usage.get(cardId) ?? 0) + 1);
}
