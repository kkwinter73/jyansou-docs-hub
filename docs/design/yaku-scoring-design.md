# 役・符・点数計算 設計

対象: `core` の `evaluateWin`（Phase 2-3）。
関連: [ADR-0004](../decisions/0004-ruleset-riichi-full.md) [core-domain-design](core-domain-design.md)

ここは**規則量が多くバグの温床**なので、実装は「単一の表＋テスト表」で管理する。決定記録（ADR）には載せず、ここを唯一の参照源とする（[記録は薄く保つ](../dev-environment/guards.md)）。

## 評価の入口

```ts
interface WinContext {
  winTile: Tile;
  byTsumo: boolean;          // ツモ和了か（ロンか）
  seatWind: Wind; roundWind: Wind;
  riichi: boolean; doubleRiichi: boolean; ippatsu: boolean;
  isMenzen: boolean;         // 門前か
  rinshan: boolean; chankan: boolean; haitei: boolean; houtei: boolean;
  doraIndicators: Tile[]; uraIndicators: Tile[];
  rule: RuleConfig;
}
interface WinResult {
  yaku: { name: string; han: number }[];
  yakuman: number;           // 役満の倍数（0=非役満）
  han: number; fu: number;
  points: { total: number; payments: PaymentBreakdown };
  decomposition: Meld[];     // 採用した面子分解
}
```

和了形が複数分解を持つ場合（[core-domain-design](core-domain-design.md#6)）、**最終点数が最大になる分解**を採用する（高点法）。

## 役一覧（Phase 2 で実装。喰い下がりは門前比）

| 翻 | 役 | 備考 |
|---|---|---|
| 1 | リーチ / 一発 / 門前清自摸和 / 平和 / 断么九 / 役牌(白發中/自風/場風) / 一盃口 / 嶺上開花 / 槍槓 / 海底摸月 / 河底撈魚 | 一盃口は門前のみ |
| 2 | ダブルリーチ / 三色同順(喰1) / 一気通貫(喰1) / 混全帯么九(喰1) / 七対子 / 対々和 / 三暗刻 / 三槓子 / 三色同刻 / 混老頭 / 小三元 | 七対子は固定2翻25符 |
| 3 | 混一色(喰2) / 純全帯么九(喰2) / 二盃口 | 二盃口は門前のみ |
| 6 | 清一色(喰5) | |
| 役満 | 国士無双 / 四暗刻 / 大三元 / 字一色 / 緑一色 / 清老頭 / 四槓子 / 小四喜 / 大四喜 / 九蓮宝燈 / 天和 / 地和 | ダブル役満の扱いは rule で設定 |

ドラ（表/赤/裏）は翻に加算するが**役ではない**（ドラのみでは和了不可）。役なし和了は無効（`WinResult=null`）。

## 符計算（Phase 3）

```
副底 20符
+ 門前ロン 10符（門前加符）
+ ツモ 2符（平和ツモを除く）
+ 面子: 順子0 / 明刻(中張2,么九4) / 暗刻(中張4,么九8) / 明槓(中張8,么九16) / 暗槓(中張16,么九32)
+ 雀頭: 役牌2（連風牌の扱いは rule、既定は4=2+2）
+ 待ち: 嵌張・辺張・単騎 各2 / 両面・双碰 0
→ 1の位を切り上げ（10符単位）
特例: 七対子=25符固定 / 平和ツモ=20符 / 平和ロン=30符（門前加符のみ）
```

## 点数計算（Phase 3）

基本点 `base = fu × 2^(2+han)`。満貫以上は固定（4翻30符=満貫切り上げの扱いは rule で設定。既定は「切り上げ満貫なし」）。

| 区分 | 翻 | 基本点 |
|---|---|---|
| 満貫 | 5（または4翻40符/3翻70符超） | 2000 |
| 跳満 | 6–7 | 3000 |
| 倍満 | 8–10 | 4000 |
| 三倍満 | 11–12 | 6000 |
| 役満 | 13+ / 成立役満 | 8000（×倍数） |

支払い:
- 子のロン: `ceil(base×4 /100)*100` を放銃者が支払う。
- 子のツモ: 子が `ceil(base×1/100)*100` ×2、親が `ceil(base×2/100)*100`。
- 親のロン: `ceil(base×6/100)*100`。
- 親のツモ: 各家 `ceil(base×2/100)*100`。
- 本場: 1本場につき +300（ロンは放銃者、ツモは全員から100ずつ）。供託（リーチ棒）は和了者が総取り。

検証は「点数早見表」との突合テスト（`core/tests/scoring.*.test.ts`）で固定する。境界（30符4翻=7700/満貫、20符などの切り上げ）を必ずテストに入れる。

## 未確定・ローカルルール（既定値、変更時は ADR 追加）

- 切り上げ満貫: なし / 流し満貫: 未対応(Phase 4) / 人和: 未採用 / 連風牌雀頭: 4符 / ダブル役満: あり。
