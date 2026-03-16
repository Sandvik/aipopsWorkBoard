import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error in UI", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-main">
          <div className="empty-main-card">
            <h2>Noget gik galt i visningen</h2>
            <p className="muted">
              Prøv at genindlæse siden. Hvis fejlen bliver ved, kan du lukke og åbne arbejds­mappen igen.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

