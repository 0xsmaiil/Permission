import { Component } from "react";
import { t } from "../lib/i18n";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary-fallback">
          <h2>{t("error.title")}</h2>
          <p>{this.state.error.message}</p>
          <button type="button" className="btn btn-primary" onClick={this.handleReset}>
            {t("error.retry")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
