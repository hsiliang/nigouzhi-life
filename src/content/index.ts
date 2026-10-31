import type { Content } from '../engine/types';
import { heroAsides } from './asides';
import { chapter1to3 } from './chapters1';
import { chapter4to6 } from './chapters2';
import { chapter7to8 } from './chapters3';
import { characters } from './characters';
import { chatter } from './chatter';
import { endings } from './endings';
import { events } from './events';
import { feuds } from './feuds';
import { rooms } from './rooms';
import { tenants } from './tenants';

export const content: Content = {
  characters, rooms, chatter, events, tenants, feuds, endings, heroAsides,
  days: [...chapter1to3, ...chapter4to6, ...chapter7to8],
};
