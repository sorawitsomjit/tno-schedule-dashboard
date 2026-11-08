import { describe, it, expect } from 'vitest';
import { parseScheduleCsv, sortSessionsByTime } from './scheduleData';
import { sessionLabel, textColorFor, typeBadge } from './sessionDisplay';

const CSV = `Date,Telescope,ProposalID,ShortCode,Type,PIName,Instrument,TimeStart,TimeEnd,MoonPhase,Color
2027-01-30,2.4m,OH,OH,Open House,Open House,Eyepiece,19:00,00:00,40,#404040
2027-01-30,2.4m,TNTC14_005,5,DDT,Napaporn,ULTRASPEC,00:00,02:00,40,#000000
2027-01-30,2.4m,TNTC14_005,5,Proposal,Napaporn,ULTRASPEC,02:00,05:00,40,#76D6FF
2027-01-31,2.4m,,,,,,19:00,05:00,,
`;

describe('parseScheduleCsv', () => {
  const sessions = parseScheduleCsv(CSV, '2.4m');

  it('reads every valid row and skips rows without a proposal', () => {
    expect(sessions).toHaveLength(3);
  });

  it('keeps type, short code, colour and moon phase from the CSV', () => {
    const ddt = sessions[1];
    expect(ddt).toMatchObject({
      date: '2027-01-30', telescope: '2.4m', proposalId: 'TNTC14_005', shortCode: '5', type: 'DDT',
      piName: 'Napaporn', instrument: 'ULTRASPEC', timeStart: '00:00', timeEnd: '02:00',
      moonPhase: 40, color: '#000000',
    });
  });

  it('gives each allocation a stable id', () => {
    expect(sessions[2].allocationId).toBe('2027-01-30|2.4m|TNTC14_005|02:00|05:00|ULTRASPEC');
  });
});

describe('sortSessionsByTime', () => {
  it('orders sessions from 19:00 through after-midnight times', () => {
    const sorted = sortSessionsByTime([
      { timeStart: '01:00' }, { timeStart: '23:30' }, { timeStart: '19:00' }, { timeStart: '05:00' },
    ]);
    expect(sorted.map(s => s.timeStart)).toEqual(['19:00', '23:30', '01:00', '05:00']);
  });
});

describe('sessionLabel', () => {
  it('shows proposal number and PI for proposals and DDT-for-proposal', () => {
    expect(sessionLabel({ type: 'Proposal', shortCode: '5', piName: 'Napaporn' })).toBe('#5 Napaporn');
    expect(sessionLabel({ type: 'DDT', shortCode: '5', piName: 'Napaporn' })).toBe('#5 Napaporn');
  });

  it('shows the type name for special time', () => {
    expect(sessionLabel({ type: 'GTO', shortCode: 'G', piName: 'GTO' })).toBe('GTO');
    expect(sessionLabel({ type: 'Buffer', shortCode: 'B', piName: 'Buffer' })).toBe('Buffer');
    expect(sessionLabel({ type: 'DDT', shortCode: 'DDT', piName: 'DDT' })).toBe('DDT');
  });
});

describe('typeBadge', () => {
  it('only badges a type that the label does not already say', () => {
    expect(typeBadge({ type: 'DDT', shortCode: '5', piName: 'Napaporn' })).toBe('DDT');
    expect(typeBadge({ type: 'Proposal', shortCode: '5', piName: 'Napaporn' })).toBeNull();
    expect(typeBadge({ type: 'Open House', shortCode: 'OH', piName: 'Open House' })).toBeNull();
  });
});

describe('textColorFor', () => {
  it('uses dark text on light fills and white text on dark fills', () => {
    expect(textColorFor('#FFFD78')).toBe('#0f172a');
    expect(textColorFor('#000000')).toBe('#ffffff');
    expect(textColorFor('#0096FF')).toBe('#ffffff');
  });
});
