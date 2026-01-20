// INPUT: React Error Boundary API
// OUTPUT: 错误边界组件，捕获渲染错误并显示友好的错误界面
// POS: 全局错误处理组件

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ActionButton } from './UIComponents';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-space-950">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="text-6xl" role="img" aria-label="Warning">⚠️</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-semibold text-star-50">
                Something went wrong
              </h1>
              <p className="text-sm text-star-400">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-space-800/50 rounded-lg p-4 text-xs text-star-400 border border-gold-500/10">
                <summary className="cursor-pointer font-medium text-star-200 mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <ActionButton
                variant="primary"
                onClick={() => window.location.reload()}
                aria-label="Refresh page"
              >
                Refresh Page
              </ActionButton>
              <ActionButton
                variant="outline"
                onClick={this.handleReset}
                aria-label="Try again"
              >
                Try Again
              </ActionButton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
