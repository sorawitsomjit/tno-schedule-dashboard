"use client";

import React from 'react';
import { ObservationSession } from '@/types/schedule';
import { NightRange, barPosition } from '@/utils/timeline';
import { instrumentText, sessionColor, sessionLabel, textColorFor, typeBadge } from '@/utils/sessionDisplay';
import { cn } from '@/utils/cn';

export function sessionTooltip(s: ObservationSession): string {
    return [
        `${s.telescope}  ${s.timeStart}–${s.timeEnd}`,
        `${sessionLabel(s)}${typeBadge(s) ? ` (${typeBadge(s)})` : ''}`,
        `Proposal: ${s.proposalId}`,
        instrumentText(s.instrument) && `Instrument: ${s.instrument}`,
    ].filter(Boolean).join('\n');
}

interface SessionBarProps {
    session: ObservationSession;
    range: NightRange;
    showLabel?: boolean;
    className?: string;
}

/** One allocation drawn on a night axis, in the colour used by the TAC PDF. */
export const SessionBar: React.FC<SessionBarProps> = ({ session, range, showLabel = true, className }) => {
    const { left, width } = barPosition(range, session.timeStart, session.timeEnd);
    const bg = sessionColor(session);
    const instrument = instrumentText(session.instrument);
    return (
        <div
            className={cn("absolute top-0 bottom-0 overflow-hidden border-r border-slate-950/60", className)}
            style={{ left: `${left}%`, width: `${width}%`, backgroundColor: bg, color: textColorFor(bg) }}
            title={sessionTooltip(session)}
        >
            {showLabel && (
                <div className="h-full flex flex-col justify-center px-1.5 leading-tight">
                    <span className="text-[10px] md:text-xs font-bold truncate">{sessionLabel(session)}</span>
                    {instrument && <span className="hidden sm:block text-[10px] opacity-80 truncate">{instrument}</span>}
                </div>
            )}
        </div>
    );
};
