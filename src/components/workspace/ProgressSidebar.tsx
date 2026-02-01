'use client';

/**
 * PROGRESS SIDEBAR
 * Shows learning path progress and allows AKU navigation
 */

import { useLearningStore } from '@/stores/learning-store';
import { TIER_OBJECTIVES } from '@/types';

export function ProgressSidebar() {
  const {
    tier,
    currentAKU,
    akuProgress,
    setCurrentAKU,
  } = useLearningStore();

  const completedCount = akuProgress.filter(p => p.completed).length;
  const progressPercent = akuProgress.length > 0
    ? Math.round((completedCount / akuProgress.length) * 100)
    : 0;

  const tierInfo = tier ? TIER_OBJECTIVES[tier] : null;

  return (
    <div className="w-60 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="text-xl font-bold text-white mb-1">PHAZUR</div>
        {tierInfo && (
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            {tierInfo.deliverable}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progress</span>
          <span className="text-sm font-medium text-white">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {completedCount} of {akuProgress.length} units completed
        </div>
      </div>

      {/* AKU List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs text-slate-500 uppercase tracking-wide px-2 mb-2">
          Learning Units
        </div>
        {akuProgress.map((aku, index) => {
          const isCurrent = currentAKU?.id === aku.id;
          const isLocked = !aku.completed && index > 0 && !akuProgress[index - 1].completed;

          return (
            <button
              key={aku.id}
              disabled={isLocked}
              onClick={() => {
                // In real app, would fetch AKU details
                // For now, just show it's selected
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition mb-1 ${
                isCurrent
                  ? 'bg-blue-600/20 text-white'
                  : aku.completed
                  ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                  : isLocked
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              {/* Status indicator */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                aku.completed
                  ? 'bg-emerald-500 text-white'
                  : isCurrent
                  ? 'bg-blue-500 text-white'
                  : isLocked
                  ? 'bg-slate-800 text-slate-600'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {aku.completed ? '✓' : index + 1}
              </div>

              {/* AKU info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">
                  {aku.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </div>
                {aku.completed && (
                  <div className="text-xs text-emerald-400">Completed</div>
                )}
                {isCurrent && !aku.completed && (
                  <div className="text-xs text-blue-400">In Progress</div>
                )}
                {isLocked && (
                  <div className="text-xs text-slate-600">Locked</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-600 text-center">
          Complete all units to earn your SBT
        </div>
      </div>
    </div>
  );
}
