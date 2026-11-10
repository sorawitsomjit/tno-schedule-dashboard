import SunCalc from 'suncalc';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import type { TwilightMark } from './timeline';

// Doi Inthanon (TNO)
export const LAT = 18.5853;
export const LON = 98.4872;

export interface NightSkyTimes {
    sunset: Date;        // 0°
    dusk: Date;          // -6° civil
    nauticalDusk: Date;  // -12°
    night: Date;         // -18° astronomical dusk
    nightEnd: Date;      // -18° astronomical dawn (next morning)
    nauticalDawn: Date;
    dawn: Date;
    sunrise: Date;
    moonRise?: Date;
    moonSet?: Date;
    moonIllumination: number; // % lit at 18:00 local; matches the FLI column of the TAC schedule (±2)
    scienceMinutes: number; // astro dusk -> astro dawn
}

/** Sunset/twilight/sunrise of the night as HH:mm marks for the timeline. */
export function twilightMarks(t: NightSkyTimes): TwilightMark[] {
    const marks: [string, Date, TwilightMark['side']][] = [
        ['0°', t.sunset, 'dusk'], ['-6°', t.dusk, 'dusk'], ['-12°', t.nauticalDusk, 'dusk'], ['-18°', t.night, 'dusk'],
        ['-18°', t.nightEnd, 'dawn'], ['-12°', t.nauticalDawn, 'dawn'], ['-6°', t.dawn, 'dawn'], ['0°', t.sunrise, 'dawn'],
    ];
    return marks.map(([deg, time, side]) => ({ deg, time: format(time, 'HH:mm'), side }));
}

const atHour = (d: Date, h: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h);

/** Sky timings for the night that starts on `nightDate`: evening of that date, morning of the next. */
export function nightSkyTimes(nightDate: Date): NightSkyTimes {
    const evening = SunCalc.getTimes(atHour(nightDate, 12), LAT, LON);
    const morning = SunCalc.getTimes(atHour(addDays(nightDate, 1), 12), LAT, LON);
    const moon = SunCalc.getMoonTimes(atHour(nightDate, 12), LAT, LON);
    return {
        sunset: evening.sunset,
        dusk: evening.dusk,
        nauticalDusk: evening.nauticalDusk,
        night: evening.night,
        nightEnd: morning.nightEnd,
        nauticalDawn: morning.nauticalDawn,
        dawn: morning.dawn,
        sunrise: morning.sunrise,
        moonRise: moon.rise,
        moonSet: moon.set,
        moonIllumination: Math.round(SunCalc.getMoonIllumination(atHour(nightDate, 18)).fraction * 100),
        scienceMinutes: Math.round((morning.nightEnd.getTime() - evening.night.getTime()) / 60000),
    };
}

const hhmm = (d?: Date) => (d && !isNaN(d.getTime()) ? format(d, 'HH:mm') : '');

export const formatDuration = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Sky timings for every night from `start` to `end` (inclusive) as CSV text. */
export function skyTimingCsv(start: Date, end: Date): string {
    const rows = ['Date,Sunset,CivilDusk,NauticalDusk,AstroDusk,AstroDawn,NauticalDawn,CivilDawn,Sunrise,'
        + 'ScienceDuration,MoonIllumination(%),MoonRise,MoonSet'];
    for (let i = 0; i <= differenceInCalendarDays(end, start); i++) {
        const night = addDays(start, i);
        const t = nightSkyTimes(night);
        rows.push([
            format(night, 'yyyy-MM-dd'), hhmm(t.sunset), hhmm(t.dusk), hhmm(t.nauticalDusk), hhmm(t.night),
            hhmm(t.nightEnd), hhmm(t.nauticalDawn), hhmm(t.dawn), hhmm(t.sunrise),
            formatDuration(t.scienceMinutes), t.moonIllumination, hhmm(t.moonRise), hhmm(t.moonSet),
        ].join(','));
    }
    return rows.join('\n') + '\n';
}
