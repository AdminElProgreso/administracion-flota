import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from './ui';

// A screen that fails to draw shows a message instead of leaving the whole app blank.
// inline: inside the shell (the menu keeps working to go to another screen); otherwise the whole window.
export class ErrorBoundary extends Component<{ children: ReactNode; inline?: boolean }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Screen crashed', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const card = (
      <div className="card empty" role="alert">
        <Icon name="error" />
        <b>Algo salió mal</b>
        <p>Esta pantalla no se pudo mostrar. Lo que ya estaba guardado no se pierde.</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => window.location.reload()}><Icon name="refresh" />Volver a cargar</button>
      </div>
    );
    return this.props.inline ? <div className="screen"><div className="sec">{card}</div></div> : <div className="crash">{card}</div>;
  }
}
