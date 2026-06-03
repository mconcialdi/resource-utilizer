import { useMemo, useState } from 'react';
import type { Engineer, Scenario } from '../types';
import { earliestAllFree, freeFrom } from '../lib/capacity';
import { fmtShort, fromISO, todayISO } from '../lib/dates';

type Capability = 'any' | 'draft' | 'deliver';

export function AvailabilityFinder({
  scenario,
  engineers,
}: {
  scenario: Scenario;
  engineers: Engineer[];
}) {
  const [capability, setCapability] = useState<Capability>('draft');
  const [size, setSize] = useState(3);
  const [neededBy, setNeededBy] = useState('');

  const ranked = useMemo(() => {
    const qualified = engineers.filter((e) =>
      capability === 'draft' ? e.canDraft : capability === 'deliver' ? e.canDeliver : true,
    );
    return qualified
      .map((e) => ({ eng: e, ff: freeFrom(scenario, e.id) }))
      .sort((a, b) => a.ff.getTime() - b.ff.getTime());
  }, [scenario, engineers, capability]);

  const pick = ranked.slice(0, size);
  const startAll = pick.length ? earliestAllFree(scenario, pick.map((p) => p.eng.id)) : null;
  const neededByDate = neededBy ? fromISO(neededBy) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">
        Availability finder — “who can join next?”
      </h2>

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Capability</span>
          <select
            className="rounded border border-slate-300 px-2 py-1"
            value={capability}
            onChange={(e) => setCapability(e.target.value as Capability)}
          >
            <option value="draft">Draft-capable</option>
            <option value="deliver">Delivery-capable</option>
            <option value="any">Any</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Team size</span>
          <input
            type="number"
            min={1}
            max={8}
            className="rounded border border-slate-300 px-2 py-1"
            value={size}
            onChange={(e) => setSize(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-xs text-slate-500">Needed by (optional)</span>
          <input
            type="date"
            min={todayISO()}
            className="rounded border border-slate-300 px-2 py-1"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
          />
        </label>
      </div>

      {startAll && (
        <div className="mb-3 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">
          Earliest these <b>{pick.length}</b> can all start together:{' '}
          <b>{fmtShort(startAll)}</b>
          {neededByDate &&
            (startAll <= neededByDate ? (
              <span className="ml-1 text-emerald-700">✓ meets your date</span>
            ) : (
              <span className="ml-1 text-red-700">✗ later than needed</span>
            ))}
        </div>
      )}

      <ul className="space-y-1 text-sm">
        {ranked.map(({ eng, ff }, i) => {
          const chosen = i < size;
          const free = ff.getTime() <= new Date().setHours(0, 0, 0, 0);
          const meetsBy = neededByDate ? ff <= neededByDate : true;
          return (
            <li
              key={eng.id}
              className={`flex items-center justify-between rounded px-2 py-1 ${
                chosen ? 'bg-slate-100' : ''
              }`}
            >
              <span className="text-slate-700">
                {chosen && <span className="mr-1 text-violet-600">●</span>}
                {eng.name}
              </span>
              <span
                className={
                  free
                    ? 'text-emerald-600'
                    : neededByDate && !meetsBy
                      ? 'text-red-600'
                      : 'text-slate-500'
                }
              >
                {free ? 'available now' : `free ${fmtShort(ff)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
