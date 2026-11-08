"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { fetchSchedule, sortSessionsByTime } from '@/utils/scheduleData';
import { fetchActualObservations } from '@/utils/actualDataParser';
import { calculateDailySummary } from '@/utils/summaryCalculator';
import { ObservationSession, ActualObservation } from '@/types/schedule';
import { ActualTimelineView } from '@/components/admin/ActualTimelineView';
import { DailySummaryPanel } from '@/components/admin/DailySummaryPanel';
import { cn } from '@/utils/cn';

// Toggle display for 1m dashboard
const SHOW_1M_DASHBOARD = false;

export default function AdminActualPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allocated, setAllocated] = useState<ObservationSession[]>([]);
    const [actual24m, setActual24m] = useState<ActualObservation[]>([]);
    const [actual1m, setActual1m] = useState<ActualObservation[]>([]);

    const loadAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [allocatedData, actual24, actual1] = await Promise.all([
                fetchSchedule().then(r => r.sessions),
                fetchActualObservations('2.4m'),
                fetchActualObservations('1m')
            ]);
            setAllocated(allocatedData);
            setActual24m(actual24);
            setActual1m(actual1);
        } catch {
            setError('Failed to load admin data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const dayAllocated24m = useMemo(
        () => sortSessionsByTime(allocated.filter(s => s.date === dateStr && s.telescope === '2.4m')),
        [allocated, dateStr]
    );

    const dayAllocated1m = useMemo(
        () => sortSessionsByTime(allocated.filter(s => s.date === dateStr && s.telescope === '1m')),
        [allocated, dateStr]
    );

    const dayActual24m = useMemo(
        () => actual24m.filter(a => a.date === dateStr),
        [actual24m, dateStr]
    );

    const dayActual1m = useMemo(
        () => actual1m.filter(a => a.date === dateStr),
        [actual1m, dateStr]
    );

    const summary24m = useMemo(
        () => calculateDailySummary(dateStr, '2.4m', actual24m),
        [dateStr, actual24m]
    );

    const summary1m = useMemo(
        () => calculateDailySummary(dateStr, '1m', actual1m),
        [dateStr, actual1m]
    );


    return (
        <div className="min-h-screen bg-[#0B0E14] text-slate-100">
            <header className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 rounded-lg border border-slate-800 hover:bg-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-400" />
                    </Link>
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest">Admin</div>
                        <h1 className="text-lg md:text-xl font-semibold">Actual Usage vs Allocation</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                    <CalendarIcon className="w-4 h-4 text-slate-500" />
                    <input
                        type="date"
                        className="bg-transparent text-sm outline-none"
                        value={dateStr}
                        onChange={(e) => e.target.value && setSelectedDate(new Date(e.target.value))}
                    />
                    <button
                        onClick={loadAllData}
                        className="ml-1 rounded-md p-1.5 hover:bg-slate-800 transition-colors"
                        title="Refresh data"
                    >
                        <RefreshCw className={cn("w-4 h-4 text-slate-400", loading && "animate-spin")} />
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 pb-16 space-y-10">
                {error && (
                    <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <section className="space-y-4">
                    <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
                        Thai National Telescope (2.4m)
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                        {loading ? (
                            <div className="glass-panel p-6 text-slate-500">Loading timeline...</div>
                        ) : (
                            <ActualTimelineView
                                telescope="2.4m"
                                allocatedSessions={dayAllocated24m}
                                actualObservations={dayActual24m}
                            />
                        )}
                        {loading ? (
                            <div className="glass-panel p-6 text-slate-500">Loading summary...</div>
                        ) : (
                            <DailySummaryPanel summary={summary24m} />
                        )}
                    </div>
                </section>

                {SHOW_1M_DASHBOARD && (
                    <section className="space-y-4">
                        <div className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
                            TRT Telescope (1.0m)
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                            {loading ? (
                                <div className="glass-panel p-6 text-slate-500">Loading timeline...</div>
                            ) : (
                                <ActualTimelineView
                                    telescope="1m"
                                    allocatedSessions={dayAllocated1m}
                                    actualObservations={dayActual1m}
                                />
                            )}
                            {loading ? (
                                <div className="glass-panel p-6 text-slate-500">Loading summary...</div>
                            ) : (
                                <DailySummaryPanel summary={summary1m} />
                            )}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
