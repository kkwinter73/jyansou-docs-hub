# core ドメイン設計（牌・手牌・状態・和了形判定）

対象: `core` リポの内部表現とアルゴリズム。
関連: [ADR-0002](../decisions/0002-pure-core-engine.md) [ADR-0006](../decisions/0006-immutable-state-reducer.md) [ADR-0007](../decisions/0007-seedable-prng.md)

これは `core` 実装が従う**契約**。`web`/`server` は内部表現に依存せず [architecture の公開API](architecture.md#core-の公開api境界の契約) だけを使う。

## 1. 牌（Tile）

リーチ麻雀の牌は **34種**、各4枚で計136枚。種を 0–33 の整数 `TileKind` で表す（数牌は数字順に並ぶので待ち判定が容易）。

| 範囲 | 種 |
|---|---|
| 0–8 | 萬子 1m–9m |
| 9–17 | 筒子 1p–9p |
| 18–26 | 索子 1s–9s |
| 27–30 | 風牌 東・南・西・北 |
| 31–33 | 三元牌 白・發・中 |

```ts
// 牌種（0..33）。数牌は kind%9 で数字-1、Math.floor(kind/9) で 0=m,1=p,2=s。
type TileKind = number;            // 0..33
type Suit = 'm' | 'p' | 's' | 'z'; // z = 字牌(honor)

// 物理牌（牌山の1枚）。赤ドラ識別のため id と red を持つ。
interface Tile {
  kind: TileKind;   // 0..33
  red: boolean;     // 赤5かどうか（aka dora, ADR-0004）
  id: number;       // 0..135 の一意ID（同種4枚を区別。鳴き表示やアニメで使用）
}
```

判定ヘルパ（純粋関数）:
- `isHonor(kind) = kind >= 27`
- `isTerminal(kind)` = 数牌の1/9（么九牌の数牌側）
- `isYaochu(kind)` = 1/9/字牌（么九牌）
- `suitOf(kind)`, `numberOf(kind)`（数牌のみ 1..9）

## 2. 手牌の2つの表現

和了形判定は**枚数配列**が効率的、表示・鳴きは**物理牌**が必要なので両方を持つ。

```ts
// 枚数ベクトル: 長さ34、各種の枚数。和了判定/向聴計算のコア表現。
type Counts = number[]; // length 34, 各要素 0..4

// 席の手牌
interface HandState {
  concealed: Tile[];   // 純手牌（鳴いていない手の内）。ツモ牌もここ
  melds: Meld[];       // 副露（鳴いた面子）。手牌枚数 = 13 - 3*melds.length（打牌前は+1）
  drawn: Tile | null;  // 直前のツモ牌（ツモ切り/手出し判定・嶺上開花の文脈）
}
```

`concealed` ↔ `Counts` の変換 `toCounts(tiles)` を1か所に持つ。赤ドラは `kind` を変えないので、和了形判定では `Counts`、ドラ集計では `Tile.red` を見る。

## 3. 面子（Meld）と副露

```ts
type MeldType = 'chi' | 'pon' | 'ankan' | 'minkan' | 'kakan';
interface Meld {
  type: MeldType;
  tiles: Tile[];        // 構成牌（chi/pon=3, kan=4）
  from: Seat | null;    // 鳴いた相手の席（ankan は null）
  calledTile: Tile | null; // 鳴いた牌（どの牌を取ったか）
}
```

副露は和了形・符・喰い下がりに影響するので、面子は「暗/明」「順子/刻子/槓子」を復元できる情報を保持する。

## 4. ゲーム状態（GameState）

不変（[ADR-0006](../decisions/0006-immutable-state-reducer.md)）。1つのオブジェクトで局を完全に表す。

```ts
type Seat = 0 | 1 | 2 | 3;          // 起家からの相対席
type Wind = 'E' | 'S' | 'W' | 'N';

interface GameState {
  rule: RuleConfig;                 // 喰タン/赤ドラ枚数/持点/返し点 等（ADR-0004）
  rng: RngState;                    // seed可能PRNGの内部状態（ADR-0007）
  round: { wind: Wind; dealer: Seat; honba: number; riichiSticks: number };
  wall: {
    tiles: Tile[];                  // 残り山（ツモる順）
    deadWall: Tile[];               // 王牌14枚
    doraIndicators: Tile[];         // 表ドラ表示牌（カンで増える）
    uraIndicators: Tile[];          // 裏ドラ（リーチ和了時のみ公開）
    kanCount: number;
  };
  hands: Record<Seat, HandState>;
  discards: Record<Seat, Tile[]>;   // 河（捨て牌、順序＝フリテン/一発/海底判定に使う）
  riichi: Record<Seat, { declared: boolean; ippatsu: boolean; turn: number }>;
  scores: Record<Seat, number>;
  turn: Seat;                       // 現在手番
  phase: 'draw' | 'discard' | 'call' | 'end'; // 局内フェーズ
  pendingCalls?: PendingCall[];     // 打牌に対する鳴き/ロンの待ち
}
```

字牌の役牌（自風・場風・三元）は `round.wind` と各席の自風から導出する。

## 5. PRNG（決定論乱数）

```ts
interface RngState { s: number; }                 // 例: mulberry32 の32bit状態
function nextRng(rng: RngState): { rng: RngState; value: number /*[0,1)*/ };
function shuffle<T>(rng: RngState, xs: T[]): { rng: RngState; result: T[] }; // Fisher–Yates
```

- `rng` は `GameState` に内包し、`apply` を通じてのみ進む。これで「同じ初期stateとactionの列 → 同じ展開」が保証される（[ADR-0007](../decisions/0007-seedable-prng.md)）。
- seed の**生成**は `core` の外（`web`が `Date.now()`/crypto で作って `createGame(config, seed)` に渡す）。

## 6. 和了形判定アルゴリズム（Phase 1 の中核）

入力は手牌の `Counts`（鳴き面子は別に確定済み）。和了形は次の3パターン:

### (a) 標準形: 4面子 + 1雀頭
再帰的に分解する。雀頭候補を1つ選び（`counts[k] >= 2`）、残りを「先頭の未消化牌から順子(k,k+1,k+2)または刻子(k×3)を貪欲に剥がす」バックトラックで4面子に分解できれば和了形。鳴き面子の数だけ必要面子を減らす。
- 計算量は小さい（34種、各<=4）。雀頭候補×分解で十分高速。
- 出力は「どの面子分解か」も返す（符計算・役判定が分解に依存するため、**複数の分解を列挙**し最終的に最高点を選ぶ）。

### (b) 七対子（chiitoitsu）
`Counts` がちょうど7種それぞれ2枚（同種4枚は不可＝2枚×2扱いにしない）。

### (c) 国士無双（kokushi）
么九牌13種がすべて1枚以上 + いずれか1種が2枚。

### 聴牌・待ち列挙
`Counts`(13枚相当) に対し、34種すべてを1枚加えて (a)(b)(c) のいずれかになる種を集める ＝ 待ち。`isTenpai = waits.length > 0`。フリテンは「自分の待ちのいずれかが自分の河にある」で判定。向聴数（shanten）は CPU 用に別途計算（Phase で追加）。

> 役・符・点数の設計は [yaku-scoring-design](yaku-scoring-design.md)、局の進行（鳴き・リーチ・流局）は [game-flow-design](game-flow-design.md) を参照。
