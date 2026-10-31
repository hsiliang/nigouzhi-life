import { audio } from '../audio/audio';
import { h } from './dom';

const REAL_TITLE = '你購置的人生';
const FAKE_TITLE = 'Q3_營運報表_final_v7_真的最後版.xlsx';
const ROWS = ['華東區', '華南區', '西南區', '電商通路', '門市通路', '跨境業務', '售後服務', '倉儲物流', '行銷費用', '人事成本', '差旅費用', '其他收入', '其他支出', '合計'];

class Boss {
  active = false;
  private layer: HTMLElement | null = null;
  private listeners = new Set<(active: boolean) => void>();

  onChange(fn: (active: boolean) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  toggle() {
    this.active = !this.active;
    if (this.active) this.show(); else this.hide();
    audio.setBossMute(this.active);
    document.title = this.active ? FAKE_TITLE : REAL_TITLE;
    this.listeners.forEach((fn) => fn(this.active));
  }

  private sheet() {
    const head = h('tr', {}, h('th', {}, ''), ...'ABCDEFG'.split('').map((c) => h('th', {}, c)));
    const titles = h('tr', {}, h('th', {}, '1'), ...['科目', '7 月', '8 月', '9 月', 'Q3 合計', '預算', '達成率'].map((t) => h('td', { class: 'x-head' }, t)));
    const rows = ROWS.map((name, r) => {
      const months = [0, 1, 2].map((m) => 120000 + ((r + 3) * (m + 5) * 7919) % 480000);
      const total = months.reduce((a, b) => a + b, 0);
      const budget = Math.round(total * (0.92 + (r % 5) * 0.03));
      const cells = [...months, total, budget].map((n) => h('td', { class: 'x-num' }, n.toLocaleString('en-US')));
      return h('tr', {}, h('th', {}, r + 2), h('td', {}, name), ...cells, h('td', { class: 'x-num' }, `${((total / budget) * 100).toFixed(1)}%`));
    });
    return h('table', { class: 'x-grid' }, head, titles, ...rows);
  }

  private show() {
    const back = () => this.toggle();
    this.layer = h('div', { class: 'boss', 'data-testid': 'boss' },
      h('div', { class: 'x-title' }, FAKE_TITLE),
      h('div', { class: 'x-ribbon' }, '檔案　常用　插入　版面配置　公式　資料　校閱　檢視'),
      h('div', { class: 'x-formula' }, h('b', {}, 'F15'), '  =SUM(B15:E15)*摸魚係數'),
      h('div', { class: 'x-scroll' }, this.sheet()),
      h('div', { class: 'x-tabs' }, h('span', { class: 'on' }, '工作表1'), h('button', { class: 'x-back', onClick: back, 'data-testid': 'boss-back' }, '工作表2')));
    document.body.append(this.layer);
  }

  private hide() { this.layer?.remove(); this.layer = null; }
}
export const boss = new Boss();
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') boss.toggle(); });
