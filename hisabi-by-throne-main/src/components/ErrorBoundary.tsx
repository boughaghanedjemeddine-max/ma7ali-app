import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background"
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-lg font-bold text-foreground mb-2">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-muted-foreground mb-6">
            أعد تحميل الصفحة وإذا استمرت المشكلة تواصل مع الدعم.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            إعادة التحميل
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 text-xs text-destructive text-left max-w-sm overflow-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
