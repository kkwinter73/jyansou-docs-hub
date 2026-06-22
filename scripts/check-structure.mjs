#!/usr/bin/env node
// 構造ガード: docs-hub の不変条件を検査する。CI / Stop hook から呼ぶ想定。
// 使い方: docs-hub/ で `node scripts/check-structure.mjs`
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

// 1. 各 ADR は "# ADR-NNNN:" と "- ステータス:" を持ち、番号が一意
const decisionsDir = join(root, 'docs', 'decisions');
const seen = new Map();
for (const f of readdirSync(decisionsDir).filter((x) => /^\d+.*\.md$/.test(x))) {
  const t = readFileSync(join(decisionsDir, f), 'utf8');
  const h1 = t.match(/^#\s*ADR-(\d+):/m);
  if (!h1) errors.push(`${f}: "# ADR-NNNN: タイトル" がない`);
  else if (seen.has(h1[1])) errors.push(`ADR番号 ${h1[1]} が重複: ${f} と ${seen.get(h1[1])}`);
  else seen.set(h1[1], f);
  if (!/^-\s*ステータス:/m.test(t)) errors.push(`${f}: "- ステータス:" がない`);
}

// 2. 共通部品の原本が存在する
for (const p of ['templates/.claude/hooks', 'templates/.claude/rules']) {
  if (!existsSync(join(root, p))) errors.push(`原本が無い: ${p}`);
}

// 3. 索引が最新か（gen --check 相当の軽量版: 件数とリンク存在）
const indexPath = join(root, 'docs', 'decisions-index.md');
const index = readFileSync(indexPath, 'utf8');
for (const [num, file] of seen) {
  if (!index.includes(`decisions/${file}`)) {
    errors.push(`索引に ADR-${num}(${file}) のリンクが無い → gen-decisions-index.mjs を実行`);
  }
}

if (errors.length) {
  console.error('構造チェック失敗:\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`構造チェックOK (ADR ${seen.size}件)`);
