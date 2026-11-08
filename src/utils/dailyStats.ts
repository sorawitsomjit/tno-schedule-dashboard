import Papa from 'papaparse';

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
        Papa.parse<Record<string, string>>(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const stats: DailyStat[] = results.data
                    .map((row: Record<string, string>) => ({
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
            error: (error: Error) => {
                reject(error);
            }
        });
    });
}
