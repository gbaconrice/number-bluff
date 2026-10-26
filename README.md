# ナンバーブラフ — visual-v3

**既存のAI Studio通信実装を保持したまま、画面・素材・導線を更新するためのベースです。** ユーザーの最新SDK統合済みHTMLは未提供のため、その通信や対戦中の切断問題を検証・修正済みとはしていません。

## 最新の操作仕様

- 「ゲームをはじめる」→ホストとしてルーム作成→参加待ち。BOTは任意追加で、BOT専用スタートではありません。
- 「ルームに参加」→ルームID参加のみ。作成・練習・BOT戦の別導線は入れません。
- 人間の名前・画像はGRAVITYプロフィール、マスコットはBOT専用。SDKの実フィールドから `name` / `avatarUrl` へ正規化します。
- ホーム設定なし。動きの設定UIなし。背景は自動演出し、OSの動き軽減とページ非表示を内部で尊重します。
- 招待はロビー内だけ。遊び方やカード図鑑を常駐オーバーレイで覆いません。

36枚デッキ、特殊4種、ライフ3、2〜8席、BOT、脱落・再戦・部屋勝数のエンジンを維持します。ロビーはホスト1名+BOT0〜7体、開始は2名以上。公開ルーム一覧、独立ランキングモード、永続ランキングはありません。

## 統合する境界

`NumberBluffClient.configureRoomActions({create,join})` を既存SDK層へ接続し、初期化中も `setRoomAdapterExpected(true)` でローカルへの代替起動を防止します。`configureLocalProfile({name,avatarUrl})` は接続前に設定。リモートDTOの `viewerId` / `hostId` を認証済みユーザー・席へ結び、BOT設定と開始はホストのみが確定します。

フックのない素の検証ベースだけは「開始」で人間1名・BOT0体のローカル待機ロビーを開きます。架空IDやオンライン接続成功は表示しません。実プラットフォームで未接続時のフォールバックには使いません。

詳細・コピーして渡せる依頼文は [AI_STUDIO_HANDOFF.md](AI_STUDIO_HANDOFF.md)、不変のゲームルールは [CORE_API.md](CORE_API.md)。既存通信をこの未接続ベースで上書きしないでください。

## 検証と単一HTML

Node.js 18以上、外部依存なしのテスト:

```sh
npm test
python3 -m http.server 8000
node tools/build-single-html.mjs
```

ビルダーはHTML、`styles.css` / `background-motion.css`、`engine.js` / `scheduler.js` / `background-motion.js` / `app.js`を順番通りインライン化し `ai-studio.html` を生成します。画像・フォントは `https://tanabe0422.github.io/number-bluff/assets/` の絶対URLです。動的な実ユーザーのプロフィール画像は、SDKから受け取るHTTPS URLで別途描画します。

外部JavaScript CDN、APIキー、別バックエンドは不要です。原本を編集し、テストと再ビルド後にブラウザ確認してください。単体テスト・UIテスト・公開素材のHTTP配信・実SDK/GRAVITY確認は別工程です。ビルド成功だけで「プラットフォーム完成」としません。

実SDKの `topExclusionHeight` の単位・safe-areaとの関係を確認し、正規化insetを一か所で適用します。二重paddingや100dvhへの余白追加によるはみ出しを防ぎ、実機で検証します。SDK情報はユーザー提供回答であり未検証。一斉配信だけでは手札の通信上の秘匿性は保証できません。無料枠無制限やチート防止済みとは表示しません。

素材来歴・ライセンスは `assets/`、特殊カード生成記録は `special-card-generation.json` を参照してください。
