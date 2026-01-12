import psycopg2

# Database connection parameters
DB_PARAMS = {
    "dbname": "workouts",
    "user": "user",
    "password": "password",
    "host": "db", # Inside docker
    "port": "5432"
}

SLED_PUSH_ID = 8
SLED_PULL_ID = 9
# Default settings for the new entries
SUGGESTED_SETS = 1
SUGGESTED_REPS = "30 yards"

def get_db_connection():
    return psycopg2.connect(**DB_PARAMS)

def update_routines():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("Updating Routines to start with Sled Push and Sled Pull...")
    
    # Get all routine days
    cursor.execute("SELECT id, name FROM routine_days")
    routine_days = cursor.fetchall()
    
    print(f"Found {len(routine_days)} routine days to process.")
    
    updated_count = 0
    
    for rday_id, rday_name in routine_days:
        # Get existing exercises for this routine day
        cursor.execute("""
            SELECT id, exercise_id, sequence 
            FROM routine_exercises 
            WHERE routine_day_id = %s 
            ORDER BY sequence ASC
        """, (rday_id,))
        existing_exercises = cursor.fetchall()
        
        # Identify non-sled exercises
        non_sled_exercises = [e for e in existing_exercises if e[1] not in (SLED_PUSH_ID, SLED_PULL_ID)]
        
        # Shift non-sled exercises to start at sequence 3
        # (Preserve relative order)
        for i, (re_id, ex_id, seq) in enumerate(non_sled_exercises):
            new_seq = i + 3
            if new_seq != seq:
                cursor.execute("UPDATE routine_exercises SET sequence = %s WHERE id = %s", (new_seq, re_id))
        
        # Handle Sled Push (Seq 1)
        # Check if it was already in the list
        existing_push = next((e for e in existing_exercises if e[1] == SLED_PUSH_ID), None)
        if existing_push:
            # Update its sequence to 1
             cursor.execute("UPDATE routine_exercises SET sequence = 1 WHERE id = %s", (existing_push[0],))
        else:
            # Insert new
            cursor.execute("""
                INSERT INTO routine_exercises (routine_day_id, exercise_id, sequence, suggested_sets, suggested_reps)
                VALUES (%s, %s, 1, %s, %s)
            """, (rday_id, SLED_PUSH_ID, SUGGESTED_SETS, SUGGESTED_REPS))

        # Handle Sled Pull (Seq 2)
        existing_pull = next((e for e in existing_exercises if e[1] == SLED_PULL_ID), None)
        if existing_pull:
            # Update its sequence to 2
             cursor.execute("UPDATE routine_exercises SET sequence = 2 WHERE id = %s", (existing_pull[0],))
        else:
            # Insert new
            cursor.execute("""
                INSERT INTO routine_exercises (routine_day_id, exercise_id, sequence, suggested_sets, suggested_reps)
                VALUES (%s, %s, 2, %s, %s)
            """, (rday_id, SLED_PULL_ID, SUGGESTED_SETS, SUGGESTED_REPS))
            
        updated_count += 1
        
    conn.commit()
    print(f"Successfully updated {updated_count} routine days.")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    update_routines()
