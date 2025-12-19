from collections import defaultdict
import json

OUTPUT_FILE = "grouped_courses.json"

with open("courses.json", "r", encoding="utf-8") as f:
    courses = json.load(f)

grouped = {}

for course in courses:
    code = course["code"]
    name = course["name"]
    credits = course["credits"]

    if code not in grouped:
         grouped[code] = {
              "name":name,
              "credits":credits,
              "sections": [],
         }
    course_copy = course.copy()
    del course_copy["credits"]
    del course_copy["name"]

    grouped[code]["sections"].append(course_copy)

with open(OUTPUT_FILE,"w",encoding="UTF-8") as f:
        json.dump(grouped,f,indent=4,ensure_ascii=False)
