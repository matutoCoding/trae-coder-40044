import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type {
  InboundOrder, OutboundOrder, PickingWave, StackerTask, AGVTask,
  Stacker, AGV, Location, Pallet
} from '@/types'
import {
  mockInboundOrders, mockOutboundOrders, mockPickingWaves,
  mockStackerTasks, mockAGVTasks, mockStackers, mockAGVs,
  mockLocations, mockPallets
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
}

type Action =
  | { type: 'UPDATE_INBOUND_ORDER'; payload: Partial<InboundOrder> & { id: string } }
  | { type: 'UPDATE_OUTBOUND_ORDER'; payload: Partial<OutboundOrder> & { id: string } }
  | { type: 'UPDATE_PICKING_WAVE'; payload: Partial<PickingWave> & { id: string } }
  | { type: 'UPDATE_STACKER_TASK'; payload: Partial<StackerTask> & { id: string } }
  | { type: 'UPDATE_AGV_TASK'; payload: Partial<AGVTask> & { id: string } }
  | { type: 'UPDATE_STACKER'; payload: Partial<Stacker> & { id: string } }
  | { type: 'UPDATE_AGV'; payload: Partial<AGV> & { id: string } }
  | { type: 'UPDATE_LOCATION'; payload: Partial<Location> & { id: string } }
  | { type: 'UPDATE_PALLET'; payload: Partial<Pallet> & { id: string } }
  | { type: 'BATCH_UPDATE_OUTBOUND_WAVE'; waveId: string; waveStatus: PickingWave['status']; orderStatus: OutboundOrder['status'] }

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
    case 'UPDATE_OUTBOUND_ORDER':
      return {
        ...state,
        outboundOrders: state.outboundOrders.map(o =>
          o.id === action.payload.id ? { ...o, ...action.payload } : o
        ),
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
    case 'UPDATE_AGV_TASK':
      return {
        ...state,
        agvTasks: state.agvTasks.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      }
    case 'UPDATE_STACKER':
      return {
        ...state,
        stackers: state.stackers.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      }
    case 'UPDATE_AGV':
      return {
        ...state,
        agvs: state.agvs.map(a =>
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ),
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
    case 'BATCH_UPDATE_OUTBOUND_WAVE':
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
