'use client';

/**
 * PROVIDERS ROOT
 * Combines all client-side providers for the application
 */

import { ReactNode, Suspense } from 'react';
import { AnalyticsProvider } from './AnalyticsProvider';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers wrapper
 * Add any new providers here to make them available app-wide
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <Suspense fallback={null}>
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
    </Suspense>
  );
}
