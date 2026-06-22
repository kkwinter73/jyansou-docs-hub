<!-- このファイルは scripts/gen-decisions-index.mjs により自動生成されます。手で編集しないでください。 -->
<!-- 再生成: docs-hub/ で `node scripts/gen-decisions-index.mjs` -->

# 意思決定インデックス（ADR）

横断・恒久の決定だけを 1決定=1ファイルで `decisions/` に置き、ここに索引する。

## 採録基準（これを満たすものだけ載せる）

1. **複数リポ／他人が参照しうる**横断的な決定か？
2. コードやスキーマ、Issue を見ても **"なぜ"が復元できない**か？（特に「あえてやらない」判断）
3. **リポを切り替えても同じことが言える**前提か？

→ どれかが No なら、ここではなく該当リポの `docs/adr/`・設計書・コード・Issue に置く（[記録は薄く保つ](dev-environment/guards.md#decision-reminder)）。各行は「決定を1文＋根拠リンク」だけにし、検証・実装詳細はリンク先に置く。

## 索引

| # | 決定（1文） | ステータス |
|---|---|---|
| [0001](decisions/0001-multi-repo.md) | マルチリポ構成を採用する（docs-hub / core / web） | Accepted |
| [0002](decisions/0002-pure-core-engine.md) | ゲームロジックを純粋・決定論的な `core` リポに分離する | Accepted |
| [0003](decisions/0003-frontend-stack.md) | フロントエンド技術スタックは TypeScript + React + Vite とする | Accepted |
| [0004](decisions/0004-ruleset-riichi-full.md) | 対象ルールは日本リーチ麻雀（フル）。役・点数は段階的に実装する | Accepted |
| [0005](decisions/0005-one-session-one-repo.md) | 1セッション = 1担当リポ制を採用する | Accepted |
| [0006](decisions/0006-immutable-state-reducer.md) | ゲーム状態は不変データ + 遷移関数（reducer）で表現する | Accepted |
| [0007](decisions/0007-seedable-prng.md) | 牌山シャッフル等の乱数は seed 可能な決定論的PRNGを使う | Accepted |
| [0008](decisions/0008-git-topology.md) | git topology — 各サブリポを独立 git リポにし、親はただのディレクトリ | Accepted |
