import { asset } from '../ui/dom';
import { MusicPlayer, type Track } from './music';

export type Sfx = 'tap' | 'step' | 'good' | 'bad' | 'star' | 'ban' | 'coin' | 'jump' | 'pop' | 'gulp' | 'shutter' | 'whack' | 'siren';
type Tone = [freq: number, at: number, dur: number, wave?: OscillatorType];

const SFX: Record<Sfx, Tone[]> = {
  tap: [[660, 0, .06]], step: [[180, 0, .05, 'triangle'], [150, .1, .05, 'triangle']],
  good: [[523, 0, .1], [659, .09, .1], [784, .18, .18]], bad: [[300, 0, .14, 'sawtooth'], [220, .12, .24, 'sawtooth']],
  star: [[880, 0, .1], [1175, .08, .1], [1568, .16, .22]], ban: [[140, 0, .4, 'sawtooth'], [110, .28, .5, 'sawtooth']],
  coin: [[988, 0, .06], [1319, .05, .14]], jump: [[420, 0, .06], [640, .04, .06]], pop: [[900, 0, .05]],
  gulp: [[240, 0, .07], [180, .07, .08]], shutter: [[1500, 0, .03, 'square'], [900, .04, .03, 'square']],
  whack: [[120, 0, .1, 'square']], siren: [[720, 0, .18], [540, .18, .18], [720, .36, .18], [540, .54, .18]],
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private music: MusicPlayer | null = null;
  private voiceEl: HTMLAudioElement | null = null;
  private current: Track | null = null;
  private bossMuted = false;
  private voiceOn = true;
  private musicOn = true;
  private sfxOn = true;

  /** Browsers only allow sound after a user gesture; the first tap calls this. */
  unlock() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.master); this.sfxGain.connect(this.master); this.master.connect(this.ctx.destination);
    this.music = new MusicPlayer(this.ctx, this.musicGain);
    this.apply();
    if (this.current) this.startTrack(this.current);
  }

  configure(p: { voice: boolean; music: boolean; sfx: boolean }) {
    this.voiceOn = p.voice; this.musicOn = p.music; this.sfxOn = p.sfx;
    this.apply();
    if (!p.voice) this.stopVoice();
    if (this.current) this.startTrack(this.current);
  }

  setBossMute(on: boolean) {
    this.bossMuted = on;
    if (on) this.stopVoice();
    if (this.ctx) { if (on) void this.ctx.suspend(); else void this.ctx.resume(); }
    this.apply();
  }

  private apply() {
    if (!this.master) return;
    this.master.gain.value = this.bossMuted ? 0 : .8;
    this.musicGain!.gain.value = this.musicOn ? 1 : 0;
    this.sfxGain!.gain.value = this.sfxOn ? 1 : 0;
  }

  get running() { return this.ctx?.state === 'running'; }

  private startTrack(t: Track) {
    this.music?.stop();
    if (this.musicOn) this.music?.play(t);
  }
  bgm(t: Track) {
    if (this.current === t) return;
    this.current = t;
    this.startTrack(t);
  }

  private beep([freq, at, dur, wave]: Tone, volume: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = wave ?? 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfxGain!);
    o.start(t); o.stop(t + dur + .02);
  }
  sfx(name: Sfx) {
    if (!this.ctx || !this.sfxOn || this.bossMuted) return;
    SFX[name].forEach((tone) => this.beep(tone, .16));
  }
  /** Soft gibberish for unvoiced dialogue, pitched per character. */
  blip(pitch: number) {
    if (!this.ctx || !this.sfxOn || this.bossMuted) return;
    this.beep([(320 + Math.random() * 80) * pitch, 0, .05, 'triangle'], .06);
  }

  private stopVoice() { this.voiceEl?.pause(); this.voiceEl = null; }
  playVoice(id: string) {
    if (!this.voiceOn || this.bossMuted) return;
    this.stopVoice();
    const el = new Audio(asset(`voice/${id}.mp3`));
    el.volume = .9;
    this.voiceEl = el;
    void el.play().catch(() => { /* blocked or missing: dialogue still shows */ });
  }
}
export const audio = new AudioEngine();
