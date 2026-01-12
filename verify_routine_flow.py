import requests
import datetime

API_URL = "http://localhost:8888"

def verify():
    # 1. Create Routine
    print("Creating routine...")
    try:
        res = requests.post(f"{API_URL}/routines/", json={
            "user_id": 1,
            "name": "Test Split",
            "description": "Verification Routine"
        })
        if res.status_code != 200:
            print(f"Failed to create routine: {res.text}")
            return
        routine = res.json()
        print(f"Routine created: {routine['id']}")

        # 2. Add Day (Current Day)
        # Python weekday: 0=Mon, 6=Sun. Matches our DB.
        today_dow = datetime.date.today().weekday()
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        print(f"Adding day: {days[today_dow]} ({today_dow})")
        
        res = requests.post(f"{API_URL}/routine_days/", json={
            "routine_id": routine['id'],
            "name": f"{days[today_dow]} Workout",
            "day_of_week": today_dow
        })
        if res.status_code != 200:
            print(f"Failed to create routine day: {res.text}")
            return
        day = res.json()
        print(f"Day created: {day['id']}")

        # 3. Add Exercise
        # Get an exercise first
        res = requests.get(f"{API_URL}/exercises/")
        exercises = res.json()
        if not exercises:
            # Create one
            res = requests.post(f"{API_URL}/exercises/", json={
                "name": "Test Pushup",
                "type": "Strength",
                "tracked_metrics": "reps,weight"
            })
            exercise = res.json()
        else:
            exercise = exercises[0]
            
        print(f"Adding exercise: {exercise['name']} ({exercise['id']})")
        res = requests.post(f"{API_URL}/routine_exercises/", json={
            "routine_day_id": day['id'],
            "exercise_id": exercise['id'],
            "sequence": 1,
            "suggested_sets": 3,
            "suggested_reps": "10"
        })
        if res.status_code != 200:
            print(f"Failed to add exercise: {res.text}")
            return
        print("Exercise added.")

        # 4. Verify Suggestion
        print("Checking suggested workout...")
        res = requests.get(f"{API_URL}/workouts/suggested")
        if res.status_code != 200:
            print(f"Failed to get suggestion: {res.text}")
            return
        
        suggestion = res.json()
        if not suggestion:
            print("No suggestion returned!")
            return
            
        print(f"Suggestion received: {suggestion['routine_name']} - {suggestion['day_name']}")
        if suggestion['day_name'] == day['name'] and len(suggestion['exercises']) > 0:
            print("VERIFICATION PASSED!")
        else:
            print("VERIFICATION FAILED: Mismatch or empty exercises.")
            print(suggestion)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
