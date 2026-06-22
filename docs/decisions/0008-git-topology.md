# ADR-0008: git topology — 各サブリポを独立 git リポにし、親はワークスペース

- ステータス: Accepted
- 日付: 2026-06-22
- 関連: [ADR-0001](0001-multi-repo.md), [ADR-0005](0005-one-session-one-repo.md)

## 決定

`docs-hub` / `core` / `web` を**それぞれ独立した git リポジトリ**として初期化する。親ディレクトリ `jyansou/` はリポを横並びにする**ワークスペース**であり、親リポからはサブリポを `.gitignore` で追跡しない（親リポはワークスペースREADME等のみを持つ薄い存在）。

## 背景

[ADR-0001](0001-multi-repo.md) でマルチリポを選んだ。git topology には選択肢がある: (A) 各リポ独立、(B) git submodule、(C) モノレポ + workspaces。`jyansou/` は既に `git init` 済み（コミットなし）だったため、その扱いも決める必要があった。

## 帰結

- **良い**: 各リポが独立した履歴・ブランチ・Issue・ガードを持てる。[ADR-0005](0005-one-session-one-repo.md)（1セッション1リポ）と素直に対応する。将来リモートを別々に持てる。
- **悪い / コスト**: 親リポ配下にネストした git リポができる（親からは gitignore 済みなので衝突はしない）。リポ間のバージョン整合は手動。
- **運用**: `web` → `core` の依存は、当面 npm の **ローカルファイル依存**（`file:../core`）で繋ぐ。公開レジストリには出さない。

## 検討した代替案

- **git submodule (B)**: バージョン固定はできるが、個人開発では submodule 更新の手間と事故が多い。却下。
- **モノレポ + pnpm workspaces (C)**: 配線は最も楽。ただし `docs-hub` という非コードSoTの独立性と、リポ単位の独立性（[ADR-0005](0005-one-session-one-repo.md)）を最優先し、今回は不採用。`server` 追加等で関心が増えたら再検討の余地を残す（その場合ADRで上書き）。
