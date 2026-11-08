"use client";

import React, { useMemo, useState } from 'react';
import { ObservationSession } from '@/types/schedule';
import { format, isSameMonth, parseISO } from 'date-fns';
import { cn } from '@/utils/cn';
import { nightRange } from '@/utils/timeline';
import { fromNightMinutes } from '@/utils/time';
import { instrumentText, sessionColor, sessionLabel, typeBadge } from '@/utils/sessionDisplay';
import { sortSessionsByTime } from '@/utils/scheduleData';
import { SessionBar } from '@/components/SessionBar';

interface ScheduleTableViewProps {
    allSessions: ObservationSession[];
    currentDate: Date | null;
}

export const ScheduleTableView: React.FC<ScheduleTableViewProps> = ({ allSessions, currentDate }) => {
    const [viewMode, setViewMode] = useState<'ALL' | 'MONTH'>('MONTH');

    // date -> sessions (2.4m first, then 1m, each in night order)
    const grouped = useMemo(() => {
        const filtered = allSessions.filter(s =>
            viewMode === 'ALL' || (currentDate && isSameMonth(parseISO(s.date), currentDate)));
        const byDate: Record<string, ObservationSession[]> = {};
        for (const s of filtered) (byDate[s.date] ??= []).push(s);
        for (const d of Object.keys(byDate)) {
            byDate[d] = ['2.4m', '1m'].flatMap(t => sortSessionsByTime(byDate[d].filter(s => s.telescope === t)));
        }
        return byDate;
    }, [allSessions, currentDate, viewMode]);

    if (!currentDate) return null;
    const sortedDates = Object.keys(grouped).sort();

    return (
        <div className="glass-panel p-0 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-bold text-lg text-slate-200">Full Schedule Data</h3>
                <div className="flex bg-slate-800 rounded-lg p-1">
                    {(['MONTH', 'ALL'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={cn(
                                "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                                viewMode === mode ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                            )}
                        >
                            {mode === 'MONTH' ? 'This Month' : 'All Data'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/80 sticky top-0 z-10 text-slate-400 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                            <th className="p-3 pl-4 border-b border-slate-800 w-[80px]">Telescope</th>
                            <th className="p-3 border-b border-slate-800">Allocation</th>
                            <th className="p-3 border-b border-slate-800 w-[180px]">Timeline</th>
                            <th className="p-3 border-b border-slate-800">Time</th>
                            <th className="p-3 border-b border-slate-800">Instrument</th>
                            <th className="p-3 border-b border-slate-800">Proposal ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {sortedDates.map(date => {
                            const range = nightRange(grouped[date]);
                            return (
                                <React.Fragment key={date}>
                                    <tr className="bg-slate-900/80">
                                        <td colSpan={6} className="p-2 pl-4 font-bold text-blue-200 border-b border-slate-800">
                                            📅 {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                                            <span className="ml-3 text-xs font-normal text-slate-500">
                                                FLI {grouped[date][0]?.moonPhase ?? 0}%
                                                {range.end > 29 * 60 && ` · until ${fromNightMinutes(range.end)}`}
                                            </span>
                                        </td>
                                    </tr>
                                    {grouped[date].map(session => (
                                        <tr key={session.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-3 pl-4">
                                                <span className={cn(
                                                    "font-bold text-xs px-2 py-1 rounded",
                                                    session.telescope === '1m'
                                                        ? "bg-purple-900/30 text-purple-300 border border-purple-800"
                                                        : "bg-blue-900/30 text-blue-300 border border-blue-800"
                                                )}>
                                                    {session.telescope}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-sm shrink-0 border border-white/20"
                                                        style={{ backgroundColor: sessionColor(session) }} />
                                                    <span className="font-medium text-slate-200">{sessionLabel(session)}</span>
                                                    {typeBadge(session) && (
                                                        <span className="text-[10px] bg-amber-900/50 text-amber-200 px-1 rounded border border-amber-800">
                                                            {typeBadge(session)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="w-[160px] h-4 bg-slate-800 rounded-sm relative overflow-hidden border border-slate-700">
                                                    <SessionBar session={session} range={range} showLabel={false} />
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono text-slate-300 whitespace-nowrap text-xs">
                                                {session.timeStart} - {session.timeEnd}
                                            </td>
                                            <td className="p-3 font-medium text-slate-300">{instrumentText(session.instrument)}</td>
                                            <td className="p-3 text-slate-500 text-xs font-mono">{session.proposalId}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}

                        {sortedDates.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500">No data found for this selection.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
