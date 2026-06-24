# 局進行 設計（Action / 遷移 / 鳴き / リーチ / 流局）

対象: `core` の `legalActions` / `apply`（[ADR-0006](../decisions/0006-immutable-state-reducer.md)）。
関連: [core-domain-design](core-domain-design.md) [yaku-scoring-design](yaku-scoring-design.md)

## Action（プレイヤー操作 = すべて明示データ）

```ts
// draw/discard/tsumo は常に手番(turn)の操作なので seat を持たない。鳴き/ロン応答は seat 必須。
type Action =
  | { type: 'draw' }                                   // 山からツモ
  | { type: 'discard'; tile: Tile; riichi?: boolean }  // 打牌（riichi=宣言打牌）
  | { type: 'tsumo' }                                  // ツモ和了
  | { type: 'ron'; seat: Seat }                        // 打牌/加槓へのロン応答
  | { type: 'pon'; seat: Seat }                        // 直前の打牌をポン
  | { type: 'chi'; seat: Seat; tiles: [Tile, Tile] }   // 直前の打牌を順子で鳴く（上家のみ）
  | { type: 'kan'; seat: Seat; kind: 'minkan'|'ankan'|'kakan'; tile: TileKind }
  | { type: 'kyuushu'; seat: Seat }                    // 九種九牌で途中流局を宣言
  | { type: 'pass'; seat: Seat };                      // 鳴き/ロンを見送る
```

`apply(state, action)` は不変で `{ state, events }` を返す。非合法な Action は状態を変えず `events:[{type:'illegal', reason}]` を返す（例外を投げない）。`legalActions(state, seat)` が常に合法手だけを列挙し、UI/CPU はそこから選ぶ。

## フェーズ遷移

`phase: 'draw' | 'discard' | 'afterDiscard' | 'afterKakan' | 'over'`

```
draw ──draw──▶ discard ──discard──▶ afterDiscard（鳴き/ロン窓）──解決──┐
  ▲                │                                                  │
  │                ├──tsumo/kyuushu──▶ over                           │
  │                └──kan(ankan/kakan)──▶ 嶺上ツモ──▶ discard          │
  │                         （kakan は afterKakan=槍槓窓を経由）        │
  └────────── 全員pass/鳴き解決後、次のツモ ◀────────────────────────┘
和了/流局/途中流局 ──▶ over ──▶ startNextHand（次局 or 終局）
```

優先順位（同時発生時）: **ロン > ポン/カン > チー**。頭ハネ既定は「あり」（放銃者に近い席が優先）。鳴き候補は `pendingCalls`、各席の応答は `callResponses` に集め、**全員の応答が揃ってから**優先順位で解決する。加槓は `afterKakan` で槍槓（チャンカン）ロンを受け付ける。

## リーチ

- 条件: 門前・聴牌・点数1000以上・山に4枚以上残り。`discard` に `riichi:true` を付けて宣言。
- 効果: リーチ棒1000を供託、`riichi[seat]=true`、`ippatsu=true`（次の自分の打牌まで、間に鳴きが入ると消える）。以降ツモ切り強制（手牌交換不可）。**暗槓は送り槓（待ちが変わらない）場合のみ可**。
- 一発・裏ドラは [yaku-scoring-design](yaku-scoring-design.md) で加算。

## フリテン

自分の待ち（[core-domain-design](core-domain-design.md#聴牌待ち列挙)）のいずれかが自分の河にある／リーチ後に見逃した／同巡内に見逃した場合はロン不可（ツモは可）。`legalActions` が `ron` を除外することで強制する。

## 局の終了

- **和了**: `tsumo`/`ron` 成立 → `evaluateWin` → 点移動（本場・供託込み）→ 連荘判定（親の和了/聴牌で連荘、既定）。
- **流局（荒牌平局）**: 山が尽き（生牌0）→ 聴牌者で聴牌料3000を分配（テンパイ人数で按分）。親聴牌で連荘。
  - **流し満貫**: 自分の捨て牌が全て么九 かつ 一度も鳴かれていなければ満貫（親12000/子8000相当）。聴牌料に優先。
- **途中流局**（すべて実装）: 九種九牌（宣言）・四風連打・四家立直・四槓散了。いずれも親は連荘・本場+1。
- カンは1局**4回まで**（嶺上牌が尽きるため5回目は不可）。

## 終局

東南戦（半荘）。南4局終了、またはトビ（誰かが0点未満、既定で有効）で終局。順位は点数降順、同点は起家に近い席優先（既定）。`finalRanking(state)` が確定し、局送りは `startNextHand(state): NextHand`（`{over:true, ranking}` か `{over:false, state}`）。

## 実装状況（[ADR-0004](../decisions/0004-ruleset-riichi-full.md)）

Phase 1〜4b すべて実装済み: 配牌・ツモ・打牌・リーチ・フリテン（河/同巡/リーチ後恒久）・一発・海底/河底・鳴き全種（チー/ポン/大明槓/暗槓/加槓）・槍槓・嶺上ツモ・カンドラ・喰い替え防止・送り槓・各種流局・流し満貫・点移動・連荘/親送り/本場/供託・終局/順位。CPU は `chooseAction`（[architecture](architecture.md#cpu対戦相手aiの置き場所)）。
