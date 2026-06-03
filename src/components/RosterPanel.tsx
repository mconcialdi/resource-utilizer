import { useMemo, useState } from 'react';
import type { Conflict, Engineer, Scenario } from '../types';
import {
  currentPhase,
  daysLeftOnCurrentWork,
  freeFrom,
  conflictsForEngineer,
} from '../lib/capacity';
import { fmtShort, toISO } from '../lib/dates';
import { PHASE_META, ROLE_COLOR } from '../lib/phaseConfig';

type SortKey = 'free' | 'name' | 'days';

export function RosterPanel({
  scenario,
  engineers,
  conflicts,
}: {
  scenario: Scenario;
  engineers: Engineer[];
  conflicts: Conflict[];
}) {
  const [sort, setSort] = useState<SortKey>('free');

  const rows = useMemo(() => {
    const data = engineers.map((e) => {
      const cur = currentPhase(scenario, e.id);
      const ff = freeFrom(scenario, e.id);
      return {
        eng: e,
        current: cur,
        freeFrom: ff,
        daysLeft: daysLeftOnCurrentWork(scenario, e.id),
        conflicted: conflictsForEngineer(conflicts, e.id).length > 0,
      };
    });
    data.sort((a, b) => {
      if (sort === 'name') return a.eng.name.localeCompare(b.eng.name);
      if (sort === 'days') return a.daysLeft - b.daysLeft;
      return a.freeFrom.getTime() - b.freeFrom.getTime();
    });
    return data;
  }, [scenario, engineers, conflicts, sort]);

  const th = (label: string, key: SortKey) => (
    <button
      className={`text-left font-semibold ${sort === key ? 'text-violet-700' : 'text-slate-500'}`}
      onClick={() => setSort(key)}
    >
      {label}
      {sort === key ? ' ↓' : ''}
    </button>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Resource roster — who's on what</h2>
        <span className="text-xs text-slate-400">sort by header</span>
      </div>
      <div className="max-h-[420px] overflow-auto tl-scroll">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide">
            <tr className="[&>th]:px-4 [&>th]:py-2">
              <th>{th('Resource', 'name')}</th>
              <th className="text-left font-semibold text-slate-500">Role</th>
              <th className="text-left font-semibold text-slate-500">Working on now</th>
              <th>{th('Free from', 'free')}</th>
              <th>{th('Days left', 'days')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.eng.id}
                className={`border-t border-slate-100 [&>td]:px-4 [&>td]:py-2 ${
                  r.conflicted ? 'bg-red-50' : ''
                }`}
              >
                <td className="font-medium text-slate-800">
                  {r.eng.name}
                  {r.conflicted && <span className="ml-1 text-red-600" title="Double-booked">⚠</span>}
                </td>
                <td>
                  <span className="flex flex-wrap gap-1">
                    {r.eng.roles.map((role) => (
                      <span key={role} className={`rounded px-1.5 py-0.5 text-xs ${ROLE_COLOR[role]}`}>
                        {role}
                      </span>
                    ))}
                    {r.eng.canDraft && (
                      <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-700">
                        Draft✓
                      </span>
                    )}
                  </span>
                </td>
                <td className="text-slate-600">
                  {r.current ? (
                    <span>
                      <span className="font-mono text-xs text-slate-500">{r.current.featureKey}</span>{' '}
                      · {PHASE_META[r.current.phase.type].short}
                    </span>
                  ) : (
                    <span className="text-emerald-600">Available</span>
                  )}
                </td>
                <td className={r.daysLeft === 0 ? 'text-emerald-600' : 'text-slate-700'}>
                  {r.daysLeft === 0 ? 'now' : fmtShort(r.freeFrom)}
                  <span className="ml-1 text-[10px] text-slate-300">{toISO(r.freeFrom).slice(5)}</span>
                </td>
                <td className="text-slate-700">{r.daysLeft}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
