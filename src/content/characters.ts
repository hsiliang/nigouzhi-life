import type { CharId, Character } from '../engine/types';

export const characters: Record<CharId, Character> = {
  guangge: {
    id: 'guangge', name: '光哥', pitch: .85,
    schedule: ['courtyard', 'lab', 'lab'], talkFx: { complaints: 3 },
    skill: { name: '聞香而來', desc: '聊天時好感度額外 +3', talkAffinity: 3 },
  },
  kaka: {
    id: 'kaka', name: '卡卡', pitch: 1.05,
    schedule: ['gym', 'cafe', 'gym'], talkFx: { jealousy: 8 },
    skill: { name: '帥就是正義', desc: '心情上升時額外 +2', moodGain: 2 },
  },
  zhuangzhuang: {
    id: 'zhuangzhuang', name: '壯壯', pitch: 1.1,
    schedule: ['courtyard', 'warehouse', 'warehouse'], talkFx: { happiness: 2 },
    skill: { name: '群主加班魂', desc: '工作收入 +10', workCoins: 10 },
  },
  dayi: {
    id: 'dayi', name: '大姨', pitch: 1.2,
    schedule: ['cafe', 'cafe', 'rooftop'], talkFx: { mood: 2 },
    skill: { name: '村霸氣場', desc: '投訴值上升量 -30%', complaintScale: .7 },
  },
  taoshu: {
    id: 'taoshu', name: '桃叔', pitch: .75,
    schedule: ['rooftop', 'cafe', 'rooftop'], talkFx: { complaints: 2, mood: 3 },
    skill: { name: '萬事問桃叔', desc: '調查新租客時一次看完全部線索', tenantInsight: true },
  },
  tangyuan: {
    id: 'tangyuan', name: '湯圓', pitch: 1.35,
    schedule: ['clinic', 'clinic', 'clinic'], talkFx: { energy: 5 },
    skill: { name: '專業護理', desc: '休息時多回復 15 精力', restEnergy: 15 },
  },
  yao: {
    id: 'yao', name: '瑤老師', pitch: 1.25,
    schedule: ['artroom', 'artroom', 'courtyard'], talkFx: { mood: 1 },
    skill: { name: '美術摸魚', desc: '迷你遊戲獎勵 +10 購置幣', miniCoins: 10 },
  },
  panghu: {
    id: 'panghu', name: '胖虎', pitch: .9,
    schedule: ['artroom', 'courtyard', 'courtyard'], presence: .22, talkFx: { happiness: 2 },
    skill: { name: '恩愛護體', desc: '嫉妒值上升量 -40%', jealousyScale: .6 },
  },
  doudou: {
    id: 'doudou', name: '豆豆', pitch: 1.15,
    schedule: ['factory', 'factory', 'gym'], talkFx: { complaints: 2 },
    skill: { name: '嘴砲連擊', desc: '聊天好感 +2，心情上升 +1', talkAffinity: 2, moodGain: 1 },
  },
  beibei: {
    id: 'beibei', name: '貝貝', pitch: 1.3,
    schedule: ['penthouse', 'cafe', 'penthouse'], talkFx: { jealousy: 6 },
    skill: { name: '鈔能力', desc: '迷你遊戲獎勵 +20 購置幣', miniCoins: 20 },
  },
};
