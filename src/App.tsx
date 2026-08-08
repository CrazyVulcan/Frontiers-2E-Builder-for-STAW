import { useMemo, useState } from "react";
import {
  starter2017Captains,
  starter2017Cards,
  starter2017Set,
  starter2017Ships,
  starter2017Upgrades,
} from "../packages/data/starter2017";
import {
  filterCatalog,
  type CatalogFactionFilter,
  type CatalogTypeFilter,
} from "../packages/core/catalog";
import {
  addShip,
  assignCaptain,
  calculateCardCostForShip,
  calculateFleetCostBreakdown,
  canAddShip,
  canAssignCaptain,
  canEquipUpgrade,
  createEmptyFleet,
  createFleetCardIndex,
  equipUpgrade,
  getUpgradeSlotCapacity,
  getUsedUpgradeSlots,
  removeShip,
  removeUpgrade,
  renameFleet,
  serializeFleet,
  validateFleet,
} from "../packages/core/fleet";
import type {
  FleetFileV1,
  FleetShipV1,
  GameCard,
  ShipCard,
  UpgradeType,
} from "../packages/schema/entities";

const typeFilters: CatalogTypeFilter[] = [
  "all",
  "ship",
  "captain",
  "admiral",
  "crew",
  "tech",
  "weapon",
  "talent",
];

const factionFilters: CatalogFactionFilter[] = ["all", "federation", "klingon"];
const upgradeTypes: UpgradeType[] = ["crew", "tech", "weapon", "talent"];
const fleetCardIndex = createFleetCardIndex(starter2017Cards);

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function CardStats({ card }: { card: GameCard }) {
  if (card.type === "ship") {
    return (
      <div className="stats" aria-label="Ship stats">
        <span><b>{card.attack}</b> ATK</span>
        <span><b>{card.agility}</b> AGI</span>
        <span><b>{card.hull}</b> HULL</span>
        <span><b>{card.shields}</b> SHD</span>
      </div>
    );
  }

  if (card.type === "captain" || card.type === "admiral") {
    return (
      <div className="stats" aria-label="Command stats">
        <span><b>{card.skill}</b> SKILL</span>
        <span><b>{card.talentSlots}</b> TALENT</span>
      </div>
    );
  }

  if (card.type === "weapon" && card.attack) {
    return (
      <div className="stats" aria-label="Weapon stats">
        <span><b>{card.attack}</b> ATK</span>
        {card.range && <span><b>{card.range}</b> RANGE</span>}
      </div>
    );
  }

  return null;
}

function CatalogCard({
  card,
  fleet,
  onAddShip,
}: {
  card: GameCard;
  fleet: FleetFileV1;
  onAddShip: (ship: ShipCard) => void;
}) {
  const faction = card.factions[0];
  const addCheck = card.type === "ship" ? canAddShip(fleet, card) : undefined;

  return (
    <article className={`catalogCard faction-${faction}`}>
      <div className="catalogMeta">
        <span className="typeBadge">{titleCase(card.type)}</span>
        <span>{card.legacyId}</span>
      </div>

      <div className="cardTitleRow">
        <div>
          <h3>{card.name}</h3>
          {card.type === "ship" && (
            <p className="subline">
              {card.className} · {card.generic ? "Generic ship card" : "Named ship"}
            </p>
          )}
        </div>
        <div className="cost">
          <strong>
            {card.type === "weapon" && card.costMode === "primary-weapon"
              ? "PWV"
              : (card.cost ?? "?")}
          </strong>
          <small>
            {card.type === "weapon" && card.costMode === "primary-weapon" ? "COST" : "SP"}
          </small>
        </div>
      </div>

      <CardStats card={card} />

      {card.type === "ship" && (
        <>
          <div className="slotRow" aria-label="Upgrade slots">
            {card.upgradeSlots.map((slot, index) => (
              <span key={`${slot}-${index}`}>{titleCase(slot)}</span>
            ))}
          </div>
          <div className="actionRow" aria-label="Available actions">
            {card.actions.map((action) => (
              <span key={action}>{titleCase(action)}</span>
            ))}
          </div>
        </>
      )}

      {card.rulesSummary && <p className="rulesSummary">{card.rulesSummary}</p>}

      <div className="catalogFooter">
        <span className="factionName">{titleCase(faction)}</span>
        {card.type === "ship" ? (
          <button
            className="addButton"
            disabled={!addCheck?.allowed}
            title={addCheck?.reason}
            onClick={() => onAddShip(card)}
          >
            {addCheck?.allowed ? "Add to fleet" : "Already in fleet"}
          </button>
        ) : (
          <span className="futureTag">Available in loadouts</span>
        )}
      </div>
    </article>
  );
}

function FleetShipEditor({
  fleet,
  entry,
  expanded,
  onToggle,
  onChange,
}: {
  fleet: FleetFileV1;
  entry: FleetShipV1;
  expanded: boolean;
  onToggle: () => void;
  onChange: (fleet: FleetFileV1) => void;
}) {
  const ship = fleetCardIndex.shipsById.get(entry.shipId);
  if (!ship) return null;

  const captain = entry.captainId
    ? fleetCardIndex.captainsById.get(entry.captainId)
    : undefined;
  const capacity = getUpgradeSlotCapacity(ship, captain);
  const used = getUsedUpgradeSlots(entry, fleetCardIndex.upgradesById);
  const entryCost = calculateFleetCostBreakdown(
    { formatVersion: 1, name: fleet.name, ships: [entry] },
    fleetCardIndex,
  );
  const captainOptions = starter2017Captains.filter(
    (candidate) => candidate.id === entry.captainId || canAssignCaptain(
      fleet,
      entry.instanceId,
      candidate,
    ).allowed,
  );
  const upgradeOptions = starter2017Upgrades.filter((upgrade) =>
    canEquipUpgrade(fleet, entry.instanceId, upgrade, fleetCardIndex).allowed,
  );

  return (
    <article className={`fleetShipCard faction-${ship.factions[0]} ${expanded ? "expanded" : ""}`}>
      <button className="fleetShipSummary" onClick={onToggle} aria-expanded={expanded}>
        <span className="shipChevron">{expanded ? "−" : "+"}</span>
        <span className="fleetShipIdentity">
          <strong>{ship.name}</strong>
          <small>{captain ? `Capt. ${captain.name}` : "Captain unassigned"}</small>
        </span>
        <span className="fleetShipPoints">{entryCost.total}<small> SP</small></span>
      </button>

      {expanded && (
        <div className="loadoutEditor">
          <div className="shipStatLine">
            <span>{ship.className}</span>
            <span>ATK {ship.attack}</span>
            <span>AGI {ship.agility}</span>
            <span>HULL {ship.hull}</span>
            <span>SHD {ship.shields}</span>
          </div>

          <label className="loadoutField">
            <span>CAPTAIN</span>
            <select
              value={entry.captainId ?? ""}
              onChange={(event) => onChange(assignCaptain(
                fleet,
                entry.instanceId,
                event.target.value || undefined,
              ))}
            >
              <option value="">No captain</option>
              {captainOptions.map((candidate) => {
                const cost = calculateCardCostForShip(ship, candidate);
                return (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} · Skill {candidate.skill} · {cost.total} SP
                    {cost.factionPenalty ? " (+1 faction)" : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="slotMeters" aria-label="Loadout slot usage">
            {upgradeTypes.filter((type) => capacity[type] > 0 || used[type] > 0).map((type) => (
              <span key={type} className={used[type] >= capacity[type] ? "slotFull" : ""}>
                {titleCase(type)} {used[type]}/{capacity[type]}
              </span>
            ))}
          </div>

          <label className="loadoutField">
            <span>ADD UPGRADE</span>
            <select
              value=""
              disabled={upgradeOptions.length === 0}
              onChange={(event) => {
                if (!event.target.value) return;
                onChange(equipUpgrade(fleet, entry.instanceId, event.target.value));
              }}
            >
              <option value="">
                {upgradeOptions.length ? "Choose an upgrade…" : "No compatible open slots"}
              </option>
              {upgradeOptions.map((upgrade) => {
                const cost = calculateCardCostForShip(ship, upgrade);
                return (
                  <option key={upgrade.id} value={upgrade.id}>
                    [{upgrade.type.toUpperCase()}] {upgrade.name} · {cost.total} SP
                    {cost.factionPenalty ? " (+1 faction)" : ""}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="equippedList">
            {captain && (
              <div className="equippedCard">
                <span className="loadoutType">CAPT</span>
                <span>
                  <strong>{captain.name}</strong>
                  <small>Skill {captain.skill} · {titleCase(captain.factions[0])}</small>
                </span>
                <span className="loadoutCost">
                  {calculateCardCostForShip(ship, captain).total} SP
                </span>
                <button
                  aria-label={`Remove ${captain.name}`}
                  onClick={() => onChange(assignCaptain(fleet, entry.instanceId, undefined))}
                >×</button>
              </div>
            )}

            {entry.upgradeIds.map((upgradeId, upgradeIndex) => {
              const upgrade = fleetCardIndex.upgradesById.get(upgradeId);
              if (!upgrade) return null;
              const cost = calculateCardCostForShip(ship, upgrade);

              return (
                <div className="equippedCard" key={`${upgradeId}-${upgradeIndex}`}>
                  <span className="loadoutType">{upgrade.type.slice(0, 4).toUpperCase()}</span>
                  <span>
                    <strong>{upgrade.name}</strong>
                    <small>
                      {titleCase(upgrade.factions[0])}
                      {cost.factionPenalty ? " · +1 faction penalty" : ""}
                    </small>
                  </span>
                  <span className="loadoutCost">{cost.total} SP</span>
                  <button
                    aria-label={`Remove ${upgrade.name}`}
                    onClick={() => onChange(removeUpgrade(
                      fleet,
                      entry.instanceId,
                      upgradeIndex,
                    ))}
                  >×</button>
                </div>
              );
            })}

            {!captain && entry.upgradeIds.length === 0 && (
              <p className="emptyLoadout">Assign a captain or fill an open upgrade slot.</p>
            )}
          </div>

          <button
            className="removeShipButton"
            onClick={() => onChange(removeShip(fleet, entry.instanceId))}
          >
            Remove ship from fleet
          </button>
        </div>
      )}
    </article>
  );
}

export function App() {
  const [query, setQuery] = useState("");
  const [faction, setFaction] = useState<CatalogFactionFilter>("all");
  const [type, setType] = useState<CatalogTypeFilter>("all");
  const [fleet, setFleet] = useState(() => createEmptyFleet("First Contact"));
  const [expandedShipId, setExpandedShipId] = useState<string | null>(null);

  const filteredCards = useMemo(
    () => filterCatalog(starter2017Cards, { query, faction, type }),
    [query, faction, type],
  );
  const fleetCost = calculateFleetCostBreakdown(fleet, fleetCardIndex);
  const fleetIssues = validateFleet(fleet, fleetCardIndex);

  function handleAddShip(ship: ShipCard) {
    const instanceId = `${ship.id}-${crypto.randomUUID()}`;
    setFleet((current) => addShip(current, ship, instanceId));
    setExpandedShipId(instanceId);
  }

  function handleFleetChange(nextFleet: FleetFileV1) {
    setFleet(nextFleet);
    if (expandedShipId && !nextFleet.ships.some((entry) => entry.instanceId === expandedShipId)) {
      setExpandedShipId(nextFleet.ships[0]?.instanceId ?? null);
    }
  }

  function downloadFleet() {
    const blob = new Blob([serializeFleet(fleet)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fleet.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "fleet"}.staw.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Frontiers home">
          <span className="brandMark">2E</span>
          <span>
            <strong>FRONTIERS</strong>
            <small>BUILDER FOR STAW</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#builder">Builder</a>
          <a href="#catalog">Card library</a>
          <a href="#about">About</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <div className="eyebrow"><i /> 2017CORE / BUILD 0.3</div>
          <h1>Command your<br /><em>next frontier.</em></h1>
          <p className="lede">
            A fast, open fleet builder for Star Trek: Attack Wing. Start with a ship,
            assemble its command crew, and let the rules engine track every squadron point.
          </p>
          <a className="heroAction" href="#builder">Open the builder <span>↓</span></a>
        </div>

        <div className="setSummary" aria-label="Starter set summary">
          <div className="summaryTitle">
            <span>ACTIVE DATASET</span>
            <strong>{starter2017Set.name}</strong>
          </div>
          <div className="summaryMetric"><strong>36</strong><span>CARDS</span></div>
          <div className="summaryMetric"><strong>2</strong><span>FACTIONS</span></div>
          <div className="summaryMetric"><strong>8</strong><span>SHIPS</span></div>
          <div className="signalLine"><span /><span /><span /><span /><span /></div>
        </div>
      </section>

      <section className="builder" id="builder">
        <div className="builderHeader">
          <div>
            <div className="eyebrow"><i /> FLEET CONSOLE</div>
            <h2>Build the fleet.</h2>
          </div>
          <p>
            Ship slots, captain talent slots, uniqueness, variable weapon costs, and
            cross-faction penalties are calculated in the core rules package.
          </p>
        </div>

        <div className="builderGrid">
          <aside className="fleetConsole">
            <label className="fleetNameField">
              <span>FLEET NAME</span>
              <input
                value={fleet.name}
                onChange={(event) => setFleet((current) => renameFleet(current, event.target.value))}
                aria-label="Fleet name"
              />
            </label>

            <div className="fleetScore">
              <div>
                <strong>{fleetCost.total}</strong>
                <span>SQUADRON POINTS</span>
              </div>
              <div className="fleetCount">
                <strong>{fleet.ships.length}</strong>
                <span>{fleet.ships.length === 1 ? "SHIP" : "SHIPS"}</span>
              </div>
            </div>

            <div className="costBreakdown">
              <span>Ships <b>{fleetCost.ships}</b></span>
              <span>Captains <b>{fleetCost.captains}</b></span>
              <span>Upgrades <b>{fleetCost.upgrades}</b></span>
              <span>Faction <b>+{fleetCost.factionPenalties}</b></span>
            </div>

            {fleetIssues.length > 0 && (
              <div className="issuePanel" role="alert">
                <strong>Fleet needs attention</strong>
                {fleetIssues.map((issue, index) => <span key={`${issue.code}-${index}`}>{issue.message}</span>)}
              </div>
            )}

            <div className="fleetList">
              {fleet.ships.length === 0 ? (
                <div className="emptyFleet">
                  <span className="emptyFleetIcon">+</span>
                  <strong>Your command is empty</strong>
                  <p>Add a ship from the card library, then open it to assign a captain and upgrades.</p>
                </div>
              ) : (
                fleet.ships.map((entry) => (
                  <FleetShipEditor
                    key={entry.instanceId}
                    fleet={fleet}
                    entry={entry}
                    expanded={expandedShipId === entry.instanceId}
                    onToggle={() => setExpandedShipId(
                      expandedShipId === entry.instanceId ? null : entry.instanceId,
                    )}
                    onChange={handleFleetChange}
                  />
                ))
              )}
            </div>

            <div className="fleetActions">
              <button
                className="primaryButton"
                disabled={fleet.ships.length === 0 || fleetIssues.length > 0}
                onClick={downloadFleet}
              >
                Export fleet JSON
              </button>
              <button
                className="quietButton"
                disabled={fleet.ships.length === 0}
                onClick={() => {
                  setFleet(createEmptyFleet("First Contact"));
                  setExpandedShipId(null);
                }}
              >
                Clear fleet
              </button>
            </div>
          </aside>

          <section className="catalogPane" id="catalog">
            <div className="catalogTopline">
              <div>
                <span>CARD LIBRARY</span>
                <strong>{filteredCards.length} / {starter2017Cards.length}</strong>
              </div>
              <button
                className="quietButton"
                onClick={() => {
                  setQuery("");
                  setFaction("all");
                  setType("all");
                }}
              >
                Reset filters
              </button>
            </div>

            <div className="filters">
              <label className="searchField">
                <span>SEARCH DATABASE</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, class, type, legacy ID…"
                />
              </label>

              <div className="filterGroup">
                <span>FACTION</span>
                <div className="segmented">
                  {factionFilters.map((value) => (
                    <button
                      key={value}
                      className={faction === value ? "active" : ""}
                      onClick={() => setFaction(value)}
                    >
                      {titleCase(value)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filterGroup">
                <span>TYPE</span>
                <div className="segmented wrap">
                  {typeFilters.map((value) => (
                    <button
                      key={value}
                      className={type === value ? "active" : ""}
                      onClick={() => setType(value)}
                    >
                      {titleCase(value)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredCards.length ? (
              <div className="cardGrid">
                {filteredCards.map((card) => (
                  <CatalogCard
                    key={card.id}
                    card={card}
                    fleet={fleet}
                    onAddShip={handleAddShip}
                  />
                ))}
              </div>
            ) : (
              <div className="noResults">
                <strong>No matching cards</strong>
                <span>Try a different faction, type, or search term.</span>
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="about" id="about">
        <div>
          <div className="eyebrow"><i /> CLEAN-ROOM FOUNDATION</div>
          <h2>Game data describes the game.<br />Core rules make the decisions.</h2>
        </div>
        <div className="architecture">
          <div><span>01</span><strong>Schema + Data</strong><code>stable IDs · legacy provenance</code></div>
          <div><span>02</span><strong>Rules Core</strong><code>pure functions · validation</code></div>
          <div><span>03</span><strong>Web Builder</strong><code>React · GitHub Pages ready</code></div>
        </div>
      </section>

      <footer>
        <span>FRONTIERS — 2E BUILDER FOR STAW</span>
        <span>Community project · 2017core vertical slice · formatVersion 1</span>
      </footer>
    </main>
  );
}
