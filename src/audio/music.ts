export type Track = 'title' | 'day' | 'night' | 'mini' | 'warm';

interface Song { bpm: number; wave: OscillatorType; chords: number[][]; melody: (number | null)[]; bass: boolean }

const C = 261.63;
const note = (semi: number) => C * 2 ** (semi / 12);
const I = [0, 4, 7], V = [-5, -1, 2], vi = [-3, 0, 4], IV = [-7, -3, 0], ii = [-10, -7, -3];

export const SONGS: Record<Track, Song> = {
  title: { bpm: 104, wave: 'triangle', bass: true, chords: [I, V, vi, IV], melody: [12, null, 14, 16, null, 16, 14, 12, 7, null, 9, 12, null, 9, 7, null] },
  day: { bpm: 118, wave: 'triangle', bass: true, chords: [I, IV, V, I, vi, IV, ii, V], melody: [7, 9, 12, null, 9, 7, 4, null, 5, 7, 9, null, 7, 5, 4, null, 12, 14, 16, null, 14, 12, 9, null, 7, 9, 12, null, 14, null, 12, null] },
  night: { bpm: 84, wave: 'sine', bass: true, chords: [vi, IV, I, V], melody: [12, null, null, 9, null, 7, null, null, 9, null, null, 12, null, 14, null, null] },
  mini: { bpm: 150, wave: 'square', bass: true, chords: [I, I, IV, V], melody: [12, 12, 16, 12, 19, 16, 12, null, 14, 14, 17, 14, 19, 17, 14, null] },
  warm: { bpm: 76, wave: 'sine', bass: false, chords: [I, vi, IV, V], melody: [16, null, 14, null, 12, null, 9, null, 12, null, 14, null, 7, null, null, null] },
};

/** Lookahead scheduler; nothing to download, so the game stays small and license-free. */
export class MusicPlayer {
  private timer = 0;
  private step = 0;
  private nextTime = 0;
  private song: Song | null = null;

  constructor(private ctx: AudioContext, private out: GainNode) {}

  play(track: Track) {
    this.stop();
    this.song = SONGS[track];
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.tick(), 60);
  }
  stop() { clearInterval(this.timer); this.timer = 0; this.song = null; }

  private tone(freq: number, at: number, dur: number, vol: number, wave: OscillatorType) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = wave; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.out);
    o.start(at); o.stop(at + dur + 0.02);
  }

  private tick() {
    const s = this.song;
    if (!s) return;
    const beat = 60 / s.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      const i = this.step;
      const m = s.melody[i % s.melody.length];
      if (m !== null) this.tone(note(m), this.nextTime, beat * 1.7, s.wave === 'square' ? .05 : .11, s.wave);
      if (i % 8 === 0) {
        const chord = s.chords[Math.floor(i / 8) % s.chords.length];
        chord.forEach((c) => this.tone(note(c), this.nextTime, beat * 7, .045, 'triangle'));
        if (s.bass) this.tone(note(chord[0] - 12), this.nextTime, beat * 3, .1, 'sine');
      }
      if (s.bass && i % 8 === 4) this.tone(note(s.chords[Math.floor(i / 8) % s.chords.length][0] - 12), this.nextTime, beat * 2, .08, 'sine');
      this.nextTime += beat;
      this.step += 1;
    }
  }
}
