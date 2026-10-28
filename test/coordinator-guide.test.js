import { describe, it, expect } from 'vitest';
import worker from '../connect-worker.js';

// The coordinator guide is read before signing in, so it must load without a session.
const ENV = {
  DB: {
    prepare: () => ({
      bind: () => ({ first: async () => null, all: async () => ({ results: [] }), run: async () => ({ meta: {} }) }),
      first: async () => null, all: async () => ({ results: [] }), run: async () => ({ meta: {} }),
    }),
    batch: async () => [],
  },
};

describe('coordinator guide', () => {
  it('is public and covers each coordinator task', async () => {
    const r = await worker.fetch(new Request('https://connect.timothystl.org/coordinator-guide'), ENV);
    expect(r.status).toBe(200);
    const body = await r.text();
    for (const id of ['signin', 'shifts', 'who', 'past', 'invite', 'remind', 'close']) expect(body).toContain(`id="${id}"`);
  });
});
