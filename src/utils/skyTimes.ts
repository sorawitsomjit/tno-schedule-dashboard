import SunCalc from 'suncalc';
import { addDays } from 'date-fns';

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

const atNoon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);

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
