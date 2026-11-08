import { ObservationSession } from '@/types/schedule';

// Used only when a row has no colour (the CSV normally carries the PDF colour).
const FALLBACK_COLORS = ['#0891b2', '#0284c7', '#4f46e5', '#0d9488', '#7c3aed', '#e11d48', '#2563eb', '#c026d3'];

export function sessionColor(session: Pick<ObservationSession, 'color' | 'proposalId'>): string {
    if (session.color) return session.color;
    let hash = 0;
    for (const ch of session.proposalId) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

/** Dark text on light fills, white text on dark fills (same threshold as the PDF extractor). */
export function textColorFor(hex: string): string {
    const v = hex.replace('#', '');
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b < 140 ? '#ffffff' : '#0f172a';
}

/** Proposal time (incl. DDT given to a proposal) -> "#5 Napaporn"; special time -> its type name. */
export function sessionLabel(session: Pick<ObservationSession, 'type' | 'shortCode' | 'piName'>): string {
    if (session.shortCode && /^\d+$/.test(session.shortCode)) {
        return `#${session.shortCode} ${session.piName ?? ''}`.trim();
    }
    return session.type || session.shortCode || '';
}

/** Badge text when the type adds information to the label (e.g. "#5 Napaporn" + DDT); null otherwise. */
export function typeBadge(session: Pick<ObservationSession, 'type' | 'shortCode' | 'piName'>): string | null {
    if (!session.type || session.type === 'Proposal') return null;
    return session.type === sessionLabel(session) ? null : session.type;
}

export function instrumentText(instrument?: string): string {
    return instrument && instrument !== '-' ? instrument : '';
}
