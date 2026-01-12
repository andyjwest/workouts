import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

interface RestTimerProps {
    defaultDuration?: number; // in seconds
    autoStart?: boolean;
}

const RestTimer: React.FC<RestTimerProps> = ({ defaultDuration = 90, autoStart = false }) => {
    const [timeLeft, setTimeLeft] = useState(defaultDuration);
    const [isRunning, setIsRunning] = useState(autoStart);

    useEffect(() => {
        let interval: number | undefined;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            // Could play a sound here
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const toggleTimer = () => setIsRunning(!isRunning);
    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(defaultDuration);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={clsx("p-2 rounded-lg", isRunning ? "bg-sky-500/20 text-sky-400" : "bg-slate-800 text-slate-400")}>
                    <Timer size={20} />
                </div>
                <div>
                    <span className="text-2xl font-mono font-bold text-white tracking-wider">
                        {formatTime(timeLeft)}
                    </span>
                    <span className="text-xs text-slate-500 block">Rest Timer</span>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={toggleTimer}
                    className={clsx(
                        "p-3 rounded-lg transition-colors",
                        isRunning
                            ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                            : "bg-sky-500/10 text-sky-500 hover:bg-sky-500/20"
                    )}
                >
                    {isRunning ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                    onClick={resetTimer}
                    className="p-3 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
        </div>
    );
};

export default RestTimer;
