import React from 'react';
import { X, Clock, Trophy, Trash2, Pencil } from 'lucide-react';
import type { Workout } from '../types';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface WorkoutDetailModalProps {
    workout: Workout;
    onClose: () => void;
    onDelete: (id: number) => void;
}

const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({ workout, onClose, onDelete }) => {
    const navigate = useNavigate();

    // Re-calculate basic stats
    let totalVolume = 0;
    let totalSets = 0;
    workout.exercises?.forEach(ex => {
        ex.sets?.forEach(s => {
            totalSets++;
            if (s.weight_kg && s.reps) totalVolume += s.weight_kg * s.reps;
        });
    });

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this workout? This cannot be undone.')) {
            onDelete(workout.id);
        }
    };

    const handleEdit = () => {
        navigate(`/workout/${workout.id}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            {format(parseISO(workout.date), 'EEEE, MMMM do')}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><Clock size={14} /> {workout.start_time?.slice(0, 5)}</span>
                            <span className="flex items-center gap-1"><Trophy size={14} /> {(totalVolume / 1000).toFixed(1)}k kg Volume</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {workout.exercises?.map((exercise, idx) => (
                        <div key={`${exercise.id}-${idx}`} className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                            <h3 className="font-bold text-lg text-sky-400 mb-3">{exercise.name}</h3>

                            <div className="space-y-2">
                                <div className="grid grid-cols-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
                                    <span>Set</span>
                                    <span>Lbs/Kg</span>
                                    <span>Reps</span>
                                    <span>Notes</span>
                                </div>
                                {exercise.sets?.map((set, sIdx) => (
                                    <div key={sIdx} className="grid grid-cols-4 text-sm text-slate-300 py-2 border-t border-slate-800/50 px-2">
                                        <span className="font-mono text-slate-500">{set.set_number || sIdx + 1}</span>
                                        <span className="font-medium">{set.weight_kg}</span>
                                        <span>{set.reps}</span>
                                        <span className="text-slate-500 text-xs truncate">
                                            {/* RPE or whatever stored */}
                                            {set.duration_seconds ? `${set.duration_seconds}s` : '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-b-2xl">
                    <button
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2 px-3 py-2 hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} /> Delete Workout
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleEdit}
                            className="text-sky-400 hover:text-sky-300 font-medium px-4 py-2 hover:bg-sky-500/10 rounded-lg transition-colors border border-sky-500/30 flex items-center gap-2"
                        >
                            <Pencil size={16} /> Edit
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white font-medium px-4 py-2"
                        >
                            Close
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WorkoutDetailModal;
