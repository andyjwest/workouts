import csv
import psycopg2
import os
from datetime import datetime
from itertools import groupby

# Database connection parameters
DB_PARAMS = {
    "dbname": "workouts",
    "user": "user",
    "password": "password",
    "host": "localhost",
    "port": "5432"
}

EXERCISE_MUSCLE_GROUPS = {
    "Lateral Raise (Cable)": ["Shoulders"],
    "Face Pull": ["Shoulders", "Upper Back"],
    "Bench Press (Dumbbell)": ["Chest", "Shoulders", "Triceps"],
    "Dumbbell Row": ["Back", "Biceps"],
    "Pull Up (Assisted)": ["Back", "Biceps"],
    "Chest Dip (Assisted)": ["Chest", "Triceps", "Shoulders"],
    "Butterfly (Pec Deck)": ["Chest"],
    "Sled Push": ["Quads", "Glutes", "Calves"],
    "sled back peddle pull": ["Quads", "Glutes", "Hamstrings"],
    "Nordic Hamstrings Curls": ["Hamstrings"],
    "Dumbbell Step Up": ["Quads", "Glutes"],
    "Lateral Lunges (weighted)": ["Quads", "Glutes", "Adductors"],
    "Hip flexor Lift": ["Hip Flexors"],
    "Cable Core Palloff Press": ["Core"],
    "Shoulder Press (Dumbbell)": ["Shoulders", "Triceps"],
    "Bulgarian Split Squat": ["Quads", "Glutes", "Hamstrings"],
    "Single Leg Romanian Deadlift (Dumbbell)": ["Hamstrings", "Glutes"],
    "Box Jump": ["Quads", "Glutes", "Calves"],
    "Cable Twist Flat": ["Core", "Obliques"],
    "Lat Pulldown (Cable)": ["Back", "Biceps"],
    "Lunge (Dumbbell)": ["Quads", "Glutes", "Hamstrings"],
    "Back Extension (Weighted Hyperextension)": ["Lower Back", "Glutes", "Hamstrings"],
    "Front Raise (Dumbbell)": ["Shoulders"],
    "Skullcrusher (Dumbbell)": ["Triceps"],
    "Chest Fly (Dumbbell)": ["Chest"],
    "Bent Over Row (Dumbbell)": ["Back", "Biceps"],
    "Overhead Press (Dumbbell)": ["Shoulders", "Triceps"],
    "Bicep Curl (Dumbbell)": ["Biceps"],
    "Single Leg Press (Machine)": ["Quads", "Glutes"],
    "Hip Thrust (Machine)": ["Glutes", "Hamstrings"],
    "Standing Calf Raise (Dumbbell)": ["Calves"],
    "Dead Bug": ["Core"],
    "Chin Up (Assisted)": ["Back", "Biceps"],
    "Bench Press - Close Grip (Barbell)": ["Chest", "Triceps"],
    "Overhead Press (Barbell)": ["Shoulders", "Triceps"],
    "Triceps Pushdown": ["Triceps"],
    "Bicep Curl (Cable)": ["Biceps"],
    "Chest Press (Band)": ["Chest", "Shoulders", "Triceps"],
    "Mountain Climber": ["Core", "Quads"],
    "Reverse Lunge": ["Quads", "Glutes", "Hamstrings"],
    "Hip Adduction (Machine)": ["Adductors"],
    "Hip Abduction (Machine)": ["Abductors"],
    "Pistol Squat": ["Quads", "Glutes"],
    "Plank": ["Core"],
    "Decline Crunch": ["Core"]
}

def get_db_connection():
    return psycopg2.connect(**DB_PARAMS)

def parse_float(value):
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def parse_int(value):
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def restore_data():
    conn = get_db_connection()
    cursor = conn.cursor()

    print("Connected to database.")

    # 1. Ensure Muscles Exist
    print("Restoring muscles...")
    unique_muscles = set()
    for muscles in EXERCISE_MUSCLE_GROUPS.values():
        unique_muscles.update(muscles)
    
    for muscle in unique_muscles:
        cursor.execute("INSERT INTO muscles (name) VALUES (%s) ON CONFLICT (name) DO NOTHING", (muscle,))
    
    # 2. Ensure Exercises Exist and Link to Muscles
    print("Restoring exercises...")
    for exercise_name, muscles in EXERCISE_MUSCLE_GROUPS.items():
        # Insert Exercise
        cursor.execute("INSERT INTO exercises (name) VALUES (%s) ON CONFLICT (name) DO NOTHING RETURNING id", (exercise_name,))
        result = cursor.fetchone()
        
        if result:
            exercise_id = result[0]
        else:
            cursor.execute("SELECT id FROM exercises WHERE name = %s", (exercise_name,))
            exercise_id = cursor.fetchone()[0]

        # Link Muscles
        for muscle_name in muscles:
            cursor.execute("SELECT id FROM muscles WHERE name = %s", (muscle_name,))
            muscle_id = cursor.fetchone()[0]
            cursor.execute("""
                INSERT INTO exercise_muscles (exercise_id, muscle_id) 
                VALUES (%s, %s) 
                ON CONFLICT (exercise_id, muscle_id) DO NOTHING
            """, (exercise_id, muscle_id))

    # 3. Import Workouts
    print("Restoring workouts from CSV...")
    with open('workout_data.csv', mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        rows = sorted(reader, key=lambda r: datetime.strptime(r['start_time'].split(',')[0], '%d %b %Y'))
        
        for date_str, day_rows_iter in groupby(rows, key=lambda r: r['start_time'].split(',')[0]):
            day_rows = list(day_rows_iter)
            
            # Parse Dates
            start_dt = datetime.strptime(day_rows[0]['start_time'], '%d %b %Y, %H:%M')
            end_dt = datetime.strptime(day_rows[0]['end_time'], '%d %b %Y, %H:%M')
            
            date_val = start_dt.date()
            start_time_val = start_dt.time()
            end_time_val = end_dt.time()
            notes = day_rows[0]['description']

            # Insert Workout
            cursor.execute("""
                INSERT INTO workouts (user_id, date, start_time, end_time, notes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (1, date_val, start_time_val, end_time_val, notes))
            workout_id = cursor.fetchone()[0]

            # Process Exercises in Workout
            # We need to preserve order, so we iterate through rows
            # But rows are flattened sets. We need to group by exercise within the workout.
            
            # Simple approach: iterate rows, keep track of current exercise to assign sequence
            current_exercise_name = None
            current_workout_exercise_id = None
            sequence = 0
            
            # Group by exercise title to handle sets correctly
            # Note: The CSV structure seems to list sets sequentially for an exercise.
            # However, if an exercise appears multiple times (e.g. superset or circuit), it might be split.
            # For simplicity, we'll assume contiguous blocks for now, or just add as new workout_exercise if it reappears.
            
            for row in day_rows:
                exercise_name = row['exercise_title']
                
                # Check if we need to start a new exercise entry
                if exercise_name != current_exercise_name:
                    current_exercise_name = exercise_name
                    sequence += 1
                    
                    # Get Exercise ID
                    cursor.execute("SELECT id FROM exercises WHERE name = %s", (exercise_name,))
                    res = cursor.fetchone()
                    if not res:
                        # Create if not exists (fallback for exercises not in our map)
                        cursor.execute("INSERT INTO exercises (name) VALUES (%s) RETURNING id", (exercise_name,))
                        ex_id = cursor.fetchone()[0]
                    else:
                        ex_id = res[0]

                    # Insert Workout Exercise
                    cursor.execute("""
                        INSERT INTO workout_exercises (workout_id, exercise_id, sequence)
                        VALUES (%s, %s, %s)
                        RETURNING id
                    """, (workout_id, ex_id, sequence))
                    current_workout_exercise_id = cursor.fetchone()[0]

                # Insert Set
                set_number = parse_int(row.get('set_index'))
                if set_number is None:
                     # Fallback if set_index is missing, though it seems present in CSV
                     set_number = 0 
                
                # Adjust 0-indexed to 1-indexed
                set_number += 1

                reps = parse_int(row.get('reps'))
                weight_lbs = parse_float(row.get('weight_lbs'))
                weight_kg = weight_lbs * 0.453592 if weight_lbs else None
                distance_miles = parse_float(row.get('distance_miles'))
                if distance_miles:
                    # Heuristic: If distance is very large (>20 miles), assume it's actually meters or feet entered in the wrong unit
                    # and don't multiply by 1609.34. 
                    # Max value for NUMERIC(7,2) is 99999.99.
                    # 305 miles * 1609 = 490,848 (overflows)
                    # 305 meters = 305 (fits)
                    if distance_miles > 20: 
                        distance_m = distance_miles
                    else:
                        distance_m = distance_miles * 1609.34
                else:
                    distance_m = None
                duration_sec = parse_int(row.get('duration_seconds'))
                
                cursor.execute("""
                    INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg, distance_m, duration_seconds, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (current_workout_exercise_id, set_number, reps, weight_kg, distance_m, duration_sec, row.get('exercise_notes')))

    conn.commit()
    cursor.close()
    conn.close()
    print("Data restoration complete!")

if __name__ == "__main__":
    restore_data()
