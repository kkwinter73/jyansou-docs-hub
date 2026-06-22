# アーキテクチャ設計

対象: ワークスペース全体のリポ依存関係と境界。
関連決定: [ADR-0001](../decisions/0001-multi-repo.md) [ADR-0002](../decisions/0002-pure-core-engine.md) [ADR-0003](../decisions/0003-frontend-stack.md)

## 依存方向（一方向のみ）

```
  web  ──depends on──▶  core
 (UI)                  (純粋ロジック)

  server(将来) ──depends on──▶  core   ← 同じ core を共有（ADR-0002）

  core  ──depends on──▶  (なし: 標準ライブラリのみ)
```

- **逆流禁止**: `core` は `web`/`server` を import しない。`core` は DOM / React / `Math.random` / `Date` / fetch / localStorage に依存しない（[ADR-0002](../decisions/0002-pure-core-engine.md)）。
- この制約は rule（[typescript ルール](../../templates/.claude/rules/typescript.md)）と lint で検出する。`core` の `package.json` には実行時依存を置かない。

## 各リポの責務

| リポ | 持つもの | 持たないもの |
|---|---|---|
| `core` | 牌/手牌/牌山モデル、`apply(state, action)`、和了形判定、待ち列挙、役判定、符・点数計算、seed可能PRNG | 描画、入力、時刻、ネットワーク、永続化、乱数源(seed生成) |
| `web` | React UI、入力ハンドリング、アニメ、CPU思考の起動、seed生成、`core` の状態を保持・描画、（将来）サーバ通信 | ルール判定そのもの（必ず `core` に委譲） |
| `server`(将来) | 権威ある対局進行、seed秘匿、複数クライアント同期、`core` で判定 | （`core`にあるルールを再実装しない） |
| `docs-hub` | 設計・決定・契約・共通ハーネス部品の原本 | アプリのコード |

## core の公開API（境界の契約）

`web`/`server` は `core` の**この入口だけ**を使う（内部表現に依存しない）:

- 型: `GameState`, `Action`, `GameEvent`, `Tile`, `Meld`, `WinResult`
- 関数:
  - `createGame(config, seed): GameState` — 配牌済み初期状態
  - `legalActions(state, seat): Action[]` — その席が今打てる合法手
  - `apply(state, action): { state, events }` — 状態遷移（不変、[ADR-0006](../decisions/0006-immutable-state-reducer.md)）
  - `evaluateWin(hand, melds, winTile, context): WinResult | null` — 役・符・点数（Phase 2-3）
- 設計詳細: [core-domain-design](core-domain-design.md), [game-flow-design](game-flow-design.md), [yaku-scoring-design](yaku-scoring-design.md)

## CPU（対戦相手AI）の置き場所

CPUの思考は**ルールではなく戦略**なので `core` の必須APIには入れない。`legalActions` が返す合法手から1つ選ぶ純粋関数 `chooseAction(state, seat): Action` として、`core` 内の独立モジュール（`core/src/ai/`）に置く。`web` がターン制御の中で呼ぶ。強さの差し替え（ランダム/ベタオリ/向聴ベース）はこの関数の実装差で表現する。

## 状態同期モデル（オンライン化の布石）

- ローカル（シングル）: `web` が `GameState` を保持し、自分とCPUの `Action` を `apply` で進める。
- オンライン（将来）: `server` が権威 `GameState` と seed を保持。`web` は予測 `apply`（楽観更新）→ サーバ確定 state で置換。`core` が両側で同一なので判定がズレない（[ADR-0002](../decisions/0002-pure-core-engine.md), [ADR-0007](../decisions/0007-seedable-prng.md)）。
- 各プレイヤーには**自分から見える state**（他家の手牌は伏せる）だけを渡す射影関数 `viewFor(state, seat)` を用意し、クライアントに全情報を送らない設計にする（不正防止）。
