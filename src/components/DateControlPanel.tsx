"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/utils/cn';
import { ScheduleMeta } from '@/types/schedule';

interface DateControlPanelProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    today: Date;
    meta: ScheduleMeta | null;
}

export const DateControlPanel: React.FC<DateControlPanelProps> = ({ selectedDate, onDateChange, today, meta }) => {
    const isToday = isSameDay(selectedDate, today);
    const cycleNumber = meta?.cycle?.replace(/^C0*/, '');

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 glass-panel mb-6 sticky top-0 z-50">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        TNO Telescope Schedule{cycleNumber ? ` — Cycle ${cycleNumber}` : ''}
                    </h1>
                </div>
                <div className="flex gap-3 text-[10px] font-mono text-slate-500 ml-0.5 flex-wrap">
                    <span>2.4m TNT &amp; 1m — TAC time allocation</span>
                    {meta && Object.entries(meta.telescopes).map(([tel, info]) => (
                        <span key={tel}>[{tel} = {info?.version}]</span>
                    ))}
                </div>
            </div>

            <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                <button
                    onClick={() => onDateChange(subDays(selectedDate, 1))}
                    className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-300"
                    aria-label="Previous Day"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="mx-2 flex items-center gap-2">
                    <input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                            // parseISO keeps local midnight (new Date('yyyy-MM-dd') would be UTC)
                            if (e.target.value) onDateChange(parseISO(e.target.value));
                        }}
                        className="bg-transparent border-none text-center outline-none text-white font-medium cursor-pointer"
                    />
                </div>

                <button
                    onClick={() => onDateChange(addDays(selectedDate, 1))}
                    className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-300"
                    aria-label="Next Day"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onDateChange(today)}
                    className={cn(
                        "px-4 py-2 rounded-md font-medium text-sm transition-all",
                        isToday
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                    )}
                >
                    Today
                </button>
            </div>
        </div>
    );
};
