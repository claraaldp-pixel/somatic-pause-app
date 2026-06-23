import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'
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

if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: 'https://us.i.posthog.com',
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Sentry.ErrorBoundary fallback={<p>Something went wrong. Please refresh the page.</p>}>
    <App />
  </Sentry.ErrorBoundary>
)
