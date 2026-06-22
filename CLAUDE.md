# docs-hub 作業ガイド（CLAUDE.md）

このリポは横断SoT。**コードは置かない**。ドキュメントと scripts/templates のみ。

## 最重要（インライン必須・毎回読む）

- **恒久・横断の知識はここに集約する。個人メモリや作業リポに逃がさない。**
- **`docs/decisions-index.md` は自動生成。手で編集しない** → `node scripts/gen-decisions-index.mjs` で再生成。
- ADRに載せるのは「複数リポ/他人が参照し、コードでは“なぜ”が復元できない」決定だけ。**コード・スキーマ・Issueで分かることは載せない**（[guards](docs/dev-environment/guards.md)）。
- 1セッション=1担当リポ（[ADR-0005](docs/decisions/0005-one-session-one-repo.md)）。docs-hub担当のセッションは `core`/`web` を**書き換えない**（読むのは可）。

## セッション開始プロトコル

シナリオを判定して読むものを絞る:

- **初回 / 全体像が要る** → ルート [`../README.md`](../README.md) → [`docs/README.md`](docs/README.md) のタスク別表 → [dev-environment](docs/dev-environment/) を setup → workflow → security の順。
- **decisions/ や design/ を追記する** → まず [decisions-index](docs/decisions-index.md) で過去の判断を確認 → 該当 design を精読 → 必要なら investigation で根拠確認。
- **ハーネス部品（hooks/rules）を変える** → [subrepo-conventions](docs/dev-environment/subrepo-conventions.md) と [guards](docs/dev-environment/guards.md) を読んでから `templates/` の原本を編集（各リポへの配布は別途）。

## セッション終了プロトコル（変化の種類 → 反映先）

| 生じた変化 | 反映先 |
|---|---|
| 横断・恒久の決定をした／覆した | `docs/decisions/NNNN-*.md` を追加 → `gen-decisions-index.mjs` 実行 |
| 設計の意図/契約が変わった | 該当 `docs/design/*.md` を更新 |
| 調査して根拠が出た | `docs/investigation/` に記録し、決定/設計からリンク |
| 共通ハーネス部品を変えた | `templates/` の原本を更新（各作業リポへコピーは担当リポ側のIssueで） |
| 実装すべきタスクが出た | 該当作業リポの Issue に起票（ここには進捗を書かない） |

## やらないこと

- 進捗・タスク状態をドキュメントに書かない（Issue/ git log がSoT）。
- 復元可能な事実（スキーマ・APIの行数・依存バージョン）をADRに書かない。
