import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { Routine } from '../types';
import { Plus, Star, Trash2 } from 'lucide-react';
import RoutineEditor from './RoutineEditor';

const RoutineManager: React.FC = () => {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadRoutines();
    }, []);

    const loadRoutines = async () => {
        try {
            setError(null);
            const data = await api.get<Routine[]>('/routines/');
            setRoutines(data);
        } catch (err) {
            console.error('Failed to load routines', err);
            setError('Failed to load routines. Please check if the backend is running.');
        }
    };

    const handleDelete = async (routineId: number) => {
        if (!confirm('Are you sure you want to delete this routine?')) return;
        try {
            await api.delete(`/routines/${routineId}`);
            loadRoutines();
        } catch (err) {
            console.error('Failed to delete routine', err);
        }
    };

    const handleActivate = async (routineId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.post(`/routines/${routineId}/activate`, {});
            loadRoutines();
        } catch (err) {
            console.error('Failed to activate routine', err);
        }
    };

    const handleEdit = (routine: Routine) => {
        setEditingRoutine(routine);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setEditingRoutine(null);
        setIsEditorOpen(true);
    };

    const handleSave = () => {
        setIsEditorOpen(false);
        loadRoutines();
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
                    {error}
                </div>
            )}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Routines</h2>
                <button
                    onClick={handleCreate}
                    className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>New Routine</span>
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {routines.map(routine => (
                    <div
                        key={routine.id}
                        onClick={() => handleEdit(routine)}
                        className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => handleActivate(routine.id, e)}
                                    className={`p-1.5 rounded-lg transition-colors ${routine.is_active
                                        ? 'text-yellow-400 bg-yellow-400/10'
                                        : 'text-slate-600 hover:text-yellow-400 hover:bg-slate-700'
                                        }`}
                                    title={routine.is_active ? "Active Routine" : "Set as Active"}
                                >
                                    <Star size={20} fill={routine.is_active ? "currentColor" : "none"} />
                                </button>
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        {routine.name}
                                        {routine.is_active && <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">Active</span>}
                                    </h3>
                                    <div className="text-slate-400 text-sm">{routine.description || 'No description'}</div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(routine.id); }}
                                className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
                            <span>{routine.days?.length || 0} Days</span>
                            <span>•</span>
                            <span>{(routine.days || []).reduce((acc, day) => acc + (day.exercises?.length || 0), 0)} Exercises</span>
                        </div>
                    </div>
                ))}

                {routines.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                        No routines found. Create one to get started.
                    </div>
                )}
            </div>

            {isEditorOpen && (
                <RoutineEditor
                    routine={editingRoutine}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default RoutineManager;
