import psycopg2
from datetime import date

# Database connection parameters (copied from restore_data.py)
DB_PARAMS = {
    "dbname": "workouts",
    "user": "user",
    "password": "password",
    "host": "db",
    "port": "5432"
}

# Configuration
CUTOFF_DATE = date(2025, 12, 1)
SLED_PUSH_ID = 8
SLED_PULL_ID = 9
DEFAULT_WEIGHT_KG = 133.81
DEFAULT_DISTANCE_M = 27.43
DEFAULT_REPS = 1

def get_db_connection():
    return psycopg2.connect(**DB_PARAMS)

def backfill_sled_exercises():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print(f"Backfilling Sled Push/Pull for workouts before {CUTOFF_DATE}...")
    
    # Get all workouts before cutoff
    cursor.execute("SELECT id, date FROM workouts WHERE date < %s ORDER BY date DESC", (CUTOFF_DATE,))
    workouts = cursor.fetchall()
    
    print(f"Found {len(workouts)} workouts to process.")
    
    updated_count = 0
    
    for workout_id, workout_date in workouts:
        # Get existing exercises for this workout
        cursor.execute("""
            SELECT id, exercise_id, sequence 
            FROM workout_exercises 
            WHERE workout_id = %s 
            ORDER BY sequence ASC
        """, (workout_id,))
        existing_exercises = cursor.fetchall()
        
        existing_exercise_ids = [e[1] for e in existing_exercises]
        
        has_push = SLED_PUSH_ID in existing_exercise_ids
        has_pull = SLED_PULL_ID in existing_exercise_ids
        
        if has_push and has_pull:
            # Already has both, just ensure they are at the start?
            # User request: "for each day of exercises ... make sure there is a sled push and a sled pull to start the workout"
            # We will shift them to 1 and 2 if they aren't already, or just leave them if they exist?
            # Simpler approach: If they exist, we assume they are fine or we might duplicate them if we aren't careful.
            # Let's Skip if they BOTH exist to avoid messing up existing data too much, 
            # UNLESS they are not at the start. 
            # But the prompt implies adding them if missing.
            # Let's focus on ADDING if missing. 
            # If partially present, we'll ensure the missing one is added.
            pass

        # Calculate shift needed
        # We want Sled Push at 1, Sled Pull at 2.
        # Current sequences need to shift by +2 (if both missing) or +1 (if one missing)
        
        # Actually, easiest way is to re-assign sequences for ALL existing exercises starting from 3
        # FILTER OUT existing Sled Push/Pull first to avoid duplicates if we are "moving" them
        
        non_sled_exercises = [e for e in existing_exercises if e[1] not in (SLED_PUSH_ID, SLED_PULL_ID)]
        
        # Shift non-sled exercises to start at sequence 3
        for i, (we_id, ex_id, seq) in enumerate(non_sled_exercises):
            new_seq = i + 3
            if new_seq != seq:
                cursor.execute("UPDATE workout_exercises SET sequence = %s WHERE id = %s", (new_seq, we_id))
        
        # Now handle Sled Push (Seq 1)
        if has_push:
             # Find its ID and update sequence to 1
             push_we_id = next(e[0] for e in existing_exercises if e[1] == SLED_PUSH_ID)
             cursor.execute("UPDATE workout_exercises SET sequence = 1 WHERE id = %s", (push_we_id,))
        else:
            # Insert Sled Push
            cursor.execute("""
                INSERT INTO workout_exercises (workout_id, exercise_id, sequence)
                VALUES (%s, %s, 1) RETURNING id
            """, (workout_id, SLED_PUSH_ID))
            we_id = cursor.fetchone()[0]
            
            # Insert Set
            cursor.execute("""
                INSERT INTO workout_sets (workout_exercise_id, set_number, weight_kg, distance_m, reps)
                VALUES (%s, 1, %s, %s, %s)
            """, (we_id, DEFAULT_WEIGHT_KG, DEFAULT_DISTANCE_M, DEFAULT_REPS))
            
        # Now handle Sled Pull (Seq 2)
        if has_pull:
             # Find its ID and update sequence to 2
             pull_we_id = next(e[0] for e in existing_exercises if e[1] == SLED_PULL_ID)
             cursor.execute("UPDATE workout_exercises SET sequence = 2 WHERE id = %s", (pull_we_id,))
        else:
            # Insert Sled Pull
            cursor.execute("""
                INSERT INTO workout_exercises (workout_id, exercise_id, sequence)
                VALUES (%s, %s, 2) RETURNING id
            """, (workout_id, SLED_PULL_ID))
            we_id = cursor.fetchone()[0]
            
            # Insert Set
            cursor.execute("""
                INSERT INTO workout_sets (workout_exercise_id, set_number, weight_kg, distance_m, reps)
                VALUES (%s, 1, %s, %s, %s)
            """, (we_id, DEFAULT_WEIGHT_KG, DEFAULT_DISTANCE_M, DEFAULT_REPS))
            
        updated_count += 1
        
    conn.commit()
    print(f"Successfully updated/backfilled {updated_count} workouts.")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    backfill_sled_exercises()
