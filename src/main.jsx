import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PwaRegistry } from './components/PwaRegistry.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PwaRegistry />
    <App />
  </StrictMode>,
)
