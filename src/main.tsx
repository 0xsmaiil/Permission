import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { addNotification } from './lib/notifications'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type === 'PUSH_RECEIVED') {
      const { title, body, timestamp } = event.data
      addNotification({ title, body, timestamp })
    }
  })
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({ type: 'SYNC_NOTIFICATIONS' })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
