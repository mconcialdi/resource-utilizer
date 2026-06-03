import { usePlan } from '../store/planStore';

export function ScenarioControls() {
  const activeView = usePlan((s) => s.activeView);
  const setView = usePlan((s) => s.setView);
  const resetScenario = usePlan((s) => s.resetScenario);
  const proposedCount = usePlan((s) => s.scenario.features.filter((f) => f.proposed).length);

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white text-sm">
        <button
          className={`px-3 py-1.5 font-medium ${
            activeView === 'baseline' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setView('baseline')}
        >
          Baseline
        </button>
        <button
          className={`px-3 py-1.5 font-medium ${
            activeView === 'scenario' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setView('scenario')}
        >
          What-if{proposedCount > 0 ? ` (+${proposedCount})` : ''}
        </button>
      </div>
      {activeView === 'scenario' && (
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          onClick={() => {
            if (confirm('Discard what-if changes and reset to the committed baseline?')) resetScenario();
          }}
        >
          Reset
        </button>
      )}
    </div>
  );
}
