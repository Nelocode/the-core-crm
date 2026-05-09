import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { LanguageProvider } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
