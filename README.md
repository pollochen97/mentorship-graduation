# ENG曼陀號結業分享

11/07 Sat. 結業發表活動網站：一本可以翻頁的航海日誌，在現場投影。來賓用手機掃 QR code 就能發彈幕。

- 需求規格書：[`docs/spec.md`](docs/spec.md)
- 視覺與互動參考：[`docs/flipbook-demo.html`](docs/flipbook-demo.html)（直接用瀏覽器開啟）
- 技術：Next.js（App Router）· Vercel · Supabase（Postgres / Realtime Broadcast / Storage）

## 本機開發

需要 Node.js 22 以上（`@supabase/supabase-js` 的最低需求）。有裝 nvm 的話，執行 `nvm use` 就會切到 `.nvmrc` 指定的版本。

```bash
npm install
cp .env.example .env.local   # 前端開發保持 NEXT_PUBLIC_USE_MOCK=1，不用填 Supabase
npm run dev                  # http://localhost:3000
```

| 指令                | 用途                                |
| ------------------- | ----------------------------------- |
| `npm run lint`      | ESLint                              |
| `npm run typecheck` | 先產生 Next.js 路由型別，再跑 `tsc` |
| `npm run format`    | Prettier 排版                       |
| `npm run build`     | 正式建置（PR 前請先跑過）           |

> 這是 **Next.js 16**，有不少和舊版不同的地方，例如 middleware 已改名為 `proxy.ts`。寫程式前請先看 `node_modules/next/dist/docs/`（見 `AGENTS.md`）。

## Supabase

資料表、限流 function、Realtime 權限和 Storage bucket 都寫在 `supabase/migrations/`，不要在 Dashboard 上手動改。Supabase CLI 已經在 devDependencies 裡，用 `npx supabase` 執行。

### 本機（需要 Docker）

```bash
npx supabase start      # 啟動本機 Supabase 並套用所有 migrations，最後會印出 URL 和 key
npx supabase db reset   # 改了 migration 後：清空本機資料庫，重新套用
npx supabase test db    # 跑 supabase/tests/ 裡的資料庫測試
npm run db:types        # 改了資料表或 function 後：重新產生 lib/supabase/database.types.ts
npx supabase stop
```

要讓網站連本機 Supabase，把 `npx supabase status` 印出的 API URL、anon key、service_role key 填進 `.env.local`，並設 `NEXT_PUBLIC_USE_MOCK=0`。

### 雲端專案

```bash
npx supabase login                               # 第一次使用：瀏覽器登入
npx supabase link --project-ref <project-ref>    # 輸入資料庫密碼；project-ref 在 Dashboard 網址裡
npx supabase db push --dry-run                   # 先看會套用哪些 migration
npx supabase db push
```

新增 migration：`npx supabase migration new <名稱>`，寫好後先在本機 `db reset`、`test db` 通過再發 PR。合併後由一個人執行 `db push`，不要多人同時推。

### 給 API route 用的 helper（`lib/supabase/`）

| 檔案           | 內容                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `server.ts`    | `supabaseAdmin()`：service role client，只能在伺服器使用                                       |
| `posts.ts`     | `postDanmaku()`、`postNote()`：呼叫限流 function，回傳資料或錯誤碼（可直接給 `errorResponse`） |
| `broadcast.ts` | `broadcast(event, payload)`：寫入成功後通知投影端                                              |
| `rows.ts`      | 資料列（snake_case）轉成 API 格式（camelCase）：`toNote()`、`toDanmaku()`、`toSettings()`      |
| `browser.ts`   | 瀏覽器用的 anon client，只給 `lib/realtime.ts` 訂閱用                                          |

## 開發流程

1. 到 Project board 認領 issue：指派給自己，狀態改成 In processing。
2. 開分支 `feat/<issue編號>-<名稱>`，例如 `feat/10-sailors`。
3. **只改 issue 列出的「負責的檔案」**。需要動到別人的檔案時，先在該 issue 留言。
4. 發 PR 時寫上 `Closes #<編號>`，在 Vercel preview 上驗收後用 squash merge 合併。
5. P0 完成後，介面就凍結了：`lib/schemas.ts`、hook 簽名、Broadcast 事件名稱都不能隨意更改。要改時，開一個標 `contract` 的 PR，並在群組通知大家。
6. 前端開發時設 `NEXT_PUBLIC_USE_MOCK=1`，不連 Supabase 也能跑。
