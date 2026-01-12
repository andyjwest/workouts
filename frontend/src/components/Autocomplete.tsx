import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface Option {
    label: string;
    value: any;
}

interface AutocompleteProps {
    options: Option[];
    value: any;
    onChange: (value: any) => void;
    placeholder?: string;
    className?: string;
    freeText?: boolean; // If true, allows typing custom values (like for groups)
}

const Autocomplete: React.FC<AutocompleteProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className,
    freeText = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Initialize search term based on current value
    useEffect(() => {
        if (value) {
            const selectedOption = options.find(o => o.value === value);
            if (selectedOption) {
                setSearchTerm(selectedOption.label);
            } else if (freeText) {
                setSearchTerm(String(value));
            }
        } else {
            setSearchTerm('');
        }
    }, [value, options, freeText]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // If freeText is allowed and no option matched, keep the text
                // Otherwise reset to current value's label
                if (!freeText) {
                    const selectedOption = options.find(o => o.value === value);
                    setSearchTerm(selectedOption ? selectedOption.label : '');
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value, options, freeText]);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option: Option) => {
        onChange(option.value);
        setSearchTerm(option.label);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        setIsOpen(true);

        if (freeText) {
            onChange(newValue);
        }
    };

    return (
        <div ref={wrapperRef} className={clsx("relative", className)}>
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full bg-slate-800 text-white rounded px-3 py-2 pr-8 focus:outline-none text-sm border border-transparent focus:border-sky-500 placeholder-slate-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={14} />
                </div>
            </div>

            {isOpen && (filteredOptions.length > 0 || freeText) && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={String(option.value)}
                                onClick={() => handleSelect(option)}
                                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                                {option.label}
                            </button>
                        ))
                    ) : freeText ? (
                        <div className="px-3 py-2 text-sm text-slate-400 italic">
                            Press enter or click outside to use "{searchTerm}"
                        </div>
                    ) : (
                        <div className="px-3 py-2 text-sm text-slate-500">
                            No results found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Autocomplete;
