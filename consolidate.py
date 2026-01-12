import json
import os

def consolidate_workouts(data_dir, output_file):
    all_workouts_dict = {}
    for filename in os.listdir(data_dir):
        if filename.endswith('.json') and filename != 'workout.schema.json':
            filepath = os.path.join(data_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                try:
                    workouts = json.load(f)
                    if isinstance(workouts, list):
                        for workout in workouts:
                            if 'date' in workout:
                                all_workouts_dict[workout['date']] = workout
                except json.JSONDecodeError:
                    print(f"Warning: Could not decode JSON from {filename}")

    all_workouts = list(all_workouts_dict.values())
    all_workouts.sort(key=lambda w: w.get('date', ''), reverse=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_workouts, f, indent=2)

if __name__ == '__main__':
    data_directory = 'workouts-data'
    output_filepath = os.path.join(data_directory, 'all_workouts.json')
    consolidate_workouts(data_directory, output_filepath)
    print(f"Consolidated all workouts into {output_filepath}")
