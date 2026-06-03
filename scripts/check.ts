// Headless sanity check of the capacity engine against the seed baseline.
import { ENGINEERS, SEED_FEATURES } from '../src/seed/seedData';
import { detectConflicts, freeFrom, daysLeftOnCurrentWork, earliestAllFree } from '../src/lib/capacity';
import { toISO } from '../src/lib/dates';
import type { Scenario } from '../src/types';

const baseline: Scenario = { id: 'b', name: 'b', isBaseline: true, features: SEED_FEATURES };

const conflicts = detectConflicts(baseline, ENGINEERS);
console.log(`Conflicts detected: ${conflicts.length}`);
for (const c of conflicts) {
  const name = ENGINEERS.find((e) => e.id === c.engineerId)?.name;
  console.log(`  - ${name}: ${c.a.featureKey}/${c.a.phaseType} ⨯ ${c.b.featureKey}/${c.b.phaseType} (${c.overlapStart}..${c.overlapEnd})`);
}

console.log('\nfree-from / days-left (sample):');
for (const id of ['e3', 'e16', 'e12', 'e9', 'e1']) {
  const e = ENGINEERS.find((x) => x.id === id)!;
  console.log(`  ${e.name.padEnd(12)} free ${toISO(freeFrom(baseline, id))}  (${daysLeftOnCurrentWork(baseline, id)}d left)`);
}

const draftable = ENGINEERS.filter((e) => e.canDraft).map((e) => e.id);
const top3 = draftable
  .map((id) => ({ id, ff: freeFrom(baseline, id) }))
  .sort((a, b) => a.ff.getTime() - b.ff.getTime())
  .slice(0, 3);
console.log(`\nEarliest a Drafting Trio (3 draft-capable) can start: ${toISO(earliestAllFree(baseline, top3.map((t) => t.id)))}`);
console.log(`  picked: ${top3.map((t) => ENGINEERS.find((e) => e.id === t.id)?.name).join(', ')}`);
