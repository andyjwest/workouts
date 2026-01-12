import csv
import json
from datetime import datetime
from itertools import groupby

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

def parse_float(value):
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0

def parse_int(value):
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0

def get_exercise_type(row):
    if row.get('duration_seconds') or row.get('distance_miles'):
        return 'cardio'
    if 'stretch' in row['exercise_title'].lower() or 'pnf' in row.get('title', '').lower():
        return 'flexibility'
    return 'strength'

def convert_csv_to_json(csv_path, json_path):
    workouts = {}

    with open(csv_path, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        rows = sorted(reader, key=lambda r: datetime.strptime(r['start_time'].split(',')[0], '%d %b %Y'))
        
        for date_str, day_rows_iter in groupby(rows, key=lambda r: r['start_time'].split(',')[0]):
            day_rows = list(day_rows_iter)
            date_obj = datetime.strptime(date_str, '%d %b %Y')
            iso_date = date_obj.strftime('%Y-%m-%d')

            if iso_date not in workouts:
                workouts[iso_date] = {
                    "date": iso_date,
                    "notes": day_rows[0]['description'],
                    "exercises": []
                }

            exercises_today = {}
            for row in day_rows:
                exercise_title = row['exercise_title']
                if exercise_title not in exercises_today:
                    exercises_today[exercise_title] = {
                        "name": exercise_title,
                        "type": get_exercise_type(row),
                        "muscle_group": EXERCISE_MUSCLE_GROUPS.get(exercise_title, []),
                        "category": row.get('title'),
                        "notes": row.get('exercise_notes'),
                        "sets": [],
                        "superset_id": row.get('superset_id')
                    }
                
                set_data = {
                    "reps": parse_int(row.get('reps')),
                    "weight": parse_float(row.get('weight_lbs')),
                    "distance": row.get('distance_miles'),
                    "duration": parse_float(row.get('duration_seconds')) / 60 if row.get('duration_seconds') else None,
                    "rpe": parse_float(row.get('rpe')) if row.get('rpe') else None,
                }
                set_data = {k: v for k, v in set_data.items() if v is not None and v != ''}
                exercises_today[exercise_title]['sets'].append(set_data)

            exercises_grouped_by_superset = {}
            for ex_title, ex_data in exercises_today.items():
                sid = ex_data.get('superset_id')
                if sid and sid != '0':
                    if sid not in exercises_grouped_by_superset:
                        exercises_grouped_by_superset[sid] = []
                    exercises_grouped_by_superset[sid].append(ex_data)
                else:
                    workouts[iso_date]['exercises'].append(ex_data)
            
            for sid, superset_exercises in exercises_grouped_by_superset.items():
                workouts[iso_date]['exercises'].append({
                    "superset": superset_exercises
                })

    with open(json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(list(workouts.values()), jsonfile, indent=2)

if __name__ == '__main__':
    convert_csv_to_json('workout_data.csv', 'converted_workouts.json')
    print("Conversion complete! Check converted_workouts.json")
