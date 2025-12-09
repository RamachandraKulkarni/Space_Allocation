# Space Allocation Planner

React + TypeScript dashboard that ingests studio capacity CSVs, creates cohort groupings, and assigns whole groups to rooms while obeying floor capacity constraints.

## Tech Stack

- React 19 + Vite 7 (TypeScript)
- MUI v5 (component library + DataGrid)
- React Hook Form + Zod (form + validation)
- Papa Parse (CSV ingestion)

## Project Structure

```

src/
  components/      Reusable UI (form, tables, diagnostics)
  hooks/           Data loading + allocation logic hooks
  pages/           Dashboard screen
  utils/           CSV parsing, grouping, capacity + allocation algorithms
  types/           Shared TypeScript contracts
public/data/       CSV inputs supplied by Facilities
```


## CSV Inputs

Two source files live in `public/data/`:

- `space_division.csv` — base room inventory exported from Astra.
- `combined_spaces.csv` — metadata describing combined “zone” capacities.

The loader normalises the first file, merges combined zones, and derives floor summaries. Because the sample data lacks explicit floor totals/areas, the app currently:

- Uses the Astra capacity as a proxy for room area.
- Allows each floor to flex up to **15 %** beyond the summed Astra capacity. This buffer gates how much “extra” headcount rooms on that floor can borrow. Adjust `FLOOR_BUFFER_RATIO` inside `src/utils/spaceTransform.ts` if facilities share a different limit.

Replace the CSVs with updated exports to refresh the inventory—no code changes required.


## Allocation Workflow

1. **Form** – enter number of cohorts, their sizes, target group size, and whether cross-cohort mixing is allowed.
  - Mixed groups always pull the same number of students from every cohort. The allocator starts near the requested group size but will create smaller equal-share groups whenever the math doesn’t divide cleanly so cohorts stay balanced.
2. **Grouping** (`src/utils/grouping.ts`) – builds whole groups that respect mixing rules, generating IDs and cohort breakdowns.
3. **Capacity tracking** (`src/utils/capacity.ts`) – tracks how much buffer remains per floor.
4. **Room allocation** (`src/utils/allocation.ts`) – greedy algorithm with three passes (strict fit → next fit → dynamic expansion). Rooms can exceed base capacity only if the floor buffer has room. Unassignable groups are flagged with diagnostics.
5. **Output** – MUI DataGrids show groups, rooms, and floor states. Highlights indicate extra capacity usage, exhausted floors, and unassigned groups.
6. **Tools** – “Rotate Allocation” re-runs the allocator with a new shuffle seed; “Export CSV” downloads the final room/group matrix plus any unassigned groups.

## Running the App

```bash
npm install           # already run during scaffolding, re-run if deps change
npm run dev           # start Vite dev server (prompts for localhost:5173)
npm run build         # type-check + production build (used in CI)
npm run preview       # serve the production build locally
```

## Notes & Next Steps

- The dev server is not auto-started; run `npm run dev` when you’re ready.
- Vite warns about a >500 kB bundle because of MUI/DataGrid. Add manual chunking if you need smaller bundles.
- If facilities provide explicit floor-area/limit columns, replace the proxy logic in `spaceTransform.ts` to respect those authoritative values.
