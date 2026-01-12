
import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { Exercise } from '../types';
import { Plus, Search, Edit2 } from 'lucide-react';
import ExerciseModal from './ExerciseModal';

const ExerciseManager: React.FC = () => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

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

    const filteredExercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = () => {
        setEditingExercise(null);
        setIsModalOpen(true);
    };

    const handleEdit = (exercise: Exercise) => {
        setEditingExercise(exercise);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        loadExercises();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Exercises</h2>
                <button
                    onClick={handleCreate}
                    className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>New Exercise</span>
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search exercises..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredExercises.map(exercise => (
                    <div key={exercise.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-colors group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-white mb-1">{exercise.name}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {exercise.muscle_group?.map(m => (
                                        <span key={m} className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{m}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(exercise)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400">
                                    <Edit2 size={16} />
                                </button>
                                {/* Delete button could go here */}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <ExerciseModal
                    exercise={editingExercise}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default ExerciseManager;
