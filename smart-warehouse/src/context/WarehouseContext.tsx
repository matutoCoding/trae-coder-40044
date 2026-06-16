import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type {
  InboundOrder, OutboundOrder, PickingWave, StackerTask, AGVTask,
  Stacker, AGV, Location, Pallet, TaskLog, InventoryRecord, StockAlert
} from '@/types'
import {
  mockInboundOrders, mockOutboundOrders, mockPickingWaves,
  mockStackerTasks, mockAGVTasks, mockStackers, mockAGVs,
  mockLocations, mockPallets, mockStockAlerts, mockMaterials, mockInventoryRecords
} from '@/data/mockData'

const STORAGE_KEY = 'smart-warehouse-state'

interface WarehouseState {
  inboundOrders: InboundOrder[]
  outboundOrders: OutboundOrder[]
  pickingWaves: PickingWave[]
  stackerTasks: StackerTask[]
  agvTasks: AGVTask[]
  stackers: Stacker[]
  agvs: AGV[]
  locations: Location[]
  pallets: Pallet[]
  taskLogs: TaskLog[]
  inventoryRecords: InventoryRecord[]
  alerts: StockAlert[]
}

type Action =
  | { type: 'UPDATE_INBOUND_ORDER'; payload: Partial<InboundOrder> & { id: string } }
  | { type: 'ADD_INBOUND_ORDER'; payload: InboundOrder }
  | { type: 'UPDATE_OUTBOUND_ORDER'; payload: Partial<OutboundOrder> & { id: string } }
  | { type: 'ADD_OUTBOUND_ORDER'; payload: OutboundOrder }
  | { type: 'UPDATE_PICKING_WAVE'; payload: Partial<PickingWave> & { id: string } }
  | { type: 'UPDATE_STACKER_TASK'; payload: Partial<StackerTask> & { id: string } }
  | { type: 'ADD_STACKER_TASK'; payload: StackerTask }
  | { type: 'UPDATE_AGV_TASK'; payload: Partial<AGVTask> & { id: string } }
  | { type: 'ADD_AGV_TASK'; payload: AGVTask }
  | { type: 'UPDATE_STACKER'; payload: Partial<Stacker> & { id: string } }
  | { type: 'UPDATE_AGV'; payload: Partial<AGV> & { id: string } }
  | { type: 'UPDATE_LOCATION'; payload: Partial<Location> & { id: string } }
  | { type: 'UPDATE_PALLET'; payload: Partial<Pallet> & { id: string } }
  | { type: 'ADD_PALLET'; payload: Pallet }
  | { type: 'BATCH_UPDATE_OUTBOUND_WAVE'; waveId: string; waveStatus: PickingWave['status']; orderStatus: OutboundOrder['status'] }
  | { type: 'ADD_TASK_LOG'; payload: TaskLog }
  | { type: 'ADD_INVENTORY_RECORD'; payload: InventoryRecord }
  | { type: 'UPDATE_ALERT'; payload: Partial<StockAlert> & { id: string } }
  | { type: 'REFRESH_ALERTS'; payload: StockAlert[] }

function computeDynamicAlerts(state: Omit<WarehouseState, 'alerts'>): StockAlert[] {
  const alerts: StockAlert[] = []
  const stockMap = new Map<string, number>()

  state.pallets.forEach(pallet => {
    if (pallet.status === 'stored') {
      const current = stockMap.get(pallet.materialId) || 0
      stockMap.set(pallet.materialId, current + pallet.quantity)
    }
  })

  mockMaterials.forEach(mat => {
    const currentQty = stockMap.get(mat.id) || 0
    if (currentQty < mat.safetyStock) {
      alerts.push({
        id: `dyn-low-${mat.id}`,
        type: 'low_stock',
        materialId: mat.id,
        materialName: mat.name,
        currentQty,
        threshold: mat.safetyStock,
        message: `${mat.name} 当前库存 ${currentQty} 件，低于安全库存 ${mat.safetyStock} 件`,
        createTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        status: 'active',
      })
    }
    if (currentQty > mat.maxStock) {
      alerts.push({
        id: `dyn-high-${mat.id}`,
        type: 'high_stock',
        materialId: mat.id,
        materialName: mat.name,
        currentQty,
        threshold: mat.maxStock,
        message: `${mat.name} 当前库存 ${currentQty} 件，超过最大库存 ${mat.maxStock} 件`,
        createTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        status: 'active',
      })
    }
  })

  const now = Date.now()
  state.pallets.forEach(pallet => {
    if (pallet.status === 'stored') {
      const inboundDate = new Date(pallet.inboundTime.replace(' ', 'T')).getTime()
      const days = Math.floor((now - inboundDate) / (1000 * 60 * 60 * 24))
      if (days > 60) {
        alerts.push({
          id: `dyn-obsolete-${pallet.id}`,
          type: 'obsolete',
          materialId: pallet.materialId,
          materialName: pallet.materialName,
          currentQty: pallet.quantity,
          threshold: 60,
          message: `${pallet.materialName} 已入库 ${days} 天，超过 60 天未出库，存在呆滞风险`,
          createTime: pallet.inboundTime,
          status: 'active',
        })
      }
      if (pallet.expiryDate) {
        const expiryDate = new Date(pallet.expiryDate).getTime()
        const daysToExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24))
        if (daysToExpiry < 30 && daysToExpiry > 0) {
          alerts.push({
            id: `dyn-expiry-${pallet.id}`,
            type: 'expiry',
            materialId: pallet.materialId,
            materialName: pallet.materialName,
            currentQty: pallet.quantity,
            threshold: 30,
            message: `${pallet.materialName} 将在 ${daysToExpiry} 天后过期（${pallet.expiryDate}）`,
            createTime: pallet.inboundTime,
            status: 'active',
          })
        }
      }
    }
  })

  return [...alerts, ...mockStockAlerts]
}

function mergeAlerts(newAlerts: StockAlert[], existingAlerts: StockAlert[]): StockAlert[] {
  const statusMap = new Map<string, StockAlert['status']>()
  existingAlerts.forEach(a => {
    if (a.status !== 'active') {
      statusMap.set(a.id, a.status)
    }
  })
  return newAlerts.map(alert => {
    const preservedStatus = statusMap.get(alert.id)
    if (preservedStatus) {
      return { ...alert, status: preservedStatus }
    }
    return alert
  })
}

const initialStateWithoutAlerts: Omit<WarehouseState, 'alerts'> = {
  inboundOrders: [...mockInboundOrders],
  outboundOrders: [...mockOutboundOrders],
  pickingWaves: [...mockPickingWaves],
  stackerTasks: [...mockStackerTasks],
  agvTasks: [...mockAGVTasks],
  stackers: [...mockStackers],
  agvs: [...mockAGVs],
  locations: [...mockLocations],
  pallets: [...mockPallets],
  taskLogs: [],
  inventoryRecords: [...mockInventoryRecords],
}

const initialState: WarehouseState = {
  ...initialStateWithoutAlerts,
  alerts: computeDynamicAlerts(initialStateWithoutAlerts),
}

function warehouseReducer(state: WarehouseState, action: Action): WarehouseState {
  switch (action.type) {
    case 'UPDATE_INBOUND_ORDER': {
      const newState = {
        ...state,
        inboundOrders: state.inboundOrders.map(o =>
          o.id === action.payload.id ? { ...o, ...action.payload } : o
        ),
      }
      return { ...newState, alerts: mergeAlerts(computeDynamicAlerts(newState), state.alerts) }
    }
    case 'ADD_INBOUND_ORDER': {
      const newState = {
        ...state,
        inboundOrders: [action.payload, ...state.inboundOrders],
      }
      return { ...newState, alerts: mergeAlerts(computeDynamicAlerts(newState), state.alerts) }
    }
    case 'UPDATE_OUTBOUND_ORDER': {
      const newState = {
        ...state,
        outboundOrders: state.outboundOrders.map(o =>
          o.id === action.payload.id ? { ...o, ...action.payload } : o
        ),
      }
      return { ...newState, alerts: mergeAlerts(computeDynamicAlerts(newState), state.alerts) }
    }
    case 'ADD_OUTBOUND_ORDER': {
      const newState = {
        ...state,
        outboundOrders: [action.payload, ...state.outboundOrders],
      }
      return { ...newState, alerts: mergeAlerts(computeDynamicAlerts(newState), state.alerts) }
    }
    case 'UPDATE_PICKING_WAVE':
      return {
        ...state,
        pickingWaves: state.pickingWaves.map(w =>
          w.id === action.payload.id ? { ...w, ...action.payload } : w
        ),
      }
    case 'UPDATE_STACKER_TASK':
      return {
        ...state,
        stackerTasks: state.stackerTasks.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      }
    case 'ADD_STACKER_TASK':
      return {
        ...state,
        stackerTasks: [action.payload, ...state.stackerTasks],
      }
    case 'UPDATE_AGV_TASK':
      return {
        ...state,
        agvTasks: state.agvTasks.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      }
    case 'ADD_AGV_TASK':
      return {
        ...state,
        agvTasks: [action.payload, ...state.agvTasks],
      }
    case 'UPDATE_STACKER': {
      const payload = action.payload
      if (payload.status === 'idle' || payload.status === 'fault' || payload.status === 'maintenance') {
        return {
          ...state,
          stackers: state.stackers.map(s =>
            s.id === payload.id ? { ...s, ...payload, currentTask: undefined } : s
          ),
        }
      }
      return {
        ...state,
        stackers: state.stackers.map(s =>
          s.id === payload.id ? { ...s, ...payload } : s
        ),
      }
    }
    case 'UPDATE_AGV': {
      const payload = action.payload
      if (payload.status === 'idle' || payload.status === 'fault' || payload.status === 'charging') {
        return {
          ...state,
          agvs: state.agvs.map(a =>
            a.id === payload.id ? { ...a, ...payload, currentTask: undefined } : a
          ),
        }
      }
      return {
        ...state,
        agvs: state.agvs.map(a =>
          a.id === payload.id ? { ...a, ...payload } : a
        ),
      }
    }
    case 'UPDATE_LOCATION': {
      const newState = {
        ...state,
        locations: state.locations.map(l =>
          l.id === action.payload.id ? { ...l, ...action.payload } : l
        ),
      }
      return { ...newState, alerts: mergeAlerts(computeDynamicAlerts(newState), state.alerts) }
    }
    case 'UPDATE_PALLET': {
      const newState = {
        ...state,
        pallets: state.pallets.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      }
      return { ...newState, alerts: mergeAlerts(computeDynamicAlerts(newState), state.alerts) }
    }
    case 'ADD_PALLET': {
      const newState = {
        ...state,
        pallets: [action.payload, ...state.pallets],
      }
      return { ...newState, alerts: mergeAlerts(computeDynamicAlerts(newState), state.alerts) }
    }
    case 'BATCH_UPDATE_OUTBOUND_WAVE': {
      const ordersToUpdate = state.outboundOrders
        .filter(o => o.waveId === action.waveId && o.status === 'pending')
        .map(o => o.id)
      const newState = {
        ...state,
        pickingWaves: state.pickingWaves.map(w =>
          w.id === action.waveId ? { ...w, status: action.waveStatus } : w
        ),
        outboundOrders: state.outboundOrders.map(o =>
          ordersToUpdate.includes(o.id) ? { ...o, status: action.orderStatus } : o
        ),
      }
      return { ...newState, alerts: mergeAlerts(computeDynamicAlerts(newState), state.alerts) }
    }
    case 'ADD_TASK_LOG':
      return {
        ...state,
        taskLogs: [action.payload, ...state.taskLogs],
      }
    case 'ADD_INVENTORY_RECORD': {
      const newState = {
        ...state,
        inventoryRecords: [action.payload, ...state.inventoryRecords],
      }
      return newState
    }
    case 'UPDATE_ALERT': {
      const existingAlert = state.alerts.find(a => a.id === action.payload.id)
      if (!existingAlert) return state
      return {
        ...state,
        alerts: state.alerts.map(a =>
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ),
      }
    }
    case 'REFRESH_ALERTS':
      return {
        ...state,
        alerts: action.payload,
      }
    default:
      return state
  }
}

interface WarehouseContextType {
  state: WarehouseState
  dispatch: React.Dispatch<Action>
}

const WarehouseContext = createContext<WarehouseContextType | null>(null)

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(warehouseReducer, initialState, (initState) => {
    if (typeof window === 'undefined') return initState
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed
      }
    } catch {
      // ignore
    }
    return initState
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  return (
    <WarehouseContext.Provider value={{ state, dispatch }}>
      {children}
    </WarehouseContext.Provider>
  )
}

export function useWarehouse() {
  const ctx = useContext(WarehouseContext)
  if (!ctx) throw new Error('useWarehouse must be used within WarehouseProvider')
  return ctx
}

export function generateId(prefix: string): string {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6)
}

export function getNowTime(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export function getMaterialStock(state: WarehouseState, materialId: string): number {
  return state.pallets
    .filter(p => p.materialId === materialId && p.status === 'stored')
    .reduce((sum, p) => sum + (p.quantity || 0), 0)
}

export function getDeduplicatedInboundQty(records: InventoryRecord[]): number {
  const seen = new Set<string>()
  return records
    .filter(r => r.type === 'inbound')
    .filter(r => {
      if (r.orderCode && seen.has(r.orderCode)) return false
      if (r.orderCode) seen.add(r.orderCode)
      return true
    })
    .reduce((sum, r) => sum + r.quantity, 0)
}

export function getDeduplicatedOutboundQty(records: InventoryRecord[]): number {
  const seen = new Set<string>()
  return records
    .filter(r => r.type === 'outbound')
    .filter(r => {
      if (r.orderCode && seen.has(r.orderCode)) return false
      if (r.orderCode) seen.add(r.orderCode)
      return true
    })
    .reduce((sum, r) => sum + r.quantity, 0)
}
