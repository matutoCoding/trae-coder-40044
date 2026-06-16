import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import Dashboard from '@/pages/Dashboard'
import InboundPage from '@/pages/InboundPage'
import StackerPage from '@/pages/StackerPage'
import OutboundPage from '@/pages/OutboundPage'
import StockCheckPage from '@/pages/StockCheckPage'
import AGVPage from '@/pages/AGVPage'
import AlertPage from '@/pages/AlertPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inbound" element={<InboundPage />} />
          <Route path="stacker" element={<StackerPage />} />
          <Route path="outbound" element={<OutboundPage />} />
          <Route path="stockcheck" element={<StockCheckPage />} />
          <Route path="agv" element={<AGVPage />} />
          <Route path="alert" element={<AlertPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
