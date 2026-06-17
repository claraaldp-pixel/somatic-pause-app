import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from '@/App.jsx'
import '@/index.css'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  sendDefaultPii: false,
  integrations: [Sentry.breadcrumbsIntegration({ console: false })],
  beforeSend(event) {
    delete event.extra;
    return event;
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <Sentry.ErrorBoundary fallback={<p>Something went wrong. Please refresh the page.</p>}>
    <App />
  </Sentry.ErrorBoundary>
)
