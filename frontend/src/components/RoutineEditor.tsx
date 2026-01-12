import React, { useState, useEffect } from 'react';
import type { Routine, RoutineDay, RoutineExercise, Exercise } from '../types';
import { api } from '../api';
import { X, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import Autocomplete from './Autocomplete';
import clsx from 'clsx';

interface RoutineEditorProps {
    routine: Routine | null;
    onClose: () => void;
    onSave: () => void;
}

const RoutineEditor: React.FC<RoutineEditorProps> = ({ routine, onClose, onSave }) => {
    const [name, setName] = useState(routine?.name || '');
    const [description, setDescription] = useState(routine?.description || '');
    const [days, setDays] = useState<RoutineDay[]>(routine?.days || []);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        try {
            const data = await api.get<Exercise[]>('/exercises/');
            setExercises(data);
        } catch (err) {
            console.error('Failed to load exercises', err);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const payload = {
                user_id: routine?.user_id || 1,
                name,
                description,
                days: days.map((day, index) => ({
                    ...day,
                    day_number: index + 1, // Ensure sequence
                    exercises: (day.exercises || []).map((ex, exIndex) => ({
                        ...ex,
                        sequence: exIndex + 1
                    }))
                }))
            };

            if (routine) {
                await api.put(`/routines/${routine.id}`, payload);
            } else {
                await api.post('/routines/', payload);
            }
            onSave();
        } catch (err) {
            console.error('Failed to save routine', err);
        } finally {
            setIsLoading(false);
        }
    };

    const addDay = () => {
        setDays([...days, {
            id: Date.now(),
            routine_id: routine?.id || 0,
            day_number: days.length + 1,
            name: `Day ${days.length + 1}`,
            exercises: []
        }]);
    };

    const removeDay = (index: number) => {
        const newDays = [...days];
        newDays.splice(index, 1);
        setDays(newDays);
    };

    const updateDayName = (index: number, name: string) => {
        const newDays = [...days];
        newDays[index].name = name;
        setDays(newDays);
    };

    const addExerciseToDay = (dayIndex: number) => {
        const newDays = [...days];
        if (!newDays[dayIndex].exercises) {
            newDays[dayIndex].exercises = [];
        }
        const defaultExercise = exercises[0];
        newDays[dayIndex].exercises!.push({
            id: Date.now(), // Temp ID
            routine_day_id: newDays[dayIndex].id,
            exercise_id: defaultExercise?.id || 0,
            sequence: (newDays[dayIndex].exercises?.length || 0) + 1,
            suggested_sets: defaultExercise?.default_sets || 3,
            suggested_reps: defaultExercise?.default_reps || "10",
            suggested_weight_percent: defaultExercise?.default_weight_percent,
            rest_period_seconds: defaultExercise?.default_rest_seconds || 60,
            tempo: defaultExercise?.default_tempo || "2-0-2-0",
            suggested_time_seconds: defaultExercise?.default_time_seconds
        } as RoutineExercise);
        setDays(newDays);
    };

    const updateExercise = (dayIndex: number, exIndex: number, field: keyof RoutineExercise, value: any) => {
        const newDays = [...days];
        if (newDays[dayIndex].exercises && newDays[dayIndex].exercises![exIndex]) {
            const currentEx = newDays[dayIndex].exercises![exIndex];
            let updates: Partial<RoutineExercise> = { [field]: value };

            // If changing the exercise, populate defaults
            if (field === 'exercise_id') {
                const selectedExercise = exercises.find(e => e.id === value);
                if (selectedExercise) {
                    updates = {
                        ...updates,
                        suggested_sets: selectedExercise.default_sets ?? currentEx.suggested_sets ?? 3,
                        suggested_reps: selectedExercise.default_reps ?? currentEx.suggested_reps ?? "10",
                        suggested_weight_percent: selectedExercise.default_weight_percent ?? currentEx.suggested_weight_percent,
                        rest_period_seconds: selectedExercise.default_rest_seconds ?? currentEx.rest_period_seconds ?? 60,
                        tempo: selectedExercise.default_tempo ?? currentEx.tempo ?? "2-0-2-0",
                        suggested_time_seconds: selectedExercise.default_time_seconds ?? currentEx.suggested_time_seconds
                    };
                }
            }

            newDays[dayIndex].exercises![exIndex] = { ...currentEx, ...updates };
            setDays(newDays);
        }
    };

    const removeExercise = (dayIndex: number, exIndex: number) => {
        const newDays = [...days];
        if (newDays[dayIndex].exercises) {
            newDays[dayIndex].exercises!.splice(exIndex, 1);
            setDays(newDays);
        }
    };

    // Grouping helper
    const getGroupedExercises = (exercises: RoutineExercise[]) => {
        const groups: { name: string | null; exercises: { ex: RoutineExercise; index: number }[] }[] = [];
        let currentGroup: { name: string | null; exercises: { ex: RoutineExercise; index: number }[] } | null = null;

        exercises.forEach((ex, index) => {
            if (ex.group_name) {
                if (currentGroup && currentGroup.name === ex.group_name) {
                    currentGroup.exercises.push({ ex, index });
                } else {
                    if (currentGroup) groups.push(currentGroup);
                    currentGroup = { name: ex.group_name, exercises: [{ ex, index }] };
                }
            } else {
                if (currentGroup) {
                    groups.push(currentGroup);
                    currentGroup = null;
                }
                groups.push({ name: null, exercises: [{ ex, index }] });
            }
        });
        if (currentGroup) groups.push(currentGroup);
        return groups;
    };

    const updateGroupName = (dayIndex: number, exerciseIndices: number[], newName: string) => {
        const newDays = [...days];
        exerciseIndices.forEach(exIndex => {
            if (newDays[dayIndex].exercises && newDays[dayIndex].exercises![exIndex]) {
                newDays[dayIndex].exercises![exIndex] = { ...newDays[dayIndex].exercises![exIndex], group_name: newName };
            }
        });
        setDays(newDays);
    };

    const renderExerciseCard = (dayIndex: number, exIndex: number, ex: RoutineExercise, isGrouped: boolean = false) => (
        <div key={ex.id} className={clsx("bg-slate-900/50 p-4 rounded-xl border border-slate-800", isGrouped ? "mb-2 last:mb-0" : "mb-4")}>
            {/* Top Row: Header */}
            <div className="flex items-center gap-3 mb-4">
                <GripVertical size={20} className="text-slate-600 cursor-move" />
                <Autocomplete
                    options={exercises.map(e => ({ label: e.name, value: e.id }))}
                    value={ex.exercise_id}
                    onChange={(val) => updateExercise(dayIndex, exIndex, 'exercise_id', val)}
                    className="flex-1"
                    placeholder="Select Exercise"
                />
                <button onClick={() => removeExercise(dayIndex, exIndex)} className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Bottom Row: Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pl-8">
                <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Sets</label>
                    <input
                        type="number"
                        value={ex.suggested_sets || ''}
                        onChange={e => updateExercise(dayIndex, exIndex, 'suggested_sets', parseInt(e.target.value))}
                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-center text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        placeholder="3"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Reps</label>
                    <input
                        type="text"
                        value={ex.suggested_reps || ''}
                        onChange={e => updateExercise(dayIndex, exIndex, 'suggested_reps', e.target.value)}
                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-center text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        placeholder="10"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">% 1RM</label>
                    <input
                        type="number"
                        value={ex.suggested_weight_percent || ''}
                        onChange={e => updateExercise(dayIndex, exIndex, 'suggested_weight_percent', parseInt(e.target.value))}
                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-center text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        placeholder="-"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Rest (s)</label>
                    <input
                        type="number"
                        value={ex.rest_period_seconds || ''}
                        onChange={e => updateExercise(dayIndex, exIndex, 'rest_period_seconds', parseInt(e.target.value))}
                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-center text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        placeholder="60"
                    />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Tempo</label>
                    <input
                        type="text"
                        value={ex.tempo || ''}
                        onChange={e => updateExercise(dayIndex, exIndex, 'tempo', e.target.value)}
                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-center text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        placeholder="3-0-1-0"
                    />
                </div>
                {/* Time Input - conditionally shown? For now show all */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-bold tracking-wider">Time (s)</label>
                    <input
                        type="number"
                        value={ex.suggested_time_seconds || ''}
                        onChange={e => updateExercise(dayIndex, exIndex, 'suggested_time_seconds', parseInt(e.target.value))}
                        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-center text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        placeholder="-"
                    />
                </div>
            </div>

            {/* Group Name Input (Only for ungrouped items to allow starting a group) */}
            {!isGrouped && (
                <div className="mt-3 pl-8 flex items-center gap-2">
                    <span className="text-xs text-slate-600">Group:</span>
                    <Autocomplete
                        options={['Warm-up', 'Main Lift', 'Accessory', 'Mobility', 'Prehab', 'Cardio', 'Agility', 'Core'].map(g => ({ label: g, value: g }))}
                        value={ex.group_name}
                        onChange={(val) => updateExercise(dayIndex, exIndex, 'group_name', val)}
                        className="w-40"
                        placeholder="None"
                        freeText={true}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">{routine ? 'Edit Routine' : 'New Routine'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="e.g., Push/Pull/Legs"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="Brief description..."
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Workout Days</h3>
                            <button onClick={addDay} className="text-sky-400 hover:text-sky-300 text-sm font-medium flex items-center gap-1">
                                <Plus size={16} /> Add Day
                            </button>
                        </div>

                        <div className="space-y-6">
                            {days.map((day, dayIndex) => (
                                <div key={day.id} className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <input
                                            type="text"
                                            value={day.name}
                                            onChange={e => updateDayName(dayIndex, e.target.value)}
                                            className="bg-transparent text-xl text-white font-bold focus:outline-none border-b border-transparent focus:border-sky-500 px-1"
                                        />
                                        <button onClick={() => removeDay(dayIndex)} className="text-slate-500 hover:text-red-400 transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {getGroupedExercises(day.exercises || []).map((group, groupIndex) => {
                                            if (group.name) {
                                                // Render Group
                                                return (
                                                    <div key={`group-${groupIndex}`} className="bg-slate-800/50 border border-sky-500/20 rounded-xl p-4 relative">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500/50 rounded-l-xl"></div>
                                                        <div className="flex items-center gap-3 mb-4 pl-3">
                                                            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Superset / Group</span>
                                                            <Autocomplete
                                                                options={['Warm-up', 'Main Lift', 'Accessory', 'Mobility', 'Prehab', 'Cardio', 'Agility', 'Core'].map(g => ({ label: g, value: g }))}
                                                                value={group.name}
                                                                onChange={(val) => updateGroupName(dayIndex, group.exercises.map(e => e.index), val)}
                                                                className="w-48"
                                                                placeholder="Group Name"
                                                                freeText={true}
                                                            />
                                                        </div>
                                                        <div className="pl-3 space-y-4">
                                                            {group.exercises.map(({ ex, index }) => renderExerciseCard(dayIndex, index, ex, true))}
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Render Single Exercises
                                                return group.exercises.map(({ ex, index }) => renderExerciseCard(dayIndex, index, ex, false));
                                            }
                                        })}

                                        <button onClick={() => addExerciseToDay(dayIndex)} className="w-full py-4 text-sm text-slate-500 hover:text-sky-400 border-2 border-dashed border-slate-700 hover:border-sky-500/30 rounded-xl transition-all hover:bg-slate-800/50 flex items-center justify-center gap-2">
                                            <Plus size={18} /> Add Exercise
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Routine'} <Save size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoutineEditor;
