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

### Frontend
Create `.env` in the `frontend/` directory (copy from `.env.example`):
```
VITE_API_URL=http://localhost:8000
```

For production, update to your backend URL:
```
VITE_API_URL=https://api.your-domain.com
```

### Backend
Create `.env` in the `backend/` directory (copy from `.env.example`):
```
CORS_ORIGINS=http://localhost,http://localhost:5173,http://localhost:8000
```

For production, set allowed origins to your frontend domain(s):
```
CORS_ORIGINS=https://su-course-planner.vercel.app,https://your-domain.com
```

## Production Deployment

### Backend (Python/FastAPI)
1. Copy `.env.example` to `.env` and update CORS_ORIGINS with your production domain
2. For Render, Railway, or similar:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```
3. Set environment variables in your hosting platform's dashboard

### Frontend (React/Vite)
1. Copy `.env.example` to `.env.production` and update VITE_API_URL to your backend URL
2. Build for production:
   ```bash
   npm run build
   ```
3. Deploy the `dist/` directory to Vercel, Netlify, or your hosting provider

### Environment Variables Checklist
- [ ] Backend: `CORS_ORIGINS` set to production frontend URL(s)
- [ ] Frontend: `VITE_API_URL` set to production backend URL
- [ ] Both `.env` files added to `.gitignore` (not committed to repository)
- [ ] API endpoints use HTTPS in production

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
