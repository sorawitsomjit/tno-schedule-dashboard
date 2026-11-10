import { describe, it, expect } from 'vitest';
import { normalizeTime, toNightMinutes } from './time';
import { nightRange, barPosition, hourTicks, twilightOnAxis } from './timeline';

describe('normalizeTime', () => {
  it('pads single-digit hours and rejects junk', () => {
    expect(normalizeTime('3:00')).toBe('03:00');
    expect(normalizeTime(' 19:30 ')).toBe('19:30');
    expect(normalizeTime('25:00')).toBeNull();
    expect(normalizeTime('')).toBeNull();
    expect(normalizeTime(undefined)).toBeNull();
  });
});

describe('toNightMinutes', () => {
  it('puts after-midnight times on the following day', () => {
    expect(toNightMinutes('19:00')).toBe(19 * 60);
    expect(toNightMinutes('00:00')).toBe(24 * 60);
    expect(toNightMinutes('05:30')).toBe(29 * 60 + 30);
  });
});

describe('nightRange', () => {
  it('defaults to 19:00-05:00 for a normal night', () => {
    expect(nightRange([{ timeStart: '19:00', timeEnd: '01:30' }, { timeStart: '01:30', timeEnd: '05:00' }]))
      .toEqual({ start: 19 * 60, end: 29 * 60 });
  });

  it('extends only as far as the latest slot (05:30 / 06:00)', () => {
    expect(nightRange([{ timeStart: '01:30', timeEnd: '05:30' }]).end).toBe(29 * 60 + 30);
    expect(nightRange([{ timeStart: '00:00', timeEnd: '06:00' }]).end).toBe(30 * 60);
  });

  it('defaults when there are no sessions', () => {
    expect(nightRange([])).toEqual({ start: 19 * 60, end: 29 * 60 });
  });
});

describe('barPosition', () => {
  it('maps a slot to percentages of the range', () => {
    const range = { start: 19 * 60, end: 29 * 60 }; // 10 h
    expect(barPosition(range, '19:00', '00:00')).toEqual({ left: 0, width: 50 });
    expect(barPosition(range, '04:00', '05:00')).toEqual({ left: 90, width: 10 });
  });
});

describe('twilightOnAxis', () => {
  const marks = [
    { deg: '0°', time: '17:51', side: 'dusk' as const },
    { deg: '-12°', time: '18:40', side: 'dusk' as const },
    { deg: '-18°', time: '19:06', side: 'dusk' as const },
    { deg: '-18°', time: '05:11', side: 'dawn' as const },
    { deg: '-12°', time: '05:40', side: 'dawn' as const },
  ];

  it('keeps only twilight lines that fall inside the night axis', () => {
    const lines = twilightOnAxis({ start: 19 * 60, end: 29 * 60 }, marks);
    expect(lines.map(l => `${l.deg} ${l.time}`)).toEqual(['-18° 19:06']);
    expect(lines[0].pct).toBeCloseTo(6 / 600 * 100);
  });

  it('shows the morning lines when the axis is extended to 06:00', () => {
    const lines = twilightOnAxis({ start: 19 * 60, end: 30 * 60 }, marks);
    expect(lines.map(l => `${l.deg} ${l.time}`)).toEqual(['-18° 19:06', '-18° 05:11', '-12° 05:40']);
  });
});

describe('hourTicks', () => {
  it('labels every whole hour inside the range', () => {
    const ticks = hourTicks({ start: 19 * 60, end: 29 * 60 + 30 });
    expect(ticks.map(t => t.label)).toEqual(
      ['19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00']);
    expect(ticks[0].pct).toBe(0);
    expect(ticks[ticks.length - 1].pct).toBeCloseTo(600 / 630 * 100);
  });
});
