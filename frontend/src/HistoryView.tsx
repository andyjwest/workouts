import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';
import type { Workout } from './types';
import { format, parseISO } from 'date-fns';
import { ChevronRight, Clock, Dumbbell } from 'lucide-react';
import WorkoutDetailModal from './components/WorkoutDetailModal';
import { useUserPreferences } from './context/UserPreferencesContext';

const HistoryView: React.FC = () => {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
    const navigate = useNavigate();
    const { convertWeight, unitLabel } = useUserPreferences();

    useEffect(() => {
        loadWorkouts();
    }, []);

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

    const handleReopen = async (workout: Workout) => {
        try {
            await api.put(`/workouts/${workout.id}/reopen`, {});
            setSelectedWorkout(null);
            navigate('/');
        } catch (err) {
            console.error('Failed to reopen workout', err);
            alert('Failed to reopen workout');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Clock className="text-sky-400" size={32} />
                    History
                </h1>
                <p className="text-slate-400">Review your past training sessions</p>
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
                    onReopen={handleReopen}
                />
            )}
        </div>
    );
};

export default HistoryView;
