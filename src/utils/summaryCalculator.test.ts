import { describe, it, expect } from 'vitest';
import { calculateDailySummary } from './summaryCalculator';
import type { ActualObservation } from '../types/schedule';

describe('calculateDailySummary', () => {
  it('handles midnight rollover and aggregates by status', () => {
    const actual: ActualObservation[] = [
      {
        date: '2026-02-01',
        proposalId: 'ID001',
        instrument: 'ULTRASPEC',
        allocatedStart: '23:00',
        allocatedEnd: '01:00',
        segments: [
          {
            segmentNumber: 1,
            actualStart: '23:00',
            actualEnd: '01:00',
            status: 'Observation',
          },
        ],
      },
      {
        date: '2026-02-01',
        proposalId: 'ID002',
        instrument: 'MRES',
        allocatedStart: '01:00',
        allocatedEnd: '02:00',
        segments: [
          {
            segmentNumber: 1,
            actualStart: '01:00',
            actualEnd: '01:30',
            status: 'Weather',
          },
          {
            segmentNumber: 2,
            actualStart: '01:30',
            actualEnd: '02:00',
            status: 'Technical',
          },
        ],
      },
    ];

    const summary = calculateDailySummary('2026-02-01', '2.4m', actual);
    expect(summary.observationTime).toBe(120);
    expect(summary.weatherLoss).toBe(30);
    expect(summary.technicalLoss).toBe(30);
    expect(summary.byProposal).toEqual({ ID001: 120 });
  });
});
