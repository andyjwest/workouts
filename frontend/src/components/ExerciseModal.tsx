import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { Exercise } from '../types';
import { api } from '../api';

interface ExerciseModalProps {
    exercise?: Exercise | null;
    onClose: () => void;
    onSave: () => void;
}

const MUSCLE_GROUPS = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
    'Quadriceps', 'Hamstrings', 'Glutes', 'Calves',
    'Abs', 'Core', 'Cardio', 'Full Body'
];

const ExerciseModal: React.FC<ExerciseModalProps> = ({ exercise, onClose, onSave }) => {
    const [name, setName] = useState(exercise?.name || '');
    const [muscleGroups, setMuscleGroups] = useState<string[]>(exercise?.muscle_group || []);

    // Defaults
    const [defaultSets, setDefaultSets] = useState(exercise?.default_sets?.toString() || '');
    const [defaultReps, setDefaultReps] = useState(exercise?.default_reps || '');
    const [defaultRest, setDefaultRest] = useState(exercise?.default_rest_seconds?.toString() || '');
    const [defaultWeightPercent, setDefaultWeightPercent] = useState(exercise?.default_weight_percent?.toString() || '');
    const [defaultTempo, setDefaultTempo] = useState(exercise?.default_tempo || '');
    const [defaultTimeSeconds, setDefaultTimeSeconds] = useState(exercise?.default_time_seconds?.toString() || '');

    // Metrics
    const [trackedMetrics, setTrackedMetrics] = useState<string[]>(
        exercise?.tracked_metrics ? exercise.tracked_metrics.split(',') : ['reps', 'weight']
    );

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleMetric = (metric: string) => {
        if (trackedMetrics.includes(metric)) {
            setTrackedMetrics(trackedMetrics.filter(m => m !== metric));
        } else {
            setTrackedMetrics([...trackedMetrics, metric]);
        }
    };

    const toggleMuscleGroup = (group: string) => {
        if (muscleGroups.includes(group)) {
            setMuscleGroups(muscleGroups.filter(g => g !== group));
        } else {
            setMuscleGroups([...muscleGroups, group]);
        }
    };

    const handleSave = async () => {
        if (!name) return;
        setIsLoading(true);
        try {
            const payload = {
                name,
                muscle_group: muscleGroups, // Note: Backend needs to handle this if it's not already
                default_sets: defaultSets ? parseInt(defaultSets) : null,
                default_reps: defaultReps || null,
                default_rest_seconds: defaultRest ? parseInt(defaultRest) : null,
                default_weight_percent: defaultWeightPercent ? parseFloat(defaultWeightPercent) : null,
                default_tempo: defaultTempo || null,
                default_time_seconds: defaultTimeSeconds ? parseInt(defaultTimeSeconds) : null,
                tracked_metrics: trackedMetrics.join(',')
            };

            if (exercise) {
                await api.put(`/exercises/${exercise.id}`, payload);
            } else {
                await api.post('/exercises/', payload);
            }
            onSave();
        } catch (err: any) {
            console.error('Failed to save exercise', err);
            setError(err.message || "Failed to save exercise");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">{exercise ? 'Edit Exercise' : 'New Exercise'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="Exercise Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Muscle Groups</label>
                        <div className="flex flex-wrap gap-2">
                            {MUSCLE_GROUPS.map(group => (
                                <button
                                    key={group}
                                    onClick={() => toggleMuscleGroup(group)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${muscleGroups.includes(group)
                                        ? 'bg-sky-500 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {group}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Default Sets</label>
                            <input
                                type="number"
                                value={defaultSets}
                                onChange={e => setDefaultSets(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Default Reps</label>
                            <input
                                type="text"
                                value={defaultReps}
                                onChange={e => setDefaultReps(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Default Rest (s)</label>
                            <input
                                type="number"
                                value={defaultRest}
                                onChange={e => setDefaultRest(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="60"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Default Weight %</label>
                            <input
                                type="number"
                                value={defaultWeightPercent}
                                onChange={e => setDefaultWeightPercent(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="75"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-400 mb-1">Default Time (s)</label>
                            <input
                                type="number"
                                value={defaultTimeSeconds}
                                onChange={e => setDefaultTimeSeconds(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="e.g. 30"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-400 mb-1">Default Tempo</label>
                            <input
                                type="text"
                                value={defaultTempo}
                                onChange={e => setDefaultTempo(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="3-0-1-0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Tracked Metrics</label>
                        <div className="flex flex-wrap gap-2">
                            {['reps', 'weight', 'distance', 'time', 'rpe', 'tempo'].map(metric => (
                                <button
                                    key={metric}
                                    onClick={() => toggleMetric(metric)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium uppercase tracking-wider transition-colors ${trackedMetrics.includes(metric)
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                        : 'bg-slate-800 text-slate-400 border border-transparent hover:border-slate-700'
                                        }`}
                                >
                                    {metric}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Exercise'} <Save size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExerciseModal;
