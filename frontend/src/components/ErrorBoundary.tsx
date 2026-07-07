'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
          <Navbar />
          <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center space-y-6">
            <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
              <AlertTriangle className="h-12 w-12" />
            </div>

            <div className="space-y-2 max-w-md">
              <h1 className="text-3xl font-extrabold tracking-tight">Something Went Wrong</h1>
              <p className="text-sm text-neutral-400 font-medium leading-relaxed">
                An unexpected error occurred while loading this page. Our engineers have been
                notified. Please try reloading below.
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/20 transition-all cursor-pointer"
            >
              <RotateCw className="h-4 w-4" /> Reload Page
            </button>
          </section>
          <Footer />
        </div>
      );
    }

    return this.props.children;
  }
}
