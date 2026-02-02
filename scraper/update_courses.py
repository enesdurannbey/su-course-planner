import os
import shutil
import pulldata
import normalize_data
import minimize
DESTINATION_PATH = os.path.join("..", "frontend", "public", "data.json")

def main():
    print("Update process started...")

    print("--- 1. Scraping ---")
    try:
        pulldata.master() 
    except Exception as e:
        print(f"Error in scraping: {e}")
        return

    print("--- 2. Normalization ---")
    try:
        normalize_data.normalize()
    except Exception as e:
        print(f"Error in normalization: {e}")
        return

    print("--- 3. Minimization ---")
    try:
        minimize.minimize_data()
    except Exception as e:
        print(f"Error in minimization: {e}")
        return

    source = "data.json"
    
    if os.path.exists(source):
        os.makedirs(os.path.dirname(DESTINATION_PATH), exist_ok=True)
        
        shutil.move(source, DESTINATION_PATH)
        print(f"Success! Data updated and moved to: {DESTINATION_PATH}")
        
        for f in ["raw_courses.json", "processed_data.json"]:
            if os.path.exists(f):
                os.remove(f)
    else:
        print(f"Error: {source} was not generated.")

if __name__ == "__main__":
    main()