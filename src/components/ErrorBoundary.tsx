import { Component } from "react";
import { Warning } from "@phosphor-icons/react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

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
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <Warning className="h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-semibold">{t("error.title")}</h2>
          <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
          <Button variant="outline" onClick={this.handleReset}>{t("error.retry")}</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
