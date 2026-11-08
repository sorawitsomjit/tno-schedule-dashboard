export type Telescope = '2.4m' | '1m';

export type ObservationStatus = 'Observation' | 'Weather' | 'Technical';

/** public/schedule_meta.json — written by the tac-schedule-pdf skill (export_csv.py). */
export interface ScheduleMeta {
    cycle: string; // e.g. C14
    generatedFrom?: string;
    generatedAt?: string;
    telescopes: Partial<Record<Telescope, {
        version: string; // e.g. V0.20261015
        start: string; // YYYY-MM-DD
        end: string;
        sourcePdf?: string;
        file: string; // CSV file name in public/
    }>>;
}

export interface ObservationSegment {
    segmentNumber: number;
    actualStart: string;
    actualEnd: string;
    status: ObservationStatus;
    notes?: string;
}

export interface ActualObservation {
    date: string; // YYYY-MM-DD
    proposalId: string;
    instrument: string;
    allocatedStart: string;
    allocatedEnd: string;
    segments: ObservationSegment[];
    isCalibration?: boolean;
    calibrationTiming?: 'Evening' | 'Morning';
    calibrationFor?: string;
    allocationId?: string;
}

export interface ObservationSession {
    id: string;
    telescope: Telescope;
    date: string; // YYYY-MM-DD (Start of night)
    moonPhase: number; // FLI 0-100
    proposalId: string; // TNTC14_005, GTO, BUF, ...
    instrument: string;
    timeStart: string; // HH:mm
    timeEnd: string; // HH:mm (may be after 05:00 on some 1m nights)
    allocationId?: string;
    shortCode?: string; // number shown in the PDF cell ("5" also for 5D) or special code (G, B, ...)
    type?: string; // Proposal, DDT, GTO, Engineering, Buffer, Optic, Outreach, Open House
    piName?: string;
    color?: string; // hex colour from the PDF
}

export interface DailySummary {
    date: string;
    telescope: '2.4m' | '1m';
    observationTime: number; // minutes
    weatherLoss: number; // minutes
    technicalLoss: number; // minutes
    byProposal: Record<string, number>; // proposalId -> minutes (observation only)
}
