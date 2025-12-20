'use client';

import React from 'react';
import posthog from 'posthog-js';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ChartErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error Boundary caught:', error, errorInfo);
    // PostHog: Capture chart rendering errors
    posthog.captureException(error, {
      component_stack: errorInfo.componentStack,
      error_boundary: 'ChartErrorBoundary',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="my-6 p-8 bg-red-50 border-2 border-red-200 rounded-lg text-center">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-600 font-medium">Chart Rendering Error</p>
          <p className="text-sm text-red-500 mt-1">{this.state.error?.message || 'Unknown error'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
