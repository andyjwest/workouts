import requests
import sys

BASE_URL = "http://localhost:8900"

def test_exercise_update():
    # 1. Ensure 'Dip' exists
    print("1. Ensuring 'Dip' exists...")
    try:
        res = requests.post(f"{BASE_URL}/exercises/", json={
            "name": "Dip",
            "type": "Strength",
            "muscle_group": ["Triceps"]
        })
        if res.status_code == 200:
            dip_id = res.json()['id']
            print(f"Created Dip (ID: {dip_id})")
        else:
            # Maybe already exists, find it
            all_ex = requests.get(f"{BASE_URL}/exercises/").json()
            dip = next((e for e in all_ex if e['name'] == 'Dip'), None)
            if dip:
                dip_id = dip['id']
                print(f"Found existing Dip (ID: {dip_id})")
            else:
                print("Failed to create/find Dip")
                sys.exit(1)
    except Exception as e:
        print(e)
        sys.exit(1)

    # 2. Update Dip -> Dip (Should succeed)
    print("\n2. Updating Dip -> Dip (Self-Update)...")
    try:
        update_res = requests.put(f"{BASE_URL}/exercises/{dip_id}", json={
            "name": "Dip",
            "description": "Updated Description",
            "muscle_group": ["Triceps", "Chest"]
        })
        print(f"Status: {update_res.status_code}")
        if update_res.status_code == 200:
            print("SUCCESS: Self-update works.")
        else:
            print(f"FAILURE: Self-update failed. {update_res.text}")
    except Exception as e:
        print(e)

    # 3. Create 'Other' and try to rename to 'Dip' (Should fail)
    print("\n3. Renaming 'Other' -> 'Dip' (Collision)...")
    other_id = None
    try:
        # Create or find Other
        res = requests.post(f"{BASE_URL}/exercises/", json={"name": "Other"})
        if res.status_code == 200:
            other_id = res.json()['id']
        else:
             all_ex = requests.get(f"{BASE_URL}/exercises/").json()
             other = next((e for e in all_ex if e['name'] == 'Other'), None)
             if other: other_id = other['id']

        if other_id:
            dup_res = requests.put(f"{BASE_URL}/exercises/{other_id}", json={
                "name": "Dip"
            })
            print(f"Status: {dup_res.status_code}")
            if dup_res.status_code == 500 and "Key (name)=(Dip) already exists" in dup_res.text:
                print("SUCCESS: Collision detected correctly.")
            else:
                print(f"UNEXPECTED: {dup_res.status_code} {dup_res.text}")
                
            # Cleanup
            requests.delete(f"{BASE_URL}/exercises/{other_id}")
    except Exception as e:
        print(e)

if __name__ == "__main__":
    test_exercise_update()
