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

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#e8eef4] flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-lg border border-[#ccd5df] p-6 max-w-md w-full shadow-lg text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900">Ups, algo no ha salido como esperábamos</h2>
              <p className="text-xs text-gray-500">
                Ha ocurrido un problema puntual al cargar este contenido.
              </p>
            </div>

            {this.state.error && (
              <div className="p-2 bg-gray-50 rounded border border-gray-200 text-left font-mono text-[11px] text-gray-700 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#3869A0] hover:bg-[#2c537f] text-white text-xs font-bold rounded flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recargar página</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
