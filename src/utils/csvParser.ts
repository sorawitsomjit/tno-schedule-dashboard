import Papa from 'papaparse';
import { ObservationSession } from '@/types/schedule';
import { fetchProposalList } from '@/utils/proposalLookup';

const SCHEDULE_FILES = [
    { url: '/2.4m_C13_schedule.csv', telescope: '2.4m' },
    { url: '/1m_C13_schedule.csv', telescope: '1m' }
];

const normalizeTime = (time: string | undefined | null): string | null => {
    if (!time) return null;
    const trimmed = String(time).trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const buildAllocationId = (params: {
    date: string;
    telescope: string;
    proposalId: string;
    timeStart: string;
    timeEnd: string;
    instrument: string;
}) => {
    return [
        params.date,
        params.telescope,
        params.proposalId,
        params.timeStart,
        params.timeEnd,
        params.instrument
    ].join('|');
};

/**
 * Main Fetcher: Parses all schedule CSVs and joins with proposal info
 */
export const fetchAndParseSchedule = async (): Promise<ObservationSession[]> => {
    const allData: ObservationSession[] = [];

    for (const file of SCHEDULE_FILES) {
        try {
            const response = await fetch(file.url);
            if (!response.ok) {
                console.error(`Failed to fetch ${file.url}: ${response.status} ${response.statusText}`);
                continue;
            }
            const csvText = await response.text();

            // Fetch proposal list for joining
            const proposals = await fetchProposalList(file.telescope as '2.4m' | '1m');

            const results = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true
            });

            const parsed = results.data.flatMap((row: any, index: number) => {
                const propId = row.ProposalID || row.proposalId;
                const date = row.Date || row.date;
                const timeStart = normalizeTime(row.TimeStart || row.timeStart);
                const timeEnd = normalizeTime(row.TimeEnd || row.timeEnd);
                const instrument = row.Instrument || row.instrument || 'Unknown';
                const allocationIdRaw = row.AllocationId || row.allocationId;

                if (!propId || !date || !timeStart || !timeEnd) {
                    console.warn(`Skipping invalid row in ${file.url} at index ${index}`);
                    return [];
                }

                const propInfo = proposals.find(p => p.proposalId === propId);
                const allocationId = allocationIdRaw
                    ? String(allocationIdRaw).trim()
                    : buildAllocationId({
                        date,
                        telescope: file.telescope,
                        proposalId: propId,
                        timeStart,
                        timeEnd,
                        instrument
                    });

                return [{
                    id: `${file.telescope}-${index}`,
                    telescope: file.telescope as '2.4m' | '1m',
                    date,
                    moonPhase: row.MoonPhase || row.moonPhase || 0,
                    proposalId: propId,
                    instrument,
                    timeStart,
                    timeEnd,
                    allocationId,

                    // Join data from proposal list
                    type: propInfo?.type || (propId === 'ENG' ? 'ENG' : propId === 'Calibration' ? 'Calibration' : 'PROPOSAL'),
                    piName: propInfo?.piName || 'Unknown',
                    fieldOfResearch: propInfo?.fieldOfResearch || 'N/A'
                } as ObservationSession];
            });

            allData.push(...parsed);
        } catch (error) {
            console.error(`Failed to load ${file.url}:`, error);
        }
    }

    return allData;
};

// Logic to sort sessions correctly for a "Night" view (12:00 PM to 11:59 AM next day)
// We want 19:00 to come before 01:00
export function sortSessionsByTime(sessions: { timeStart: string }[]): any[] {
    return [...sessions].sort((a, b) => {
        const getAdjustedTime = (time: string) => {
            const [h, m] = (time || "00:00").split(':').map(Number);
            // If hour < 12 (e.g., 01, 05), treat it as next day (h + 24)
            // If hour >= 12 (e.g., 19, 23), treat it as current day
            return (h < 12 ? h + 24 : h) * 60 + m;
        };

        const timeA = getAdjustedTime(a.timeStart);
        const timeB = getAdjustedTime(b.timeStart);

        return timeA - timeB;
    });
}

export interface DailyStat {
    date: string;
    telescope: '2.4m' | '1m';
    proposalId: string;
    allocatedTime: number;
    weatherLoss: number;
    technicalLoss: number;
}

export async function fetchAndParseDailyStats(csvUrl: string): Promise<DailyStat[]> {
    const response = await fetch(csvUrl);
    if (!response.ok) {
        console.error(`Failed to fetch daily stats: ${response.status} ${response.statusText}`);
        return [];
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const stats: DailyStat[] = results.data
                    .map((row: any) => ({
                        date: row.Date,
                        telescope: row.Telescope as '2.4m' | '1m',
                        proposalId: row.ProposalID,
                        allocatedTime: parseFloat(row['AllocatedTime(h)']) || 0,
                        weatherLoss: parseFloat(row['WeatherDownTime(h)']) || 0,
                        technicalLoss: parseFloat(row['TechnicalDownTime(h)']) || 0,
                    }))
                    .filter((row: DailyStat) => Boolean(row.date && row.telescope && row.proposalId));
                resolve(stats);
            },
            error: (error: any) => {
                reject(error);
            }
        });
    });
}
