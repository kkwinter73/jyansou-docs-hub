# templates/.claude — 共通ハーネス部品の唯一原本（SoT）

ここが hooks / rules / skills / settings の**原本**。各作業リポ（`core`/`web`）へ**手動コピー**して配線する（[subrepo-conventions](../../docs/dev-environment/subrepo-conventions.md)）。各リポで勝手に分岐させない。変更はここで議論してから展開する。

## 中身

| パス | 型 | 役割 |
|---|---|---|
| `hooks/scope-guard.mjs` | block / PreToolUse | 担当リポ外への書き込みを拒否（ADR-0005） |
| `hooks/decision-reminder.mjs` | reminder / PreToolUse | decisions/ 編集時に採録基準を注入 |
| `hooks/memory-guard.mjs` | reminder / PreToolUse | 個人メモリ書き込み時に docs-hub への振り直しを促す |
| `rules/core.md` | rule | core の純粋性ルール（src/** で適用） |
| `rules/typescript.md` | rule | TS共通規約 |
| `skills/check-adr/` | skill | 設計準拠チェック（Stop前の総点検向け） |
| `settings.json` | 設定 | hook配線のテンプレ。lint/typecheck は各リポで埋める |

## 各リポへの配り方

```bash
# 例: core リポで
mkdir -p .claude/hooks .claude/rules .claude/skills
cp ../docs-hub/templates/.claude/hooks/*.mjs        .claude/hooks/
cp ../docs-hub/templates/.claude/rules/*.md         .claude/rules/
cp -R ../docs-hub/templates/.claude/skills/*        .claude/skills/
cp ../docs-hub/templates/.claude/settings.json      .claude/settings.json
# settings.json の Stop フックを、そのリポの実コマンド（npm run typecheck && npm run lint 等）に書き換える
```

- 必要 runtime: Node.js（hooks は `.mjs`、依存なし）。
- 言語・リポ差は `settings.json` の設定値で吸収し、`hooks/*.mjs` の原本は分岐させない。
- hook は `CLAUDE_PROJECT_DIR`（リポルート）を基準に判定するので、コピー先でもそのまま動く。
