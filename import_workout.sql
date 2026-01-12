-- Clear existing workout data
DELETE FROM workout_sets;
DELETE FROM workout_exercises;
DELETE FROM workouts;
DELETE FROM exercises;

-- Insert unique exercises from workout_data.csv
INSERT INTO exercises (name, tracked_metrics) VALUES
('Lateral Raise (Cable)', 'reps,weight'),
('Face Pull', 'reps,weight'),
('Bench Press (Dumbbell)', 'reps,weight'),
('Dumbbell Row', 'reps,weight'),
('Pull Up (Assisted)', 'reps,weight'),
('Chest Dip (Assisted)', 'reps,weight'),
('Butterfly (Pec Deck)', 'reps,weight'),
('Sled Push', 'distance,weight'),
('sled back peddle pull', 'reps,weight'),
('Nordic Hamstrings Curls', 'reps'),
('Dumbbell Step Up', 'reps,weight'),
('Lateral Lunges (weighted)', 'reps,weight'),
('single leg box jump', 'reps,height'),
('Cable Core Palloff Press', 'reps,weight'),
('Hip flexor Lift', 'reps,weight'),
('Cable Twist Flat', 'reps,weight'),
('Bicep Curl (Cable)', 'reps,weight'),
('Triceps Pushdown', 'reps,weight'),
('Chest Press (Band)', 'reps,weight'),
('Hip Adduction (Machine)', 'reps,weight'),
('Hip Abduction (Machine)', 'reps,weight'),
('Walking Lunge (Dumbbell)', 'reps,weight,distance'),
('Single Leg Glute Bridge', 'reps,weight'),
('Mountain Climber', 'reps'),
('Reverse Lunge', 'reps'),
('Shoulder Press (Dumbbell)', 'reps,weight'),
('Single Leg Romanian Deadlift (Dumbbell)', 'reps,weight'),
('Plank', 'duration'),
('Bulgarian Split Squat', 'reps,weight'),
('Bench Press - Close Grip (Barbell)', 'reps,weight'),
('Overhead Press (Barbell)', 'reps,weight'),
('Lat Pulldown (Cable)', 'reps,weight'),
('Lateral Raise (Dumbbell)', 'reps,weight'),
('Bicep Curl (Dumbbell)', 'reps,weight'),
('Chest Fly (Dumbbell)', 'reps,weight'),
('Bent Over Row (Dumbbell)', 'reps,weight'),
('Skullcrusher (Dumbbell)', 'reps,weight'),
('Pistol Squat', 'reps,height'),
('Decline Crunch', 'reps'),
('Back Extension (Hyperextension)', 'reps'),
('Band Assisted High jump', 'reps,height'),
('Single Leg Press (Machine)', 'reps,weight'),
('Hip Thrust (Machine)', 'reps,weight'),
('Front Raise (Dumbbell)', 'reps,weight'),
('Standing Calf Raise (Dumbbell)', 'reps,weight'),
('Back Extension (Weighted Hyperextension)', 'reps,weight'),
('Chin Up (Assisted)', 'reps,weight'),
('Overhead Press (Dumbbell)', 'reps,weight'),
('Dead Bug', 'reps'),
('Bent Over Row (Barbell)', 'reps,weight'),
('Incline Bench Press (Dumbbell)', 'reps,weight')
ON CONFLICT (name) DO NOTHING;

-- Import workout data from workout_data.csv
DO $$
DECLARE
    workout_id_var INTEGER;
    workout_exercise_id_var INTEGER;
BEGIN
    -- Workout 1: Compound Upper
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

    -- Workout 2: Morning workout ☀️
    INSERT INTO workouts (user_id, date, start_time, end_time, notes) VALUES (1, '2025-07-02', '06:39:00', '07:46:00', '') RETURNING id INTO workout_id_var;
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Sled Push'), 1) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, distance_m, weight_kg) VALUES (workout_exercise_id_var, 1, 490.83, 0.00);
    INSERT INTO workout_sets (workout_exercise_id, set_number, distance_m, weight_kg) VALUES (workout_exercise_id_var, 2, 490.83, 0.00);
    INSERT INTO workout_sets (workout_exercise_id, set_number, distance_m, weight_kg) VALUES (workout_exercise_id_var, 3, 490.83, 0.00);
    INSERT INTO workout_sets (workout_exercise_id, set_number, distance_m, weight_kg) VALUES (workout_exercise_id_var, 4, 450.62, 0.00);
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'sled back peddle pull'), 2) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 1, NULL, 138.35);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 2, NULL, 138.35);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 3, NULL, 138.35);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 4, NULL, 127.01);
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Nordic Hamstrings Curls'), 3) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps) VALUES (workout_exercise_id_var, 1, 10);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps) VALUES (workout_exercise_id_var, 2, 10);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps) VALUES (workout_exercise_id_var, 3, 10);
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Dumbbell Step Up'), 4) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 1, 10, 15.88);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 2, 10, 15.88);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 3, 10, 15.88);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 4, 10, 15.88);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 5, 10, 15.88);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES (workout_exercise_id_var, 6, 10, 15.88);
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'Lateral Lunges (weighted)'), 5) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg, notes) VALUES (workout_exercise_id_var, 1, 10, 20.41, 'cable fast shuffle');
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg, notes) VALUES (workout_exercise_id_var, 2, 10, 20.41, 'cable fast shuffle');
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg, notes) VALUES (workout_exercise_id_var, 3, 10, 20.41, 'cable fast shuffle');
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg, notes) VALUES (workout_exercise_id_var, 4, 10, 20.41, 'cable fast shuffle');
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg, notes) VALUES (workout_exercise_id_var, 5, 10, 20.41, 'cable fast shuffle');
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg, notes) VALUES (workout_exercise_id_var, 6, 10, 20.41, 'cable fast shuffle');
    INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (workout_id_var, (SELECT id FROM exercises WHERE name = 'single leg box jump'), 6) RETURNING id INTO workout_exercise_id_var;
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps) VALUES (workout_exercise_id_var, 1, 10);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps) VALUES (workout_exercise_id_var, 2, 10);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps) VALUES (workout_exercise_id_var, 3, 10);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps) VALUES (workout_exercise_id_var, 4, 10);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps) VALUES (workout_exercise_id_var, 5, 10);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps) VALUES (workout_exercise_id_var, 6, 10);
    INSERT INTO workout_sets (workout_exercise_id, set_number, reps) VALUES (workout_exercise_id_var, 7, 10);
END $$;
