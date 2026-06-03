// Synthetic seed data — NO real people or PHI/PII (per athenahealth guidance).
// Names below are invented. Dates are generated relative to "today" so the demo
// always looks live, with one intentional double-booking planted (see Maya Lin).
import type { Engineer, Feature, Phase, PhaseType } from '../types';
import { shiftBusinessDays, today, toISO } from '../lib/dates';

export const ENGINEERS: Engineer[] = [
  { id: 'e1', name: 'Ava Stone', roles: ['FE'], canDraft: true, canDeliver: true, podLeadCapable: true },
  { id: 'e2', name: 'Liam Frost', roles: ['BE'], canDraft: true, canDeliver: true, podLeadCapable: true },
  { id: 'e3', name: 'Maya Lin', roles: ['FE'], canDraft: true, canDeliver: true, podLeadCapable: false },
  { id: 'e4', name: 'Noah Reyes', roles: ['BE'], canDraft: true, canDeliver: true, podLeadCapable: false },
  { id: 'e5', name: 'Priya Nair', roles: ['FE'], canDraft: false, canDeliver: true, podLeadCapable: false },
  { id: 'e6', name: 'Diego Marsh', roles: ['BE'], canDraft: false, canDeliver: true, podLeadCapable: false },
  { id: 'e7', name: 'Sofia Greco', roles: ['QA'], canDraft: false, canDeliver: true, podLeadCapable: false },
  { id: 'e8', name: 'Ethan Walsh', roles: ['FE'], canDraft: false, canDeliver: true, podLeadCapable: false },
  { id: 'e9', name: 'Hana Kim', roles: ['BE'], canDraft: true, canDeliver: true, podLeadCapable: true },
  { id: 'e10', name: 'Owen Pratt', roles: ['FE'], canDraft: false, canDeliver: true, podLeadCapable: false },
  { id: 'e11', name: 'Zoe Adler', roles: ['BE'], canDraft: false, canDeliver: true, podLeadCapable: false },
  { id: 'e12', name: 'Ravi Menon', roles: ['FE'], canDraft: true, canDeliver: true, podLeadCapable: false },
  { id: 'e13', name: 'Clara Voss', roles: ['QA'], canDraft: false, canDeliver: true, podLeadCapable: false },
  { id: 'e14', name: 'Marcus Bell', roles: ['BE'], canDraft: false, canDeliver: true, podLeadCapable: false },
  { id: 'e15', name: 'Ivy Chen', roles: ['FE'], canDraft: false, canDeliver: true, podLeadCapable: false },
  { id: 'e16', name: 'Theo Park', roles: ['BE'], canDraft: true, canDeliver: true, podLeadCapable: false },
];

// Build an ISO date `offset` business days from today (offset may be negative).
const d = (offset: number) => toISO(shiftBusinessDays(today(), offset));

let pid = 0;
function phase(
  featureId: string,
  type: PhaseType,
  startOffset: number,
  durationDays: number,
  assigneeIds: string[],
): Phase {
  pid += 1;
  return { id: `p${pid}`, featureId, type, startDate: d(startOffset), durationDays, assigneeIds };
}

export const SEED_FEATURES: Feature[] = [
  {
    id: 'f1',
    key: 'DEMO-101',
    name: 'AthenaOne Basic Pilot',
    division: 'Delivery',
    phases: [
      phase('f1', 'Coding', -3, 12, ['e1', 'e3']), // Ava + Maya, in progress
      phase('f1', 'CodeReviewFE', 10, 2, ['e15']),
      phase('f1', 'CodeReviewBE', 10, 2, ['e2']),
      phase('f1', 'E2E', 13, 4, ['e7']),
      phase('f1', 'Signoff', 18, 2, ['e1']),
    ],
  },
  {
    id: 'f2',
    key: 'DEMO-102',
    name: 'Telehealth Reminders',
    division: 'Delivery',
    phases: [
      phase('f2', 'Coding', -1, 10, ['e4', 'e5']), // Noah + Priya, in progress
      phase('f2', 'CodeReviewBE', 11, 2, ['e9']),
      phase('f2', 'CodeReviewFE', 11, 2, ['e5']),
      phase('f2', 'E2E', 14, 4, ['e13']),
      phase('f2', 'Signoff', 19, 2, ['e2']),
    ],
  },
  {
    id: 'f3',
    key: 'DEMO-103',
    name: 'Kiosk Accessibility',
    division: 'Delivery',
    phases: [
      phase('f3', 'Coding', 0, 14, ['e8', 'e6']), // Ethan + Diego, starts today
      phase('f3', 'CodeReviewFE', 15, 2, ['e8']),
      phase('f3', 'E2E', 18, 4, ['e7']),
    ],
  },
  {
    id: 'f4',
    key: 'DEMO-104',
    name: 'Insurance Scan v2',
    division: 'Draft',
    phases: [
      phase('f4', 'Draft', -5, 10, ['e9', 'e12']), // Hana + Ravi drafting, in progress
    ],
  },
  {
    id: 'f5',
    key: 'DEMO-105',
    name: 'Payment Retry Flow',
    division: 'Delivery',
    phases: [
      // PLANTED CONFLICT: Maya (e3) is also coding DEMO-101 (-3..+8); this overlaps.
      phase('f5', 'Coding', 2, 10, ['e3', 'e11']),
      phase('f5', 'CodeReviewBE', 13, 2, ['e14']),
      phase('f5', 'E2E', 18, 4, ['e13']),
    ],
  },
];
