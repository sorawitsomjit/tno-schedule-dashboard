/**
 * Time helpers for a night that runs across midnight (e.g. 19:00 -> 06:00).
 */

/** "3:00" -> "03:00"; returns null for anything that is not a valid HH:mm. */
export const normalizeTime = (time: string | number | undefined | null): string | null => {
    if (time === undefined || time === null) return null;
    const match = String(time).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 23 || m > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Minutes since midnight of the night's start date; times before noon belong to the next day. */
export const toNightMinutes = (time: string): number => {
    const [h, m] = (time || '00:00').split(':').map(Number);
    return (h < 12 ? h + 24 : h) * 60 + m;
};

/** Inverse of toNightMinutes, wrapped to a clock time. */
export const fromNightMinutes = (minutes: number): string => {
    const wrapped = ((minutes % 1440) + 1440) % 1440;
    return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
};
