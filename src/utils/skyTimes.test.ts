import { describe, it, expect } from 'vitest';
import { nightSkyTimes } from './skyTimes';

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

  it('reports the dark (science) window length in minutes', () => {
    const t = nightSkyTimes(new Date(2026, 10, 1));
    expect(t.scienceMinutes).toBe(Math.round((t.nightEnd.getTime() - t.night.getTime()) / 60000));
    expect(t.scienceMinutes).toBeGreaterThan(9 * 60);
  });
});
