import React, { useState } from 'react';
import { api } from './api';
import type { Workout, WorkoutExercise, Exercise } from './types';
import ExerciseCard from './components/ExerciseCard';
import RestTimer from './components/RestTimer';
import { ChevronLeft, ChevronRight, Play, CheckCircle2, ChevronDown, Save, Plus } from 'lucide-react';
import clsx from 'clsx';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AddExerciseModal from './components/AddExerciseModal';

const InGymView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);

    const currentExerciseIndexParam = parseInt(searchParams.get('exercise') || '0');
    let currentExerciseIndex = isNaN(currentExerciseIndexParam) ? 0 : currentExerciseIndexParam;

    // Bounds check
    if (activeWorkout?.exercises) {
        if (currentExerciseIndex < 0) currentExerciseIndex = 0;
        if (currentExerciseIndex >= activeWorkout.exercises.length) {
            currentExerciseIndex = Math.max(0, activeWorkout.exercises.length - 1);
        }
    }

    const setCurrentExerciseIndex = (value: number | ((prev: number) => number)) => {
        const currentVal = parseInt(searchParams.get('exercise') || '0') || 0;

        let newValue: number;
        if (typeof value === 'function') {
            newValue = value(currentVal);
        } else {
            newValue = value;
        }

        const newParams = new URLSearchParams(searchParams);
        newParams.set('exercise', newValue.toString());
        setSearchParams(newParams, { replace: true });
    };

    const [isLoading, setIsLoading] = useState(false);

    const [suggestedWorkout, setSuggestedWorkout] = useState<any | null>(null);
    const [routineSchedule, setRoutineSchedule] = useState<any[]>([]); // Use any[] for now or RoutineDayResponse[] if imported
    const [showMobileList, setShowMobileList] = useState(false);
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [swapTargetId, setSwapTargetId] = useState<number | null>(null);
    const [searchFilter, setSearchFilter] = useState('');

    // Load active workout on mount (if any)
    React.useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                if (id) {
                    // Edit Mode: Load specific workout
                    const workout = await api.get<Workout>(`/workouts/${id}`);
                    setActiveWorkout(workout);
                } else {
                    // Normal Mode: Check for active (unfinished) workout
                    const active = await api.get<Workout | null>('/workouts/active');
                    if (active) {
                        setActiveWorkout(active);

                        // Check if we have an explicit exercise index in URL
                        const hasExplicitIndex = searchParams.has('exercise');

                        if (!hasExplicitIndex && active.exercises) {
                            // Find first incomplete exercise to jump to
                            const firstIncompleteIdx = active.exercises.findIndex(ex =>
                                !ex.sets || !ex.sets.every(s => s.completed)
                            );
                            if (firstIncompleteIdx !== -1) {
                                setCurrentExerciseIndex(firstIncompleteIdx);
                            }
                        }
                    } else {
                        // If no active workout, load suggestion and schedule
                        const [suggestion, schedule] = await Promise.all([
                            api.get<any>('/workouts/suggested'),
                            api.get<any[]>('/routines/active/schedule')
                        ]);
                        setSuggestedWorkout(suggestion);
                        setRoutineSchedule(schedule || []);
                    }
                }
            } catch (err) {
                console.log("Error initializing workout view", err);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [id]);

    // Helper to start a routine day
    const startRoutineDay = async (dayData: any) => {
        if (!dayData) return;
        setIsLoading(true);
        try {
            // Create a new workout
            const date = new Date().toISOString().split('T')[0];
            const time = new Date().toTimeString().split(' ')[0];

            const workout = await api.post<Workout>('/workouts/', {
                user_id: 1,
                date: date,
                start_time: time,
                notes: `Routine: ${dayData.routine_name || 'Active Routine'} - ${dayData.day_name || dayData.name}`
            });

            const workoutExercises: WorkoutExercise[] = [];

            for (let i = 0; i < dayData.exercises.length; i++) {
                const ex = dayData.exercises[i];
                const we = await api.post<WorkoutExercise>('/workout_exercises/', {
                    workout_id: workout.id,
                    exercise_id: ex.id,
                    sequence: i + 1
                });

                const fullEx = await api.get<Exercise>(`/exercises/${ex.id}`);
                we.exercise = fullEx;

                const sets: any[] = [];
                const numSets = ex.suggested_sets || fullEx.default_sets || 0;

                if (numSets > 0) {
                    for (let s = 1; s <= numSets; s++) {
                        const newSet = await api.post('/workout_sets/', {
                            workout_exercise_id: we.id,
                            set_number: s,
                            reps: ex.suggested_reps ? parseInt(ex.suggested_reps) : (fullEx.default_reps ? parseInt(fullEx.default_reps) : null),
                            duration_seconds: ex.suggested_time_seconds || fullEx.default_time_seconds || null,
                            tempo: ex.tempo || fullEx.default_tempo,
                            completed: false
                        });
                        sets.push(newSet);
                    }
                }

                we.sets = sets;
                workoutExercises.push(we);
            }

            workout.exercises = workoutExercises;
            setActiveWorkout(workout);

        } catch (err) {
            console.error("Failed to start routine workout", err);
        } finally {
            setIsLoading(false);
        }
    };

    const startWorkout = async () => {
        setIsLoading(true);
        try {
            // Create a new workout
            const date = new Date().toISOString().split('T')[0];
            const time = new Date().toTimeString().split(' ')[0];

            const workout = await api.post<Workout>('/workouts/', {
                user_id: 1,
                date: date,
                start_time: time,
                notes: 'Quick Workout'
            });

            const exercises = await api.get<Exercise[]>('/exercises/');
            const initialExercises = exercises.slice(0, 3);
            const workoutExercises: WorkoutExercise[] = [];

            for (let i = 0; i < initialExercises.length; i++) {
                const we = await api.post<WorkoutExercise>('/workout_exercises/', {
                    workout_id: workout.id,
                    exercise_id: initialExercises[i].id,
                    sequence: i + 1
                });
                we.exercise = initialExercises[i];
                we.sets = [];
                workoutExercises.push(we);
            }

            workout.exercises = workoutExercises;
            setActiveWorkout(workout);

        } catch (err) {
            console.error("Failed to start workout", err);
        } finally {
            setIsLoading(false);
        }
    };

    const finishWorkout = async () => {
        if (!activeWorkout) return;

        if (id) {
            // Edit Mode: Should we do anything specific?
            // Maybe just navigate back to history?
            navigate('/history');
            return;
        }

        try {
            await api.put(`/workouts/${activeWorkout.id}/finish`, {});
            setActiveWorkout(null);
            setCurrentExerciseIndex(0);
            // Reload suggestion for next time
            const suggestion = await api.get<any>('/workouts/suggested');
            setSuggestedWorkout(suggestion);
        } catch (err) {
            console.error("Failed to finish workout", err);
        }
    };

    if (!activeWorkout) {
        return (
            <div className="h-full w-full overflow-y-auto">
                <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-center max-w-2xl mx-auto w-full">

                    {suggestedWorkout ? (
                        <div className="w-full bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 p-8 rounded-3xl mb-8 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500"></div>
                            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-1">Up Next</h2>
                            <h3 className="text-3xl font-extrabold text-white mb-2">{suggestedWorkout.routine_name}</h3>
                            <div className="text-xl text-indigo-200 mb-6 font-medium">{suggestedWorkout.day_name}</div>

                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                {suggestedWorkout.exercises.slice(0, 5).map((ex: any) => (
                                    <span key={ex.id} className="text-xs bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
                                        {ex.name}
                                    </span>
                                ))}
                                {suggestedWorkout.exercises.length > 5 && (
                                    <span className="text-xs bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
                                        +{suggestedWorkout.exercises.length - 5} more
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => startRoutineDay(suggestedWorkout)}
                                disabled={isLoading}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                <Play size={24} fill="currentColor" /> Start Workout
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-900 p-8 rounded-full mb-6 ring-4 ring-slate-800">
                            <Play size={48} className="text-sky-500 ml-2" />
                        </div>
                    )}

                    {/* Start Empty Workout Button - Moved up */}
                    <button
                        onClick={startWorkout}
                        disabled={isLoading}
                        className="w-full max-w-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-6 rounded-xl transition-all border border-slate-700 mb-8"
                    >
                        {isLoading ? 'Starting...' : 'Start Empty Workout'}
                    </button>

                    {/* Other Schedule Options */}
                    {routineSchedule.length > 0 && (
                        <div className="w-full max-w-2xl mb-8">
                            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-3 pl-1">Other Workouts</h3>
                            <div className="flex flex-col gap-4">
                                {routineSchedule
                                    .filter(day => !suggestedWorkout || day.name !== suggestedWorkout.day_name) // Filter active one if needed
                                    .map((day) => (
                                        <button
                                            key={day.id}
                                            onClick={() => startRoutineDay(day)}
                                            className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 p-4 rounded-xl text-left transition-all group"
                                        >
                                            <div className="text-slate-200 font-bold mb-1 truncate">{day.name}</div>
                                            <div className="text-xs text-slate-500 mb-3">{day.exercises.length} Exercises</div>
                                            <div className="flex -space-x-1.5 overflow-hidden">
                                                {day.exercises.slice(0, 3).map((ex: any) => (
                                                    <div key={ex.id} className="w-5 h-5 rounded-full bg-slate-700 border border-slate-800 flex items-center justify-center text-[8px] text-slate-300">
                                                        {ex.name[0]}
                                                    </div>
                                                ))}
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}

                    {!suggestedWorkout && (
                        <>
                            <h1 className="text-3xl font-bold text-white mb-2">Ready to Train?</h1>
                            <p className="text-slate-400 mb-8 max-w-md">
                                Select a routine from the Management view or start a quick workout right here.
                            </p>
                        </>
                    )}

                </div>
            </div>
        );
    }

    const handleExerciseUpdate = (updatedExercise: WorkoutExercise) => {
        if (!activeWorkout) return;

        const newExercises = activeWorkout.exercises?.map(ex =>
            ex.id === updatedExercise.id ? updatedExercise : ex
        );

        setActiveWorkout({ ...activeWorkout, exercises: newExercises });

        // Auto-advance if this exercise is now complete and it's the current one
        const isCurrentExercise = activeWorkout.exercises?.[currentExerciseIndex]?.id === updatedExercise.id;
        if (isCurrentExercise) {
            const allSetsComplete = updatedExercise.sets?.every(s => s.completed);
            const hasSets = updatedExercise.sets && updatedExercise.sets.length > 0;
            const isNotLast = currentExerciseIndex < (activeWorkout.exercises?.length || 0) - 1;

            if (allSetsComplete && hasSets && isNotLast) {
                // Small delay for better UX so the user sees the checkmark
                setTimeout(() => {
                    setCurrentExerciseIndex(prev => prev + 1);
                }, 500);
            }
        }
    };

    const isExerciseComplete = (ex: WorkoutExercise) => {
        return ex.sets && ex.sets.length > 0 && ex.sets.every(s => s.completed);
    };


    const handleDeleteExercise = async (workoutExerciseId: number) => {
        if (!activeWorkout || !confirm("Are you sure? This will delete the exercise and its sets.")) return;
        setIsLoading(true);
        try {
            await api.delete(`/workout_exercises/${workoutExerciseId}`);
            const newExercises = activeWorkout.exercises!.filter(e => e.id !== workoutExerciseId);
            setActiveWorkout({ ...activeWorkout, exercises: newExercises });

            // Adjust index if needed
            if (currentExerciseIndex >= newExercises.length) {
                setCurrentExerciseIndex(Math.max(0, newExercises.length - 1));
            }
        } catch (err) {
            console.error("Failed to delete exercise", err);
        } finally {
            setIsLoading(false);
        }
    };

    const startSwap = (workoutExercise: WorkoutExercise) => {
        setSwapTargetId(workoutExercise.id!);
        // Use the first muscle group as a filter helper
        const filter = workoutExercise.exercise?.muscle_group?.[0] || '';
        setSearchFilter(filter);
        setShowAddExercise(true);
    };

    const openAddExercise = () => {
        setSwapTargetId(null);
        setSearchFilter('');
        setShowAddExercise(true);
    };

    const handleAddOrSwapExercise = async (exercise: Exercise) => {
        if (!activeWorkout) return;
        setIsLoading(true);
        try {
            if (swapTargetId) {
                // Swap Logic
                const target = activeWorkout.exercises?.find(e => e.id === swapTargetId);
                if (!target) return;

                const updated = await api.put<WorkoutExercise>(`/workout_exercises/${swapTargetId}`, {
                    workout_id: activeWorkout.id,
                    exercise_id: exercise.id,
                    sequence: target.sequence,
                });

                // Construct new object preserving sets
                const newEx: WorkoutExercise = {
                    ...updated,
                    exercise: exercise,
                    sets: target.sets,
                };

                const newExercises = activeWorkout.exercises!.map(e => e.id === swapTargetId ? newEx : e);
                setActiveWorkout({ ...activeWorkout, exercises: newExercises });
            } else {
                // Add Logic
                // Calculate next sequence
                const currentMaxSequence = activeWorkout.exercises && activeWorkout.exercises.length > 0
                    ? Math.max(...activeWorkout.exercises.map(e => e.sequence))
                    : 0;

                const we = await api.post<WorkoutExercise>('/workout_exercises/', {
                    workout_id: activeWorkout.id,
                    exercise_id: exercise.id,
                    sequence: currentMaxSequence + 1
                });

                // Populate the full exercise object for display
                we.exercise = exercise;
                we.sets = []; // Start with no sets

                const newExercises = [...(activeWorkout.exercises || []), we];
                setActiveWorkout({ ...activeWorkout, exercises: newExercises });

                // Switch to the new exercise
                setCurrentExerciseIndex(newExercises.length - 1);
            }

            // Cleanup
            setSwapTargetId(null);
            setShowAddExercise(false);
            setShowMobileList(false);

        } catch (err) {
            console.error("Failed to add/swap exercise", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReorderExercise = async (direction: 'up' | 'down') => {
        if (!activeWorkout || !activeWorkout.exercises) return;

        const currentIndex = currentExerciseIndex;
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        // Bounds check
        if (newIndex < 0 || newIndex >= activeWorkout.exercises.length) return;

        setIsLoading(true);
        try {
            // Create a copy of the exercises array
            const exercises = [...activeWorkout.exercises];

            // Swap in local state
            const temp = exercises[currentIndex];
            exercises[currentIndex] = exercises[newIndex];
            exercises[newIndex] = temp;

            // Update sequence numbers locally
            exercises.forEach((ex, idx) => {
                ex.sequence = idx + 1;
            });

            // Optimistic update
            setActiveWorkout({ ...activeWorkout, exercises });
            setCurrentExerciseIndex(newIndex);

            // Send new order to backend
            const reorderIds = exercises.map(ex => ex.id!);
            await api.post(`/workouts/${activeWorkout.id}/reorder`, { workout_exercise_ids: reorderIds });

        } catch (err) {
            console.error("Failed to reorder exercises", err);
            // Revert state if needed? For now we just log error.
        } finally {
            setIsLoading(false);
        }
    };

    const currentExercise = activeWorkout.exercises?.[currentExerciseIndex];
    const isCurrentComplete = currentExercise ? isExerciseComplete(currentExercise) : false;

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto p-4 lg:p-6 relative">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white">{id ? 'Editing Workout' : 'Active Workout'}</h1>
                    <span className="text-sm text-slate-400 lg:hidden">
                        {currentExerciseIndex + 1} of {activeWorkout.exercises?.length} Exercises
                    </span>
                </div>
                <RestTimer />
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Desktop Sidebar: Exercise List */}
                <div className="hidden lg:flex flex-col w-1/3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 font-bold text-slate-300">
                        Workout Plan
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {activeWorkout.exercises?.map((ex, idx) => {
                            const isComplete = isExerciseComplete(ex);
                            return (
                                <button
                                    key={ex.id}
                                    onClick={() => setCurrentExerciseIndex(idx)}
                                    className={clsx(
                                        "w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group",
                                        idx === currentExerciseIndex
                                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
                                    )}
                                >
                                    <span className={clsx("font-medium truncate", isComplete && idx !== currentExerciseIndex && "text-slate-500")}>{ex.exercise?.name}</span>
                                    {isComplete && <CheckCircle2 size={16} className="text-green-500" />}
                                </button>
                            );
                        })}
                        <button
                            onClick={openAddExercise}
                            className="w-full text-left p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-sky-400 border border-transparent border-dashed hover:border-slate-700 transition-all flex items-center gap-2 group mt-2"
                        >
                            <div className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-sky-500/10 flex items-center justify-center transition-colors">
                                <Plus size={14} />
                            </div>
                            <span className="font-medium">Add Exercise</span>
                        </button>
                    </div>
                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={finishWorkout}
                            className={clsx(
                                "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors",
                                id
                                    ? "bg-sky-500 hover:bg-sky-600 text-white"
                                    : "bg-green-500 hover:bg-green-600 text-white"
                            )}
                        >
                            {id ? (
                                <>Save & Close <Save size={20} /></>
                            ) : (
                                <>Finish Workout <CheckCircle2 size={20} /></>
                            )}
                        </button>
                        {!id && (
                            <button
                                onClick={async () => {
                                    if (!activeWorkout) return;
                                    if (confirm("Are you sure you want to discard this workout? This cannot be undone.")) {
                                        try {
                                            await api.delete(`/workouts/${activeWorkout.id}`);
                                            setActiveWorkout(null);
                                            setCurrentExerciseIndex(0);
                                            // Reload suggestion
                                            const suggestion = await api.get<any>('/workouts/suggested');
                                            setSuggestedWorkout(suggestion);
                                        } catch (err) {
                                            console.error("Failed to discard workout", err);
                                        }
                                    }
                                }}
                                className="w-full mt-3 py-3 text-red-500 hover:text-red-400 hover:bg-slate-800 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                            >
                                Discard Workout
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Area (Card) */}
                <div className="flex-1 flex flex-col relative min-h-0">
                    <div className="flex-1 relative mb-6 lg:mb-0 min-h-0">
                        {currentExercise && currentExercise.exercise ? (
                            <ExerciseCard
                                key={currentExercise.id}
                                workoutExercise={currentExercise}
                                exercise={currentExercise.exercise}
                                onUpdate={handleExerciseUpdate}
                                onDelete={() => handleDeleteExercise(currentExercise.id!)}
                                onSwap={() => startSwap(currentExercise)}
                                onMoveUp={currentExerciseIndex > 0 ? () => handleReorderExercise('up') : undefined}
                                onMoveDown={currentExerciseIndex < (activeWorkout.exercises?.length || 0) - 1 ? () => handleReorderExercise('down') : undefined}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                Error loading exercise
                            </div>
                        )}
                    </div>

                    {/* Mobile Navigation Bar */}
                    <div className="lg:hidden bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center justify-between shadow-xl mt-auto z-10 shrink-0 relative">
                        <button
                            onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentExerciseIndex === 0}
                            className="p-4 rounded-xl hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <button
                            onClick={() => setShowMobileList(!showMobileList)}
                            className={clsx(
                                "p-3 rounded-xl transition-colors flex flex-col items-center gap-1",
                                showMobileList ? "text-sky-400 bg-sky-500/10" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <div className="flex gap-1">
                                {activeWorkout.exercises?.slice(0, 3).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={clsx(
                                            "w-1.5 h-1.5 rounded-full transition-colors",
                                            idx === Math.min(2, currentExerciseIndex) ? "bg-sky-500" : "bg-slate-600"
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">List</span>
                        </button>

                        {currentExerciseIndex === (activeWorkout.exercises?.length || 0) - 1 ? (
                            <button
                                onClick={finishWorkout}
                                className={clsx(
                                    "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all",
                                    isCurrentComplete
                                        ? "bg-green-500 hover:bg-green-600 text-white animate-pulse"
                                        : "bg-slate-800 text-slate-400"
                                )}
                            >
                                {id ? <Save size={20} /> : <CheckCircle2 size={20} />}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentExerciseIndex(prev => {
                                    const maxIndex = (activeWorkout.exercises?.length || 0) - 1;
                                    return Math.min(maxIndex, prev + 1);
                                })}
                                className={clsx(
                                    "p-4 rounded-xl transition-all",
                                    isCurrentComplete
                                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                        : "hover:bg-slate-800 text-white"
                                )}
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile List Drawer Overlay */}
            {
                showMobileList && (
                    <div className="fixed inset-0 z-50 lg:hidden flex flex-col">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowMobileList(false)}></div>
                        <div className="absolute bottom-0 left-0 w-full max-h-[80vh] bg-slate-900 rounded-t-3xl flex flex-col shadow-2xl border-t border-slate-800 animate-in slide-in-from-bottom duration-200">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-3xl">
                                <h3 className="font-bold text-white text-lg">Workout Plan</h3>
                                <button onClick={() => setShowMobileList(false)} className="p-2 text-slate-400 hover:text-white">
                                    <ChevronDown size={24} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {activeWorkout.exercises?.map((ex, idx) => {
                                    const isComplete = isExerciseComplete(ex);
                                    return (
                                        <button
                                            key={ex.id}
                                            onClick={() => { setCurrentExerciseIndex(idx); setShowMobileList(false); }}
                                            className={clsx(
                                                "w-full text-left p-4 rounded-xl transition-all flex items-center justify-between",
                                                idx === currentExerciseIndex
                                                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                                    : "bg-slate-950 text-slate-300 border border-slate-800"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={clsx(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                    idx === currentExerciseIndex ? "bg-sky-500 text-white" : "bg-slate-800 text-slate-500"
                                                )}>{idx + 1}</span>
                                                <span className={clsx("font-medium", isComplete && idx !== currentExerciseIndex && "text-slate-500")}>{ex.exercise?.name}</span>
                                            </div>
                                            {isComplete && <CheckCircle2 size={18} className="text-green-500" />}
                                        </button>
                                    );
                                })}
                                <div className="pt-2 pb-4">
                                    <button
                                        onClick={openAddExercise}
                                        className="w-full py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-slate-500 transition-all"
                                    >
                                        <Plus size={20} /> Add Exercise
                                    </button>
                                </div>
                                <div className="pt-0">
                                    <button
                                        onClick={finishWorkout}
                                        className={clsx(
                                            "w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-700",
                                            id && "bg-sky-600 hover:bg-sky-500 text-white"
                                        )}
                                    >
                                        {id ? "Save & Close" : "Finish Workout"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Add Exercise Modal */}
            {
                showAddExercise && (
                    <AddExerciseModal
                        onClose={() => setShowAddExercise(false)}
                        onSelect={handleAddOrSwapExercise}
                        initialSearchTerm={searchFilter}
                    />
                )
            }
        </div >
    );
};

export default InGymView;
