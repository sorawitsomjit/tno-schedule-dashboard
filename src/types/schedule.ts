export type SessionType = 'PROPOSAL' | 'ENG' | 'DDT' | 'GTO' | 'OPT' | 'OH';

export interface ObservationSession {
    id: string;
    telescope: '2.4m' | '1m';
    date: string; // YYYY-MM-DD (Start of night)
    moonPhase: number; // 0-100
    proposalId: string;
    type: SessionType;
    piName: string;
    fieldOfResearch: string; // Replaces "Target"
    instrument: string;
    timeStart: string; // HH:mm
    timeEnd: string; // HH:mm
}

export type NightSchedule = {
    date: string;
    sessions: ObservationSession[];
};
