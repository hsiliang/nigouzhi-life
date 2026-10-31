import type { Room, RoomId } from '../engine/types';
import { S } from './script';

export const rooms: Record<RoomId, Room> = {
  courtyard: { id: 'courtyard', name: '中庭小吃攤', floor: 1, owner: 'panghu',
    work: { label: '顧小吃攤', fx: { coins: 20, energy: -14 }, lines: S('旁白：你顧了一下午小吃攤，賺到的錢剛好夠自己吃掉的那份。') } },
  clinic: { id: 'clinic', name: '湯圓診所', floor: 1, owner: 'tangyuan',
    work: { label: '幫忙看吊瓶', fx: { coins: 24, energy: -16 }, lines: S('湯圓：幫我盯著這瓶，滴完叫我。\n旁白：你盯了兩小時，第一次發現時間可以用滴來計算。') } },
  warehouse: { id: 'warehouse', name: '壯壯倉庫', floor: 1, owner: 'zhuangzhuang',
    work: { label: '幫忙分包裹', fx: { coins: 30, energy: -20 }, lines: S('壯壯：這批衣服今晚要出完，搭把手！\n旁白：你的腰提出了書面抗議。') } },
  gym: { id: 'gym', name: '卡卡健身房', floor: 2, owner: 'kaka',
    work: { label: '當陪練', fx: { coins: 24, energy: -18 }, lines: S('卡卡：再來一組。\n旁白：你的手臂已經不是你的了。') } },
  artroom: { id: 'artroom', name: '瑤老師美術教室', floor: 2, owner: 'yao',
    work: { label: '幫改美術作業', fx: { coins: 20, energy: -12 }, lines: S('瑤老師：這個太陽是綠色的，給九十分吧，孩子開心就好。') } },
  cafe: { id: 'cafe', name: '大姨 CAD 網咖', floor: 2, owner: 'dayi',
    work: { label: '幫畫 CAD', fx: { coins: 26, energy: -16 }, lines: S('大姨：這條線畫歪了，你購置的，老子重畫。') } },
  lab: { id: 'lab', name: '光哥實驗室', floor: 3, owner: 'guangge',
    work: { label: '幫調光路', fx: { coins: 26, energy: -14 }, lines: S('光哥：別急著走嘛，再陪我調一下，今晚不趕時間。') } },
  factory: { id: 'factory', name: '豆豆工廠辦公室', floor: 3, owner: 'doudou',
    work: { label: '幫對帳單', fx: { coins: 24, energy: -14 }, lines: S('豆豆：這張單錯了，一定又是那個白痴同事！') } },
  penthouse: { id: 'penthouse', name: '貝貝智慧豪宅', floor: 4, owner: 'beibei',
    work: { label: '幫測智慧家居', fx: { coins: 34, energy: -10 }, lines: S('貝貝：幫我看窗簾有沒有聽懂人話。\n旁白：窗簾開了，掃地機器人哭了。') } },
  rooftop: { id: 'rooftop', name: '屋頂 AI 工作室', floor: 5, owner: 'taoshu',
    work: { label: '幫標註資料', fx: { coins: 22, energy: -10 }, lines: S('桃叔：這張是貓還是饅頭？標準答案是都可以吃。') } },
  police: { id: 'police', name: '隔壁派出所', floor: 0 },
};
