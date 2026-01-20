"use client";

import React, { useState, useEffect } from 'react';
import { PROPOSAL_COLORS, PROPOSAL_COLORS_24M, PROPOSAL_COLORS_1M, DEFAULT_COLOR_ROTATION } from '@/config/proposalColors';
import { ObservationSession } from '@/types/schedule';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import { Moon, Save, Edit3, Telescope } from 'lucide-react';

interface DayObservationViewProps {
    date: Date;
    sessions: ObservationSession[];
}

const TIMELINE_START_HOUR = 19;
const TIMELINE_END_HOUR = 29; // 05:00 next day
const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;

export const DayObservationView: React.FC<DayObservationViewProps> = ({ date, sessions }) => {
    const [note, setNote] = useState('');
    const dateKey = format(date, 'yyyy-MM-dd');

    useEffect(() => {
        const savedNote = localStorage.getItem(`note-${dateKey}`);
        setNote(savedNote || '');
    }, [dateKey]);

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNote = e.target.value;
        setNote(newNote);
        localStorage.setItem(`note-${dateKey}`, newNote);
    };

    const getPositionAndWidth = (start: string, end: string) => {
        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return (h < 12 ? h + 24 : h) + m / 60;
        };

        const startTimeHash = parseTime(start);
        let endTimeHash = parseTime(end);

        const startOffset = Math.max(0, startTimeHash - TIMELINE_START_HOUR);
        const duration = endTimeHash - startTimeHash;

        const left = (startOffset / TOTAL_HOURS) * 100;
        const width = (duration / TOTAL_HOURS) * 100;

        return { left: `${left}%`, width: `${width}%` };
    };

    // Helper: Generate consistent hash from string to pick a color index
    const stringToColorIndex = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    };

    // Helper: Determine if a Tailwind bg color is light (needs dark text)
    const isLightColor = (bgClass: string): boolean => {
        const lightColors = [
            'bg-white', 'bg-lime-200', 'bg-amber-200', 'bg-orange-200', 'bg-yellow-200',
            'bg-cyan-200', 'bg-violet-200', 'bg-rose-50', 'bg-rose-200', 'bg-green-200',
            'bg-neutral-300', 'bg-gray-400'
        ];
        return lightColors.some(light => bgClass.includes(light));
    };

    const getTypeColor = (type: string, index: number, telescope: string, proposalId: string) => {
        // 1. Check telescope-specific colors first
        if (telescope === '2.4m' && PROPOSAL_COLORS_24M[proposalId]) {
            return PROPOSAL_COLORS_24M[proposalId];
        }
        if (telescope === '1m' && PROPOSAL_COLORS_1M[proposalId]) {
            return PROPOSAL_COLORS_1M[proposalId];
        }

        // 2. Check shared Engineering/Maintenance colors
        if (PROPOSAL_COLORS[proposalId]) return PROPOSAL_COLORS[proposalId];

        // 3. Telescope 1m default theme (if not overridden by ID)
        if (telescope === '1m') return 'bg-purple-600/80 border-purple-400';

        // 4. Type Match (for special session types)
        if (PROPOSAL_COLORS[type]) return PROPOSAL_COLORS[type];

        // 5. Fallback Rotation (Consistent based on ID hash)
        const colorIndex = stringToColorIndex(proposalId);
        return DEFAULT_COLOR_ROTATION[colorIndex % DEFAULT_COLOR_ROTATION.length];
    };

    // Split sessions by telescope
    const sessions24m = sessions.filter(s => s.telescope === '2.4m');
    const sessions1m = sessions.filter(s => s.telescope === '1m');
    const hasSessions = sessions.length > 0;

    // Sorted list for display: 2.4m first, then 1m
    const displayList = [...sessions24m, ...sessions1m];

    return (
        <div className="space-y-6">
            {/* Date Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        {format(date, 'MMMM d, yyyy')}
                    </h2>
                    <p className="text-slate-400">Night Schedule</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                    <Moon className="text-yellow-100 fill-yellow-100" />
                    <span className="font-mono text-lg font-bold text-yellow-100">
                        {hasSessions ? `${sessions[0].moonPhase}%` : '0%'}
                    </span>
                </div>
            </div>

            {/* Timeline Visual */}
            <div className="glass-panel p-6 relative overflow-hidden">
                <div className="flex justify-between text-xs text-slate-500 mb-2 font-mono ml-[60px]"> {/* Offset for labels */}
                    {[19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5].map((h) => (
                        <span key={h}>{String(h).padStart(2, '0')}:00</span>
                    ))}
                </div>

                {/* Helper Grid Lines */}
                <div className="absolute top-10 bottom-4 left-[84px] right-6 z-0 flex justify-between pointer-events-none opacity-10">
                    {Array.from({ length: 11 }).map((_, i) => (
                        <div key={i} className="w-px h-full bg-slate-400"></div>
                    ))}
                </div>

                <div className="space-y-4">
                    {/* Track 2.4m */}
                    <div className="flex items-center gap-4">
                        <div className="w-[60px] text-right font-bold text-blue-400 text-sm">2.4m</div>
                        <div className="h-10 bg-slate-900/50 rounded-lg relative flex-1 overflow-hidden border border-slate-800">
                            {sessions24m.map((session, index) => (
                                <div
                                    key={session.id}
                                    className={cn(
                                        "absolute h-6 top-2 rounded-sm opacity-90 hover:opacity-100 transition-all cursor-pointer border-l-2 border-r-2 border-white/10 shadow-lg",
                                        getTypeColor(session.type, index, session.telescope, session.proposalId).split(' ')[0]
                                    )}
                                    style={getPositionAndWidth(session.timeStart, session.timeEnd)}
                                    title={`${session.telescope} - ${session.proposalId} (${session.instrument})`}
                                >
                                    <span className={cn(
                                        "hidden md:block text-xs font-bold truncate px-1.5 pt-1",
                                        isLightColor(getTypeColor(session.type, index, session.telescope, session.proposalId))
                                            ? "text-slate-900"
                                            : "text-white/90"
                                    )}>
                                        {session.proposalId} : {session.instrument}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Track 1m */}
                    <div className="flex items-center gap-4">
                        <div className="w-[60px] text-right font-bold text-purple-400 text-sm">1m</div>
                        <div className="h-10 bg-slate-900/50 rounded-lg relative flex-1 overflow-hidden border border-slate-800">
                            {sessions1m.map((session, index) => (
                                <div
                                    key={session.id}
                                    className={cn(
                                        "absolute h-6 top-2 rounded-sm opacity-90 hover:opacity-100 transition-all cursor-pointer border-l-2 border-r-2 border-white/10 shadow-lg",
                                        getTypeColor(session.type, index, session.telescope, session.proposalId).split(' ')[0]
                                    )}
                                    style={getPositionAndWidth(session.timeStart, session.timeEnd)}
                                    title={`${session.telescope} - ${session.proposalId} (${session.instrument})`}
                                >
                                    <span className={cn(
                                        "hidden md:block text-xs font-bold truncate px-1.5 pt-1",
                                        isLightColor(getTypeColor(session.type, index, session.telescope, session.proposalId))
                                            ? "text-slate-900"
                                            : "text-white/90"
                                    )}>
                                        {session.proposalId} : {session.instrument}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed List */}
            <div className="space-y-3">
                {displayList.map((session, index) => (
                    <div key={session.id} className={cn(
                        "glass-panel p-4 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-slate-800/80 transition-colors border-l-4 relative overflow-hidden",
                        session.telescope === '1m' ? "border-l-purple-500 bg-purple-900/10" : "border-l-blue-500"
                    )}
                        style={{
                            borderLeftColor: session.telescope === '1m' ? '#9333ea' : undefined // Purple for 1m
                        }}
                    >
                        {/* 1m Watermark/Badge */}
                        {session.telescope === '1m' && (
                            <div className="absolute top-0 right-0 p-1 opacity-10 pointer-events-none">
                                <Telescope size={80} />
                            </div>
                        )}

                        {/* Indicator */}
                        <div className={cn("hidden md:block w-5 h-5 rounded-full mt-1.5 md:mt-0", getTypeColor(session.type, index, session.telescope, session.proposalId).split(' ')[0])} />

                        {/* Time */}
                        <div className="min-w-[140px]">
                            <div className="font-mono text-lg font-bold text-white">
                                {session.timeStart} - {session.timeEnd}
                            </div>
                            <div className={cn("text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1", session.telescope === '1m' ? "text-purple-400" : "text-blue-400")}>
                                {session.telescope === '1m' && <Telescope size={12} />}
                                {session.telescope} Telescope
                            </div>
                        </div>

                        {/* Instrument */}
                        <div className="min-w-[120px]">
                            <span className="bg-slate-700/50 text-slate-200 px-2 py-1 rounded text-sm font-bold border border-slate-600">
                                {session.instrument}
                            </span>
                        </div>

                        {/* Identification */}
                        <div className="flex-1 z-10">
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-lg">{session.proposalId}</span>
                                {session.type !== 'PROPOSAL' && (
                                    <span className="text-xs bg-red-900/50 text-red-200 px-1.5 py-0.5 rounded border border-red-800">
                                        {session.type}
                                    </span>
                                )}
                            </div>
                            <div className="text-slate-300 text-sm">{session.piName}</div>
                        </div>

                        {/* Research Field */}
                        <div className="md:text-right min-w-[150px] z-10">
                            <div className="text-sm text-slate-400">Field of Research</div>
                            <div className="text-white font-medium">{session.fieldOfResearch}</div>
                        </div>
                    </div>
                ))}

                {!hasSessions && (
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
                    <Save size={12} /> Auto-saved
                </div>
            </div>
        </div>
    );
};
