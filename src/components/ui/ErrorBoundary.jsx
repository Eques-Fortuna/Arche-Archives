import React, { Component } from 'react';
import Button from './Button';
import Card from './Card';
import { AlertCircle } from 'lucide-react';

/**
 * Standard React class boundary catching layout exceptions and crash states
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught rendering exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex items-center justify-center p-4">
          <Card className="max-w-md p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Application Crash Detected</h2>
              <p className="text-sm text-slate-400">
                A critical rendering exception was encountered. You can return to the homepage or reload.
              </p>
            </div>
            {this.state.error && (
              <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-red-400 overflow-x-auto text-left max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </pre>
            )}
            <Button variant="primary" className="w-full justify-center" onClick={this.handleReset}>
              Return to Homepage
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
