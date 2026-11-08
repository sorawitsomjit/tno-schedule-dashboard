"use client";

import React, { useMemo } from 'react';
import { ActualObservation, ObservationStatus, ObservationSession } from '@/types/schedule';
import { cn } from '@/utils/cn';

interface ActualTimelineViewProps {
    telescope: '2.4m' | '1m';
    allocatedSessions: ObservationSession[];
    actualObservations: ActualObservation[];
}

const STATUS_COLORS: Record<ObservationStatus, string> = {
    Observation: 'bg-emerald-500',
    Weather: 'bg-blue-500',
    Technical: 'bg-orange-500'
};

const STATUS_LABELS: Record<ObservationStatus, string> = {
    Observation: 'Observation',
    Weather: 'Poor Weather',
    Technical: 'Technical'
};

export const ActualTimelineView: React.FC<ActualTimelineViewProps> = ({
    telescope,
    allocatedSessions,
    actualObservations
}) => {
    const parseTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const adjusted = h < 12 ? h + 24 : h;
        return adjusted + m / 60;
    };

    const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const adjusted = h < 12 ? h + 24 : h;
        return adjusted * 60 + m;
    };

    const actualCandidates = useMemo(
        () => actualObservations.filter(o => !o.isCalibration),
        [actualObservations]
    );

    const actualByAllocationId = useMemo(() => {
        const map = new Map<string, ActualObservation>();
        actualCandidates.forEach((obs) => {
            if (obs.allocationId) {
                map.set(obs.allocationId, obs);
            }
        });
        return map;
    }, [actualCandidates]);

    const calibrationRows = useMemo(
        () => actualObservations.filter(o => o.isCalibration),
        [actualObservations]
    );

    const timelineRange = useMemo(() => {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        const consider = (time?: string) => {
            if (!time) return;
            const minutes = toMinutes(time);
            min = Math.min(min, minutes);
            max = Math.max(max, minutes);
        };

        allocatedSessions.forEach(s => {
            consider(s.timeStart);
            consider(s.timeEnd);
        });

        actualObservations.forEach(o => {
            consider(o.allocatedStart);
            consider(o.allocatedEnd);
            o.segments.forEach(seg => {
                consider(seg.actualStart);
                consider(seg.actualEnd);
            });
        });

        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            return { startHour: 18, totalHours: 13 };
        }

        const startHour = Math.floor(min / 60);
        const endHour = Math.ceil(max / 60);
        const totalHours = Math.max(1, endHour - startHour);

        return { startHour, totalHours };
    }, [allocatedSessions, actualObservations]);

    const { startHour, totalHours } = timelineRange;

    const getPositionAndWidth = (start: string, end: string) => {
        const startT = parseTime(start);
        const endT = parseTime(end);
        const left = ((startT - startHour) / totalHours) * 100;
        const width = ((endT - startT) / totalHours) * 100;
        return { left: `${left}%`, width: `${width}%` };
    };

    const combinedRows = useMemo(() => {
        const rows = [
            ...allocatedSessions.map(session => ({
                kind: 'allocated' as const,
                start: session.timeStart,
                session
            })),
            ...calibrationRows.map(cal => ({
                kind: 'calibration' as const,
                start: cal.allocatedStart,
                calibration: cal
            }))
        ];

        return rows.sort((a, b) => parseTime(a.start) - parseTime(b.start));
    }, [allocatedSessions, calibrationRows]);

    const getOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
        const start = Math.max(aStart, bStart);
        const end = Math.min(aEnd, bEnd);
        return Math.max(0, end - start);
    };

    const findBestActual = (session: ObservationSession) => {
        if (session.allocationId) {
            const exact = actualByAllocationId.get(session.allocationId);
            if (exact) return exact;
        }

        const sessionStart = toMinutes(session.timeStart);
        const sessionEnd = toMinutes(session.timeEnd);

        let best: ActualObservation | null = null;
        let bestSegOverlap = 0;
        let bestAllocOverlap = 0;

        actualCandidates
            .filter(a => a.proposalId === session.proposalId)
            .forEach(candidate => {
                const allocStart = toMinutes(candidate.allocatedStart);
                const allocEnd = toMinutes(candidate.allocatedEnd);
                const allocOverlap = getOverlap(sessionStart, sessionEnd, allocStart, allocEnd);

                const segOverlap = candidate.segments.reduce((max, seg) => {
                    const segStart = toMinutes(seg.actualStart);
                    const segEnd = toMinutes(seg.actualEnd);
                    return Math.max(max, getOverlap(sessionStart, sessionEnd, segStart, segEnd));
                }, 0);

                if (segOverlap === 0 && allocOverlap === 0) return;

                if (
                    segOverlap > bestSegOverlap ||
                    (segOverlap === bestSegOverlap && allocOverlap > bestAllocOverlap)
                ) {
                    best = candidate;
                    bestSegOverlap = segOverlap;
                    bestAllocOverlap = allocOverlap;
                }
            });

        return best;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-300">
                    {telescope} Actual vs Allocated
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Observation
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> Weather
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" /> Technical
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> Calibration
                    </span>
                </div>
            </div>

            <div className="relative rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                <div className="absolute left-4 right-4 top-4 h-6">
                    <div className="flex justify-between text-[10px] text-slate-500">
                        {Array.from({ length: totalHours + 1 }).map((_, i) => (
                            <span key={i}>{String((startHour + i) % 24).padStart(2, '0')}:00</span>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 pt-10">
                    {combinedRows.length === 0 && (
                        <div className="text-sm text-slate-500">No allocated sessions for this date.</div>
                    )}

                    {combinedRows.map((row, idx) => {
                        if (row.kind === 'calibration') {
                            const cal = row.calibration;
                            const segments = (cal.segments || []).slice().sort(
                                (a, b) => parseTime(a.actualStart) - parseTime(b.actualStart)
                            );
                            const label = cal.calibrationFor
                                ? `Calibration for ${cal.calibrationFor}`
                                : 'Calibration';
                            const timing = cal.calibrationTiming ? `• ${cal.calibrationTiming}` : '';

                            return (
                                <div key={`cal-${idx}`} className="grid grid-cols-[220px_1fr] gap-4 items-center">
                                    <div>
                                        <div className="text-sm font-semibold text-amber-300">{label}</div>
                                        <div className="text-xs text-slate-500">
                                            {cal.allocatedStart} - {cal.allocatedEnd} • {cal.instrument} {timing}
                                        </div>
                                    </div>
                                    <div className="relative h-6">
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 h-2 rounded bg-amber-900/40 border border-amber-700/40"
                                            style={getPositionAndWidth(cal.allocatedStart, cal.allocatedEnd)}
                                        />
                                        {segments.map((seg, sIdx) => (
                                            <div
                                                key={sIdx}
                                                className="absolute top-1/2 -translate-y-1/2 h-3 rounded-sm bg-amber-400"
                                                style={getPositionAndWidth(seg.actualStart, seg.actualEnd)}
                                                title={`Calibration (${seg.actualStart}-${seg.actualEnd})${seg.notes ? ` • ${seg.notes}` : ''}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        const session = row.session;
                        const actual = findBestActual(session);
                        const segments = (actual?.segments || []).slice().sort(
                            (a, b) => parseTime(a.actualStart) - parseTime(b.actualStart)
                        );

                        return (
                            <div key={`alloc-${idx}`} className="grid grid-cols-[220px_1fr] gap-4 items-center">
                                <div>
                                    <div className="text-sm font-semibold text-slate-200">{session.proposalId}</div>
                                    <div className="text-xs text-slate-500">
                                        {session.timeStart} - {session.timeEnd} • {session.instrument}
                                    </div>
                                </div>

                                <div className="relative h-6">
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 h-2 rounded bg-slate-800"
                                        style={getPositionAndWidth(session.timeStart, session.timeEnd)}
                                    />

                                    {segments.map((seg, sIdx) => (
                                        <div
                                            key={sIdx}
                                            className={cn(
                                                "absolute top-1/2 -translate-y-1/2 h-3 rounded-sm",
                                                STATUS_COLORS[seg.status]
                                            )}
                                            style={getPositionAndWidth(seg.actualStart, seg.actualEnd)}
                                            title={`${STATUS_LABELS[seg.status]} (${seg.actualStart}-${seg.actualEnd})${seg.notes ? ` • ${seg.notes}` : ''}`}
                                        />
                                    ))}

                                    {segments.length === 0 && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] text-slate-600">
                                            No actual data
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
