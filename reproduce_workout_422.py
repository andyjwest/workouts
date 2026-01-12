import requests
import datetime

API_URL = "http://localhost:8900"

def reproduce_workout_422():
    # Test case 1: "HH:MM:SS" (Standard)
    print("Testing with 'HH:MM:SS'...")
    res = requests.post(f"{API_URL}/workouts/", json={
        "user_id": 1,
        "date": datetime.date.today().isoformat(),
        "start_time": "12:00:00",
        "notes": "Test Standard"
    })
    print(f"Status: {res.status_code}")
    if res.status_code == 422:
        print("Response:", res.text)

    # Test case 2: "h:mm:ss A" (US Locale, e.g., 4:30:00 PM)
    print("Testing with 'h:mm:ss A' (US Locale)...")
    res = requests.post(f"{API_URL}/workouts/", json={
        "user_id": 1,
        "date": datetime.date.today().isoformat(),
        "start_time": "4:30:00 PM",
        "notes": "Test US Locale"
    })
    print(f"Status: {res.status_code}")
    if res.status_code == 422:
        print("Response:", res.text)

if __name__ == "__main__":
    reproduce_workout_422()
