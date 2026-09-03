import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Inkorium Error Caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public handleClearAndReset = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('inkorium')) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#e8eef4] dark:bg-[#0b111e] flex items-center justify-center p-4 font-sans text-gray-900 dark:text-gray-100">
          <div className="bg-white dark:bg-[#152338] rounded-lg border border-[#ccd5df] dark:border-[#1d2b40] p-6 max-w-md w-full shadow-lg text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ups, algo no ha salido como esperábamos</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ha ocurrido un problema puntual al cargar este contenido.
              </p>
            </div>

            {this.state.error && (
              <div className="p-2 bg-gray-50 dark:bg-[#0e1726] rounded border border-gray-200 dark:border-slate-800 text-left font-mono text-[11px] text-gray-700 dark:text-gray-300 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recargar página</span>
              </button>
              <button
                onClick={this.handleClearAndReset}
                className="w-full sm:w-auto px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded transition cursor-pointer"
              >
                Restablecer datos locales
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
