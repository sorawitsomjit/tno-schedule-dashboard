"use client";

import React, { useState, useEffect } from 'react';
import { ObservationSession, Telescope } from '@/types/schedule';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import { nightRange, hourTicks } from '@/utils/timeline';
import { fromNightMinutes } from '@/utils/time';
import { instrumentText, sessionColor, sessionLabel, typeBadge } from '@/utils/sessionDisplay';
import { SessionBar } from '@/components/SessionBar';
import { Moon, Save, Edit3, Telescope as TelescopeIcon } from 'lucide-react';

interface DayObservationViewProps {
    date: Date;
    sessions: ObservationSession[]; // already sorted in night order
}

// Keep the first/last hour labels inside the axis.
const tickShift = (pct: number) => (pct < 2 ? 'none' : pct > 98 ? 'translateX(-100%)' : 'translateX(-50%)');

const TELESCOPES: { id: Telescope; label: string; accent: string }[] = [
    { id: '2.4m', label: '2.4m', accent: 'text-blue-400' },
    { id: '1m', label: '1m', accent: 'text-purple-400' },
];

export const DayObservationView: React.FC<DayObservationViewProps> = ({ date, sessions }) => {
    const [note, setNote] = useState('');
    const dateKey = format(date, 'yyyy-MM-dd');

    useEffect(() => {
        try {
            setNote(localStorage.getItem(`note-${dateKey}`) || '');
        } catch {
            setNote('');
        }
    }, [dateKey]);

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNote(e.target.value);
        try {
            localStorage.setItem(`note-${dateKey}`, e.target.value);
        } catch {
            // storage unavailable: keep the note in memory only
        }
    };

    // Both tracks share one axis; it only widens past 05:00 on nights that need it.
    const range = nightRange(sessions);
    const ticks = hourTicks(range);
    const extended = range.end > 29 * 60;
    const fli = sessions.reduce((max, s) => Math.max(max, s.moonPhase || 0), 0);
    const displayList = TELESCOPES.flatMap(t => sessions.filter(s => s.telescope === t.id));

    return (
        <div className="space-y-6">
            {/* Date Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {format(date, 'EEEE, MMMM d, yyyy')}
                    </h2>
                    <p className="text-slate-400">Night Schedule</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700"
                    title="FLI: fractional lunar illumination (from the TAC schedule)">
                    <Moon className="text-yellow-100 fill-yellow-100" />
                    <span className="font-mono text-lg font-bold text-yellow-100">{fli}%</span>
                </div>
            </div>

            {/* Timeline */}
            <div className="glass-panel p-4 md:p-6">
                <div className="flex gap-3">
                    <div className="w-10 md:w-12 shrink-0" />
                    <div className="relative flex-1 h-5 text-[10px] md:text-xs text-slate-500 font-mono">
                        {ticks.map((t, i) => (
                            <span key={t.label} className={cn("absolute", i % 2 === 1 && "hidden sm:inline")}
                                style={{ left: `${t.pct}%`, transform: tickShift(t.pct) }}>
                                {t.label}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 mt-1">
                    {TELESCOPES.map(t => (
                        <div key={t.id} className="flex items-center gap-3">
                            <div className={cn("w-10 md:w-12 shrink-0 text-right font-bold text-sm", t.accent)}>{t.label}</div>
                            <div className="relative flex-1 h-12 bg-slate-900/50 rounded-md overflow-hidden border border-slate-800">
                                {ticks.map(tick => (
                                    <div key={tick.label} className="absolute top-0 bottom-0 w-px bg-slate-400/10" style={{ left: `${tick.pct}%` }} />
                                ))}
                                {sessions.filter(s => s.telescope === t.id).map(s => (
                                    <SessionBar key={s.id} session={s} range={range} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {extended && (
                    <p className="mt-3 text-xs text-amber-300/80">
                        Allocation runs past 05:00 tonight (per TAC schedule) — timeline extended to {fromNightMinutes(range.end)}
                    </p>
                )}
            </div>

            {/* Detailed List */}
            <div className="space-y-3">
                {displayList.map(session => (
                    <div key={session.id} className={cn(
                        "glass-panel p-4 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-slate-800/80 transition-colors border-l-4",
                        session.telescope === '1m' ? "border-l-purple-500" : "border-l-blue-500"
                    )}>
                        <div className="hidden md:block w-5 h-5 rounded-full shrink-0 border border-white/20"
                            style={{ backgroundColor: sessionColor(session) }} />

                        <div className="min-w-[140px]">
                            <div className="font-mono text-lg font-bold text-white">
                                {session.timeStart} - {session.timeEnd}
                            </div>
                            <div className={cn("text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1",
                                session.telescope === '1m' ? "text-purple-400" : "text-blue-400")}>
                                <TelescopeIcon size={12} />
                                {session.telescope} Telescope
                            </div>
                        </div>

                        <div className="min-w-[110px]">
                            {instrumentText(session.instrument) && (
                                <span className="bg-slate-700/50 text-slate-200 px-2 py-1 rounded text-sm font-bold border border-slate-600">
                                    {session.instrument}
                                </span>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-bold text-lg">{sessionLabel(session)}</span>
                                {typeBadge(session) && (
                                    <span className="text-xs bg-amber-900/50 text-amber-200 px-1.5 py-0.5 rounded border border-amber-800">
                                        {typeBadge(session)}
                                    </span>
                                )}
                            </div>
                            <div className="text-slate-400 text-sm font-mono">{session.proposalId}</div>
                        </div>
                    </div>
                ))}

                {displayList.length === 0 && (
                    <div className="text-center py-12 text-slate-500 glass-panel">
                        No observations scheduled for this night.
                    </div>
                )}
            </div>

            {/* Notes Section */}
            <div className="glass-panel p-4 mt-6">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                    <Edit3 size={16} />
                    Note for {format(date, 'MMM d')}
                </label>
                <textarea
                    value={note}
                    onChange={handleNoteChange}
                    placeholder="Add notes for this night..."
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[80px]"
                />
                <div className="text-right text-xs text-slate-500 mt-1 flex justify-end items-center gap-1">
                    <Save size={12} /> Auto-saved (this browser only)
                </div>
            </div>
        </div>
    );
};
