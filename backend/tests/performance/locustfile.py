from locust import HttpUser, task, between
import json

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)

    @task
    def generate_schedule(self):
        
        payload = {
            "items": ["MATH 101","MATH 101R", "CS 201","CS 201R", "MATH 203","MATH 203R","HUM 207","HUM 207D","PROJ 201"], 
            "constraints": {
                "no840": False,
                "day_offs": []
            }
        }
        
        self.client.post("/schedule", json=payload)

    @task(3) 
    def view_courses(self):
        self.client.get("/courses")