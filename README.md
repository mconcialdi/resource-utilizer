# SDD Capacity Planner

A lightweight **capacity + what-if planning layer on top of the SDD process**. It answers the three
questions Jira can't:

1. **Who's on what right now**, and when do they finish?
2. **When will each person be free** to join the next pod (e.g. a Drafting Trio)?
3. **Does a proposed assignment double-book anyone?** — tested non-destructively, no live ticket edits.

> Why this exists: Jira models *work decomposition* (Main Story → Coding / Code Review FE+BE / E2E /
> Signoff subtasks) but not *people-over-time capacity*. Its one-assignee-per-item rule forces duplicate
> "allocation" subtasks (see SCI-2771: SCI-2752/2753/2754) and its dates are immutable live tickets, so
> you can't run what-if scenarios. This tool fills that gap.

## Run

```bash
npm install
npm run dev      # open the printed http://localhost:51xx
npm run build    # typecheck + production build
npx tsx scripts/check.ts   # headless sanity check of the capacity engine
```

## What's in it

- **Timeline** — person-axis Gantt of every SDD phase; red outline = double-booked; dashed line = today.
- **Resource roster** — current phase, free-from date, days-left; sortable by availability.
- **Plan new work (what-if)** — define a feature + SDD phases, assign *multiple* people per phase, and see
  double-bookings light up live. "Fit start to availability" auto-schedules to when assignees are free.
- **Availability finder** — "find N draft/delivery-capable engineers free by <date>" + earliest all-free date.
- **Baseline ↔ What-if** toggle — scenarios are non-destructive; reset anytime.

## Design notes

- **Synthetic data only** (`src/seed/seedData.ts`) — no PHI/PII. 16 invented engineers + 5 features, with
  one intentional double-booking (Maya Lin) to demo conflict detection out of the box.
- **Capacity model:** one phase per person at a time; any date overlap = conflict. Durations are counted in
  **business days**.
- **Core engine:** `src/lib/capacity.ts` (pure functions: `freeFrom`, `detectConflicts`,
  `earliestAllFree`, `daysLeftOnCurrentWork`) + `src/lib/dates.ts` (business-day math).
- **State:** `src/store/planStore.ts` (Zustand) holds an immutable baseline and an editable scenario;
  the working scenario persists to `localStorage`.

## Next steps (not built yet)

- **Read-only Jira sync** — replace the seed with real in-flight SDD tickets via the Atlassian API
  (map Main Story + allocation subtasks → Feature + per-phase assignees).
- **Write-back** — on committing a scenario, auto-create the allocation subtasks/dates in Jira
  (eliminates the duplicate-subtask chore).
- Workload heatmap; fractional (%) allocation model.
