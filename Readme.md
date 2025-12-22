# 📅 Sabancı University Course Planner

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Fast-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

**Find your perfect schedule in seconds.**

This tool is designed to solve the chaos of course registration. It calculates every possible non-conflicting course schedule based on your preferences, helping you focus on choosing the best routine rather than checking for collisions manually.

> **✨ v2.0 Major Update:**  
> The project has been completely refactored to a **Client-Side (Serverless)** architecture. All computations now happen directly in your browser using **Web Workers**, ensuring zero latency and maximum privacy.

---

## 📸 Screenshots

<img width="1886" height="903" alt="image" src="https://github.com/user-attachments/assets/60ea3b81-a69e-47e5-9f5b-36f7d9093884" />

---

## 🌟 Key Features

### ⚡ Instant & Serverless
- **Zero Latency:** Schedule generation happens instantly on your device without waiting for a server.
- **Reliability:** Works 100% offline once loaded. No server downtimes or queues.
- **Privacy-First:** Your course selections and constraints never leave your browser.

### 🧠 Smart Scheduling & Controls
- **🔒 Section Pinning (New):** Have a favorite professor? Lock a specific section (e.g., "Pin Section A"), and the algorithm will generate schedules **around** that fixed choice.
- **Conflict-Free Guarantee:** Uses a high-performance **Bitmask Algorithm** to detect overlaps in milliseconds.
- **Smart Grouping:** Automatically groups schedules that look identical visually to prevent clutter.

### 🎛️ Advanced Filtering
- **🚫 "No 8:40" Mode:** One-click filter to exclude all schedules starting at 8:40 AM.
- **🏖️ Day Blocking:** Select specific days off (e.g., "I want Fridays empty") and the system will find schedules that fit.

### 🎨 User Experience
- **🌙 Dark Mode:** Fully supported dark theme that automatically saves your preference.
- **Visual Grid:** Interactive, color-coded grid to visualize your week at a glance.
- **Smart Navigation:** Easily browse through result options with jump controls.

### 📤 Ready for Registration
- **📋 Copy CRNs:** Found the perfect plan? Click one button to copy all Course Reference Numbers (CRNs) to your clipboard for easy registration.
- **📸 Download as Image:** Export your schedule as a high-quality PNG to save to your phone or share with friends.

---

## 🛠️ Tech Stack

### Core
- **React 19** & **TypeScript**
- **Vite** (Build Tool)
- **Tailwind CSS v4** (Styling)

### Performance
- **Web Workers:** Off-main-thread computation for UI responsiveness.
- **Bitmasking:** Optimized bitwise operations for collision detection.

### Utilities
- **html-to-image:** For schedule export.

---

## 💻 Technical Setup (For Developers)

If you want to run this project locally or contribute:

### Prerequisites
Node.js installed.

### Clone & Install
```bash
git clone https://github.com/enesdurannbey/su-course-planner.git
cd su-course-planner/frontend
npm install

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
    ├── frontend/
    │   ├── public/
    │   │   └── data.json
    │   ├── src/
    │   │   ├── logic/        # Main Algorithm (Bitmasking)
    │   │   ├── workers/      # Web Workers (Background Tasks)
    │   │   ├── App.tsx       # Main UI & State Management
    │   │   ├── CourseGrid.tsx# Visual Schedule Component
    │   │   └── main.tsx
    │   ├── package.json
    └── Readme.md

```

## How It Works

1. Search & Select: Browse courses and add them to your cart.
2. Pin Sections (Optional): Click on a course in your list to see its sections. Toggle the lock icon to force a specific section/instructor.
3. Set Constraints: Optional filters to exclude 8:40 AM classes or block entire days like Friday.
4. Generate: Click "Generate Schedule" to find valid combinations.
5. Browse: Navigate through results. The system intelligently groups visually identical schedules.
6. Export: Copy CRNs for registration or download the schedule image.

## License

MIT
