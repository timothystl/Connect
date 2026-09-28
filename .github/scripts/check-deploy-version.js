#!/usr/bin/env node
// Fails when Connect's long-cached browser assets changed but DEPLOY_VERSION did not.
//
// The app bundles, app.css, the Scheduler embed and the public Serve CSS/JS are served as
// `public, max-age=31536000, immutable` under ?v=DEPLOY_VERSION, and the service worker caches
// them cache-first under a DEPLOY_VERSION-named cache. Shipping new bundle content under an
// unchanged version leaves every browser that already has the app running its old copy, with
// no way to pick up the new one. That happened for four releases after 0.1.0-alpha.3.
//
// Rather than guess which source files feed those assets, this builds them from both commits
// (with the version string itself masked out) and compares the actual bytes that would be served.
//
// Usage: node .github/scripts/check-deploy-version.js [base-ref]
//   base-ref defaults to the merge base with origin/main. The deploy workflow passes the last
//   successfully deployed commit instead.
'use strict';
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

// Every export connect-worker.js serves through assetCacheControl() (immutable when ?v matches).
const CACHED_ASSETS = [
  ['src/html-chms.js', 'CHMS_APP_MEMBER_JS', '/admin/app-member.js'],
  ['src/html-chms.js', 'CHMS_APP_STAFF_JS', '/admin/app-staff.js'],
  ['src/html-chms.js', 'CHMS_APP_EXT_JS', '/admin/app-ext.js'],
  ['src/html-chms.js', 'CHMS_APP_FINANCE_JS', '/admin/app-finance.js'],
  ['src/html-chms.js', 'CHMS_APP_CSS', '/admin/app.css'],
  ['src/html-chms.js', 'CHMS_SCHEDULER_HTML', '/admin/scheduler-embed.html'],
  ['src/html-chms.js', 'CHMS_SCHEDULER_JS', '/admin/scheduler-embed.js'],
  ['src/html-templates.js', 'PUBLIC_APP_CSS', '/serve-app.css'],
  ['src/html-templates.js', 'PUBLIC_APP_JS', '/serve-app.js'],
];

const VERSION_FILE = 'src/frontend/js-core.js';
const VERSION_RE = /export const DEPLOY_VERSION = '([^']+)';/;

function git(args, opts = {}) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
}

function readVersion(source) {
  const m = VERSION_RE.exec(source || '');
  return m ? m[1] : null;
}

async function assetHashes(root, version) {
  const out = {};
  const mods = {};
  for (const [file, name, route] of CACHED_ASSETS) {
    mods[file] ||= await import(pathToFileURL(path.join(root, file)).href);
    const value = mods[file][name];
    if (typeof value !== 'string') throw new Error(`${file} no longer exports ${name} as a string`);
    out[route] = crypto.createHash('sha256').update(value.split(version).join('__DEPLOY_VERSION__')).digest('hex');
  }
  return out;
}

// Pure decision, exported for tests: which cached routes changed while the version stayed put.
function staleAssets({ baseVersion, headVersion, baseHashes, headHashes }) {
  if (baseVersion !== headVersion) return [];
  return Object.keys(headHashes).filter((route) => baseHashes[route] !== headHashes[route]);
}

async function main() {
  const repo = git(['rev-parse', '--show-toplevel']);
  let base = process.argv[2];
  if (!base) base = git(['merge-base', 'HEAD', 'origin/main'], { cwd: repo });
  const baseSha = git(['rev-parse', '--verify', `${base}^{commit}`], { cwd: repo });
  const headSha = git(['rev-parse', 'HEAD'], { cwd: repo });
  if (baseSha === headSha) {
    console.log(`Base and head are the same commit (${headSha.slice(0, 7)}); nothing to compare.`);
    return;
  }

  const headVersion = readVersion(fs.readFileSync(path.join(repo, VERSION_FILE), 'utf8'));
  let baseSource = null;
  try { baseSource = git(['show', `${baseSha}:${VERSION_FILE}`], { cwd: repo }); } catch { /* absent at base */ }
  const baseVersion = readVersion(baseSource);
  if (!headVersion) throw new Error(`Could not read DEPLOY_VERSION from ${VERSION_FILE}`);
  if (baseVersion !== headVersion) {
    console.log(`DEPLOY_VERSION changed ${baseVersion || '(none)'} -> ${headVersion}; cached assets will be refetched.`);
    return;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'connect-base-'));
  const worktree = path.join(tmp, 'base');
  git(['worktree', 'add', '--detach', worktree, baseSha], { cwd: repo });
  try {
    const [baseHashes, headHashes] = [await assetHashes(worktree, baseVersion), await assetHashes(repo, headVersion)];
    const stale = staleAssets({ baseVersion, headVersion, baseHashes, headHashes });
    if (stale.length) {
      console.error(
        `::error file=${VERSION_FILE}::Connect's cached browser assets changed since ${baseSha.slice(0, 7)} ` +
        `but DEPLOY_VERSION is still ${headVersion}. Browsers would keep running the old code. ` +
        `Bump DEPLOY_VERSION in ${VERSION_FILE} (see docs/VERSIONING.md). Changed: ${stale.join(', ')}`
      );
      process.exitCode = 1;
      return;
    }
    console.log(`No cached Connect asset changed since ${baseSha.slice(0, 7)}; DEPLOY_VERSION ${headVersion} can stay.`);
  } finally {
    git(['worktree', 'remove', '--force', worktree], { cwd: repo });
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

module.exports = { CACHED_ASSETS, readVersion, staleAssets };

if (require.main === module) {
  main().catch((e) => {
    console.error(`::error::check-deploy-version failed: ${e.message}`);
    process.exit(1);
  });
}
