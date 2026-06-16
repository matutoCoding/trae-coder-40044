import type {
  Material, Pallet, Location, Stacker, AGV,
  InboundOrder, OutboundOrder, PickingWave,
  StockCheck, StockAlert, StackerTask, AGVTask,
  InventoryRecord
} from '@/types'

export const mockMaterials: Material[] = [
  { id: '1', code: 'M001', name: '电子元器件A', category: '电子元器件', unit: '个', spec: 'SOP-8', safetyStock: 500, maxStock: 5000 },
  { id: '2', code: 'M002', name: '电子元器件B', category: '电子元器件', unit: '个', spec: 'QFP-64', safetyStock: 300, maxStock: 3000 },
  { id: '3', code: 'M003', name: '金属结构件', category: '结构件', unit: '件', spec: '100x50x20mm', safetyStock: 200, maxStock: 2000 },
  { id: '4', code: 'M004', name: '塑料外壳', category: '结构件', unit: '个', spec: 'ABS注塑', safetyStock: 400, maxStock: 4000 },
  { id: '5', code: 'M005', name: 'PCB主板', category: '电路板', unit: '块', spec: '8层板', safetyStock: 150, maxStock: 1500 },
  { id: '6', code: 'M006', name: '电源模块', category: '电子元器件', unit: '个', spec: '12V/5A', safetyStock: 250, maxStock: 2500 },
  { id: '7', code: 'M007', name: '连接器', category: '电子元器件', unit: '个', spec: '2.54mm间距', safetyStock: 1000, maxStock: 10000 },
  { id: '8', code: 'M008', name: '电机组件', category: '机电组件', unit: '套', spec: '24V直流', safetyStock: 100, maxStock: 1000 },
]

const palletStatuses: Pallet['status'][] = ['stored', 'stored', 'stored', 'picking', 'outbound', 'empty']
export const mockPallets: Pallet[] = Array.from({ length: 50 }, (_, i) => ({
  id: `P${i + 1}`,
  code: `PLT${String(i + 1).padStart(4, '0')}`,
  materialId: mockMaterials[i % mockMaterials.length].id,
  materialName: mockMaterials[i % mockMaterials.length].name,
  quantity: Math.floor(Math.random() * 200) + 50,
  inboundTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
  productionDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  status: palletStatuses[i % palletStatuses.length],
}))

const locationStatuses: Location['status'][] = ['empty', 'occupied', 'occupied', 'occupied', 'reserved', 'maintenance']
export const mockLocations: Location[] = Array.from({ length: 200 }, (_, i) => {
  const aisle = Math.floor(i / 40) + 1
  const column = (Math.floor(i / 5) % 8) + 1
  const layer = (i % 5) + 1
  const status = locationStatuses[i % locationStatuses.length]
  const pallet = status === 'occupied' ? mockPallets[i % mockPallets.length] : undefined
  return {
    id: `L${i + 1}`,
    code: `A${aisle}-C${String(column).padStart(2, '0')}-L${layer}`,
    aisle,
    column,
    layer,
    status,
    palletId: pallet?.id,
    category: pallet ? mockMaterials.find(m => m.id === pallet.materialId)?.category : undefined,
    capacity: 500,
    currentLoad: status === 'occupied' ? pallet?.quantity || 0 : 0,
  }
})

const stackerStatuses: Stacker['status'][] = ['idle', 'running', 'running', 'fault', 'maintenance']
export const mockStackers: Stacker[] = Array.from({ length: 5 }, (_, i) => ({
  id: `S${i + 1}`,
  code: `STK${String(i + 1).padStart(2, '0')}`,
  aisle: i + 1,
  status: stackerStatuses[i % stackerStatuses.length],
  currentTask: stackerStatuses[i % stackerStatuses.length] === 'running' ? `TASK${100 + i}` : undefined,
  efficiency: 85 + Math.floor(Math.random() * 15),
  totalTasks: 500 + Math.floor(Math.random() * 500),
  completedTasks: 450 + Math.floor(Math.random() * 450),
}))

const agvStatuses: AGV['status'][] = ['idle', 'moving', 'moving', 'loading', 'charging', 'fault']
export const mockAGVs: AGV[] = Array.from({ length: 8 }, (_, i) => ({
  id: `AGV${i + 1}`,
  code: `AGV${String(i + 1).padStart(2, '0')}`,
  status: agvStatuses[i % agvStatuses.length],
  battery: 30 + Math.floor(Math.random() * 70),
  currentTask: ['moving', 'loading'].includes(agvStatuses[i % agvStatuses.length]) ? `AGVT${200 + i}` : undefined,
  position: { x: Math.floor(Math.random() * 100), y: Math.floor(Math.random() * 100) },
  speed: Math.floor(Math.random() * 5),
}))

const inboundStatuses: InboundOrder['status'][] = ['pending', 'scanning', 'allocating', 'stacking', 'completed', 'completed']
export const mockInboundOrders: InboundOrder[] = Array.from({ length: 30 }, (_, i) => {
  const mat = mockMaterials[i % mockMaterials.length]
  const status = inboundStatuses[i % inboundStatuses.length]
  const loc = status === 'completed' || status === 'stacking' ? mockLocations[i % mockLocations.length] : undefined
  return {
    id: `IB${i + 1}`,
    code: `IN${String(2024001 + i)}`,
    materialId: mat.id,
    materialName: mat.name,
    quantity: Math.floor(Math.random() * 300) + 50,
    palletCode: mockPallets[i % mockPallets.length].code,
    supplier: ['供应商A', '供应商B', '供应商C', '供应商D'][i % 4],
    status,
    createTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    operator: ['张三', '李四', '王五', '赵六'][i % 4],
    locationCode: loc?.code,
  }
})

const outboundStatuses: OutboundOrder['status'][] = ['pending', 'picking', 'reviewing', 'completed', 'completed']
const priorities: OutboundOrder['priority'][] = ['normal', 'urgent', 'vip', 'normal']
export const mockOutboundOrders: OutboundOrder[] = Array.from({ length: 25 }, (_, i) => {
  const mat = mockMaterials[i % mockMaterials.length]
  const status = outboundStatuses[i % outboundStatuses.length]
  return {
    id: `OB${i + 1}`,
    code: `OUT${String(2024001 + i)}`,
    materialId: mat.id,
    materialName: mat.name,
    quantity: Math.floor(Math.random() * 200) + 20,
    customer: ['客户A', '客户B', '客户C', '客户D', '客户E'][i % 5],
    priority: priorities[i % priorities.length],
    status,
    createTime: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    operator: ['张三', '李四', '王五', '赵六'][i % 4],
    waveId: status !== 'pending' ? `WAVE${100 + Math.floor(i / 5)}` : undefined,
    palletCodes: status === 'completed' ? [mockPallets[i % mockPallets.length].code] : undefined,
  }
})

export const mockPickingWaves: PickingWave[] = Array.from({ length: 8 }, (_, i) => ({
  id: `W${i + 1}`,
  code: `WAVE${String(100 + i)}`,
  status: i < 5 ? 'completed' : i < 7 ? 'processing' : 'pending',
  orderCount: 3 + Math.floor(Math.random() * 5),
  createTime: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
  operator: ['张三', '李四', '王五', '赵六'][i % 4],
}))

const checkTypes: StockCheck['type'][] = ['periodic', 'random', 'special', 'periodic']
const checkStatuses: StockCheck['status'][] = ['pending', 'processing', 'completed', 'completed']
export const mockStockChecks: StockCheck[] = Array.from({ length: 12 }, (_, i) => ({
  id: `SC${i + 1}`,
  code: `CHK${String(2024001 + i)}`,
  type: checkTypes[i % checkTypes.length],
  status: checkStatuses[i % checkStatuses.length],
  locationCount: 20 + Math.floor(Math.random() * 30),
  checkedCount: checkStatuses[i % checkStatuses.length] === 'completed' ? 20 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 20),
  createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
  operator: ['张三', '李四', '王五', '赵六'][i % 4],
  differences: Math.floor(Math.random() * 5),
}))

const alertTypes: StockAlert['type'][] = ['low_stock', 'high_stock', 'obsolete', 'expiry', 'low_stock']
export const mockStockAlerts: StockAlert[] = Array.from({ length: 15 }, (_, i) => {
  const mat = mockMaterials[i % mockMaterials.length]
  const type = alertTypes[i % alertTypes.length]
  const messages: Record<string, string> = {
    low_stock: `库存低于安全库存，当前${Math.floor(mat.safetyStock * 0.5)} < 安全库存${mat.safetyStock}`,
    high_stock: `库存超过最大库存，当前${Math.floor(mat.maxStock * 1.2)} > 最大库存${mat.maxStock}`,
    obsolete: `呆滞库存预警，已超过90天未出库`,
    expiry: `物料即将过期，请尽快出库或处理`,
  }
  return {
    id: `SA${i + 1}`,
    type,
    materialId: mat.id,
    materialName: mat.name,
    currentQty: type === 'low_stock' ? Math.floor(mat.safetyStock * 0.5) : type === 'high_stock' ? Math.floor(mat.maxStock * 1.2) : Math.floor(mat.maxStock * 0.3),
    threshold: type === 'low_stock' ? mat.safetyStock : mat.maxStock,
    message: messages[type],
    createTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    status: i < 10 ? 'active' : 'handled',
  }
})

const taskTypes: StackerTask['type'][] = ['inbound', 'outbound', 'transfer']
const taskStatuses: StackerTask['status'][] = ['pending', 'executing', 'completed', 'failed']
export const mockStackerTasks: StackerTask[] = Array.from({ length: 20 }, (_, i) => {
  const type = taskTypes[i % taskTypes.length]
  const status = taskStatuses[i % taskStatuses.length]
  return {
    id: `ST${i + 1}`,
    code: `TASK${String(1000 + i)}`,
    type,
    stackerId: mockStackers[i % mockStackers.length].id,
    fromLocation: type !== 'inbound' ? mockLocations[i % mockLocations.length].code : undefined,
    toLocation: type !== 'outbound' ? mockLocations[(i + 10) % mockLocations.length].code : undefined,
    palletCode: mockPallets[i % mockPallets.length].code,
    status,
    createTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    startTime: status !== 'pending' ? new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ') : undefined,
    endTime: status === 'completed' || status === 'failed' ? new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ') : undefined,
  }
})

const agvTaskStatuses: AGVTask['status'][] = ['pending', 'executing', 'completed', 'failed']
export const mockAGVTasks: AGVTask[] = Array.from({ length: 15 }, (_, i) => ({
  id: `AT${i + 1}`,
  code: `AGVT${String(200 + i)}`,
  agvId: mockAGVs[i % mockAGVs.length].id,
  fromPoint: ['入库站台1', '入库站台2', '出库站台1', '拣选区A', '拣选区B'][i % 5],
  toPoint: ['A1巷道口', 'A2巷道口', 'A3巷道口', '集货区', '出库站台1'][i % 5],
  palletCode: mockPallets[i % mockPallets.length].code,
  status: agvTaskStatuses[i % agvTaskStatuses.length],
  createTime: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
  estimatedTime: 5 + Math.floor(Math.random() * 15),
}))

const inventoryRecordTypes: InventoryRecord['type'][] = ['inbound', 'outbound', 'transfer', 'adjust', 'check']
const operators = ['张三', '李四', '王五', '赵六']
export const mockInventoryRecords: InventoryRecord[] = Array.from({ length: 30 }, (_, i) => {
  const type = inventoryRecordTypes[i % inventoryRecordTypes.length]
  const mat = mockMaterials[i % mockMaterials.length]
  const beforeQty = Math.floor(Math.random() * 800) + 200
  const qtyChange = Math.floor(Math.random() * 200) + 50
  const afterQty = type === 'inbound' ? beforeQty + qtyChange :
                   type === 'outbound' ? beforeQty - qtyChange :
                   type === 'adjust' ? beforeQty + (Math.random() > 0.5 ? qtyChange : -qtyChange) :
                   beforeQty
  return {
    id: `IR${i + 1}`,
    type,
    materialId: mat.id,
    materialName: mat.name,
    quantity: qtyChange,
    beforeQty,
    afterQty,
    palletCode: mockPallets[i % mockPallets.length].code,
    locationCode: mockLocations[i % mockLocations.length].code,
    orderCode: type === 'inbound' ? `IN${String(2024001 + i)}` :
                type === 'outbound' ? `OUT${String(2024001 + i)}` : undefined,
    operator: operators[i % operators.length],
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    remark: type === 'check' ? '盘点差异调整' : type === 'transfer' ? '移库操作' : undefined,
  }
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
