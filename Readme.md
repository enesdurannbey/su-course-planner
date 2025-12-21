# SU Course Planner

Course schedule planner for Sabancı University. Helps students find non-conflicting course schedules based on their selected courses and preferences.

## Features

- 🔍 **Search & Filter:** Easily find courses by code or name.
- 🛒 **Course Cart:** Manage your selected courses in a dedicated "Selected" tab.
- 📅 **Conflict-Free Schedules:** Automatically generates valid schedule combinations using a high-performance bitmask algorithm.
- 🧠 **Smart Grouping:** Automatically groups schedules with identical time slots (even if sections differ) to prevent visual redundancy.
- 📸 **Download as Image:** Export your favorite schedule as a high-quality PNG image to save or share.
- 📋 **Copy CRNs:** One-click button to copy all Course Reference Numbers (CRNs) of a schedule for easy registration.
- ⏰ **Time Constraints:** Exclude specific time slots (e.g., 8:40 AM classes).
- 🚫 **Day Blocking:** Set specific days off to keep your schedule clear.
- 🎨 **Visual Grid:** Interactive schedule grid with color-coded courses and navigation.

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS + Vite
- **html-to-image** (for schedule export)

**Backend:**
- FastAPI (Python)
- Pydantic for validation
- **Bitmask algorithm** for high-performance conflict detection
- Smart grouping logic for visual deduplication

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

1. Search & Select: Browse courses and add them to your cart.
2. Set Constraints: Optional filters to exclude 8:40 AM classes or block entire days.
3. Generate: Click "Generate Schedule" to find valid combinations.
4. Browse: Navigate through results. The system intelligently groups visually identical schedules.
5. Export: Copy CRNs for registration or download the schedule image.

The backend uses a bitmask algorithm to efficiently detect schedule conflicts and find valid combinations.

## License

MIT
