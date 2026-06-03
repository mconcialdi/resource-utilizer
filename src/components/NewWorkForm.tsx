import { useMemo, useState } from 'react';
import type { Division, Engineer, PhaseType } from '../types';
import { usePlan } from '../store/planStore';
import { assignedPhases, earliestAllFree, freeFrom, PHASE_ORDER } from '../lib/capacity';
import {
  fmtShort,
  fromISO,
  phaseEnd,
  rangesOverlap,
  shiftBusinessDays,
  today,
  todayISO,
  toISO,
} from '../lib/dates';
import { PHASE_META, ROLE_COLOR } from '../lib/phaseConfig';

interface Row {
  enabled: boolean;
  assigneeIds: string[];
  durationDays: number;
  target: number; // desired headcount for this phase
  showAll: boolean; // show off-role engineers too
}

function defaultRows(division: Division): Record<PhaseType, Row> {
  const on = (t: PhaseType) => (division === 'Draft' ? t === 'Draft' : t !== 'Draft');
  return PHASE_ORDER.reduce(
    (acc, t) => {
      acc[t] = {
        enabled: on(t),
        assigneeIds: [],
        durationDays: PHASE_META[t].defaultDays,
        target: PHASE_META[t].defaultTarget,
        showAll: false,
      };
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

  const patchRow = (t: PhaseType, patch: Partial<Row>) =>
    setRows((prev) => ({ ...prev, [t]: { ...prev[t], ...patch } }));

  const toggleAssignee = (t: PhaseType, id: string) =>
    setRows((prev) => {
      const cur = prev[t].assigneeIds;
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...prev, [t]: { ...prev[t], assigneeIds: next } };
    });

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
      out.push({ type: t, startDate: toISO(start), durationDays: r.durationDays, assigneeIds: r.assigneeIds, start, end });
      cursor = shiftBusinessDays(end, 1);
    }
    return out;
  }, [rows, startISO]);

  const scheduleByType = useMemo(
    () => Object.fromEntries(schedule.map((s) => [s.type, s])) as Record<PhaseType, (typeof schedule)[number]>,
    [schedule],
  );

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
  const phasesStaffed = schedule.filter((p) => p.assigneeIds.length >= rows[p.type].target).length;
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-3 text-white">
        <h2 className="text-sm font-semibold">Plan new work</h2>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">what-if</span>
      </div>

      <div className="p-4">
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Feature name</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              placeholder="e.g. Self Check-in Reminders"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Phase</span>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              value={division}
              onChange={(e) => changeDivision(e.target.value as Division)}
            >
              <option value="Delivery">Delivery</option>
              <option value="Draft">Draft</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Start date</span>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              value={startISO}
              onChange={(e) => setStartISO(e.target.value)}
            />
          </label>
        </div>

        <button
          className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 disabled:text-slate-300"
          onClick={fitToAvailability}
          disabled={allAssignees.length === 0}
        >
          ⤿ Fit start to when assignees are free
        </button>

        <div className="space-y-3">
          {PHASE_ORDER.map((t) => {
            const r = rows[t];
            const sched = scheduleByType[t];
            return (
              <PhaseCard
                key={t}
                type={t}
                row={r}
                phaseStart={sched?.start ?? null}
                phaseEndDate={sched?.end ?? null}
                engineers={engineers}
                freeFromOf={(id) => freeFrom(scenario, id)}
                onToggleEnabled={(enabled) => patchRow(t, { enabled })}
                onToggleAssignee={(id) => toggleAssignee(t, id)}
                onTarget={(target) => patchRow(t, { target })}
                onDuration={(durationDays) => patchRow(t, { durationDays })}
                onToggleShowAll={() => patchRow(t, { showAll: !r.showAll })}
              />
            );
          })}
        </div>

        {/* scenario readout */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span>
            Team size: <b className="text-slate-800">{allAssignees.length}</b>
          </span>
          <span>
            Phases staffed: <b className="text-slate-800">{phasesStaffed}/{schedule.length}</b>
          </span>
          {projectedEnd && (
            <span>
              Finish: <b className="text-slate-800">{fmtShort(projectedEnd)}</b>
            </span>
          )}
        </div>

        {warnings.length > 0 ? (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            ⚠ Double-books{' '}
            {warnings.map((w, i) => (
              <span key={i}>
                <b>{w.name}</b> (free {fmtShort(w.until)}){i < warnings.length - 1 ? ', ' : ''}
              </span>
            ))}
            . Push the start later or pick someone free.
          </div>
        ) : (
          allAssignees.length > 0 && (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              ✓ Fits cleanly — no double-bookings.
            </div>
          )
        )}

        <button
          className="mt-4 w-full rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400"
          onClick={submit}
          disabled={!canSubmit}
        >
          Add to what-if scenario
        </button>
      </div>
    </div>
  );
}

// --- One phase: enable toggle, target stepper + staffing meter, assignee chips ---
function PhaseCard({
  type,
  row,
  phaseStart,
  phaseEndDate,
  engineers,
  freeFromOf,
  onToggleEnabled,
  onToggleAssignee,
  onTarget,
  onDuration,
  onToggleShowAll,
}: {
  type: PhaseType;
  row: Row;
  phaseStart: Date | null;
  phaseEndDate: Date | null;
  engineers: Engineer[];
  freeFromOf: (id: string) => Date;
  onToggleEnabled: (enabled: boolean) => void;
  onToggleAssignee: (id: string) => void;
  onTarget: (target: number) => void;
  onDuration: (days: number) => void;
  onToggleShowAll: () => void;
}) {
  const meta = PHASE_META[type];
  const candidates = engineers
    .filter((e) => row.showAll || e.roles.some((rr) => meta.roles.includes(rr)))
    .sort((a, b) => freeFromOf(a.id).getTime() - freeFromOf(b.id).getTime());

  const count = row.assigneeIds.length;
  const status =
    count < row.target
      ? { text: `need ${row.target - count} more`, cls: 'text-amber-600' }
      : count === row.target
        ? { text: 'staffed', cls: 'text-emerald-600' }
        : { text: `over by ${count - row.target}`, cls: 'text-red-600' };

  return (
    <div
      className={`rounded-xl border transition ${
        row.enabled ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/60'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            className="accent-violet-600"
            checked={row.enabled}
            onChange={(e) => onToggleEnabled(e.target.checked)}
          />
          <span className={`inline-block h-3 w-3 rounded ${meta.color}`} />
          {meta.label}
        </label>
        {phaseStart && phaseEndDate && (
          <span className="text-[11px] text-slate-400">
            {fmtShort(phaseStart)} → {fmtShort(phaseEndDate)}
          </span>
        )}
      </div>

      {row.enabled && (
        <div className="border-t border-slate-100 px-3 py-3">
          {/* target headcount + staffing meter */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Target</span>
              <div className="inline-flex items-center overflow-hidden rounded-lg border border-slate-300">
                <button
                  className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:text-slate-300"
                  onClick={() => onTarget(Math.max(1, row.target - 1))}
                  disabled={row.target <= 1}
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-semibold text-slate-800">{row.target}</span>
                <button
                  className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:text-slate-300"
                  onClick={() => onTarget(Math.min(8, row.target + 1))}
                  disabled={row.target >= 8}
                >
                  +
                </button>
              </div>
            </div>

            <StaffingMeter count={count} target={row.target} />
            <span className={`text-xs font-semibold ${status.cls}`}>
              {count} of {row.target} · {status.text}
            </span>

            <label className="ml-auto flex items-center gap-1 text-[11px] text-slate-500">
              days
              <input
                type="number"
                min={1}
                className="w-14 rounded border border-slate-300 px-1 py-0.5 text-sm"
                value={row.durationDays}
                onChange={(e) => onDuration(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
          </div>

          {/* assignee chips */}
          <div className="flex flex-wrap gap-1.5">
            {candidates.map((eng) => {
              const selected = row.assigneeIds.includes(eng.id);
              const ff = freeFromOf(eng.id);
              const freeNow = ff <= today();
              const conflictHere = phaseStart ? ff > phaseStart : false;
              return (
                <button
                  key={eng.id}
                  onClick={() => onToggleAssignee(eng.id)}
                  title={`${eng.name} · ${eng.roles.join('/')} · free ${fmtShort(ff)}`}
                  className={`group flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition ${
                    selected
                      ? conflictHere
                        ? 'border-red-500 bg-red-500 text-white ring-2 ring-red-200'
                        : 'border-violet-600 bg-violet-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                      selected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {initials(eng.name)}
                  </span>
                  <span className="font-medium">{eng.name}</span>
                  {!selected && (
                    <span
                      className={`rounded px-1 text-[9px] ${
                        ROLE_COLOR[eng.roles[0]] ?? 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {eng.roles.join('/')}
                    </span>
                  )}
                  <span
                    className={`text-[10px] ${
                      selected ? 'text-white/80' : freeNow ? 'text-emerald-600' : conflictHere ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {selected ? (conflictHere ? `busy→${fmtShort(ff)}` : '✓') : freeNow ? 'now' : fmtShort(ff)}
                  </span>
                </button>
              );
            })}
            <button
              onClick={onToggleShowAll}
              className="rounded-full border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-400 hover:border-slate-400 hover:text-slate-600"
            >
              {row.showAll ? 'role match only' : '+ show all roles'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffingMeter({ count, target }: { count: number; target: number }) {
  const slots = Math.max(target, count);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: slots }).map((_, i) => {
        const filled = i < count;
        const over = i >= target;
        return (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition ${
              filled ? (over ? 'bg-red-500' : 'bg-violet-600') : 'border border-slate-300 bg-transparent'
            }`}
          />
        );
      })}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
