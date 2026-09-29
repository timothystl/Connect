import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { backfillPassThroughFunds, backfillPngPassThrough } from '../src/db.js';

function db() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec("CREATE TABLE funds (id INTEGER PRIMARY KEY, name TEXT, category TEXT NOT NULL DEFAULT 'restricted'); CREATE TABLE chms_config (key TEXT PRIMARY KEY, value TEXT)");
  const ins = sqlite.prepare('INSERT INTO funds (id, name, category) VALUES (?, ?, ?)');
  ins.run(1, "25010 Concordia Children's Services", 'restricted');
  ins.run(2, '25010 Concordia Children – Distribution Check', 'restricted');
  ins.run(3, '40085 General Fund', 'general');
  const statement = (sql, args = []) => ({
    bind: (...next) => statement(sql, next),
    async first() { return sqlite.prepare(sql).get(...args) ?? null; },
    async run() { sqlite.prepare(sql).run(...args); return {}; },
  });
  return { sqlite, prepare: (sql) => statement(sql), async batch(list) { for (const s of list) await s.run(); } };
}

describe('backfillPassThroughFunds', () => {
  it('moves the Concordia Children funds to pass-through once, and never again', async () => {
    const d = db();
    await backfillPassThroughFunds(d);
    expect(d.sqlite.prepare('SELECT id, category FROM funds ORDER BY id').all()).toEqual([
      { id: 1, category: 'passthrough' }, { id: 2, category: 'passthrough' }, { id: 3, category: 'general' },
    ]);
    d.sqlite.prepare("UPDATE funds SET category='restricted' WHERE id=1").run();
    await backfillPassThroughFunds(d);
    expect(d.sqlite.prepare('SELECT category FROM funds WHERE id=1').get().category).toBe('restricted');
  });

  it('moves a restricted PNG fund to pass-through once', async () => {
    const d = db();
    d.sqlite.prepare("INSERT INTO funds (id, name, category) VALUES (4, '25030 PNG Mission Society', 'restricted')").run();
    await backfillPngPassThrough(d);
    expect(d.sqlite.prepare('SELECT category FROM funds WHERE id=4').get().category).toBe('passthrough');
    expect(d.sqlite.prepare('SELECT category FROM funds WHERE id=3').get().category).toBe('general');
    d.sqlite.prepare("UPDATE funds SET category='restricted' WHERE id=4").run();
    await backfillPngPassThrough(d);
    expect(d.sqlite.prepare('SELECT category FROM funds WHERE id=4').get().category).toBe('restricted');
  });
});
