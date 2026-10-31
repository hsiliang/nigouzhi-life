import type { CharId, Character } from '../engine/types';

export const characters: Record<CharId, Character> = {
  guangge: {
    id: 'guangge', name: '光哥', age: '約 35', home: '南京', job: '光學所科學家', pitch: .85,
    bio: '已婚，老婆管得嚴。實驗室的燈永遠亮著，因為他不想回家。美女話題方圓十里都聽得見。',
    schedule: ['courtyard', 'lab', 'lab'], talkFx: { complaints: 3 },
    skill: { name: '聞香而來', desc: '聊天時好感度額外 +3', talkAffinity: 3 },
  },
  kaka: {
    id: 'kaka', name: '卡卡', age: '約 25', home: '深圳', job: '健身帥哥', pitch: 1.05,
    bio: '有女友，很多人愛慕他。最大的煩惱是太累，每次訴苦都引發全場嫉妒。',
    schedule: ['gym', 'cafe', 'gym'], talkFx: { jealousy: 8 },
    skill: { name: '帥就是正義', desc: '心情上升時額外 +2', moodGain: 2 },
  },
  zhuangzhuang: {
    id: 'zhuangzhuang', name: '壯壯', age: '37', home: '成都', job: '倉庫物流', pitch: 1.1,
    bio: '群主兼大樓靈魂。單親媽媽，養兩個孩子，週末也在上班。開朗大方像兄弟。',
    schedule: ['courtyard', 'warehouse', 'warehouse'], talkFx: { happiness: 2 },
    skill: { name: '群主加班魂', desc: '工作收入 +10', workCoins: 10 },
  },
  dayi: {
    id: 'dayi', name: '大姨', age: '約 32', home: '成都', job: 'CAD 設計', pitch: 1.2,
    bio: '村裡小霸王，自稱老子，打王者時六親不認。新婚備孕中，嘴上和桃叔調情。',
    schedule: ['cafe', 'cafe', 'rooftop'], talkFx: { mood: 2 },
    skill: { name: '村霸氣場', desc: '投訴值上升量 -30%', complaintScale: .7 },
  },
  taoshu: {
    id: 'taoshu', name: '桃叔', age: '42', home: '台北', job: 'AI 工程師', pitch: .75,
    bio: '什麼都懂的老帥哥，愛做惡搞圖。偶爾光屁股上街被警察帶走，消失幾天。',
    schedule: ['rooftop', 'cafe', 'rooftop'], talkFx: { complaints: 2, mood: 3 },
    skill: { name: '萬事問桃叔', desc: '調查新租客時一次看完全部線索', tenantInsight: true },
  },
  tangyuan: {
    id: 'tangyuan', name: '湯圓', age: '約 23', home: '廣東', job: '診所護士', pitch: 1.35,
    bio: '新婚小護士，早八晚十，還要等最後一瓶吊瓶打完。想備孕，沒時間。',
    schedule: ['clinic', 'clinic', 'clinic'], talkFx: { energy: 5 },
    skill: { name: '專業護理', desc: '休息時多回復 15 精力', restEnergy: 15 },
  },
  yao: {
    id: 'yao', name: '瑤老師', age: '約 28', home: '江蘇淮安', job: '小學美術老師', pitch: 1.25,
    bio: '閒的時候滑手機睡覺，忙的時候累到爆。每天跳繩，體重文風不動。胖虎的老婆。',
    schedule: ['artroom', 'artroom', 'courtyard'], talkFx: { mood: 1 },
    skill: { name: '美術摸魚', desc: '迷你遊戲獎勵 +10 購置幣', miniCoins: 10 },
  },
  panghu: {
    id: 'panghu', name: '胖虎', age: '約 28', home: '江蘇淮安', job: '公司小主管', pitch: .9,
    bio: '話少，常出差陪客戶喝酒，酒量好。和瑤老師非常恩愛，怕她被壞男人拐跑。',
    schedule: ['artroom', 'courtyard', 'courtyard'], presence: .22, talkFx: { happiness: 2 },
    skill: { name: '恩愛護體', desc: '嫉妒值上升量 -40%', jealousyScale: .6 },
  },
  doudou: {
    id: 'doudou', name: '豆豆', age: '約 35', home: '重慶', job: '工廠職員', pitch: 1.15,
    bio: '單身，最愛調戲卡卡，幻想傍大款。常抱怨白痴同事，最討厭老鄉人老師。',
    schedule: ['factory', 'factory', 'gym'], talkFx: { complaints: 2 },
    skill: { name: '嘴砲連擊', desc: '聊天好感 +2，心情上升 +1', talkAffinity: 2, moodGain: 1 },
  },
  beibei: {
    id: 'beibei', name: '貝貝', age: '約 24', home: '成都', job: '公務員', pitch: 1.3,
    bio: '新婚小富婆，別墅全智能，開特斯拉。工作很閒，去哪都先拍照發給大家。',
    schedule: ['penthouse', 'cafe', 'penthouse'], talkFx: { jealousy: 6 },
    skill: { name: '鈔能力', desc: '迷你遊戲獎勵 +20 購置幣', miniCoins: 20 },
  },
};
