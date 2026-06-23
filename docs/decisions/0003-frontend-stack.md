# ADR-0003: フロントエンド技術スタックは TypeScript + React + Vite とする

- ステータス: Accepted
- 日付: 2026-06-22（2026-06-23 粒度拡充）
- 関連: [ADR-0002](0002-pure-core-engine.md) / [ADR-0006](0006-immutable-state-reducer.md) / [architecture](../design/architecture.md)

## コンテキストと問題提起

`web` リポ（[ADR-0001](0001-multi-repo.md)）は、麻雀の盤面（手牌・河・ドラ表示・点棒・場況）を描画し、人間プレイヤーの入力を受け、CPU手番を進め、結果を表示するブラウザフロントである。ルール判定そのものは持たず、必ず `core` に委譲する（[architecture](../design/architecture.md)）。

技術選定は任された。フロントエンドの言語・フレームワーク・ビルドツール・描画方式・状態管理を確定する必要がある。

## 決定要因

- `core` の型（TypeScript）とシームレスに繋がり、境界での取り違えを型で防げること
- テストが容易で、ビルド設定が薄いこと
- ハーネスの lint/rule と相性が良いこと
- 麻雀UIに対して過剰でなく、学習・保守コストが低いこと
- 1人〜小規模での長期保守に耐えること

## 決定結果

### 言語: TypeScript

- **根拠**: `core` と同一言語で型契約（`GameState` / `Action` / `Tile` / `WinResult` 等）を共有でき、境界の取り違えをコンパイル時に防げる。
- **影響**: `strict` 前提。`core` は `@jyansou/core` として import し、内部表現でなく公開APIの型だけに依存する。

### ビルドツール: Vite

- **根拠**: 高速な開発サーバとビルド、薄い設定。`core` の TS ソースを相対 alias で直接取り込める。
- **影響**: `web` 開発時は `../core/src` を alias 参照（`vite.config.ts` / `tsconfig` paths）。`npm run dev`/`build`。

### フレームワーク: React

- **根拠**: コンポーネント分割と宣言的描画。麻雀盤面の「状態→ビュー」対応が素直。CPU自動進行は `useEffect`+`setTimeout` で表現できる。
- **影響**: 盤面・手牌・河・結果オーバーレイをコンポーネント化（`src/App.tsx`）。

### 描画方式: DOM + CSS（Canvas を採らない）

- **根拠**: 牌は高々 14＋河 程度で毎フレーム再描画は不要。DOMで十分かつデバッグ容易（要素＝牌でクリック打牌が自然）。
- **影響**: 牌はDOM要素で表示。リッチなアニメが必要になった時点で局所的に Canvas/PixiJS 導入を再検討する（その時はADRを追加）。

### 状態管理: React 標準（useState / useReducer）

- **根拠**: ゲームの真実は `core` の不変 `GameState`（[ADR-0006](0006-immutable-state-reducer.md)）。`web` はそれを保持して描画し、`apply` の結果で置き換えるだけなので、外部ストアの複雑さは不要。
- **影響**: まず `useState<GameState>` で足りる。必要になれば追加ADRで外部ライブラリを検討。

## 利点

- 言語・型が `core` と一貫し、公開APIの変更がフロントで型エラーとして検出される。
- ビルドが薄く、`core` のTSソースをそのまま取り込めるので、リポ間の配線が単純。
- DOM描画でデバッグが容易、状態が `core` 側に一元化されているので `web` のロジックが薄い。

## トレードオフ

- Vite併用でビルドプロセスが1つ増える。→ `npm run build`（`tsc --noEmit && vite build`）で一元化。
- DOM描画はリッチなアニメ表現に弱い。→ 現段階では過剰機能を避け、必要時に局所導入する方針で許容。
- 自動進行を `setTimeout` で行うため、StrictMode の二重実行やステール状態に注意が必要。→ effect のクリーンアップとステールガード（`g !== s` で適用スキップ）で対処。

## 不採用の選択肢と根拠

| 選択肢 | 不採用理由 |
|---|---|
| **Vue + Vite** | 同等に妥当。エコシステムの厚さとチームの慣れから React を採用。 |
| **Canvas / PixiJS 主体** | アニメ表現力は高いが基盤の手間と複雑さが増す。牌数が少なく現段階では過剰。将来の局所導入余地は残す。 |
| **Next.js 等 SSR フレームワーク** | クライアント完結のゲームに SSR は不要。ビルドを薄く保つため不採用。 |
| **Redux / Zustand 等の状態ライブラリ** | 真実源は `core` の `GameState`。`web` 側の状態は薄く、標準フックで足りる。必要になれば追加ADR。 |

## 関連するADR

- [ADR-0002](0002-pure-core-engine.md) — ルール判定は core に委譲（web は持たない）
- [ADR-0006](0006-immutable-state-reducer.md) — web が描画する不変状態の形

## Claude Code ルール連携

- `templates/.claude/rules/typescript.md` — TS共通規約（strict・層をまたぐ逆流import禁止）。
- `web/.claude/rules/`（core.md は web に適用されないため除外済み） — リポ固有ルールの自己完結。

## 注記

- ライブラリのバージョンは設計時点（2026-06）のもの。React 18 / Vite 5 系で構築。実装更新時に最新安定版を確認する。
- 牌の表示ラベル等の表示専用ヘルパは `web/src/tiles.ts`（`core` には持たせない）。
