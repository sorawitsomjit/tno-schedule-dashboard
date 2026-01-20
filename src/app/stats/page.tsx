"use client";

import React, { useEffect, useState } from 'react';
import { fetchAndParseDailyStats, DailyStat } from '@/utils/csvParser';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function StatsPage() {
    const [stats, setStats] = useState<DailyStat[]>([]);
    const [activeTab, setActiveTab] = useState<'2.4m' | '1m'>('2.4m');

    useEffect(() => {
        fetchAndParseDailyStats('/daily_stats.csv').then(setStats);
    }, []);

    const filteredStats = stats.filter(s => s.telescope === activeTab);

    // 1. Efficiency Data (Stacked Bar)
    const efficiencyData = filteredStats.map(s => ({
        name: s.date.slice(5), // MM-DD
        Observed: Math.max(0, s.allocatedTime - s.weatherLoss - s.technicalLoss),
        Weather: s.weatherLoss,
        Technical: s.technicalLoss,
        proposal: s.proposalId
    }));

    // 2. Summary Pie Chart Data
    const totalAllocated = filteredStats.reduce((acc, s) => acc + s.allocatedTime, 0);
    const totalWeather = filteredStats.reduce((acc, s) => acc + s.weatherLoss, 0);
    const totalTech = filteredStats.reduce((acc, s) => acc + s.technicalLoss, 0);
    const totalObserved = Math.max(0, totalAllocated - totalWeather - totalTech);

    const pieData = [
        { name: 'Observed', value: totalObserved, color: '#4ade80' }, // Green
        { name: 'Weather Loss', value: totalWeather, color: '#60a5fa' }, // Blue
        { name: 'Technical Loss', value: totalTech, color: '#f87171' }   // Red
    ];

    return (
        <div className="min-h-screen p-8 max-w-7xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BarChart3 className="text-blue-400" />
                    Statistics Dashboard
                    <span className="text-xs bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-2 py-0.5 rounded ml-2">Mock Data</span>
                </h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-700 pb-1">
                <button
                    onClick={() => setActiveTab('2.4m')}
                    className={`px-6 py-2 font-bold text-lg transition-all border-b-2 ${activeTab === '2.4m' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    2.4m Telescope
                </button>
                <button
                    onClick={() => setActiveTab('1m')}
                    className={`px-6 py-2 font-bold text-lg transition-all border-b-2 ${activeTab === '1m' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    1m Telescope
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6">
                    <h3 className="text-slate-400 text-sm font-bold uppercase">Total Allocated Time</h3>
                    <div className="text-4xl font-bold text-white mt-2">{totalAllocated.toFixed(1)} <span className="text-lg text-slate-500">hrs</span></div>
                </div>
                <div className="glass-panel p-6">
                    <h3 className="text-slate-400 text-sm font-bold uppercase">Weather Downtime</h3>
                    <div className={`text-4xl font-bold mt-2 ${totalWeather > 0 ? 'text-blue-400' : 'text-slate-300'}`}>{totalWeather.toFixed(1)} <span className="text-lg text-slate-500">hrs</span></div>
                    <div className="text-xs text-slate-500 mt-1">{(totalWeather / totalAllocated * 100).toFixed(1)}% of total</div>
                </div>
                <div className="glass-panel p-6">
                    <h3 className="text-slate-400 text-sm font-bold uppercase">Technical Downtime</h3>
                    <div className={`text-4xl font-bold mt-2 ${totalTech > 0 ? 'text-red-400' : 'text-slate-300'}`}>{totalTech.toFixed(1)} <span className="text-lg text-slate-500">hrs</span></div>
                    <div className="text-xs text-slate-500 mt-1">{(totalTech / totalAllocated * 100).toFixed(1)}% of total</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stacked Bar Chart */}
                <div className="lg:col-span-2 glass-panel p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Nightly Efficiency Breakdown</h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={efficiencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Legend />
                                <Bar dataKey="Observed" stackId="a" fill="#4ade80" />
                                <Bar dataKey="Weather" stackId="a" fill="#60a5fa" />
                                <Bar dataKey="Technical" stackId="a" fill="#f87171" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="glass-panel p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Total Time Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 space-y-2">
                        {pieData.map((d) => (
                            <div key={d.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span className="text-slate-300">{d.name}</span>
                                </div>
                                <span className="font-bold text-white">{d.value.toFixed(1)} h</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
