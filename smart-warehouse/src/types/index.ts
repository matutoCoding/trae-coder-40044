export interface Material {
  id: string
  code: string
  name: string
  category: string
  unit: string
  spec: string
  safetyStock: number
  maxStock: number
}

export interface Pallet {
  id: string
  code: string
  materialId: string
  materialName: string
  quantity: number
  unit?: string
  inboundTime: string
  productionDate?: string
  expiryDate?: string
  locationCode?: string
  status: 'stored' | 'picking' | 'outbound' | 'empty' | 'stacking'
}

export interface Location {
  id: string
  code: string
  aisle: number
  column: number
  layer: number
  status: 'empty' | 'occupied' | 'reserved' | 'maintenance'
  palletId?: string
  palletCode?: string
  category?: string
  capacity: number
  currentLoad: number
}

export interface Stacker {
  id: string
  code: string
  aisle: number
  status: 'idle' | 'running' | 'fault' | 'maintenance'
  currentTask?: string
  efficiency: number
  totalTasks: number
  completedTasks: number
}

export interface AGV {
  id: string
  code: string
  status: 'idle' | 'moving' | 'loading' | 'fault' | 'charging'
  battery: number
  currentTask?: string
  position: { x: number; y: number }
  speed: number
}

export interface InboundOrder {
  id: string
  code: string
  materialId: string
  materialName: string
  quantity: number
  palletCode: string
  supplier: string
  status: 'pending' | 'scanning' | 'allocating' | 'stacking' | 'completed'
  createTime: string
  operator: string
  locationId?: string
  locationCode?: string
}

export interface OutboundOrder {
  id: string
  code: string
  materialId: string
  materialName: string
  quantity: number
  customer: string
  priority: 'normal' | 'urgent' | 'vip'
  status: 'pending' | 'picking' | 'reviewing' | 'completed'
  createTime: string
  operator: string
  waveId?: string
  palletCodes?: string[]
}

export interface PickingWave {
  id: string
  code: string
  status: 'pending' | 'processing' | 'completed'
  orderCount: number
  createTime: string
  operator: string
}

export interface StockCheck {
  id: string
  code: string
  type: 'periodic' | 'random' | 'special'
  status: 'pending' | 'processing' | 'completed'
  locationCount: number
  checkedCount: number
  createTime: string
  operator: string
  differences: number
}

export interface StockAlert {
  id: string
  type: 'low_stock' | 'high_stock' | 'obsolete' | 'expiry'
  materialId: string
  materialName: string
  currentQty: number
  threshold: number
  message: string
  createTime: string
  status: 'active' | 'handled' | 'ignored'
}

export interface StackerTask {
  id: string
  code: string
  type: 'inbound' | 'outbound' | 'transfer'
  stackerId: string
  fromLocation?: string
  toLocation?: string
  palletCode: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  createTime: string
  startTime?: string
  endTime?: string
}

export interface AGVTask {
  id: string
  code: string
  agvId: string
  fromPoint: string
  toPoint: string
  palletCode?: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  createTime: string
  estimatedTime: number
}

export interface TaskLog {
  id: string
  taskId: string
  taskType: 'stacker' | 'agv'
  action: 'execute' | 'dispatch' | 'pause' | 'cancel' | 'complete'
  operator: string
  timestamp: string
  deviceId: string
  deviceCode: string
  palletCode?: string
  fromLocation?: string
  toLocation?: string
  result: string
  remark?: string
}

export interface InventoryRecord {
  id: string
  type: 'inbound' | 'outbound' | 'transfer' | 'adjust' | 'check'
  materialId: string
  materialName: string
  quantity: number
  beforeQty: number
  afterQty: number
  palletCode?: string
  locationCode?: string
  orderCode?: string
  operator: string
  timestamp: string
  remark?: string
}
