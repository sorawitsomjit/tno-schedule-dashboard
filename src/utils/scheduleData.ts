import Papa from 'papaparse';
import { ObservationSession, ScheduleMeta, Telescope } from '@/types/schedule';
import { normalizeTime, toNightMinutes } from './time';

// Written by the tac-schedule-pdf skill (export_csv.py) next to the CSV files in public/.
const META_URL = '/schedule_meta.json';

export async function fetchScheduleMeta(): Promise<ScheduleMeta> {
    const response = await fetch(META_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch ${META_URL}: ${response.status}`);
    return response.json();
}

/** Parse one exported schedule CSV (one row per allocation). Rows without a proposal or time are skipped. */
export function parseScheduleCsv(csvText: string, telescope: Telescope): ObservationSession[] {
    const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
    return data.flatMap((row) => {
        const proposalId = row.ProposalID?.trim();
        const date = row.Date?.trim();
        const timeStart = normalizeTime(row.TimeStart);
        const timeEnd = normalizeTime(row.TimeEnd);
        if (!proposalId || !date || !timeStart || !timeEnd) return [];
        const instrument = row.Instrument?.trim() || '-';
        return [{
            id: `${telescope}|${date}|${timeStart}`,
            allocationId: [date, telescope, proposalId, timeStart, timeEnd, instrument].join('|'),
            telescope,
            date,
            proposalId,
            shortCode: row.ShortCode?.trim() || undefined,
            type: row.Type?.trim() || 'Proposal',
            piName: row.PIName?.trim() || undefined,
            instrument,
            timeStart,
            timeEnd,
            moonPhase: Number(row.MoonPhase) || 0,
            color: row.Color?.trim() || undefined,
        }];
    });
}

/** Load every telescope listed in schedule_meta.json. */
export async function fetchSchedule(): Promise<{ meta: ScheduleMeta; sessions: ObservationSession[] }> {
    const meta = await fetchScheduleMeta();
    const perTelescope = await Promise.all(
        (Object.keys(meta.telescopes) as Telescope[]).map(async (telescope) => {
            const file = meta.telescopes[telescope]?.file;
            if (!file) return [];
            const response = await fetch(`/${file}`, { cache: 'no-store' });
            if (!response.ok) {
                console.error(`Failed to fetch ${file}: ${response.status}`);
                return [];
            }
            return parseScheduleCsv(await response.text(), telescope);
        })
    );
    return { meta, sessions: perTelescope.flat() };
}

/** Night order: 19:00 comes before 01:00. */
export function sortSessionsByTime<T extends { timeStart: string }>(sessions: T[]): T[] {
    return [...sessions].sort((a, b) => toNightMinutes(a.timeStart) - toNightMinutes(b.timeStart));
}
