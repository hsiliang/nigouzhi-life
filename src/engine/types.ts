export const CHAR_IDS = ['guangge', 'kaka', 'zhuangzhuang', 'dayi', 'taoshu', 'tangyuan', 'yao', 'panghu', 'doudou', 'beibei'] as const;
export type CharId = (typeof CHAR_IDS)[number];
export const ROOM_IDS = ['courtyard', 'clinic', 'warehouse', 'gym', 'artroom', 'cafe', 'lab', 'factory', 'penthouse', 'rooftop', 'police'] as const;
export type RoomId = (typeof ROOM_IDS)[number];
export type MiniId = CharId;
export type StatKey = 'energy' | 'mood' | 'coins' | 'happiness' | 'jealousy' | 'complaints';
export type Speaker = CharId | 'narrator' | 'tenant' | 'neighbor' | 'police';
export type LineFx = 'shake' | 'heart' | 'anger' | 'sweat' | 'jealous' | 'tears' | 'sparkle';

export interface Line { who: Speaker; text: string; fx?: LineFx }
export type Effects = Partial<Record<StatKey, number>> & { affinity?: Partial<Record<CharId, number>> };

export interface Skill {
  name: string;
  desc: string;
  workCoins?: number; talkAffinity?: number; restEnergy?: number;
  jealousyScale?: number; complaintScale?: number; miniCoins?: number; moodGain?: number; tenantInsight?: boolean;
}
export interface Character {
  id: CharId; name: string; age: string; home: string; job: string; bio: string;
  schedule: [RoomId, RoomId, RoomId];
  presence?: number;
  talkFx?: Effects;
  skill: Skill;
  pitch: number;
}
export interface Room { id: RoomId; name: string; owner?: CharId; work?: { label: string; fx: Effects; lines: Line[] }; floor: number }

export type Goal =
  | { k: 'talk'; who: CharId }
  | { k: 'mini'; id: MiniId; min: number }
  | { k: 'stat'; stat: StatKey; op: '>=' | '<='; value: number }
  | { k: 'affinity'; who: CharId; min: number }
  | { k: 'tenant' } | { k: 'feud' } | { k: 'work' } | { k: 'clean' };

export interface DayDef {
  day: number; chapter: number; title: string;
  intro: Line[]; outro: Line[];
  goal: Goal; goalText: string;
  bonus: [{ goal: Goal; text: string }, { goal: Goal; text: string }];
  tenant?: string; feud?: string;
  absent?: Partial<Record<CharId, number>>;
  force?: CharId[];
  startFx?: Effects;
  scriptedBan?: boolean;
}
export interface GameEvent {
  id: string; minDay?: number; lines: Line[]; fx?: Effects;
  choices?: { label: string; lines: Line[]; fx?: Effects }[];
}
export type TenantType = 'silent' | 'ad' | 'scam' | 'normal';
export type Verdict = 'welcome' | 'watch' | 'evict';
export interface Tenant { id: string; name: string; type: TenantType; look: string; intro: Line[]; clues: Line[]; caught: Line[] }
export type Mediation = 'message' | 'gift' | 'sunset';
export interface Feud {
  id: string; a: CharId; b: CharId; best: Mediation;
  cause: Line[]; sideA: Line[]; sideB: Line[]; wrong: Line[]; peace: Line[];
}
export interface Content {
  characters: Record<CharId, Character>;
  rooms: Record<RoomId, Room>;
  days: DayDef[];
  chatter: Record<CharId, Line[][]>;
  events: GameEvent[];
  tenants: Tenant[];
  feuds: Feud[];
  endings: Record<CharId, Line[]>;
  heroAsides: Record<CharId, string[]>;
}

export interface DayProgress {
  talked: CharId[]; minis: Partial<Record<MiniId, number>>;
  tenantDone: boolean; feudDone: boolean; worked: boolean; cleaned: boolean;
}
export interface GameState {
  version: 1; hero: CharId; seed: number; day: number; maxDay: number; slot: number; started: boolean;
  energy: number; mood: number; coins: number; happiness: number; jealousy: number; complaints: number;
  complaintTier: number; buildingNo: number; bans: number; brawls: number;
  affinity: Record<CharId, number>; chatIndex: Partial<Record<CharId, number>>;
  stars: Record<number, number>; progress: DayProgress;
  absent: Partial<Record<CharId, number>>; forced: CharId[];
  tenant: { id: string; clues: number } | null;
  feud: { id: string; heard: CharId[] } | null;
  resolvedFeuds: string[]; seenTenants: string[]; seenEvents: string[];
  album: string[]; finished: boolean;
}
export type Action =
  | { kind: 'talk'; who: CharId } | { kind: 'work'; room?: RoomId } | { kind: 'rest' } | { kind: 'clean' } | { kind: 'apologize' }
  | { kind: 'gift'; who: CharId } | { kind: 'mini'; id: MiniId }
  | { kind: 'tenantAsk'; helper: CharId } | { kind: 'tenantDecide'; verdict: Verdict }
  | { kind: 'feudHear'; who: CharId } | { kind: 'feudMediate'; method: Mediation };

export type GameSignal =
  | { type: 'note' } | { type: 'warning' } | { type: 'police'; who: CharId } | { type: 'ban'; buildingNo: number }
  | { type: 'brawl' } | { type: 'tenantResult'; correct: boolean; verdict: Verdict; tenantType: TenantType }
  | { type: 'feudResolved'; id: string };
export interface StepResult { state: GameState; lines: Line[]; signals: GameSignal[]; startMini?: MiniId }
export interface DayResult {
  state: GameState; stars: number; passed: boolean; goals: boolean[]; lines: Line[];
  nextDay: number; replaying: boolean; finished: boolean;
}
