import requests
import json
import re

API_URL = "http://localhost:8900"

ROUTINE_NAME = "Weekly Split"
USER_ID = 1

# Data provided by user
# Day, Exercise, Type, Sets, Reps, Tempo/Hold, Weight, Session Notes
raw_data = [
    ("Monday", "Sled Push & Pull", "Warm-up", 3, "35 yards", "", "270 lbs", ""),
    ("Monday", "Massai Jumps", "Plyometrics", 3, "10", "", "", ""),
    ("Monday", "Bounds (or Box Jumps)", "Plyometrics", 3, "20-30m (or 5)", "", "", "40 inch box, jumped again when landing"),
    ("Monday", "ATG Split Squat", "Main Lift", 3, "10 (per side)", "2s down, 5s hold", "", ""),
    ("Monday", "Pullups", "Main Lift", 1, "Failure", "", "", ""),
    ("Monday", "ATG Pushup/Dip", "Main Lift", 1, "Failure", "3s down, 2s hold", "", ""),
    ("Monday", "L-Sit", "Main Lift", 1, "20 (20s total)", "", "", ""),
    ("Monday", "Back Extensions", "Main Lift", 2, "15", "", "", "with band/weight"),
    ("Monday", "Calf Stretch", "Mobility", 1, "60 sec (per side)", "", "", ""),
    ("Monday", "Elephant Walk", "Mobility", 1, "20 (per side)", "", "", ""),
    ("Monday", "Piriformis Push Up", "Mobility", 1, "20 (per side)", "", "", ""),
    ("Monday", "Standing Pancake", "Mobility", 1, "30 sec", "", "", ""),
    ("Monday", "Couch Stretch", "Mobility", 1, "60 sec (per side)", "", "", ""),
    ("Monday", "Straight Leg Calf Raises", "Prehab", 1, "20 (per side)", "", "", ""),
    ("Monday", "Tibialis Raise", "Prehab", 1, "20 (per side)", "", "", ""),
    
    ("Tuesday", "Bike", "Warm-up", 1, "5-10 min", "", "", "Easy pace"),
    ("Tuesday", "Squat", "Main Lift", 3, "5", "5s down, 1s hold", "", ""),
    ("Tuesday", "Row", "Main Lift", 1, "15", "", "", ""),
    ("Tuesday", "Eccentric Nordic", "Main Lift", 2, "5", "5s down", "", ""),
    ("Tuesday", "Powell Raise", "Accessory", 10, "3 (per side)", "2s down, 2s hold", "", ""),
    ("Tuesday", "Trap-3 Raise", "Accessory", 2, "5", "5s down", "", ""),
    ("Tuesday", "Calf Stretch", "Mobility", 1, "60 sec (per side)", "", "", ""),
    ("Tuesday", "Elephant Walk", "Mobility", 1, "20 (per side)", "", "", ""),
    ("Tuesday", "Piriformis Push Up", "Mobility", 1, "20 (per side)", "", "", ""),
    ("Tuesday", "Standing Pancake", "Mobility", 1, "30 sec", "", "", ""),
    ("Tuesday", "Couch Stretch", "Mobility", 1, "60 sec (per side)", "", "", ""),
    ("Tuesday", "KOT Calf Raise", "Prehab", 2, "15 (per side)", "", "", ""),
    ("Tuesday", "Tibialis Raise", "Prehab", 2, "20 (per side)", "", "", ""),
    
    ("Wednesday", "Bike Intervals", "Cardio", 10, "30s sprint / 90s rest", "", "", "Max effort"), # Sets range 10-15 -> 10
    ("Wednesday", "Agility Ladder Drills", "Agility", 2, "", "", "", "e.g., Ickey Shuffle"),
    ("Wednesday", "Cone Drills (5-10-5)", "Agility", 4, "", "", "", "Focus on low hips"), # Sets range 4-6 -> 4
    ("Wednesday", "Lateral Shuffles", "Agility", 2, "10 yds (each way)", "", "", ""), # Sets range 2-3 -> 2
    ("Wednesday", "L-Sit (or Garhammer)", "Core", 1, "20", "", "", ""),
    
    ("Thursday", "Sled/Bike/Walk", "Warm-up", 1, "5-10 min", "", "", "Easy pace"),
    ("Thursday", "Lateral Jumps", "Plyometrics", 3, "5 (each side)", "", "", "Stick the landing"),
    ("Thursday", "Rotational Jumps (90°)", "Plyometrics", 3, "5 (each way)", "", "", ""),
    ("Thursday", "Reverse Step Ups", "Main Lift", 3, "20 (per side)", "", "", "Heel taps"),
    ("Thursday", "Garhammer Raise", "Main Lift", 1, "20", "5s down, 1s hold", "", ""),
    ("Thursday", "DB Seated Goodmorning", "Main Lift", 2, "15", "", "", ""),
    ("Thursday", "Dip", "Accessory", 10, "3", "", "", ""),
    ("Thursday", "External Rotation", "Accessory", 2, "15", "", "", ""),
    ("Thursday", "Calf Stretch", "Mobility", 1, "60 sec (per side)", "", "", ""),
    ("Thursday", "Elephant Walk", "Mobility", 1, "20 (per side)", "", "", ""),
    ("Thursday", "Piriformis Push Up", "Mobility", 1, "20 (per side)", "", "", ""),
    ("Thursday", "Standing Pancake", "Mobility", 1, "30 sec", "", "", ""),
    ("Thursday", "Couch Stretch", "Mobility", 1, "60 sec (per side)", "", "", ""),
    ("Thursday", "Straight Leg Calf Raises", "Prehab", 1, "20 (per side)", "", "", ""),
    ("Thursday", "Tibialis Raise", "Prehab", 1, "20 (per side)", "", "", ""),
    
    ("Friday", "Sled Push & Pull", "Warm-up", 3, "35 yards", "", "270 lbs", ""),
    ("Friday", "Bottom 1/4 Squat", "Main Lift", 3, "5", "", "", ""),
    ("Friday", "DB RDL", "Main Lift", 2, "15", "5s down, 1s hold", "", ""),
    ("Friday", "Pullover", "Main Lift", 1, "20", "", "", ""),
    ("Friday", "Trap-3 Raise Negative", "Main Lift", 2, "5", "", "", ""),
    ("Friday", "Hamstring Curls", "Accessory", 3, "10-15", "", "", ""),
    ("Friday", "Calf Stretch", "Mobility", 1, "60 sec (per side)", "", "", ""),
    ("Friday", "Elephant Walk", "Mobility", 1, "20 (per side)", "", "", ""),
    ("Friday", "Piriformis Push Up", "Mobility", 1, "20 (per side)", "", "", ""),
    ("Friday", "Standing Pancake", "Mobility", 1, "30 sec", "", "", ""),
    ("Friday", "Couch Stretch", "Mobility", 1, "60 sec (per side)", "", "", ""),
    ("Friday", "KOT Calf Raise", "Prehab", 2, "15 (per side)", "", "", "Optional"),
    ("Friday", "Tibialis Raise", "Prehab", 2, "20 (per side)", "", "", "Optional")
]

day_map = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6
}

def get_or_create_exercise(name, type_):
    # Check if exists
    res = requests.get(f"{API_URL}/exercises/")
    exercises = res.json()
    for ex in exercises:
        if ex['name'].lower() == name.lower():
            return ex
    
    # Create
    print(f"Creating exercise: {name}")
    res = requests.post(f"{API_URL}/exercises/", json={
        "name": name,
        "type": type_,
        "tracked_metrics": "reps,weight"
    })
    return res.json()

def run_import():
    # 1. Create Routine
    print(f"Creating routine: {ROUTINE_NAME}")
    res = requests.post(f"{API_URL}/routines/", json={
        "user_id": USER_ID,
        "name": ROUTINE_NAME,
        "description": "Imported from user request"
    })
    routine = res.json()
    
    # 2. Process Data
    # Group by day to create RoutineDay first
    days_data = {}
    for row in raw_data:
        day_name = row[0]
        if day_name not in days_data:
            days_data[day_name] = []
        days_data[day_name].append(row)
        
    for day_name, exercises in days_data.items():
        day_dow = day_map.get(day_name)
        if day_dow is None:
            print(f"Skipping unknown day: {day_name}")
            continue
            
        print(f"Creating day: {day_name}")
        res = requests.post(f"{API_URL}/routine_days/", json={
            "routine_id": routine['id'],
            "name": f"{day_name} Workout",
            "day_of_week": day_dow
        })
        day = res.json()
        
        for i, row in enumerate(exercises):
            # Day, Exercise, Type, Sets, Reps, Tempo/Hold, Weight, Session Notes
            ex_name = row[1]
            ex_type = row[2]
            sets = row[3]
            reps = row[4]
            tempo = row[5]
            weight = row[6]
            notes = row[7]
            
            # Get/Create Exercise
            exercise = get_or_create_exercise(ex_name, ex_type)
            
            # Create Routine Exercise
            # Combine notes and tempo into description or just use fields?
            # We have suggested_reps, suggested_sets.
            # We don't have a specific field for 'suggested_tempo' in RoutineExercise yet, 
            # but we can put it in reps or maybe we should have added it.
            # For now, let's put extra info in reps string if needed or just ignore tempo if no field.
            # Actually, let's check the model. 
            # RoutineExercise: suggested_sets, suggested_reps, suggested_weight_percent, rest_period_seconds.
            # No tempo or notes.
            # We can append tempo to reps string for display: "10 (2s down...)"
            
            reps_str = str(reps)
            if tempo:
                reps_str += f" ({tempo})"
            if notes:
                reps_str += f" [{notes}]"
            
            # Parse time from reps string
            seconds = 0
            match = re.search(r'(\d+)\s*sec', str(reps), re.IGNORECASE)
            if match:
                seconds = int(match.group(1))
            else:
                 match_min = re.search(r'(\d+)\s*min', str(reps), re.IGNORECASE)
                 if match_min:
                     seconds = int(match_min.group(1)) * 60
                
            if seconds > 0:
                print(f"  Adding exercise: {ex_name} (Group: {ex_type}) - Time: {seconds}s")
            else:
                print(f"  Adding exercise: {ex_name} (Group: {ex_type})")
                
            requests.post(f"{API_URL}/routine_exercises/", json={
                "routine_day_id": day['id'],
                "exercise_id": exercise['id'],
                "sequence": i + 1,
                "suggested_sets": int(sets) if isinstance(sets, int) else 3,
                "suggested_reps": reps_str,
                "suggested_time_seconds": seconds if seconds > 0 else None,
                "group_name": ex_type # Use 'Type' as group name
            })

    print("Import complete!")

if __name__ == "__main__":
    run_import()
