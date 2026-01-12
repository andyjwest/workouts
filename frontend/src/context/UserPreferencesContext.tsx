import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type UnitSystem = 'metric' | 'imperial';

interface UserPreferencesContextType {
    unitSystem: UnitSystem;
    toggleUnitSystem: () => void;
    convertWeight: (kg: number | undefined | null) => number | null;
    formatWeight: (kg: number | undefined | null) => string;
    toKg: (weight: number | undefined | null) => number | null;
    unitLabel: string;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
        const saved = localStorage.getItem('unitSystem');
        return (saved === 'metric' || saved === 'imperial') ? saved : 'imperial';
    });

    useEffect(() => {
        localStorage.setItem('unitSystem', unitSystem);
    }, [unitSystem]);

    const toggleUnitSystem = () => {
        setUnitSystem(prev => prev === 'metric' ? 'imperial' : 'metric');
    };

    const convertWeight = (kg: number | undefined | null): number | null => {
        if (kg === undefined || kg === null) return null;
        if (unitSystem === 'metric') return kg;
        // 1 kg = 2.20462 lbs
        return parseFloat((kg * 2.20462).toFixed(1));
    };

    // Convert FROM display value TO kg (for saving)
    const toKg = (weight: number | undefined | null): number | null => {
        if (weight === undefined || weight === null) return null;
        if (unitSystem === 'metric') return weight;
        return parseFloat((weight / 2.20462).toFixed(2));
    };

    const formatWeight = (kg: number | undefined | null): string => {
        const val = convertWeight(kg);
        if (val === null) return '-';
        return `${val} ${unitSystem === 'metric' ? 'kg' : 'lbs'}`;
    };

    const unitLabel = unitSystem === 'metric' ? 'kg' : 'lbs';

    return (
        <UserPreferencesContext.Provider value={{
            unitSystem,
            toggleUnitSystem,
            convertWeight,
            formatWeight,
            toKg,
            unitLabel
        }}>
            {children}
        </UserPreferencesContext.Provider>
    );
};

export const useUserPreferences = () => {
    const context = useContext(UserPreferencesContext);
    if (context === undefined) {
        throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
    }
    return context;
};
