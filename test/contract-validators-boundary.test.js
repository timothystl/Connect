import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const validatorsDir = path.join(repoRoot, 'contracts/validators');
const importSpecifiers = (source) =>
  [...source.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);

function jsFilesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return jsFilesUnder(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

describe('shared contract validators boundary', () => {
  it('keeps validators self-contained so either app can own a copy of contracts/', () => {
    const files = jsFilesUnder(validatorsDir);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      for (const spec of importSpecifiers(fs.readFileSync(file, 'utf8'))) {
        expect(spec.startsWith('./'), `${path.basename(file)} imports ${spec}`).toBe(true);
      }
    }
  });

  it('keeps Connect source from importing Finance application code', () => {
    const files = [path.join(repoRoot, 'connect-worker.js'), ...jsFilesUnder(path.join(repoRoot, 'src'))];
    for (const file of files) {
      for (const spec of importSpecifiers(fs.readFileSync(file, 'utf8'))) {
        expect(spec.includes('apps/finance'), `${path.relative(repoRoot, file)} imports ${spec}`).toBe(false);
      }
    }
  });

  // Finance runs its own accounting code (apps/finance/accounting/). Only the older accounting
  // workspace screens still borrow Connect's browser code; that pair is the last tie to remove
  // before Finance can move to its own repository.
  it('keeps Finance from importing Connect source, apart from the older workspace screens', () => {
    const allowed = new Set(['apps/finance/accounting-workspace.js', 'apps/finance/connect-planner.js']);
    for (const file of jsFilesUnder(path.join(repoRoot, 'apps/finance'))) {
      const rel = path.relative(repoRoot, file).split(path.sep).join('/');
      if (allowed.has(rel) || rel.endsWith('.generated.js')) continue;
      for (const spec of importSpecifiers(fs.readFileSync(file, 'utf8'))) {
        const target = path.relative(repoRoot, path.resolve(path.dirname(file), spec)).split(path.sep).join('/');
        expect(spec.startsWith('.') && (target.startsWith('src/') || target === 'connect-worker.js'), `${rel} imports ${spec}`).toBe(false);
      }
    }
  });
});
