'use client';

/**
 * LEARN PAGE
 * The main learning workspace where users build AI workflows
 */

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLearningStore } from '@/stores/learning-store';
import { LearnWorkspace } from '@/components/workspace/LearnWorkspace';
import { TierSelector } from '@/components/onboard/TierSelector';
import type { BusinessTier, AtomicKnowledgeUnit } from '@/types';

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading your learning path...</p>
      </div>
    </div>
  );
}

function LearnPageContent() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get('tier') as BusinessTier | null;

  const { learnerId, tier, initSession } = useLearningStore();
  const [isLoading, setIsLoading] = useState(true);
  const [akus, setAkus] = useState<AtomicKnowledgeUnit[]>([]);

  // Load AKUs for the tier
  useEffect(() => {
    async function loadCurriculum() {
      if (!tierParam && !tier) {
        setIsLoading(false);
        return;
      }

      const selectedTier = tierParam || tier;

      try {
        const response = await fetch(`/api/curriculum?tier=${selectedTier}`);
        const data = await response.json();
        setAkus(data.akus);

        // Initialize session if not already done
        if (!learnerId) {
          const newLearnerId = crypto.randomUUID();
          initSession(newLearnerId, selectedTier!, data.akus);
        }
      } catch (error) {
        console.error('Failed to load curriculum:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurriculum();
  }, [tierParam, tier, learnerId, initSession]);

  // Show tier selector if no tier selected
  if (!isLoading && !tierParam && !tier) {
    return <TierSelector />;
  }

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <LearnWorkspace />;
}

export default function LearnPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LearnPageContent />
    </Suspense>
  );
}
