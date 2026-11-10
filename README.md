# 🔭 TNO Telescope Schedule

Nightly TAC time allocation for the **2.4m TNT** and **1m** telescopes at the Thai National Observatory —
who has the telescope, with which instrument, and when. Used by operators on the TNO LAN (no login).

Built with Next.js 16, React 19 and Tailwind CSS 4. All data is static files in `public/`.

## Features

- **Night timeline** for both telescopes on one axis (19:00–05:00; widens only on nights the TAC schedule runs past 05:00)
- Bars use the **same colours and numbers as the TAC PDF** (`#5 Napaporn`), DDT/GTO/Buffer/... are labelled
- Session list, FLI (moon %) per night, full schedule table (this month / all)
- Shift-aligned "Today" (rolls over at 07:00); open a specific night with `/?date=2027-01-30`
- Dashed twilight lines on the timeline; sky timings for the selected night (SunCalc; matches the TAC PDF twilight)
- **CSV button** downloads sky timings + moon illumination for every night of the cycle
- FLI (moon %) from the TAC schedule; computed for nights outside the schedule
- Live weather (OpenWeatherMap)

## Updating the schedule (new cycle or new PDF version)

The schedule comes from the TAC PDF. The project skill `tac-schedule-pdf`
(`../.claude/skills/tac-schedule-pdf/`) does the conversion — in Claude Code just say
"there is a new schedule PDF". By hand:

```bash
S=../.claude/skills/tac-schedule-pdf/scripts
python $S/tac_pdf_extract.py "<2.4m pdf>" tnt.json
python $S/tac_pdf_extract.py "<1m pdf>" trt.json
python $S/build_workbook.py C14_schedule.xlsx tnt.json trt.json   # check / fix in Excel
python $S/export_csv.py C14_schedule.xlsx public/                 # -> web app data
```

`export_csv.py` writes `public/schedule_meta.json` (cycle, versions, file names) and one
`schedule_<cycle>_<telescope>.csv` per telescope. Updating data needs **no rebuild** — copy the files
into `public/` on the server (it is mounted as a Docker volume).

Data files in `public/` are git-ignored.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest
npm run build
```

## Docker deployment

Runs on **port 1234** (to avoid Grafana).

```bash
docker-compose up -d --build
```

Then open `http://<server>:1234`.

## Project structure

- `src/app/` — the single page (`/`)
- `src/components/` — `DayObservationView` (timeline + list), `ScheduleTableView`, `SessionBar`, `WeatherWidget`
- `src/utils/` — `scheduleData` (load/parse CSV), `timeline` (night axis), `sessionDisplay` (labels/colours), `skyTimes` (twilight), `time`
- `public/` — data files (not in git)
