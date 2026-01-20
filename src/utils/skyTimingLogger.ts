// Sky Timing Logger Utility
// Stores historical sky timing data in localStorage and provides CSV export

export interface SkyTimingRecord {
    date: string; // YYYY-MM-DD
    sunset: string;
    civilDusk: string;
    nauticalDusk: string;
    astroDusk: string;
    astroDawn: string;
    nauticalDawn: string;
    civilDawn: string;
    sunrise: string;
    scienceDuration: string; // HH:mm format
}

const STORAGE_KEY = 'tno_sky_timing_log';

/**
 * Get all stored sky timing records
 */
export const getSkyTimingLog = (): SkyTimingRecord[] => {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to read sky timing log:', error);
        return [];
    }
};

/**
 * Log sky timing data for a specific date
 * Prevents duplicate entries for the same date
 */
export const logSkyTiming = (record: SkyTimingRecord): boolean => {
    if (typeof window === 'undefined') return false;

    try {
        const existingLog = getSkyTimingLog();

        // Check if entry for this date already exists
        const existingIndex = existingLog.findIndex(r => r.date === record.date);

        if (existingIndex >= 0) {
            // Update existing entry
            existingLog[existingIndex] = record;
        } else {
            // Add new entry
            existingLog.push(record);
        }

        // Sort by date (newest first)
        existingLog.sort((a, b) => b.date.localeCompare(a.date));

        localStorage.setItem(STORAGE_KEY, JSON.stringify(existingLog));
        return true;
    } catch (error) {
        console.error('Failed to log sky timing:', error);
        return false;
    }
};

/**
 * Export all sky timing data as CSV
 */
export const exportSkyTimingCSV = (): void => {
    const records = getSkyTimingLog();

    if (records.length === 0) {
        alert('No sky timing data to export');
        return;
    }

    // CSV Header
    const headers = [
        'Date',
        'Sunset',
        'Civil Dusk',
        'Nautical Dusk',
        'Astro Dusk',
        'Astro Dawn',
        'Nautical Dawn',
        'Civil Dawn',
        'Sunrise',
        'Science Duration (HH:mm)'
    ];

    // CSV Rows
    const rows = records.map(r => [
        r.date,
        r.sunset,
        r.civilDusk,
        r.nauticalDusk,
        r.astroDusk,
        r.astroDawn,
        r.nauticalDawn,
        r.civilDawn,
        r.sunrise,
        r.scienceDuration
    ]);

    // Combine
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `sky_timing_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Clear all sky timing log data
 */
export const clearSkyTimingLog = (): void => {
    if (typeof window === 'undefined') return;

    if (confirm('Are you sure you want to clear all sky timing log data?')) {
        localStorage.removeItem(STORAGE_KEY);
        alert('Sky timing log cleared');
    }
};
