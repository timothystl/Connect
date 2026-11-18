import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The profile's section editor is the only way to edit an existing person. Date of death
// must be on it for deceased people, or "Mark deceased" (which stamps today) can never be
// corrected to the real date.
const src = readFileSync(new URL('../src/frontend/js-people.js', import.meta.url), 'utf8');

describe('death date is editable on a deceased person profile', () => {
  it('registers death_date as a date field', () => {
    expect(src).toMatch(/\{id:'death_date', label:'Date of death', type:'date'\}/);
  });
  it('adds it to the Church life section only for deceased people', () => {
    expect(src).toMatch(/if \(p\.status === 'deceased' \|\| p\.deceased \|\| p\.death_date\) churchIds = churchIds\.concat\(\['death_date'\]\);[\s\S]*section\('church', 'Church life', churchIds/);
  });
});
