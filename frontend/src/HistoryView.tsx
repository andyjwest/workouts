import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from './api';
import type { Workout } from './types';
import { format, parseISO } from 'date-fns';
import { ChevronRight, Clock, Dumbbell, Calendar, Plus, X, List } from 'lucide-react';
import WorkoutDetailModal from './components/WorkoutDetailModal';
import type { Exercise, WorkoutExercise } from './types';
import { useUserPreferences } from './context/UserPreferencesContext';

const HistoryView: React.FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const [showDateModal, setShowDateModal] = useState(false);
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [logTime, setLogTime] = useState('12:00');
    const [routineSchedule, setRoutineSchedule] = useState<any[]>([]);
    const [selectedRoutineDayId, setSelectedRoutineDayId] = useState<string>('');

    const { convertWeight, unitLabel } = useUserPreferences();
    const navigate = useNavigate();

    useEffect(() => {
        loadWorkouts();
        loadSchedule();
    }, []);

    const loadSchedule = async () => {
        try {
            const data = await api.get<any[]>('/routines/active/schedule');
            setRoutineSchedule(data);
        } catch (err) {
            console.error("Failed to load routine schedule", err);
        }
    };

    const loadWorkouts = async () => {
        try {
            const data = await api.get<Workout[]>('/workouts/');
            setWorkouts(data);
        } catch (err) {
            console.error('Failed to load history', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/workouts/${id}`);
            setWorkouts(workouts.filter(w => w.id !== id));
            setSelectedWorkout(null);
        } catch (err) {
            console.error('Failed to delete workout', err);
            alert('Failed to delete workout');
        }
    };

    const handleLogPastWorkout = async () => {
        setIsLoading(true);
        try {
            // 1. Create the workout
            let notes = 'Past Workout Log';
            let dayData: any = null;

            if (selectedRoutineDayId) {
                // Find the selected routine day data
                for (const day of routineSchedule) {
                    if (day.id.toString() === selectedRoutineDayId) {
                        dayData = day;
                        notes = `Routine: ${day.routine_name || 'Active Routine'} - ${day.day_name || day.name}`;
                        break;
                    }
                }
            }

            const workout = await api.post<Workout>('/workouts/', {
                user_id: 1, // default user
                date: logDate,
                start_time: logTime,
                notes: notes
            });

            // 2. Populate with exercises if routine selected
            if (dayData && dayData.exercises) {
                for (let i = 0; i < dayData.exercises.length; i++) {
                    const ex = dayData.exercises[i];
                    // Create WorkoutExercise
                    const we = await api.post<WorkoutExercise>('/workout_exercises/', {
                        workout_id: workout.id,
                        exercise_id: ex.id,
                        sequence: i + 1
                    });

                    // Fetch full exercise for details (defaults)
                    const fullEx = await api.get<Exercise>(`/exercises/${ex.id}`);

                    // Create Sets
                    const numSets = ex.suggested_sets || fullEx.default_sets || 0;
                    if (numSets > 0) {
                        for (let s = 1; s <= numSets; s++) {
                            await api.post('/workout_sets/', {
                                workout_exercise_id: we.id,
                                set_number: s,
                                reps: ex.suggested_reps ? parseInt(ex.suggested_reps) : (fullEx.default_reps ? parseInt(fullEx.default_reps) : null),
                                duration_seconds: ex.suggested_time_seconds || fullEx.default_time_seconds || null,
                                tempo: ex.tempo || fullEx.default_tempo,
                                completed: false
                            });
                        }
                    }
                }
            }

            navigate(`/workout/${workout.id}`);
        } catch (err) {
            console.error('Failed to create past workout', err);
            alert('Failed to create workout');
            setIsLoading(false);
        }
    };

    // Group workouts by Month (YYYY-MM)
    const groupedWorkouts = workouts.reduce((groups, workout) => {
        const date = parseISO(workout.date);
        const key = format(date, 'MMMM yyyy');
        if (!groups[key]) groups[key] = [];
        groups[key].push(workout);
        return groups;
    }, {} as Record<string, Workout[]>);

    // Get ordered keys (Assuming workouts came in desc order)
    const monthKeys = Object.keys(groupedWorkouts);

    // Calculate generic stats for a workout
    const getStats = (workout: Workout) => {
        // Calculate volume
        let volume = 0;
        let sets = 0;
        let exercises = workout.exercises?.length || 0;

        workout.exercises?.forEach(ex => {
            ex.sets?.forEach(set => {
                sets++;
                if (set.weight_kg && set.reps) {
                    volume += set.weight_kg * set.reps;
                }
            });
        });

        // Calculate duration if available
        let duration = '';
        if (workout.start_time && workout.end_time) {
            const start = new Date(`1970-01-01T${workout.start_time}`);
            const end = new Date(`1970-01-01T${workout.end_time}`);
            const diffMin = Math.round((end.getTime() - start.getTime()) / 60000);
            if (diffMin > 0) {
                const hours = Math.floor(diffMin / 60);
                const mins = diffMin % 60;
                duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            }
        }

        return { volume, sets, exercises, duration };
    };



    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Clock className="text-sky-400" size={32} />
                        History
                    </h1>
                    <p className="text-slate-400">Review your past training sessions</p>
                </div>
                <button
                    onClick={() => setShowDateModal(true)}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-sky-900/20"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Log Past Workout</span>
                </button>
            </header>

            {isLoading ? (
                <div className="text-center py-20 text-slate-500">Loading history...</div>
            ) : workouts.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                    <Dumbbell className="mx-auto mb-4 text-slate-600" size={48} />
                    <p className="text-slate-400 font-medium">No workouts recorded yet.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {monthKeys.map(month => (
                        <section key={month}>
                            <h2 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-4 sticky top-0 bg-slate-950/80 backdrop-blur-sm py-2 z-10">
                                {month}
                            </h2>
                            <div className="space-y-3">
                                {groupedWorkouts[month].map(workout => {
                                    const stats = getStats(workout);
                                    const date = parseISO(workout.date);

                                    return (
                                        <div
                                            key={workout.id}
                                            className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer group"
                                            onClick={() => setSelectedWorkout(workout)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-bold text-lg text-white">
                                                            {format(date, 'EEE, d MMM')}
                                                        </span>
                                                        {stats.duration && (
                                                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full flex items-center gap-1">
                                                                <Clock size={12} /> {stats.duration}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* We don't really have a "Routine Name" persisted on the workout directly unless we join, 
                                                        but usually checking the first exercise gives a hint, or we add custom naming later.
                                                        For now, let's list the top muscle groups or exercise count. 
                                                     */}
                                                    <div className="text-sky-400 font-medium mb-3">
                                                        {stats.exercises} Exercises • {stats.sets} Sets
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs uppercase text-slate-600 font-bold">Volume</span>
                                                            <span className="text-slate-300">
                                                                {stats.volume > 0
                                                                    ? `${(convertWeight(stats.volume / 1000) ?? 0).toFixed(1)}k ${unitLabel}`
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                        {/* Could add Reps or other stats here */}
                                                    </div>
                                                </div>

                                                <div className="text-slate-600 group-hover:text-white transition-colors pt-2">
                                                    <ChevronRight size={24} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {selectedWorkout && (
                <WorkoutDetailModal
                    workout={selectedWorkout}
                    onClose={() => setSelectedWorkout(null)}
                    onDelete={handleDelete}
                />
            )}

            {/* Date Selection Modal */}
            {showDateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowDateModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="text-sky-400" />
                                Log Past Workout
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Select the date and time for this workout.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={logDate}
                                    onChange={(e) => setLogDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={logTime}
                                    onChange={(e) => setLogTime(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Populate from Routine (Optional)</label>
                                <div className="relative">
                                    <List className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <select
                                        value={selectedRoutineDayId}
                                        onChange={(e) => setSelectedRoutineDayId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none appearance-none"
                                    >
                                        <option value="">No Routine (Empty Workout)</option>
                                        {routineSchedule.map((day) => (
                                            <option key={day.id} value={day.id}>
                                                {day.day_name || day.name} ({day.exercises?.length || 0} exercises)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleLogPastWorkout}
                                disabled={isLoading}
                                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2"
                            >
                                {isLoading ? 'Creating...' : 'Start Logging'}
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryView;
