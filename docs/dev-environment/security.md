# security — 設定の責任分界と秘密情報

## 秘密情報はどのレイヤにも書かない

- ソース・ドキュメント・`settings.json`・hook・ADR に API キー等の秘密を**書かない**。
- 基盤段階では秘密情報を必要としない（シングルプレイは外部通信なし）。オンライン化で必要になったら、環境変数 + gitignore された `settings.local.json` / `.env` に置き、SoTには「置き場所」だけ記す。

## 設定ファイルの責任分界

| ファイル | 役割 | コミット |
|---|---|---|
| `.claude/settings.json` | チーム共有のhook配線・許可。横断標準を置く | する（レビュー経路に乗せドリフト防止） |
| `.claude/settings.local.json` | 個人override | しない（gitignore） |
| `templates/.claude/*` | 共通部品の**原本** | する（docs-hub） |

## 確認プロンプトで秘密を許可リストに刻まない

許可リスト（allow）の編集時、秘密値そのものを書き込まない。許可は**コマンド/パスのパターン**で表現する。setup だけ読んで workflow/security を飛ばすと、確認プロンプトで誤って秘密や危険操作を恒久許可する事故につながる（だから開始プロトコルは A→B→C 順）。

## 越境書き込みの禁止

担当外リポ・横断SoTを副作用で書き換えない（[ADR-0005](../decisions/0005-one-session-one-repo.md)）。scope-guard hook が物理的に止める。隣接リポの例外は `cross-repo-allowlist` に明示したものだけ。
