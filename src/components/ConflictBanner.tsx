import type { Conflict, Engineer } from '../types';
import { PHASE_META } from '../lib/phaseConfig';
import { fmtShortISO } from '../lib/dates';

export function ConflictBanner({
  conflicts,
  engineers,
}: {
  conflicts: Conflict[];
  engineers: Engineer[];
}) {
  const nameOf = (id: string) => engineers.find((e) => e.id === id)?.name ?? id;

  if (conflicts.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
        ✓ No double-bookings — everyone is assigned to one phase at a time.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <div className="mb-1 font-semibold">
        ⚠ {conflicts.length} double-booking{conflicts.length > 1 ? 's' : ''} detected
      </div>
      <ul className="space-y-0.5">
        {conflicts.map((c, i) => (
          <li key={i}>
            <span className="font-medium">{nameOf(c.engineerId)}</span> is on{' '}
            <code className="rounded bg-white px-1">{c.a.featureKey} · {PHASE_META[c.a.phaseType].short}</code>{' '}
            and{' '}
            <code className="rounded bg-white px-1">{c.b.featureKey} · {PHASE_META[c.b.phaseType].short}</code>{' '}
            ({fmtShortISO(c.overlapStart)}–{fmtShortISO(c.overlapEnd)})
          </li>
        ))}
      </ul>
    </div>
  );
}
