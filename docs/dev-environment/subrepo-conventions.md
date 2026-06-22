# subrepo-conventions — 作業リポの標準形と情報配置

関連: [ADR-0001](../decisions/0001-multi-repo.md) [ADR-0005](../decisions/0005-one-session-one-repo.md)

## 各作業リポの標準形

```
<repo>/
├── CLAUDE.md                 ← 自己完結。横断ルールはバナー+リンク、最重要1行はインライン
├── docs/adr/                 ← このリポ内に閉じた設計判断（横断決定とは別レイヤー）
│   └── README.md
└── .claude/
    ├── settings.json         ← hook配線（PreToolUse/PostToolUse/Stop）
    ├── hooks/                ← templates からコピーした実体
    ├── rules/                ← リポ固有の発動条件付きルール
    ├── skills/
    └── cross-repo-allowlist  ← 越境を例外許可する隣接リポ（1行1パス）
```

## CLAUDE.md の書き方（自己完結）

エージェントが自動ロードするのは**作業リポ直下の CLAUDE.md だけ**。横断ドキュメントは自動で読まれない。だから:

- そのリポで作業するのに必要な情報で自己完結させる。
- 横断ルールは「バナー＋リンク」で導線を張る。ただし**絶対に守らせたい1行はリンクで逃さずインライン**する（毎セッション必ずロードされる）。
  - 例（インライン必須）: 「恒久・横断の知識は個人メモリに保存せず docs-hub へ」「担当リポ外を書かない」。
- 「タスク種別 → 参照すべき横断ドキュメント」マップを置く。

## 共通部品は原本を分岐させない

`hooks/`・共通 `rules/`・`skills/` の原本は `docs-hub/templates/.claude/`。各リポへは**手動コピー**で配る。

- 変更は必ず原本（templates）側で議論してから各リポへ展開する。各リポで勝手に分岐させない。
- 言語・リポ差は `settings.json` の設定値で吸収し、原本は1つに保つ（[原則10](../decisions/0001-multi-repo.md)）。

## rules の書き方

- 発動条件付き（特定拡張子を触るときだけロード等）で小さく載せる。
- ルールファイル自体も自己完結（「詳細は別ファイル」と逃げない）。人間向けの背景は dev-environment 側に置き、役割を分ける。
