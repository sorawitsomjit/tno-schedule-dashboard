# 🚀 Future Updates Roadmap - TNO Schedule Dashboard

This document outlines the major features and architectural changes planned for the next development phases of the Telescope Schedule Dashboard.

---

## ⭐️ Immediate Priorities (Short-term)
These are easy-to-implement updates that provide immediate value to observers:

### 1. Astro Science Window Bar (Sky Timing)
- **Feature**: Add a visual bar in the "Sky Timing" widget representing the duration from **Astro Dusk** to **Astro Dawn**.
- **Metrics**: Automatically calculate and display the total "Science time" available in `HH:mm` format.
- **Visual**: A simple horizontal bar (similar to the observation slots) but representing the full dark sky window.

### 2. Daily Sky Timing Log (CSV)
- **Goal**: Auto-generate/append to a `sky_timing_log.csv` in the `public/` folder.
- **Data**: Store date, sunset, twilight limits, sunrise, and total astro-dark duration for historical analysis.

### 3. Shift-Aligned Date Rollover (07:00 AM)
- **Current**: App synchronizes to the next day at 00:00.
- **New Logic**: The dashboard should maintain "Today's" view until **07:00 AM** the next day.
- **Reasoning**: This aligns with the observation shift (19:00 - 05:00), allowing operators to see the current night's schedule until their shift ends.

---

## 1. Actual Observation Timeline (The "Actuals" Phase)
**Goal:** Transition from showing only "Allocated Time" (Planned) to "Actual Observation Time" (What really happened).

### Key Features:
- **Actual vs. Allocated Visuals**: A side-by-side or overlapping timeline view in the Day View to show discrepancies between plan and reality.
- **Google Sheets Integration**:
    - Build a connector to sync data from the Operator's log (Google Sheets).
    - Potential implementation: Server-side cron job or a "Sync Now" button in the Admin panel.
- **Enhanced Data Model**: Expand `ObservationSession` to include `actualStart`, `actualEnd`, `status` (Completed, Weather Loss, Technical Loss, Cancelled).

---

## 2. Advanced Search & Discovery Page
**Goal:** A powerful interface for researchers and admins to query historical and future data.

### Filter Criteria:
- **Date Range**: Select [Start Date] to [End Date].
    - *Display*: A vertical list of Day View slots (19:00 - 05:00) for the entire range.
- **Entity Filters**: 
    - **Proposal ID**: Search for specific project (e.g., `ID022`).
    - **Instrument**: Filter by equipment (e.g., `ULSPC`, `MRES`, `LRS`).
- **Multi-Condition Search**: 
    - e.g., "Show me all `ID005` sessions using `LRS` in January 2026 that occurred after midnight."
- **Astronomical Conditions**:
    - **Moon Phase**: Filter by specific phase or categories (Dark Night, Full Moon, etc.).
- **Impact & Downtime**:
    - View only sessions affected by **Weather Conditions** or **Technical Problems**.

### Suggested UI:
- A "Filter Sidebar" with real-time results.
- Export results to CSV/Excel button.

---

## 3. Allocation & Performance Analytics
**Goal:** A high-level summary of how telescope time is being distributed and utilized.

### Features:
- **Time Allocation Summary**: 
    - Total hours per Proposal ID (Historical and Planned).
    - Monthly breakdown of "Heavy Users" (IDs with most hours).
- **Efficiency Metrics**:
    - **Utilization Rate**: (Actual Hours / Allocated Hours) * 100.
    - **Loss Analysis**: Pie charts showing ratios of Weather vs. Technical vs. Successful observations.
- **Cycle Comparison**: Compare Cycle 13 with previous or future cycles.

---

## 4. Proposed Technical Improvements
- **Backend Database**: Move from flat CSV files to a lightweight database (e.g., SQLite or PostgreSQL) to support complex filtering and faster queries.
- **Admin Dashboard**: A secure login for TNO staff to manually override data or upload new log files.
- **Real-time Sync**: Webhook integration with the All-Sky camera or Weather station to automatically log weather downtime.

---

## 5. Deployment & Infrastructure
- **Custom Port Configuration**: If hosting on shared machines (e.g., L3 Computer), ensure the application port is changed to avoid conflicts with other services like **Grafana** (which defaults to port 3000).
    - *How to change*: Edit `package.json` scripts or use an environment variable `PORT=4000 npm run dev`.
- **Dockerization**: Containerize the app for consistent deployment across different TNO workstations.

---

## 6. n8n Automation & AI Insights
**Goal:** Automate the end-to-end data lifecycle from observation logs to analytical reports.

### Proposed Workflow:
1.  **Data Capture**: Operator records data in **Google Sheets** at the end of each night.
2.  **n8n Trigger**: n8n (self-hosted) triggers via webhook or periodic polling to fetch the day's logs.
3.  **Data Processing**: n8n processes raw data, calculating durations for each ID and Instrument.
4.  **AI Analysis**: Data is sent to an **AI Agent** for:
    -   Daily observation summary.
    -   Anomaly detection (e.g., unusual technical downtime).
    -   Efficiency reporting.
5.  **Dashboard Integration**:
    -   n8n pushes **Raw Data** to the Dashboard (updating the "Actual Time" view).
    -   n8n pushes the **AI Report** to a new "Daily Insights" panel in the web-app.
6.  **Comparison**: The web-app automatically compares the synced Actual data with the originally Allocated time.

---

> [!NOTE]
> This roadmap serves as a guide for future development sprints. Priorities can be adjusted based on TNO operational needs.
