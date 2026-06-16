import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type {
  InboundOrder, OutboundOrder, PickingWave, StackerTask, AGVTask,
  Stacker, AGV, Location, Pallet, TaskLog, InventoryRecord
} from '@/types'
import {
  mockInboundOrders, mockOutboundOrders, mockPickingWaves,
  mockStackerTasks, mockAGVTasks, mockStackers, mockAGVs,
  mockLocations, mockPallets, mockInventoryRecords
} from '@/data/mockData'

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

const initialState: WarehouseState = {
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

function warehouseReducer(state: WarehouseState, action: Action): WarehouseState {
  switch (action.type) {
    case 'UPDATE_INBOUND_ORDER':
      return {
        ...state,
        inboundOrders: state.inboundOrders.map(o =>
          o.id === action.payload.id ? { ...o, ...action.payload } : o
        ),
      }
    case 'ADD_INBOUND_ORDER':
      return {
        ...state,
        inboundOrders: [action.payload, ...state.inboundOrders],
      }
    case 'UPDATE_OUTBOUND_ORDER':
      return {
        ...state,
        outboundOrders: state.outboundOrders.map(o =>
          o.id === action.payload.id ? { ...o, ...action.payload } : o
        ),
      }
    case 'ADD_OUTBOUND_ORDER':
      return {
        ...state,
        outboundOrders: [action.payload, ...state.outboundOrders],
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
    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map(l =>
          l.id === action.payload.id ? { ...l, ...action.payload } : l
        ),
      }
    case 'UPDATE_PALLET':
      return {
        ...state,
        pallets: state.pallets.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      }
    case 'ADD_PALLET':
      return {
        ...state,
        pallets: [action.payload, ...state.pallets],
      }
    case 'BATCH_UPDATE_OUTBOUND_WAVE': {
      const ordersToUpdate = state.outboundOrders
        .filter(o => o.waveId === action.waveId && o.status === 'pending')
        .map(o => o.id)
      return {
        ...state,
        pickingWaves: state.pickingWaves.map(w =>
          w.id === action.waveId ? { ...w, status: action.waveStatus } : w
        ),
        outboundOrders: state.outboundOrders.map(o =>
          ordersToUpdate.includes(o.id) ? { ...o, status: action.orderStatus } : o
        ),
      }
    }
    case 'ADD_TASK_LOG':
      return {
        ...state,
        taskLogs: [action.payload, ...state.taskLogs],
      }
    case 'ADD_INVENTORY_RECORD':
      return {
        ...state,
        inventoryRecords: [action.payload, ...state.inventoryRecords],
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
  const [state, dispatch] = useReducer(warehouseReducer, initialState)
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
