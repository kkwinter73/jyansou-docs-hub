# ADR-0007: 牌山シャッフル等の乱数は seed 可能な決定論的PRNGを使う

- ステータス: Accepted
- 日付: 2026-06-22（2026-06-23 粒度拡充）
- 関連: [ADR-0002](0002-pure-core-engine.md) / [ADR-0006](0006-immutable-state-reducer.md) / [core-domain-design](../design/core-domain-design.md)

## コンテキストと問題提起

`core`（[ADR-0002](0002-pure-core-engine.md)）の純粋性と、状態遷移の決定論（[ADR-0006](0006-immutable-state-reducer.md)）を成立させるには、乱数（牌山のシャッフル・ツモ順）も再現可能でなければならない。

`Math.random()` はグローバル・非seedで、同じ入力から同じ牌山を再現できず、テスト・リプレイ・サーバ権威化を壊す。乱数の供給方法を確定する必要がある。

## 決定要因

- 同じ seed から同じ牌山・同じ展開を再現できること
- `core` の純粋性（グローバル状態を持たない）を壊さないこと
- テストで特定の配牌を固定できること
- 将来のオンライン化（サーバが seed を保持・検証）に繋がること

## 決定結果

### seed 可能な決定論PRNG（mulberry32）

- **根拠**: 軽量・依存なしで、32bit seed から再現可能な系列を生成できる。暗号強度は不要（公平性はオンライン本番でサーバ側設計に委ねる）。
- **影響**: `src/rng.ts` に `makeRng(seed)` / `nextRng(rng) -> { rng, value }` / `nextInt` / `shuffle`（Fisher–Yates）を実装。状態は値渡しで進める純粋関数。

### PRNG状態を GameState に内包

- **根拠**: 乱数を伴う遷移でも `apply` の純粋性を保つため（[ADR-0006](0006-immutable-state-reducer.md)）。
- **影響**: `RngState` を `GameState.rng` として持ち回り、`apply` を通じてのみ進める。次局の配牌も同じ `rng` を継続して使い、対局全体が seed から決定論になる。

### seed の生成は core の外

- **根拠**: 真の乱数源は環境依存（`core` は環境非依存）。
- **影響**: seed の生成は `web`/`server` の責務（`web` は `Math.random` 等で生成）。`core` は与えられた seed で動くだけ。

## 利点

- 同じ seed → 同じ牌山 → 同じ対局が再現でき、バグ報告に seed を添えれば確定再現できる。
- テストで「特定の配牌」を seed で固定できる（再現性テストを `core/tests/rng.test.ts` で担保）。
- サーバが seed を生成・保持すれば、クライアントは結果を検証できる（オンライン化の布石）。

## トレードオフ

- mulberry32 は暗号用途ではない。→ 公平性が問われるオンライン本番では、サーバ側で seed を秘匿/コミットメントする設計を別途検討（ADRを追加）。
- 状態を値渡しで持ち回るぶん呼び出しが冗長。→ 純粋性・再現性の利益が上回るため許容。

## 不採用の選択肢と根拠

| 選択肢 | 不採用理由 |
|---|---|
| **`Math.random()` 直接使用** | 実装は楽だが再現性ゼロ。テスト・リプレイ・サーバ権威化をすべて壊す。 |
| **`crypto.getRandomValues`** | 質は高いが seed 固定できず非決定的。`core` のシャッフル駆動には使わない（seed 生成側で使うのは可）。 |
| **外部PRNGライブラリ** | 依存を増やす必要がない。mulberry32 は数十行で十分。 |

## 関連するADR

- [ADR-0002](0002-pure-core-engine.md) — core の純粋性（Math.random 禁止）
- [ADR-0006](0006-immutable-state-reducer.md) — PRNG状態を state に内包し apply で進める

## Claude Code ルール連携

- `templates/.claude/rules/core.md` — 「`Math.random`/`Date` を使わない。乱数は `RngState` 経由」を文脈に注入。

## 注記

- シャッフルは Fisher–Yates をPRNGで駆動。実装は1か所（`shuffle`）に集約し、再現性をテストで固定する。
- 牌山生成（136牌・赤5の付与）は `game.ts` の配牌処理で `shuffle` を用いる。
