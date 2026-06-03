import { useMemo } from 'react';
import { usePlan } from './store/planStore';
import { detectConflicts } from './lib/capacity';
import { ScenarioControls } from './components/ScenarioControls';
import { ConflictBanner } from './components/ConflictBanner';
import { TimelineBoard } from './components/TimelineBoard';
import { RosterPanel } from './components/RosterPanel';
import { AvailabilityFinder } from './components/AvailabilityFinder';
import { NewWorkForm } from './components/NewWorkForm';

function App() {
  const activeView = usePlan((s) => s.activeView);
  const baseline = usePlan((s) => s.baseline);
  const scenario = usePlan((s) => s.scenario);
  const engineers = usePlan((s) => s.engineers);

  const active = activeView === 'baseline' ? baseline : scenario;
  const conflicts = useMemo(() => detectConflicts(active, engineers), [active, engineers]);

  return (
    <div className="mx-auto max-w-[1400px] p-4 lg:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">SDD Capacity Planner</h1>
          <p className="text-sm text-slate-500">
            Who's on what · when they're free · what-if without touching Jira
          </p>
        </div>
        <ScenarioControls />
      </header>

      <div className="mb-4">
        <ConflictBanner conflicts={conflicts} engineers={engineers} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <TimelineBoard scenario={active} engineers={engineers} conflicts={conflicts} />
          <RosterPanel scenario={active} engineers={engineers} conflicts={conflicts} />
        </div>
        <div className="space-y-4">
          <NewWorkForm />
          <AvailabilityFinder scenario={active} engineers={engineers} />
        </div>
      </div>

      <footer className="mt-6 text-center text-xs text-slate-400">
        Synthetic data only — no PHI/PII. Prototype for hackathon. Capacity model: one phase per person
        at a time.
      </footer>
    </div>
  );
}

export default App;
