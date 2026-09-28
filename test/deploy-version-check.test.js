// Guards .github/scripts/check-deploy-version.js, which fails CI and the Connect deploy when
// long-cached browser assets change without a DEPLOY_VERSION bump.
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const { CACHED_ASSETS, readVersion, staleAssets } = require('../.github/scripts/check-deploy-version.js');

describe('DEPLOY_VERSION check', () => {
  it('flags changed cached assets when the version stayed the same', () => {
    expect(staleAssets({
      baseVersion: '0.1.0-alpha.3', headVersion: '0.1.0-alpha.3',
      baseHashes: { '/admin/app-ext.js': 'a', '/admin/app.css': 'c' },
      headHashes: { '/admin/app-ext.js': 'b', '/admin/app.css': 'c' },
    })).toEqual(['/admin/app-ext.js']);
  });

  it('passes when the version was bumped or nothing cached changed', () => {
    expect(staleAssets({
      baseVersion: '0.1.0-alpha.3', headVersion: '0.1.0-alpha.4',
      baseHashes: { '/admin/app-ext.js': 'a' }, headHashes: { '/admin/app-ext.js': 'b' },
    })).toEqual([]);
    expect(staleAssets({
      baseVersion: '0.1.0-alpha.4', headVersion: '0.1.0-alpha.4',
      baseHashes: { '/admin/app-ext.js': 'a' }, headHashes: { '/admin/app-ext.js': 'a' },
    })).toEqual([]);
  });

  it('reads DEPLOY_VERSION from js-core.js', () => {
    expect(readVersion(fs.readFileSync('src/frontend/js-core.js', 'utf8'))).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('covers every route the Worker serves as an immutable ?v= asset', () => {
    const worker = fs.readFileSync('connect-worker.js', 'utf8');
    // Each `if (path === '...') {` block whose body calls assetCacheControl().
    const immutable = worker.split("if (path === '").slice(1)
      .filter((chunk) => /^[^']+'\) \{/.test(chunk) && chunk.split(/\n\s{4}\}\n/)[0].includes('assetCacheControl()'))
      .map((chunk) => chunk.slice(0, chunk.indexOf("'"))).sort();
    expect(immutable.length).toBeGreaterThan(0);
    expect(CACHED_ASSETS.map((a) => a[2]).sort()).toEqual(immutable);
  });
});
