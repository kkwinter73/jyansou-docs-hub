# ADR-0007: 牌山シャッフル等の乱数は seed 可能な決定論的PRNGを使う

- ステータス: Accepted
- 日付: 2026-06-22
- 関連: [ADR-0002](0002-pure-core-engine.md), [ADR-0006](0006-immutable-state-reducer.md)

## 決定

`core` が使う乱数（牌山のシャッフル、ツモ順）は、**seed から決定論的に再現できるPRNG**（例: xorshift / mulberry32 系の自前実装）で供給する。PRNGの内部状態は `GameState` に内包し、`apply` を通じてのみ進める。`Math.random()` は `core` で使用禁止。

## 背景

[ADR-0002](0002-pure-core-engine.md)（純粋性）と [ADR-0006](0006-immutable-state-reducer.md)（決定論）を成立させるには、乱数も再現可能でなければならない。`Math.random()` はグローバル・非seedで、同じ入力から同じ牌山を再現できず、テスト・リプレイ・サーバ権威化を壊す。

## 帰結

- **良い**: 同じ seed → 同じ牌山 → 同じ対局が再現できる。バグ報告に seed を添えれば確定再現。サーバが seed を生成・保持すれば、クライアントは結果を検証できる（オンライン化の布石）。テストで「特定の配牌」を seed で固定できる。
- **制約**:
  - seed の**生成**（真の乱数源）は `core` の外（`web`/`server`）の責務。`core` は与えられた seed で動くだけ。
  - シャッフルは Fisher–Yates をPRNGで駆動。実装は1か所に集約し、テストでPRNGの再現性を固定する。
  - 暗号用途ではない（公平性が問われるオンライン本番では、サーバ側で seed を秘匿/コミットメントする設計を別途検討。ADRを追加する）。

## 検討した代替案

- **`Math.random()` 直接使用**: 実装は楽だが再現性ゼロ。上記すべての利点を失うため却下。
- **`crypto.getRandomValues`**: 質は高いが seed 固定できず非決定的。seed 生成側で使うのは可だが、`core` のシャッフル駆動には使わない。
