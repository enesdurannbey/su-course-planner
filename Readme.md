# 📅 Sabancı University Course Planner

**Find your perfect schedule in seconds.**

This tool is designed to solve the chaos of course registration. It calculates every possible non-conflicting course schedule based on your preferences, helping you focus on choosing the best routine rather than checking for collisions manually.

> **✨ v2.0 Major Update:** The project has been completely refactored to a **Client-Side (Serverless)** architecture. All computations now happen directly in your browser using **Web Workers**, ensuring zero latency and maximum privacy.

## 🌟 Key Features

### ⚡ Instant & Serverless (New)
* **Zero Latency:** Schedule generation happens instantly on your device without waiting for a server.
* **Reliability:** Works 100% offline once loaded. No server downtimes or queues.
* **Privacy-First:** Your course selections and constraints never leave your browser.

### 🧠 Smart Scheduling
* **Conflict-Free Guarantee:** Uses a high-performance **Bitmask Algorithm** to detect overlaps in milliseconds.
* **Smart Grouping:** Automatically groups schedules that look identical visually (even if section numbers differ) to prevent clutter and redundancy.
* **Visual Grid:** Interactive, color-coded grid to visualize your week at a glance.

### 🎛️ Advanced Filtering
* **🚫 "No 8:40" Mode:** One-click filter to exclude all schedules starting at 8:40 AM.
* **🏖️ Day Blocking:** Select specific days off (e.g., "I want Fridays empty") and the system will find schedules that fit.

### 📤 Ready for Registration
* **📋 Copy CRNs:** Found the perfect plan? Click one button to copy all Course Reference Numbers (CRNs) to your clipboard for easy registration.
* **📸 Download as Image:** Export your schedule as a high-quality PNG to save to your phone or share with friends.

---

## 🛠️ Tech Stack

**Core:**
* **React 19** & **TypeScript**
* **Vite** (Build Tool)
* **Tailwind CSS** (Styling)

**Performance:**
* **Web Workers:** Off-main-thread computation for UI responsiveness.
* **Bitmasking:** Optimized bitwise operations for collision detection.

**Utilities:**
* **html-to-image:** For schedule export.

---

## 💻 Technical Setup (For Developers)

If you want to run this project locally or contribute:

**Prerequisites:** Node.js installed.

1.  **Clone & Install:**
    ```bash
    git clone [https://github.com/enesdurannbey/su-course-planner.git](https://github.com/enesdurannbey/su-course-planner.git)
    cd su-course-planner/frontend
    npm install
    ```

2.  **Run Locally:**
    ```bash
    npm run dev
    ```
    The app will start at `http://localhost:5173`.

## 🤝 Contributing
Found a bug or have a feature idea? Feel free to open an issue or submit a Pull Request.

## Project Structure

```
su-course-planner/
├── backend/
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

## License

MIT
