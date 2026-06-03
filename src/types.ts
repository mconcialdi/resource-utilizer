// Domain types for the SDD Capacity Planner.
// Synthetic data only — no real people or PHI/PII.

export type Role = 'FE' | 'BE' | 'QA' | 'PM' | 'UX';

// Full SDD phase set, in the order the ticketing standard runs them.
export type PhaseType =
  | 'Draft'
  | 'Coding'
  | 'CodeReviewFE'
  | 'CodeReviewBE'
  | 'E2E'
  | 'Signoff';

export type Division = 'Draft' | 'Delivery';

export interface Engineer {
  id: string;
  name: string; // synthetic
  roles: Role[];
  canDraft: boolean;
  canDeliver: boolean;
  podLeadCapable: boolean;
}

export interface Phase {
  id: string;
  featureId: string;
  type: PhaseType;
  startDate: string; // ISO yyyy-MM-dd; endDate is derived from durationDays (business days)
  durationDays: number; // business days
  assigneeIds: string[]; // MANY allowed — this removes Jira's one-assignee limit
}

export interface Feature {
  id: string;
  key: string; // synthetic, e.g. "DEMO-101"
  name: string;
  division: Division;
  proposed?: boolean; // true for what-if work added in a scenario
  phases: Phase[];
}

export interface Scenario {
  id: string;
  name: string;
  isBaseline: boolean;
  features: Feature[];
}

// A detected double-booking: one engineer on two overlapping phases.
export interface Conflict {
  engineerId: string;
  a: { featureKey: string; phaseId: string; phaseType: PhaseType };
  b: { featureKey: string; phaseId: string; phaseType: PhaseType };
  overlapStart: string;
  overlapEnd: string;
}
