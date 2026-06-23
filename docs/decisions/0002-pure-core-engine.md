# ADR-0002: ゲームロジックを純粋・決定論的な `core` リポに分離する

- ステータス: Accepted
- 日付: 2026-06-22（2026-06-23 粒度拡充）
- 関連: [ADR-0006](0006-immutable-state-reducer.md) / [ADR-0007](0007-seedable-prng.md) / [core-domain-design](../design/core-domain-design.md) / [game-flow-design](../design/game-flow-design.md)

## コンテキストと問題提起

麻雀のルール（牌・手牌・和了判定・聴牌/待ち・役・符・点数・局進行）は規則量が多く、正しさの担保が最重要かつ最難関の部分である。

ユーザー要件は「シングルプレイ（対CPU）を先に作るが、オンライン対戦も見据える」（[ADR-0004](0004-ruleset-riichi-full.md)）。オンライン対戦では**サーバが権威**を持ち、同じルール判定をサーバ・クライアント双方で走らせたい（不正検知・楽観的UI）。ロジックがUI・乱数・時刻に依存していると、サーバへ移植できず二重実装になり、両者の判定がずれる。

`core` リポ（[ADR-0001](0001-multi-repo.md)）が満たすべき性質を確定する必要がある。

## 決定要因

- 同一のルール判定をサーバ・クライアントで**共有**できること（移植性）
- 入力が同じなら出力も同じ（**参照透過**）で、ユニットテスト・牌譜リプレイが容易なこと
- 環境（DOM・タイマー・ネットワーク）に縛られず、Node でもブラウザでも動くこと
- バグの再現が seed で確定できること（[ADR-0007](0007-seedable-prng.md)）

## 決定結果

`core` を**副作用を持たない純粋関数の集合**として実装する。以下を `core` 内で禁止する。

### 環境依存の禁止（DOM / fetch / storage / timer）

- **根拠**: これらに依存するとブラウザ専用になり、サーバ移植で破綻する。
- **影響**: `react` / `document` / `window` / `fetch` / `localStorage` / `setTimeout` を import・使用しない。`package.json` の実行時依存は空。描画・入力・通信は `web`/`server` の責務（[architecture](../design/architecture.md)）。

### 乱数の禁止（Math.random を使わない）

- **根拠**: グローバル乱数は再現不能で、リプレイ・テスト・サーバ権威化を壊す。
- **影響**: 乱数は引数で受け取る seed 可能PRNG（`RngState`）からのみ取得し、PRNG状態は `GameState` に内包して持ち回る（[ADR-0007](0007-seedable-prng.md)、実装 `src/rng.ts`）。

### 時刻の禁止（Date を使わない）

- **根拠**: 時刻依存は非決定的。麻雀はターン制の状態遷移であり、時刻そのものは要らない。
- **影響**: 制限時間・タイマーは `web`/`server` が持つ。`core` は離散イベントの状態遷移のみを表現する。

### 不変状態 + 遷移関数

- **根拠**: 可変状態は「どこで壊れたか」を追えず、楽観更新とサーバ確定のズレを扱えない。
- **影響**: 状態は不変、遷移は `apply(state, action) -> { state, events }` の純粋関数（[ADR-0006](0006-immutable-state-reducer.md)、実装 `src/game.ts`）。非合法操作は例外を投げず、状態を変えずに理由付きイベントで返す。

## 利点

- `core` が Node（サーバ）でもブラウザでも同一に動き、将来の `server` で**ルールを再実装しない**で済む。
- 参照透過なので、特定の配牌・局面を seed や手牌ベクトルで固定して網羅テストできる（実績: `core/tests/` で和了判定・役・点数・局ループを固定）。
- `(初期state, actionの列)` から最終stateが一意に再現でき、牌譜リプレイ・バグ確定再現が可能。

## トレードオフ

- UI都合の「ちょっとした状態」を `core` に置けず、`web` 側に持つ規律コストがかかる。→ 境界を [architecture](../design/architecture.md) に明文化し、`core` への禁止import はルール／lintで検出する。
- 状態複製のコスト（不変性）。→ 麻雀は1局あたりの遷移数が小さく実用上問題ない。`apply` は `structuredClone` で複製（[ADR-0006](0006-immutable-state-reducer.md)）。

## 不採用の選択肢と根拠

| 選択肢 | 不採用理由 |
|---|---|
| **`web` 内にロジックを書く** | 初速は速いが、オンライン化でサーバへ切り出せず全面再実装になる。「両方見据える」要件に反する。 |
| **`Math.random` を直接使う** | 実装は楽だが再現性ゼロ。リプレイ・テスト・サーバ権威化を壊す（[ADR-0007](0007-seedable-prng.md)）。 |
| **可変な `Game` オブジェクト（メソッドが内部状態を変更）** | 直感的だが決定論・リプレイ・サーバ共有の利点を失う（[ADR-0006](0006-immutable-state-reducer.md)）。 |

## 関連するADR

- [ADR-0006](0006-immutable-state-reducer.md) — 不変状態 + apply 遷移
- [ADR-0007](0007-seedable-prng.md) — seed 可能PRNG
- [ADR-0001](0001-multi-repo.md) — core を独立リポにする前提

## Claude Code ルール連携

- `templates/.claude/rules/core.md` — core の純粋性（react/DOM/Math.random/Date 禁止、apply 経由の遷移）を作業中の文脈に注入。
- `templates/.claude/skills/check-adr/` — 差分が core 純粋性に反していないかを点検する。

## 注記

- 純粋性の機械的検出（`core` からの禁止import の lint ルール化）は今後の課題。現状はルールファイルと code-review で担保。
- seed の**生成**（真の乱数源）は `core` の外の責務。`core` は与えられた seed で動くだけ（[ADR-0007](0007-seedable-prng.md)）。
