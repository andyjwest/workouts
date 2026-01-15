import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { Exercise } from '../types';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
    exercise: Exercise;
    allExercises: Exercise[];
    isOpen: boolean;
    onClose: () => void;
    onDeleteSuccess: () => void;
}

interface UsageStats {
    workout_count: number;
    routine_count: number;
}

const ExerciseDeleteModal: React.FC<Props> = ({ exercise, allExercises, isOpen, onClose, onDeleteSuccess }) => {
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [strategy, setStrategy] = useState<'delete_all' | 'migrate_to_existing' | 'migrate_to_new'>('delete_all');
    const [targetId, setTargetId] = useState<number | ''>('');
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (isOpen && exercise) {
            checkUsage();
            // Reset form
            setStrategy('delete_all');
            setTargetId('');
            setNewName('');
            setError(null);
        }
    }, [isOpen, exercise]);

    const checkUsage = async () => {
        setLoading(true);
        try {
            const stats = await api.get<UsageStats>(`/exercises/${exercise.id}/usage`);
            setUsage(stats);
            // Default to 'migrate_to_existing' if there is usage, safer default
            if (stats.workout_count > 0 || stats.routine_count > 0) {
                setStrategy('migrate_to_existing');
            }
        } catch (err) {
            setError('Failed to load usage data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            await api.post(`/exercises/${exercise.id}/delete`, {
                strategy,
                target_exercise_id: strategy === 'migrate_to_existing' ? Number(targetId) : undefined,
                new_exercise_name: strategy === 'migrate_to_new' ? newName : undefined
            });
            onDeleteSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Delete failed');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const hasUsage = usage && (usage.workout_count > 0 || usage.routine_count > 0);
    const valid =
        (strategy === 'delete_all') ||
        (strategy === 'migrate_to_existing' && targetId !== '') ||
        (strategy === 'migrate_to_new' && newName.trim() !== '');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Trash2 className="text-red-500" />
                    Delete {exercise.name}
                </h3>

                {loading && !usage && <p className="text-slate-400">Checking usage...</p>}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {usage && !loading && (
                    <div className="space-y-4">
                        {hasUsage ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-4 rounded-lg flex gap-3 items-start">
                                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                                <div className="text-sm">
                                    <p className="font-bold mb-1">Warning: Exercise in use</p>
                                    <p>Used in <strong className="text-white">{usage.workout_count}</strong> workouts and <strong className="text-white">{usage.routine_count}</strong> routines.</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-300">Are you sure you want to delete this exercise? This action cannot be undone.</p>
                        )}

                        {hasUsage && (
                            <div className="space-y-3 mt-4">
                                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors">
                                    <input
                                        type="radio"
                                        name="strategy"
                                        value="migrate_to_existing"
                                        checked={strategy === 'migrate_to_existing'}
                                        onChange={() => setStrategy('migrate_to_existing')}
                                        className="text-sky-500 focus:ring-sky-500 bg-slate-700 border-slate-600"
                                    />
                                    <div>
                                        <div className="text-white font-medium">Merge into Existing</div>
                                        <div className="text-xs text-slate-400">Migrate history to another exercise</div>
                                    </div>
                                </label>

                                {strategy === 'migrate_to_existing' && (
                                    <select
                                        value={targetId}
                                        onChange={(e) => setTargetId(Number(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none ml-8 mb-2"
                                        style={{ width: 'calc(100% - 2rem)' }}
                                    >
                                        <option value="">Select target exercise...</option>
                                        {allExercises
                                            .filter(e => e.id !== exercise.id)
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(e => (
                                                <option key={e.id} value={e.id}>{e.name}</option>
                                            ))
                                        }
                                    </select>
                                )}

                                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors">
                                    <input
                                        type="radio"
                                        name="strategy"
                                        value="migrate_to_new"
                                        checked={strategy === 'migrate_to_new'}
                                        onChange={() => setStrategy('migrate_to_new')}
                                        className="text-sky-500 focus:ring-sky-500 bg-slate-700 border-slate-600"
                                    />
                                    <div>
                                        <div className="text-white font-medium">Rename / Move to New</div>
                                        <div className="text-xs text-slate-400">Create new exercise with history</div>
                                    </div>
                                </label>

                                {strategy === 'migrate_to_new' && (
                                    <input
                                        type="text"
                                        placeholder="New exercise name"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none ml-8 mb-2"
                                        style={{ width: 'calc(100% - 2rem)' }}
                                    />
                                )}

                                <label className="flex items-center gap-3 p-3 rounded-lg border border-red-900/30 bg-red-900/10 cursor-pointer hover:bg-red-900/20 transition-colors">
                                    <input
                                        type="radio"
                                        name="strategy"
                                        value="delete_all"
                                        checked={strategy === 'delete_all'}
                                        onChange={() => setStrategy('delete_all')}
                                        className="text-red-500 focus:ring-red-500 bg-slate-700 border-slate-600"
                                    />
                                    <div>
                                        <div className="text-red-400 font-medium">Delete History</div>
                                        <div className="text-xs text-red-400/70">Permanently remove all records</div>
                                    </div>
                                </label>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={!valid || loading}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${strategy === 'delete_all'
                                        ? 'bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                        : 'bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                            >
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExerciseDeleteModal;
