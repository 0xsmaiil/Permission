import { Component } from "react";

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

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 24, textAlign: "center", color: "#ef4444",
          fontFamily: "system-ui", marginTop: 40,
        }}>
          <h2 style={{ fontSize: 20 }}>⚠️ خطأ في التطبيق</h2>
          <pre style={{ fontSize: 12, marginTop: 12, whiteSpace: "pre-wrap", direction: "ltr" }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
