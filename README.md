# Space Allocation Planner

React + TypeScript dashboard that ingests studio capacity CSVs, creates student groupings (studios), and assigns whole groups to rooms while obeying floor capacity constraints. Built for educational institutions that need to optimise room usage across multiple programs and buildings.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [How-to Guide — Non-Technical Users](#how-to-guide--non-technical-users)
   - [What the Application Does](#what-the-application-does)
   - [Step-by-Step Usage](#step-by-step-usage)
   - [Understanding the Results](#understanding-the-results)
   - [Updating Room Data (No Code Required)](#updating-room-data-no-code-required)
4. [How-to Guide — Technical Users](#how-to-guide--technical-users)
   - [Tech Stack](#tech-stack)
   - [Project Structure](#project-structure)
   - [Architecture and Data Flow](#architecture-and-data-flow)
   - [CSV Input Formats](#csv-input-formats)
   - [Allocation Algorithm Deep Dive](#allocation-algorithm-deep-dive)
   - [Finance Model](#finance-model)
   - [Customization Reference](#customization-reference)
5. [Running the App](#running-the-app)
6. [LaTeX Documentation](#latex-documentation)
7. [Notes and Next Steps](#notes-and-next-steps)

---

## Overview

The Space Allocation Planner helps programme administrators and facilities teams answer one question: **"Given N students across several programs, how do we assign studio groups to available rooms without exceeding building capacity?"**

Key features:

- Upload or swap room-inventory CSVs with no code changes needed.
- Create student groups (studios) with configurable size caps.
- Optionally mix students from different programs within each studio.
- A three-pass allocation algorithm that respects per-floor capacity buffers.
- Visual diagnostics that flag unassigned groups and exhausted floors.
- One-click CSV export of the final allocation.
- Built-in staffing cost modelling (faculty, TAs, graders).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
# Opens at http://localhost:5173

# 3. Production build
npm run build

# 4. Preview the production build locally
npm run preview
```

---

## How-to Guide — Non-Technical Users

### What the Application Does

The Space Allocation Planner takes two inputs — your **room inventory** and your **programme enrolment numbers** — and automatically assigns student groups to rooms. It ensures that no room or floor is over-booked beyond a safe buffer, and it calculates associated staffing costs.

You do not need any programming knowledge to use the application once it is running in your web browser.

### Step-by-Step Usage

#### 1. Open the Application

Navigate to the URL where the app is hosted (e.g., `http://localhost:5173` when running locally). You will see the **Space Allocation Planner** dashboard with a form at the top.

#### 2. Set Allocation Parameters

| Field | What It Means |
|-------|---------------|
| **Number of Programs** | How many separate academic programs are being allocated (e.g., 2 for Architecture and Interior Design). |
| **Studio Cap** | The maximum number of students in a single studio group (e.g., 20). |
| **Allow multi-program mixing** | When checked, each studio group will contain an equal share of students from every program. When unchecked, studios are single-program only. |
| **Program Sizes** | For each program, enter a label (e.g., "Architecture") and the number of enrolled students. Use **Remove** to delete a row or increase the program count to add more. |

#### 3. Set Financial Inputs (Optional)

These fields feed the staffing cost model. They do not affect room assignments.

| Field | What It Means |
|-------|---------------|
| **Total Students (override)** | Leave blank to use the sum of program sizes. Enter a number here only if you need the cost model to assume a different student count. |
| **Semesters per Year** | Typically 2. Used to annualise TA compensation. |
| **TA/FA Compensation** | Dollar amount paid to each TA or FA per semester. |
| **Faculty / TAs-FAs / Graders** | Head counts for each staff role. Adjust these to model different scenarios. |

#### 4. Click "Calculate Allocation"

The dashboard updates with several result panels:

| Panel | What It Shows |
|-------|---------------|
| **Totals Row** | Summary counts: rooms available, floors, max capacity, students required. |
| **Studios Table** | Every studio group generated, its size, program breakdown, and the room it was assigned to. |
| **Rooms Table** | Each room, its base and dynamic capacity, extra capacity used, and the studios placed in it. |
| **Finance Summary** | Annualised staffing cost breakdown per role (compensation, ERE, risk, tech fee, admin charge). |
| **Floor Limits** | Per-floor capacity status showing how much buffer remains on each floor. |
| **Diagnostics** | Warnings and errors, such as groups that could not be placed or floors that ran out of buffer. |

#### 5. Refine the Results

- **Toggle Rooms** — Use the *Room Selection* panel to include or exclude individual rooms (or individual rooms within a combined zone) before recalculating.
- **Rotate Allocation** — Click *Rotate Allocation* to shuffle the order rooms are considered. This produces a different valid assignment without changing the groups.
- **Export CSV** — Click *Export CSV* to download the final allocation as a spreadsheet-compatible file.

#### 6. Reset

Click **Reset defaults** at the bottom of the form to restore all fields to their original values.

### Understanding the Results

- **Green rows** in the Studios table indicate successfully assigned groups.
- **Red or highlighted rows** indicate unassigned groups — these studios could not fit in any available room.
- A **"No floor buffer left"** diagnostic means a floor has reached its maximum allowed capacity (base + 15% buffer by default).
- **Extra Capacity Used** in the Rooms table shows how many seats beyond the room's base occupancy are being used, drawn from the floor buffer.

### Updating Room Data (No Code Required)

The application reads two CSV files from the `public/data/` folder. To update room information:

1. **`space_division.csv`** — Export an updated room list from Astra (or create one manually). Required columns: `BUILDING`, `LEVEL`, `STUDIO`, `ROOM`, `ASTRA OCCUPANCY`.
2. **`combined_spaces.csv`** — Define zones (groups of rooms treated as one space). Required columns: `combined_id`, `members`, `capacity_override`, `mode`.

Replace the files in `public/data/` and refresh the browser. The dashboard will load the new data automatically.

---

## How-to Guide — Technical Users

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 19 / 5.9 |
| Build tool | Vite | 7.2 |
| UI components | Material-UI (MUI) | v7.3 |
| Data tables | MUI X DataGrid | v8.20 |
| Form management | React Hook Form + Zod | 7.67 / 4.1 |
| CSV parsing | Papa Parse | 5.5.3 |
| Styling | Emotion | — |
| Linting | ESLint + TypeScript ESLint | 9.39 |

### Project Structure

```
Space_Allocation/
├── public/
│   └── data/
│       ├── space_division.csv      # Room inventory (Astra export)
│       └── combined_spaces.csv     # Zone definitions
├── src/
│   ├── components/
│   │   ├── AllocationForm.tsx      # Parameter entry form
│   │   ├── GroupTable.tsx          # Studios data grid
│   │   ├── RoomTable.tsx           # Room assignments data grid
│   │   ├── FloorSummary.tsx        # Floor capacity utilisation
│   │   ├── DiagnosticsPanel.tsx    # Warnings and errors
│   │   ├── FinanceSummaryPanel.tsx # Staffing cost breakdown
│   │   ├── AllocationActions.tsx   # Rotate / Export buttons
│   │   └── RoomSelectionPanel.tsx  # Toggle rooms in/out
│   ├── hooks/
│   │   ├── useSpaceData.ts         # CSV loading and room state
│   │   └── useAllocationEngine.ts  # Grouping to allocation pipeline
│   ├── pages/
│   │   └── DashboardPage.tsx       # Main layout
│   ├── utils/
│   │   ├── allocation.ts           # 3-pass allocation algorithm
│   │   ├── grouping.ts             # Studio generation
│   │   ├── capacity.ts             # Floor buffer tracking
│   │   ├── spaceTransform.ts       # CSV normalisation and floor summaries
│   │   ├── finance.ts              # Staffing cost calculations
│   │   ├── export.ts               # CSV export
│   │   └── csv.ts                  # Papa Parse wrapper
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── App.tsx                     # Theme setup + root component
│   └── main.tsx                    # Application entry point
├── docs/
│   └── how-to-guide.tex            # LaTeX version of this guide
├── package.json
├── vite.config.ts
├── tsconfig.json
└── eslint.config.js
```

### Architecture and Data Flow

```
CSV files (public/data/)
    │
    ▼
useSpaceData hook
  • fetch and parse CSV
  • normalise rooms
  • build floor list
  • toggle room inclusion
    │
    │  rooms, floors
    ▼
AllocationForm (user inputs)
    │
    ▼
useAllocationEngine hook
  1. generateStudios()   — create student groups
  2. allocateStudios()   — assign groups to rooms
  3. buildFinance()      — calculate staffing costs
    │
    │  result
    ▼
Dashboard panels
  • StudioTable
  • RoomTable
  • FloorSummary
  • DiagnosticsPanel
  • FinanceSummaryPanel
```

### CSV Input Formats

#### `space_division.csv`

Exported from Astra scheduling software. Building and level values carry forward to subsequent rows when left blank.

```csv
BUILDING,LEVEL,STUDIO,ROOM,ASTRA OCCUPANCY,GROUP ID,OCCUPANCY %,SEATS LEFT,NOTES
Design South (DS),Level - 1,-,143,30,,,,
,Level - 2,-,220,16,,,,
,,,221,24,,,,
```

| Column | Required | Description |
|--------|----------|-------------|
| `BUILDING` | Yes | Building name (carries forward when blank) |
| `LEVEL` | Yes | Floor label (carries forward when blank) |
| `STUDIO` | No | If set to a studio label, the room is part of a combined space |
| `ROOM` | Yes | Unique room number |
| `ASTRA OCCUPANCY` | Yes | Room capacity (seats) |
| Others | No | Ignored by the application |

#### `combined_spaces.csv`

Defines zones — groups of rooms that function as a single combined space.

```csv
combined_id,members,capacity_override,mode
DS-320-321,"320,321",110,zone
DN-265-283,"265,267,269,271,277,281,283",210,zone
```

| Column | Required | Description |
|--------|----------|-------------|
| `combined_id` | Yes | Unique identifier for the zone |
| `members` | Yes | Comma-separated list of room numbers |
| `capacity_override` | No | Override the summed capacity; if blank, member capacities are added |
| `mode` | No | Currently only `zone` is used |

### Allocation Algorithm Deep Dive

The allocation engine (`src/utils/allocation.ts`) runs a **greedy three-pass** algorithm:

1. **Grouping** — `generateStudios()` creates studio groups from program sizes, respecting the studio cap and mixing preferences.
2. **Sorting** — Studios are sorted largest-first so big groups are placed before small ones.
3. **Room shuffling** — Rooms are shuffled using a seeded linear-congruential generator (LCG) so that results are reproducible but can be rotated.
4. **Three allocation passes:**

| Pass | Strategy | Room Constraint |
|------|----------|-----------------|
| 1 — Strict | Only assign if the studio fits within the room's base capacity minus already-used seats. | `baseCapacity - usedCapacity >= studioSize` |
| 2 — Next fit | Use the room's dynamic capacity (base + previously borrowed extra). | `dynamicCapacity - usedCapacity >= studioSize` |
| 3 — Dynamic | Allow exceeding base capacity by borrowing from the floor buffer, if buffer remains. | `extraCapacityAllowed - extraCapacityUsed >= incrementalExtra` |

5. **Floor buffer** — Each floor may exceed its summed base capacity by up to `FLOOR_BUFFER_RATIO` (default 15%). When a room borrows extra seats, the increment is deducted from the floor's remaining buffer.
6. **Diagnostics** — Any studio that fails all three passes is marked unassigned, and a diagnostic message is recorded.

### Finance Model

The finance module (`src/utils/finance.ts`) calculates annualised staffing costs using the following formula per role:

```
compensation = baseRate * headCount
ERE          = compensation * ereRate
risk         = compensation * 1.1%
techFee      = compensation * 2.5%
subtotal     = compensation + ERE + risk + techFee
adminCharge  = subtotal * 8.5%
totalCost    = subtotal + adminCharge
```

Default rates:

| Role | Base Compensation | ERE Rate |
|------|-------------------|----------|
| Faculty | $85,000 / year | 30.6% |
| TA / FA | User-entered per semester, annualised | 11.0% |
| Grader | $18,000 / year | 1.9% |

### Customization Reference

#### No-code customizations

| What to Change | How |
|----------------|-----|
| Room inventory | Replace `public/data/space_division.csv` with a new Astra export |
| Combined zones | Edit `public/data/combined_spaces.csv` |
| Program count, sizes, mixing | Change values in the dashboard form |
| Include/exclude rooms | Toggle checkboxes in the Room Selection panel |
| Shuffle assignment order | Click *Rotate Allocation* |

#### Code-level customizations

| What to Change | File | Constant or Location |
|----------------|------|----------------------|
| Floor buffer percentage | `src/utils/spaceTransform.ts` | `FLOOR_BUFFER_RATIO` (default `0.15`) |
| Default shuffle seed | `src/utils/allocation.ts` | `DEFAULT_SEED` (default `17`) |
| Theme colours | `src/App.tsx` | `createTheme({ palette: { ... } })` |
| Form default values | `src/components/AllocationForm.tsx` | `defaultValues` object |
| Faculty base salary | `src/utils/finance.ts` | `COMPENSATION_MATRIX[0].compensation` |
| Grader base salary | `src/utils/finance.ts` | `COMPENSATION_MATRIX[2].compensation` |
| ERE, risk, tech, admin rates | `src/utils/finance.ts` | `RISK_RATE`, `TECH_FEE_RATE`, `ADMIN_SERVICE_RATE`, per-role `ereRate` |
| Allocation strategy logic | `src/utils/allocation.ts` | `findRoomByStrategy()` |
| Studio grouping logic | `src/utils/grouping.ts` | `generateStudios()` |
| CSV export columns | `src/utils/export.ts` | `exportAllocationCsv()` |

---

## Running the App

```bash
# Install dependencies (re-run if package.json changes)
npm install

# Start development server at http://localhost:5173
npm run dev

# Type-check and build for production (output in /dist)
npm run build

# Serve the production build locally
npm run preview

# Lint the codebase
npm run lint
```

---

## LaTeX Documentation

A LaTeX version of this How-to Guide is available at [`docs/how-to-guide.tex`](docs/how-to-guide.tex). Compile it with any standard LaTeX toolchain:

```bash
cd docs
pdflatex how-to-guide.tex
# Run twice for table of contents
pdflatex how-to-guide.tex
```

---

## Notes and Next Steps

- The dev server is not auto-started; run `npm run dev` when you are ready.
- Vite warns about a >500 kB bundle because of MUI/DataGrid. Add manual chunking in `vite.config.ts` if you need smaller bundles.
- If facilities provide explicit floor-area or capacity-limit columns, replace the proxy logic in `spaceTransform.ts` to use those authoritative values.
- No test framework is configured yet. Consider adding Vitest for unit tests covering `allocation.ts` and `grouping.ts`.
