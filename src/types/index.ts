// ============================================
// PANDEMONIUM - Type Definitions
// ============================================
// Barrel file - re-exports all types from domain-specific modules

// Elements
export type { Element, ElementalStatus, ElementalCombo } from './elements'

// Values
export type {
  ScalingSource,
  FixedValue,
  RangeValue,
  ScaledValue,
  GeneratedScaledValue,
  PowerAmountValue,
  EffectValue,
} from './values'

// Targeting
export type {
  EntityTarget,
  CardTarget,
  CardFilter,
  FilteredCardTarget,
  CardTheme,
} from './targeting'

// Conditions
export type {
  ComparisonOp,
  HealthCondition,
  HasPowerCondition,
  ResourceCondition,
  CardCountCondition,
  TurnCondition,
  CombatCondition,
  CardsPlayedCondition,
  AndCondition,
  OrCondition,
  NotCondition,
  Condition,
} from './conditions'

// Effects
export type {
  DamageEffect,
  BlockEffect,
  HealEffect,
  LifestealEffect,
  EnergyEffect,
  DrawEffect,
  DiscardEffect,
  ExhaustEffect,
  BanishEffect,
  AddCardEffect,
  ShuffleEffect,
  UpgradeEffect,
  RetainEffect,
  TransformEffect,
  ScryEffect,
  TutorEffect,
  CopyCardEffect,
  PutOnDeckEffect,
  ModifyCostEffect,
  MaxHealthEffect,
  SetHealthEffect,
  DestroyBlockEffect,
  ApplyPowerEffect,
  RemovePowerEffect,
  TransferPowerEffect,
  ReplayCardEffect,
  PlayTopCardEffect,
  GoldEffect,
  DiscoverEffect,
  ConditionalEffect,
  RepeatEffect,
  RandomEffect,
  SequenceEffect,
  ForEachEffect,
  // Advanced Combat
  ExecuteEffect,
  SplashEffect,
  RecoilEffect,
  CounterAttackEffect,
  ChainEffect,
  // Deck Manipulation
  MillEffect,
  CreateRandomCardEffect,
  InnateEffect,
  EtherealEffect,
  UnplayableEffect,
  // Power Manipulation
  StealPowerEffect,
  SilencePowerEffect,
  // Enemy Manipulation
  WeakenIntentEffect,
  // Delayed
  DelayedEffect,
  AtomicEffect,
  AtomicEffectType,
  EffectContext,
} from './effects'

// Powers
export type {
  StackBehavior,
  PowerTrigger,
  PowerModifiers,
  PowerTriggerDef,
  PowerDefinition,
  Power,
  Powers,
} from './powers'

// Cards
export type {
  CardVariant,
  CardRarity,
  CardFilters,
  SortOption,
  SortDirection,
  HeroStats,
  HeroActivated,
  HeroUltimate,
  IntentType,
  Intent,
  EnemyStats,
  EnemyAbility,
  EnemyUltimate,
  CardDefinition,
  CardInstance,
} from './cards'

export { DEFAULT_FILTERS, RARITY_ORDER } from './cards'

// Entities
export type {
  Entity,
  PlayerEntity,
  EnemyEntity,
  MonsterDefinition,
  IntentPattern,
  HeroDefinition,
  HeroState,
} from './entities'

// Relics
export type {
  RelicRarity,
  RelicTrigger,
  RelicDefinition,
  RelicInstance,
} from './relics'

// Rooms
export type {
  RoomType,
  RoomDefinition,
  RoomCard,
  DungeonRoom,
  RoomModifier,
  DungeonDeckDefinition,
  OwnedDungeonDeck,
} from './rooms'

// Combat
export type {
  TurnPhase,
  GamePhase,
  AppScreen,
  PendingScry,
  PendingTutor,
  PendingDiscover,
  PendingBanish,
  PendingSelection,
  CombatState,
  RunStats,
  RunState,
  DelayedEffectEntry,
} from './combat'

// Visuals
export type {
  VisualEvent,
  CombatNumber,
} from './visuals'

// Actions
export type {
  GameAction,
} from './actions'

// Meta
export type {
  MetaState,
} from './meta'
