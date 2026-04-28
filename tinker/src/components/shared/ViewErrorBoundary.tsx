import React from "react";

interface ViewErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  resetKey?: string;
}

interface ViewErrorBoundaryState {
  hasError: boolean;
}

export class ViewErrorBoundary extends React.Component<ViewErrorBoundaryProps, ViewErrorBoundaryState> {
  state: ViewErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ViewErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ViewErrorBoundary caught an error:", error);
  }

  componentDidUpdate(prevProps: ViewErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center px-6">
          <div className="max-w-md rounded-[var(--ui-radius-xl)] border border-[rgba(198,69,69,0.28)] bg-[var(--ui-surface-elevated)] p-6 text-center shadow-[var(--ui-shadow-2)]">
            <h2 className="text-lg font-semibold text-[var(--ui-text-1)]">{this.props.title ?? "Something went wrong"}</h2>
            <p className="mt-2 text-sm text-[var(--ui-text-3)]">
              This view hit an error, but the rest of the app is still here. Try resetting the panel.
            </p>
            <button type="button" onClick={this.handleReset} className="btn btn-primary mt-4">
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
