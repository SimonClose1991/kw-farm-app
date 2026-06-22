import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Polyfill crypto.randomUUID for Safari < 15.4
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  crypto.randomUUID = function() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    )
  }
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#450a0a', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '100%' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px', color: '#1e293b' }}>
              Something went wrong
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#7f1d1d', color: 'white', border: 'none',
                borderRadius: '12px', padding: '12px 24px', fontWeight: '600',
                fontSize: '14px', width: '100%', cursor: 'pointer'
              }}
            >
              Reload app
            </button>
            <details style={{ marginTop: '12px' }}>
              <summary style={{ fontSize: '11px', color: '#94a3b8', cursor: 'pointer' }}>Technical details</summary>
              <pre style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
