"use client";

import React, { useEffect } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight, RefreshCw, BarChart3 } from 'lucide-react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/utils/cn';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DateControlPanelProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    today: Date;
}

export const DateControlPanel: React.FC<DateControlPanelProps> = ({ selectedDate, onDateChange, today }) => {
    const isToday = isSameDay(selectedDate, today);

    const handlePrevDay = () => onDateChange(subDays(selectedDate, 1));
    const handleNextDay = () => onDateChange(addDays(selectedDate, 1));
    const handleToday = () => onDateChange(today);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 glass-panel mb-6 sticky top-0 z-50">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        TNO (2.4m & 1m ) Time Allocation for Cycle 13
                    </h1>
                    <Link href="/stats" className="ml-2 flex items-center gap-1 text-[10px] md:text-sm text-slate-400 hover:text-blue-400 transition-colors bg-slate-800/50 px-2 md:px-3 py-1 rounded-full border border-slate-700">
                        <BarChart3 size={14} />
                        <span>Stats</span>
                    </Link>
                </div>
                <div className="flex gap-3 text-[10px] font-mono text-slate-500 ml-0.5">
                    <span>version : [2.4m = V2.20260116]</span>
                    <span>[1m = V1.20251016]</span>
                </div>
            </div>

            <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                <button
                    onClick={handlePrevDay}
                    className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-300"
                    aria-label="Previous Day"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="mx-2 flex items-center gap-2">
                    {/* Simple Date Display Trigger for Calendar */}
                    <input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                            if (e.target.value) onDateChange(new Date(e.target.value));
                        }}
                        className="bg-transparent border-none text-center outline-none text-white font-medium cursor-pointer"
                    />
                </div>

                <button
                    onClick={handleNextDay}
                    className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-300"
                    aria-label="Next Day"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handleToday}
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
