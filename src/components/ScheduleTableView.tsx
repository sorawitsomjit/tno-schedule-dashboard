"use client";

import React, { useState } from 'react';
import { ObservationSession } from '@/types/schedule';
import { format, isSameMonth, parseISO } from 'date-fns';
import { cn } from '@/utils/cn';
import { Telescope } from 'lucide-react';
import { PROPOSAL_COLORS, PROPOSAL_COLORS_24M, PROPOSAL_COLORS_1M, DEFAULT_COLOR_ROTATION } from '@/config/proposalColors';

// ============================================
// TOGGLE: Set to true to sync colors with proposalColors.ts
// Set to false to use default blue/purple theme
// ============================================
const USE_PROPOSAL_COLORS = false;  // Change to false to revert

interface ScheduleTableViewProps {
    allSessions: ObservationSession[];
    currentDate: Date | null;
}

export const ScheduleTableView: React.FC<ScheduleTableViewProps> = ({ allSessions, currentDate }) => {
    const [viewMode, setViewMode] = useState<'ALL' | 'MONTH'>('MONTH');

    if (!currentDate) return null;

    const filteredSessions = allSessions.filter(session => {
        if (viewMode === 'ALL') return true;
        return isSameMonth(new Date(session.date), currentDate);
    });

    // Group by Date
    const groupedSessions = filteredSessions.reduce((acc, session) => {
        const date = session.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(session);
        return acc;
    }, {} as Record<string, ObservationSession[]>);

    // Sort dates
    const sortedDates = Object.keys(groupedSessions).sort();

    // Timeline constants matching DayObservationView
    const TIMELINE_START_HOUR = 19;
    const TIMELINE_END_HOUR = 29; // 05:00 next day
    const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;

    const getPositionAndWidth = (start: string, end: string) => {
        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return (h < 12 ? h + 24 : h) + m / 60;
        };

        const startTimeHash = parseTime(start);
        const endTimeHash = parseTime(end);

        const startOffset = Math.max(0, startTimeHash - TIMELINE_START_HOUR);
        const duration = endTimeHash - startTimeHash;

        const left = (startOffset / TOTAL_HOURS) * 100;
        const width = (duration / TOTAL_HOURS) * 100;

        return { left: `${left}%`, width: `${width}%` };
    };

    // Helper: Generate consistent hash from string
    const stringToColorIndex = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    };

    // Get Proposal Color (sync with DayObservationView logic)
    const getProposalColor = (telescope: string, proposalId: string) => {
        if (!USE_PROPOSAL_COLORS) {
            // Default: blue for 2.4m, purple for 1m
            return telescope === '1m' ? 'bg-purple-500' : 'bg-blue-500';
        }

        // Check telescope-specific colors first
        if (telescope === '2.4m' && PROPOSAL_COLORS_24M[proposalId]) {
            return PROPOSAL_COLORS_24M[proposalId];
        }
        if (telescope === '1m' && PROPOSAL_COLORS_1M[proposalId]) {
            return PROPOSAL_COLORS_1M[proposalId];
        }

        // Check shared Engineering/Maintenance colors
        if (PROPOSAL_COLORS[proposalId]) return PROPOSAL_COLORS[proposalId];

        // Default for 1m if no specific color
        if (telescope === '1m') return 'bg-purple-600';

        // Fallback rotation for 2.4m
        const colors = DEFAULT_COLOR_ROTATION;
        return colors[stringToColorIndex(proposalId) % colors.length];
    };

    // Extract background color class for text color
    const getBgColorClass = (fullClass: string) => {
        return fullClass.split(' ')[0]; // Get first class (bg-xxx-xxx)
    };

    // Determine text color based on background
    const getTextColorClass = (bgClass: string, proposalId: string, telescope: string) => {
        if (!USE_PROPOSAL_COLORS) {
            return "text-slate-200"; // Default
        }

        const lightColors = [
            'bg-white', 'bg-lime-200', 'bg-amber-200', 'bg-orange-200', 'bg-yellow-200',
            'bg-cyan-200', 'bg-violet-200', 'bg-rose-50', 'bg-rose-200', 'bg-green-200',
            'bg-neutral-300', 'bg-gray-400'
        ];

        const isLight = lightColors.some(light => bgClass.includes(light));
        return isLight ? "text-slate-900 font-bold" : "text-white font-medium";
    };

    // Simple color picker for the timeline bar (legacy function, now using getProposalColor)
    const getBarColor = (telescope: string, proposalId: string) => {
        if (telescope === '1m') return 'bg-purple-500';
        // Use a simple rotation for 2.4m based on ID
        const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-sky-500', 'bg-indigo-500', 'bg-teal-500'];
        return colors[stringToColorIndex(proposalId) % colors.length];
    };

    return (
        <div className="glass-panel p-0 overflow-hidden flex flex-col h-[600px]"> {/* Increased height slightly */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                <h3 className="font-bold text-lg text-slate-200">Full Schedule Data</h3>
                <div className="flex bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('MONTH')}
                        className={cn(
                            "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                            viewMode === 'MONTH' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                        )}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => setViewMode('ALL')}
                        className={cn(
                            "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                            viewMode === 'ALL' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                        )}
                    >
                        All Data
                    </button>
                </div>
            </div>

            <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/80 sticky top-0 z-10 text-slate-400 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                            <th className="p-4 border-b border-slate-800 w-[100px]">Telescope</th>
                            <th className="p-4 border-b border-slate-800 w-[100px]">Proposal ID</th>
                            <th className="p-4 border-b border-slate-800 w-[180px]">Timeline (19:00-05:00)</th> {/* New Column */}
                            <th className="p-4 border-b border-slate-800">Time</th>
                            <th className="p-4 border-b border-slate-800">Instrument</th>
                            <th className="p-4 border-b border-slate-800">PI Name</th>
                            <th className="p-4 border-b border-slate-800">Field of Research</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {sortedDates.map((date) => (
                            <React.Fragment key={date}>
                                {/* Date Header Row */}
                                <tr className="bg-slate-900/80">
                                    <td colSpan={7} className="p-2 pl-4 font-bold text-blue-200 border-b border-slate-800">
                                        📅 {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                                    </td>
                                </tr>
                                {/* Session Rows */}
                                {groupedSessions[date].map((session) => (
                                    <tr key={session.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-3 pl-4">
                                            <span className={cn(
                                                "flex items-center gap-1 font-bold text-xs px-2 py-1 rounded w-fit",
                                                session.telescope === '1m' ? "bg-purple-900/30 text-purple-300 border border-purple-800" : "bg-blue-900/30 text-blue-300 border border-blue-800"
                                            )}>
                                                {session.telescope}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={cn(
                                                "font-medium",
                                                USE_PROPOSAL_COLORS
                                                    ? getTextColorClass(
                                                        getBgColorClass(getProposalColor(session.telescope, session.proposalId)),
                                                        session.proposalId,
                                                        session.telescope
                                                    )
                                                    : session.type !== 'PROPOSAL' ? "text-red-300" : "text-slate-200"
                                            )}>
                                                {session.proposalId}
                                            </span>
                                        </td>
                                        {/* Timeline Bar */}
                                        <td className="p-3">
                                            <div className="w-[140px] h-4 bg-slate-800 rounded-sm relative overflow-hidden border border-slate-700">
                                                {/* Markers */}
                                                <div className="absolute left-[50%] top-0 bottom-0 w-px bg-slate-600/30"></div>
                                                {/* Bar */}
                                                <div
                                                    className={cn("absolute h-full opacity-80", getBarColor(session.telescope, session.proposalId))}
                                                    style={getPositionAndWidth(session.timeStart, session.timeEnd)}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-3 font-mono text-slate-300 whitespace-nowrap text-xs">
                                            {session.timeStart} - {session.timeEnd}
                                        </td>
                                        <td className="p-3 font-medium text-slate-300">{session.instrument}</td>
                                        <td className="p-3 text-slate-400 text-xs truncate max-w-[150px]" title={session.piName}>{session.piName}</td>
                                        <td className="p-3 text-slate-400 text-xs truncate max-w-[150px]" title={session.fieldOfResearch}>{session.fieldOfResearch}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}

                        {filteredSessions.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500">No data found for this selection.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
