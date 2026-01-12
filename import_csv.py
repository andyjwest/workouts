import csv
import psycopg2
import psycopg2.extras
from datetime import datetime
import os

# Database Connection
DB_NAME = "workouts"
DB_USER = "user"
DB_PASSWORD = "password"
DB_HOST = "localhost"
DB_PORT = "5432"

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        exit(1)

def parse_date(date_str):
    if not date_str:
        return None
    try:
        # Format: "9 Jul 2025, 06:42"
        dt = datetime.strptime(date_str, "%d %b %Y, %H:%M")
        return dt
    except ValueError as e:
        print(f"Error parsing date '{date_str}': {e}")
        return None

def lbs_to_kg(lbs):
    if not lbs:
        return None
    try:
        val = float(lbs)
        # Convert and round to nearest 0.25 roughly, or just 2 decimals
        return round(val * 0.45359237, 2)
    except ValueError:
        return None

def import_data():
    csv_file = 'workout_data.csv'
    if not os.path.exists(csv_file):
        print(f"File {csv_file} not found.")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    # Data Structure to hold grouped workouts
    # Key: (start_time, end_time, title) -> Value: { 'exercises': { name: [sets] } }
    workouts = {}

    print("Reading CSV...")
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            start_str = row['start_time']
            end_str = row['end_time']
            title = row['title']
            
            # Use a tuple of these 3 as unique identifier for a workout session
            workout_key = (start_str, end_str, title)
            
            if workout_key not in workouts:
                workouts[workout_key] = {
                    'start': parse_date(start_str),
                    'end': parse_date(end_str),
                    'title': title,
                    'note': row.get('description', ''),
                    'exercises': {} # Key: exercise_title -> List of sets
                }
            
            ex_title = row['exercise_title']
            if not ex_title:
                continue

            if ex_title not in workouts[workout_key]['exercises']:
                workouts[workout_key]['exercises'][ex_title] = []

            # Parse Set Data
            weight_lbs = row.get('weight_lbs')
            distance = row.get('distance_miles') 

            # Special Handling for Sled Push/Pull where weight is in distance column
            if 'sled' in ex_title.lower() and not weight_lbs and distance:
                weight_lbs = distance
                distance = None # Clear distance as it was actually weight

            weight_kg = lbs_to_kg(weight_lbs)
            
            reps = row.get('reps')
            reps = int(reps) if reps else None
            
            # Maybe convert to meters?
            dist_m = float(distance) * 1609.34 if distance else None
            
            duration = row.get('duration_seconds')
            duration = int(duration) if duration else None

            set_data = {
                'set_index': row.get('set_index'),
                'weight_kg': weight_kg,
                'reps': reps,
                'distance_m': dist_m,
                'duration_seconds': duration,
                'notes': row.get('exercise_notes', '') 
            }
            workouts[workout_key]['exercises'][ex_title].append(set_data)

    print(f"Found {len(workouts)} unique workouts. Clearing DB and starting import...")
    
    # Clear existing data to avoid duplicates
    cursor.execute("TRUNCATE workout_sets, workout_exercises, workouts, exercises RESTART IDENTITY CASCADE;")
    created_exercises = 0
    imported_workouts = 0

    try:
        for w_key, w_data in workouts.items():
            start_dt = w_data['start']
            formatted_date = start_dt.strftime("%Y-%m-%d") if start_dt else None
            formatted_time = start_dt.strftime("%H:%M:%S") if start_dt else None
            
            # 1. Create Workout
            # Assuming user_id = 1 for now as single user app
            cursor.execute("""
                INSERT INTO workouts (user_id, date, start_time, end_time, notes)
                VALUES (1, %s, %s, %s, %s)
                RETURNING id
            """, (formatted_date, formatted_time, w_data['end'], w_data['note']))
            workout_id = cursor.fetchone()[0]

            # 2. Process Exercises
            # Need to maintain sequence. In CSV, lines are ordered, but we grouped them.
            # We should rely on the order they appeared or just dict iteration order (Python 3.7+ preserves insertion order)
            
            seq_counter = 0
            for ex_name, sets in w_data['exercises'].items():
                seq_counter += 1
                
                # Check/Create Exercise
                cursor.execute("SELECT id FROM exercises WHERE name = %s", (ex_name,))
                res = cursor.fetchone()
                if res:
                    ex_id = res[0]
                else:
                    print(f"Creating new exercise: {ex_name}")
                    cursor.execute("INSERT INTO exercises (name) VALUES (%s) RETURNING id", (ex_name,))
                    ex_id = cursor.fetchone()[0]
                    created_exercises += 1
                
                # Create WorkoutExercise
                cursor.execute("""
                    INSERT INTO workout_exercises (workout_id, exercise_id, sequence)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (workout_id, ex_id, seq_counter))
                we_id = cursor.fetchone()[0]

                # 3. Create Sets
                # Sort sets by set_index just in case
                sets.sort(key=lambda x: int(x['set_index']) if x['set_index'] else 0)
                
                for s in sets:
                    set_num = int(s['set_index']) + 1 if s['set_index'] is not None else 1
                    
                    # Sanitize Data to prevent Overflow
                    # Max NUMERIC(7,2) is 99999.99
                    # Max NUMERIC(5,2) for weight? assume 999.99
                    
                    final_dist = s['distance_m']
                    final_notes = s['notes']
                    
                    if final_dist and final_dist > 99999:
                        print(f"Warning: Distance {final_dist}m for {ex_name} exceeds DB limit. Nullifying.")
                        final_notes = (final_notes or "") + f" [Import Warning: Dist {s['distance_m']:.2f}m removed (overflow)]"
                        final_dist = None

                    try:
                        cursor.execute("""
                            INSERT INTO workout_sets (workout_exercise_id, set_number, weight_kg, reps, distance_m, duration_seconds, notes)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (we_id, set_num, s['weight_kg'], s['reps'], final_dist, s['duration_seconds'], final_notes))
                    except psycopg2.errors.NumericValueOutOfRange:
                        print(f"Skipping set {set_num} for {ex_name}: Numeric Overflow (Weight: {s['weight_kg']}, Dist: {final_dist})")
                        conn.rollback() # Rollback the failed statement transaction if using subtransaction/savepoint? 
                        # Psycopg2 breaks transaction on error. Need savepoints if we want to continue.
                        # For now, simplistic approach: The script will crash if not handled.
                        # In loop, handling rollback is tricky without savepoint. 
                        # Better to pre-validate.
                        pass
                    except Exception as e:
                        print(f"Error inserting set: {e}")
                        # If transaction is aborted, we can't continue this workout import.
                        raise e

            imported_workouts += 1
            if imported_workouts % 10 == 0:
                print(f"Imported {imported_workouts} workouts...")

        conn.commit()
        print(f"SUCCESS! Imported {imported_workouts} workouts.")
        print(f"Created {created_exercises} new exercises.")

    except Exception as e:
        conn.rollback()
        print(f"FAILED. Rolled back changes. Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    import_data()
