# ADR-0003: フロントエンド技術スタックは TypeScript + React + Vite とする

- ステータス: Accepted
- 日付: 2026-06-22
- 関連: [ADR-0002](0002-pure-core-engine.md), [architecture](../design/architecture.md)

## 決定

`web` リポは **TypeScript + React + Vite** で構築する。描画は当面 **DOM + CSS**（牌は要素として配置）とし、Canvas/WebGL は採用しない。テストは Vitest、状態は React 標準（後述）。

## 背景

技術選定は任され、判断軸は (1) `core` の型（TypeScript）とシームレスに繋がる、(2) テストが容易、(3) ハーネスの lint/rule と相性が良い、(4) 学習・保守コストが低い、(5) 麻雀UIに過剰でない。

## 帰結

- **TypeScript**: `core` と同一言語で型契約を共有でき、境界での取り違えを型で防げる。必須。
- **Vite**: 高速な開発サーバとビルド。設定が薄く、`core` をローカル相対依存で取り込みやすい。
- **React**: コンポーネント分割と宣言的描画。麻雀盤面（手牌・河・ドラ表示・点棒）の状態→ビュー対応が素直。
- **DOM描画（Canvas不採用）**: 牌は高々 14+捨て牌 程度で、毎フレーム再描画は不要。DOMで十分かつデバッグ容易。リッチなアニメが必要になった時点で局所的に Canvas/PixiJS 導入を再検討する（その時はADRを追加）。
- **状態管理**: ゲームの真実は `core` の不変状態（[ADR-0006](0006-immutable-state-reducer.md)）。`web` はそれを保持して描画するだけなので、まずは `useReducer`/Context で足り、外部ライブラリ（Redux/Zustand等）は入れない。必要になれば追加ADR。

## 検討した代替案

- **Vue + Vite**: 同等に妥当。チームの慣れがReact寄りであること、エコシステムの厚さからReactを採用。
- **Canvas/PixiJS 主体**: アニメ表現力は高いが基盤の手間と複雑さが増す。現段階では過剰。却下（将来局所導入の余地は残す）。
- **Next.js等のSSRフレームワーク**: クライアント完結のゲームにSSRは不要。ビルドを薄く保つため不採用。
