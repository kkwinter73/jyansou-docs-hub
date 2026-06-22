# 局進行 設計（Action / 遷移 / 鳴き / リーチ / 流局）

対象: `core` の `legalActions` / `apply`（[ADR-0006](../decisions/0006-immutable-state-reducer.md)）。
関連: [core-domain-design](core-domain-design.md) [yaku-scoring-design](yaku-scoring-design.md)

## Action（プレイヤー操作 = すべて明示データ）

```ts
type Action =
  | { type: 'draw'; seat: Seat }                       // 山からツモ（嶺上含む）
  | { type: 'discard'; seat: Seat; tile: Tile; riichi?: boolean } // 打牌（riichi=宣言打牌）
  | { type: 'chi'; seat: Seat; tiles: [Tile, Tile] }   // 直前の打牌を順子で鳴く
  | { type: 'pon'; seat: Seat; tiles: [Tile, Tile] }
  | { type: 'kan'; seat: Seat; kind: 'ankan'|'minkan'|'kakan'; tile: Tile }
  | { type: 'ron'; seat: Seat }
  | { type: 'tsumo'; seat: Seat }
  | { type: 'pass'; seat: Seat };                       // 鳴き/ロンを見送る
```

`apply(state, action)` は不変で `{ state, events }` を返す。非合法な Action は状態を変えず `events:[{type:'illegal', reason}]` を返す（例外を投げない）。`legalActions(state, seat)` が常に合法手だけを列挙し、UI/CPU はそこから選ぶ。

## フェーズ遷移

```
draw ──ツモ──▶ discard ──打牌──▶ (call: 他家に鳴き/ロンの権利) ──┐
  ▲                                                              │
  └──────── pass/鳴き解決後、次のツモ ◀───────────────────────────┘
和了/流局 ──▶ end ──▶ 次局 or 終局
```

優先順位（同時発生時）: **ロン > ポン/カン > チー**。複数ロンはダブロン/トリロンを rule で扱い、頭ハネ既定は「あり」。鳴きの宣言待ちは `pendingCalls` で表現し、全員の応答が揃ってから解決する。

## リーチ

- 条件: 門前・聴牌・点数1000以上・山に4枚以上残り。`discard` に `riichi:true` を付けて宣言。
- 効果: リーチ棒1000を供託、`riichi.declared=true`、`ippatsu=true`（次の自分のツモまで、間に鳴きが入ると消える）。以降ツモ切り強制（手牌交換不可、暗槓は送り槓でなければ条件付き可）。
- 一発・裏ドラは [yaku-scoring-design](yaku-scoring-design.md) で加算。

## フリテン

自分の待ち（[core-domain-design](core-domain-design.md#聴牌待ち列挙)）のいずれかが自分の河にある／リーチ後に見逃した／同巡内に見逃した場合はロン不可（ツモは可）。`legalActions` が `ron` を除外することで強制する。

## 局の終了

- **和了**: `tsumo`/`ron` 成立 → `evaluateWin` → 点移動（本場・供託込み）→ 連荘判定（親の和了/聴牌で連荘、既定）。
- **流局（荒牌平局）**: 山が尽き（残り0）→ 聴牌者で聴牌料3000を分配（テンパイ人数で按分）。親聴牌で連荘。
- **途中流局**（既定の採否は rule）: 九種九牌・四風連打・四開槓・四家立直。既定は九種九牌のみ採用、他は Phase 4。

## 終局

東南戦（半荘）。南4局終了、またはトビ（誰かが0点未満、既定で有効）で終局。順位は点数降順、同点は起家に近い席優先（既定）。`scores` から最終順位を確定する関数 `finalRanking(state)` を持つ。

## 実装フェーズとの対応（[ADR-0004](../decisions/0004-ruleset-riichi-full.md)）

- Phase 1: `draw`/`discard`/`tsumo`(形のみ) と和了形判定・待ち列挙。鳴きなし・点数なしの最小ループ。
- Phase 4: 鳴き全種・リーチ・フリテン・流局・連荘・終局・順位の完全実装。
