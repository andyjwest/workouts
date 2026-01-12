import psycopg2
import os

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        dbname=os.environ.get("DB_NAME", "workouts"),
        user=os.environ.get("DB_USER", "user"),
        password=os.environ.get("DB_PASSWORD", "password"),
        host=os.environ.get("DB_HOST", "localhost"),
        port=os.environ.get("DB_PORT", "5432")
    )
    return conn

def guess_muscles(name):
    name_lower = name.lower()
    muscles = []
    
    # Mapping
    mappings = {
        'squat': ['Quadriceps', 'Glutes', 'Hamstrings'],
        'deadlift': ['Back', 'Hamstrings', 'Glutes'],
        'bench': ['Chest', 'Triceps', 'Shoulders'],
        'press': ['Shoulders', 'Triceps'],
        'pull-up': ['Back', 'Biceps'],
        'chin-up': ['Back', 'Biceps'],
        'row': ['Back', 'Biceps'],
        'curl': ['Biceps'],
        'extension': ['Triceps'],
        'dip': ['Chest', 'Triceps'],
        'lunge': ['Quadriceps', 'Glutes'],
        'raise': ['Shoulders'],
        'crunch': ['Abs'],
        'plank': ['Abs', 'Core'],
        'run': ['Legs', 'Cardio'],
        'jump': ['Legs', 'Cardio'],
        'push-up': ['Chest', 'Triceps', 'Core']
    }
    
    for key, val in mappings.items():
        if key in name_lower:
            muscles.extend(val)
            
    # Default fallback based on type if no match
    if not muscles:
        if 'cardio' in name_lower:
            muscles.append('Cardio')
        elif 'stretch' in name_lower:
            muscles.append('Full Body')
            
    return list(set(muscles)) # Dedupe

def populate():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all exercises
        cursor.execute("SELECT id, name FROM exercises")
        exercises = cursor.fetchall()
        
        # Get all muscles map
        cursor.execute("SELECT name, id FROM muscles")
        muscle_map = {name: mid for name, mid in cursor.fetchall()}
        
        updated_count = 0
        
        for ex_id, name in exercises:
            guessed = guess_muscles(name)
            
            # Clear existing
            cursor.execute("DELETE FROM exercise_muscles WHERE exercise_id = %s", (ex_id,))
            
            for m_name in guessed:
                if m_name in muscle_map:
                    cursor.execute("INSERT INTO exercise_muscles (exercise_id, muscle_id) VALUES (%s, %s)", (ex_id, muscle_map[m_name]))
                elif m_name == 'Legs': # Map Legs to Quads/Hamstrings if generic
                    cursor.execute("INSERT INTO exercise_muscles (exercise_id, muscle_id) VALUES (%s, %s)", (ex_id, muscle_map['Quadriceps']))
                    cursor.execute("INSERT INTO exercise_muscles (exercise_id, muscle_id) VALUES (%s, %s)", (ex_id, muscle_map['Hamstrings']))
            
            if guessed:
                updated_count += 1
            
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Successfully populated muscles for {updated_count} exercises.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    populate()
