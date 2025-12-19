# SU Course Planner

Course schedule planner for Sabancı University. Helps students find non-conflicting course schedules based on their selected courses and preferences.

## Features

- 🔍 Search and filter courses
- 📅 Generate conflict-free schedules
- ⏰ Exclude specific time slots (e.g., 8:40 AM classes)
- 🚫 Set days off (full day blocking)
- 🎨 Visual schedule grid with color-coded courses

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS + Vite

**Backend:**
- FastAPI (Python)
- Pydantic for validation
- Bitmask algorithm for schedule conflict detection

## Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

## Running the Application

**Backend (from `backend/` directory):**
```bash
uvicorn main:app --reload --port 8000
```

**Frontend (from `frontend/` directory):**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite default)
The backend API will be at `http://localhost:8000`

## Environment Variables

Create `.env` in the `frontend/` directory:
```
VITE_API_URL=http://localhost:8000
```

## Project Structure

```
su-course-planner/
├── backend/
│   ├── main.py           # FastAPI app & schedule solver
│   ├── requirements.txt   # Python dependencies
│   └── data/
│       ├── courses.json       # Course data
│       ├── grouped_courses.json
│       └── group_courses.py
├── frontend/
│   ├── src/
│   │   ├── App.tsx       # Main app component
│   │   ├── CourseGrid.tsx # Schedule grid display
│   │   └── main.tsx
│   ├── package.json
│   └── .env
└── Readme.md
```

## How It Works

1. Select courses from the list
2. Set optional constraints (exclude 8:40, days off)
3. Click "Generate Schedule"
4. Browse through valid schedule combinations using navigation arrows

The backend uses a bitmask algorithm to efficiently detect schedule conflicts and find valid combinations.

## License

MIT
