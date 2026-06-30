import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: 200, padding: 40,
          color: 'var(--text2)', textAlign: 'center'
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--red)' }}>Что-то пошло не так</h3>
          <p style={{ fontSize: 13, margin: '0 0 16px', maxWidth: 400 }}>
            {this.state.error.message || 'Неизвестная ошибка'}
          </p>
          <button className="btn-primary" onClick={() => this.setState({ error: null })}>
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
