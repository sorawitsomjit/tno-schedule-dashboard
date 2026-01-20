import { ObservationSession, SessionType } from '@/types/schedule';
import { addDays, format, startOfToday } from 'date-fns';

const INSTRUMENTS = ['ULTRASPEC', 'MRES', 'DADOS', 'Arcie', 'LCO'];
const PIS = ['Dr. Somchai', 'Dr. Somsak', 'Dr. Malee', 'Prof. Smith', 'GTO Team', 'Engineering Team'];
const RESEARCH_FIELDS = ['Exoplanets', 'Variable Stars', 'Asteroids', 'Nebulae', 'Galaxy Clusters', 'Engineering Test'];

const generateSession = (date: string, index: number, startTime: string, endTime: string): ObservationSession => {
    const isSpecial = Math.random() < 0.2;
    const type: SessionType = isSpecial
        ? (['ENG', 'DDT', 'GTO', 'OPT', 'OH'][Math.floor(Math.random() * 5)] as SessionType)
        : 'PROPOSAL';

    const proposalId = type === 'PROPOSAL'
        ? `ID${String(Math.floor(Math.random() * 22) + 1).padStart(3, '0')}`
        : type;

    return {
        id: `${date}-${index}`,
        telescope: '2.4m',
        date,
        moonPhase: Math.floor(Math.random() * 100),
        proposalId,
        type,
        piName: isSpecial ? 'Staff / Team' : PIS[Math.floor(Math.random() * PIS.length)],
        fieldOfResearch: isSpecial ? 'System Maintenance' : RESEARCH_FIELDS[Math.floor(Math.random() * RESEARCH_FIELDS.length)],
        instrument: INSTRUMENTS[Math.floor(Math.random() * INSTRUMENTS.length)],
        timeStart: startTime,
        timeEnd: endTime,
    };
};

export const generateMockSchedule = (startDate: Date, days: number): ObservationSession[] => {
    const sessions: ObservationSession[] = [];

    for (let i = -5; i < days; i++) { // Generate starting from 5 days ago
        const currentDate = addDays(startDate, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // Randomize number of sessions per night (1-3)
        const numSessions = Math.floor(Math.random() * 3) + 1;

        if (numSessions === 1) {
            sessions.push(generateSession(dateStr, 0, '19:00', '05:00'));
        } else if (numSessions === 2) {
            sessions.push(generateSession(dateStr, 0, '19:00', '23:00'));
            sessions.push(generateSession(dateStr, 1, '23:00', '05:00'));
        } else {
            sessions.push(generateSession(dateStr, 0, '19:00', '22:00'));
            sessions.push(generateSession(dateStr, 1, '22:00', '01:00'));
            sessions.push(generateSession(dateStr, 2, '01:00', '05:00'));
        }
    }

    return sessions;
};

export const MOCK_SCHEDULE = generateMockSchedule(startOfToday(), 30);
