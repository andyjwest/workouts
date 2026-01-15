from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Union
import psycopg2
import psycopg2.extras
import os
from datetime import date, time, datetime, timedelta
import httpx
import base64
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from fastapi import UploadFile, File
import csv
import io

load_dotenv()

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="."), name="static")

# Pydantic models based on the new schema
class User(BaseModel):
    id: Optional[int] = None
    username: str
    email: str
    password_hash: Optional[str] = None
    google_id: Optional[str] = None

class UserFitbitAuth(BaseModel):
    user_id: int
    access_token: str
    refresh_token: str
    expires_at: int
    scope: str

class BodyMeasurement(BaseModel):
    id: Optional[int] = None
    user_id: int
    date: date
    body_weight_kg: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    notes: Optional[str] = None

class Exercise(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    type: Optional[str] = None
    equipment: Optional[str] = None
    default_tempo: Optional[str] = None
    default_sets: Optional[int] = None
    default_reps: Optional[str] = None
    default_rest_seconds: Optional[int] = None
    default_weight_percent: Optional[float] = None
    default_time_seconds: Optional[int] = None

    tracked_metrics: str = 'reps,weight'
    muscle_group: Optional[List[str]] = []

class Muscle(BaseModel):
    id: Optional[int] = None
    name: str

class ExerciseMuscle(BaseModel):
    exercise_id: int
    muscle_id: int
    is_primary: bool = True

class Workout(BaseModel):
    id: Optional[int] = None
    user_id: int
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None

class WorkoutExercise(BaseModel):
    id: Optional[int] = None
    workout_id: int
    exercise_id: int
    sequence: int
    group_name: Optional[str] = None

class WorkoutSet(BaseModel):
    id: Optional[int] = None
    workout_exercise_id: int
    set_number: int
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    duration_seconds: Optional[int] = None
    distance_m: Optional[float] = None
    height_cm: Optional[float] = None
    tempo: Optional[str] = None
    notes: Optional[str] = None
    completed: bool = False

class RoutineExercise(BaseModel):
    id: Optional[int] = None
    routine_day_id: int
    exercise_id: int
    sequence: int
    suggested_sets: Optional[int] = None
    suggested_reps: Optional[str] = None
    suggested_weight_percent: Optional[float] = None
    rest_period_seconds: Optional[int] = None
    tempo: Optional[str] = None
    group_name: Optional[str] = None
    suggested_time_seconds: Optional[int] = None

class RoutineDay(BaseModel):
    id: Optional[int] = None
    routine_id: int
    name: str
    day_of_week: Optional[int] = None
    exercises: List[RoutineExercise] = []

class Routine(BaseModel):
    id: Optional[int] = None
    user_id: int
    name: str
    description: Optional[str] = None
    is_active: bool = False
    days: List[RoutineDay] = []

class SetResponse(BaseModel):
    id: Optional[int] = None
    set_number: Optional[int] = None
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    distance_m: Optional[float] = None
    duration_seconds: Optional[int] = None
    notes: Optional[str] = None
    completed: bool = False


class ExerciseResponse(BaseModel):
    id: int
    name: str
    muscle_group: List[str] = []
    sets: List[SetResponse] = []
    group_name: Optional[str] = None
    suggested_sets: Optional[int] = None
    suggested_reps: Optional[str] = None
    suggested_weight_percent: Optional[float] = None
    rest_period_seconds: Optional[int] = None
    tempo: Optional[str] = None
    tracked_metrics: Optional[str] = None

class RoutineDayResponse(BaseModel):
    id: int
    name: str
    day_of_week: Optional[int] = None
    exercises: List[ExerciseResponse] = []

class Superset(BaseModel):
    superset: List[ExerciseResponse]
    group_name: Optional[str] = None

class WorkoutResponse(BaseModel):
    id: int
    user_id: int
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    notes: Optional[str] = None
    exercises: List[Union[ExerciseResponse, Superset]] = []


class SuggestedExercise(BaseModel):
    id: int
    name: str
    muscle_group: List[str] = []
    group_name: Optional[str] = None
    suggested_sets: Optional[int] = None
    suggested_reps: Optional[str] = None
    suggested_weight_percent: Optional[float] = None
    rest_period_seconds: Optional[int] = None
    tempo: Optional[str] = None

class SuggestedWorkout(BaseModel):
    routine_name: str
    day_name: str
    exercises: List[SuggestedExercise]



# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        dbname=os.environ.get("DB_NAME"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        host=os.environ.get("DB_HOST"),
        port=os.environ.get("DB_PORT")
    )
    return conn





@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/users/", response_model=User)
def create_user(user: User):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, google_id) VALUES (%s, %s, %s, %s) RETURNING *",
            (user.username, user.email, user.password_hash, user.google_id)
        )
        new_user_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return User(**new_user_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Routine Exercises ---

@app.post("/routine_exercises/", response_model=RoutineExercise)
def create_routine_exercise(routine_exercise: RoutineExercise):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            """INSERT INTO routine_exercises 
               (routine_day_id, exercise_id, sequence, suggested_sets, suggested_reps, suggested_weight_percent, rest_period_seconds, tempo, group_name) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (routine_exercise.routine_day_id, routine_exercise.exercise_id, routine_exercise.sequence, 
             routine_exercise.suggested_sets, routine_exercise.suggested_reps, routine_exercise.suggested_weight_percent, routine_exercise.rest_period_seconds, routine_exercise.tempo, routine_exercise.group_name)
        )
        new_re_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return RoutineExercise(**new_re_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()
        cursor.close()
        conn.close()
        if user_data is None:
            raise HTTPException(status_code=404, detail="User not found")
        return User(**user_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/", response_model=List[User])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM users")
        users_data = cursor.fetchall()
        cursor.close()
        conn.close()
        return [User(**u) for u in users_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user: User):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "UPDATE users SET username = %s, email = %s, password_hash = %s, google_id = %s WHERE id = %s RETURNING *",
            (user.username, user.email, user.password_hash, user.google_id, user_id)
        )
        updated_user_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if updated_user_data is None:
            raise HTTPException(status_code=404, detail="User not found")
        return User(**updated_user_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s RETURNING id", (user_id,))
        deleted_id = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="User not found")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/body_measurements/", response_model=BodyMeasurement)
def create_body_measurement(body_measurement: BodyMeasurement):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO body_measurements (user_id, date, body_weight_kg, body_fat_percentage, notes) VALUES (%s, %s, %s, %s, %s) RETURNING *",
            (body_measurement.user_id, body_measurement.date, body_measurement.body_weight_kg, body_measurement.body_fat_percentage, body_measurement.notes)
        )
        new_body_measurement_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return BodyMeasurement(**new_body_measurement_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/body_measurements/{body_measurement_id}", response_model=BodyMeasurement)
def get_body_measurement(body_measurement_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM body_measurements WHERE id = %s", (body_measurement_id,))
        body_measurement_data = cursor.fetchone()
        cursor.close()
        conn.close()
        if body_measurement_data is None:
            raise HTTPException(status_code=404, detail="Body measurement not found")
        return BodyMeasurement(**body_measurement_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/body_measurements/", response_model=List[BodyMeasurement])
def get_body_measurements():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM body_measurements")
        body_measurements_data = cursor.fetchall()
        cursor.close()
        conn.close()
        return [BodyMeasurement(**bm) for bm in body_measurements_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/body_measurements/{body_measurement_id}", response_model=BodyMeasurement)
def update_body_measurement(body_measurement_id: int, body_measurement: BodyMeasurement):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "UPDATE body_measurements SET user_id = %s, date = %s, body_weight_kg = %s, body_fat_percentage = %s, notes = %s WHERE id = %s RETURNING *",
            (body_measurement.user_id, body_measurement.date, body_measurement.body_weight_kg, body_measurement.body_fat_percentage, body_measurement.notes, body_measurement_id)
        )
        updated_body_measurement_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if updated_body_measurement_data is None:
            raise HTTPException(status_code=404, detail="Body measurement not found")
        return BodyMeasurement(**updated_body_measurement_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/body_measurements/{body_measurement_id}", status_code=204)
def delete_body_measurement(body_measurement_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM body_measurements WHERE id = %s RETURNING id", (body_measurement_id,))
        deleted_id = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Body measurement not found")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/muscles/", response_model=Muscle)
def create_muscle(muscle: Muscle):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO muscles (name) VALUES (%s) RETURNING *",
            (muscle.name,)
        )
        new_muscle_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return Muscle(**new_muscle_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/muscles/{muscle_id}", response_model=Muscle)
def get_muscle(muscle_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM muscles WHERE id = %s", (muscle_id,))
        muscle_data = cursor.fetchone()
        cursor.close()
        conn.close()
        if muscle_data is None:
            raise HTTPException(status_code=404, detail="Muscle not found")
        return Muscle(**muscle_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/muscles/", response_model=List[Muscle])
def get_muscles():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM muscles")
        muscles_data = cursor.fetchall()
        cursor.close()
        conn.close()
        return [Muscle(**m) for m in muscles_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/muscles/{muscle_id}", response_model=Muscle)
def update_muscle(muscle_id: int, muscle: Muscle):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "UPDATE muscles SET name = %s WHERE id = %s RETURNING *",
            (muscle.name, muscle_id)
        )
        updated_muscle_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if updated_muscle_data is None:
            raise HTTPException(status_code=404, detail="Muscle not found")
        return Muscle(**updated_muscle_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/muscles/{muscle_id}", status_code=204)
def delete_muscle(muscle_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM muscles WHERE id = %s RETURNING id", (muscle_id,))
        deleted_id = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Muscle not found")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/exercise_muscles/", response_model=ExerciseMuscle)
def create_exercise_muscle(exercise_muscle: ExerciseMuscle):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO exercise_muscles (exercise_id, muscle_id, is_primary) VALUES (%s, %s, %s) RETURNING *",
            (exercise_muscle.exercise_id, exercise_muscle.muscle_id, exercise_muscle.is_primary)
        )
        new_exercise_muscle_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return ExerciseMuscle(**new_exercise_muscle_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/exercise_muscles/{exercise_id}/{muscle_id}", response_model=ExerciseMuscle)
def get_exercise_muscle(exercise_id: int, muscle_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM exercise_muscles WHERE exercise_id = %s AND muscle_id = %s", (exercise_id, muscle_id))
        exercise_muscle_data = cursor.fetchone()
        cursor.close()
        conn.close()
        if exercise_muscle_data is None:
            raise HTTPException(status_code=404, detail="Exercise-muscle link not found")
        return ExerciseMuscle(**exercise_muscle_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/exercise_muscles/{exercise_id}/{muscle_id}", status_code=204)
def delete_exercise_muscle(exercise_id: int, muscle_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM exercise_muscles WHERE exercise_id = %s AND muscle_id = %s RETURNING exercise_id", (exercise_id, muscle_id))
        deleted_id = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Exercise-muscle link not found")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/exercises/", response_model=Exercise)
def create_exercise(exercise: Exercise):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO exercises (name, description, type, equipment, default_tempo, tracked_metrics, default_sets, default_reps, default_rest_seconds, default_weight_percent, default_time_seconds) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *",
            (exercise.name, exercise.description, exercise.type, exercise.equipment, exercise.default_tempo, exercise.tracked_metrics, exercise.default_sets, exercise.default_reps, exercise.default_rest_seconds, exercise.default_weight_percent, exercise.default_time_seconds)
        )
        new_exercise_data = dict(cursor.fetchone())
        
        # Handle muscle groups
        if exercise.muscle_group:
            for muscle_name in exercise.muscle_group:
                # Find muscle ID
                cursor.execute("SELECT id FROM muscles WHERE name = %s", (muscle_name,))
                muscle_res = cursor.fetchone()
                if muscle_res:
                    muscle_id = muscle_res[0]
                    cursor.execute("INSERT INTO exercise_muscles (exercise_id, muscle_id) VALUES (%s, %s)", (new_exercise_data['id'], muscle_id))
        
        conn.commit()
        
        # Refetch with muscles
        new_exercise_data['muscle_group'] = exercise.muscle_group
        
        cursor.close()
        conn.close()
        return Exercise(**new_exercise_data)
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=409, detail=f"Exercise with name '{exercise.name}' already exists.")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class DeleteExerciseRequest(BaseModel):
    strategy: str # "delete_all", "migrate_to_existing", "migrate_to_new"
    target_exercise_id: Optional[int] = None
    new_exercise_name: Optional[str] = None

@app.get("/exercises/{exercise_id}/usage")
def get_exercise_usage(exercise_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM workout_exercises WHERE exercise_id = %s", (exercise_id,))
        workout_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM routine_exercises WHERE exercise_id = %s", (exercise_id,))
        routine_count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        return {"workout_count": workout_count, "routine_count": routine_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/exercises/{exercise_id}/delete")
def delete_exercise_with_migration(exercise_id: int, request: DeleteExerciseRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Validation
        if request.strategy == "migrate_to_existing" and not request.target_exercise_id:
             raise HTTPException(status_code=400, detail="Target exercise ID required for migration")
             
        if request.strategy == "migrate_to_new" and not request.new_exercise_name:
             raise HTTPException(status_code=400, detail="New exercise name required for migration")

        target_id = request.target_exercise_id

        # Logic for "migrate_to_new"
        if request.strategy == "migrate_to_new":
             # Fetch source details
             cursor.execute("SELECT * FROM exercises WHERE id = %s", (exercise_id,))
             source = cursor.fetchone()
             if not source:
                 raise HTTPException(status_code=404, detail="Source exercise not found")
                 
             # Insert new
             # We skip muscle mapping copy for now as decided, or we can add it later if needed.
             # Actually, let's copy the basic fields.
             try:
                 cursor.execute(
                    """INSERT INTO exercises (name, description, type, equipment, default_tempo, tracked_metrics, default_sets, default_reps, default_rest_seconds, default_weight_percent, default_time_seconds) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (request.new_exercise_name, source['description'], source['type'], source['equipment'], source['default_tempo'], source['tracked_metrics'], source['default_sets'], source['default_reps'], source['default_rest_seconds'], source['default_weight_percent'], source['default_time_seconds'])
                 )
                 target_id = cursor.fetchone()[0]
                 
                 # Copy muscle associations
                 cursor.execute("SELECT * FROM exercise_muscles WHERE exercise_id = %s", (exercise_id,))
                 muscles = cursor.fetchall()
                 for m in muscles:
                     cursor.execute("INSERT INTO exercise_muscles (exercise_id, muscle_id, is_primary) VALUES (%s, %s, %s)", (target_id, m['muscle_id'], m['is_primary']))
                     
             except psycopg2.errors.UniqueViolation:
                 conn.rollback()
                 raise HTTPException(status_code=409, detail=f"Exercise '{request.new_exercise_name}' already exists")

        # Logic for migration
        if request.strategy in ["migrate_to_existing", "migrate_to_new"]:
            # Migrate Workout History
            cursor.execute("UPDATE workout_exercises SET exercise_id = %s WHERE exercise_id = %s", (target_id, exercise_id))
            
            # Migrate Routines
            cursor.execute("UPDATE routine_exercises SET exercise_id = %s WHERE exercise_id = %s", (target_id, exercise_id))

        # Delete source (Standard delete logic)
        # 1. Delete associations if they still exist (for delete_all case, or cleanup)
        # Note: If migrated, these counts should be 0, but good to be safe.
        
        # Delete from workout_exercises (cascades sets? No, need to check schema. usually sets refer to workout_exercise_id. 
        # If we didn't migrate, we must delete sets first.)
        
        if request.strategy == "delete_all":
             # Delete Sets
             cursor.execute("DELETE FROM workout_sets WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE exercise_id = %s)", (exercise_id,))
             # Delete Workout Exercises
             cursor.execute("DELETE FROM workout_exercises WHERE exercise_id = %s", (exercise_id,))
             # Delete Routine Exercises
             cursor.execute("DELETE FROM routine_exercises WHERE exercise_id = %s", (exercise_id,))
        
        # Delete from exercise_muscles
        cursor.execute("DELETE FROM exercise_muscles WHERE exercise_id = %s", (exercise_id,))
        
        # Delete Exercise
        cursor.execute("DELETE FROM exercises WHERE id = %s RETURNING id", (exercise_id,))
        deleted = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Exercise not found or already deleted")
            
        return {"status": "success", "migrated_to": target_id}

    except HTTPException:
        if 'conn' in locals() and conn:
            conn.rollback()
        raise
    except Exception as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/exercises/{exercise_id}", response_model=Exercise)
def get_exercise(exercise_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        # Fetch with muscles aggregated
        cursor.execute("""
            SELECT e.*, array_remove(array_agg(m.name), NULL) as muscle_group 
            FROM exercises e 
            LEFT JOIN exercise_muscles em ON e.id = em.exercise_id 
            LEFT JOIN muscles m ON em.muscle_id = m.id 
            WHERE e.id = %s
            GROUP BY e.id
        """, (exercise_id,))
        
        exercise_data = cursor.fetchone()
        cursor.close()
        conn.close()
        if exercise_data is None:
            raise HTTPException(status_code=404, detail="Exercise not found")
        return Exercise(**exercise_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/exercises/", response_model=List[Exercise])
def get_exercises():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("""
            SELECT e.*, array_remove(array_agg(m.name), NULL) as muscle_group 
            FROM exercises e 
            LEFT JOIN exercise_muscles em ON e.id = em.exercise_id 
            LEFT JOIN muscles m ON em.muscle_id = m.id 
            GROUP BY e.id
            ORDER BY e.name ASC
        """)
        exercises_data = cursor.fetchall()
        cursor.close()
        conn.close()
        return [Exercise(**e) for e in exercises_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/exercises/{exercise_id}", response_model=Exercise)
def update_exercise(exercise_id: int, exercise: Exercise):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "UPDATE exercises SET name = %s, description = %s, type = %s, equipment = %s, default_tempo = %s, tracked_metrics = %s, default_sets = %s, default_reps = %s, default_rest_seconds = %s, default_weight_percent = %s, default_time_seconds = %s WHERE id = %s RETURNING *",
            (exercise.name, exercise.description, exercise.type, exercise.equipment, exercise.default_tempo, exercise.tracked_metrics, exercise.default_sets, exercise.default_reps, exercise.default_rest_seconds, exercise.default_weight_percent, exercise.default_time_seconds, exercise_id)
        )
        updated_exercise_data = dict(cursor.fetchone())
        
        # Update muscle groups
        # First remove existing
        cursor.execute("DELETE FROM exercise_muscles WHERE exercise_id = %s", (exercise_id,))
        
        # Add new
        if exercise.muscle_group:
            for muscle_name in exercise.muscle_group:
                 # Find muscle ID
                cursor.execute("SELECT id FROM muscles WHERE name = %s", (muscle_name,))
                muscle_res = cursor.fetchone()
                if muscle_res:
                    muscle_id = muscle_res[0]
                    cursor.execute("INSERT INTO exercise_muscles (exercise_id, muscle_id) VALUES (%s, %s)", (exercise_id, muscle_id))
        
        conn.commit()
        
        # Set for return
        updated_exercise_data['muscle_group'] = exercise.muscle_group
        
        cursor.close()
        conn.close()
        if updated_exercise_data is None:
            raise HTTPException(status_code=404, detail="Exercise not found")
        return Exercise(**updated_exercise_data)
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=409, detail=f"Exercise with name '{exercise.name}' already exists.")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/exercises/{exercise_id}", status_code=204)
def delete_exercise(exercise_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM exercises WHERE id = %s RETURNING id", (exercise_id,))
        deleted_id = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Exercise not found")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/routines/", response_model=Routine)
def create_routine(routine: Routine):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO routines (user_id, name, description, is_active) VALUES (%s, %s, %s, %s) RETURNING *",
            (routine.user_id, routine.name, routine.description, routine.is_active)
        )
        new_routine_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return Routine(**new_routine_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _fetch_routine_details(cursor, routine_data):
    routine = dict(routine_data)
    
    # Fetch days
    cursor.execute("SELECT * FROM routine_days WHERE routine_id = %s ORDER BY day_of_week", (routine['id'],))
    days_data = cursor.fetchall()
    
    days = []
    for d in days_data:
        day = dict(d)
        # Fetch exercises for each day
        cursor.execute("SELECT * FROM routine_exercises WHERE routine_day_id = %s ORDER BY sequence", (day['id'],))
        exercises_data = cursor.fetchall()
        day['exercises'] = [dict(e) for e in exercises_data]
        days.append(day)
        
    routine['days'] = days
    return routine

@app.get("/routines/{routine_id}", response_model=Routine)
def get_routine(routine_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM routines WHERE id = %s", (routine_id,))
        routine_data = cursor.fetchone()
        
        if routine_data is None:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Routine not found")
            
        routine = _fetch_routine_details(cursor, routine_data)
        
        cursor.close()
        conn.close()
        return Routine(**routine)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/routines/", response_model=List[Routine])
def get_routines():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM routines")
        routines_data = cursor.fetchall()
        
        routines = []
        for r_data in routines_data:
            routines.append(_fetch_routine_details(cursor, r_data))
            
        cursor.close()
        conn.close()
        return [Routine(**r) for r in routines]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/routines/{routine_id}", response_model=Routine)
def update_routine(routine_id: int, routine: Routine):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "UPDATE routines SET user_id = %s, name = %s, description = %s, is_active = %s WHERE id = %s RETURNING *",
            (routine.user_id, routine.name, routine.description, routine.is_active, routine_id)
        )
        updated_routine_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if updated_routine_data is None:
            raise HTTPException(status_code=404, detail="Routine not found")
        return Routine(**updated_routine_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/routines/{routine_id}", status_code=204)
def delete_routine(routine_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM routines WHERE id = %s RETURNING id", (routine_id,))
        deleted_id = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Routine not found")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/routines/{routine_id}/activate")
def activate_routine(routine_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Set all to false
        cursor.execute("UPDATE routines SET is_active = FALSE")
        # Set target to true
        cursor.execute("UPDATE routines SET is_active = TRUE WHERE id = %s", (routine_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success"}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/workouts/import")
async def import_workouts_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        decoded = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        workouts = {}
        for row in csv_reader:
            start_str = row['start_time']
            end_str = row['end_time']
            title = row['title']
            
            workout_key = (start_str, end_str, title)
            
            if workout_key not in workouts:
                # Helper to parse date
                start_dt = None
                if start_str:
                    try:
                        start_dt = datetime.strptime(start_str, "%d %b %Y, %H:%M") 
                    except ValueError:
                        pass # Handle error or skip
                        
                end_dt = None
                if end_str:
                     try:
                        end_dt = datetime.strptime(end_str, "%d %b %Y, %H:%M")
                     except ValueError:
                        pass

                workouts[workout_key] = {
                    'start': start_dt,
                    'end': end_dt,
                    'title': title,
                    'note': row.get('description', ''),
                    'exercises': {} 
                }
            
            ex_title = row['exercise_title']
            if not ex_title:
                continue

            if ex_title not in workouts[workout_key]['exercises']:
                workouts[workout_key]['exercises'][ex_title] = []

            # Parse Set Data
            weight_lbs = row.get('weight_lbs')
            distance = row.get('distance_miles') 
            
            if 'sled' in ex_title.lower() and not weight_lbs and distance:
                weight_lbs = distance
                distance = None 

            weight_kg = None
            if weight_lbs:
                try:
                    weight_kg = round(float(weight_lbs) * 0.45359237, 2)
                except ValueError:
                    pass
            
            reps = row.get('reps')
            reps = int(reps) if reps else None
            
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

        # Import into DB
        conn = get_db_connection()
        cursor = conn.cursor()
        
        imported_count = 0
        skipped_count = 0
        skipped_details = []
        
        try:
            for w_key, w_data in workouts.items():
                start_dt = w_data['start']
                if not start_dt:
                    skipped_details.append(f"Invalid date for {w_key}")
                    skipped_count += 1
                    continue
                    
                formatted_date = start_dt.strftime("%Y-%m-%d")
                
                # Check for existing workout
                # We define "existing" as same start date and same User (ID 1 for now)
                cursor.execute("SELECT id FROM workouts WHERE date = %s AND user_id = 1", (formatted_date,))
                existing = cursor.fetchone()
                
                if existing:
                    skipped_details.append(f"Skipped {formatted_date}, ID: {existing[0]}")
                    skipped_count += 1
                    continue # Skip if exists
                
                formatted_time = start_dt.strftime("%H:%M:%S")
                
                cursor.execute("""
                    INSERT INTO workouts (user_id, date, start_time, end_time, notes)
                    VALUES (1, %s, %s, %s, %s)
                    RETURNING id
                """, (formatted_date, formatted_time, w_data['end'], w_data['note']))
                workout_id = cursor.fetchone()[0]
                
                seq_counter = 0
                for ex_name, sets in w_data['exercises'].items():
                    seq_counter += 1
                    
                    cursor.execute("SELECT id FROM exercises WHERE name = %s", (ex_name,))
                    res = cursor.fetchone()
                    if res:
                        ex_id = res[0]
                    else:
                        cursor.execute("INSERT INTO exercises (name) VALUES (%s) RETURNING id", (ex_name,))
                        ex_id = cursor.fetchone()[0]
                    
                    cursor.execute("""
                        INSERT INTO workout_exercises (workout_id, exercise_id, sequence)
                        VALUES (%s, %s, %s)
                        RETURNING id
                    """, (workout_id, ex_id, seq_counter))
                    we_id = cursor.fetchone()[0]
                    
                    sets.sort(key=lambda x: int(x['set_index']) if x['set_index'] else 0)
                    
                    for s in sets:
                        set_num = int(s['set_index']) + 1 if s['set_index'] is not None else 1
                        
                        try:
                            cursor.execute("""
                                INSERT INTO workout_sets (workout_exercise_id, set_number, weight_kg, reps, distance_m, duration_seconds, notes)
                                VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """, (we_id, set_num, s['weight_kg'], s['reps'], s['distance_m'], s['duration_seconds'], s['notes']))
                        except Exception as e:
                            print(f"Error inserting set: {e}")
                            pass

                imported_count += 1
            
            conn.commit()
            return {"status": "success", "imported": imported_count, "skipped": skipped_count, "skipped_details": skipped_details}
            
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@app.get("/routines/active/schedule", response_model=List[RoutineDayResponse])
def get_active_routine_schedule(user_id: int = 1):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # 1. Get active routine
        cursor.execute("SELECT * FROM routines WHERE user_id = %s AND is_active = TRUE", (user_id,))
        active_routine = cursor.fetchone()
        
        if not active_routine:
            cursor.close()
            conn.close()
            return []
            
        # 2. Get routine days ordered
        cursor.execute("SELECT * FROM routine_days WHERE routine_id = %s ORDER BY day_of_week", (active_routine['id'],))
        routine_days = cursor.fetchall()
        
        days_response = []
        for day in routine_days:
            # 3. Get exercises for this day
            cursor.execute("""
                SELECT re.id as routine_exercise_id, e.id, e.name, re.group_name,
                       re.suggested_sets, re.suggested_reps, re.suggested_weight_percent, re.rest_period_seconds, re.tempo
                FROM routine_exercises re
                JOIN exercises e ON re.exercise_id = e.id
                WHERE re.routine_day_id = %s
                ORDER BY re.sequence
            """, (day['id'],))
            exercises_data = cursor.fetchall()

            exercises_list = []
            for ex in exercises_data:
                # Fetch muscles (could be optimized)
                cursor.execute("""
                    SELECT m.name
                    FROM exercise_muscles em
                    JOIN muscles m ON em.muscle_id = m.id
                    WHERE em.exercise_id = %s
                """, (ex['id'],))
                muscles = [m['name'] for m in cursor.fetchall()]

                exercises_list.append({
                    "id": ex['id'],
                    "name": ex['name'],
                    "muscle_group": muscles,
                    "sets": [], # Not relevant for schedule preview
                    "group_name": ex['group_name'],
                    "suggested_sets": ex['suggested_sets'],
                    "suggested_reps": ex['suggested_reps'],
                    "suggested_weight_percent": ex['suggested_weight_percent'],
                    "rest_period_seconds": ex['rest_period_seconds'],
                    "tempo": ex['tempo']
                })
            
            days_response.append({
                "id": day['id'],
                "name": day['name'],
                "day_of_week": day['day_of_week'],
                "exercises": exercises_list
            })
            
        cursor.close()
        conn.close()
        
        return days_response

    except Exception as e:
        print(f"Error getting routine schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Routine Days ---

@app.post("/routine_days/", response_model=RoutineDay)
def create_routine_day(routine_day: RoutineDay):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO routine_days (routine_id, name, day_of_week) VALUES (%s, %s, %s) RETURNING *",
            (routine_day.routine_id, routine_day.name, routine_day.day_of_week)
        )
        new_day_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return RoutineDay(**new_day_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/routines/{routine_id}/days", response_model=List[RoutineDay])
def get_routine_days(routine_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM routine_days WHERE routine_id = %s ORDER BY day_of_week", (routine_id,))
        days_data = cursor.fetchall()
        cursor.close()
        conn.close()
        return [RoutineDay(**d) for d in days_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Routine Exercises ---

@app.post("/routine_exercises/", response_model=RoutineExercise)
def create_routine_exercise(routine_exercise: RoutineExercise):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            """INSERT INTO routine_exercises 
               (routine_day_id, exercise_id, sequence, suggested_sets, suggested_reps, suggested_weight_percent, rest_period_seconds, group_name, tempo, suggested_time_seconds) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (routine_exercise.routine_day_id, routine_exercise.exercise_id, routine_exercise.sequence, 
             routine_exercise.suggested_sets, routine_exercise.suggested_reps, routine_exercise.suggested_weight_percent, routine_exercise.rest_period_seconds, routine_exercise.group_name, routine_exercise.tempo, routine_exercise.suggested_time_seconds)
        )
        new_re_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return RoutineExercise(**new_re_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/routine_days/{day_id}/exercises", response_model=List[RoutineExercise])
def get_routine_day_exercises(day_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM routine_exercises WHERE routine_day_id = %s ORDER BY sequence", (day_id,))
        re_data = cursor.fetchall()
        cursor.close()
        conn.close()
        return [RoutineExercise(**re) for re in re_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/exercises/{exercise_id}/last_set")
def get_last_set(exercise_id: int, set_number: int, current_workout_id: Optional[int] = None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Find the most recent workout for this exercise, excluding current workout
        query = """
            SELECT ws.weight_kg, ws.reps
            FROM workout_sets ws
            JOIN workout_exercises we ON ws.workout_exercise_id = we.id
            JOIN workouts w ON we.workout_id = w.id
            WHERE we.exercise_id = %s
              AND ws.set_number = %s
        """
        params = [exercise_id, set_number]
        
        if current_workout_id:
            query += " AND w.id != %s"
            params.append(current_workout_id)
            
        query += " ORDER BY w.date DESC, w.start_time DESC LIMIT 1"
        
        cursor.execute(query, tuple(params))
        data = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if data:
            return {"weight_kg": data['weight_kg'], "reps": data['reps']}
        return None
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Suggestions ---

class SuggestedWorkoutResponse(BaseModel):
    routine_name: str
    day_name: str
    exercises: List[ExerciseResponse]

@app.get("/workouts/suggested", response_model=Optional[SuggestedWorkoutResponse])
def get_suggested_workout(user_id: int = 1): # Hardcoded user_id for now
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # 1. Get current day of week (0=Monday, 6=Sunday)
        # Note: Python's weekday() is 0-6 (Mon-Sun). Postgres extract(isodow) is 1-7 (Mon-Sun).
        # We stored 0-6 in DB.
        today_dow = date.today().weekday()
        
        # 2. Find a routine day for this user and day of week
        # We assume the user has one active routine or we pick the latest created routine.
        cursor.execute("""
            SELECT rd.id as day_id, rd.name as day_name, r.name as routine_name
            FROM routine_days rd
            JOIN routines r ON rd.routine_id = r.id
            WHERE r.user_id = %s AND rd.day_of_week = %s
            ORDER BY r.id DESC
            LIMIT 1
        """, (user_id, today_dow))
        
        day_data = cursor.fetchone()
        
        if not day_data:
            cursor.close()
            conn.close()
            return None
            
        # 3. Get exercises for this day
        cursor.execute("""
            SELECT re.exercise_id, e.name, re.group_name
            FROM routine_exercises re
            JOIN exercises e ON re.exercise_id = e.id
            WHERE re.routine_day_id = %s
            ORDER BY re.sequence
        """, (day_data['day_id'],))
        
        exercises_data = cursor.fetchall()
        
        exercises_list = []
        for ex in exercises_data:
            # We need to fetch muscle groups for each exercise to match ExerciseResponse
            cursor.execute("""
                SELECT m.name
                FROM exercise_muscles em
                JOIN muscles m ON em.muscle_id = m.id
                WHERE em.exercise_id = %s
            """, (ex['exercise_id'],))
            muscles = [m['name'] for m in cursor.fetchall()]
            

            exercises_list.append({
                'id': ex['exercise_id'],
                'name': ex['name'],
                'muscle_group': muscles,
                'sets': [], # No sets yet
                'group_name': ex['group_name']
            })
            
        cursor.close()
        conn.close()
        
        return {
            'routine_name': day_data['routine_name'],
            'day_name': day_data['day_name'],
            'exercises': exercises_list
        }
        
    except Exception as e:
        print(f"Error getting suggested workout: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workouts/", response_model=Workout)
def create_workout(workout: Workout):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO workouts (user_id, date, start_time, end_time, notes) VALUES (%s, %s, %s, %s, %s) RETURNING *",
            (workout.user_id, workout.date, workout.start_time, workout.end_time, workout.notes)
        )
        new_workout_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return Workout(**new_workout_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workouts/active", response_model=Optional[dict])
def get_active_workout():
    try:
        conn = get_db_connection()

        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Find the most recent unfinished workout
        cursor.execute("SELECT * FROM workouts WHERE user_id = 1 AND end_time IS NULL ORDER BY date DESC, start_time DESC LIMIT 1")
        workout_data = cursor.fetchone()
        
        if not workout_data:
            cursor.close()
            conn.close()
            return None
            
        # Check for staleness (older than 24 hours)
        workout_date = workout_data['date']
        workout_start = workout_data['start_time']
        
        if workout_date:
            # If start_time is missing, assume midnight
            check_time = workout_start if workout_start else time.min
            workout_dt = datetime.combine(workout_date, check_time)
            
            if datetime.now() - workout_dt > timedelta(hours=24):
                # Auto-complete the workout
                now_time = datetime.now().time()
                cursor.execute("UPDATE workouts SET end_time = %s WHERE id = %s", (now_time, workout_data['id']))
                conn.commit()
                cursor.close()
                conn.close()
                return None
            

        workout = dict(workout_data)
        
        # Fetch exercises
        cursor.execute("""
            SELECT we.*, e.name as exercise_name, e.tracked_metrics, array_remove(array_agg(m.name), NULL) as muscle_group
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.id
            LEFT JOIN exercise_muscles em ON e.id = em.exercise_id
            LEFT JOIN muscles m ON em.muscle_id = m.id
            WHERE we.workout_id = %s
            GROUP BY we.id, e.name, e.tracked_metrics
            ORDER BY we.sequence
        """, (workout['id'],))
        
        exercises_data = cursor.fetchall()
        
        exercises_list = []
        for ex_data in exercises_data:
            ex = dict(ex_data)
            # Map flattened fields to nested structure if needed, or just use as is for Response
            
            # Fetch sets
            cursor.execute("SELECT * FROM workout_sets WHERE workout_exercise_id = %s ORDER BY set_number", (ex['id'],))
            sets_data = cursor.fetchall()
            
            # We need to construct the `Exercise` object inside `WorkoutExercise`
            # Frontend: `WorkoutExercise` has `exercise: Exercise`.
            
            sets_list = [dict(s) for s in sets_data]
            
            full_ex_obj = {
                "id": ex['exercise_id'],
                "name": ex['exercise_name'],
                "muscle_group": ex['muscle_group'] or [],
                "tracked_metrics": ex['tracked_metrics']
            }
            
            workout_exercise = {
                "id": ex['id'],
                "workout_id": ex['workout_id'],
                "exercise_id": ex['exercise_id'],
                "sequence": ex['sequence'],
                "exercise": full_ex_obj,
                "sets": sets_list
            }
            exercises_list.append(workout_exercise)
            
        workout['exercises'] = exercises_list
        
        cursor.close()
        conn.close()
        
        return workout

    except Exception as e:
        print(f"Error getting active workout: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/workouts/{workout_id}/finish")
def finish_workout(workout_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        current_time = datetime.now().time()
        
        cursor.execute(
            "UPDATE workouts SET end_time = %s WHERE id = %s RETURNING id",
            (current_time, workout_id)
        )
        
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Workout not found")
            
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/workouts/{workout_id}/reopen")
def reopen_workout(workout_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Set end_time to NULL to make it active again
        cursor.execute(
            "UPDATE workouts SET end_time = NULL WHERE id = %s RETURNING id",
            (workout_id,)
        )
        
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Workout not found")
            
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workouts/{workout_id}", response_model=None)
def get_workout(workout_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM workouts WHERE id = %s", (workout_id,))
        workout_data = cursor.fetchone()
        
        if workout_data is None:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Workout not found")
            
        workout = dict(workout_data)
        
        # Borrowed logic from get_active_workout to populate full tree
        # Fetch exercises
        cursor.execute("""
            SELECT we.*, e.name as exercise_name, e.tracked_metrics, array_remove(array_agg(m.name), NULL) as muscle_group
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.id
            LEFT JOIN exercise_muscles em ON e.id = em.exercise_id
            LEFT JOIN muscles m ON em.muscle_id = m.id
            WHERE we.workout_id = %s
            GROUP BY we.id, e.name, e.tracked_metrics
            ORDER BY we.sequence
        """, (workout['id'],))
        
        exercises_data = cursor.fetchall()
        
        exercises_list = []
        for ex_data in exercises_data:
            ex = dict(ex_data)
            
            # Fetch sets
            cursor.execute("SELECT * FROM workout_sets WHERE workout_exercise_id = %s ORDER BY set_number", (ex['id'],))
            sets_data = cursor.fetchall()
            
            sets_list = [dict(s) for s in sets_data]
            
            # Construct Exercise object inside WorkoutExercise
            full_ex_obj = {
                "id": ex['exercise_id'],
                "name": ex['exercise_name'],
                "muscle_group": ex['muscle_group'] or [],
                "tracked_metrics": ex['tracked_metrics']
            }
            
            workout_exercise = {
                "id": ex['id'],
                "workout_id": ex['workout_id'],
                "exercise_id": ex['exercise_id'],
                "sequence": ex['sequence'],
                "exercise": full_ex_obj,
                "sets": sets_list
            }
            exercises_list.append(workout_exercise)

        workout['exercises'] = exercises_list

        cursor.close()
        conn.close()
        return workout
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting workout: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workouts/", response_model=List[WorkoutResponse])
def get_workouts():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # 1. Fetch Workouts
        cursor.execute("SELECT * FROM workouts ORDER BY date DESC, start_time DESC")
        workouts_data = cursor.fetchall()
        
        workouts_map = {}
        for w in workouts_data:
            w_dict = dict(w)
            w_dict['exercises'] = []
            workouts_map[w['id']] = w_dict

        if not workouts_map:
            return []

        workout_ids = tuple(workouts_map.keys())
        
        # 2. Fetch Workout Exercises with Exercise Names
        cursor.execute(f"""
            SELECT we.id, we.workout_id, we.exercise_id, e.name, we.sequence, we.group_name, e.tracked_metrics
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.id
            WHERE we.workout_id IN %s
            ORDER BY we.workout_id, we.sequence
        """, (workout_ids,))
        we_data = cursor.fetchall()
        
        we_map = {} # we_id -> we_dict
        
        # 3. Fetch Muscle Groups for all exercises involved
        # Optimization: Get all exercise IDs first
        exercise_ids = tuple(set(we['exercise_id'] for we in we_data))
        exercise_muscles_map = {}
        if exercise_ids:
            cursor.execute(f"""
                SELECT em.exercise_id, m.name
                FROM exercise_muscles em
                JOIN muscles m ON em.muscle_id = m.id
                WHERE em.exercise_id IN %s
            """, (exercise_ids,))
            em_data = cursor.fetchall()
            for em in em_data:
                if em['exercise_id'] not in exercise_muscles_map:
                    exercise_muscles_map[em['exercise_id']] = []
                exercise_muscles_map[em['exercise_id']].append(em['name'])

        for we in we_data:
            we_dict = {
                'id': we['exercise_id'], # Use exercise_id as id for frontend compatibility? Or we.id? Frontend uses it for lookup?
                # The frontend uses `item.name` mostly.
                'name': we['name'],
                'muscle_group': exercise_muscles_map.get(we['exercise_id'], []),
                'sets': [],
                'we_id': we['id'], # Keep track of internal ID for sets mapping
                'group_name': we['group_name'],
                'tracked_metrics': we['tracked_metrics']
            }
            we_map[we['id']] = we_dict
            workouts_map[we['workout_id']]['exercises'].append(we_dict)

        # 4. Fetch Sets
        if we_map:
            we_ids = tuple(we_map.keys())
            cursor.execute(f"""
                SELECT id, workout_exercise_id, set_number, reps, weight_kg, distance_m, duration_seconds, notes, completed
                FROM workout_sets
                WHERE workout_exercise_id IN %s
                ORDER BY workout_exercise_id, set_number
            """, (we_ids,))
            sets_data = cursor.fetchall()
            
            for s in sets_data:
                we_id = s['workout_exercise_id']
                if we_id in we_map:
                    we_map[we_id]['sets'].append({
                        'id': s['id'],
                        'set_number': s['set_number'],
                        'weight_kg': s['weight_kg'], # Returning kg as weight
                        'reps': s['reps'],
                        'distance_m': s['distance_m'], # Alignment with frontend
                        'duration_seconds': s['duration_seconds'], # Alignment with frontend
                        'notes': s.get('notes'),
                        'completed': s['completed'] or False
                    })

        cursor.close()
        conn.close()
        
        # Post-process to group supersets
        final_workouts = []
        for w in workouts_map.values():
            flat_exercises = w['exercises']
            grouped_exercises = []
            current_superset = None
            
            for ex in flat_exercises:
                group_name = ex.get('group_name')
                if group_name:
                    if current_superset and current_superset.get('group_name') == group_name:
                         # Append to existing superset
                         current_superset['superset'].append(ex)
                    else:
                         # Start new superset
                         current_superset = {
                             'group_name': group_name, 
                             'superset': [ex]
                         }
                         grouped_exercises.append(current_superset)
                else:
                    current_superset = None
                    grouped_exercises.append(ex)
            
            w['exercises'] = grouped_exercises
            final_workouts.append(w)

        return [WorkoutResponse(**w) for w in final_workouts]
    except Exception as e:
        print(f"Error getting workouts: {e}") # Add logging
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/workouts/{workout_id}", response_model=Workout)
def update_workout(workout_id: int, workout: Workout):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "UPDATE workouts SET user_id = %s, date = %s, start_time = %s, end_time = %s, notes = %s WHERE id = %s RETURNING *",
            (workout.user_id, workout.date, workout.start_time, workout.end_time, workout.notes, workout_id)
        )
        updated_workout_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if updated_workout_data is None:
            raise HTTPException(status_code=404, detail="Workout not found")
        return Workout(**updated_workout_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/workouts/{workout_id}", status_code=204)
def delete_workout(workout_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Delete sets
        cursor.execute("""
            DELETE FROM workout_sets 
            WHERE workout_exercise_id IN (
                SELECT id FROM workout_exercises WHERE workout_id = %s
            )
        """, (workout_id,))
        
        # 2. Delete exercises
        cursor.execute("DELETE FROM workout_exercises WHERE workout_id = %s", (workout_id,))
        
        # 3. Delete workout
        cursor.execute("DELETE FROM workouts WHERE id = %s RETURNING id", (workout_id,))
        deleted_id = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Workout not found")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/workout_exercises/", response_model=WorkoutExercise)
def create_workout_exercise(workout_exercise: WorkoutExercise):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO workout_exercises (workout_id, exercise_id, sequence) VALUES (%s, %s, %s) RETURNING *",
            (workout_exercise.workout_id, workout_exercise.exercise_id, workout_exercise.sequence)
        )
        new_workout_exercise_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return WorkoutExercise(**new_workout_exercise_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workout_exercises/{workout_exercise_id}", response_model=WorkoutExercise)
def get_workout_exercise(workout_exercise_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM workout_exercises WHERE id = %s", (workout_exercise_id,))
        workout_exercise_data = cursor.fetchone()
        cursor.close()
        conn.close()
        if workout_exercise_data is None:
            raise HTTPException(status_code=404, detail="Workout exercise not found")
        return WorkoutExercise(**workout_exercise_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workout_exercises/", response_model=List[WorkoutExercise])
def get_workout_exercises():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM workout_exercises")
        workout_exercises_data = cursor.fetchall()
        cursor.close()
        conn.close()
        return [WorkoutExercise(**we) for we in workout_exercises_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/workout_exercises/{workout_exercise_id}", response_model=WorkoutExercise)
def update_workout_exercise(workout_exercise_id: int, workout_exercise: WorkoutExercise):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "UPDATE workout_exercises SET workout_id = %s, exercise_id = %s, sequence = %s WHERE id = %s RETURNING *",
            (workout_exercise.workout_id, workout_exercise.exercise_id, workout_exercise.sequence, workout_exercise_id)
        )
        updated_workout_exercise_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if updated_workout_exercise_data is None:
            raise HTTPException(status_code=404, detail="Workout exercise not found")
        return WorkoutExercise(**updated_workout_exercise_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/workout_exercises/{workout_exercise_id}", status_code=204)
def delete_workout_exercise(workout_exercise_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Delete associated sets first
        cursor.execute("DELETE FROM workout_sets WHERE workout_exercise_id = %s", (workout_exercise_id,))
        
        # 2. Delete the exercise
        cursor.execute("DELETE FROM workout_exercises WHERE id = %s RETURNING id", (workout_exercise_id,))
        deleted_id = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Workout exercise not found")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ReorderRequest(BaseModel):
    workout_exercise_ids: List[int]

@app.post("/workouts/{workout_id}/reorder")
def reorder_workout_exercises(workout_id: int, request: ReorderRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify all belong to the workout? 
        # For simplicity, we just update the sequence for the given IDs if they exist.
        for i, we_id in enumerate(request.workout_exercise_ids):
            cursor.execute(
                "UPDATE workout_exercises SET sequence = %s WHERE id = %s AND workout_id = %s",
                (i + 1, we_id, workout_id)
            )
            
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workout_sets/", response_model=WorkoutSet)
def create_workout_set(workout_set: WorkoutSet):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO workout_sets (workout_exercise_id, set_number, reps, weight_kg, duration_seconds, distance_m, height_cm, tempo, notes, completed) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *",
            (workout_set.workout_exercise_id, workout_set.set_number, workout_set.reps, workout_set.weight_kg, workout_set.duration_seconds, workout_set.distance_m, workout_set.height_cm, workout_set.tempo, workout_set.notes, workout_set.completed)
        )
        new_workout_set_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return WorkoutSet(**new_workout_set_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workout_sets/{workout_set_id}", response_model=WorkoutSet)
def get_workout_set(workout_set_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM workout_sets WHERE id = %s", (workout_set_id,))
        workout_set_data = cursor.fetchone()
        cursor.close()
        conn.close()
        if workout_set_data is None:
            raise HTTPException(status_code=404, detail="Workout set not found")
        return WorkoutSet(**workout_set_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workout_sets/", response_model=List[WorkoutSet])
def get_workout_sets():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM workout_sets")
        workout_sets_data = cursor.fetchall()
        cursor.close()
        conn.close()
        return [WorkoutSet(**ws) for ws in workout_sets_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/workout_sets/{workout_set_id}", response_model=WorkoutSet)
def update_workout_set(workout_set_id: int, workout_set: WorkoutSet):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "UPDATE workout_sets SET workout_exercise_id = %s, set_number = %s, reps = %s, weight_kg = %s, duration_seconds = %s, distance_m = %s, height_cm = %s, tempo = %s, notes = %s, completed = %s WHERE id = %s RETURNING *",
            (workout_set.workout_exercise_id, workout_set.set_number, workout_set.reps, workout_set.weight_kg, workout_set.duration_seconds, workout_set.distance_m, workout_set.height_cm, workout_set.tempo, workout_set.notes, workout_set.completed, workout_set_id)
        )
        updated_workout_set_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if updated_workout_set_data is None:
            raise HTTPException(status_code=404, detail="Workout set not found")
        return WorkoutSet(**updated_workout_set_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/workout_sets/{workout_set_id}", status_code=204)
def delete_workout_set(workout_set_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM workout_sets WHERE id = %s RETURNING id", (workout_set_id,))
        deleted_id = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Workout set not found")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/routine_exercises/", response_model=RoutineExercise)
def create_routine_exercise(routine_exercise: RoutineExercise):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO routine_exercises (routine_id, exercise_id, sequence, suggested_sets, suggested_reps, suggested_weight_percent, rest_period_seconds) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *",
            (routine_exercise.routine_id, routine_exercise.exercise_id, routine_exercise.sequence, routine_exercise.suggested_sets, routine_exercise.suggested_reps, routine_exercise.suggested_weight_percent, routine_exercise.rest_period_seconds)
        )
        new_routine_exercise_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        return RoutineExercise(**new_routine_exercise_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/routine_exercises/{routine_exercise_id}", response_model=RoutineExercise)
def get_routine_exercise(routine_exercise_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM routine_exercises WHERE id = %s", (routine_exercise_id,))
        routine_exercise_data = cursor.fetchone()
        cursor.close()
        conn.close()
        if routine_exercise_data is None:
            raise HTTPException(status_code=404, detail="Routine exercise not found")
        return RoutineExercise(**routine_exercise_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/routine_exercises/", response_model=List[RoutineExercise])
def get_routine_exercises():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM routine_exercises")
        routine_exercises_data = cursor.fetchall()
        cursor.close()
        conn.close()
        return [RoutineExercise(**re) for re in routine_exercises_data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/routine_exercises/{routine_exercise_id}", response_model=RoutineExercise)
def update_routine_exercise(routine_exercise_id: int, routine_exercise: RoutineExercise):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "UPDATE routine_exercises SET routine_id = %s, exercise_id = %s, sequence = %s, suggested_sets = %s, suggested_reps = %s, suggested_weight_percent = %s, rest_period_seconds = %s WHERE id = %s RETURNING *",
            (routine_exercise.routine_id, routine_exercise.exercise_id, routine_exercise.sequence, routine_exercise.suggested_sets, routine_exercise.suggested_reps, routine_exercise.suggested_weight_percent, routine_exercise.rest_period_seconds, routine_exercise_id)
        )
        updated_routine_exercise_data = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if updated_routine_exercise_data is None:
            raise HTTPException(status_code=404, detail="Routine exercise not found")
        return RoutineExercise(**updated_routine_exercise_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/routine_exercises/{routine_exercise_id}", status_code=204)
def delete_routine_exercise(routine_exercise_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM routine_exercises WHERE id = %s RETURNING id", (routine_exercise_id,))
        deleted_id = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if deleted_id is None:
            raise HTTPException(status_code=404, detail="Routine exercise not found")
        return
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Fitbit Integration ---

FITBIT_CLIENT_ID = os.getenv("FITBIT_CLIENT_ID")
FITBIT_CLIENT_SECRET = os.getenv("FITBIT_CLIENT_SECRET")
# Ensure this matches your Fitbit App settings
FITBIT_REDIRECT_URI = "http://localhost:8000/auth/fitbit/callback" 
FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token"
FITBIT_AUTH_URL = "https://www.fitbit.com/oauth2/authorize"

@app.get("/auth/fitbit/login")
def fitbit_login(user_id: int):
    # Scope: weight, heartrate, activity, sleep, profile, location, settings, nutrition, oxygen_saturation, respiratory_rate, temperature
    # We mainly need heartrate and activity (steps)
    scope = "heartrate activity profile"
    params = {
        "response_type": "code",
        "client_id": FITBIT_CLIENT_ID,
        "redirect_uri": FITBIT_REDIRECT_URI,
        "scope": scope,
        "state": str(user_id), # Pass user_id as state
        "expires_in": "604800" # 1 week
    }
    # Construct URL manually to ensure encoding is correct
    url = f"{FITBIT_AUTH_URL}?response_type=code&client_id={FITBIT_CLIENT_ID}&redirect_uri={FITBIT_REDIRECT_URI}&scope={scope}&state={str(user_id)}&expires_in=604800"
    return RedirectResponse(url)

@app.get("/auth/fitbit/callback")
async def fitbit_callback(code: str, state: str):
    user_id = int(state)
    
    # Exchange code for token
    auth_header = base64.b64encode(f"{FITBIT_CLIENT_ID}:{FITBIT_CLIENT_SECRET}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "clientId": FITBIT_CLIENT_ID,
        "grant_type": "authorization_code",
        "redirect_uri": FITBIT_REDIRECT_URI,
        "code": code
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(FITBIT_TOKEN_URL, headers=headers, data=data)
        
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Failed to retrieve token: {response.text}")
        
    token_data = response.json()
    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]
    expires_in = token_data["expires_in"]
    scope = token_data["scope"]
    expires_at = int(time.time()) + expires_in
    
    # Save to DB
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO user_fitbit_auth (user_id, access_token, refresh_token, expires_at, scope)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
            access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            expires_at = EXCLUDED.expires_at,
            scope = EXCLUDED.scope,
            updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, access_token, refresh_token, expires_at, scope)
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # Redirect back to frontend
    return RedirectResponse("http://localhost:5173/management?fitbit_connected=true")

@app.get("/fitbit/status/{user_id}")
def get_fitbit_status(user_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM user_fitbit_auth WHERE user_id = %s", (user_id,))
        record = cursor.fetchone()
        cursor.close()
        conn.close()
        return {"connected": record is not None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def _refresh_fitbit_token(user_id: int, refresh_token: str):
    auth_header = base64.b64encode(f"{FITBIT_CLIENT_ID}:{FITBIT_CLIENT_SECRET}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(FITBIT_TOKEN_URL, headers=headers, data=data)
        
    if response.status_code != 200:
         # Token might be revoked or really expired
         print(f"Failed to refresh token: {response.text}")
         return None
         
    token_data = response.json()
    return token_data

@app.get("/fitbit/heartrate/{user_id}/{date_str}")
async def get_fitbit_heartrate(user_id: int, date_str: str):
    # date_str format: YYYY-MM-DD
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT * FROM user_fitbit_auth WHERE user_id = %s", (user_id,))
        auth_data = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not auth_data:
            raise HTTPException(status_code=404, detail="User not connected to Fitbit")
            
        access_token = auth_data['access_token']
        refresh_token = auth_data['refresh_token']
        expires_at = auth_data['expires_at']
        
        # Check if expired
        if int(time.time()) > expires_at:
            print("Token expired, refreshing...")
            new_tokens = await _refresh_fitbit_token(user_id, refresh_token)
            if new_tokens:
                access_token = new_tokens['access_token']
                # Update DB
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE user_fitbit_auth SET access_token = %s, refresh_token = %s, expires_at = %s WHERE user_id = %s",
                    (new_tokens['access_token'], new_tokens['refresh_token'], int(time.time()) + new_tokens['expires_in'], user_id)
                )
                conn.commit()
                cursor.close()
                conn.close()
            else:
                 raise HTTPException(status_code=401, detail="Token expired and refresh failed")

        # Fetch data
        headers = {"Authorization": f"Bearer {access_token}"}
        # Get Heart Rate Intraday for the day (if we want detailed) or just summary
        # For workout overlay, we probably want intraday. 
        # Note: Intraday might require specific permissions or "Personal" app type.
        # Let's try to get the standard heart rate series.
        # "1min" detail level is usually available for Personal apps.
        url = f"https://api.fitbit.com/1/user/-/activities/heart/date/{date_str}/1d/1min.json"
        
        async with httpx.AsyncClient() as client:
             response = await client.get(url, headers=headers)
             
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Fitbit API error: {response.text}")
            
        return response.json()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
