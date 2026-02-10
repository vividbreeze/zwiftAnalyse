import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { SettingsProvider } from './context/SettingsContext'
import { QueryProvider } from './providers/QueryProvider'
import { registerCharts } from './config/charts'

registerCharts();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </QueryProvider>
  </StrictMode>,
)
