"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ErrorBoundary${this.props.label ? ' - ' + this.props.label : ''}]`, error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
          <div className="p-3 rounded-full bg-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm ui-text">Ocurrió un error inesperado</p>
            {this.props.label && (
              <p className="text-xs text-muted-foreground mt-1">{this.props.label}</p>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={this.handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
