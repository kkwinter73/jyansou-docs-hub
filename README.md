# docs-hub — 横断SoT（単一の真実源）

このリポは**コードを持たない**。複数リポにまたがる知識（設計・契約・決定記録）と、各リポへ配る共通ハーネス部品の**唯一原本**を集約する。ワークスペース全体の地図もここが持つ。

## ワークスペースの並べ方（独立リポ・横並び）

このプロジェクトは独立した GitHub リポジトリの集合。**親はただのディレクトリ**で、git リポジトリにはしない（[ADR-0008](docs/decisions/0008-git-topology.md)）。`web` は `../core` を相対参照するため、3リポを**同じ親ディレクトリ直下に同名で** clone する。

```bash
mkdir jyansou && cd jyansou        # 親はただの入れ物（git init しない）
git clone git@github.com:kkwinter73/jyansou-docs-hub.git docs-hub
git clone git@github.com:kkwinter73/jyansou-core.git      core
git clone git@github.com:kkwinter73/jyansou-web.git       web
```

| リポ | GitHub | 役割 |
|---|---|---|
| docs-hub | [jyansou-docs-hub](https://github.com/kkwinter73/jyansou-docs-hub) | 横断SoT（このリポ） |
| core | [jyansou-core](https://github.com/kkwinter73/jyansou-core) | 麻雀エンジン（純粋ロジック） |
| web | [jyansou-web](https://github.com/kkwinter73/jyansou-web) | ブラウザフロント（React+Vite） |

将来追加候補（未作成）: `server/`, `e2e/`。

## 中身

| パス | 役割 |
|---|---|
| [`docs/README.md`](docs/README.md) | **タスク別エントリポイント表**（迷ったらここ） |
| [`docs/decisions/`](docs/decisions/) | 横断・恒久の決定（ADR）。1決定=1ファイル |
| [`docs/decisions-index.md`](docs/decisions-index.md) | ↑の索引（**自動生成**・手編集しない） |
| [`docs/design/`](docs/design/) | 設計の意図・API/スキーマ契約（ドメイン別） |
| [`docs/investigation/`](docs/investigation/) | 設計判断の根拠（調査メモ） |
| [`docs/dev-environment/`](docs/dev-environment/) | 人間向け: ハーネスの背景解説（なぜ） |
| `scripts/` | 索引の自動生成・構造ガード |
| `templates/.claude/` | 共通 hooks / rules / skills の**原本**（各リポへ手動コピー） |

## 重要な約束

- **横断知識（複数リポ/他人が参照する恒久情報）は、ここにだけ書く。** 個人メモリや作業リポに逃がさない（[ADR-0005](docs/decisions/0005-one-session-one-repo.md)）。
- `decisions-index.md` は `node scripts/gen-decisions-index.mjs` で再生成する。手で編集しない。
- 共通ハーネス部品は `templates/` が原本。各リポでは分岐させず、変更はここで議論してから配る（[subrepo-conventions](docs/dev-environment/subrepo-conventions.md)）。

セッションの開始/終了プロトコルは [`CLAUDE.md`](CLAUDE.md) を参照。
