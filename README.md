# 🛰️ TNO Schedule Dashboard

A modern, high-performance dashboard for Thai National Observatory (TNO) schedule management and environmental monitoring. Built with Next.js 15, React 19, and Tailwind CSS 4.

![Dashboard Overview](file:///C:/Users/Sorawit/.gemini/antigravity/brain/059b434e-8283-45ee-bfb9-cf9ed90c17d7/full_dashboard_1768927620806.png)

## ✨ Features

- **Shift-Aligned Date Tracking**: Automatically rolls over the "Today" view at **07:00 AM**, perfectly aligning with observation shifts.
- **Astro Science Window**: Real-time calculation and visualization of the "Science Window" (Astro Dusk to Astro Dawn).
- **Interactive Schedule Views**: Switch between a compact "Full Table" and a detailed "Daily View".
- **Real-time Weather & Astro Data**: Live weather monitoring and offline astronomical calculations (Sun & Moon timings).
- **Daily Sky Timing Log**: Automatically records astronomical timings and allows CSV export for historical analysis.
- **Customizable Color Coding**: Proposals are color-coded based on a flexible configuration system.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- Docker (optional, but recommended for deployment)

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)

### Data Configuration
This dashboard uses CSV files for schedule data. Place your actual data in the `public/` folder:
- `1m_C13_schedule.csv`
- `2.4m_C13_schedule.csv`
- `daily_stats.csv`

> [!IMPORTANT]
> Actual data files are ignored by Git for security. You must manually place them in the `public/` folder on each machine.

## 🐳 Docker Deployment

The application is configured to run on **Port 1234** by default (to avoid conflicts with Grafana).

1. Build and start the container:
   ```bash
   docker-compose up -d --build
   ```
2. Access the dashboard at `http://localhost:1234`

## 📂 Project Structure

- `src/components/`: UI components (WeatherWidget, ScheduleView, etc.)
- `src/utils/`: Helper functions (CSV parsing, Sky Timing logging)
- `src/config/`: Configuration files (Proposal colors)
- `public/`: Static assets and CSV data files

## 🛠️ Built With

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS 4**
- **Lucide React** (Icons)
- **SunCalc** (Astronomical calculations)
- **Papa Parse** (CSV handling)

---
*Developed for TNO Schedule Management & Research.*
