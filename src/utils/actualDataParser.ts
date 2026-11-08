import Papa from 'papaparse';
import { ActualObservation, ObservationSegment, ObservationStatus } from '../types/schedule';
import { normalizeTime } from './time';

const ACTUAL_DATA_FILES = {
    '2.4m': '/actual_2.4m.csv',
    '1m': '/actual_1m.csv'
};

const mapStatus = (raw: string | undefined | null): ObservationStatus => {
    const value = String(raw || '').toLowerCase();
    if (value.includes('weather')) return 'Weather';
    if (value.includes('technical') || value.includes('tech')) return 'Technical';
    if (value.includes('observation') || value.includes('observed') || value.includes('completed') || value.includes('partial')) {
        return 'Observation';
    }
    return 'Observation';
};

/**
 * Fetch and parse actual observation data with multi-segment support
 * CSV columns (recommended):
 * Date, ProposalID, Instrument, AllocatedStart, AllocatedEnd, SegmentStart, SegmentEnd, Status, Notes, IsCalibration, CalibrationTiming, CalibrationFor
 */
export async function fetchActualObservations(telescope: '2.4m' | '1m'): Promise<ActualObservation[]> {
    try {
        const response = await fetch(ACTUAL_DATA_FILES[telescope]);
        if (!response.ok) return [];

        const csvText = await response.text();

        return new Promise((resolve) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const rawData = results.data as Record<string, string>[];
                    const grouped: Record<string, ActualObservation> = {};

                    rawData.forEach((row) => {
                        const date = row.Date;
                        const proposalId = row.ProposalID || row.proposalId;
                        const instrument = row.Instrument || row.instrument || 'Unknown';
                        const allocatedStart = normalizeTime(row.AllocatedStart || row.allocatedStart);
                        const allocatedEnd = normalizeTime(row.AllocatedEnd || row.allocatedEnd);
                        const segmentStart = normalizeTime(row.SegmentStart || row.ActualStart || row.actualStart);
                        const segmentEnd = normalizeTime(row.SegmentEnd || row.ActualEnd || row.actualEnd);
                        const isCalibration = String(row.IsCalibration || row.isCalibration || '').toLowerCase() === 'true';
                        const calibrationTimingRaw = row.CalibrationTiming || row.calibrationTiming;
                        const calibrationFor = row.CalibrationFor || row.CalibrationForId || row.CalibrationForID || row.calibrationFor;
                        const allocationIdRaw = row.AllocationId || row.allocationId;
                        const calibrationTiming = typeof calibrationTimingRaw === 'string'
                            ? calibrationTimingRaw.trim().toLowerCase()
                            : '';
                        const allocationId = allocationIdRaw ? String(allocationIdRaw).trim() : undefined;

                        if (!date || !proposalId || !allocatedStart || !allocatedEnd || !segmentStart || !segmentEnd) return;

                        const key = allocationId || `${date}_${proposalId}_${allocatedStart}_${allocatedEnd}`;

                        if (!grouped[key]) {
                            grouped[key] = {
                                date,
                                proposalId,
                                instrument,
                                allocatedStart,
                                allocatedEnd,
                                segments: [],
                                isCalibration,
                                calibrationTiming: calibrationTiming === 'evening'
                                    ? 'Evening'
                                    : calibrationTiming === 'morning'
                                        ? 'Morning'
                                        : undefined,
                                calibrationFor: calibrationFor ? String(calibrationFor).trim() : undefined,
                                allocationId
                            };
                        }
                        if (isCalibration) {
                            grouped[key].isCalibration = true;
                            grouped[key].calibrationTiming = calibrationTiming === 'evening'
                                ? 'Evening'
                                : calibrationTiming === 'morning'
                                    ? 'Morning'
                                    : grouped[key].calibrationTiming;
                            grouped[key].calibrationFor = calibrationFor
                                ? String(calibrationFor).trim()
                                : grouped[key].calibrationFor;
                        }
                        if (allocationId) {
                            grouped[key].allocationId = allocationId;
                        }

                        const segment: ObservationSegment = {
                            segmentNumber: grouped[key].segments.length + 1,
                            actualStart: segmentStart,
                            actualEnd: segmentEnd,
                            status: mapStatus(row.Status),
                            notes: row.Notes
                        };

                        grouped[key].segments.push(segment);
                    });

                    resolve(Object.values(grouped));
                }
            });
        });
    } catch (error) {
        console.error(`Failed to fetch actual data for ${telescope}:`, error);
        return [];
    }
}
