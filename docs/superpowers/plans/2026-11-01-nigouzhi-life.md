# 《你購置的人生》Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出手機與電腦都能玩、部署在 GitHub Pages 的 10 人好友惡搞模擬人生遊戲。

**Architecture:** 純函式遊戲引擎（state + reducer）與 DOM 介面分離，內容全部是資料檔。引擎不碰 DOM，所以自動化 bot 能在 Node 裡跑完全部 40 關。素材和語音由 `tools/` 腳本預先產生後提交。

**Tech Stack:** TypeScript、Vite、Vitest、Playwright；Python 工具（Pillow、numpy、rembg、edge-tts、opencc、fonttools）；Web Audio 合成音樂；GitHub Actions + Pages。

**Spec:** `docs/superpowers/specs/2026-11-01-nigouzhi-life-design.md`

## Global Constraints

- repo：`hsiliang/nigouzhi-life`（public），Vite `base` 為 `/nigouzhi-life/`。
- 執行時不得載入任何外部網址（無 CDN、無 Google Fonts）。
- `Roles/` 不進 git；公開前掃描真實姓名與敏感資訊，光哥圖上的手寫簽名不得出現在任何輸出。
- 內容遵守 spec 第 2 節的「絕對不能犯的錯」。
- 第一次全破推算時間至少 65 分鐘。
- 內容量：主線 ≥ 14,000 字、每位 NPC 閒聊 ≥ 30 句、隨機事件 ≥ 80、個人結局各 ≥ 300 字、新租客 ≥ 12、冷戰組合 ≥ 8。

## Review Focus

1. `localStorage` 不可用或存檔損毀：要正常開新遊戲，不得白屏。
2. iOS 在第一次點擊前封鎖音訊：不報錯，點擊後才發聲；老闆鍵要同時停掉語音與音樂。
3. 迷你遊戲進行中切分頁或按老闆鍵：要暫停，回來可繼續。
4. 320px 窄螢幕與手機橫向：不得出現水平捲動，主要按鈕都點得到。
5. 部署在子路徑：圖片、音訊、字型都要在 `/nigouzhi-life/` 下載入成功。

---

### Task 1: 專案骨架與 repo

**Files:** Create `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `.gitignore`, `README.md`, `.github/workflows/deploy.yml`

**Produces:** `npm run dev|build|test`；Pages 部署流程。

- [ ] `git init -b main`；`.gitignore` 排除 `Roles/`、`node_modules/`、`dist/`、`.venv/`、`.DS_Store`、`test-results/`。
- [ ] 安裝 Vite、TypeScript、Vitest、Playwright，設定 base。
- [ ] `npm run build` 成功且 `npm test` 可執行。
- [ ] commit，`gh repo create hsiliang/nigouzhi-life --public --source . --push`。

### Task 2: 人物素材處理

**Files:** Create `tools/sprites.py`, `tools/sprite-boxes.json`, `public/sprites/<id>-{front,side,back}.webp`

**Produces:** 檔名以 `CharId` 命名：`guangge kaka zhuangzhuang dayi taoshu tangyuan yao panghu doudou beibei`。

- [ ] 依圖手動定義三個視角的裁切框；淺色底用邊緣洪水填色去背，光哥用 `rembg`。
- [ ] 移除所有簽名、日期、視圖文字；保留貝貝的「ok」。
- [ ] 加統一白邊，輸出高度 360px 的 webp。
- [ ] 產生接觸表確認 30 張品質，commit。

### Task 3: 遊戲引擎（TDD）

**Files:** Create `src/engine/{types,state,rng,day,systems,save}.ts`, `tests/engine.test.ts`

**Produces:**
- `newGame(hero: CharId, seed: number): GameState`
- `availableActions(s, content): Action[]`
- `applyAction(s, a, content): StepResult`（回傳新 state 與演出事件）
- `endDay(s, content): DayResult`、`starsFor(s, day)`、`chapterUnlocked(s, ch)`
- `serialize(s)`、`deserialize(str): GameState | null`、`toSaveCode`、`fromSaveCode`

測試必須涵蓋：
- [ ] 每章累積 ≥ 9 星才解鎖下一章，未達標重玩當天且不 Game Over。
- [ ] 嫉妒值爆表觸發大亂鬥後歸零到 30。
- [ ] 投訴值分級：≥ 40 便條、≥ 70 警告、≥ 85 警察帶人、100 封樓；封樓後 `buildingNo + 1`、投訴值歸 30、損失當天剩餘時段。
- [ ] 新租客：四型的正確與錯誤判定各自產生預期的獎懲。
- [ ] 冷戰：同房不共處、每天扣幸福度、調解完成後解除。
- [ ] NPC 排班穩定、胖虎低機率、桃叔失蹤期間不在場。
- [ ] 損毀存檔回傳 `null`；存檔碼往返不失真。
- [ ] 目標對象是玩家本人時不得卡關。

### Task 4: 內容資料

**Files:** Create `src/content/{characters,rooms,chapters1-4,chapters5-8,chatter,events,tenants,feuds,endings,heroAsides}.ts`, `tests/content.test.ts`

**Produces:** `content: Content`，引擎和介面共用。

- [ ] 測試內容量達標、所有引用的 id 都存在、第 N 天連續 1 到 40。
- [ ] 分檔撰寫全部文字，風格與底線依 spec。
- [ ] 每個 commit 都通過內容測試。

### Task 5: 主畫面介面

**Files:** Create `src/ui/{app,building,dialog,hud,actions,summary,title,boss,settings,album}.ts`, `src/style.css`, `src/art/rooms.ts`

**Interfaces:** 消費 Task 3 的 API 與 Task 4 的 `content`。

- [ ] 標題、選角、「你現在在上班嗎？」首次設定。
- [ ] 剖面大樓、人物行走、對話框、HUD、動作清單、日結算、圖鑑。
- [ ] 老闆鍵：`Esc` 與按鈕切換假 Excel 並靜音，暫停迷你遊戲。
- [ ] 存檔碼匯出與匯入；localStorage 失敗時退回記憶體。
- [ ] Playwright：開局、走到房間、完成一時段；320px 無水平捲動。

### Task 6: 10 個迷你遊戲

**Files:** Create `src/mini/{runner,guangge,kaka,zhuangzhuang,dayi,taoshu,tangyuan,yao,panghu,doudou,beibei}.ts`, `tests/mini.test.ts`

**Produces:** `MiniGame = { id, title, rules, run(host, ctl): Promise<number> }`，回傳 0 到 3 分；`ctl.paused` 由老闆鍵與分頁隱藏控制。

- [ ] runner 統一倒數、暫停、結算。
- [ ] 分別完成 10 個遊戲，長度 30 到 45 秒，觸控和滑鼠都能操作。
- [ ] Playwright 能啟動每個遊戲且無 console error。

### Task 7: 聲音

**Files:** Create `tools/voices.py`, `src/content/voiceLines.ts`, `public/voice/*.mp3`, `src/audio/{audio,music,sfx}.ts`

**Produces:** `audio.playVoice(id)`、`audio.bgm(track)`、`audio.sfx(name)`、`audio.muteAll(bool)`。

- [ ] 依 spec 每人 10 到 15 句，用 edge-tts 預產生並壓縮，總量 ≤ 20MB。
- [ ] Web Audio 合成 BGM 與音效，咕嚕音依角色分音高。
- [ ] 第一次手勢後才解鎖音訊，三個開關獨立且記憶。

### Task 8: 繁簡切換與字型

**Files:** Create `tools/gen-t2s.py`, `tools/gen-font.py`, `src/i18n.ts`, `public/fonts/game.woff2`

**Produces:** `tr(text: string): string`。

- [ ] 依內容實際用字產生對照表；依瀏覽器語言預設，可切換。
- [ ] 下載 jf open 粉圓（OFL），子集化；授權檔一併放入。
- [ ] 測試 `tr('你購置的') === '你购置的'`。

### Task 9: 全流程驗收

**Files:** Create `tests/bot.test.ts`, `tools/estimate-time.ts`, `tools/privacy-scan.sh`

- [ ] bot 以 10 位主角跑完 40 關並抵達各自結局。
- [ ] 推算最短通關 ≥ 65 分鐘。
- [ ] 隱私掃描、外部網址掃描通過。
- [ ] 手機與電腦尺寸 Playwright 走通，截圖人工檢視。

### Task 10: 發佈

**Files:** Modify `README.md`

- [ ] 推送並確認 Actions 成功。
- [ ] 實際打開線上網址確認資源載入。
- [ ] README 寫玩法與授權來源。
