import { useMemo, useState, type DragEvent } from "react";
import {
  starter2017Cards,
  starter2017Set,
} from "../packages/data/starter2017";
import {
  filterCatalog,
  type CatalogFactionFilter,
  type CatalogTypeFilter,
} from "../packages/core/catalog";
import {
  assignCaptain,
  calculateCardCostForShip,
  calculateFleetCostBreakdown,
  canAddShip,
  canAssignCaptain,
  canEquipUpgrade,
  createEmptyFleet,
  createFleetCardIndex,
  getUpgradeSlotCapacity,
  getUsedUpgradeSlots,
  placeCardInFleet,
  removeShip,
  removeUpgrade,
  renameFleet,
  serializeFleet,
  validateFleet,
} from "../packages/core/fleet";
import type {
  CaptainCard,
  FleetFileV1,
  FleetShipV1,
  GameCard,
  AdmiralCard,
  ShipCard,
  UpgradeCard,
  UpgradeType,
} from "../packages/schema/entities";
import {
  actionIconName,
  factionIconName,
  GameIcon,
  type GameIconName,
} from "./GameIcon";

const CARD_DRAG_TYPE = "application/x-frontiers-card";
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

function getDraggedCardId(event: DragEvent) {
  return event.dataTransfer.getData(CARD_DRAG_TYPE) || event.dataTransfer.getData("text/plain");
}

function CardArt({ card }: { card: GameCard }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (card.image && !imageFailed) {
    return (
      <img
        src={card.image}
        alt=""
        loading="lazy"
        draggable={false}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="cardArtFallback" aria-hidden="true">
      <span>✦</span>
      <small>{card.type === "ship" ? card.className : "2017CORE ARCHIVE"}</small>
    </div>
  );
}

function LibraryStats({ card }: { card: GameCard }) {
  if (card.type === "ship") {
    return (
      <div className="libraryStats" aria-label="Ship statistics">
        <span className="statAttack" aria-label={`Attack ${card.attack}`}><GameIcon name="stat-attack" /><b>{card.attack}</b></span>
        <span className="statAgility" aria-label={`Agility ${card.agility}`}><GameIcon name="stat-agility" /><b>{card.agility}</b></span>
        <span className="statHull" aria-label={`Hull ${card.hull}`}><GameIcon name="stat-hull" /><b>{card.hull}</b></span>
        <span className="statShield" aria-label={`Shields ${card.shields}`}><GameIcon name="stat-shield" /><b>{card.shields}</b></span>
      </div>
    );
  }

  if (card.type === "captain" || card.type === "admiral") {
    return (
      <div className="libraryStats compactStats">
        <span className="statCommand" aria-label={`Skill ${card.skill}`}><GameIcon name={card.type === "captain" ? "card-captain" : "card-admiral"} /><b>{card.skill}</b></span>
        <span aria-label={`${card.talentSlots} talent slots`}><GameIcon name="upgrade-talent" /><b>{card.talentSlots}</b></span>
      </div>
    );
  }

  if (card.type === "weapon" && card.attack) {
    return (
      <div className="libraryStats compactStats">
        <span className="statAttack" aria-label={`Attack ${card.attack}`}><GameIcon name="stat-attack" /><b>{card.attack}</b></span>
        {card.range && <span aria-label={`Range ${card.range}`}><GameIcon name="range" /><b>{card.range}</b></span>}
      </div>
    );
  }

  return null;
}

function getQuickAction(
  card: GameCard,
  fleet: FleetFileV1,
  selectedShipId: string | null,
) {
  if (card.type === "ship") {
    const check = canAddShip(fleet, card);
    return { enabled: check.allowed, label: check.allowed ? "Add ship" : "In fleet" };
  }

  if (card.type === "admiral") return { enabled: false, label: "Admirals later" };
  if (!selectedShipId) return { enabled: false, label: "Select a ship" };

  if (card.type === "captain") {
    const check = canAssignCaptain(fleet, selectedShipId, card);
    return { enabled: check.allowed, label: check.allowed ? "Assign captain" : "Unavailable" };
  }

  const check = canEquipUpgrade(fleet, selectedShipId, card, fleetCardIndex);
  const blockedLabel = check.reason?.includes("already equipped")
    ? "Already equipped"
    : "No open slot";
  return { enabled: check.allowed, label: check.allowed ? "Equip card" : blockedLabel };
}

type UpgradeFaceCard = CaptainCard | AdmiralCard | UpgradeCard;

function getCardTypeIcon(card: UpgradeFaceCard): GameIconName | undefined {
  if (card.type === "captain") return "card-captain";
  if (card.type === "admiral") return "card-admiral";
  if (card.type === "weapon") return "upgrade-weapon";
  if (card.type === "tech") return "upgrade-tech";
  if (card.type === "crew") return "upgrade-crew";
  if (card.type === "talent") return "upgrade-talent";
  return undefined;
}

function UpgradeCardFace({
  card,
  displayCost,
  variant = "library",
}: {
  card: UpgradeFaceCard;
  displayCost: number | string;
  variant?: "library" | "preview";
}) {
  const faction = card.factions[0];
  const typeIcon = getCardTypeIcon(card);
  const restrictions = card.uniquenessRestrictions
    ?? (card.unique ? ["fleet-unique" as const] : []);
  const talentSlots = card.type === "captain" || card.type === "admiral"
    ? card.talentSlots
    : card.grantsTalentSlots ?? 0;
  const rulesText = card.rulesSummary
    ?? "Card text has not yet been transcribed into the clean-room fixture.";

  return (
    <div
      className={`upgradeCardFace upgradeCardFace-${variant} faction-${faction} card-${card.type}`}
      data-card-type={card.type}
      data-legacy-id={card.legacyId}
    >
      <div className="upgradeCardArt"><CardArt card={card} /></div>
      <div className="upgradeCardFrame">
        <div className="upgradeNameBand">
          <h3>{card.name}</h3>
        </div>

        {!!restrictions.length && (
          <div className="upgradeRestrictionRail" aria-label="Card restrictions">
            {restrictions.map((restriction) => (
              <span key={restriction} aria-label={titleCase(restriction)}>
                {restriction === "fleet-unique" && <GameIcon name="unique" />}
                {restriction === "ship-unique" && <GameIcon name="one-per" />}
                {restriction === "mirror-universe-unique" && <b>MU</b>}
              </span>
            ))}
          </div>
        )}

        <div className="upgradeValueRail" aria-label="Printed card values">
          {(card.type === "captain" || card.type === "admiral") && (
            <span className="upgradeValueBadge skillValue" aria-label={`Skill ${card.skill}`}>
              <strong>{card.skill}</strong>
            </span>
          )}
          {card.type === "weapon" && (card.attack || card.costMode === "primary-weapon") && (
            <span className="upgradeValueBadge attackValue" aria-label={card.attack ? `Attack ${card.attack}` : "Primary weapon value attack"}>
              <GameIcon name={card.attack ? "stat-attack" : "stat-primary-weapon"} />
              <strong>{card.attack ?? "PWV"}</strong>
            </span>
          )}
          {card.type === "weapon" && card.range && (
            <span className="upgradeRangeBadge" aria-label={`Range ${card.range}`}>
              <GameIcon name="range" />
              <strong>{card.range}</strong>
            </span>
          )}
          {card.type !== "captain" && card.type !== "admiral" && card.keywords?.map((keyword) => (
            <span className="upgradeKeywordBadge" key={keyword} aria-label={titleCase(keyword)}>
              {keyword === "ordnance" && <GameIcon name="keyword-ordnance" />}
            </span>
          ))}
        </div>

        <div className="upgradeRulesPanel">
          <strong>{card.type === "captain" || card.type === "admiral" ? "COMMAND ABILITY" : titleCase(card.type)}</strong>
          <p>{rulesText}</p>
        </div>

        <div className="upgradeTypeSeal" aria-label={titleCase(card.type)}>
          {typeIcon
            ? <GameIcon name={typeIcon} />
            : <span>{card.type.slice(0, 1).toUpperCase()}</span>}
        </div>
        {talentSlots > 0 && (
          <div className="upgradeTalentSeal" aria-label={`${talentSlots} talent slot${talentSlots === 1 ? "" : "s"}`}>
            <GameIcon name="upgrade-talent" />
            {talentSlots > 1 && <b>{talentSlots}</b>}
          </div>
        )}
        <div className="upgradeFactionCost">
          <GameIcon name={factionIconName(faction)} label={titleCase(faction)} />
          <strong>{displayCost}</strong>
          <small>SP</small>
        </div>
      </div>
    </div>
  );
}

function LibraryCard({
  card,
  fleet,
  selectedShipId,
  onPlace,
  onDragState,
}: {
  card: GameCard;
  fleet: FleetFileV1;
  selectedShipId: string | null;
  onPlace: (cardId: string, shipInstanceId?: string) => void;
  onDragState: (cardId: string | null) => void;
}) {
  const faction = card.factions[0];
  const quickAction = getQuickAction(card, fleet, selectedShipId);
  const isVariableCost = card.type === "weapon" && card.costMode === "primary-weapon";

  function handleDragStart(event: DragEvent<HTMLElement>) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(CARD_DRAG_TYPE, card.id);
    event.dataTransfer.setData("text/plain", card.id);
    onDragState(card.id);
  }

  return (
    <article
      className={`libraryCard faction-${faction} ${card.type === "ship" ? "shipLibraryCard" : `upgradeLibraryCard card-${card.type}`}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => onDragState(null)}
    >
      <div className="dragHandle"><span>⠿</span> DRAG CARD</div>
      {card.type === "ship" ? (
        <>
          <div className="libraryCardArt"><CardArt card={card} /></div>
          <div className="libraryCardBody">
        <div className="factionSeal" aria-label={titleCase(faction)}>
          <GameIcon name={factionIconName(faction)} />
        </div>
        <div className="libraryCardHeading">
          <span>{titleCase(card.type)} · {card.legacyId}</span>
          <h3>{card.name}</h3>
          {card.type === "ship" && <small>{card.className}</small>}
          {card.unique && <GameIcon name="unique" className="uniqueBadge" label="Unique" />}
        </div>
        <div className="spBadge">
          <strong>{isVariableCost ? "PWV" : (card.cost ?? "?")}</strong>
          <span>{isVariableCost ? "COST" : "SP"}</span>
        </div>

        <LibraryStats card={card} />

        <div className="cardRulesPanel">
          {card.rulesSummary ?? (
            card.type === "ship"
              ? `${card.generic ? "Generic" : "Unique"} ${card.className} ship card.`
              : "Card text has not yet been transcribed into the clean-room fixture."
          )}
        </div>

        <div className="cardIconRails">
            <div className="cardActionRail" aria-label="Ship actions">
              {card.actions.map((action) => {
                const iconName = actionIconName(action);
                return iconName
                  ? <GameIcon key={action} name={iconName} label={titleCase(action)} />
                  : <span key={action}>{action.split("-").map((part) => part[0]).join("").toUpperCase()}</span>;
              })}
            </div>
            <div className="cardSlotRail" aria-label="Upgrade slots">
              {card.upgradeSlots.map((slot, slotIndex) => (
                <span key={`${slot}-${slotIndex}`}>
                  {slot === "talent" ? <GameIcon name="upgrade-talent" label="Talent" /> : slot.slice(0, 1).toUpperCase()}
                </span>
              ))}
            </div>
        </div>

        <button
          className="cardQuickAction"
          disabled={!quickAction.enabled}
          onClick={() => onPlace(card.id, card.type === "ship" ? undefined : selectedShipId ?? undefined)}
        >
          {quickAction.label}
        </button>
          </div>
        </>
      ) : (
        <>
          <UpgradeCardFace
            card={card}
            displayCost={isVariableCost ? "PWV" : (card.cost ?? "?")}
          />
          <button
            className="cardQuickAction upgradeQuickAction"
            disabled={!quickAction.enabled}
            onClick={() => onPlace(card.id, selectedShipId ?? undefined)}
          >
            {quickAction.label}
          </button>
        </>
      )}
    </article>
  );
}

function LoadoutCardRow({
  icon,
  fallbackLabel,
  name,
  meta,
  cost,
  previewCard,
  onRemove,
}: {
  icon?: GameIconName;
  fallbackLabel: string;
  name: string;
  meta: string;
  cost: number;
  previewCard: CaptainCard | UpgradeCard;
  onRemove: () => void;
}) {
  return (
    <div
      className="loadoutCardRow"
      tabIndex={0}
      aria-label={`${name}, ${meta}, ${cost} SP. Hover or focus to preview card.`}
    >
      <span className="loadoutIcon">
        {icon ? <GameIcon name={icon} /> : fallbackLabel}
      </span>
      <span><strong>{name}</strong><small>{meta}</small></span>
      <b>{cost} SP</b>
      <button aria-label={`Remove ${name}`} onClick={onRemove}>×</button>
      <div className="equippedCardPreview" aria-hidden="true">
        <UpgradeCardFace card={previewCard} displayCost={cost} variant="preview" />
      </div>
    </div>
  );
}

function FleetShipBay({
  fleet,
  entry,
  selected,
  dragActive,
  onSelect,
  onDropCard,
  onChange,
  onDropState,
}: {
  fleet: FleetFileV1;
  entry: FleetShipV1;
  selected: boolean;
  dragActive: boolean;
  onSelect: () => void;
  onDropCard: (cardId: string) => void;
  onChange: (fleet: FleetFileV1) => void;
  onDropState: (target: string | null) => void;
}) {
  const ship = fleetCardIndex.shipsById.get(entry.shipId);
  if (!ship) return null;

  const captain = entry.captainId ? fleetCardIndex.captainsById.get(entry.captainId) : undefined;
  const capacity = getUpgradeSlotCapacity(ship, captain);
  const used = getUsedUpgradeSlots(entry, fleetCardIndex.upgradesById);
  const cost = calculateFleetCostBreakdown(
    { formatVersion: 1, name: fleet.name, ships: [entry] },
    fleetCardIndex,
  );

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    const cardId = getDraggedCardId(event);
    if (cardId) onDropCard(cardId);
    onDropState(null);
  }

  return (
    <article
      className={`fleetShipBay faction-${ship.factions[0]} ${selected ? "selected" : ""} ${dragActive ? "dropActive" : ""}`}
      onClick={onSelect}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDropState(entry.instanceId);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={handleDrop}
    >
      <div className="shipBayArt"><CardArt card={ship} /></div>
      <div className="shipBayHeader">
        <span className="shipFactionMark"><GameIcon name={factionIconName(ship.factions[0])} /></span>
        <div><small>{ship.className}</small><h3>{ship.name}</h3></div>
        <div className="shipBayCost"><strong>{cost.total}</strong><span>SP</span></div>
      </div>

      <div className="shipBayStats">
        <span className="statAttack"><GameIcon name="stat-attack" /><b>{ship.attack}</b><small>ATTACK</small></span>
        <span className="statAgility"><GameIcon name="stat-agility" /><b>{ship.agility}</b><small>AGILITY</small></span>
        <span className="statHull"><GameIcon name="stat-hull" /><b>{ship.hull}</b><small>HULL</small></span>
        <span className="statShield"><GameIcon name="stat-shield" /><b>{ship.shields}</b><small>SHIELDS</small></span>
      </div>

      <div className="shipBayDropPrompt">
        <span>{dragActive ? "RELEASE TO ASSIGN" : "DROP CAPTAIN OR UPGRADE HERE"}</span>
        <small>{selected ? "Selected for click-to-equip" : "Click to select this ship"}</small>
      </div>

      <div className="loadoutSlots">
        <div className="slotHeader"><span>COMMAND</span><b>{captain ? "1 / 1" : "0 / 1"}</b></div>
        {captain ? (
          <LoadoutCardRow
            icon="card-captain"
            fallbackLabel="C"
            name={captain.name}
            meta={`Skill ${captain.skill} · ${titleCase(captain.factions[0])}`}
            cost={calculateCardCostForShip(ship, captain).total}
            previewCard={captain}
            onRemove={() => onChange(assignCaptain(fleet, entry.instanceId, undefined))}
          />
        ) : (
          <div className="emptySlot">Drop a Captain card</div>
        )}

        {upgradeTypes.filter((type) => capacity[type] > 0 || used[type] > 0).map((type) => {
          const equipped = entry.upgradeIds
            .map((upgradeId, upgradeIndex) => ({
              upgrade: fleetCardIndex.upgradesById.get(upgradeId),
              upgradeIndex,
            }))
            .filter(({ upgrade }) => upgrade?.type === type);

          return (
            <div className="slotGroup" key={type}>
              <div className="slotHeader">
                <span>{titleCase(type)}</span><b>{used[type]} / {capacity[type]}</b>
              </div>
              {equipped.map(({ upgrade, upgradeIndex }) => upgrade && (
                <LoadoutCardRow
                  key={`${upgrade.id}-${upgradeIndex}`}
                  icon={getCardTypeIcon(upgrade)}
                  fallbackLabel={type.slice(0, 1).toUpperCase()}
                  name={upgrade.name}
                  meta={`${titleCase(upgrade.factions[0])}${calculateCardCostForShip(ship, upgrade).factionPenalty ? " · +1 faction" : ""}`}
                  cost={calculateCardCostForShip(ship, upgrade).total}
                  previewCard={upgrade}
                  onRemove={() => onChange(removeUpgrade(fleet, entry.instanceId, upgradeIndex))}
                />
              ))}
              {used[type] < capacity[type] && (
                <div className="emptySlot">{capacity[type] - used[type]} open {type} slot{capacity[type] - used[type] === 1 ? "" : "s"}</div>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="removeShip"
        onClick={(event) => {
          event.stopPropagation();
          onChange(removeShip(fleet, entry.instanceId));
        }}
      >Remove ship</button>
    </article>
  );
}

export function App() {
  const [query, setQuery] = useState("");
  const [faction, setFaction] = useState<CatalogFactionFilter>("all");
  const [type, setType] = useState<CatalogTypeFilter>("all");
  const [fleet, setFleet] = useState(() => createEmptyFleet("First Contact"));
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const filteredCards = useMemo(
    () => filterCatalog(starter2017Cards, { query, faction, type }),
    [query, faction, type],
  );
  const fleetCost = calculateFleetCostBreakdown(fleet, fleetCardIndex);
  const fleetIssues = validateFleet(fleet, fleetCardIndex);
  const draggedCard = draggedCardId ? fleetCardIndex.cardsById.get(draggedCardId) : undefined;

  function updateFleet(nextFleet: FleetFileV1) {
    setFleet(nextFleet);
    if (selectedShipId && !nextFleet.ships.some((entry) => entry.instanceId === selectedShipId)) {
      setSelectedShipId(nextFleet.ships[0]?.instanceId ?? null);
    }
  }

  function handlePlace(cardId: string, shipInstanceId?: string) {
    const newInstanceId = `${cardId}-${crypto.randomUUID()}`;
    const result = placeCardInFleet(
      fleet,
      cardId,
      shipInstanceId
        ? { kind: "ship", shipInstanceId }
        : { kind: "fleet", newInstanceId },
      fleetCardIndex,
    );

    setFeedback({ success: result.placed, message: result.message });
    setDropTarget(null);
    if (!result.placed) return;

    setFleet(result.fleet);
    if (!shipInstanceId) setSelectedShipId(newInstanceId);
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

  function handleFleetDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const cardId = getDraggedCardId(event);
    if (cardId) handlePlace(cardId);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Frontiers home">
          <span className="brandMark">2E</span>
          <span><strong>FRONTIERS</strong><small>BUILDER FOR STAW</small></span>
        </a>
        <div className="datasetStatus">
          <span>ACTIVE DATASET</span>
          <strong>{starter2017Set.name}</strong>
        </div>
        <button className="exportButton" disabled={!fleet.ships.length || !!fleetIssues.length} onClick={downloadFleet}>
          Export fleet <span>↗</span>
        </button>
      </header>

      <section className="missionHeader" id="top">
        <div><span className="sectionCode">01 / FLEET CONSTRUCTION</span><h1>Assemble your command.</h1></div>
        <p>Drag cards from the library into the fleet. Ships land in open space; captains and upgrades land directly on a ship.</p>
      </section>

      <section className="builderShell">
        <aside className="libraryPane" aria-label="Card library">
          <div className="libraryControls">
            <div className="libraryTitle"><span>CARD LIBRARY</span><b>{filteredCards.length} / {starter2017Cards.length}</b></div>
            <label className="searchField">
              <span>SEARCH</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, class, type, ID…" />
            </label>
            <div className="filterGroup">
              <span>FACTION</span>
              <div className="segmented">
                {factionFilters.map((value) => (
                  <button key={value} className={faction === value ? "active" : ""} onClick={() => setFaction(value)}>
                    {titleCase(value)}
                  </button>
                ))}
              </div>
            </div>
            <div className="filterGroup">
              <span>TYPE</span>
              <div className="segmented wrap">
                {typeFilters.map((value) => (
                  <button key={value} className={type === value ? "active" : ""} onClick={() => setType(value)}>
                    {titleCase(value)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="libraryCardList">
            {filteredCards.map((card) => (
              <LibraryCard
                key={card.id}
                card={card}
                fleet={fleet}
                selectedShipId={selectedShipId}
                onPlace={handlePlace}
                onDragState={(cardId) => {
                  setDraggedCardId(cardId);
                  if (!cardId) setDropTarget(null);
                }}
              />
            ))}
            {!filteredCards.length && <div className="noResults"><strong>No cards found</strong><span>Adjust the filters to continue.</span></div>}
          </div>
        </aside>

        <section className="fleetPane" aria-label="Fleet workspace">
          <div className="fleetToolbar">
            <label><span>FLEET NAME</span><input value={fleet.name} onChange={(event) => setFleet((current) => renameFleet(current, event.target.value))} /></label>
            <div className="fleetTotal"><span>FLEET TOTAL</span><strong>{fleetCost.total}<small> SP</small></strong></div>
            <div className="fleetBreakdown">
              <span>Ships <b>{fleetCost.ships}</b></span>
              <span>Captains <b>{fleetCost.captains}</b></span>
              <span>Upgrades <b>{fleetCost.upgrades}</b></span>
              <span>Faction <b>+{fleetCost.factionPenalties}</b></span>
            </div>
            <button
              className="resetFleet"
              disabled={!fleet.ships.length}
              onClick={() => {
                setFleet(createEmptyFleet("First Contact"));
                setSelectedShipId(null);
                setFeedback(null);
              }}
            >Reset fleet</button>
          </div>

          {feedback && (
            <div className={`placementFeedback ${feedback.success ? "success" : "error"}`} role="status" aria-live="polite">
              <span>{feedback.success ? "✓" : "!"}</span>{feedback.message}
            </div>
          )}
          {!!fleetIssues.length && (
            <div className="issuePanel" role="alert">
              <strong>Fleet needs attention</strong>
              {fleetIssues.map((issue, issueIndex) => <span key={`${issue.code}-${issueIndex}`}>{issue.message}</span>)}
            </div>
          )}

          <div
            className={`fleetDropBay ${dropTarget === "fleet" ? "dropActive" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDropTarget("fleet");
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={handleFleetDrop}
          >
            {fleet.ships.length === 0 ? (
              <div className="emptyFleetDrop">
                <span className="dropGlyph">⌁</span>
                <strong>{draggedCard?.type === "ship" ? `Release ${draggedCard.name}` : "Drag a ship here"}</strong>
                <p>Start a squadron by dragging any Ship card from the library.</p>
              </div>
            ) : (
              <div className="fleetSquadronGrid">
                {fleet.ships.map((entry) => (
                  <FleetShipBay
                    key={entry.instanceId}
                    fleet={fleet}
                    entry={entry}
                    selected={selectedShipId === entry.instanceId}
                    dragActive={dropTarget === entry.instanceId}
                    onSelect={() => setSelectedShipId(entry.instanceId)}
                    onDropCard={(cardId) => handlePlace(cardId, entry.instanceId)}
                    onChange={updateFleet}
                    onDropState={setDropTarget}
                  />
                ))}
                <div className="addShipDropPad">
                  <span>＋</span><strong>ADD ANOTHER SHIP</strong><small>Drop a Ship card in open fleet space</small>
                </div>
              </div>
            )}
          </div>
        </section>
      </section>

      <footer>
        <span>FRONTIERS — 2E BUILDER FOR STAW</span>
        <span>Clean data · pure rules · familiar fleet construction</span>
      </footer>
    </main>
  );
}
