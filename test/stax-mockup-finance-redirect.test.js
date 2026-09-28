import { describe, it, expect } from 'vitest';
import worker from '../connect-worker.js';

// The Stax mockup's staff screens moved to Finance's Giving Entry → Online giving tabs. The old
// Connect URLs redirect there on production and staging; local development keeps the pages.

const stmt = { bind: () => stmt, first: async () => null, all: async () => ({ results: [] }), run: async () => ({ meta: {} }) };
const env = {
  ADMIN_PASSWORD: 'test-signing-secret', SESSION_SECRET: 'test-signing-secret',
  DB: { prepare: () => stmt, batch: async () => [] },
  KV: { get: async () => null, put: async () => {}, delete: async () => {} },
};
const get = (url) => worker.fetch(new Request(url), env, { waitUntil() {}, passThroughOnException() {} });

describe('Stax mockup staff pages redirect to Finance', () => {
  it.each([
    ['/admin/giving/stax-mockup', 'page=online&view=associations'],
    ['/admin/giving/stax-mockup/', 'page=online&view=associations'],
    ['/admin/giving/stax-mockup/funds', 'page=online-form'],
    ['/admin/giving/stax-mockup/recurring', 'page=online&view=recurring'],
  ])('%s on production', async (path, tab) => {
    const res = await get('https://connect.timothystl.org' + path);
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe(`https://finance.timothystl.org/?section=giving&${tab}`);
  });

  it('sends staging to Finance staging', async () => {
    const res = await get('https://connect-staging.timothystl.org/admin/giving/stax-mockup/funds');
    expect(res.headers.get('Location')).toBe('https://finance-staging.timothystl.org/?section=giving&page=online-form');
  });

  it('keeps the original pages for local development', async () => {
    const res = await get('http://localhost:8787/admin/giving/stax-mockup/recurring');
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('/?pane=recurring#giving');
    const funds = await get('http://localhost:8787/admin/giving/stax-mockup/funds');
    expect(funds.status).toBe(200);
    expect(funds.headers.get('Location')).toBeNull();
  });
});
