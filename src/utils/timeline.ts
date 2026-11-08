import { fromNightMinutes, toNightMinutes } from './time';

export interface NightRange {
    start: number; // night minutes (see toNightMinutes)
    end: number;
}

// A normal night is drawn 19:00-05:00; it only widens when a slot actually runs past that.
const DEFAULT_START = 19 * 60;
const DEFAULT_END = 29 * 60;

export function nightRange(sessions: { timeStart: string; timeEnd: string }[]): NightRange {
    let start = DEFAULT_START;
    let end = DEFAULT_END;
    for (const s of sessions) {
        start = Math.min(start, toNightMinutes(s.timeStart));
        end = Math.max(end, toNightMinutes(s.timeEnd));
    }
    return { start, end };
}

/** Left offset and width of a slot, in percent of the range. */
export function barPosition(range: NightRange, timeStart: string, timeEnd: string) {
    const total = range.end - range.start;
    const s = Math.max(range.start, toNightMinutes(timeStart));
    const e = Math.min(range.end, toNightMinutes(timeEnd));
    return { left: ((s - range.start) / total) * 100, width: (Math.max(0, e - s) / total) * 100 };
}

/** Whole-hour labels inside the range with their position in percent. */
export function hourTicks(range: NightRange): { label: string; pct: number }[] {
    const ticks = [];
    for (let m = Math.ceil(range.start / 60) * 60; m <= range.end; m += 60) {
        ticks.push({ label: fromNightMinutes(m), pct: ((m - range.start) / (range.end - range.start)) * 100 });
    }
    return ticks;
}
