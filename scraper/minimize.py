import json
import os

KEYS_TO_REMOVE = [
    "date_range",    
    "type",          
    "schedule_type",
]

INPUT_FILE = 'processed_data.json'
OUTPUT_FILE = 'data.json'

def minimize_data():
    if not os.path.exists(INPUT_FILE):
        print(f"{INPUT_FILE} not found.")
        return

    print(f"Reading {INPUT_FILE}...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for course_code, course_data in data.items():
        if "sections" in course_data:
            for section in course_data["sections"]:
                if "schedule" in section:
                    for slot in section["schedule"]:
                        for key in KEYS_TO_REMOVE:
                            if key in slot:
                                del slot[key]

    print("Minimizing...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)
    
    print(f"Done. Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    minimize_data()