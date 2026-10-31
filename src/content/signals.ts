import type { Content, GameSignal, Line } from '../engine/types';
import { S } from './script';

export const chapterTitles = ['搬家了你購置的', '光哥今晚也加班', '卡卡保衛戰', '備孕大作戰', '桃叔不見了', '誰是最強炫富', '瑤老師瘦了嗎', '群主的生日'];

/** Scripted reactions to engine signals, so the engine stays free of copy. */
export function linesForSignal(sig: GameSignal, c: Content): Line[] {
  switch (sig.type) {
    case 'note': return S('鄰居：「各位，半夜小聲一點。」\n旁白：門口多了一張便條，投訴值開始上升了。記得打掃或道歉。');
    case 'warning': return S('鄰居：管委會正式警告！再吵就叫警察了！\n壯壯：大家節制一點，尺度大的話回房間講！');
    case 'police': return [...S('警察：有人投訴這裡秩序不佳，請一位住戶跟我們走一趟。'), { who: 'narrator', text: `${c.characters[sig.who].name}被帶去隔壁派出所了，要兩天才回來。可以去探望。` }];
    case 'ban': return [...S('旁白：大門被貼上了封條！壯壯帶著大家從後門搬進隔壁棟。'), { who: 'zhuangzhuang', text: `沒事！現在是購置大樓 ${sig.buildingNo} 號，樓可以換，人不換！` }];
    case 'brawl': return S('旁白：全樓的嫉妒值爆表了！\n大姨：你購置的！老子忍不了了！\n豆豆：動手！\n旁白：嫉妒大亂鬥開始！');
    case 'tenantResult':
      if (sig.correct) return S(sig.verdict === 'evict' ? '壯壯：處理得好。這棟樓的門，不是誰都能進來的。' : '壯壯：好，就這麼決定。我們的判斷沒錯。');
      return S(sig.tenantType === 'scam' ? '旁白：幾天後才發現大家被騙了一筆錢。\n壯壯：唉，下次要先問桃叔。' : '壯壯：這次好像判斷錯了，大家再多看看。');
    case 'feudResolved': return S('旁白：冷戰結束！大樓的空氣又變回熱鬧的味道。');
  }
}
