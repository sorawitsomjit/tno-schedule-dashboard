"use client";

import React, { useState, useEffect } from 'react';
import { DateControlPanel } from '@/components/DateControlPanel';
import { DayObservationView } from '@/components/DayObservationView';
import { ScheduleTableView } from '@/components/ScheduleTableView';
import { WeatherWidget } from '@/components/WeatherWidget';
import { fetchAndParseSchedule, sortSessionsByTime } from '@/utils/csvParser';
import { ObservationSession } from '@/types/schedule';
import { format, subDays } from 'date-fns';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Start null to prevent hydration mismatch
  const [allSessions, setAllSessions] = useState<ObservationSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [today, setToday] = useState<Date | null>(null);

  // Helper: Get observation date based on shift schedule
  // If before 07:00 AM, use previous day (aligns with 19:00-05:00 shift)
  const getObservationDate = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // If before 07:00 AM, use previous day
    if (currentHour < 7) {
      return subDays(now, 1);
    }
    return now;
  };

  // Initial Data Fetch & Hydration Fix
  useEffect(() => {
    // Set initial date only on client (shift-aligned)
    const observationDate = getObservationDate();
    setSelectedDate(observationDate);
    setToday(observationDate);

    // Fetch CSV (Defaults to split files in csvParser)
    fetchAndParseSchedule()
      .then(data => {
        setAllSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load schedule:", err);
        setLoading(false);
      });

    // Auto-update logic: Check every minute if we need to roll over to next day
    const interval = setInterval(() => {
      const newObservationDate = getObservationDate();
      const currentSelected = selectedDate || new Date();

      // If observation date changed (crossed 07:00 AM), update
      if (format(newObservationDate, 'yyyy-MM-dd') !== format(currentSelected, 'yyyy-MM-dd')) {
        setSelectedDate(newObservationDate);
        setToday(newObservationDate);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  if (!selectedDate || loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading telescope data...</div>;
  }

  // Filter sessions for the selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Filter and Sort for Day View
  const daySessions = sortSessionsByTime(
    allSessions.filter(s => s.date === selectedDateStr)
  );

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-20">
      <DateControlPanel
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        today={today || new Date()}
      />

      <WeatherWidget />

      <div className="grid grid-cols-1 gap-8">
        <section>
          <DayObservationView
            date={selectedDate}
            sessions={daySessions}
          />
        </section>

        <section className="pt-8 border-t border-slate-800">
          <ScheduleTableView
            allSessions={allSessions}
            currentDate={selectedDate}
          />
        </section>
      </div>
    </main>
  );
}
