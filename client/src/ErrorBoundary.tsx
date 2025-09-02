import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: any) {
    return { hasError: true, message: String(err?.message || err) };
  }
  componentDidCatch(err: any, info: any) {
    console.error("ErrorBoundary:", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 760, margin: "24px auto", fontFamily: "system-ui,sans-serif" }}>
          <h2>⚠️ Ocorreu um erro na interface</h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: 12, borderRadius: 8 }}>
            {this.state.message}
          </pre>
          <p>Abra o console (F12 → Console) para mais detalhes.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
