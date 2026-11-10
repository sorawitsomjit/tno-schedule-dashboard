import { describe, it, expect } from 'vitest';
import { nightSkyTimes, skyTimingCsv } from './skyTimes';

describe('skyTimingCsv', () => {
  const csv = skyTimingCsv(new Date(2026, 10, 1), new Date(2027, 4, 15));
  const lines = csv.trim().split('\n');

  it('has one row per night of the whole cycle', () => {
    expect(lines).toHaveLength(1 + 196);
    expect(lines[1].startsWith('2026-11-01,')).toBe(true);
    expect(lines[196].startsWith('2027-05-15,')).toBe(true);
  });

  it('lists every twilight time, the dark window and the moon', () => {
    expect(lines[0]).toBe('Date,Sunset,CivilDusk,NauticalDusk,AstroDusk,AstroDawn,NauticalDawn,CivilDawn,Sunrise,'
      + 'ScienceDuration,MoonIllumination(%),MoonRise,MoonSet');
    expect(lines[1].split(',')).toHaveLength(13);
    expect(lines[1].split(',')[9]).toMatch(/^\d{2}:\d{2}$/);
  });
});

// Clock time at TNO (UTC+7) regardless of the test machine's timezone
const ict = (d: Date) => {
  const m = (d.getUTCHours() * 60 + d.getUTCMinutes() + 7 * 60) % 1440;
  return m;
};
const near = (d: Date, hhmm: string, tolMin = 2) => {
  const [h, m] = hhmm.split(':').map(Number);
  expect(Math.abs(ict(d) - (h * 60 + m))).toBeLessThanOrEqual(tolMin);
};

describe('nightSkyTimes', () => {
  // Reference: "Ast. Twil (LT)" columns of the C14 TAC schedule PDF
  it('matches the astronomical twilight in the TAC schedule (night of 1 Nov 2026)', () => {
    const t = nightSkyTimes(new Date(2026, 10, 1));
    near(t.night, '19:07');
    near(t.nightEnd, '05:11');
  });

  it('takes the morning times from the following day (night of 15 May 2027)', () => {
    const t = nightSkyTimes(new Date(2027, 4, 15));
    near(t.night, '20:11');
    near(t.nightEnd, '04:33');
    expect(t.nightEnd.getTime()).toBeGreaterThan(t.night.getTime());
  });

  it('computes moon illumination close to the FLI column of the TAC PDF', () => {
    // PDF FLI: 1 Nov 2026 = 54, 30 Jan 2027 = 40, 24 Nov 2026 = 100
    expect(Math.abs(nightSkyTimes(new Date(2026, 10, 1)).moonIllumination - 54)).toBeLessThanOrEqual(2);
    expect(Math.abs(nightSkyTimes(new Date(2027, 0, 30)).moonIllumination - 40)).toBeLessThanOrEqual(2);
    expect(Math.abs(nightSkyTimes(new Date(2026, 10, 24)).moonIllumination - 100)).toBeLessThanOrEqual(2);
  });

  it('reports the dark (science) window length in minutes', () => {
    const t = nightSkyTimes(new Date(2026, 10, 1));
    expect(t.scienceMinutes).toBe(Math.round((t.nightEnd.getTime() - t.night.getTime()) / 60000));
    expect(t.scienceMinutes).toBeGreaterThan(9 * 60);
  });
});
