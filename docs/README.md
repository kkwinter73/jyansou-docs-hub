# ドキュメント入口

迷ったらここ。「やりたいこと → 最初に読むファイル」。

## タスク別エントリポイント

| やりたいこと | 最初に読むファイル |
|---|---|
| プロジェクト全体像を掴む | [`../../README.md`](../../README.md)（ワークスペース）→ この表 |
| なぜこの構成なのか遡る | [decisions-index.md](decisions-index.md) → 各 [decisions/](decisions/) |
| リポの依存関係・境界を知る | [design/architecture.md](design/architecture.md) |
| 麻雀ロジック（牌/手牌/和了判定）を実装する | [design/core-domain-design.md](design/core-domain-design.md) → `core` の Issue |
| 役・符・点数を実装する | [design/yaku-scoring-design.md](design/yaku-scoring-design.md) |
| 局の進行（鳴き/リーチ/流局）を実装する | [design/game-flow-design.md](design/game-flow-design.md) |
| UI（盤面・手牌・入力）を作る | [design/architecture.md](design/architecture.md#core-の公開api境界の契約) → `web` の Issue |
| エージェント環境/ガードのなぜを知る | [dev-environment/](dev-environment/) |
| 新しいガード/ルールを足す | [dev-environment/guards.md](dev-environment/guards.md) |
| リポを追加 / CLAUDE.md を整備する | [dev-environment/subrepo-conventions.md](dev-environment/subrepo-conventions.md) |
| ローカルで動かす | 各リポ（`core`/`web`）の README / CLAUDE.md |

## 知識の置き場所（種類別 SoT）

| 知識の種類 | 置き場所 |
|---|---|
| 横断・恒久の決定 | `docs/decisions/NNNN.md`（＋自動索引） |
| 設計の意図・API/スキーマ契約 | `docs/design/*.md` |
| リポ固有の設計判断 | 各リポ `docs/adr/` |
| リポ固有の規約 | 各リポ `CLAUDE.md` / `.claude/rules/*.md` |
| 進行中タスク・次の作業 | Issue トラッカー（該当リポ） |
| このセッション限りのメモ | 個人メモリ（コミットしない・横断知識は置かない） |

判定の3問: ①複数リポ/他人が参照する? ②コード/Issueで“なぜ”が復元できない? ③リポを切り替えても言える? — Yesが多いほど docs-hub 側、Noなら作業リポ/個人メモリ。
