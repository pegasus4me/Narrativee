"use client";

import React, { Suspense, useEffect, useState } from 'react';

// Lazy load the actual Chart component.
// This ensures 'Chart.tsx' (and Nivo) are NEVER loaded on the server.
const LazyChart = React.lazy(() => import('./Chart'));

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  title?: string;
  xField?: string;
  yField?: string;
  data?: any[];
}

export default function ChartWrapper({ config }: { config: ChartConfig }) {
  const [isClient, setIsClient] = useState(false);

  // Double protection: Ensure we only render after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-50 flex items-center justify-center border border-gray-100 rounded-lg">
        <span className="text-gray-400 text-sm">Initializing chart...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-auto">
      <Suspense 
        fallback={
          <div className="w-full h-[400px] bg-gray-50 flex items-center justify-center border border-gray-100 rounded-lg">
            <span className="text-gray-400 text-sm">Loading visualization...</span>
          </div>
        }
      >
        <LazyChart config={config} />
      </Suspense>
    </div>
  );
}