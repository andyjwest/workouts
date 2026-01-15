import psycopg2
import os

def get_db_connection():
    return psycopg2.connect(
        host='localhost',
        database='workouts',
        user='user',
        password='password',
        port='5432'
    )

mapping = {
    1064: 3, 1065: 1, 1066: 3, 1067: 2, 1068: 1, 1069: 2, 1070: 3,
    1071: 1, 1072: 1, 1073: 1, 1074: 1, 1075: 1, 1076: 2, 1077: 2
}

try:
    conn = get_db_connection()
    cur = conn.cursor()

    for we_id, num_sets in mapping.items():
        print(f"Processing we_id {we_id}: adding {num_sets} sets")
        for i in range(1, num_sets + 1):
            cur.execute(
                "INSERT INTO workout_sets (workout_exercise_id, set_number, completed) VALUES (%s, %s, false)",
                (we_id, i)
            )

    conn.commit()
    cur.close()
    conn.close()
    print("Done")
except Exception as e:
    print(f"Error: {e}")
