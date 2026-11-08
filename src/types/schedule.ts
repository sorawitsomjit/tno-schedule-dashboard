export type SessionType = 'PROPOSAL' | 'ENG' | 'DDT' | 'GTO' | 'OPT' | 'OH' | 'Calibration';

export type ObservationStatus = 'Observation' | 'Weather' | 'Technical';

export interface ProposalInfo {
    proposalId: string;
    type: string;
    piName: string;
    fieldOfResearch: string;
    requestInstrument: string;
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
    telescope: '2.4m' | '1m';
    date: string; // YYYY-MM-DD (Start of night)
    moonPhase: number; // 0-100
    proposalId: string;
    instrument: string;
    timeStart: string; // HH:mm
    timeEnd: string; // HH:mm
    allocationId?: string;

    // Joined from ProposalInfo
    type?: string;
    piName?: string;
    fieldOfResearch?: string;
}

export type NightSchedule = {
    date: string;
    sessions: ObservationSession[];
};

export interface DailySummary {
    date: string;
    telescope: '2.4m' | '1m';
    observationTime: number; // minutes
    weatherLoss: number; // minutes
    technicalLoss: number; // minutes
    byProposal: Record<string, number>; // proposalId -> minutes (observation only)
}
