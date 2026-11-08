import Papa from 'papaparse';
import { ProposalInfo } from '../types/schedule';

const PROPOSAL_LIST_FILES = {
    '2.4m': '/2.4m_C13_prososal_lis.csv',
    '1m': '/1m_C13_prososal_list.csv'
};

// Cache to prevent multiple fetches
const proposalCache: Record<string, ProposalInfo[]> = {};

/**
 * Fetch and parse a proposal list for a specific telescope
 */
export async function fetchProposalList(telescope: '2.4m' | '1m'): Promise<ProposalInfo[]> {
    if (proposalCache[telescope]) return proposalCache[telescope];

    try {
        const response = await fetch(PROPOSAL_LIST_FILES[telescope]);
        if (!response.ok) {
            console.error(`Failed to fetch proposal list for ${telescope}: ${response.status} ${response.statusText}`);
            return [];
        }
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const mapped = results.data
                        .map((row: any) => ({
                            proposalId: row.ProposalID || row.proposalId,
                            type: row.Type || row.type,
                            piName: row.PIName || row.piName,
                            fieldOfResearch: row.FieldOfResearch || row.fieldOfResearch,
                            requestInstrument: row.RequestInstrument || row['Request Instrument'] || row.instrument
                        }))
                        .filter((p: ProposalInfo) => Boolean(p.proposalId));
                    proposalCache[telescope] = mapped;
                    resolve(mapped);
                },
                error: (error: Error) => reject(error)
            });
        });
    } catch (error) {
        console.error(`Failed to fetch proposal list for ${telescope}:`, error);
        return [];
    }
}

/**
 * Find proposal info by ID (XLOOKUP style)
 */
export async function lookupProposal(
    proposalId: string,
    telescope: '2.4m' | '1m'
): Promise<ProposalInfo | null> {
    const list = await fetchProposalList(telescope);
    const found = list.find(p => p.proposalId === proposalId);

    // Fallback for system IDs if not in list
    if (!found) {
        if (proposalId === 'ENG') return { proposalId: 'ENG', type: 'ENG', piName: 'Engineering', fieldOfResearch: 'Maintenance', requestInstrument: 'ALL' };
        if (proposalId === 'Calibration') return { proposalId: 'Calibration', type: 'Calibration', piName: 'System', fieldOfResearch: 'Calibration', requestInstrument: 'ALL' };
    }

    return found || null;
}
