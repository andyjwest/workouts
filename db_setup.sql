-- Drop all tables with cascade to handle dependencies
DROP TABLE IF EXISTS users, body_measurements, exercises, muscles, exercise_muscles, workouts, workout_exercises, workout_sets, routines, routine_days, routine_exercises CASCADE;

-- Users table to store user information
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_auth_method CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
);

-- Body measurements to track progress
CREATE TABLE body_measurements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    body_weight_kg NUMERIC(5, 2),
    body_fat_percentage NUMERIC(4, 2),
    notes TEXT,
    UNIQUE(user_id, date)
);

-- A comprehensive catalog of exercises
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    -- e.g., 'strength', 'cardio', 'flexibility'
    type VARCHAR(50),
    -- e.g., 'barbell', 'dumbbell', 'bodyweight'
    equipment VARCHAR(50),
    -- e.g., '4-0-1-0' for eccentric, pause, concentric, pause
    default_tempo VARCHAR(20),
    -- Comma-separated list of metrics, e.g., 'reps,weight', 'distance,duration', 'reps,height'
    tracked_metrics VARCHAR(100) NOT NULL DEFAULT 'reps,weight'
);

-- Muscles catalog
CREATE TABLE muscles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Link exercises to the muscles they target
CREATE TABLE exercise_muscles (
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    muscle_id INTEGER NOT NULL REFERENCES muscles(id),
    is_primary BOOLEAN DEFAULT true,
    PRIMARY KEY (exercise_id, muscle_id)
);

-- Workouts table to log each workout session
CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    notes TEXT
);

-- Details of each exercise within a workout
CREATE TABLE workout_exercises (
    id SERIAL PRIMARY KEY,
    workout_id INTEGER NOT NULL REFERENCES workouts(id),
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    -- The order of the exercise in the workout
    sequence INTEGER NOT NULL
);

-- Sets for each exercise in a workout
CREATE TABLE workout_sets (
    id SERIAL PRIMARY KEY,
    workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id),
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight_kg NUMERIC(6, 2),
    -- For time-based sets
    duration_seconds INTEGER,
    -- For distance-based sets
    distance_m NUMERIC(7, 2),
    -- For height-based sets
    height_cm NUMERIC(5, 2),
    -- e.g., '4-0-1-0' for eccentric, pause, concentric, pause
    tempo VARCHAR(20),
    notes TEXT
);

-- Routines for pre-defined workout plans
CREATE TABLE routines (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE
);

-- Days within a routine (e.g., "Push Day", "Leg Day")
CREATE TABLE routine_days (
    id SERIAL PRIMARY KEY,
    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    -- 0=Monday, 6=Sunday. Can be null for floating days, but we'll use it for scheduling.
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    UNIQUE(routine_id, day_of_week)
);

-- The exercises that make up a specific routine day
CREATE TABLE routine_exercises (
    id SERIAL PRIMARY KEY,
    routine_day_id INTEGER NOT NULL REFERENCES routine_days(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    -- The order of the exercise in the day
    sequence INTEGER NOT NULL,
    -- Suggested sets, reps, etc.
    suggested_sets INTEGER,
    suggested_reps VARCHAR(50), -- e.g., '8-12' or '30s sprint / 90s rest'
    suggested_weight_percent NUMERIC(5, 2), -- e.g., 80% of 1RM
    rest_period_seconds INTEGER,
    -- Grouping for supersets or focus areas (e.g., "Mobility", "Superset A")
    group_name VARCHAR(100)
);

-- Insert some sample data

-- Sample User
INSERT INTO users (username, email, password_hash) VALUES ('demo_user', 'demo@example.com', 'hashed_password');

-- Sample Muscles
INSERT INTO muscles (name) VALUES ('Chest'), ('Back'), ('Shoulders'), ('Biceps'), ('Triceps'), ('Quadriceps'), ('Hamstrings'), ('Calves'), ('Abs'), ('Glutes');
