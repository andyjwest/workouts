import requests
import datetime

API_URL = "http://localhost:8900"

def verify_autopopulate():
    # 1. Create a past workout
    print("Creating past workout...")
    past_date = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    workout_res = requests.post(f"{API_URL}/workouts/", json={
        "user_id": 1,
        "date": past_date,
        "start_time": "10:00:00",
        "notes": "Past Workout"
    })
    if workout_res.status_code != 200:
        print(f"Failed to create workout: {workout_res.text}")
        return
    workout_id = workout_res.json()['id']
    print(f"Created workout ID: {workout_id}")

    # 2. Add an exercise (e.g., Squat, ID 1 usually, or let's pick one from DB)
    # Let's assume exercise ID 28 (Sled/Bike/Walk from previous context) or just pick one.
    exercise_id = 28 
    
    print(f"Adding exercise {exercise_id} to workout...")
    we_res = requests.post(f"{API_URL}/workout_exercises/", json={
        "workout_id": workout_id,
        "exercise_id": exercise_id,
        "sequence": 1
    })
    if we_res.status_code != 200:
        print(f"Failed to add exercise: {we_res.text}")
        return
    we_id = we_res.json()['id']

    # 3. Add a set with specific values
    print("Adding set 1 with 100lbs, 10 reps...")
    ws_res = requests.post(f"{API_URL}/workout_sets/", json={
        "workout_exercise_id": we_id,
        "set_number": 1,
        "reps": 10,
        "weight_kg": 100
    })
    if ws_res.status_code != 200:
        print(f"Failed to add set: {ws_res.text}")
        return

    # 4. Create a "current" workout (to simulate active session)
    print("Creating current workout...")
    current_res = requests.post(f"{API_URL}/workouts/", json={
        "user_id": 1,
        "date": datetime.date.today().isoformat(),
        "start_time": "12:00:00",
        "notes": "Current Workout"
    })
    current_workout_id = current_res.json()['id']
    print(f"Created current workout ID: {current_workout_id}")

    # 5. Call the endpoint
    print("Calling get_last_set endpoint...")
    url = f"{API_URL}/exercises/{exercise_id}/last_set?set_number=1&current_workout_id={current_workout_id}"
    res = requests.get(url)
    
    if res.status_code == 200:
        data = res.json()
        print(f"Response: {data}")
        if data and data['weight_kg'] == 100 and data['reps'] == 10:
            print("SUCCESS: Retrieved correct values.")
        else:
            print("FAILURE: Incorrect values returned.")
    else:
        print(f"FAILURE: Endpoint returned {res.status_code} - {res.text}")

if __name__ == "__main__":
    verify_autopopulate()
