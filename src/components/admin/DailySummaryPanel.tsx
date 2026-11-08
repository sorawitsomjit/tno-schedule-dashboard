"use client";

import React from 'react';
import { DailySummary } from '@/types/schedule';
import { CloudRain, Cpu, CheckCircle2 } from 'lucide-react';

interface DailySummaryPanelProps {
    summary: DailySummary;
}

export const DailySummaryPanel: React.FC<DailySummaryPanelProps> = ({ summary }) => {
    const formatMinutes = (m: number) => {
        const h = Math.floor(m / 60);
        const mins = m % 60;
        return `${h}h ${String(mins).padStart(2, '0')}m`;
    };

    const total = summary.observationTime + summary.weatherLoss + summary.technicalLoss;
    const sortedByProposal = Object.entries(summary.byProposal)
        .sort((a, b) => b[1] - a[1]);

    return (
        <div className="glass-panel p-6 border-slate-700/50 bg-slate-900/40">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Night Performance Summary
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                    Total: {formatMinutes(total)}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        Observation
                    </div>
                    <div className="text-2xl font-bold text-slate-100 mt-2">
                        {formatMinutes(summary.observationTime)}
                    </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase">
                        <CloudRain className="w-4 h-4 text-blue-400" />
                        Weather Loss
                    </div>
                    <div className="text-2xl font-bold text-slate-100 mt-2">
                        {formatMinutes(summary.weatherLoss)}
                    </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs uppercase">
                        <Cpu className="w-4 h-4 text-orange-400" />
                        Technical Loss
                    </div>
                    <div className="text-2xl font-bold text-slate-100 mt-2">
                        {formatMinutes(summary.technicalLoss)}
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                    Per Proposal Usage (Observation)
                </div>
                {sortedByProposal.length === 0 ? (
                    <div className="text-sm text-slate-500">No observation data for this night.</div>
                ) : (
                    <div className="space-y-2">
                        {sortedByProposal.map(([proposalId, mins]) => (
                            <div key={proposalId} className="flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-200">{proposalId}</span>
                                <span className="font-mono text-slate-400">{formatMinutes(mins)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
