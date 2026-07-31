import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { addNotification } from './lib/notifications'
import { registerSW } from 'virtual:pwa-register'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type === 'PUSH_RECEIVED') {
      const { title, body, timestamp } = event.data
      addNotification({ title, body, timestamp })
      window.dispatchEvent(new Event('notification-received'))
    }
  })
}

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
