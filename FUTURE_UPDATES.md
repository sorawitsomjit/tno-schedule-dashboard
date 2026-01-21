# 🚀 Future Updates Roadmap - TNO Schedule Dashboard

This document outlines the major features and architectural changes planned for the next development phases of the Telescope Schedule Dashboard.

---

## ✅ Completed (Phase 1: Immediate Priorities)
- [x] **Astro Science Window Bar**: Integrated visual timeline for dark sky duration.
- [x] **Daily Sky Timing Log**: Automatic localStorage logging with CSV export functionality.
- [x] **Shift-Aligned Date Rollover**: Dashboard rolls over at **07:00 AM** to match operator shifts.
- [x] **Docker Deployment**: Containerized with port 1234 configuration.

---

## 📅 Phase 2: Actual Observation Timeline
**Goal:** Transition from showing only "Allocated Time" (Planned) to "Actual Observation Time".

- **Actual vs. Allocated Visuals**: Side-by-side timeline view to show discrepancies.
- **Google Sheets Integration**: Build a connector to sync data from the Operator's log (Google Sheets).
- **Enhanced Data Model**: Track `actualStart`, `actualEnd`, and `status` (Completed, Weather Loss, etc.).

---

## 📅 Phase 3: Advanced Search & Analytics
**Goal:** A powerful interface for researchers and admins.

- **Advanced Search**: Filter by Proposal ID, Instrument, Moon Phase, and Date Range.
- **Allocation Analytics**: Summary of hours per Proposal ID and Monthly Utilization Rate.
- **Loss Analysis**: Pie charts showing ratios of Weather vs. Technical vs. Successful observations.

---

## 📅 Phase 4: Automation & AI Insights
**Goal:** Automate the end-to-end data lifecycle.

- **n8n Automation**: Trigger data sync from Google Sheets to the dashboard.
- **AI Daily Insights**: Automatic summary of the night's performance and anomaly detection.
- **Database Backend**: Migrate from CSV to SQLite/PostgreSQL for faster queries.

---
> For technical details, refer to the [README.md](./README.md).
