import type { CardType, FactionId, GameCard } from "../schema/entities";

export type CatalogTypeFilter = "all" | CardType;
export type CatalogFactionFilter = "all" | FactionId;

export interface CatalogFilters {
  query: string;
  faction: CatalogFactionFilter;
  type: CatalogTypeFilter;
}

export function filterCatalog(cards: GameCard[], filters: CatalogFilters): GameCard[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return cards.filter((card) => {
    if (filters.faction !== "all" && !card.factions.includes(filters.faction)) {
      return false;
    }

    if (filters.type !== "all" && card.type !== filters.type) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchable = [
      card.name,
      card.type,
      card.legacyId,
      "className" in card ? card.className : "",
      ...card.factions,
    ]
      .join(" ")
      .toLocaleLowerCase();

    return searchable.includes(query);
  });
}
