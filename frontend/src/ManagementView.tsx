import React, { useState } from 'react';
import ExerciseManager from './components/ExerciseManager';
import RoutineManager from './components/RoutineManager';
import DataImporter from './components/DataImporter';
import clsx from 'clsx';
import { useUserPreferences } from './context/UserPreferencesContext';
import { Ruler } from 'lucide-react';

const ManagementView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'exercises' | 'routines' | 'import'>('exercises');
    const { unitSystem, toggleUnitSystem } = useUserPreferences();

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-1">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setActiveTab('exercises')}
                        className={clsx(
                            'pb-4 font-medium text-lg transition-colors relative',
                            activeTab === 'exercises' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                        )}
                    >
                        Exercises
                        {activeTab === 'exercises' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-500 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('routines')}
                        className={clsx(
                            'pb-4 font-medium text-lg transition-colors relative',
                            activeTab === 'routines' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                        )}
                    >
                        Routines
                        {activeTab === 'routines' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-500 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        className={clsx(
                            'pb-4 font-medium text-lg transition-colors relative',
                            activeTab === 'import' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                        )}
                    >
                        Data Import
                        {activeTab === 'import' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-500 rounded-t-full" />
                        )}
                    </button>
                </div>

                <button
                    onClick={toggleUnitSystem}
                    className="flex items-center gap-2 px-3 py-2 -mt-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors text-sm font-medium"
                >
                    <Ruler size={16} />
                    {unitSystem === 'metric' ? 'Metric (kg)' : 'Imperial (lbs)'}
                </button>
            </div>

            {activeTab === 'exercises' && <ExerciseManager />}
            {activeTab === 'routines' && <RoutineManager />}
            {activeTab === 'import' && <DataImporter />}
        </div>
    );
};

export default ManagementView;
