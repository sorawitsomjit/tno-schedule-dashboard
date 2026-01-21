"use client";

import React, { useEffect, useState } from 'react';
import SunCalc from 'suncalc';
import { Cloud, Droplets, Wind, Sun, Moon, Sunrise, Sunset, Clock, Thermometer, ArrowDown, ArrowUp, MapPin, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { format, differenceInMinutes, addDays } from 'date-fns';
import { logSkyTiming, exportSkyTimingCSV, getSkyTimingLog } from '@/utils/skyTimingLogger';

// Doi Inthanon Coordinates
const LAT = 18.5853;
const LON = 98.4872;

// OpenWeatherMap API Configuration
// Set NEXT_PUBLIC_OPENWEATHER_API_KEY in your .env file
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'fac2a57f8cbe6b826445fb6570d465a2';

// Toggle: Enable/Disable Sky Timing Log Download Feature
const ENABLE_SKY_LOG_DOWNLOAD = true; // Set to false to hide download button

interface WeatherData {
    temp: number;
    humidity: number;
    windSpeed: number;
    clouds: number;
    weather: string;
    icon: string;
}

interface ForecastItem {
    dt: number;
    temp: {
        min: number;
        max: number;
    };
    humidity: number;
    clouds: number;
    weather: string;
    icon: string;
    date: Date;
}

export const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [forecast, setForecast] = useState<ForecastItem[]>([]);
    const [astroTimes, setAstroTimes] = useState<any>(null);
    const [showForecast, setShowForecast] = useState(false);

    useEffect(() => {
        const now = new Date();

        // 1. Calculate Astronomy Data (Offline using SunCalc)
        const times = SunCalc.getTimes(now, LAT, LON);
        const moon = SunCalc.getMoonIllumination(now);
        const moonTimes = SunCalc.getMoonTimes(now, LAT, LON);

        setAstroTimes({
            sunset: times.sunset,         // 0 degrees
            dusk: times.dusk,             // -6 degrees (Civil)
            nauticalDusk: times.nauticalDusk, // -12 degrees (Nautical)
            night: times.night,           // -18 degrees (Astro Start)

            nightEnd: times.nightEnd,     // -18 degrees (Astro End)
            nauticalDawn: times.nauticalDawn, // -12 degrees
            dawn: times.dawn,             // -6 degrees
            sunrise: times.sunrise,       // 0 degrees

            moonRise: moonTimes.rise,
            moonSet: moonTimes.set
        });

        // Calculate Science Time (Astro Dusk to Astro Dawn)
        const calculateScienceTime = () => {
            if (!times.night || !times.nightEnd) return null;

            const astroDuskTime = times.night;
            const astroDawnTime = times.nightEnd;

            // Fix: If dawn is before dusk (crosses midnight), add 24 hours to dawn
            let scienceMinutes = differenceInMinutes(astroDawnTime, astroDuskTime);
            if (scienceMinutes < 0) {
                scienceMinutes = scienceMinutes + (24 * 60); // Add 24 hours
            }

            const scienceHours = Math.floor(scienceMinutes / 60);
            const scienceRemainder = scienceMinutes % 60;

            return {
                minutes: scienceMinutes,
                formatted: `${String(scienceHours).padStart(2, '0')}:${String(scienceRemainder).padStart(2, '0')}`
            };
        };

        const scienceTime = calculateScienceTime();

        // Auto-log sky timing data (once per day)
        if (scienceTime) {
            const todayStr = format(now, 'yyyy-MM-dd');
            const existingLog = getSkyTimingLog();
            const alreadyLogged = existingLog.some(r => r.date === todayStr);

            if (!alreadyLogged) {
                logSkyTiming({
                    date: todayStr,
                    sunset: format(times.sunset, 'HH:mm'),
                    civilDusk: format(times.dusk, 'HH:mm'),
                    nauticalDusk: format(times.nauticalDusk, 'HH:mm'),
                    astroDusk: format(times.night, 'HH:mm'),
                    astroDawn: format(times.nightEnd, 'HH:mm'),
                    nauticalDawn: format(times.nauticalDawn, 'HH:mm'),
                    civilDawn: format(times.dawn, 'HH:mm'),
                    sunrise: format(times.sunrise, 'HH:mm'),
                    scienceDuration: scienceTime.formatted
                });
            }
        }

        // 2. Fetch Weather (OpenWeatherMap)
        const fetchWeather = async () => {
            try {
                if (!API_KEY) {
                    return;
                }

                // Current Weather
                const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`);
                const data = await res.json();

                if (data.main) {
                    setWeather({
                        temp: data.main.temp,
                        humidity: data.main.humidity,
                        windSpeed: data.wind.speed,
                        clouds: data.clouds.all,
                        weather: data.weather[0].main,
                        icon: data.weather[0].icon
                    });
                }

                // Forecast (Using 5 day / 3 hour API)
                const resForecast = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`);
                const dataForecast = await resForecast.json();

                if (dataForecast.list) {
                    // Process 3-hour steps into daily summary (approximate)
                    const dailyMap = new Map();

                    dataForecast.list.forEach((item: any) => {
                        const date = new Date(item.dt * 1000).toDateString();
                        if (!dailyMap.has(date)) {
                            dailyMap.set(date, {
                                dt: item.dt,
                                temp: {
                                    min: item.main.temp_min,
                                    max: item.main.temp_max
                                },
                                humidity: item.main.humidity,
                                clouds: item.clouds.all,
                                weather: item.weather[0].main,
                                icon: item.weather[0].icon,
                                date: new Date(item.dt * 1000)
                            });
                        } else {
                            // Update min/max and track max humidity/clouds
                            const current = dailyMap.get(date);
                            current.temp.min = Math.min(current.temp.min, item.main.temp_min);
                            current.temp.max = Math.max(current.temp.max, item.main.temp_max);
                            current.humidity = Math.max(current.humidity, item.main.humidity);
                            current.clouds = Math.max(current.clouds, item.clouds.all);
                        }
                    });

                    // Convert to array and take first 7 days (if available)
                    const dailyList = Array.from(dailyMap.values()).slice(0, 7);
                    setForecast(dailyList);
                }

            } catch (err) {
                console.error("Failed to fetch weather", err);
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 600000); // 10 mins
        return () => clearInterval(interval);

    }, []);

    if (!astroTimes || !weather) return null;

    return (
        <div className="mb-6 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Astro Card */}
                <div className="glass-panel p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-2">
                        <div className="flex items-center gap-2">
                            <Sun className="text-orange-400" size={20} />
                            <h3 className="font-bold text-slate-200">Sky Timings (Today)</h3>
                        </div>

                        {/* Sky Timing Log Download Button (Compact) */}
                        {ENABLE_SKY_LOG_DOWNLOAD && (
                            <button
                                onClick={exportSkyTimingCSV}
                                className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs transition-colors border border-slate-700/50"
                                title="Download Sky Timing Log CSV"
                            >
                                <Download size={12} />
                                <span className="hidden sm:inline">CSV</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                        {/* Evening / Setting */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-slate-400 font-bold border-b border-slate-700 pb-1 mb-1">
                                <ArrowDown size={12} className="text-orange-400" /> Evening (Setting)
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Sunset (0°)</span>
                                <span className="font-mono text-orange-200">{format(astroTimes.sunset, 'HH:mm')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Civil Dusk (-6°)</span>
                                <span className="font-mono text-slate-300">{format(astroTimes.dusk, 'HH:mm')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Nautical Dusk (-12°)</span>
                                <span className="font-mono text-slate-300">{format(astroTimes.nauticalDusk, 'HH:mm')}</span>
                            </div>
                            <div className="flex justify-between bg-slate-800/80 px-1 rounded border border-blue-500/30">
                                <span className="text-blue-300 font-bold">Astro Dusk (-18°)</span>
                                <span className="font-mono text-white font-bold">{format(astroTimes.night, 'HH:mm')}</span>
                            </div>
                        </div>

                        {/* Morning / Rising */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-slate-400 font-bold border-b border-slate-700 pb-1 mb-1">
                                <ArrowUp size={12} className="text-yellow-400" /> Morning (Rising)
                            </div>
                            <div className="flex justify-between bg-slate-800/80 px-1 rounded border border-blue-500/30">
                                <span className="text-blue-300 font-bold">Astro Dawn (-18°)</span>
                                <span className="font-mono text-white font-bold">{format(astroTimes.nightEnd, 'HH:mm')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Nautical Dawn (-12°)</span>
                                <span className="font-mono text-slate-300">{format(astroTimes.nauticalDawn, 'HH:mm')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Civil Dawn (-6°)</span>
                                <span className="font-mono text-slate-300">{format(astroTimes.dawn, 'HH:mm')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Sunrise (0°)</span>
                                <span className="font-mono text-yellow-200">{format(astroTimes.sunrise, 'HH:mm')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-700/50 flex justify-between items-center text-xs text-slate-400 px-2">
                        <span className="flex gap-1 items-center"><Moon size={12} /> Rise: {astroTimes.moonRise ? format(astroTimes.moonRise, 'HH:mm') : '--:--'}</span>
                        <span className="flex gap-1 items-center"><Moon size={12} /> Set: {astroTimes.moonSet ? format(astroTimes.moonSet, 'HH:mm') : '--:--'}</span>
                    </div>

                    {/* Astro Science Window Bar (Inside Sky Timing Panel - Compact) */}
                    {(() => {
                        const astroDuskTime = astroTimes.night;
                        const astroDawnTime = astroTimes.nightEnd;

                        if (!astroDuskTime || !astroDawnTime) return null;

                        // Fix: Handle midnight crossing
                        let scienceMinutes = differenceInMinutes(astroDawnTime, astroDuskTime);
                        if (scienceMinutes < 0) {
                            scienceMinutes = scienceMinutes + (24 * 60);
                        }

                        const scienceHours = Math.floor(scienceMinutes / 60);
                        const scienceRemainder = scienceMinutes % 60;
                        const scienceDuration = `${String(scienceHours).padStart(2, '0')}:${String(scienceRemainder).padStart(2, '0')}`;

                        return (
                            <div className="mt-3 pt-2 border-t border-purple-500/20">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] text-purple-400 flex items-center gap-1">
                                        <Moon size={12} />
                                        Science Window
                                    </span>
                                    <span className="text-sm font-bold text-purple-300 font-mono">
                                        {scienceDuration}
                                    </span>
                                </div>

                                {/* Visual Timeline Bar (Compact) */}
                                <div className="relative h-5 bg-gradient-to-r from-blue-900/20 via-purple-900/40 to-blue-900/20 rounded overflow-hidden border border-purple-500/20">
                                    <div className="absolute inset-0 flex items-center justify-between px-1.5 text-[9px] font-mono text-white/70">
                                        <span>{format(astroDuskTime, 'HH:mm')}</span>
                                        <span className="text-purple-300 font-bold">DARK</span>
                                        <span>{format(astroDawnTime, 'HH:mm')}</span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent"></div>
                                </div>
                            </div>
                        );
                    })()}
                </div>



                {/* Weather Card */}
                <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden">
                    {/* New Header: Lat/Long & Attribution */}
                    <div className="flex flex-col mb-4 border-b border-slate-700/50 pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-xl text-slate-100 flex items-center gap-2">
                                    <MapPin size={24} className="text-red-400" />
                                    Thai National Observatory
                                </h3>
                                <p className="text-sm text-slate-400 font-mono ml-8">
                                    Lat: {LAT.toFixed(4)}° N, Long: {LON.toFixed(4)}° E
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1 opacity-80">
                                    <div className="bg-orange-600 text-white text-sm font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                                        <Cloud size={14} fill="white" />
                                        OpenWeather
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 italic mt-0.5">Forecast data</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        {/* Main Temp */}
                        <div className="flex items-center gap-3">
                            {weather.icon && (
                                <img
                                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                                    alt={weather.weather}
                                    className="w-16 h-16 bg-slate-800/50 rounded-full"
                                />
                            )}
                            <div>
                                <div className="text-3xl font-bold text-white">{weather.temp.toFixed(1)}°C</div>
                                <div className="text-slate-400 capitalize text-sm">{weather.weather}</div>
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="flex-1 grid grid-cols-3 gap-3 text-center">
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center">
                                <Droplets size={24} className="text-blue-400 mb-1" />
                                <div className="text-xl font-bold text-white">{weather.humidity}%</div>
                                <div className="text-sm text-slate-400 font-bold uppercase">Hum</div>
                            </div>
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center">
                                <Wind size={24} className="text-green-400 mb-1" />
                                <div className="text-xl font-bold text-white">{weather.windSpeed.toFixed(1)}</div>
                                <div className="text-sm text-slate-400 font-bold uppercase">m/s</div>
                            </div>
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center">
                                <Cloud size={24} className="text-slate-300 mb-1" />
                                <div className="text-xl font-bold text-white">{weather.clouds}%</div>
                                <div className="text-sm text-slate-400 font-bold uppercase">Cover</div>
                            </div>
                        </div>
                    </div>

                    {/* Forecast Toggle */}
                    <button
                        onClick={() => setShowForecast(!showForecast)}
                        className="mt-auto w-full py-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors group"
                    >
                        {showForecast ? (
                            <>Hide Forecast <ChevronUp size={16} className="group-hover:-translate-y-1 transition-transform" /></>
                        ) : (
                            <>7-Day Forecast... <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" /></>
                        )}
                    </button>
                </div>
            </div>

            {/* Forecast Expandable Section */}
            {showForecast && (
                <div className="glass-panel p-4 animate-in slide-in-from-top-2 fade-in duration-300">
                    <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <Clock size={14} className="text-blue-400" />
                        Forecast Trend
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {forecast.map((day, i) => (
                            <div key={i} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex flex-col items-center hover:bg-slate-800 transition-colors">
                                <span className="text-sm text-slate-300 font-bold uppercase mb-2">{format(day.date, 'EEE, MMM d')}</span>
                                <img
                                    src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                                    alt={day.weather}
                                    className="w-12 h-12 opacity-90 my-1 drop-shadow-lg"
                                />
                                <div className="text-base font-bold text-white mb-2 capitalize text-center leading-tight h-10 flex items-center">{day.weather}</div>

                                {/* Temps */}
                                <div className="flex gap-4 text-sm font-mono font-bold mb-3 w-full justify-center bg-slate-950/30 py-1 rounded">
                                    <span className="text-blue-300 flex items-center gap-0.5"><ArrowDown size={14} />{day.temp.min.toFixed(0)}°</span>
                                    <span className="text-red-300 flex items-center gap-0.5"><ArrowUp size={14} />{day.temp.max.toFixed(0)}°</span>
                                </div>

                                {/* Extra Metrics */}
                                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                                    <div className="flex flex-col items-center bg-slate-800/50 p-1.5 rounded">
                                        <Droplets size={14} className="text-blue-400 mb-0.5" />
                                        <span className="text-slate-200 font-bold">{day.humidity}%</span>
                                    </div>
                                    <div className="flex flex-col items-center bg-slate-800/50 p-1.5 rounded">
                                        <Cloud size={14} className="text-slate-400 mb-0.5" />
                                        <span className="text-slate-200 font-bold">{day.clouds}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
