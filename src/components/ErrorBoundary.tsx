import { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-error)]/10"
            >
              <AlertTriangle size={40} className="text-[var(--color-error)]" />
            </motion.div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
            <p className="text-[var(--color-text-muted)] mb-6">
              Don't worry, it happens to the best of us. Let's get you back on track.
            </p>

            {/* Error details (dev only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 rounded-lg bg-[var(--color-bg-secondary)] text-left">
                <p className="text-sm text-[var(--color-error)] font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleReload}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <RefreshCw size={18} />
                Try Again
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
              >
                <Home size={18} />
                Go Home
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
