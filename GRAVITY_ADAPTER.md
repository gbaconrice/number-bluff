# GRAVITY room adapter: implementation and verification boundary

`gravity-room-adapter.js` is an isolated UMD module, `NumberBluffGravity` in a browser and `require('./gravity-room-adapter')` in Node. It contains no imports, external services, credentials or persistent storage. It is not proof of live GRAVITY connectivity.

## Supplied SDK contract and assumptions

The implementation follows SDK examples and field descriptions supplied by the user from AI Studio, not independently obtained official SDK documentation:

- `AgentSDK.user.getMyUserInfo()` → `{errno,data:{user_id,name,portrait}}`.
- `AgentSDK.room.create({max_players:8,room_permission:0})` and `.join({room_id})` → `{errno,data:{room_id,user_list}}`.
- `.receiveMessage(callback)` is registered synchronously immediately after a successful create/join response, before any other awaited work. No undocumented unsubscribe API is invented; older callbacks are fenced by generation.
- `.sendMessage({message:JSON.stringify(payload)})` broadcasts to other room members.
- SDK callbacks: `aitools_game_joinroom`, `aitools_game_exitroom`, `aitools_game_sendmsg`; trusted envelope identity is `data.user_id`, not an identity inside the JSON message.
- Self/roster image is `portrait`; join notification image is the reported misspelling `portait`. Names are `name` / event `user_name`. Only credential-free HTTPS avatar URLs are accepted. Missing/unsafe images remain null.
- AI Studio instructed using `join.data.user_list[0].user_id` as creator identity. This ordering guarantee is **not independently verified**. The adapter pins that identity for the entire session. Later roster order changes and `host_declare` messages cannot replace the pinned host. Missing ID fails closed. `resolveHost(data)` can override mapping when an authoritative SDK field becomes available.

## Browser setup

After engine, app and adapter scripts are loaded, call:

```js
const bridge = await NumberBluffGravity.install({
  sdk: window.AgentSDK,
  client: window.NumberBluffClient,
  onStatus: status => showConnectionStatus(status)
});
```

The installer configures profile and room create/join hooks. It does not create a room until the user selects create. No BOT/local fallback is installed. Its returned controller exposes `resync()`, `close()`, `getSession()`. The session returned to the UI supports `subscribe(listener)`, `send(action)`, `close()`, `resync()`, `getStatus()`.

The UI must call the old adapter's `close()` when actually leaving/replacing it, not only unsubscribe. Pending room requests must also be canceled with controller `close()` when navigation cancels them; cancellation fences late SDK responses but cannot undo an already-created native room without a verified SDK leave API. SDK native leave and callback unregister APIs are still unknown.

Host-only buttons: BOT settings/start, next round, rematch, return to lobby. All are also authorized on the host, not merely hidden from guests. Only the active human seat can declare/challenge. `player` in the command must match the SDK sender's assigned human seat. Host RNG, BOT and rule execution are the only authoritative ones.

## Liveness and explicit departure policy

- Default heartbeat: one guest ping and host snapshot every 5 seconds; 30-second inactivity timeout. These values are provisional, configurable in `createSession`, and require mobile/background and SDK rate-limit testing.
- Resync sends a fresh snapshot; duplicate/stale snapshots never rewind state. Repeated heartbeats do not restart BOT timers or re-render unchanged revisions.
- Guest exit, protocol `bye`, or inactivity during an active match **abandons that match without awarding a victory and returns remaining seats to the same-room lobby**. It never fabricates a move, silently replaces a human with a BOT, or deducts a life. Status `player-left-match-abandoned` must be shown in the UI.
- A late join waits until lobby before receiving a seat. If full, one BOT is replaced; eight humans reject extra admission. Actual native room entry is governed by the SDK.
- Host exit/timeout stops guest commands, reports `host-lost` / `host-timeout`, and requires explicit rejoin/new room. No untrusted automatic host election or preservation of private state is attempted.
- Returning from background should call `bridge.resync()`. If mobile timers suspend beyond timeout, the safe outcome is stopped/abandoned play, not a promise of seamless continuation.

## Information and replay boundaries

Protocol messages contain room ID, version, pinned host epoch and increasing sender sequence / state revision. Actions use authenticated envelope identity. Duplicate actions, stale revisions, old membership `bye`, canceled requests and canceled BOT callbacks are rejected or fenced. JSON messages are capped at 48,000 characters, seats at eight, avatars at HTTPS, wire history at the last 100 actions. The private deck and RNG are never serialized.

**Broadcast-only is not cheat-proof.** The wire snapshot includes all currently visible-to-others cards, and each receiving UI masks its own card. A user inspecting network payloads can see their own current card. The host also inherently knows the dealt cards. No private-message encryption or anti-cheat guarantee is claimed. Future deck cards and future RNG are not sent.

## Evidence and remaining real-device checks

`node --test test/gravity-room-adapter.test.js` uses simulated authenticated message envelopes, multiple clients, controlled timers and SDK fixtures. It tests host/guest permissions, actor spoofing, stale/duplicate messages, roster limits, BOT scheduling, resync, silent timeouts, departures, same-ID rejoin, malformed packets, profile mappings, immediate-listener events, and pending request cancellation.

These tests do not verify real SDK payloads, user-list ordering, browser background timing, native invite UI, transport delivery, SDK rate limits or multi-device GRAVITY operation. Confirm those on actual devices before marking multiplayer complete. The module does not modify the 36-card rules or persistence policy; room wins remain session-only.

## Streak scores and native ranking boundary

The rule engine carries `currentStreak` and `bestStreak` per player and captures `rankingEligible` at each start/rematch: at least two humans at match start qualify, even with BOTs present. Later elimination does not alter that qualification. Only a completed qualifying match updates human streaks: a human win increments current and possibly best; a human loss resets current only. A BOT winner in a qualifying match resets all human current streaks, but BOTs themselves never earn ranked scores. A one-human-plus-BOT match neither increments nor resets the existing qualified streak. Rounds and abandoned matches do not update it. Same-room rematches preserve streak records while recomputing eligibility for the new match; new rooms reset the records. The adapter validates nonnegative integer streak values and `currentStreak <= bestStreak` in snapshots.

According to the latest SDK explanation supplied by the user, `gameOver.score` submits that client's personal-best candidate to GRAVITY's global ranking and interrupts play with a native results popup. Submission therefore belongs to the platform/UI layer at **explicit end/leave**, not to this adapter's snapshots, match completion, rematches, disconnect handling or heartbeat. The UI captures only its own authoritative human player's `bestStreak`, and `gravity-platform.js` submits it once for that local room session. It never sends another human's score or a BOT score. Current streak may be zero after a loss while the submitted best remains positive.

GRAVITY, not an app-owned server or store, is expected to retain the personal best. No ranking-opening API was supplied, so ranking display remains native; there is no independent lobby ranking table or challenge mode. These API/retention claims come from user-provided AI Studio answers and still require actual GRAVITY verification. Do not treat mocked postMessage tests as proof of ranking persistence or native UI behavior.

## オンライン手番期限

オンライン・ローカルBOT練習ともに人間の手番は30秒。残り10秒から小さな残秒表示の色が変わります。入力中の値は送信せず、時間切れはホストが前の宣言＋1（初手1）を一度だけ確定します。BOTの思考時間は変更しません。ローカル練習では端末内で同じ最小宣言を確定します。遊び方表示中でも期限は進み、バックグラウンド復帰時には期限を再確認します。

期限はホストが手番トークン（セッション・試合・ラウンド・手番・履歴位置）と共に管理。再同期・プロフィール更新では延長しません。手動入力もホスト到着時点で期限確認し、期限以上なら自動宣言を優先します。ゲストの残秒は送信されたホスト時刻との差から表示する目安で、通信遅延はあり得ます。バックグラウンド停止中のタイマー実行は保証せず、復帰・受信・再同期時に期限を確認します。既存のホスト切断停止／参加者退出による無勝敗中断を維持します。

開発上の境界：最大安全整数の宣言後は有効な＋1を作れないため、時間切れ時は勝敗・連勝を付けずロビーへ戻します（自動チャレンジや数値オーバーフローはしません）。実GRAVITY上の遅延・バックグラウンド挙動は未検証です。

### ラウンド結果の自動進行
計算・公開演出の標準再生時間を確保した後、10秒で次のラウンドへ進みます。オンラインはホストだけが期限を管理し、手動の「次へ」もホスト限定です。ゲストは残秒を表示するだけです。ホストが演出を早送りしても共有の自動期限は短縮しません。ローカルBOT練習も同じです。優勝結果（試合終了）では自動再戦しません。背景タブではタイマー実行が遅れるため、復帰・再同期時にも期限を判定します。
