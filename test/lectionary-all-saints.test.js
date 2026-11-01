import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LCMS_CALENDAR_JSON } from '../src/lectionary.js';

// The first Sunday in November is observed as All Saints Day, not the ordinary
// Sunday after Pentecost. The Lector/Liturgist emails draw from this calendar.
describe('LCMS calendar: All Saints Day', () => {
  const cal = JSON.parse(LCMS_CALENDAR_JSON).calendar;

  it('uses the All Saints readings on November 1, 2026', () => {
    const e = cal['2026-11-01'];
    expect(e.sundayName).toBe('All Saints Day');
    expect(e.ot).toBe('Revelation 7:( 2-8 ) 9-17');
    expect(e.epistle).toBe('1 John 3:1-3');
    expect(e.gospel).toBe('Matthew 5:1-12');
    expect(e.psalm).toBe('Psalm 149 ( 4 )');
  });

  it('marks every first Sunday in November as All Saints', () => {
    for (const [d, e] of Object.entries(cal)) {
      const x = new Date(d + 'T12:00:00Z');
      if (x.getUTCMonth() === 10 && x.getUTCDate() <= 7 && x.getUTCDay() === 0) {
        expect(e.sundayName, d).toMatch(/^All Saints Day/);
        expect(e.epistle, d).toBe('1 John 3:1-3');
      }
    }
  });

  it('keeps the shipped JSON copies identical to the bundled calendar', () => {
    expect(readFileSync('lcms_calendar.json', 'utf8')).toBe(LCMS_CALENDAR_JSON);
    expect(readFileSync('scheduler/lcms_calendar.json', 'utf8')).toBe(LCMS_CALENDAR_JSON);
  });
});
