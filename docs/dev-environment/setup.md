# setup — 環境の立ち上げ

対象: このワークスペースで作業を始める人/エージェント。

## 前提

- Node.js 20+（`core`/`web` のビルド・テスト）。
- git。各サブリポは独立リポ（[ADR-0008](../decisions/0008-git-topology.md)）。

## 並び順（相対参照の前提）

全リポは同じ親 `jyansou/` 直下に横並び。`web` は `../core` を相対依存で参照する。**この階層を崩さない**（崩すと依存とドキュメントリンクが壊れる）。

```
jyansou/
├── docs-hub/   ← 横断SoT（このリポ群の地図）
├── core/       ← 純粋ロジック
└── web/        ← フロント（core に依存）
```

## 起動（基盤段階）

```bash
# ロジックのテスト
cd core && npm install && npm test

# フロント開発サーバ
cd web && npm install && npm run dev
```

`web` は `core` をローカル依存（`file:../core`）で取り込む（[ADR-0008](../decisions/0008-git-topology.md)）。`core` を変更したら `web` 側で再インストール/再ビルドが要る場合がある。

## エージェントのセットアップ

各リポ直下の `.claude/`（hooks/rules/settings）は、`docs-hub/templates/.claude/` の原本をコピーして配線したもの（[subrepo-conventions](subrepo-conventions.md)）。作業はリポ直下を作業ディレクトリにして開始する（CLAUDE.md が自動ロードされる前提）。

次に読む: [workflow.md](workflow.md)（進め方）→ [security.md](security.md)（責任分界・秘密情報）。
