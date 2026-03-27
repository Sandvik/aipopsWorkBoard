import { Component, type ErrorInfo, type ReactNode } from "react";
import { getStoredLocale, getTextCatalog } from "../i18n/catalog";

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
    console.error("Unhandled error in UI", error, info);
  }

  render() {
    const t = getTextCatalog(getStoredLocale()).errorBoundary;

    if (this.state.hasError) {
      return (
        <div className="empty-main">
          <div className="empty-main-card">
            <h2>{t.title}</h2>
            <p className="muted">{t.body}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
