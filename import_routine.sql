-- Insert new exercises from the Pro and Speed workout plans, ignoring duplicates
INSERT INTO exercises (name, tracked_metrics) VALUES
('Backwards Walking', 'duration'),
('Pullups', 'reps,weight'),
('ATG Split Squat', 'reps,weight'),
('L-Sit', 'duration'),
('Back Extensions', 'reps,weight'),
('ATG Pushup/Dip', 'reps,weight'),
('Calf Stretch', 'duration'),
('Elephant Walk', 'reps'),
('Piriformis Push Up', 'reps'),
('Standing Pancake', 'duration'),
('Couch Stretch', 'duration'),
('Straight Leg Calf Raises', 'reps'),
('Tibialis Raise', 'reps'),
('Row', 'reps'),
('Squat', 'reps,weight'),
('QL Extensions', 'reps'),
('Eccentric Nordic', 'reps'),
('Shoulder Press', 'reps,weight'),
('KOT Calf Raise', 'reps'),
('Band Pullapart', 'reps'),
('Reverse Step Ups', 'reps,weight'),
('Garhammer Raise', 'reps'),
('DB Seated Goodmorning', 'reps,weight'),
('ATG Incline Press', 'reps,weight'),
('Pullover', 'reps,weight'),
('Bottom 1/4 Squat', 'reps,weight'),
('DB RDL', 'reps,weight'),
('Trap-3 Raise Negative', 'reps,weight'),
('Sled', 'distance,weight'),
('Nordic Eccentric', 'reps'),
('Powell Raise', 'reps'),
('Peterson Step Up', 'reps,weight'),
('Hip Flexors', 'reps'),
('Butterfly Stretch', 'duration'),
('Hammer Curl', 'reps,weight'),
('Sprint', 'distance'),
('Romanian Deadlift', 'reps,weight'),
('Dip', 'reps,weight'),
('Split Squat', 'reps,weight'),
('Seated Goodmorning', 'reps,weight'),
('Jefferson Curl', 'reps,weight'),
('QL Extension', 'reps'),
('External Rotation', 'reps'),
('Neck Press', 'reps,weight'),
('Hamstring Curls', 'reps,weight')
ON CONFLICT (name) DO NOTHING;

-- Create the routines for the "Pro" and "Speed" programs

DO $$
DECLARE
    routine_id_var INTEGER;
BEGIN
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

    -- Monday Routine
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

    -- Tuesday Routine
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

    -- Wednesday Routine
    INSERT INTO routines (user_id, name, description) VALUES (1, 'ATG - Wednesday', 'Cardio and agility day.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Bike Intervals'), 1, 10, '30s sprint / 90s rest'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Agility Ladder Drills'), 2, 2, ''),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Cone Drills (5-10-5)'), 3, 4, ''),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Lateral Shuffles'), 4, 2, '10 yds (each way)'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'L-Sit'), 5, 1, '20');

    -- Thursday Routine
    INSERT INTO routines (user_id, name, description) VALUES (1, 'ATG - Thursday', 'Plyometrics and accessory work.') RETURNING id INTO routine_id_var;
    INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps) VALUES
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Sled/Bike/Walk'), 1, 1, '5-10 min'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Lateral Jumps'), 2, 3, '5 (each side)'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Rotational Jumps (90°)'), 3, 3, '5 (each way)'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Reverse Step Ups'), 4, 3, '20 (per side)'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Garhammer Raise'), 5, 1, '20'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'DB Seated Goodmorning'), 6, 2, '15'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Dip'), 7, 10, '3'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'External Rotation'), 8, 2, '15'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Calf Stretch'), 9, 1, '60 sec (per side)'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Elephant Walk'), 10, 1, '20 (per side)'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Piriformis Push Up'), 11, 1, '20 (per side)'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Standing Pancake'), 12, 1, '30 sec'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Couch Stretch'), 13, 1, '60 sec (per side)'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Straight Leg Calf Raises'), 14, 1, '20 (per side)'),
                                                                                                          (routine_id_var, (SELECT id FROM exercises WHERE name = 'Tibialis Raise'), 15, 1, '20 (per side)');

    -- Friday Routine
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

END $$;
