import psycopg2
import os

# Set env vars
os.environ["DB_NAME"] = "workouts"
os.environ["DB_USER"] = "user"
os.environ["DB_PASSWORD"] = "password"
os.environ["DB_HOST"] = "localhost"
os.environ["DB_PORT"] = "5432"

def get_db_connection():
    conn = psycopg2.connect(
        dbname=os.environ.get("DB_NAME"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        host=os.environ.get("DB_HOST"),
        port=os.environ.get("DB_PORT")
    )
    return conn

def apply_schema():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        with open("db_setup.sql", "r") as f:
            sql = f.read()
        cursor.execute(sql)
        conn.commit()
        cursor.close()
        conn.close()
        print("Schema applied successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    apply_schema()
