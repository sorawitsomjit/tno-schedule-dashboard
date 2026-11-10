"use client";

import React, { useState, useEffect, useRef } from 'react';
import { DateControlPanel } from '@/components/DateControlPanel';
import { DayObservationView } from '@/components/DayObservationView';
import { ScheduleTableView } from '@/components/ScheduleTableView';
import { WeatherWidget } from '@/components/WeatherWidget';
import { fetchSchedule, sortSessionsByTime } from '@/utils/scheduleData';
import { ObservationSession, ScheduleMeta } from '@/types/schedule';
import { format, isSameDay, isValid, parseISO, subDays } from 'date-fns';

// Before 07:00 the operator is still on the previous night's shift.
const getObservationDate = () => {
  const now = new Date();
  return now.getHours() < 7 ? subDays(now, 1) : now;
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Start null to prevent hydration mismatch
  const [allSessions, setAllSessions] = useState<ObservationSession[]>([]);
  const [meta, setMeta] = useState<ScheduleMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [today, setToday] = useState<Date | null>(null);
  const selectedDateRef = useRef<Date | null>(null);
  const todayRef = useRef<Date | null>(null);

  useEffect(() => {
    const observationDate = getObservationDate();
    // ?date=YYYY-MM-DD opens a specific night (shareable link)
    const requested = new URLSearchParams(window.location.search).get('date');
    const initialDate = requested && isValid(parseISO(requested)) ? parseISO(requested) : observationDate;
    setSelectedDate(initialDate);
    selectedDateRef.current = initialDate;
    setToday(observationDate);
    todayRef.current = observationDate;

    fetchSchedule()
      .then(({ meta, sessions }) => {
        setMeta(meta);
        setAllSessions(sessions);
      })
      .catch(err => {
        console.error("Failed to load schedule:", err);
        setLoadError("Schedule data not found (public/schedule_meta.json).");
      })
      .finally(() => setLoading(false));

    // Roll "today" over at 07:00; only move the view if the user was looking at today.
    const interval = setInterval(() => {
      const newToday = getObservationDate();
      const prevToday = todayRef.current;
      if (prevToday && isSameDay(newToday, prevToday)) return;
      if (!selectedDateRef.current || (prevToday && isSameDay(selectedDateRef.current, prevToday))) {
        setSelectedDate(newToday);
        selectedDateRef.current = newToday;
      }
      setToday(newToday);
      todayRef.current = newToday;
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!selectedDate || loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading telescope data...</div>;
  }

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  // Whole cycle (earliest start .. latest end over both telescopes) for the sky timing CSV
  const ranges = meta ? Object.values(meta.telescopes).filter(t => t !== undefined) : [];
  const cycle = meta && ranges.length ? {
    label: meta.cycle,
    start: parseISO(ranges.map(t => t.start).sort()[0]),
    end: parseISO(ranges.map(t => t.end).sort().slice(-1)[0]),
  } : undefined;
  const daySessions = sortSessionsByTime(allSessions.filter(s => s.date === selectedDateStr));

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-20">
      <DateControlPanel
        selectedDate={selectedDate}
        onDateChange={(date) => {
          setSelectedDate(date);
          selectedDateRef.current = date;
        }}
        today={today || new Date()}
        meta={meta}
      />

      {loadError && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">{loadError}</div>
      )}

      <WeatherWidget date={selectedDate} cycle={cycle} />

      <div className="grid grid-cols-1 gap-8">
        <section>
          <DayObservationView date={selectedDate} sessions={daySessions} />
        </section>

        <section className="pt-8 border-t border-slate-800">
          <ScheduleTableView allSessions={allSessions} currentDate={selectedDate} />
        </section>
      </div>
    </main>
  );
}
