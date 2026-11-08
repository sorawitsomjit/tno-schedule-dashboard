import { ActualObservation, DailySummary } from '../types/schedule';

/**
 * Calculate summary statistics for a telescope's night
 */
export function calculateDailySummary(
    date: string,
    telescope: '2.4m' | '1m',
    actualData: ActualObservation[]
): DailySummary {
    let observationTime = 0;
    let weatherLoss = 0;
    let technicalLoss = 0;
    const byProposal: Record<string, number> = {};

    const dayData = actualData.filter(d => d.date === date);

    dayData.forEach(obs => {
        if (obs.isCalibration) return;
        obs.segments.forEach(seg => {
            if (!seg.actualStart || !seg.actualEnd) return;

            const duration = getDurationInMinutes(seg.actualStart, seg.actualEnd);

            if (seg.status === 'Observation') {
                observationTime += duration;
                byProposal[obs.proposalId] = (byProposal[obs.proposalId] || 0) + duration;
            }

            if (seg.status === 'Weather') {
                weatherLoss += duration;
            }

            if (seg.status === 'Technical') {
                technicalLoss += duration;
            }
        });
    });

    return {
        date,
        telescope,
        observationTime,
        weatherLoss,
        technicalLoss,
        byProposal
    };
}

/**
 * Helper to calculate minutes between HH:mm strings (handling midnight rollover)
 */
function getDurationInMinutes(start: string, end: string): number {
    const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return { h, m };
    };

    const s = parseTime(start);
    const e = parseTime(end);

    const startTotal = s.h * 60 + s.m;
    let endTotal = e.h * 60 + e.m;

    if (endTotal < startTotal) {
        endTotal += 24 * 60;
    }

    return endTotal - startTotal;
}
