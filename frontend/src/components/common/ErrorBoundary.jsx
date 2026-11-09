import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VitalWatch Application Render Error:', error, errorInfo);
  }

  handleReload = () => {
    sessionStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="text-sm text-slate-300">
              The application encountered a client-side error. Click below to reset your session and reload.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-slate-950/60 rounded-lg text-left text-xs font-mono text-rose-300 overflow-x-auto border border-rose-900/40">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              Reset Session & Reload VitalWatch
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

