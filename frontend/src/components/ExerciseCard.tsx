import React, { useState } from 'react';
import type { Exercise, WorkoutExercise, WorkoutSet } from '../types';
import SetLogger from './SetLogger';
import { Plus, MoreVertical, Trash2, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../api';

interface ExerciseCardProps {
    workoutExercise: WorkoutExercise;
    exercise: Exercise;
    onUpdate?: (updatedExercise: WorkoutExercise) => void;
    onDelete?: () => void;
    onSwap?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
}

// Internal type to track sets with a stable local ID
type LocalSet = WorkoutSet & { _localId: string };

const ExerciseCard: React.FC<ExerciseCardProps> = ({ workoutExercise, exercise, onUpdate, onDelete, onSwap, onMoveUp, onMoveDown }) => {
    // Initialize sets with unique local IDs
    const [sets, setSets] = useState<LocalSet[]>(() => {
        return (workoutExercise.sets || []).map(s => ({
            ...s,
            _localId: crypto.randomUUID()
        }));
    });

    // Check for external updates to sets (e.g. initial load or reset)
    // If the props change significantly (e.g. completely new array from backend not initiated by us), we might need to sync.
    // However, for now, we rely on local state being the driver during editing.
    // BUT: if we swap exercise, we want to preserve sets but maybe re-init?
    // Actually, when key={workoutExercise.id} changes (which happens on swap if ID changes), this component remounts, so init runs again.
    // If ID stays same (e.g. just updating data), we don't want to reset local state.

    const [showMenu, setShowMenu] = useState(false);

    const updateParent = (newSets: LocalSet[]) => {
        if (onUpdate) {
            // Strip _localId before sending up
            const cleanSets = newSets.map(({ _localId, ...rest }) => rest);
            onUpdate({
                ...workoutExercise,
                sets: cleanSets
            });
        }
    };

    const addSet = () => {
        const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;

        // Optimistically add a new set
        const newSet: LocalSet = {
            id: 0, // Temp ID
            workout_exercise_id: workoutExercise.id,
            set_number: sets.length + 1,
            // Inherit properties for continuity
            weight_kg: lastSet?.weight_kg,
            reps: lastSet?.reps,
            duration_seconds: lastSet?.duration_seconds,
            tempo: lastSet?.tempo,
            _localId: crypto.randomUUID()
        };
        const newSets = [...sets, newSet];
        setSets(newSets);
        updateParent(newSets);
    };

    const handleSetSave = (savedSet: WorkoutSet) => {
        // Find which local set this corresponds to by set_number (which we trust for the row being edited)
        // Better: we pass the _localId to the logger and get it back?
        // But SetLogger doesn't know about _localId.
        // It's okay, we can map by set_number since that is stable during the save operation of a single row.

        // Wait, if we delete a row above while this one is saving... set_number might have shifted?
        // But SetLogger knows its *own* setNumber? No, it receives it as prop.
        // If re-render happens, setNumber prop updates.

        const newSets = sets.map(s => {
            if (s.set_number === savedSet.set_number) {
                return { ...savedSet, _localId: s._localId };
            }
            return s;
        });

        // Auto-forward weight to next set if it's empty
        const currentIndex = sets.findIndex(s => s.set_number === savedSet.set_number);
        if (currentIndex !== -1 && currentIndex < sets.length - 1) {
            const nextSet = newSets[currentIndex + 1];
            if (!nextSet.weight_kg && savedSet.weight_kg) {
                newSets[currentIndex + 1] = {
                    ...nextSet,
                    weight_kg: savedSet.weight_kg
                };
            }
        }

        setSets(newSets);
        updateParent(newSets);
    };

    const handleSetDelete = async (index: number) => {
        // Use the index from the map iterator
        const setToDelete = sets[index];
        if (setToDelete.id !== 0) {
            try {
                await api.delete(`/workout_sets/${setToDelete.id}`);
            } catch (err) {
                console.error("Failed to delete set", err);
                return;
            }
        }

        // Remove and re-number
        const newSets = sets
            .filter((_, i) => i !== index)
            .map((s, i) => ({ ...s, set_number: i + 1 }));

        setSets(newSets);
        updateParent(newSets);
    };

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-5 bg-slate-900 border-b border-slate-800 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{exercise.name}</h2>
                    <div className="flex gap-2">
                        <span className="text-sm text-sky-400 font-medium">{exercise.group_name || 'Main Lift'}</span>
                        {exercise.muscle_group?.map(m => (
                            <span key={m} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{m}</span>
                        ))}
                    </div>
                </div>
                <div className="relative">
                    <button
                        className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreVertical size={20} />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden py-1 ring-1 ring-black/50">
                                {onMoveUp && (
                                    <button
                                        onClick={() => { setShowMenu(false); onMoveUp(); }}
                                        className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors"
                                    >
                                        <ArrowUp size={16} className="text-sky-400" /> Move Up
                                    </button>
                                )}
                                {onMoveDown && (
                                    <button
                                        onClick={() => { setShowMenu(false); onMoveDown(); }}
                                        className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors border-b border-slate-800"
                                    >
                                        <ArrowDown size={16} className="text-sky-400" /> Move Down
                                    </button>
                                )}
                                <button
                                    onClick={() => { setShowMenu(false); onSwap?.(); }}
                                    className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors"
                                >
                                    <RefreshCw size={16} /> Swap Exercise
                                </button>
                                <button
                                    onClick={() => { setShowMenu(false); onDelete?.(); }}
                                    className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-500/10 hover:text-red-400 flex items-center gap-3 transition-colors"
                                >
                                    <Trash2 size={16} /> Delete Exercise
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Sets List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sets.map((set, index) => (
                    <SetLogger
                        key={set._localId}
                        workoutExerciseId={workoutExercise.id}
                        exerciseId={exercise.id}
                        setNumber={index + 1}
                        initialData={set}
                        trackedMetrics={exercise.tracked_metrics ? exercise.tracked_metrics.split(',') : undefined}
                        onSave={handleSetSave}
                        onDelete={() => handleSetDelete(index)}
                    />
                ))}

                <button
                    onClick={addSet}
                    className="w-full py-4 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-sky-400 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all flex items-center justify-center gap-2 font-bold"
                >
                    <Plus size={20} />
                    Add Set
                </button>
            </div>

            {/* Footer / Notes */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
                <textarea
                    placeholder="Exercise notes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-sky-500/50 transition-colors resize-none h-20"
                />
            </div>
        </div>
    );
};

export default ExerciseCard;
