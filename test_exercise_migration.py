import requests
import json

BASE_URL = "http://localhost:8001"

def create_exercise(name):
    print(f"Creating exercise '{name}'...")
    res = requests.post(f"{BASE_URL}/exercises/", json={"name": name, "tracked_metrics": "reps,weight"})
    if res.status_code != 200:
        print(f"Failed to create exercise: {res.text}")
        return None
    return res.json()

def create_workout_with_exercise(exercise_id):
    print(f"Creating workout with exercise {exercise_id}...")
    # Create workout
    res = requests.post(f"{BASE_URL}/workouts/", json={"user_id": 1, "date": "2025-01-01"})
    workout = res.json()
    workout_id = workout['id']
    
    # Add exercise
    res = requests.post(f"{BASE_URL}/workout_exercises/", json={"workout_id": workout_id, "exercise_id": exercise_id, "sequence": 1})
    we = res.json()
    
    # Add set
    requests.post(f"{BASE_URL}/workout_sets/", json={"workout_exercise_id": we['id'], "set_number": 1, "reps": 10, "weight_kg": 20})
    return workout_id

def check_usage(exercise_id):
    res = requests.get(f"{BASE_URL}/exercises/{exercise_id}/usage")
    return res.json()

def delete_exercise(exercise_id, strategy, target_id=None, new_name=None):
    payload = {"strategy": strategy}
    if target_id:
        payload["target_exercise_id"] = target_id
    if new_name:
        payload["new_exercise_name"] = new_name
        
    print(f"Deleting exercise {exercise_id} with strategy {strategy}...")
    res = requests.post(f"{BASE_URL}/exercises/{exercise_id}/delete", json=payload)
    if res.status_code != 200:
        print(f"Delete failed: {res.text}")
        return None
    return res.json()

import time

def verify():
    ts = int(time.time())
    # Setup
    source = create_exercise(f"Source Exercise {ts}")
    if not source: return

    workout_id = create_workout_with_exercise(source['id'])
    
    # Check usage
    usage = check_usage(source['id'])
    print(f"Usage for {source['id']}: {usage}")
    if usage['workout_count'] != 1:
        print("ERROR: Workout count mismatch")
        return

    # Test 1: Migrate to New
    print("\n--- Testing Migrate directly to New ---")
    data = delete_exercise(source['id'], "migrate_to_new", new_name=f"Target Exercise New {ts}")
    
    if not data or not data.get('migrated_to'):
        print("Migration failed")
        return
        
    target_new_id = data['migrated_to']
    print(f"Migrated to new ID: {target_new_id}")
    
    # Verify old is gone
    res = requests.get(f"{BASE_URL}/exercises/{source['id']}")
    if res.status_code != 404:
        print(f"ERROR: Source exercise still exists! Status: {res.status_code}, Body: {res.text}")
    else:
        print("Verified: Source exercise deleted.")

    # Verify usage moved
    usage = check_usage(target_new_id)
    print(f"Usage for new target {target_new_id}: {usage}")
    if usage['workout_count'] != 1:
        print("ERROR: Usage didn't migrate to new target")

    # Test 2: Migrate to Existing
    print("\n--- Testing Migrate to Existing ---")
    existing_target = create_exercise(f"Existing Target {ts}")
    
    data = delete_exercise(target_new_id, "migrate_to_existing", target_id=existing_target['id'])
    
    # Verify usage moved to existing
    usage = check_usage(existing_target['id'])
    print(f"Usage for existing target {existing_target['id']}: {usage}")
    if usage['workout_count'] != 1: # Should have the 1 from before
        print("ERROR: Usage didn't migrate to existing target")
    else:
        print("Verified: Usage migrated to existing.")

    # Cleanup
    print("\n--- Cleanup ---")
    delete_exercise(existing_target['id'], "delete_all")
    print("Cleanup done.")

if __name__ == "__main__":
    verify()
