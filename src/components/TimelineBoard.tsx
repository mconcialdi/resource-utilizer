import { useMemo } from 'react';
import type { Conflict, Engineer, Scenario } from '../types';
import { assignedPhases, conflictedPhaseIds } from '../lib/capacity';
import {
  addDays,
  calendarDaysBetween,
  fmtShort,
  fromISO,
  phaseEnd,
  today,
} from '../lib/dates';
import { PHASE_META } from '../lib/phaseConfig';

const DAY_W = 22; // px per calendar day
const LABEL_W = 168;
const ROW_H = 34;

export function TimelineBoard({
  scenario,
  engineers,
  conflicts,
}: {
  scenario: Scenario;
  engineers: Engineer[];
  conflicts: Conflict[];
}) {
  const conflicted = useMemo(() => conflictedPhaseIds(conflicts), [conflicts]);

  const { windowStart, totalDays, weekMarks } = useMemo(() => {
    const starts: Date[] = [];
    const ends: Date[] = [];
    for (const f of scenario.features) {
      for (const p of f.phases) {
        starts.push(fromISO(p.startDate));
        ends.push(phaseEnd(p.startDate, p.durationDays));
      }
    }
    const now = today();
    let minStart = starts.reduce((m, d) => (d < m ? d : m), now);
    let maxEnd = ends.reduce((m, d) => (d > m ? d : m), now);
    // pad and snap start back to a Monday
    minStart = addDays(minStart, -3);
    while (minStart.getDay() !== 1) minStart = addDays(minStart, -1);
    maxEnd = addDays(maxEnd, 5);
    const total = Math.max(35, calendarDaysBetween(minStart, maxEnd));
    const marks: { left: number; label: string }[] = [];
    for (let i = 0; i <= total; i += 7) {
      marks.push({ left: i * DAY_W, label: fmtShort(addDays(minStart, i)) });
    }
    return { windowStart: minStart, totalDays: total, weekMarks: marks };
  }, [scenario]);

  const width = totalDays * DAY_W;
  const todayLeft = calendarDaysBetween(windowStart, today()) * DAY_W;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Timeline — phases per person over time
        </h2>
        <p className="text-xs text-slate-400">
          Red outline = double-booked. Dashed line = today. Scroll horizontally for future weeks.
        </p>
      </div>

      <div className="flex">
        {/* sticky engineer labels */}
        <div className="shrink-0 border-r border-slate-100" style={{ width: LABEL_W }}>
          <div className="h-8 border-b border-slate-100 bg-slate-50" />
          {engineers.map((e) => (
            <div
              key={e.id}
              className="flex items-center truncate border-b border-slate-50 px-3 text-sm text-slate-700"
              style={{ height: ROW_H }}
              title={e.name}
            >
              {e.name}
            </div>
          ))}
        </div>

        {/* scrollable timeline */}
        <div className="overflow-x-auto tl-scroll">
          <div style={{ width }}>
            {/* week header */}
            <div className="relative h-8 border-b border-slate-100 bg-slate-50">
              {weekMarks.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l border-slate-200 pl-1 text-[10px] leading-8 text-slate-400"
                  style={{ left: m.left }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* rows */}
            <div className="relative">
              {/* today line spanning all rows */}
              {todayLeft >= 0 && todayLeft <= width && (
                <div
                  className="pointer-events-none absolute top-0 z-10 border-l-2 border-dashed border-rose-400"
                  style={{ left: todayLeft, height: engineers.length * ROW_H }}
                />
              )}
              {engineers.map((e) => {
                const work = assignedPhases(scenario, e.id);
                return (
                  <div
                    key={e.id}
                    className="relative border-b border-slate-50"
                    style={{ height: ROW_H }}
                  >
                    {weekMarks.map((m, i) => (
                      <div
                        key={i}
                        className="absolute top-0 h-full border-l border-slate-50"
                        style={{ left: m.left }}
                      />
                    ))}
                    {work.map((ap) => {
                      const left = calendarDaysBetween(windowStart, ap.start) * DAY_W;
                      const span = (calendarDaysBetween(ap.start, ap.end) + 1) * DAY_W;
                      const meta = PHASE_META[ap.phase.type];
                      const isConf = conflicted.has(ap.phase.id);
                      return (
                        <div
                          key={ap.phase.id}
                          className={`absolute top-1 flex items-center overflow-hidden rounded border px-1 text-[10px] font-medium text-white ${meta.color} ${
                            isConf ? 'ring-2 ring-red-600 ring-offset-1' : ''
                          }`}
                          style={{ left, width: Math.max(span - 2, 14), height: ROW_H - 8 }}
                          title={`${ap.featureKey} ${ap.featureName} · ${meta.label}`}
                        >
                          <span className="truncate">
                            {ap.featureKey.replace('DEMO-', '#')} {meta.short}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
      {(
        ['Draft', 'Coding', 'CodeReviewFE', 'CodeReviewBE', 'E2E', 'Signoff'] as const
      ).map((t) => (
        <span key={t} className="flex items-center gap-1">
          <span className={`inline-block h-3 w-3 rounded ${PHASE_META[t].color}`} />
          {PHASE_META[t].short}
        </span>
      ))}
    </div>
  );
}
