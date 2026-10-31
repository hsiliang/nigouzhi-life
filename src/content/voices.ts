import type { Line } from '../engine/types';
import data from './voiceLines.json';

const table = new Map<string, string>();
for (const [who, lines] of Object.entries(data)) lines.forEach((text, i) => table.set(`${who}|${text}`, `${who}-${i}`));

/** Maps a script line to its pre-generated clip, if it has one. */
export const voiceOf = (line: Line) => table.get(`${line.who}|${line.text}`);
export const voiceData = data as Record<string, string[]>;
