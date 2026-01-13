import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { Exercise } from '../types';
import { Search, X, Plus } from 'lucide-react';


interface AddExerciseModalProps {
    onClose: () => void;
    onSelect: (exercise: Exercise) => void;
    initialSearchTerm?: string;
}

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ onClose, onSelect, initialSearchTerm = '' }) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [search, setSearch] = useState(initialSearchTerm);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        try {
            const data = await api.get<Exercise[]>('/exercises/');
            setExercises(data);
        } catch (err) {
            console.error('Failed to load exercises', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredExercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscle_group?.some(m => m.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Add Exercise</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search exercises..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <div className="text-center p-8 text-slate-500">Loading exercises...</div>
                    ) : filteredExercises.length > 0 ? (
                        filteredExercises.map(exercise => (
                            <button
                                key={exercise.id}
                                onClick={() => onSelect(exercise)}
                                className="w-full text-left p-3 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all group flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-medium text-slate-200 group-hover:text-white">{exercise.name}</div>
                                    <div className="flex gap-2 mt-1">
                                        {exercise.muscle_group?.map(m => (
                                            <span key={m} className="text-xs text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-sky-500/10 text-sky-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={20} />
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center p-8 text-slate-500">
                            No exercises found matching "{search}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddExerciseModal;
