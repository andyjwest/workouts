import React, { useState, useEffect } from 'react';
import { Check, Trash2, History, Timer } from 'lucide-react';
import { api } from '../api';
import type { WorkoutSet } from '../types';
import clsx from 'clsx';
import TimerModal from './TimerModal';
import { useUserPreferences } from '../context/UserPreferencesContext';

interface SetLoggerProps {
    workoutExerciseId: number;
    setNumber: number;
    exerciseId: number;
    onSave: (set: WorkoutSet) => void;
    onDelete: () => void;
    initialData?: WorkoutSet;
    trackedMetrics?: string[];
}

const SetLogger: React.FC<SetLoggerProps> = ({
    workoutExerciseId,
    setNumber,
    exerciseId,
    onSave,
    onDelete,
    initialData,
    trackedMetrics = ['weight', 'reps'] // Default
}) => {
    const { convertWeight, toKg, unitLabel } = useUserPreferences();

    // Initialize weight: Convert initial KG to preferred unit for display
    const [weight, setWeight] = useState(() => {
        if (!initialData?.weight_kg) return '';
        const converted = convertWeight(initialData.weight_kg);
        return converted ? converted.toString() : '';
    });
    const [reps, setReps] = useState(initialData?.reps?.toString() || '');
    const [rpe, setRpe] = useState(initialData?.rpe?.toString() || '');
    const [tempo, setTempo] = useState(initialData?.tempo || '');
    const [duration, setDuration] = useState(initialData?.duration_seconds?.toString() || '');
    const [isSaved, setIsSaved] = useState(!!(initialData && initialData.id));
    const [isCompleted, setIsCompleted] = useState(initialData?.completed || false);
    const [history, setHistory] = useState<{ weight: number, reps: number } | null>(null);
    const [showTimer, setShowTimer] = useState(false);

    // Determine if this is a timed set
    const isTimedSet = (parseInt(duration) > 10) || trackedMetrics.includes('time');

    useEffect(() => {
        // Fetch history for auto-populate if weight is missing
        // Run only on mount to allow user to clear/edit later without aggressive auto-fill
        if (!weight && !isCompleted) {
            loadHistory();
        }
    }, []);

    // Also sync from initialData if parent updates it (e.g. auto-forwarding weight)
    useEffect(() => {
        if (initialData?.weight_kg && !weight && !isCompleted) {
            const converted = convertWeight(initialData.weight_kg);
            if (converted) setWeight(converted.toString());
        }
        if (initialData?.duration_seconds && !duration && !isCompleted) {
            setDuration(initialData.duration_seconds.toString());
        }
    }, [initialData?.weight_kg, initialData?.duration_seconds]);

    const loadHistory = async () => {
        try {
            const data = await api.get<{ weight_kg: number, reps: number }>(
                `/exercises/${exerciseId}/last_set?set_number=${setNumber}`
            );
            if (data) {
                // history data is in KG, convert for display
                const convertedWeight = convertWeight(data.weight_kg);
                const historyWeight = convertedWeight ?? data.weight_kg; // Fallback

                setHistory({ weight: historyWeight, reps: data.reps });

                // Auto-populate if empty
                if (!weight) setWeight(historyWeight.toString());
                if (!reps) setReps(data.reps.toString());
            }
        } catch (err) {
            // Ignore 404/422 for history
        }
    };

    const [hasError, setHasError] = useState(false);

    // Helper to check metrics
    const showWeight = trackedMetrics.includes('weight');
    const showReps = trackedMetrics.includes('reps');
    const showRpe = trackedMetrics.includes('rpe');
    const showTempo = trackedMetrics.includes('tempo');
    const showTime = trackedMetrics.includes('time');

    // Start Save Logic
    const handleSave = async () => {
        // Validation: require at least one metric if visible
        // Simplified validation: just check errors if field is VISIBLE
        let error = false;
        // Allow empty weight (defaults to 0)
        // if (showWeight && !weight && !isTimedSet) error = true; 
        if (showReps && !reps && !isTimedSet) error = true;
        if (showTime && !duration) error = true;

        if (error) {
            setHasError(true);
            setTimeout(() => setHasError(false), 1000);
            return;
        }

        const newCompletedState = !isCompleted;
        // Optimization: UI update immediately
        setIsCompleted(newCompletedState);

        try {
            const payload = {
                workout_exercise_id: workoutExerciseId,
                set_number: setNumber,
                // Default to 0 if weight is shown but empty. Convert DISPLAY weight to KG for saving
                weight_kg: weight ? (toKg(parseFloat(weight)) ?? 0) : (showWeight ? 0 : undefined),
                reps: reps ? parseInt(reps) : undefined,
                rpe: rpe ? parseFloat(rpe) : undefined,
                tempo: tempo || undefined,
                completed: newCompletedState,
                duration_seconds: duration ? parseInt(duration) : undefined
            };

            let savedSet: WorkoutSet;
            if (initialData?.id) {
                savedSet = await api.put<WorkoutSet>(`/workout_sets/${initialData.id}`, payload);
            } else {
                savedSet = await api.post<WorkoutSet>('/workout_sets/', payload);
            }

            setIsSaved(true);
            onSave(savedSet);
        } catch (err) {
            console.error('Failed to save set', err);
            setIsCompleted(!newCompletedState); // Revert on error
        }
    };
    // End Save Logic

    const handleTimerComplete = () => {
        // Mark as complete and save
        if (!isCompleted) {
            handleSave();
        }
    };

    return (
        <>
            <div className={clsx(
                "flex items-center gap-2 p-3 rounded-xl transition-all border",
                hasError ? "border-red-500 bg-red-500/10" :
                    isCompleted
                        ? "bg-green-500/10 border-green-500/30"
                        : isSaved
                            ? "bg-slate-900/50 border-transparent"
                            : "bg-slate-900 border-slate-800"
            )}>
                <div className={clsx("w-8 text-center font-bold flex-shrink-0", isCompleted ? "text-green-500" : "text-slate-500")}>
                    {setNumber}
                </div>

                {showWeight && (
                    <div className="flex-1 min-w-[80px]">
                        <div className="relative">
                            <input
                                type="number"
                                placeholder={unitLabel}
                                value={weight}
                                onChange={(e) => { setWeight(e.target.value); setIsSaved(false); setIsCompleted(false); setHasError(false); }}
                                className={clsx(
                                    "w-full bg-slate-950 border rounded-lg px-3 py-2 text-white text-center focus:ring-1 focus:ring-sky-500 outline-none",
                                    hasError && !weight ? "border-red-500 placeholder-red-300" :
                                        isCompleted ? "border-green-500/30 text-green-100 placeholder-green-700" : "border-slate-800"
                                )}
                            />
                            {history && !isSaved && (
                                <div className="absolute -top-5 left-0 w-full text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
                                    <History size={10} /> {history.weight}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showReps && (
                    <div className="flex-1 min-w-[80px]">
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="reps"
                                value={reps}
                                onChange={(e) => { setReps(e.target.value); setIsSaved(false); setIsCompleted(false); setHasError(false); }}
                                className={clsx(
                                    "w-full bg-slate-950 border rounded-lg px-3 py-2 text-white text-center focus:ring-1 focus:ring-sky-500 outline-none",
                                    hasError && !reps ? "border-red-500 placeholder-red-300" :
                                        isCompleted ? "border-green-500/30 text-green-100 placeholder-green-700" : "border-slate-800"
                                )}
                            />
                            {history && !isSaved && (
                                <div className="absolute -top-5 left-0 w-full text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
                                    <History size={10} /> {history.reps}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showTime && (
                    <div className="flex-1 min-w-[80px]">
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="sec"
                                value={duration}
                                onChange={(e) => { setDuration(e.target.value); setIsSaved(false); setIsCompleted(false); setHasError(false); }}
                                className={clsx(
                                    "w-full bg-slate-950 border rounded-lg px-3 py-2 text-white text-center focus:ring-1 focus:ring-sky-500 outline-none",
                                    hasError && !duration ? "border-red-500 placeholder-red-300" :
                                        isCompleted ? "border-green-500/30 text-green-100 placeholder-green-700" : "border-slate-800"
                                )}
                            />
                        </div>
                    </div>
                )}

                {showRpe && (
                    <div className="w-16 flex-shrink-0">
                        <input
                            type="number"
                            placeholder="RPE"
                            value={rpe}
                            onChange={(e) => { setRpe(e.target.value); setIsSaved(false); setIsCompleted(false); }}
                            className={clsx(
                                "w-full bg-slate-950 border rounded-lg px-2 py-2 text-white text-center text-sm focus:ring-1 focus:ring-sky-500 outline-none",
                                isCompleted ? "border-green-500/30 text-green-100 placeholder-green-700" : "border-slate-800"
                            )}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-2 ml-auto">
                    {isTimedSet && (
                        <button
                            onClick={() => setShowTimer(true)}
                            className={clsx(
                                "p-2 rounded-lg transition-colors flex items-center justify-center",
                                "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30"
                            )}
                        >
                            <Timer size={18} />
                        </button>
                    )}

                    <button
                        onClick={handleSave}
                        className={clsx(
                            "p-2 rounded-lg transition-colors min-w-[40px] flex items-center justify-center",
                            hasError ? "bg-red-500 text-white animate-pulse" :
                                isCompleted
                                    ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                                    : isSaved
                                        ? "text-green-500 bg-green-500/10 hover:bg-green-500/20"
                                        : "bg-sky-500 text-white hover:bg-sky-600"
                        )}
                    >
                        <Check size={18} strokeWidth={isCompleted ? 3 : 2} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {showTempo && !isCompleted && !isTimedSet && (
                <div className="mt-1 pl-12 flex items-center gap-2">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Tempo</span>
                    <input
                        type="text"
                        placeholder="3-0-1-0"
                        value={tempo}
                        onChange={(e) => { setTempo(e.target.value); setIsSaved(false); }}
                        className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none max-w-[100px]"
                    />
                </div>
            )}

            <TimerModal
                isOpen={showTimer}
                onClose={() => setShowTimer(false)}
                initialSeconds={duration ? parseInt(duration) : 0}
                onComplete={handleTimerComplete}
            />
        </>
    );
};

export default SetLogger;
