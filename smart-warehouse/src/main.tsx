import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { WarehouseProvider } from './context/WarehouseContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WarehouseProvider>
      <App />
    </WarehouseProvider>
  </StrictMode>,
)
