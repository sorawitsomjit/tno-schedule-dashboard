import SunCalc from 'suncalc';
import { addDays, format } from 'date-fns';
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

const atNoon =(d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);

/** Sky timings for the night that starts on `nightDate`: evening of that date, morning of the next. */
export function nightSkyTimes(nightDate: Date): NightSkyTimes {
    const evening = SunCalc.getTimes(atNoon(nightDate), LAT, LON);
    const morning = SunCalc.getTimes(atNoon(addDays(nightDate, 1)), LAT, LON);
    const moon = SunCalc.getMoonTimes(atNoon(nightDate), LAT, LON);
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
        scienceMinutes: Math.round((morning.nightEnd.getTime() - evening.night.getTime()) / 60000),
    };
}
