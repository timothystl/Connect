import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { LCMS_CALENDAR_JSON } from '../src/lectionary.js';

// The first Sunday in November is observed as All Saints Day, not the ordinary
// Sunday after Pentecost. The Lector/Liturgist emails draw from this calendar.
describe('LCMS calendar: All Saints Day', () => {
  const cal = JSON.parse(LCMS_CALENDAR_JSON).calendar;

  it('uses the All Saints readings on November 1, 2026', () => {
    const e = cal['2026-11-01'];
    expect(e.sundayName).toBe("All Saints' Day");
    expect(e.ot).toBe('Revelation 7:(2-8) 9-17');
    expect(e.epistle).toBe('1 John 3:1-3');
    expect(e.gospel).toBe('Matthew 5:1-12');
    expect(e.psalm).toBe('Psalm 149');
  });

  it('marks every first Sunday in November as All Saints', () => {
    for (const [d, e] of Object.entries(cal)) {
      const x = new Date(d + 'T12:00:00Z');
      if (x.getUTCMonth() === 10 && x.getUTCDate() <= 7 && x.getUTCDay() === 0) {
        expect(e.sundayName, d).toMatch(/^All Saints' Day/);
        expect(e.epistle, d).toBe('1 John 3:1-3');
      }
    }
  });

  it('keeps the shipped JSON copies identical to the bundled calendar', () => {
    expect(readFileSync('lcms_calendar.json', 'utf8')).toBe(LCMS_CALENDAR_JSON);
    expect(readFileSync('scheduler/lcms_calendar.json', 'utf8')).toBe(LCMS_CALENDAR_JSON);
  });
});

describe('LCMS calendar: festivals and sources', () => {
  const cal = JSON.parse(LCMS_CALENDAR_JSON).calendar;
  const isSunday = (d) => new Date(d + 'T12:00:00Z').getUTCDay() === 0;

  it('observes Reformation on the last Sunday in October, keeping the Sunday as the "or" choice', () => {
    expect(cal['2026-10-25'].sundayName).toBe('Reformation Day (observed)');
    expect(cal['2026-10-25'].alternates[0].name).toMatch(/prop25/);
    for (const [d, e] of Object.entries(cal)) {
      if (isSunday(d) && d.slice(5, 7) === '10' && +d.slice(8) >= 25) expect(e.sundayName, d).toMatch(/^Reformation Day/);
    }
  });

  it('carries weekday festivals with their LCMS readings', () => {
    expect(cal['2026-09-29'].sundayName).toBe('St. Michael and All Angels');
    expect(cal['2026-10-31'].sundayName).toBe('Reformation Day');
    expect(cal['2028-04-25'].sundayName).toBe('St. Mark, Evangelist');
    expect(cal['2028-04-25'].gospel).toBe('Mark 16:14-20');
  });

  it('offers a festival that falls on a Sunday as an alternate, per the LCMS calendar', () => {
    expect(cal['2026-10-18'].alternates.map((a) => a.name)).toContain('St. Luke, Evangelist');
    expect(cal['2027-01-24'].sundayName).toBe('St. Timothy, Pastor and Confessor');
  });

  it('defaults Christmas Day and Easter to the main service, with the others as alternates', () => {
    expect(cal['2026-12-25'].sundayName).toMatch(/Christmas Day/);
    expect(cal['2026-12-25'].alternates.map((a) => a.name).join()).toMatch(/Midnight.*Dawn/);
    expect(cal['2026-04-05'].alternates[0].name).toMatch(/Sunrise/);
  });

  it('takes readings from the LCMS calendars and says so', () => {
    const entries = Object.values(cal);
    expect(entries.every((e) => typeof e.source === 'string' && e.source)).toBe(true);
    const fromYaag = entries.filter((e) => e.source === 'yaag.org').length;
    expect(fromYaag / entries.length).toBeLessThan(0.05);
    // A reading the old scrape had wrong (Hebrews 12:4-29) now matches LCMS.
    expect(cal['2028-08-27'].epistle).toBe('Hebrews 12:4-24 (25-29)');
  });

  it('stores one passage per reading, with full book names and plain hyphens', () => {
    for (const [d, e] of Object.entries(cal)) {
      for (const f of ['ot', 'epistle', 'gospel']) {
        expect(e[f], d + ' ' + f).not.toMatch(/[–—]| or |\b(Matt|Rom|Heb|Rev|Gen|Ex|Deut)\.\s/);
      }
    }
  });

  it('drops Canadian Thanksgiving, which is not on the LCMS calendar', () => {
    expect(Object.values(cal).some((e) => /Canada/.test(e.sundayName))).toBe(false);
  });
});
