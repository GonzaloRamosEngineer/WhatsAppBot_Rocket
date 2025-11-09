import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">
            Recargá la página o volvé al inicio. (Revisá consola para detalles).
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
