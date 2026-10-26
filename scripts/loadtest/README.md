# 彈幕壓力測試（#21）

`danmaku.mjs` 模擬活動現場的來賓用手機送彈幕，確認 API、限流、Realtime 和投影端撐得住約 300 人（規格書第 1 節）。

## 模擬方式

每位虛擬來賓都像一支真的手機：

1. 在 `--ramp` 秒內陸續進場（掃 QR code）。
2. 先開 `/danmaku`，從 `proxy.ts` 拿到自己的簽章 `cid` cookie，所以每個人的 `cid` 都不一樣，不需要 `CID_SECRET`。
3. 看頁面、打字 5–20 秒後送出第一則，之後平均每 `--think` 秒送一則（指數分布，最短 5 秒）。
4. 收到 429 時，像表單倒數那樣等 `Retry-After` 秒，再隔一下重送同一則。
5. 有 `--burst-at` 時，全場在那一秒之後的 10 秒內一起送一則，模擬主持人說「大家一起送祝福！」。

另外有一支監聽程式像投影端一樣訂閱 `live` 頻道，量每則彈幕從送出到投影端收到要多久、有沒有漏掉。

彈幕的名字都是 `壓測<編號>`，跑完可以一次刪掉（見下方「清理」）。

## 選項

| 選項          | 預設     | 說明                                                                                                 |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `--url`       | （必填） | 網站網址，例如 `http://localhost:3000` 或 preview 網址                                               |
| `--users`     | 300      | 來賓人數                                                                                             |
| `--duration`  | 300      | 持續秒數                                                                                             |
| `--ramp`      | 60       | 幾秒內全部進場                                                                                       |
| `--think`     | 40       | 每人平均幾秒送一則                                                                                   |
| `--burst-at`  | 無       | 第幾秒全場一起送一則                                                                                 |
| `--ips`       | 0        | 只在本機有效：把來賓分散到幾個假 IP（`x-forwarded-for`）。0 表示全部同一個 IP；Vercel 會蓋掉這個標頭 |
| `--no-listen` |          | 不訂閱 Realtime                                                                                      |
| `--out`       |          | 把詳細結果寫成 JSON                                                                                  |

監聽投影端要用 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`（公開值）。

## 本機執行

```sh
npm run build && npx next start -p 3000      # 連本機 Supabase 的 .env.local
node --env-file=.env.local scripts/loadtest/danmaku.mjs --url http://localhost:3000 --burst-at 150
```

用正式版（`next start`），不要用 `next dev`：dev 模式每個請求都比較慢，量到的不是線上的延遲。

## 在 preview 環境執行

Preview 和正式站連的是**同一個 Supabase 專案**，所以壓測的彈幕會真的寫進資料庫，也會廣播到投影端的 `live` 頻道。

1. **開跑前先在群組通知**：大約幾點、跑 5 分鐘，這段時間投影端和後台會出現大量「壓測」彈幕。
2. 如果 preview 有開 Vercel 的 Deployment Protection，到 Vercel 專案 Settings → Deployment Protection 建立 Protection Bypass for Automation，把 secret 放進 `VERCEL_AUTOMATION_BYPASS_SECRET`。不要寫進 repo。
3. 在另一台電腦用 `/?key=SCREEN_KEY` 打開 preview 的投影端，全螢幕，跑的時候看畫面是否流暢。
4. 執行：

   ```sh
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co \
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
   VERCEL_AUTOMATION_BYPASS_SECRET=<secret> \
   node scripts/loadtest/danmaku.mjs --url https://<preview 網址> --burst-at 150 --out loadtest-preview.json
   ```

5. 跑完到 Supabase Dashboard → Realtime → Reports／Logs，確認沒有超過上限的錯誤。
6. 清理（見下方），再把結果貼回 #21。

## 清理

在 Supabase Dashboard 的 SQL Editor 執行：

```sql
delete from public.danmaku where name like '壓測%';
```

## 結果怎麼看

| 項目                       | 參考標準                                     |
| -------------------------- | -------------------------------------------- |
| 其他錯誤（非 201、非 429） | 0，或低於 1%                                 |
| 送出延遲 p95               | 1 秒以內                                     |
| 投影端漏掉                 | 0                                            |
| 投影端斷線                 | 0 次                                         |
| Realtime 訊息量            | 最忙的一秒 × 訂閱數，低於免費方案每秒 100 則 |

**429 要分開看**：

- 「個人限流」是同一支手機 5 秒內又送，或 10 分鐘超過 20 則，是正常保護。
- 「IP 限流」是同一個 IP 每分鐘超過 120 則（`post_danmaku` 的 `p_ip_per_minute`）。現場大家連同一個 Wi-Fi，可能共用一個對外 IP，這個比例高就代表全場的上牆量被卡住了。

Supabase 免費方案的 Realtime 上限：同時 200 條連線、每秒 100 則訊息。每則彈幕送到每個訂閱者都算一則，所以訊息量是「上牆量 × 訂閱數」。訂閱的只有投影端 1–2 台，再加上壓測時的這支監聽程式。超過時 Supabase 會把連線斷掉，投影端會改成輪詢（#18）。
