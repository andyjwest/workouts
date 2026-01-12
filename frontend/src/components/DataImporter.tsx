import React, { useState } from 'react';
import { api } from '../api';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

const DataImporter: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [stats, setStats] = useState<{ imported: number, skipped: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setStatus(null);
            setStats(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus(null);
        setStats(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await api.postFile<{ status: string, imported: number, skipped: number }>('/workouts/import', formData);
            setStatus({ type: 'success', message: 'Import completed successfully!' });
            setStats({ imported: result.imported, skipped: result.skipped });
            setFile(null);
            // Reset file input value manually if needed, but managing state is enough for logic
        } catch (error) {
            setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-xl">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-sky-400" />
                    Import Workout Data
                </h3>

                <p className="text-slate-400 text-sm mb-6">
                    Upload a CSV file to import past workouts. Existing workouts (matching date) will be skipped.
                </p>

                <div className="space-y-4">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-500/10 file:text-sky-400 hover:file:bg-sky-500/20 cursor-pointer"
                    />

                    {file && (
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Importing...' : 'Start Import'}
                        </button>
                    )}
                </div>

                {status && (
                    <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {status.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                        <div>
                            <p className="font-medium">{status.message}</p>
                            {stats && (
                                <p className="text-sm mt-1 opacity-90">
                                    Imported: {stats.imported} | Skipped: {stats.skipped}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataImporter;
