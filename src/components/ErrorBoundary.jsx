import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // This lifecycle method is called when an error is thrown in a child component.
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  // This lifecycle method is for logging the error information.
  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-lg">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
                <p className="text-gray-600 mb-6">We've encountered an unexpected error. Please try refreshing the page.</p>
                <details className="text-left bg-gray-100 p-2 rounded border text-xs text-gray-500 mb-6">
                    <summary>Error Details</summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                        {this.state.error && this.state.error.toString()}
                    </pre>
                </details>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                    Refresh Page
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;