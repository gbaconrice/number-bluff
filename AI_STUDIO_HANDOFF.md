# AI Studio 引き継ぎ — visual-v3 UI更新・既存通信を保持

## 目的と納品の境界

GitHub側の36枚ルールを維持し、今回のvisual-v3はフロントエンド・素材・導線の更新として適用する。ユーザーにはAI Studioで通信を組み込んだHTMLがあるが、その最新版は今回の作業者には未提供。**既存のSDK通信・状態同期を保持してUI差分を統合する**。通信部分やゲームエンジンを作り直す依頼ではない。

- 入力: `ai-studio.html`（HTML/CSS/全実行 JavaScript を一体化）。画像・フォントだけを `https://tanabe0422.github.io/number-bluff/assets/` から絶対 URL で読む。
- 原本: `index.html`, `styles.css`, `background-motion.css`, `background-motion.js`, `engine.js`, `scheduler.js`, `app.js`。修正は原本へ戻し、`node tools/build-single-html.mjs` で再生成する。生成物だけを直して原本と乖離させない。
- この納品ベース自体にSDK通信は含まない。ユーザーの既存AI Studio版の完成度をこのベースから判断しない。対戦中の切断問題は未解決の確認事項であり、実際の最新版HTMLと再現条件を確認するまで修正済みとしない。
- SDK と実機の動作は未検証。Node テストの成功と、AI Studio / GRAVITY での成功を混同しない。
- 外部バックエンド、新規アカウント、API キー、外部コード提供をユーザーへ要求しない。SDK の実機仕様が不足する場合は不足点を具体的に報告し、無断で別サービスへ移行しない。


## 最新の導線・プロフィール・表示契約（この節を優先）

- ホーム「ゲームをはじめる」= **ホストとしてルームを作成 → 人間の参加待ち**。BOTは任意で追加する。BOT専用スタートや「練習」への分岐に変えない。
- ホーム「ルームに参加」= **ルームIDを入力して既存ルームへ参加するだけ**。参加画面に新規作成・ローカル練習・BOT戦の別導線を入れない。
- ホームの設定ボタンは削除。動き/軽減の設定UIは一切追加しない。背景は自動演出し、OSの `prefers-reduced-motion` とページ非表示を内部で尊重する。背景モジュールにゲーム進行を依存させない。
- 招待UIはロビー内だけ。遊び方・カード図鑑・結果等へ常駐する全画面オーバーレイで覆わない。SDK側の招待オーバーレイがある場合も画面切替時の解除を実APIで確認する。
- 実在する人間には **GRAVITYプロフィールの名前とアバター** を使う。キャラクターの名前・絵はBOT専用。プロフィール画像が取得できない/読込失敗の場合は中立な人型プレースホルダーにし、BOTへ見せかけない。

### 現行ローカルAPI（SDK APIではない）

```js
// この3つは納品UI自身のAPI。SDKの呼出し方法を示すコードではない。
NumberBluffClient.setRoomAdapterExpected(true);
NumberBluffClient.configureLocalProfile({ name: normalizedName, avatarUrl: normalizedAvatarUrl });
NumberBluffClient.configureRoomActions({
  create: async () => existingAdapterCreateRoom(),
  join: async roomId => existingAdapterJoinRoom(roomId)
});
```

`existingAdapterCreateRoom/JoinRoom` は説明用仮名で、SDKにその関数があるとは主張しない。既存SDK層に接続し、返り値を `connect(adapter)` が受け取れるアダプターに正規化する。既存層が自らconnectする場合は二重接続しない。

- `configureRoomActions({create,join})`: 両方関数必須。`create()` / `join(roomId)` はPromise対応。設定すると自動的にSDK接続必須モードになる。SDK初期化開始時点から `setRoomAdapterExpected(true)` を呼び、未準備/失敗時にローカル戦へフォールバックさせない。
- 素の検証ベースのみ、フック未設定・接続必須でない場合に、ホスト1人+BOT0体のローカル待機ロビーを作る。架空のルームIDを表示しない。これはプラットフォーム上の代替通信ではない。
- `configureLocalProfile({name,avatarUrl})`: transport接続前、かつ対戦開始前に設定。nameは空白除去後1文字以上、最大24文字へ制限。avatarUrlは資格情報を含まないHTTPS URLだけを採用し、それ以外はnull。SDKにおけるアバターの元フィールド名は未確認なので推測しない。実APIの返答から既存SDK層が正規化する。
- リモートDTOには認証済み本人席の `viewerId`、人間席の `name` / `avatarUrl`、明示的な `hostId` を含める。viewerIdは実在人間席と一致必須。hostIdが欠落する場合はホスト権限を推定しない。
- リモートのBOT追加/削除/難易度/見た目/開始は `adapter.send` の `addBot`, `removeBot`（target）, `setDifficulty`（target,difficulty）, `setBotAvatar`（target,avatar）, `startGame` 意図として送る。UIはhostIdで制限するが、**ホスト側も送信者認証と権限を再検証**する。これらは独自コマンド名でありSDKメソッドでも、全てがengine.dispatchへ直接渡せるという意味でもない。アダプターが検証して対応するエンジン操作へ変換する。

### GRAVITY上端の除外領域・viewport

実SDKが提供する `topExclusionHeight` を確認し、その単位、座標系、safe-areaを含むか、変更通知の方法を先に特定する。APIの所属や呼出し形式、px単位とは仮定しない。統合側からUIへ渡す正規化insetフックは、検証済みの **非負有限CSS px値** を受け取る契約として設計し、SDK値をそのままCSSへ差し込まない。既存のviewport調整がある場合はそれを尊重して一か所で合成する。

除外領域がOS safe-areaを包含するならmax、独立なら必要な差分だけ加えるなど、実測に基づき計算する。`env(safe-area-inset-top)` とSDK insetの二重加算は禁止。paddingを加えた上に無調整の `min-height:100dvh` を残して縦方向にはみ出させない。利用可能高さを差し引くかborder-box内で一度だけ確保し、上部UI・下部ボタン・ガイド・招待の非重複を狭い実機で確認する。画面復帰・回転・キーボード表示時も再検証する。この段落は統合要件であり、未提示のSDK APIやinsetフックが実装済みという主張ではない。

## AI Studioにそのまま渡す依頼文

> 添付のvisual-v3単一HTMLはフロントエンド更新用です。あなたが既に組み込んだ最新のSDK・ルーム通信・権威状態同期・認証・入退室処理は保持し、その版へ画面、素材、背景モジュールと下記導線の差分だけを統合してください。未接続ベースで既存通信を上書きしないでください。
>
> ホーム「ゲームをはじめる」はホストのルーム作成→参加待ちです。BOTは任意追加。「参加」はID参加だけにし、作成や練習を入れないでください。人間の名前/画像は実GRAVITYプロフィールからname/avatarUrlへ正規化、マスコットはBOT専用です。ホーム設定と動き設定は不要。背景は自動でOSの動き軽減を尊重します。招待UIはロビー内限定で、ガイドを覆わないようにしてください。
>
> NumberBluffClientのconfigureRoomActions({create,join})、setRoomAdapterExpected(true)、configureLocalProfileを既存の認証済みSDK層へ結んでください。viewerIdとhostIdを正しく供給し、ホストだけがBOT設定と開始を確定してください。SDK待ち/失敗時にローカル戦へ逃がさないでください。SDK APIやアバターフィールド、topExclusionHeightの単位を推測せず、実環境で確認し、上端の除外領域とsafe-areaを二重加算しないでください。
>
> engine.jsの36枚ルール・BOT情報制限・勝敗・部屋勝数は変更しないでください。対戦中の切断問題は残る確認事項です。最新の統合済みHTMLで再現を確認し、既存同期を保ったまま原因と修正を検証してください。未検証で「切断修正済み」「GRAVITY完成」としないでください。単体テスト、複数実端末、作成/参加/ホスト権限/退出/復帰、ガイド中の招待非表示、全画面の余白を分けて検証結果を報告してください。

## SDK 情報の出所: ユーザー提供回答（公式確認済みではない）

2026-10-26 にユーザーが提示した AI Studio の回答による情報。以下を実装契約と断定せず、AI Studio の実際の SDK / 実行環境で名前・引数・戻り値・認証保証・制限を確認する。

| 提供された内容 | 必要な確認 |
|---|---|
| 単一 HTML が必要、画像は絶対 URL | HTML サイズ、外部画像・フォント、CSP、WebView の制限 |
| `window.AgentSDK.user.getMyUserInfo` → `{errno,data:{user_id,name}}` | 呼出し形式、非同期形式、失敗、ID の安定性 |
| `room.create({max_players:8,room_permission:0})` | 戻り値の room ID / host ID、権限値の意味、満員処理 |
| `room.join({room_id})` | 戻り値、既存メンバー一覧、再接続の扱い |
| `receiveMessage` の種別 `aitools_game_joinroom`, `aitools_game_exitroom`, `aitools_game_sendmsg` | 正確な登録形式、解除方法、イベント順序、重複・欠落、送信者認証 |
| イベントの `data.user_id`, `user_name`, `msg_data`（JSON） | スキーマ、最大長、送信者 ID が SDK により保証されるか |
| `sendMessage({message:JSON.stringify(...)})` は他参加者へ一斉配信、個別送信なし | 自分への配送有無、容量、頻度、順序、再送、配信保証 |
| `save_data` 利用不可 | 永続ランキングを実装しない。部屋存続中の通算勝利数だけ |
| 無料で利用できるという案内 | 正確な無料枠、人数、配信頻度、容量、商用条件は未確認。無制限とは表示しない |

`room` 等の名前空間の完全なパスや Promise / callback 形式は、上表から推測して確定しない。未提示の unsubscribe / reconnect / host-migration API を捏造しない。

## 変更してはいけないゲーム契約

詳細は `CORE_API.md` とテストが正本。

- 物理カード全36枚: 1〜5各4、10×3、15×2、20×1、0×3、−5×2、−10×1、×2・MAX→0・?・リセット0各1。カード ID の重複・消失を許さない。
- 判定順: `?` で残り山から1枚（空なら捨て札から）追加 → MAX→0で最大の正数 **1枚だけ** を0化 → 数字の和 → ×2（負の合計も倍）。追加カードの特殊効果も適用。
- リセット0は合計を0にするカードではない。そのラウンド解決後に全36枚を回収して再シャッフル。通常は使用札を捨て札へ。場のカードを山補充に混ぜない。
- ロビーはホスト1名+BOT0〜7体まで（BOT全削除可）、開始は人間＋BOT合計2〜8席、ライフ3、0で脱落。SDK の `max_players` は人間接続枠であり、BOTはアプリ内仮想席。BOTをSDKユーザーとして参加させない。人間が入る際に合計8席を超えないよう、開始前に入場を拒否するかBOTを減らすポリシーを実装する。
- 自分のカードだけ対戦中は伏せる。他の生存者のカードは見える。公開時は全員分を見せる。
- 宣言は安全な0以上の整数・前の宣言より大きい。最初の宣言前はチャレンジ不可。宣言 > 実合計なら宣言者負け、宣言 ≤ 実合計ならチャレンジャー負け（同値も後者）。
- 次ラウンドは敗者が生存なら敗者から、脱落なら次の生存席から。新ゲームは先頭席/ホスト開始が現在の既定。
- 最後の生存者の部屋内勝数を一度だけ加算。再戦はライフを戻し、同じ部屋内の勝数を保持。別途「ランキング挑戦」モードや公開ルーム一覧は追加しない。
- BOTは自分のカード・真の合計・山順を参照しない。`chooseBotAction(botView(state,id), rng)` を使う。難易度は推論・閾値の差であり情報透視ではない。

## 現在のUI接続口（SDKとは別のローカルAPI）

`window.NumberBluffClient.connect(adapter)` は `adapter.subscribe(onSanitizedPublicView)` と `adapter.send(action)` を要求する。`subscribe` は解除関数を返す契約とし、`disconnect()` でUIをホームへ戻す。これは通信実装そのものではない。SDKから届いた未検証JSONや完全stateをそのまま渡さない。

現行UIは受信DTOの `viewerId` が実在する人間席と一致することを検証し、本人表示と送信actionのplayerへ反映する。ローカル新規ロビーでは `p1` に戻す。ただしDTOの整合性検査はSDK認証の代わりではない。オンライン化時は **認証済み本人と実際のviewerIdの結び付け** をアダプターで保証し、ホストはpayloadのplayerを信用せず認証済み送信者の席で上書きする。全員をp1として扱わない。オンラインの開始・BOT編集・次ラウンド/再戦もホスト権限のコマンドへ接続し、クライアントのローカル遷移へ逃がさない。

## 権威状態とアダプター境界

1. ホストだけが非公開の完全 state、乱数、物理デッキ、BOT、ゲーム遷移を管理する。クライアントは表示と入力要求のみ。`createLobby` は現状「人間1名+BOT」のオフライン生成器であるため、実在の SDK ユーザーを席へ結ぶロビー・入退室層はSDKアダプターの責任（既存統合版にある処理を保持し、不足分だけ補う）。接続済み人間をBOTで偽装しない。
2. SDK が保証する送信者 `data.user_id` と、ホストが保持する `userId → seatId` の対応で操作主体を決める。JSON 内の `player`, `user_id`, `hostId` は認証根拠にしない。表示名は `textContent` で出し、HTMLとして挿入しない。
3. 独自プロトコルには `protocolVersion`, `roomSessionId`, `matchId`, `commandId`, `expectedRevision` を持たせる。セッションとスキーマ・サイズを検証し、`(認証済みsenderId, commandId)` の処理済み記録で重複を抑止。revisionだけでは重複ID対策の代わりにならない。
4. ホストは席・在室・生存・手番・phase・整数・権限を検証してから `dispatch(state,{...action,player:resolvedSeat,revision:expectedRevision},rng)`。`nextRound` / `rematch` / 開始 / BOT設定はホスト権限とし、参加者の要求だけで勝手に進めない。無効・古い要求は state を変えない。
5. ホストのみ1つの `NumberBluffScheduler` を使う。BOT callback はセッション・match・revisionを再検証し、退出/再戦/中断時に `cancel()`。クライアント側ではBOTタイマーを動かさない。
6. ホストの更新はローカル画面へも直接反映する（「他人だけ配信」の場合は自分への受信を待たない）。参加者は認証されたホストからの同一セッション・同一matchの新しいrevisionだけ適用。順番の逆転・二重配送を無視し、欠落時の再同期を設計する。

### 秘匿性の制約 — 安易な「不正防止済み」を禁止

`publicView(state, viewerId)` は描画用DTOで、本人のカードは null、山順は含めない。**完全stateをそのまま配信してはならない**（山順まで漏れる）。ただし個別配送なしの一斉配信では、受信者別DTOを全員へ配っても他人向けDTOから自分のカードを読める。全員分の現在手札を配信してUIだけで隠す案も同じ問題がある。

したがって提示SDKの機能だけで「本人のカードが端末に届かない」「チート不能」は保証できない。通常の画面表示上の伏せ札と、通信上の秘密を区別する。暗号学的な手札秘匿が必須なら、SDKで認証済みの個別通信または信頼できる実行基盤が提供されるかを確認してから方針決定する。勝手な暗号プロトコルや外部サーバーで解決済みとしない。ホスト自身も権威stateを保有するため、悪意あるホストに対する公平性は保証しない。

### レビュー用擬似コード（実SDKコードではない・実行未検証）

```text
onTransportEvent(verifiedEvent):
  reject malformed / oversized JSON
  if authoritativeHost and event is ACTION:
    sender = verifiedEvent.authenticatedSenderId  // SDK実機で保証を確認
    seat = admittedSeats.get(sender)               // payload.playerを使わない
    check session, match, commandId, exact expectedRevision
    check membership, seat, phase, turn and host-only operations
    if command already processed: return same acknowledgement, do not apply again
    next = NumberBluff.dispatch(state, resolvedAction, hostRng)
    if next === state: reject without mutation
    remember command; state = next
    render NumberBluff.publicView(state, hostSeat)
    broadcast approved snapshot policy (never deck order; privacy limitation above)
    schedule at most one BOT with captured session/match/revision
  else if event is SNAPSHOT:
    accept only authenticated current host, correct session/match, newer revision
    render locally sanitized viewer DTO; never run engine/BOT transitions
```

`onTransportEvent`, `authenticatedSenderId`, ACK、snapshot は設計上の仮名。実際のSDKに存在するAPIとは主張しない。SDKメッセージハンドラーと本体の間に薄い通信アダプターを作り、純粋エンジンへSDK依存を混ぜない。

## 入退室・通信断の推奨方針（提案、未確定仕様）

- ロビーで入場済みメンバーと席対応を同期。ゲーム途中の新規参加は観戦または次ゲームまで待機とする案。途中参加で山・手札を作り直さない。
- 一時切断は入力を止め、再接続がSDKで保証される場合に同じユーザーの席を再利用して最新状態を同期。復帰期限・退出判定は実機仕様に基づき決める。無期限に無言で手番停止させない。
- ホスト退出時は **対戦を中断し勝者・勝数を作らずロビー/案内へ戻す** 方針を推奨。自動ホスト移譲は別途検証・設計しない限り行わない。
- 画面終了・部屋退出・再接続時の受信解除とタイマー解除を実APIで検証する。登録が二重にならないこと。部屋終了時に勝数は終了し、永続保存や架空のランキングを表示しない。

## AI Studio / GRAVITY での受入試験

- 実アカウント2台で作成→ID参加→同じ部屋/席/手番/結果/再戦が一致。3人以上、人間+BOT合計8席、9席目拒否、BOT追加/削除の権限制御。
- 同時押下、再送、古いrevision、他人のplayer指定、非ホストsnapshot、巨大/壊れたJSON、部屋違い、前のmatchの遅延メッセージを拒否。
- 一斉配送が自分へ届かなくてもホストが進む。ホストのBOT遷移1回だけ。複数端末がBOTを重複実行しない。
- 特殊4種と同値判定、負の合計、脱落・次手番、1勝だけ加算、再戦で部屋勝数保持。全36枚の保存則。
- 参加者退出・ホスト退出・一時切断・再接続・画面閉じ戻り・二重ハンドラー・回線遅延を試験。中断時に偽の勝者が出ない。
- GRAVITY音声ルームとの併用、縦画面/狭い端末、safe area、タップ、入力フォーカス、音声許可を奪わないこと、背景復帰、画像/フォント読込失敗を確認。
- 外部画像とフォントが実URLで200になることを確認。ローカルの素材存在やHTMLビルド成功は公開配信確認の代わりにならない。
- 実際に通った試験・未実施・失敗・既知の秘匿制約を記録してから納品。通信未接続の単体HTMLを「マルチプレイ完成」と呼ばない。
