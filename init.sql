-- Drop all tables with cascade to handle dependencies
DROP TABLE IF EXISTS users, body_measurements, exercises, muscles, exercise_muscles, workouts, workout_exercises, workout_sets, routines, routine_exercises CASCADE;

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
    type VARCHAR(50),
    equipment VARCHAR(50),
    default_tempo VARCHAR(20),
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
    sequence INTEGER NOT NULL
);

-- Sets for each exercise in a workout
CREATE TABLE workout_sets (
    id SERIAL PRIMARY KEY,
    workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id),
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight_kg NUMERIC(6, 2),
    duration_seconds INTEGER,
    distance_m NUMERIC(7, 2),
    height_cm NUMERIC(5, 2),
    tempo VARCHAR(20),
    notes TEXT
);

-- Routines for pre-defined workout plans
CREATE TABLE routines (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- The exercises that make up a routine
CREATE TABLE routine_exercises (
    id SERIAL PRIMARY KEY,
    routine_id INTEGER NOT NULL REFERENCES routines(id),
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    sequence INTEGER NOT NULL,
    suggested_sets INTEGER,
    suggested_reps VARCHAR(50),
    suggested_weight_percent NUMERIC(5, 2),
    rest_period_seconds INTEGER
);

-- Insert sample data
INSERT INTO users (username, email, password_hash) VALUES ('demo_user', 'demo@example.com', 'hashed_password');
INSERT INTO muscles (name) VALUES ('Chest'), ('Back'), ('Shoulders'), ('Biceps'), ('Triceps'), ('Quadriceps'), ('Hamstrings'), ('Calves'), ('Abs'), ('Glutes');

-- A master list of all unique exercises from all data sources
INSERT INTO exercises (name, tracked_metrics) VALUES
-- From workout history
('Lateral Raise (Cable)', 'reps,weight'), ('Face Pull', 'reps,weight'), ('Bench Press (Dumbbell)', 'reps,weight'), ('Dumbbell Row', 'reps,weight'), ('Pull Up (Assisted)', 'reps,weight'), ('Chest Dip (Assisted)', 'reps,weight'), ('Butterfly (Pec Deck)', 'reps,weight'), ('Sled Push', 'reps,weight,distance'), ('sled back peddle pull', 'reps,weight'), ('Nordic Hamstrings Curls', 'reps'), ('Dumbbell Step Up', 'reps,weight'), ('Lateral Lunges (weighted)', 'reps,weight'), ('single leg box jump', 'reps,height'), ('Cable Core Palloff Press', 'reps,weight'), ('Hip flexor Lift', 'reps,weight'), ('Cable Twist Flat', 'reps,weight'), ('Bicep Curl (Cable)', 'reps,weight'), ('Triceps Pushdown', 'reps,weight'), ('Chest Press (Band)', 'reps,weight'), ('Hip Adduction (Machine)', 'reps,weight'), ('Hip Abduction (Machine)', 'reps,weight'), ('Walking Lunge (Dumbbell)', 'reps,weight,distance'), ('Single Leg Glute Bridge', 'reps,weight'), ('Mountain Climber', 'reps'), ('Reverse Lunge', 'reps'), ('Shoulder Press (Dumbbell)', 'reps,weight'), ('Single Leg Romanian Deadlift (Dumbbell)', 'reps,weight'), ('Plank', 'duration'), ('Bulgarian Split Squat', 'reps,weight'), ('Bench Press - Close Grip (Barbell)', 'reps,weight'), ('Overhead Press (Barbell)', 'reps,weight'), ('Lat Pulldown (Cable)', 'reps,weight'), ('Lateral Raise (Dumbbell)', 'reps,weight'), ('Bicep Curl (Dumbbell)', 'reps,weight'), ('Chest Fly (Dumbbell)', 'reps,weight'), ('Bent Over Row (Dumbbell)', 'reps,weight'), ('Skullcrusher (Dumbbell)', 'reps,weight'), ('Pistol Squat', 'reps,height'), ('Decline Crunch', 'reps'), ('Back Extension (Hyperextension)', 'reps'), ('Band Assisted High jump', 'reps,height'), ('Single Leg Press (Machine)', 'reps,weight'), ('Hip Thrust (Machine)', 'reps,weight'), ('Front Raise (Dumbbell)', 'reps,weight'), ('Standing Calf Raise (Dumbbell)', 'reps,weight'), ('Back Extension (Weighted Hyperextension)', 'reps,weight'), ('Chin Up (Assisted)', 'reps,weight'), ('Dead Bug', 'reps'), ('Bent Over Row (Barbell)', 'reps,weight'), ('Incline Bench Press (Dumbbell)', 'reps,weight'),
-- From ATG routine
('Sled Push & Pull', 'reps,weight,distance'), ('Massai Jumps', 'reps'), ('Bounds', 'distance'), ('Box Jumps', 'reps,height'), ('ATG Split Squat', 'reps,weight'), ('Pullups', 'reps,weight'), ('ATG Pushup/Dip', 'reps,weight'), ('L-Sit', 'duration'), ('Back Extensions', 'reps'), ('Calf Stretch', 'duration'), ('Elephant Walk', 'reps'), ('Piriformis Push Up', 'reps'), ('Standing Pancake', 'duration'), ('Couch Stretch', 'duration'), ('Straight Leg Calf Raises', 'reps'), ('Tibialis Raise', 'reps'), ('Bike', 'duration'), ('Squat', 'reps,weight'), ('Row', 'reps'), ('Eccentric Nordic', 'reps'), ('Powell Raise', 'reps'), ('Trap-3 Raise', 'reps'), ('KOT Calf Raise', 'reps'), ('Bike Intervals', 'duration'), ('Agility Ladder Drills', 'reps'), ('Cone Drills (5-10-5)', 'reps'), ('Lateral Shuffles', 'distance'), ('Garhammer Raise', 'reps'), ('Lateral Jumps', 'reps'), ('Rotational Jumps (90°)', 'reps'), ('Reverse Step Ups', 'reps,weight'), ('DB Seated Goodmorning', 'reps,weight'), ('Dip', 'reps,weight'), ('External Rotation', 'reps'), ('Bottom 1/4 Squat', 'reps,weight'), ('DB RDL', 'reps,weight'), ('Pullover', 'reps,weight'), ('Trap-3 Raise Negative', 'reps,weight'), ('Hamstring Curls', 'reps,weight'),
-- From Pro and Speed routines
('Backwards Walking', 'duration'), ('QL Extensions', 'reps'), ('Shoulder Press', 'reps,weight'), ('Band Pullapart', 'reps'), ('ATG Incline Press', 'reps,weight'), ('Sled', 'reps,weight,distance'), ('Nordic Eccentric', 'reps'), ('Peterson Step Up', 'reps,weight'), ('Hip Flexors', 'reps'), ('Butterfly Stretch', 'duration'), ('Hammer Curl', 'reps,weight'), ('Sprint', 'distance'), ('Romanian Deadlift', 'reps,weight'), ('Split Squat', 'reps,weight'), ('Seated Goodmorning', 'reps,weight'), ('Jefferson Curl', 'reps,weight'), ('QL Extension', 'reps'), ('Neck Press', 'reps,weight')
ON CONFLICT (name) DO NOTHING;

-- Import historical workout data
DO $$
DECLARE
    workout_id_var INTEGER;
    workout_exercise_id_var INTEGER;
BEGIN
    INSERT INTO workouts (user_id, date, start_time, end_time, notes) VALUES (1, '2025-07-09', '06:42:00', '07:46:00', '') RETURNING id INTO workout_id_var;
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Lateral Raise (Cable)'), 1) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 1, 9, 4.99);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 2, 10, 4.99);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 3, 9, 4.99);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 4, 11, 4.99);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 5, 9, 4.54);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 6, 8, 4.54);
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Face Pull'), 2) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 1, 10, 17.24);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 2, 10, 22.68);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 3, 10, 22.68);
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Bench Press (Dumbbell)'), 3) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 1, 10, 31.75);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 2, 10, 45.36);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 3, 10, 45.36);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 4, 10, 45.36);
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Dumbbell Row'), 4) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 1, 10, 22.68);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 2, 10, 22.68);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 3, 10, 22.68);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 4, 10, 22.68);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 5, 10, 22.68);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 6, 10, 22.68);
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Pull Up (Assisted)'), 5) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 1, 3, 27.22);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 2, 5, 36.29);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 3, 5, 45.36);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 4, 5, 54.43);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 5, 5, 63.5);
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Chest Dip (Assisted)'), 6) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 1, 3, 27.22);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 2, 4, 36.29);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 3, 5, 45.36);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 4, 5, 54.43);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 5, 5, 63.5);
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Butterfly (Pec Deck)'), 7) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 1, 10, 40.82);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 2, 10, 45.36);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 3, 10, 45.36);
END $$;

-- Import routines
DO $$
DECLARE
    routine_id_var INTEGER;
BEGIN
    -- ATG - Monday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'ATG - Monday', 'ATG workout for Monday, focusing on full-body strength and mobility.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Sled Push & Pull'), 1, 3, '35 yards'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Massai Jumps'), 2, 3, '10'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Bounds'), 3, 3, '20-30m'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'ATG Split Squat'), 4, 3, '10 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Pullups'), 5, 1, 'Failure'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'ATG Pushup/Dip'), 6, 1, 'Failure'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'L-Sit'), 7, 1, '20 (20s total)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Back Extensions'), 8, 2, '15'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 9, 1, '60 sec (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Elephant Walk'), 10, 1, '20 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Piriformis Push Up'), 11, 1, '20 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Standing Pancake'), 12, 1, '30 sec'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 13, 1, '60 sec (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Straight Leg Calf Raises'), 14, 1, '20 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Tibialis Raise'), 15, 1, '20 (per side)');

    -- ATG - Tuesday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'ATG - Tuesday', 'ATG workout for Tuesday, focusing on squat, rows, and prehab.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Bike'), 1, 1, '5-10 min'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Squat'), 2, 3, '5'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Row'), 3, 1, '15'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Eccentric Nordic'), 4, 2, '5'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Powell Raise'), 5, 10, '3 (per side)'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Trap-3 Raise'), 6, 2, '5'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 7, 1, '60 sec (per side)'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Elephant Walk'), 8, 1, '20 (per side)'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Piriformis Push Up'), 9, 1, '20 (per side)'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Standing Pancake'), 10, 1, '30 sec'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 11, 1, '60 sec (per side)'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'KOT Calf Raise'), 12, 2, '15 (per side)'),
      (routine_id_var, (SELECT id FROM exercises WHERE name = 'Tibialis Raise'), 13, 2, '20 (per side)');

    -- ATG - Wednesday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'ATG - Wednesday', 'Cardio and agility day.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Bike Intervals'), 1, 10, '30s sprint / 90s rest'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Agility Ladder Drills'), 2, 2, ''),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Cone Drills (5-10-5)'), 3, 4, ''),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Lateral Shuffles'), 4, 2, '10 yds (each way)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'L-Sit'), 5, 1, '20');

    -- ATG - Thursday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'ATG - Thursday', 'Plyometrics and accessory work.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Sled Push'), 1, 1, '5-10 min'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Sled Pull'), 2, 1, '5-10 min'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Lateral Jumps'), 3, 3, '5 (each side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Rotational Jumps (90°)'), 4, 3, '5 (each way)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Reverse Step Ups'), 5, 3, '20 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Garhammer Raise'), 6, 1, '20'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'DB Seated Goodmorning'), 7, 2, '15'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Dip'), 8, 10, '3'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'External Rotation'), 9, 2, '15'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 10, 1, '60 sec (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Elephant Walk'), 11, 1, '20 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Piriformis Push Up'), 12, 1, '20 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Standing Pancake'), 13, 1, '30 sec'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 14, 1, '60 sec (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Straight Leg Calf Raises'), 15, 1, '20 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Tibialis Raise'), 16, 1, '20 (per side)');

    -- ATG - Friday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'ATG - Friday', 'Strength and mobility focus.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Sled Push & Pull'), 1, 3, '35 yards'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Bottom 1/4 Squat'), 2, 3, '5'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'DB RDL'), 3, 2, '15'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Pullover'), 4, 1, '20'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Trap-3 Raise Negative'), 5, 2, '5'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Hamstring Curls'), 6, 3, '10-15'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 7, 1, '60s per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Elephant Walk'), 8, 1, '20 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Piriformis Push Up'), 9, 1, '20 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Standing Pancake'), 10, 1, '30 sec'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 11, 1, '60s per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'KOT Calf Raise'), 12, 2, '15 (per side)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Tibialis Raise'), 13, 2, '20 (per side)');

    -- Pro - Monday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'Pro - Monday', 'Full body strength and mobility.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Backwards Walking'), 1, 1, '5 min (300s)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Pullups'), 2, 1, 'Failure'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'ATG Split Squat'), 3, 3, '10 per side (2s down, 5s hold)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'L-Sit'), 4, 1, '20 (20s total hold)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Back Extensions'), 5, 2, '15 (with band or weight)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'ATG Pushup/Dip'), 6, 1, 'Failure (3s down, 2s hold)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 7, 1, '60 sec'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Elephant Walk'), 8, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Piriformis Push Up'), 9, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Standing Pancake'), 10, 1, '30 sec hold'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 11, 1, '60 sec hold'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Straight Leg Calf Raises'), 12, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Tibialis Raise'), 13, 1, '20 per side');

    -- Pro - Tuesday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'Pro - Tuesday', 'Squat focus and accessory work.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Backwards Walking'), 1, 1, '5 min (300s)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Row'), 2, 1, '15'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Squat'), 3, 3, '5 (5s down, 1s hold)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'QL Extensions'), 4, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Eccentric Nordic'), 5, 2, '5 (5s down)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Shoulder Press'), 6, 1, '12'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 7, 1, '60s per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Elephant Walk'), 8, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Piriformis Push Up'), 9, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Standing Pancake'), 10, 1, '30 sec hold'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 11, 1, '60s per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'KOT Calf Raise'), 12, 2, '15 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Tibialis Raise'), 13, 2, '20 per side');

    -- Pro - Thursday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'Pro - Thursday', 'Lower body and accessory day.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Backwards Walking'), 1, 1, '5 min (300s)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Band Pullapart'), 2, 1, '15'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Reverse Step Ups'), 3, 3, '20 per side (heel taps)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Garhammer Raise'), 4, 1, '20 (5s down, 1s hold)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'DB Seated Goodmorning'), 5, 2, '15'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'ATG Incline Press'), 6, 1, '12'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 7, 1, '60s per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Elephant Walk'), 8, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Piriformis Push Up'), 9, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Standing Pancake'), 10, 1, '30 sec hold'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 11, 1, '60s per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Straight Leg Calf Raises'), 12, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Tibialis Raise'), 13, 1, '20 per side');

    -- Pro - Friday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'Pro - Friday', 'Full body strength and mobility.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Backwards Walking'), 1, 1, '5 min (300s)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Pullover'), 2, 1, '20'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Bottom 1/4 Squat'), 3, 3, '5 per side (heel taps)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'DB RDL'), 4, 2, '15 (5s down, 1s hold)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Trap-3 Raise Negative'), 5, 2, '5'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 6, 1, '60s per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Elephant Walk'), 7, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Piriformis Push Up'), 8, 1, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Standing Pancake'), 9, 1, '30 sec hold'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 10, 1, '60s per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'KOT Calf Raise'), 11, 2, '15 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Tibialis Raise'), 12, 2, '20 per side');

    -- Speed - Monday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'Speed - Monday', 'Speed and power development.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Sled'), 1, 1, '3 min'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Nordic Eccentric'), 2, 10, '3 (5s down, 1s hold, pulse at bottom)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Powell Raise'), 3, 10, '3 per side (2s down, 2s hold)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Peterson Step Up'), 4, 10, '20 (20s)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Hip Flexors'), 5, 10, '5'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 6, 3, '60 sec'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 7, 3, '60 sec');

    -- Speed - Tuesday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'Speed - Tuesday', 'Mobility and accessory work.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Backwards Walking'), 1, 1, '5 min'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Butterfly Stretch'), 2, 2, '20'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Back Extensions'), 3, 2, '8 (5s down, 1s hold)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Pullover'), 4, 2, '20 per side'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Trap-3 Raise'), 5, 2, '5 (5s down)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Hammer Curl'), 6, 2, '10 (30 degree on a bench)');

    -- Speed - Wednesday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'Speed - Wednesday', 'Sprinting and strength.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Sprint'), 1, 10, '40 Yards'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Romanian Deadlift'), 2, 10, '3'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Dip'), 3, 10, '3'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Tibialis Raise'), 4, 10, '10'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Split Squat'), 5, 10, '3'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 6, 3, '1 min'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 7, 3, '1 min');

    -- Speed - Thursday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'Speed - Thursday', 'Accessory and strength day.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Backwards Walking'), 1, 1, '5 min (300s)'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Seated Goodmorning'), 2, 2, '15'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Jefferson Curl'), 3, 2, '8'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'QL Extension'), 4, 2, '10'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'External Rotation'), 5, 2, '15'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Pullups'), 6, 2, '10');

    -- Speed - Friday
    INSERT INTO routines (user_id, name, description) VALUES (1, 'Speed - Friday', 'Full body power day.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Sled'), 1, 3, ''),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Neck Press'), 2, 10, '3'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Hamstring Curls'), 3, 10, '3'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Peterson Step Up'), 4, 10, '10'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Hip Flexors'), 5, 10, '10'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 6, 1, '60 sec'),
    (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 7, 1, '60s per side');
END $$;
