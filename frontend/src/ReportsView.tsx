import React, { useState, useEffect } from 'react';
import { api } from './api';
import type { Workout, Exercise } from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, Dumbbell } from 'lucide-react';
import Autocomplete from './components/Autocomplete';
import { format, parseISO } from 'date-fns';

const ReportsView: React.FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [workoutsData, exercisesData] = await Promise.all([
                api.get<Workout[]>('/workouts/'),
                api.get<Exercise[]>('/exercises/')
            ]);
            setWorkouts(workoutsData);
            setExercises(exercisesData);
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    const exerciseOptions = exercises.map(ex => ({
        label: ex.name,
        value: ex.id
    })).sort((a, b) => a.label.localeCompare(b.label));

    // --- Aggregate Data Processing (Default View) ---
    const workoutsByMonth = workouts.reduce((acc, workout) => {
        const month = new Date(workout.date).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const barData = Object.entries(workoutsByMonth).map(([name, count]) => ({ name, count }));

    // Mock volume data for now since we need to calculate it from sets
    const volumeData = workouts.slice(0, 10).map((_w, i) => ({
        name: `WO ${i + 1}`,
        volume: Math.floor(Math.random() * 5000) + 2000 // Placeholder
    }));

    // --- Exercise Specific Processing ---
    const getExerciseHistory = () => {
        if (!selectedExerciseId) return [];

        const history: any[] = [];
        const selectedExercise = exercises.find(e => e.id === selectedExerciseId);
        if (!selectedExercise) return [];

        workouts.forEach(workout => {
            if (!workout.exercises) return;

            workout.exercises.forEach((item: any) => {
                const checkAndAdd = (ex: any) => {
                    // Check logic based on confirmed API response (ex.id matches exercise ID)
                    if (ex.id === selectedExerciseId && ex.sets && ex.sets.length > 0) {
                        // Calculate One Rep Max (Epley formula) for the best set
                        let maxWeight = 0;
                        let estimated1RM = 0;

                        ex.sets.forEach((set: any) => {
                            if (set.weight_kg && set.weight_kg > maxWeight) {
                                maxWeight = set.weight_kg;
                            }
                            if (set.weight_kg && set.reps) {
                                const e1rm = set.weight_kg * (1 + set.reps / 30);
                                if (e1rm > estimated1RM) estimated1RM = e1rm;
                            }
                        });

                        history.push({
                            date: workout.date,
                            sets: ex.sets,
                            maxWeight,
                            estimated1RM,
                            volume: ex.sets.reduce((acc: number, s: any) => acc + ((s.weight_kg || 0) * (s.reps || 0)), 0),
                            notes: ex.notes
                        });
                    }
                };

                if (item.superset && Array.isArray(item.superset)) {
                    item.superset.forEach(checkAndAdd);
                } else {
                    checkAndAdd(item);
                }
            });
        });

        return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const exerciseHistory = getExerciseHistory();
    const selectedExerciseName = exercises.find(e => e.id === selectedExerciseId)?.name;

    // Filter for chart (reverse order for date ascending)
    const chartData = [...exerciseHistory].reverse().map(h => ({
        date: format(parseISO(h.date), 'MMM d'),
        weight: h.maxWeight,
        e1rm: Math.round(h.estimated1RM)
    }));

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading history...</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <header className="mb-4">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <TrendingUp className="text-sky-400" size={32} />
                    Exercise History
                </h1>
                <p className="text-slate-400 mb-6">Select an exercise to view detailed progress.</p>

                <div className="max-w-md">
                    <Autocomplete
                        options={exerciseOptions}
                        value={selectedExerciseId}
                        onChange={setSelectedExerciseId}
                        placeholder="Search for an exercise..."
                        className="w-full"
                    />
                </div>
            </header>

            {!selectedExerciseId ? (
                // Default Aggregate View
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Reuse existing charts */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                                <Calendar size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Workout Frequency</h2>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                        itemStyle={{ color: '#38bdf8' }}
                                    />
                                    <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                                <TrendingUp size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Volume Trend</h2>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={volumeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                        itemStyle={{ color: '#4ade80' }}
                                    />
                                    <Line type="monotone" dataKey="volume" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                // Selected Exercise View
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <h2 className="text-xl font-bold text-white mb-6">Progress: {selectedExerciseName}</h2>
                        {chartData.length > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" label={{ value: 'Weight', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                                            labelStyle={{ color: '#94a3b8' }}
                                        />
                                        <Line name="Max Weight" type="monotone" dataKey="weight" stroke="#38bdf8" strokeWidth={2} activeDot={{ r: 6 }} />
                                        <Line name="Est. 1RM" type="monotone" dataKey="e1rm" stroke="#a78bfa" strokeWidth={2} strokeDasharray="4 4" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                                <Dumbbell className="mb-2 opacity-50" size={32} />
                                <p>No chart data available yet.</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider">History Log</h3>
                        {exerciseHistory.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl">
                                No history found for this exercise.
                            </div>
                        ) : (
                            exerciseHistory.map((entry, idx) => (
                                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-sky-500/10 p-2 rounded-lg text-sky-400">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-lg">
                                                    {format(parseISO(entry.date), 'EEEE, MMMM do, yyyy')}
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    Est. 1RM: <span className="text-slate-300 font-mono">{Math.round(entry.estimated1RM)} lbs</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Optional: Add link to workout? */}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {entry.sets.map((set: any, sIdx: number) => (
                                            <div key={sIdx} className="bg-slate-950/50 border border-slate-800/50 rounded-lg p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-slate-500 w-6">#{set.set_number}</span>
                                                    <div className="font-mono text-slate-200">
                                                        <span className="text-sky-400 font-bold">{set.weight_kg}</span>
                                                        <span className="text-xs text-slate-500 ml-1">lbs</span>
                                                        <span className="mx-2 text-slate-600">×</span>
                                                        <span className="text-white font-bold">{set.reps}</span>
                                                    </div>
                                                </div>
                                                {set.rpe && (
                                                    <span className="text-xs text-amber-500/80 font-medium px-1.5 py-0.5 bg-amber-500/10 rounded">
                                                        RPE {set.rpe}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
