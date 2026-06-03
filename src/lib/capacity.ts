// The capacity engine — pure functions over a Scenario.
// This is the core logic that Jira can't give us: people-over-time availability,
// double-booking detection, and "when is everyone free" for what-if planning.
import type { Conflict, Engineer, Phase, PhaseType, Scenario } from '../types';
import {
  addBusinessDays,
  businessDaysBetween,
  fromISO,
  phaseEnd,
  rangesOverlap,
  today,
} from './dates';

export interface AssignedPhase {
  phase: Phase;
  featureKey: string;
  featureName: string;
  start: Date;
  end: Date; // inclusive
}

/** Every phase in the scenario assigned to a given engineer, with resolved dates. */
export function assignedPhases(scenario: Scenario, engineerId: string): AssignedPhase[] {
  const out: AssignedPhase[] = [];
  for (const f of scenario.features) {
    for (const p of f.phases) {
      if (p.assigneeIds.includes(engineerId)) {
        out.push({
          phase: p,
          featureKey: f.key,
          featureName: f.name,
          start: fromISO(p.startDate),
          end: phaseEnd(p.startDate, p.durationDays),
        });
      }
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** The phase an engineer is actively working today, if any (first match). */
export function currentPhase(scenario: Scenario, engineerId: string): AssignedPhase | null {
  const now = today();
  return (
    assignedPhases(scenario, engineerId).find((ap) => ap.start <= now && now <= ap.end) ?? null
  );
}

/** The next business day an engineer is free (after their last assigned phase). */
export function freeFrom(scenario: Scenario, engineerId: string): Date {
  const work = assignedPhases(scenario, engineerId);
  if (work.length === 0) return today();
  const lastEnd = work.reduce((m, ap) => (ap.end > m ? ap.end : m), work[0].end);
  const next = addBusinessDays(lastEnd, 1);
  // If their work is already in the past, they're free today.
  return next < today() ? today() : next;
}

/** Business days of remaining committed work (today → freeFrom). The "time left" attribute. */
export function daysLeftOnCurrentWork(scenario: Scenario, engineerId: string): number {
  const ff = freeFrom(scenario, engineerId);
  return Math.max(0, businessDaysBetween(today(), ff));
}

/** Earliest date a whole candidate set is simultaneously free. Answers the Drafting-Trio question. */
export function earliestAllFree(scenario: Scenario, engineerIds: string[]): Date {
  if (engineerIds.length === 0) return today();
  return engineerIds
    .map((id) => freeFrom(scenario, id))
    .reduce((m, d) => (d > m ? d : m), today());
}

/** Default start for proposed work assigned to a set of people = when they're all free. */
export function proposedStart(scenario: Scenario, assigneeIds: string[]): Date {
  return earliestAllFree(scenario, assigneeIds);
}

/** All double-bookings: an engineer on two phases whose inclusive ranges overlap. */
export function detectConflicts(scenario: Scenario, engineers: Engineer[]): Conflict[] {
  const conflicts: Conflict[] = [];
  for (const eng of engineers) {
    const work = assignedPhases(scenario, eng.id);
    for (let i = 0; i < work.length; i++) {
      for (let j = i + 1; j < work.length; j++) {
        const a = work[i];
        const b = work[j];
        if (rangesOverlap(a.start, a.end, b.start, b.end)) {
          conflicts.push({
            engineerId: eng.id,
            a: { featureKey: a.featureKey, phaseId: a.phase.id, phaseType: a.phase.type },
            b: { featureKey: b.featureKey, phaseId: b.phase.id, phaseType: b.phase.type },
            overlapStart: maxISO(a.start, b.start),
            overlapEnd: minISO(a.end, b.end),
          });
        }
      }
    }
  }
  return conflicts;
}

/** Set of phase ids that participate in at least one conflict (for red highlighting). */
export function conflictedPhaseIds(conflicts: Conflict[]): Set<string> {
  const s = new Set<string>();
  for (const c of conflicts) {
    s.add(c.a.phaseId);
    s.add(c.b.phaseId);
  }
  return s;
}

export function conflictsForEngineer(conflicts: Conflict[], engineerId: string): Conflict[] {
  return conflicts.filter((c) => c.engineerId === engineerId);
}

// --- small helpers ---
import { toISO } from './dates';
function maxISO(a: Date, b: Date): string {
  return toISO(a > b ? a : b);
}
function minISO(a: Date, b: Date): string {
  return toISO(a < b ? a : b);
}

export const PHASE_ORDER: PhaseType[] = [
  'Draft',
  'Coding',
  'CodeReviewFE',
  'CodeReviewBE',
  'E2E',
  'Signoff',
];
