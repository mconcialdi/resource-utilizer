import { useMemo, useState } from 'react';
import type { Division, PhaseType } from '../types';
import { usePlan } from '../store/planStore';
import { assignedPhases, earliestAllFree, freeFrom, PHASE_ORDER } from '../lib/capacity';
import {
  fmtShort,
  fromISO,
  phaseEnd,
  rangesOverlap,
  shiftBusinessDays,
  todayISO,
  toISO,
} from '../lib/dates';
import { PHASE_META } from '../lib/phaseConfig';

interface Row {
  enabled: boolean;
  assigneeIds: string[];
  durationDays: number;
}

function defaultRows(division: Division): Record<PhaseType, Row> {
  const on = (t: PhaseType) =>
    division === 'Draft' ? t === 'Draft' : t !== 'Draft';
  return PHASE_ORDER.reduce(
    (acc, t) => {
      acc[t] = { enabled: on(t), assigneeIds: [], durationDays: PHASE_META[t].defaultDays };
      return acc;
    },
    {} as Record<PhaseType, Row>,
  );
}

export function NewWorkForm() {
  const scenario = usePlan((s) => s.scenario);
  const engineers = usePlan((s) => s.engineers);
  const addFeature = usePlan((s) => s.addFeature);

  const [name, setName] = useState('');
  const [division, setDivision] = useState<Division>('Delivery');
  const [startISO, setStartISO] = useState(todayISO());
  const [rows, setRows] = useState<Record<PhaseType, Row>>(() => defaultRows('Delivery'));

  const changeDivision = (d: Division) => {
    setDivision(d);
    setRows(defaultRows(d));
  };

  // Sequentially schedule enabled phases starting at startISO (each begins the day after the prior ends).
  const schedule = useMemo(() => {
    let cursor = fromISO(startISO);
    const out: {
      type: PhaseType;
      startDate: string;
      durationDays: number;
      assigneeIds: string[];
      start: Date;
      end: Date;
    }[] = [];
    for (const t of PHASE_ORDER) {
      const r = rows[t];
      if (!r.enabled) continue;
      const start = cursor;
      const end = phaseEnd(toISO(start), r.durationDays);
      out.push({
        type: t,
        startDate: toISO(start),
        durationDays: r.durationDays,
        assigneeIds: r.assigneeIds,
        start,
        end,
      });
      cursor = shiftBusinessDays(end, 1);
    }
    return out;
  }, [rows, startISO]);

  // Live double-booking preview against the current what-if scenario.
  const warnings = useMemo(() => {
    const map = new Map<string, { name: string; until: Date }>();
    for (const ph of schedule) {
      for (const id of ph.assigneeIds) {
        const overlaps = assignedPhases(scenario, id).some((ap) =>
          rangesOverlap(ap.start, ap.end, ph.start, ph.end),
        );
        if (overlaps) {
          const name = engineers.find((e) => e.id === id)?.name ?? id;
          map.set(id, { name, until: freeFrom(scenario, id) });
        }
      }
    }
    return [...map.values()];
  }, [schedule, scenario, engineers]);

  const allAssignees = [...new Set(schedule.flatMap((p) => p.assigneeIds))];
  const projectedEnd = schedule.length ? schedule[schedule.length - 1].end : null;
  const canSubmit = name.trim() !== '' && schedule.some((p) => p.assigneeIds.length > 0);

  const fitToAvailability = () => {
    if (allAssignees.length === 0) return;
    setStartISO(toISO(earliestAllFree(scenario, allAssignees)));
  };

  const submit = () => {
    if (!canSubmit) return;
    addFeature({
      name: name.trim(),
      division,
      phases: schedule.map((p) => ({
        type: p.type,
        startDate: p.startDate,
        durationDays: p.durationDays,
        assigneeIds: p.assigneeIds,
      })),
    });
    setName('');
    setRows(defaultRows(division));
    setStartISO(todayISO());
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">Plan new work (what-if)</h2>

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-xs text-slate-500">Feature name</span>
          <input
            className="rounded border border-slate-300 px-2 py-1"
            placeholder="e.g. Self Check-in Reminders"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Division</span>
          <select
            className="rounded border border-slate-300 px-2 py-1"
            value={division}
            onChange={(e) => changeDivision(e.target.value as Division)}
          >
            <option value="Delivery">Delivery</option>
            <option value="Draft">Draft</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Start date</span>
          <input
            type="date"
            className="rounded border border-slate-300 px-2 py-1"
            value={startISO}
            onChange={(e) => setStartISO(e.target.value)}
          />
        </label>
      </div>

      <button
        className="mb-3 text-xs font-medium text-violet-700 hover:underline disabled:text-slate-300"
        onClick={fitToAvailability}
        disabled={allAssignees.length === 0}
      >
        ⤿ Fit start to when assignees are free
      </button>

      <div className="space-y-2">
        {PHASE_ORDER.map((t) => {
          const r = rows[t];
          const sched = schedule.find((s) => s.type === t);
          return (
            <div
              key={t}
              className={`rounded-lg border p-2 ${
                r.enabled ? 'border-slate-200' : 'border-slate-100 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) =>
                      setRows((prev) => ({ ...prev, [t]: { ...prev[t], enabled: e.target.checked } }))
                    }
                  />
                  <span className={`inline-block h-3 w-3 rounded ${PHASE_META[t].color}`} />
                  {PHASE_META[t].label}
                </label>
                {sched && (
                  <span className="text-[11px] text-slate-400">
                    {fmtShort(sched.start)} → {fmtShort(sched.end)}
                  </span>
                )}
              </div>

              {r.enabled && (
                <div className="mt-2 flex gap-2">
                  <select
                    multiple
                    className="h-20 flex-1 rounded border border-slate-300 px-1 py-1 text-xs"
                    value={r.assigneeIds}
                    onChange={(e) =>
                      setRows((prev) => ({
                        ...prev,
                        [t]: {
                          ...prev[t],
                          assigneeIds: [...e.target.selectedOptions].map((o) => o.value),
                        },
                      }))
                    }
                  >
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.name} ({eng.roles.join('/')}) — free {fmtShort(freeFrom(scenario, eng.id))}
                      </option>
                    ))}
                  </select>
                  <label className="flex w-16 flex-col gap-1 text-[11px] text-slate-500">
                    days
                    <input
                      type="number"
                      min={1}
                      className="rounded border border-slate-300 px-1 py-1 text-sm"
                      value={r.durationDays}
                      onChange={(e) =>
                        setRows((prev) => ({
                          ...prev,
                          [t]: { ...prev[t], durationDays: Math.max(1, Number(e.target.value) || 1) },
                        }))
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* live preview */}
      <div className="mt-3 text-sm">
        {projectedEnd && (
          <div className="text-slate-600">
            Projected finish: <b>{fmtShort(projectedEnd)}</b>
          </div>
        )}
        {warnings.length > 0 ? (
          <div className="mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
            ⚠ Double-books{' '}
            {warnings.map((w, i) => (
              <span key={i}>
                <b>{w.name}</b> (free {fmtShort(w.until)}){i < warnings.length - 1 ? ', ' : ''}
              </span>
            ))}
            . Push the start date later or pick someone free.
          </div>
        ) : (
          allAssignees.length > 0 && (
            <div className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
              ✓ Fits cleanly — no double-bookings.
            </div>
          )
        )}
      </div>

      <button
        className="mt-3 w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:bg-slate-300"
        onClick={submit}
        disabled={!canSubmit}
      >
        Add to what-if scenario
      </button>
    </div>
  );
}
