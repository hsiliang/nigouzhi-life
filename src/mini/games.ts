import { audio } from '../audio/audio';
import type { MiniId } from '../engine/types';
import { h } from '../ui/dom';
import { emoji, face, floatText, loop, onTap, pick, place, rand, tag } from './kit';
import type { MiniGame } from './runner';

const guangge: MiniGame = {
  id: 'guangge', title: '假裝加班', duration: 40, thresholds: [20, 40, 60],
  rules: '按住「滑手機」賺摸魚分。門口亮燈代表老婆要查勤，立刻放開裝認真，被抓到扣 8 分。',
  async run(host, ctl) {
    const door = emoji('🚪', 'gg-door');
    const hero = face('guangge', 'gg-hero');
    const status = tag('認真做實驗中');
    const btn = h('button', { class: 'btn primary mg-hold' }, '按住滑手機');
    host.append(door, hero, status, btn);
    let holding = false, timer = rand(3, 5), phase: 'calm' | 'warn' | 'check' = 'calm', bank = 0;
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); holding = true; });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) btn.addEventListener(ev, () => { holding = false; });
    await loop(ctl, (dt) => {
      timer -= dt;
      if (timer <= 0) {
        if (phase === 'calm') { phase = 'warn'; timer = Math.max(.55, 1.1 - ctl.seconds * .012); door.textContent = '👀'; audio.sfx('siren'); }
        else if (phase === 'warn') { phase = 'check'; timer = 1.3; door.textContent = '👩'; }
        else { phase = 'calm'; timer = rand(2, 4); door.textContent = '🚪'; }
      }
      if (phase === 'check' && holding) { ctl.score(-8); floatText(host, '被抓包 -8', false); holding = false; phase = 'calm'; timer = rand(2, 3); door.textContent = '🚪'; }
      if (holding) { bank += dt * 3; if (bank >= 1) { ctl.score(Math.floor(bank)); bank %= 1; } }
      status.textContent = holding ? '手機滑滑滑' : '認真做實驗中';
      hero.classList.toggle('peek', holding);
    });
  },
};

const kaka: MiniGame = {
  id: 'kaka', title: '卡卡保衛戰', duration: 35, thresholds: [8, 16, 24],
  rules: '左右拖動卡卡。接住手機加分，閃開豆豆的手，被摸到扣 2 分。',
  async run(host, ctl) {
    const me = face('kaka', 'kk-hero');
    host.append(me);
    const W = () => host.clientWidth, H = () => host.clientHeight;
    let x = W() / 2, spawn = 0;
    const items: { el: HTMLElement; x: number; y: number; good: boolean; v: number }[] = [];
    host.addEventListener('pointermove', (e) => { x = e.clientX - host.getBoundingClientRect().left; });
    host.addEventListener('pointerdown', (e) => { x = e.clientX - host.getBoundingClientRect().left; });
    await loop(ctl, (dt) => {
      spawn -= dt;
      if (spawn <= 0) {
        spawn = Math.max(.35, .85 - ctl.seconds * .012);
        const good = Math.random() < .45;
        const el = emoji(good ? '📱' : '🖐️');
        host.append(el);
        items.push({ el, x: rand(24, W() - 24), y: -30, good, v: rand(170, 250) + ctl.seconds * 4 });
      }
      place(me, x, H() - 54);
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.v * dt;
        place(it.el, it.x, it.y);
        const hit = Math.abs(it.x - x) < 46 && Math.abs(it.y - (H() - 60)) < 46;
        if (hit) { ctl.score(it.good ? 1 : -2); floatText(me.parentElement!, it.good ? '+1' : '被摸了 -2', it.good); }
        if (hit || it.y > H() + 30) { it.el.remove(); items.splice(i, 1); }
      }
    });
  },
};

const BINS = [{ name: '成都', c: '#f4895f' }, { name: '南京', c: '#7fc7a8' }, { name: '深圳', c: '#8cc4e8' }];
const zhuangzhuang: MiniGame = {
  id: 'zhuangzhuang', title: '包裹分類', duration: 35, thresholds: [12, 22, 30],
  rules: '看包裹貼的地名，點對應的貨架。越來越快，分錯或超時都會扣分。',
  async run(host, ctl) {
    const box = h('div', { class: 'zz-box' }, '📦');
    const label = h('div', { class: 'zz-label' });
    const clock = h('div', { class: 'zz-clock' }, h('i', {}));
    const bins = BINS.map((b, i) => {
      const el = h('button', { class: 'zz-bin', style: `background:${b.c}` }, b.name);
      onTap(el, () => answer(i));
      return el;
    });
    host.append(box, label, clock, h('div', { class: 'zz-bins' }, ...bins));
    let want = 0, left = 0, limit = 2.6;
    const fresh = () => {
      want = Math.floor(Math.random() * 3);
      limit = Math.max(.9, 2.6 - ctl.seconds * .05);
      left = limit;
      label.textContent = BINS[want].name;
      label.style.background = pick(BINS).c;
    };
    const answer = (i: number) => {
      const ok = i === want;
      ctl.score(ok ? 1 : -1);
      floatText(host, ok ? '+1' : '-1', ok);
      fresh();
    };
    fresh();
    await loop(ctl, (dt) => {
      left -= dt;
      (clock.firstChild as HTMLElement).style.width = `${(left / limit) * 100}%`;
      if (left <= 0) { ctl.score(-1); floatText(host, '超時 -1', false); fresh(); }
    });
  },
};

const dayi: MiniGame = {
  id: 'dayi', title: '峽谷大亂鬥', duration: 35, thresholds: [18, 32, 44],
  rules: '點掉衝過來的小怪，大怪要點三下。「老子」越殺越順，連續漏掉會扣分。',
  async run(host, ctl) {
    const boss = face('dayi', 'dy-hero');
    host.append(boss);
    const W = () => host.clientWidth, H = () => host.clientHeight;
    let spawn = 0;
    const foes: { el: HTMLElement; ttl: number; hp: number }[] = [];
    await loop(ctl, (dt) => {
      spawn -= dt;
      if (spawn <= 0) {
        spawn = Math.max(.32, .8 - ctl.seconds * .012);
        const big = Math.random() < .2;
        const el = emoji(big ? '👹' : '👾', 'dy-foe');
        const foe = { el, ttl: rand(1.1, 1.7), hp: big ? 3 : 1 };
        place(el, rand(36, W() - 36), rand(36, H() - 150));
        onTap(el, () => {
          foe.hp -= 1;
          audio.sfx('whack');
          if (foe.hp > 0) return;
          ctl.score(big ? 3 : 1);
          el.remove();
          foes.splice(foes.indexOf(foe), 1);
        });
        foes.push(foe);
        host.append(el);
      }
      for (let i = foes.length - 1; i >= 0; i--) {
        const f = foes[i];
        f.ttl -= dt;
        if (f.ttl <= 0) { f.el.remove(); foes.splice(i, 1); ctl.score(-1); }
      }
    });
  },
};

const taoshu: MiniGame = {
  id: 'taoshu', title: '光屁股躲警察', duration: 40, thresholds: [8, 15, 22],
  rules: '點畫面跳過警車和巡邏警察。撞到扣 3 分。放心，大桃子全程擋住重點部位。',
  async run(host, ctl) {
    const me = h('div', { class: 'ts-hero' }, face('taoshu', 'ts-img', 'side'), emoji('🍑', 'ts-peach'));
    const ground = h('div', { class: 'ts-ground' });
    host.append(ground, me);
    const H = () => host.clientHeight, W = () => host.clientWidth;
    let y = 0, vy = 0, spawn = 1;
    const cars: { el: HTMLElement; x: number; hit: boolean }[] = [];
    onTap(host, () => { if (y <= 0.5) { vy = 760; audio.sfx('jump'); } });
    await loop(ctl, (dt) => {
      vy -= 1900 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = Math.max(0, vy);
      const speed = 240 + ctl.seconds * 6;
      spawn -= dt;
      if (spawn <= 0) {
        spawn = rand(1.05, 1.9) - Math.min(.5, ctl.seconds * .008);
        const el = emoji(pick(['🚓', '👮', '🚨']));
        host.append(el);
        cars.push({ el, x: W() + 30, hit: false });
      }
      const gy = H() - 70;
      place(me, 80, gy - y);
      for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i];
        c.x -= speed * dt;
        place(c.el, c.x, gy + 12);
        if (!c.hit && Math.abs(c.x - 80) < 34 && y < 46) { c.hit = true; ctl.score(-3); floatText(host, '被抓 -3', false); }
        if (c.x < 50 && !c.hit) { c.hit = true; ctl.score(1); floatText(host, '+1', true); }
        if (c.x < -40) { c.el.remove(); cars.splice(i, 1); }
      }
    });
  },
};

const tangyuan: MiniGame = {
  id: 'tangyuan', title: '打針時機', duration: 35, thresholds: [12, 22, 30],
  rules: '指針進到綠區時點一下打針，正中央 3 分，綠區 2 分，打歪扣 1 分。打完要等吊瓶滴一下。',
  async run(host, ctl) {
    const zone = h('div', { class: 'ty-zone' }, h('i', {}));
    const needle = h('div', { class: 'ty-needle' });
    const bar = h('div', { class: 'ty-bar' }, zone, needle);
    const drip = emoji('💧', 'ty-drip');
    host.append(face('tangyuan', 'ty-hero'), bar, drip, tag('點畫面打針'));
    let pos = 0, dir = 1, center = 50, width = 24, cool = 0;
    const setup = () => {
      width = Math.max(10, 24 - ctl.seconds * .3);
      center = rand(width / 2 + 2, 98 - width / 2);
      zone.style.left = `${center - width / 2}%`; zone.style.width = `${width}%`;
    };
    setup();
    onTap(host, () => {
      if (cool > 0) return;
      const d = Math.abs(pos - center);
      const gain = d < width * .14 ? 3 : d < width / 2 ? 2 : -1;
      ctl.score(gain);
      floatText(host, gain > 0 ? `+${gain}` : '打歪了 -1', gain > 0);
      cool = .7; drip.classList.add('on');
      setup();
    });
    await loop(ctl, (dt) => {
      cool = Math.max(0, cool - dt);
      if (!cool) drip.classList.remove('on');
      pos += dir * (65 + ctl.seconds * 1.3) * dt;
      if (pos > 100) { pos = 100; dir = -1; } if (pos < 0) { pos = 0; dir = 1; }
      needle.style.left = `${pos}%`;
    });
  },
};

const yao: MiniGame = {
  id: 'yao', title: '節奏跳繩', duration: 35, thresholds: [15, 28, 38],
  rules: '繩子轉到腳下時點一下跳起來。連跳有加成，體重保證不會變。',
  async run(host, ctl) {
    const hero = face('yao', 'yao-hero');
    const rope = h('div', { class: 'yao-rope' });
    const combo = tag('連跳 0');
    host.append(rope, hero, combo);
    let phase = 0, chain = 0, tapped = false;
    onTap(host, () => {
      if (tapped) return;
      tapped = true;
      const near = Math.min(phase, 1 - phase);
      hero.classList.add('jump');
      setTimeout(() => hero.classList.remove('jump'), 180);
      if (near < .16) { chain += 1; ctl.score(chain >= 10 ? 2 : 1); audio.sfx('jump'); }
      else { chain = 0; floatText(host, '絆到了', false); }
    });
    await loop(ctl, (dt) => {
      const speed = .8 + ctl.seconds * .012;
      const was = phase;
      phase = (phase + dt * speed) % 1;
      if (was > phase) { if (!tapped) { if (chain) floatText(host, '漏了', false); chain = 0; } }
      if (was < .5 && phase >= .5) tapped = false;
      rope.style.transform = `scaleY(${Math.cos(phase * Math.PI * 2)})`;
      combo.textContent = `連跳 ${chain}`;
    });
    floatText(host, '體重：不變', true);
  },
};

const panghu: MiniGame = {
  id: 'panghu', title: '陪客戶乾杯', duration: 40, thresholds: [15, 28, 40],
  rules: '點一下乾一杯得 1 分，醉度會上升又慢慢消退。醉度爆表要趴下扣 5 分。胖虎不多話，只管喝。',
  async run(host, ctl) {
    const gauge = h('i', {});
    const bar = h('div', { class: 'ph-gauge' }, gauge);
    const hero = face('panghu', 'ph-hero');
    const glass = emoji('🍺', 'ph-glass');
    host.append(hero, glass, tag('醉度'), bar);
    let drunk = 0, down = 0;
    onTap(host, () => {
      if (down > 0) return;
      drunk += 12;
      ctl.score(1);
      audio.sfx('gulp');
      glass.classList.add('on');
      setTimeout(() => glass.classList.remove('on'), 120);
      if (drunk >= 100) { drunk = 60; down = 1.6; ctl.score(-5); floatText(host, '趴下了 -5', false); hero.classList.add('down'); }
    });
    await loop(ctl, (dt) => {
      down = Math.max(0, down - dt);
      if (!down) hero.classList.remove('down');
      drunk = Math.max(0, drunk - dt * 11);
      gauge.style.width = `${drunk}%`;
      gauge.style.background = drunk > 75 ? '#e8606e' : '#ffcf5c';
    });
  },
};

const doudou: MiniGame = {
  id: 'doudou', title: '打白痴同事', duration: 35, thresholds: [15, 28, 38],
  rules: '白痴同事冒出來就打，每個 1 分。別打到卡卡，打到扣 3 分，豆豆會心疼。',
  async run(host, ctl) {
    const holes = Array.from({ length: 9 }, () => h('div', { class: 'dd-hole' }));
    host.append(h('div', { class: 'dd-grid' }, ...holes));
    let spawn = 0;
    const live = new Map<HTMLElement, { ttl: number; el: HTMLElement }>();
    await loop(ctl, (dt) => {
      spawn -= dt;
      if (spawn <= 0) {
        spawn = Math.max(.32, .78 - ctl.seconds * .012);
        const free = holes.filter((x) => !live.has(x));
        if (free.length) {
          const hole = pick(free);
          const isKaka = Math.random() < .22;
          const el = isKaka ? face('kaka', 'dd-mole') : emoji(pick(['🤪', '🥴', '😵']), 'dd-mole');
          const rec = { ttl: rand(.75, 1.2), el };
          onTap(el, () => {
            if (!live.has(hole)) return;
            ctl.score(isKaka ? -3 : 1);
            floatText(host, isKaka ? '卡卡！-3' : '+1', !isKaka);
            audio.sfx('whack');
            el.remove(); live.delete(hole);
          });
          hole.append(el);
          live.set(hole, rec);
        }
      }
      for (const [hole, rec] of live) {
        rec.ttl -= dt;
        if (rec.ttl <= 0) { rec.el.remove(); live.delete(hole); }
      }
    });
  },
};

const beibei: MiniGame = {
  id: 'beibei', title: '美食打卡', duration: 35, thresholds: [10, 18, 26],
  rules: '美食飄過取景框時按快門。正中間 3 分，框內 1 分，拍空扣 1 分。九宮格等你。',
  async run(host, ctl) {
    const frame = h('div', { class: 'bb-frame' });
    const food = emoji('🍲', 'bb-food');
    const shutter = h('button', { class: 'btn primary mg-hold' }, '按快門');
    host.append(frame, food, shutter);
    const W = () => host.clientWidth, H = () => host.clientHeight;
    let t = rand(0, 6), kind = 0, cool = 0;
    const FOODS = ['🍲', '🍰', '🍣', '🦞', '🍜', '🥟', '🧋'];
    let fx = 0, fy = 0;
    onTap(shutter, () => {
      if (cool > 0) return;
      cool = .5;
      audio.sfx('shutter');
      const dx = Math.abs(fx - W() / 2), dy = Math.abs(fy - H() * .42);
      const score = dx < 22 && dy < 22 ? 3 : dx < 70 && dy < 70 ? 1 : -1;
      ctl.score(score);
      floatText(host, score > 0 ? `+${score}` : '拍空 -1', score > 0);
      if (score > 0) { kind = (kind + 1) % FOODS.length; food.textContent = FOODS[kind]; t = rand(0, 6); }
    });
    await loop(ctl, (dt) => {
      cool = Math.max(0, cool - dt);
      t += dt * (1 + ctl.seconds * .025);
      fx = W() / 2 + Math.sin(t * 1.4) * (W() * .42);
      fy = H() * .42 + Math.cos(t * 2.1) * (H() * .24);
      place(food, fx, fy);
    });
  },
};

export const games: Record<MiniId, MiniGame> = { guangge, kaka, zhuangzhuang, dayi, taoshu, tangyuan, yao, panghu, doudou, beibei };
