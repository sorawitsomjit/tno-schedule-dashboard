import Papa from 'papaparse';
import { ObservationSession, SessionType } from '@/types/schedule';

export async function fetchAndParseSchedule(csvUrls: string[] = ['/2.4m_C13_schedule.csv', '/1m_C13_schedule.csv']): Promise<ObservationSession[]> {
    const promises = csvUrls.map(async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) return [];
            const csvText = await response.text();

            return new Promise<ObservationSession[]>((resolve) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const sessions = results.data.map((row: any, index: number) => ({
                            id: `${url.split('/').pop()}-${index}`, // Unique ID based on filename
                            date: row.Date,
                            telescope: row.Telescope as '2.4m' | '1m',
                            proposalId: row.ProposalID,
                            type: row.Type as SessionType,
                            piName: row.PIName,
                            fieldOfResearch: row.FieldOfResearch,
                            instrument: row.Instrument,
                            timeStart: row.TimeStart,
                            timeEnd: row.TimeEnd,
                            moonPhase: parseInt(row.MoonPhase, 10) || 0,
                        }));
                        resolve(sessions);
                    },
                    error: () => resolve([]) // Return empty on parse error
                });
            });
        } catch (e) {
            console.error(`Failed to fetch ${url}`, e);
            return [];
        }
    });

    const results = await Promise.all(promises);
    return results.flat();
}

// Logic to sort sessions correctly for a "Night" view (12:00 PM to 11:59 AM next day)
// We want 19:00 to come before 01:00
export function sortSessionsByTime(sessions: ObservationSession[]): ObservationSession[] {
    return [...sessions].sort((a, b) => {
        const getAdjustedTime = (time: string) => {
            const [h, m] = time.split(':').map(Number);
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
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const stats: DailyStat[] = results.data.map((row: any) => ({
                    date: row.Date,
                    telescope: row.Telescope as '2.4m' | '1m',
                    proposalId: row.ProposalID,
                    allocatedTime: parseFloat(row['AllocatedTime(h)']) || 0,
                    weatherLoss: parseFloat(row['WeatherDownTime(h)']) || 0,
                    technicalLoss: parseFloat(row['TechnicalDownTime(h)']) || 0,
                }));
                resolve(stats);
            },
            error: (error: any) => {
                reject(error);
            }
        });
    });
}
