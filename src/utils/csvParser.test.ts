import { describe, it, expect } from 'vitest';
import { sortSessionsByTime } from './csvParser';

describe('sortSessionsByTime', () => {
  it('orders sessions from 19:00 through after-midnight times', () => {
    const sessions = [
      { timeStart: '01:00' },
      { timeStart: '23:30' },
      { timeStart: '19:00' },
      { timeStart: '05:00' },
    ];

    const sorted = sortSessionsByTime(sessions);
    expect(sorted.map(s => s.timeStart)).toEqual(['19:00', '23:30', '01:00', '05:00']);
  });
});
