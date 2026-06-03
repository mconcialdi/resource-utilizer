import type { PhaseType, Role } from '../types';

interface PhaseMeta {
  label: string;
  short: string;
  color: string; // Tailwind classes for the timeline block
  defaultDays: number;
  // Roles that typically own this phase (used to suggest assignees).
  roles: Role[];
}

export const PHASE_META: Record<PhaseType, PhaseMeta> = {
  Draft: {
    label: 'Draft (Spec/Scope)',
    short: 'Draft',
    color: 'bg-violet-500 border-violet-700',
    defaultDays: 10,
    roles: ['FE', 'BE'],
  },
  Coding: {
    label: 'Coding',
    short: 'Code',
    color: 'bg-blue-500 border-blue-700',
    defaultDays: 12,
    roles: ['FE', 'BE'],
  },
  CodeReviewFE: {
    label: 'Code Review — FE',
    short: 'CR·FE',
    color: 'bg-cyan-500 border-cyan-700',
    defaultDays: 2,
    roles: ['FE'],
  },
  CodeReviewBE: {
    label: 'Code Review — BE',
    short: 'CR·BE',
    color: 'bg-teal-500 border-teal-700',
    defaultDays: 2,
    roles: ['BE'],
  },
  E2E: {
    label: 'E2E Testing',
    short: 'E2E',
    color: 'bg-amber-500 border-amber-700',
    defaultDays: 4,
    roles: ['QA'],
  },
  Signoff: {
    label: 'Signoffs (CC/QA · TLSO · BLSO)',
    short: 'Signoff',
    color: 'bg-emerald-500 border-emerald-700',
    defaultDays: 2,
    roles: ['BE', 'FE'],
  },
};

export const ROLE_COLOR: Record<Role, string> = {
  FE: 'bg-blue-100 text-blue-800',
  BE: 'bg-teal-100 text-teal-800',
  QA: 'bg-amber-100 text-amber-800',
  PM: 'bg-pink-100 text-pink-800',
  UX: 'bg-purple-100 text-purple-800',
};
