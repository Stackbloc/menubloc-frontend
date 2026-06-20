import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: String(error?.message || error) };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: "40px 24px", textAlign: "center", fontFamily: "inherit" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#991b1b", marginBottom: 8 }}>
            Something went wrong loading this page.
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
            {this.state.message || "An unexpected error occurred."}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 13 }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
