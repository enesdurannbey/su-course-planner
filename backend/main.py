import itertools
import json
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel
import time

app = FastAPI()

class Selection(BaseModel):
    items: list[str]
    constraints:dict

# Get CORS origins from environment variable or use defaults for development
origins_env = os.getenv("CORS_ORIGINS", "")
if origins_env:
    origins = [origin.strip() for origin in origins_env.split(",")]
else:
    # Development defaults
    origins = [
        "http://localhost",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    GZipMiddleware,
    minimum_size = 1000
)

try:
    with open("data/grouped_courses.json","r",encoding="UTF-8") as f:
        grouped_data = json.load(f)
except FileNotFoundError:
    grouped_data = {}
    print("cannot find data")

BIT_RESOLUTION = 10 
SLOTS_PER_DAY = (24 * 60) // BIT_RESOLUTION 

def get_time_signature(schedule):
    times = []
    for section in schedule:
        for slot in section.get("schedule",[]):
            if slot.get("day_index",-1) != -1:
                times.append((slot["day_index"]),(slot["start_min"]),(slot["end_min"]))
    return tuple((sorted(times)))


def calculate_section_bitmask(section_schedule):
    mask = 0
    for item in section_schedule:
        if item.get('day_index') == -1 or item.get('start_min') is None:
            continue

        start_min = int(item["start_min"])
        end_min = int(item["end_min"])
        day_index = int(item["day_index"])

        day_offset = day_index * SLOTS_PER_DAY

        start_slot = start_min // BIT_RESOLUTION
        end_slot = end_min // BIT_RESOLUTION

        for i in range(start_slot, end_slot):
            global_position = day_offset + i
            mask |= (1 << global_position)
            
    return mask

def calculate_constraint_mask(constraints):
    constraint_mask = 0

    if constraints.get("no840",False):
        start_min = 8*60 + 40
        end_min = 9*60 + 30

        start_slot = start_min // BIT_RESOLUTION
        end_slot = end_min // BIT_RESOLUTION

        for day_index in range(5):
            day_offset = day_index * SLOTS_PER_DAY

            for i in range(start_slot,end_slot):
                global_position = day_offset + i
                constraint_mask |= (1 << global_position)

    if constraints.get("day_offs", []):

        day_offs = [int(index) for index in constraints['day_offs'] ]
  
        for day_index in day_offs:
            if not (0 <= day_index <= 6): continue 

            day_offset = day_index * SLOTS_PER_DAY
            
            for i in range(SLOTS_PER_DAY):
                global_position = day_offset + i
                constraint_mask |= (1 << global_position)
                
    return constraint_mask

def solve_schedule(selected_codes, all_courses,constraints, max_results=150):
    initial_mask = calculate_constraint_mask(constraints)
    target_courses = []
    
    for code in selected_codes:
        if code not in all_courses:
            print(f"Uyarı: {code} veritabanında bulunamadı.")
            continue

        course_data = all_courses[code]
        prepared_sections = []

        for section in course_data["sections"]:
            if(section['section'] == "X"): continue
            mask = calculate_section_bitmask(section["schedule"])

            if (mask & initial_mask) != 0:
                continue
            
            prepared_sections.append({
                'data': section, 
                'mask': mask     
            })
        if not prepared_sections:
            return []
        
        target_courses.append({
            'code': code,
            'sections': prepared_sections
        })

    target_courses.sort(key=lambda x: len(x['sections']))

    valid_schedules = []

    def backtrack(course_idx, current_path, combined_mask):
        if course_idx == len(target_courses):
            valid_schedules.append([item['data'] for item in current_path])
            
            if len(valid_schedules) >= max_results:
                return True
            return False
            
        current_course = target_courses[course_idx]
        
        for section in current_course['sections']:
            
            
            if (combined_mask & section['mask']) != 0:
                continue 
            
            current_path.append(section)
            new_mask = combined_mask | section['mask']

            done = backtrack(course_idx + 1, current_path, new_mask)
            if done: return True
            
            # Backtrack 
            current_path.pop()
            
        return False

    if not target_courses:
        return []

    backtrack(0, [], initial_mask)
    return valid_schedules


@app.post("/submit")
def submit(selection: Selection):
    return {"received": selection.items}

@app.get("/courses")
def get_courses():
    return {"courses": grouped_data}

@app.post("/schedule",response_class=ORJSONResponse)
def create_schedule(selection: Selection):
    
    selected_items = selection.items
    constraints = selection.constraints

    start_time = time.perf_counter()

    full_schedules = solve_schedule(selected_items, grouped_data, constraints, max_results=5000)
    grouped_by_visual = {}
    for sched in full_schedules:
        sig = get_time_signature(sched)
        if sig not in grouped_by_visual:
            grouped_by_visual[sig] = []
        grouped_by_visual[sig].append(sched)

    final_list = []
    groups = list(grouped_by_visual.values())
    if groups:
        max_len = max(len(g) for g in groups)
        for i in range(max_len):
            for group in groups:
                if i < len(group):
                    final_list.append(group[i])
    
    limited_response = final_list[:100]

    end_time = time.perf_counter()

    elapsed_time = end_time - start_time
    print(f"completed in {elapsed_time:.6f}s .")
    print(len(full_schedules)," schedules found")
    
    return {"schedules": limited_response}