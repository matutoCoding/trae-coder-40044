import { useState, useMemo } from 'react'
import {
  QrCode, Search, Plus, Package, MapPin, CheckCircle2,
  Clock, FileText, ArrowRight, RefreshCw, X, ChevronDown
} from 'lucide-react'
import { useWarehouse, generateId, getNowTime, getMaterialStock } from '@/context/WarehouseContext'
import { mockMaterials } from '@/data/mockData'
import { statusColors, statusLabels } from '@/utils'
import type { InboundOrder, Location, Material } from '@/types'

type TabType = 'orders' | 'scan' | 'allocate'

interface FormData {
  materialId: string
  quantity: number
  palletCode: string
  supplier: string
}

export default function InboundPage() {
  const { state, dispatch } = useWarehouse()
  const [tab, setTab] = useState<TabType>('orders')
  const [searchText, setSearchText] = useState('')
  const [scanCode, setScanCode] = useState('')
  const [scanResult, setScanResult] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [allocateSuccess, setAllocateSuccess] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    materialId: '',
    quantity: 0,
    palletCode: '',
    supplier: ''
  })
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false)

  const selectedMaterial: Material | undefined = useMemo(() =>
    mockMaterials.find(m => m.id === formData.materialId),
    [formData.materialId]
  )

  const activeOrder: InboundOrder | undefined = useMemo(() => {
    if (activeOrderId) return state.inboundOrders.find(o => o.id === activeOrderId)
    return undefined
  }, [activeOrderId, state.inboundOrders])

  const filteredOrders = state.inboundOrders.filter(o => {
    if (searchText && !o.code.includes(searchText) && !o.materialName.includes(searchText)) return false
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    return true
  })

  const emptyLocations = useMemo(() =>
    state.locations.filter(l => l.status === 'empty').slice(0, 10),
    [state.locations]
  )

  const reservedLocations = useMemo(() =>
    state.locations.filter(l => l.status === 'reserved'),
    [state.locations]
  )

  const recommendedLocation: Location | undefined = useMemo(() => {
    if (selectedLocationId) return state.locations.find(l => l.id === selectedLocationId)
    return emptyLocations[0]
  }, [emptyLocations, selectedLocationId, state.locations])

  const handleCreateOrder = () => {
    if (!formData.materialId || !formData.quantity || !formData.palletCode || !formData.supplier) {
      alert('请填写完整的入库单信息')
      return
    }

    const material = mockMaterials.find(m => m.id === formData.materialId)
    if (!material) return

    const now = getNowTime()
    const orderId = generateId('IB')
    const orderCode = 'IN' + String(2024000 + state.inboundOrders.length + 1)
    const palletId = generateId('P')

    const newOrder: InboundOrder = {
      id: orderId,
      code: orderCode,
      materialId: material.id,
      materialName: material.name,
      quantity: formData.quantity,
      palletCode: formData.palletCode,
      supplier: formData.supplier,
      status: 'pending',
      createTime: now,
      operator: '当前操作员'
    }

    const newPallet = {
      id: palletId,
      code: formData.palletCode,
      materialId: material.id,
      materialName: material.name,
      quantity: formData.quantity,
      unit: material.unit,
      inboundTime: now,
      productionDate: now.slice(0, 10),
      status: 'empty' as const
    }

    dispatch({ type: 'ADD_INBOUND_ORDER', payload: newOrder })
    dispatch({ type: 'ADD_PALLET', payload: newPallet })

    setShowCreateForm(false)
    setFormData({ materialId: '', quantity: 0, palletCode: '', supplier: '' })
    setActiveOrderId(orderId)
    setScanCode(orderCode)
    setTab('scan')
  }

  const handleScan = () => {
    const trimmed = scanCode.trim()
    if (!trimmed) return
    const order = state.inboundOrders.find(o =>
      o.code.toUpperCase() === trimmed.toUpperCase() ||
      (o.palletCode && o.palletCode.toUpperCase() === trimmed.toUpperCase())
    )
    if (order) {
      setScanResult(order)
    } else {
      const material = mockMaterials.find(m => m.code.toUpperCase() === trimmed.toUpperCase())
      if (material) {
        setScanResult({ type: 'material', ...material })
      } else {
        setScanResult({ error: '未找到相关信息，请检查条码' })
      }
    }
  }

  const handleConfirmScan = () => {
    if (!scanResult || scanResult.type === 'material' || scanResult.error) return

    const beforeQty = getMaterialStock(state, scanResult.materialId)

    dispatch({
      type: 'UPDATE_INBOUND_ORDER',
      payload: { id: scanResult.id, status: 'allocating' }
    })

    dispatch({
      type: 'ADD_INVENTORY_RECORD',
      payload: {
        id: generateId('IR'),
        type: 'inbound',
        materialId: scanResult.materialId,
        materialName: scanResult.materialName,
        quantity: scanResult.quantity,
        beforeQty,
        afterQty: beforeQty + scanResult.quantity,
        palletCode: scanResult.palletCode,
        orderCode: scanResult.code,
        operator: '当前操作员',
        timestamp: getNowTime(),
        remark: '扫码确认入库'
      }
    })

    setActiveOrderId(scanResult.id)
    setScanResult(null)
    setScanCode('')
    setTab('allocate')
  }

  const handleConfirmAllocate = () => {
    if (!activeOrder || !recommendedLocation) return

    const beforeQty = getMaterialStock(state, activeOrder.materialId)

    dispatch({
      type: 'UPDATE_INBOUND_ORDER',
      payload: {
        id: activeOrder.id,
        status: 'stacking',
        locationId: recommendedLocation.id,
        locationCode: recommendedLocation.code
      }
    })

    dispatch({
      type: 'UPDATE_LOCATION',
      payload: {
        id: recommendedLocation.id,
        status: 'occupied',
        palletCode: activeOrder.palletCode,
        palletId: state.pallets.find(p => p.code === activeOrder.palletCode)?.id,
        currentLoad: activeOrder.quantity,
        category: mockMaterials.find(m => m.id === activeOrder.materialId)?.category
      }
    })

    if (activeOrder.palletCode) {
      const pallet = state.pallets.find(p => p.code === activeOrder.palletCode)
      if (pallet) {
        dispatch({
          type: 'UPDATE_PALLET',
          payload: {
            id: pallet.id,
            status: 'stored',
            locationCode: recommendedLocation.code
          }
        })
      }
    }

    dispatch({
      type: 'ADD_INVENTORY_RECORD',
      payload: {
        id: generateId('IR'),
        type: 'inbound',
        materialId: activeOrder.materialId,
        materialName: activeOrder.materialName,
        quantity: activeOrder.quantity,
        beforeQty,
        afterQty: beforeQty + activeOrder.quantity,
        palletCode: activeOrder.palletCode,
        locationCode: recommendedLocation.code,
        orderCode: activeOrder.code,
        operator: '当前操作员',
        timestamp: getNowTime(),
        remark: '货位分配完成，物料上架'
      }
    })

    setSelectedLocationId(null)
    setAllocateSuccess(true)
    setTimeout(() => {
      setAllocateSuccess(false)
      setActiveOrderId(null)
      setTab('orders')
    }, 2000)
  }

  const handlePickLocation = (locId: string) => {
    setSelectedLocationId(locId)
  }

  const stats = {
    total: state.inboundOrders.length,
    pending: state.inboundOrders.filter(o => o.status === 'pending').length,
    stacking: state.inboundOrders.filter(o => o.status === 'stacking').length,
    completed: state.inboundOrders.filter(o => o.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日入库单</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待扫码</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">上架中</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.stacking}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card">
        <div className="border-b border-gray-100 px-5">
          <div className="flex gap-1">
            {[
              { id: 'orders', label: '入库单列表', icon: FileText },
              { id: 'scan', label: '来料扫码', icon: QrCode },
              { id: 'allocate', label: '货位智能分配', icon: MapPin },
            ].map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-5">
          {tab === 'orders' && (
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索单号、物料名称..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="scanning">扫码中</option>
                  <option value="allocating">分配中</option>
                  <option value="stacking">上架中</option>
                  <option value="completed">已完成</option>
                </select>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className={`flex items-center gap-1 px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                    showCreateForm ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showCreateForm ? '取消' : '新建入库单'}
                </button>
                <button className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" />
                  刷新
                </button>
              </div>

              {showCreateForm && (
                <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    新建入库单
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">物料</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setMaterialDropdownOpen(!materialDropdownOpen)}
                          className="w-full px-4 py-2.5 text-sm text-left border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between"
                        >
                          <span className={selectedMaterial ? 'text-gray-800' : 'text-gray-400'}>
                            {selectedMaterial ? `${selectedMaterial.code} - ${selectedMaterial.name}` : '请选择物料'}
                          </span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        {materialDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                            {mockMaterials.map((m) => (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setFormData({ ...formData, materialId: m.id })
                                  setMaterialDropdownOpen(false)
                                }}
                                className="px-4 py-2.5 text-sm hover:bg-blue-50 cursor-pointer"
                              >
                                <div className="font-medium text-gray-800">{m.code} - {m.name}</div>
                                <div className="text-xs text-gray-500">{m.spec} | {m.category}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity || ''}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        placeholder="请输入数量"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">托盘号</label>
                      <input
                        type="text"
                        value={formData.palletCode}
                        onChange={(e) => setFormData({ ...formData, palletCode: e.target.value })}
                        placeholder="例如：PLT0001"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">供应商</label>
                      <select
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">请选择供应商</option>
                        <option value="供应商A">供应商A</option>
                        <option value="供应商B">供应商B</option>
                        <option value="供应商C">供应商C</option>
                        <option value="供应商D">供应商D</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowCreateForm(false)
                        setFormData({ materialId: '', quantity: 0, palletCode: '', supplier: '' })
                      }}
                      className="px-5 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleCreateOrder}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      提交入库单
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 bg-gray-50">
                      <th className="px-4 py-3 font-medium">入库单号</th>
                      <th className="px-4 py-3 font-medium">物料名称</th>
                      <th className="px-4 py-3 font-medium">数量</th>
                      <th className="px-4 py-3 font-medium">托盘号</th>
                      <th className="px-4 py-3 font-medium">供应商</th>
                      <th className="px-4 py-3 font-medium">操作员</th>
                      <th className="px-4 py-3 font-medium">货位</th>
                      <th className="px-4 py-3 font-medium">创建时间</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{order.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{order.materialName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{order.palletCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.supplier}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.operator}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{order.locationCode || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{order.createTime}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => { setScanCode(order.code); setActiveOrderId(order.id); setTab('scan'); }}
                                className="text-xs px-2 py-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                              >
                                扫码
                              </button>
                            )}
                            {order.status === 'scanning' && (
                              <button
                                onClick={() => { setActiveOrderId(order.id); setTab('allocate'); }}
                                className="text-xs px-2 py-1 text-purple-600 bg-purple-50 rounded hover:bg-purple-100"
                              >
                                分配货位
                              </button>
                            )}
                            {(order.status === 'allocating' || order.status === 'stacking') && (
                              <button
                                onClick={() => { setActiveOrderId(order.id); setTab('allocate'); }}
                                className="text-xs px-2 py-1 text-green-600 bg-green-50 rounded hover:bg-green-100"
                              >
                                查看进度
                              </button>
                            )}
                            <button className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">详情</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'scan' && (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <QrCode className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">来料入库扫码</h3>
                <p className="text-sm text-gray-500 mt-1">使用扫码枪扫描条码或手动输入单号/物料编码</p>
              </div>

              {activeOrder && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-xs text-amber-600 font-medium mb-1">当前待处理入库单</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {activeOrder.code} · {activeOrder.materialName} · {activeOrder.quantity}件 · 托盘 {activeOrder.palletCode}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">条码输入</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={scanCode}
                      onChange={(e) => setScanCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                      placeholder="请扫描或输入条码，例如：IN2024001 / PLT0001"
                      className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleScan}
                      className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      扫码
                    </button>
                  </div>
                </div>

                {scanResult && (
                  <div className={`p-5 rounded-xl border ${scanResult.error ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    {scanResult.error ? (
                      <div className="text-red-600 text-center py-4">{scanResult.error}</div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-800">扫码结果</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[scanResult.status || 'pending']}`}>
                            {statusLabels[scanResult.status || 'pending']}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-500">{scanResult.type === 'material' ? '物料编码' : '单号'}</span>
                            <p className="text-sm font-medium text-gray-800 mt-1">{scanResult.code}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">名称</span>
                            <p className="text-sm font-medium text-gray-800 mt-1">{scanResult.materialName || scanResult.name}</p>
                          </div>
                          {!scanResult.type && (
                            <>
                              <div>
                                <span className="text-xs text-gray-500">数量</span>
                                <p className="text-sm font-medium text-gray-800 mt-1">{scanResult.quantity}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">托盘号</span>
                                <p className="text-sm font-medium text-gray-800 mt-1 font-mono">{scanResult.palletCode}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">供应商</span>
                                <p className="text-sm font-medium text-gray-800 mt-1">{scanResult.supplier}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">操作员</span>
                                <p className="text-sm font-medium text-gray-800 mt-1">{scanResult.operator}</p>
                              </div>
                            </>
                          )}
                        </div>
                        {!scanResult.type && (scanResult.status === 'pending' || scanResult.status === 'scanning') && (
                          <button
                            onClick={handleConfirmScan}
                            className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                          >
                            确认扫码信息，进入货位分配
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                        {!scanResult.type && (scanResult.status === 'allocating' || scanResult.status === 'stacking') && (
                          <button
                            onClick={() => { setActiveOrderId(scanResult.id); setTab('allocate'); setScanResult(null); setScanCode(''); }}
                            className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                            查看当前分配进度
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">扫码提示</h5>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 支持扫描入库单号、托盘条码、物料编码</li>
                    <li>• 扫码成功后系统自动校验物料信息</li>
                    <li>• 校验通过后进入智能货位分配环节</li>
                    <li>• 扫码确认后自动记录库存台账</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {tab === 'allocate' && (
            <div>
              {allocateSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-medium text-green-800">货位分配成功</div>
                    <div className="text-sm text-green-600">入库单已切换为上架中，货位已占用，库存台账已记录</div>
                  </div>
                </div>
              )}

              {activeOrder && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-blue-600 font-medium">当前分配入库单</div>
                      <div className="text-sm font-semibold text-gray-800 mt-1">
                        {activeOrder.code} · {activeOrder.materialName} · {activeOrder.quantity}件 · 托盘 {activeOrder.palletCode}
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full ${statusColors[activeOrder.status]}`}>
                      {statusLabels[activeOrder.status]}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h4 className="font-semibold text-gray-800 mb-4">智能分配推荐货位</h4>
                  {recommendedLocation ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">系统推荐</span>
                          <h5 className="text-lg font-semibold text-gray-800 mt-2">最佳货位: {recommendedLocation.code}</h5>
                          <p className="text-sm text-gray-500 mt-1">
                            {recommendedLocation.category || '通用区'} · 巷道 {recommendedLocation.aisle} · 列 {recommendedLocation.column} · 层 {recommendedLocation.layer}
                          </p>
                        </div>
                        {activeOrder && activeOrder.status !== 'completed' && activeOrder.status !== 'stacking' && (
                          <button
                            onClick={handleConfirmAllocate}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                          >
                            确认分配
                          </button>
                        )}
                        {activeOrder?.status === 'stacking' && (
                          <span className="px-5 py-2.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg flex items-center gap-1">
                            <Clock className="w-4 h-4" /> 上架中
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/70 rounded-lg p-3">
                          <span className="text-xs text-gray-500">分配策略</span>
                          <p className="text-sm font-medium text-gray-800 mt-1">先进先出 + 同类聚集</p>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3">
                          <span className="text-xs text-gray-500">搬运距离</span>
                          <p className="text-sm font-medium text-gray-800 mt-1">最短路径 25m</p>
                        </div>
                        <div className="bg-white/70 rounded-lg p-3">
                          <span className="text-xs text-gray-500">容量利用率</span>
                          <p className="text-sm font-medium text-gray-800 mt-1">预计 45%</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400 bg-gray-50 border border-gray-200 rounded-xl mb-4">
                      暂无可用空货位
                    </div>
                  )}

                  <h4 className="font-semibold text-gray-800 mb-3">可选货位列表</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 bg-gray-50">
                          <th className="px-4 py-3 font-medium">货位编码</th>
                          <th className="px-4 py-3 font-medium">位置</th>
                          <th className="px-4 py-3 font-medium">分类</th>
                          <th className="px-4 py-3 font-medium">容量</th>
                          <th className="px-4 py-3 font-medium">状态</th>
                          <th className="px-4 py-3 font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservedLocations.map((loc) => (
                          <tr key={loc.id} className="border-b border-amber-50 bg-amber-50/50 hover:bg-amber-50">
                            <td className="px-4 py-3 text-sm font-mono font-medium text-amber-700">{loc.code}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">A{loc.aisle}巷 C{loc.column}列 L{loc.layer}层</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{loc.category || '通用'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{loc.capacity}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[loc.status]}`}>
                                {statusLabels[loc.status]} ({loc.palletCode})
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-400">已预留</span>
                            </td>
                          </tr>
                        ))}
                        {emptyLocations.map((loc) => (
                          <tr
                            key={loc.id}
                            className={`border-b border-gray-50 hover:bg-gray-50 ${selectedLocationId === loc.id ? 'bg-blue-50' : ''}`}
                          >
                            <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{loc.code}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">A{loc.aisle}巷 C{loc.column}列 L{loc.layer}层</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{loc.category || '通用'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{loc.capacity}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[loc.status]}`}>
                                {statusLabels[loc.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handlePickLocation(loc.id)}
                                className={`text-xs px-3 py-1 rounded ${selectedLocationId === loc.id ? 'text-white bg-blue-600' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
                              >
                                {selectedLocationId === loc.id ? '已选' : '选择'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">货位占用热力图</h4>
                  <div className="bg-gray-900 rounded-xl p-4">
                    <div className="space-y-1">
                      {Array.from({ length: 5 }, (_, layer) => (
                        <div key={layer} className="flex gap-1">
                          <span className="w-8 text-xs text-gray-400 flex items-center">L{5 - layer}</span>
                          {Array.from({ length: 8 }, (_, col) => {
                            const targetCode = `A1-C${String(col + 1).padStart(2, '0')}-L${5 - layer}`
                            const found = state.locations.find(l => l.code === targetCode)
                            let status = 'empty'
                            if (found) status = found.status
                            let bg = '#374151'
                            if (status === 'occupied') bg = 'rgba(59, 130, 246, 0.85)'
                            else if (status === 'reserved') bg = 'rgba(245, 158, 11, 0.85)'
                            else if (status === 'maintenance') bg = 'rgba(239, 68, 68, 0.7)'
                            return (
                              <div
                                key={col}
                                className="flex-1 h-6 rounded-sm"
                                style={{ backgroundColor: bg }}
                                title={`${targetCode} - ${status}`}
                              />
                            )
                          })}
                        </div>
                      ))}
                      <div className="flex gap-1 mt-2">
                        <div className="w-8"></div>
                        {Array.from({ length: 8 }, (_, i) => (
                          <span key={i} className="flex-1 text-center text-xs text-gray-400">C{i + 1}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="text-xs text-gray-400 mb-2">图例</div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gray-700 rounded-sm"></div>
                          <span className="text-gray-400">空</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                          <span className="text-gray-400">预留</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                          <span className="text-gray-400">占用</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h5 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      分配策略说明
                    </h5>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>• 先进先出：优先分配靠近出库口的货位</li>
                      <li>• 同类聚集：相同品类物料就近存放</li>
                      <li>• 重量分布：重物放低层，轻物放高层</li>
                      <li>• 周转率：高周转物料靠近巷道口</li>
                      <li>• 分配完成自动记录库存台账</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
