# ナンバーブラフ / Number Bluff

数字推理・ブラフのカードゲーム。**GitHub側でゲーム本体を実装し、AI Studioにはマルチプレイ接続とGRAVITY向け最適化だけを引き継ぐ**構成です。外部ローダーだけを作る計画ではありません。

## 実装範囲と未接続部分

- 36枚デッキ、特殊4種の計算、ライフ3、脱落、再戦、同じ部屋内の勝数、1人対1〜7体のBOTを純粋エンジンで実装。
- 2〜8席、自分のカードを伏せた画面、宣言と「グラビティ！」、数字パッド、遊び方・36枚のカード図鑑、BOT難易度を備えるゲーム画面。
- **共有ルーム・オンライン参加・SDK連携はまだ未接続**。公開URLや単一HTMLがあってもマルチプレイ完成にはなりません。
- UI統合、CI、公開配信、AI Studio / GRAVITY実機確認はそれぞれ別の検証工程です。最終検証結果はリリース時の報告で確認してください。
- 公開ルーム一覧、別の「ランキング挑戦」モード、永続ランキングは追加しません。

## ローカル確認

Node.js 18以上。外部依存のインストールは不要です。

```sh
npm test
python3 -m http.server 8000
# http://localhost:8000/ をブラウザで開く
node tools/build-single-html.mjs
# ai-studio.html が生成される
```

`engine.js` は副作用のないゲーム状態遷移、`scheduler.js` は取り消し可能なBOT予約、`app.js` は画面操作です。厳密なルール・APIは [CORE_API.md](CORE_API.md)、AI Studioへの依頼内容と未検証SDK情報は [AI_STUDIO_HANDOFF.md](AI_STUDIO_HANDOFF.md) にあります。

## 単一HTMLの受け渡し

`ai-studio.html` はHTML/CSS/全実行JavaScriptをインライン化します。画像・フォントは所有リポジトリの `https://tanabe0422.github.io/number-bluff/assets/` への絶対URLにします。外部JavaScript CDN、秘密鍵、追加バックエンドは不要です。ビルダーは未解決script、相対素材URL、第三者素材URLを検出して停止します。

生成物ではなく原本を編集し、変更後はテスト・ビルド・ブラウザ確認を再実行してください。GitHub Pages側の素材が公開されているかは、ビルドと別にHTTPで確認が必要です。

## AI Studioで追加する部分

SDKユーザーと席の対応、ルームIDによる作成/参加、ホスト権威の状態同期、操作検証と重複排除、入退室/再接続、GRAVITY WebView調整です。ホストだけがBOTと乱数を動かし、参加者は表示と入力要求を担当します。

ユーザー提供のSDK回答は未検証です。特に一斉配信だけの場合、画面で自分の札を隠しても通信上の秘匿性は保証できません。「チート防止済み」「無制限無料」などの表示はしません。`save_data`不可という提供情報に従い、勝数は部屋内のみとし永続保存しません。

## 素材

独自の生成イラストと背景を使用し、参考画像や原作ロゴは配布しません。生成素材の来歴は `assets/mascot-provenance.json`、フォントのライセンスは `assets/OFL-MochiyPopOne.txt` を参照してください。
