import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f3f4f6',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '10px' }}>Application Error</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            There was an error loading the application.
          </p>
          <pre style={{
            backgroundColor: '#fff',
            padding: '15px',
            borderRadius: '8px',
            overflow: 'auto',
            maxWidth: '100%',
            color: '#333',
            fontSize: '12px',
            border: '1px solid #e5e7eb'
          }}>
            {this.state.error?.toString()}
          </pre>
          <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
            Check the browser console (F12) for more details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
