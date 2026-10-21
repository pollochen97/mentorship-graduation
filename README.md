# ENG曼陀號結業分享

11/07 Sat. 結業發表活動網站：一本可以翻頁的航海日誌，在現場投影。來賓用手機掃 QR code 就能發彈幕。

- 需求規格書（共用文件）：https://claude.ai/artifact/29Cmfe3Axhm7beQbgJYzro
- 視覺與互動參考：[`docs/flipbook-demo.html`](docs/flipbook-demo.html)（直接用瀏覽器開啟）
- 技術：Next.js（App Router）· Vercel · Supabase（Postgres / Realtime Broadcast / Storage）

## 本機開發

需要 Node.js 20.9 以上（建議 22）。

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

## 開發流程

1. 到 Project board 認領 issue：指派給自己，狀態改成 In Progress。
2. 開分支 `feat/<issue編號>-<名稱>`，例如 `feat/10-sailors`。
3. **只改 issue 列出的「負責的檔案」**。需要動到別人的檔案時，先在該 issue 留言。
4. 發 PR 時寫上 `Closes #<編號>`，在 Vercel preview 上驗收後用 squash merge 合併。
5. P0 完成後，介面就凍結了：`lib/schemas.ts`、hook 簽名、Broadcast 事件名稱都不能隨意更改。要改時，開一個標 `contract` 的 PR，並在群組通知大家。
6. 前端開發時設 `NEXT_PUBLIC_USE_MOCK=1`，不連 Supabase 也能跑。
