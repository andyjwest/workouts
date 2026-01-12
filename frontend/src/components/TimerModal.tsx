import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface TimerModalProps {
    initialSeconds: number;
    onComplete: () => void;
    onClose: () => void;
    isOpen: boolean;
}

const TimerModal: React.FC<TimerModalProps> = ({ initialSeconds, onComplete, onClose, isOpen }) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<number | null>(null);

    // Reset timer when opened
    useEffect(() => {
        if (isOpen) {
            setSecondsLeft(initialSeconds);
            setIsActive(false); // Auto-start? Maybe user wants to prep first. Let's wait for click.
        } else {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
        }
    }, [isOpen, initialSeconds]);

    useEffect(() => {
        if (isActive && secondsLeft > 0) {
            intervalRef.current = window.setInterval(() => {
                setSecondsLeft((prev) => prev - 1);
            }, 1000);
        } else if (secondsLeft === 0) {
            setIsActive(false);
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            // Optional: Play sound?
            // onComplete(); // Don't auto-close, let user see it finished
        }

        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
        };
    }, [isActive, secondsLeft]);

    if (!isOpen) return null;

    const progress = Math.max(0, secondsLeft / initialSeconds) * 100;
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-sm flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <h3 className="text-xl font-bold text-white mb-8">Set Timer</h3>

                {/* Circular Progress */}
                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="8"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={secondsLeft === 0 ? "#22c55e" : "#0ea5e9"}
                            strokeWidth="8"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * progress) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    <div className="text-6xl font-black text-white tabular-nums tracking-wider relative z-10">
                        {formatTime(secondsLeft)}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 w-full">
                    <button
                        onClick={() => {
                            setSecondsLeft(initialSeconds);
                            setIsActive(false);
                        }}
                        className="p-4 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <RotateCcw size={24} />
                    </button>

                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={clsx(
                            "flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all transform active:scale-95",
                            isActive
                                ? "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                                : secondsLeft === 0
                                    ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                                    : "bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/20"
                        )}
                    >
                        {secondsLeft === 0 ? (
                            <>Done <CheckCircle2 size={24} /></>
                        ) : isActive ? (
                            <>Pause <Pause size={24} fill="currentColor" /></>
                        ) : (
                            <>Start <Play size={24} fill="currentColor" /></>
                        )}
                    </button>
                </div>

                {secondsLeft === 0 && (
                    <button
                        onClick={() => { onComplete(); onClose(); }}
                        className="mt-4 text-slate-400 hover:text-white underline text-sm"
                    >
                        Mark Set Complete & Close
                    </button>
                )}
            </div>
        </div>
    );
};

export default TimerModal;
