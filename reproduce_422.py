import requests

API_URL = "http://localhost:8900"

def reproduce_422():
    # Test case 1: valid integer
    print("Testing with valid integer...")
    res = requests.get(f"{API_URL}/exercises/28/last_set?set_number=1&current_workout_id=1")
    print(f"Status: {res.status_code}")

    # Test case 2: "undefined" string (simulating JS behavior)
    print("Testing with 'undefined' string...")
    res = requests.get(f"{API_URL}/exercises/28/last_set?set_number=1&current_workout_id=undefined")
    print(f"Status: {res.status_code}")
    if res.status_code == 422:
        print("Response:", res.text)

    # Test case 3: "null" string
    print("Testing with 'null' string...")
    res = requests.get(f"{API_URL}/exercises/28/last_set?set_number=1&current_workout_id=null")
    print(f"Status: {res.status_code}")
    if res.status_code == 422:
        print("Response:", res.text)

if __name__ == "__main__":
    reproduce_422()
