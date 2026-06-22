#!/usr/bin/env node
// docs/decisions/*.md から docs/decisions-index.md を再生成する。
// 索引は「決定を1文（=各ADRのH1タイトル）＋根拠リンク」だけにする方針（guards.md）。
// 使い方: docs-hub/ で `node scripts/gen-decisions-index.mjs` (--check で差分検査のみ)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const decisionsDir = join(root, 'docs', 'decisions');
const indexPath = join(root, 'docs', 'decisions-index.md');

const HEADER = `<!-- このファイルは scripts/gen-decisions-index.mjs により自動生成されます。手で編集しないでください。 -->
<!-- 再生成: docs-hub/ で \`node scripts/gen-decisions-index.mjs\` -->

# 意思決定インデックス（ADR）

横断・恒久の決定だけを 1決定=1ファイルで \`decisions/\` に置き、ここに索引する。

## 採録基準（これを満たすものだけ載せる）

1. **複数リポ／他人が参照しうる**横断的な決定か？
2. コードやスキーマ、Issue を見ても **"なぜ"が復元できない**か？（特に「あえてやらない」判断）
3. **リポを切り替えても同じことが言える**前提か？

→ どれかが No なら、ここではなく該当リポの \`docs/adr/\`・設計書・コード・Issue に置く（[記録は薄く保つ](dev-environment/guards.md#decision-reminder)）。各行は「決定を1文＋根拠リンク」だけにし、検証・実装詳細はリンク先に置く。

## 索引

| # | 決定（1文） | ステータス |
|---|---|---|
`;

function parse(file) {
  const text = readFileSync(join(decisionsDir, file), 'utf8');
  const h1 = text.match(/^#\s*ADR-(\d+):\s*(.+?)\s*$/m);
  const status = text.match(/^-\s*ステータス:\s*(.+?)\s*$/m);
  if (!h1) throw new Error(`${file}: 先頭に "# ADR-NNNN: タイトル" が必要`);
  return {
    num: h1[1],
    title: h1[2],
    status: status ? status[1] : '(未記載)',
    file,
  };
}

const entries = readdirSync(decisionsDir)
  .filter((f) => /^\d+.*\.md$/.test(f))
  .map(parse)
  .sort((a, b) => a.num.localeCompare(b.num));

const rows = entries
  .map((e) => `| [${e.num}](decisions/${e.file}) | ${e.title} | ${e.status} |`)
  .join('\n');

const out = HEADER + rows + '\n';

const isCheck = process.argv.includes('--check');
if (isCheck) {
  const current = readFileSync(indexPath, 'utf8');
  if (current !== out) {
    console.error('decisions-index.md が古い。`node scripts/gen-decisions-index.mjs` で再生成してください。');
    process.exit(1);
  }
  console.log(`decisions-index.md は最新 (${entries.length}件)`);
} else {
  writeFileSync(indexPath, out);
  console.log(`decisions-index.md を再生成 (${entries.length}件)`);
}
