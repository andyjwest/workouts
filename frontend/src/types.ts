export interface Exercise {
    id: number;
    name: string;
    notes?: string;
    muscle_group?: string[];
    group_name?: string;
    default_sets?: number;
    default_reps?: string;
    default_rest_seconds?: number;
    default_weight_percent?: number;
    default_tempo?: string;
    default_time_seconds?: number;
    tracked_metrics?: string;
}

export interface RoutineExercise {
    id: number;
    routine_day_id: number;
    exercise_id: number;
    sequence: number;
    group_name?: string;
    exercise?: Exercise;
    sets?: number;
    reps?: number;
    suggested_sets?: number;
    suggested_reps?: string;
    suggested_weight_percent?: number;
    rest_period_seconds?: number;
    tempo?: string;
    suggested_time_seconds?: number;
}

export interface RoutineDay {
    id: number;
    routine_id: number;
    day_number: number;
    name: string;
    exercises?: RoutineExercise[];
}

export interface Routine {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    is_active?: boolean;
    days?: RoutineDay[];
}

export interface WorkoutSet {
    id: number;
    workout_exercise_id: number;
    set_number: number;
    weight_kg?: number;
    reps?: number;
    rpe?: number;
    tempo?: string;
    notes?: string;
    completed?: boolean;
    duration_seconds?: number;
}

export interface WorkoutExercise {
    id: number;
    workout_id: number;
    exercise_id: number;
    sequence: number;
    exercise?: Exercise;
    sets?: WorkoutSet[];
    name?: string;
    muscle_group?: string[];
}

export interface Workout {
    id: number;
    user_id: number;
    date: string;
    start_time: string;
    end_time?: string;
    notes?: string;
    exercises?: WorkoutExercise[];
}

export interface SuggestedWorkout {
    routine_name: string;
    day_name: string;
    exercises: {
        id: number;
        name: string;
        muscle_group: string[];
        group_name?: string;
        suggested_sets?: number;
        suggested_reps?: string;
        suggested_weight_percent?: number;
        rest_period_seconds?: number;
        tempo?: string;
    }[];
}

export interface RoutineDayResponse {
    id: number;
    name: string;
    day_of_week?: number;
    exercises: {
        id: number;
        name: string;
        muscle_group: string[];
        group_name?: string;
        suggested_sets?: number;
        suggested_reps?: string;
        suggested_weight_percent?: number;
        rest_period_seconds?: number;
        tempo?: string;
    }[];
}
