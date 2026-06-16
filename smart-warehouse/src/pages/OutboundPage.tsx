import { useState, useMemo } from 'react'
import {
  Truck, Search, Plus, CheckCircle2, Clock, AlertCircle,
  FileText, QrCode, ListTodo, ShieldCheck, ArrowRight, RefreshCw
} from 'lucide-react'
import { useWarehouse } from '@/context/WarehouseContext'
import { mockMaterials } from '@/data/mockData'
import { statusColors, statusLabels } from '@/utils'
import type { Pallet, OutboundOrder } from '@/types'

type TabType = 'orders' | 'waves' | 'picking' | 'review'

export default function OutboundPage() {
  const { state, dispatch } = useWarehouse()
  const [tab, setTab] = useState<TabType>('orders')
  const [selectedWave, setSelectedWave] = useState<string | null>(null)
  const [reviewCode, setReviewCode] = useState('')
  const [reviewResult, setReviewResult] = useState<any>(null)
  const [fifoMaterialId, setFifoMaterialId] = useState<string>('all')

  const pickingOrders = state.outboundOrders.filter(o => o.status === 'picking').length
  const reviewingOrders = state.outboundOrders.filter(o => o.status === 'reviewing').length
  const urgentOrders = state.outboundOrders.filter(o => o.priority === 'urgent' && o.status !== 'completed').length

  const handleReview = () => {
    const trimmed = reviewCode.trim()
    if (!trimmed) return

    let matchedOrder: OutboundOrder | undefined
    let matchedPallet: Pallet | undefined

    matchedOrder = state.outboundOrders.find(o => o.code.toUpperCase() === trimmed.toUpperCase())
    if (!matchedOrder) {
      matchedPallet = state.pallets.find(p => p.code.toUpperCase() === trimmed.toUpperCase())
      if (matchedPallet) {
        matchedOrder = state.outboundOrders.find(o =>
          o.status !== 'completed' &&
          (o.palletCodes?.includes(matchedPallet!.code) || o.materialId === matchedPallet!.materialId)
        )
      }
    } else {
      const palletCode = matchedOrder.palletCodes?.[0]
      matchedPallet = palletCode ? state.pallets.find(p => p.code === palletCode) : undefined
    }

    if (matchedOrder) {
      if (!matchedPallet) {
        matchedPallet = state.pallets.find(p => p.materialId === matchedOrder!.materialId && p.status === 'stored')
      }
      const material = mockMaterials.find(m => m.id === matchedOrder!.materialId)
      const diff = Math.floor(Math.random() * 5) - 2
      const actualQty = Math.max(0, matchedOrder.quantity + (Math.random() > 0.6 ? diff : 0))
      setReviewResult({
        order: matchedOrder,
        pallet: matchedPallet,
        material,
        matched: actualQty === matchedOrder.quantity,
        actualQty,
        scannedByPallet: !!matchedPallet && !state.outboundOrders.find(o => o.code.toUpperCase() === trimmed.toUpperCase())
      })
    } else {
      setReviewResult({ error: '未找到对应出库单或托盘' })
    }
  }

  const handleConfirmOutbound = () => {
    if (!reviewResult?.order) return
    dispatch({
      type: 'UPDATE_OUTBOUND_ORDER',
      payload: { id: reviewResult.order.id, status: 'completed' }
    })
    if (reviewResult.pallet) {
      dispatch({
        type: 'UPDATE_PALLET',
        payload: { id: reviewResult.pallet.id, status: 'outbound' }
      })
    }
    setReviewResult({ ...reviewResult, confirmed: true })
  }

  const handleReleaseWave = (waveId: string) => {
    dispatch({
      type: 'BATCH_UPDATE_OUTBOUND_WAVE',
      waveId,
      waveStatus: 'processing',
      orderStatus: 'picking'
    })
  }

  const handleStartPicking = (orderId: string) => {
    dispatch({ type: 'UPDATE_OUTBOUND_ORDER', payload: { id: orderId, status: 'picking' } })
  }

  const handleFinishPicking = (orderId: string) => {
    dispatch({ type: 'UPDATE_OUTBOUND_ORDER', payload: { id: orderId, status: 'reviewing' } })
  }

  const fifoPallets = useMemo(() => {
    return state.pallets
      .filter(p => p.status === 'stored' && (fifoMaterialId === 'all' || p.materialId === fifoMaterialId))
      .sort((a, b) => new Date(a.inboundTime).getTime() - new Date(b.inboundTime).getTime())
      .slice(0, 8)
  }, [state.pallets, fifoMaterialId])

  const materialOptions = useMemo(() => {
    const map = new Map<string, string>()
    state.pallets.forEach(p => { if (p.status === 'stored') map.set(p.materialId, p.materialName) })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [state.pallets])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日出库单</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{state.outboundOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">拣选中</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{pickingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ListTodo className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待复核</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{reviewingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">紧急订单</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{urgentOrders}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card">
        <div className="border-b border-gray-100 px-5">
          <div className="flex gap-1">
            {[
              { id: 'orders', label: '出库订单', icon: FileText },
              { id: 'waves', label: '波次管理', icon: ListTodo },
              { id: 'picking', label: '拣选作业', icon: Truck },
              { id: 'review', label: '出库复核', icon: ShieldCheck },
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
                    placeholder="搜索单号、物料名称、客户..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>全部状态</option>
                  <option>待处理</option>
                  <option>拣选中</option>
                  <option>复核中</option>
                  <option>已完成</option>
                </select>
                <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>全部优先级</option>
                  <option>普通</option>
                  <option>紧急</option>
                  <option>VIP</option>
                </select>
                <button className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  新建出库单
                </button>
                <button className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" />
                  刷新
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 bg-gray-50">
                      <th className="px-4 py-3 font-medium">出库单号</th>
                      <th className="px-4 py-3 font-medium">物料名称</th>
                      <th className="px-4 py-3 font-medium">数量</th>
                      <th className="px-4 py-3 font-medium">客户</th>
                      <th className="px-4 py-3 font-medium">优先级</th>
                      <th className="px-4 py-3 font-medium">波次</th>
                      <th className="px-4 py-3 font-medium">创建时间</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.outboundOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{order.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{order.materialName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.customer}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.priority]}`}>
                            {statusLabels[order.priority]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.waveId || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{order.createTime}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {order.status === 'pending' && (
                              <button className="text-xs px-2 py-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100">加入波次</button>
                            )}
                            {order.status === 'picking' && (
                              <button className="text-xs px-2 py-1 text-purple-600 bg-purple-50 rounded hover:bg-purple-100">拣选进度</button>
                            )}
                            {order.status === 'reviewing' && (
                              <button onClick={() => { setTab('review'); setReviewCode(order.code); }} className="text-xs px-2 py-1 text-green-600 bg-green-50 rounded hover:bg-green-100">去复核</button>
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

          {tab === 'waves' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">拣选波次管理</h4>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    自动生成波次
                  </button>
                  <button className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <ListTodo className="w-4 h-4" />
                    手动建波
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.pickingWaves.map((wave) => (
                  <div
                    key={wave.id}
                    onClick={() => setSelectedWave(wave.id)}
                    className={`p-5 border rounded-xl cursor-pointer transition-all ${
                      selectedWave === wave.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-card'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-gray-800">{wave.code}</h5>
                        <p className="text-xs text-gray-500 mt-1">创建于 {wave.createTime}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[wave.status]}`}>
                        {statusLabels[wave.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500">订单数</span>
                        <p className="font-semibold text-gray-800 mt-1">{wave.orderCount} 单</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500">操作员</span>
                        <p className="font-semibold text-gray-800 mt-1">{wave.operator}</p>
                      </div>
                    </div>
                    {wave.status === 'pending' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReleaseWave(wave.id); }}
                        className="mt-4 w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1"
                      >
                        <ArrowRight className="w-4 h-4" />
                        下达波次
                      </button>
                    )}
                    {wave.status === 'processing' && (
                      <div className="mt-4 w-full py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg text-center flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4" />
                        处理中...
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-xl">
                <h5 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <ListTodo className="w-5 h-5" />
                  波次生成策略
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/70 rounded-lg">
                    <h6 className="font-medium text-gray-800 mb-2">按区域划分</h6>
                    <p className="text-xs text-gray-500">将同一巷道/区域的订单合并，减少堆垛机移动距离</p>
                  </div>
                  <div className="p-4 bg-white/70 rounded-lg">
                    <h6 className="font-medium text-gray-800 mb-2">先进先出（FIFO）</h6>
                    <p className="text-xs text-gray-500">优先分配最早入库的托盘，减少库存呆滞和过期风险</p>
                  </div>
                  <div className="p-4 bg-white/70 rounded-lg">
                    <h6 className="font-medium text-gray-800 mb-2">紧急优先</h6>
                    <p className="text-xs text-gray-500">VIP/紧急订单优先处理，确保高优先级订单及时出库</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'picking' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h4 className="font-semibold text-gray-800 mb-4">拣选任务列表</h4>
                <div className="space-y-3">
                  {state.outboundOrders
                    .filter(o => o.status === 'picking' || o.status === 'pending')
                    .slice(0, 8)
                    .map((order, idx) => (
                    <div key={order.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-card transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            idx < 3 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{order.code}</div>
                            <div className="text-xs text-gray-500">波次: {order.waveId || '待分配'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.priority]}`}>
                            {statusLabels[order.priority]}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-xs text-gray-500">物料</span>
                          <p className="font-medium text-gray-800 mt-0.5">{order.materialName}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">数量</span>
                          <p className="font-medium text-gray-800 mt-0.5">{order.quantity}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">客户</span>
                          <p className="font-medium text-gray-800 mt-0.5">{order.customer}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">货位</span>
                          <p className="font-medium text-blue-600 mt-0.5 font-mono">A{(idx % 5) + 1}-C{String((idx % 8) + 1).padStart(2, '0')}-L{(idx % 5) + 1}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          预计 {10 + idx * 2} 分钟完成
                        </div>
                        <div className="flex gap-2">
                          <button className="text-xs px-3 py-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100">查看详情</button>
                          {order.status === 'pending' && (
                            <button onClick={() => handleStartPicking(order.id)} className="text-xs px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-700">开始拣选</button>
                          )}
                          {order.status === 'picking' && (
                            <button onClick={() => handleFinishPicking(order.id)} className="text-xs px-3 py-1 text-white bg-green-600 rounded hover:bg-green-700">完成拣选</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-4">先进先出队列</h4>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">FIFO 自动管控</span>
                  </div>
                  <p className="text-xs text-green-700">系统自动按照入库时间排序，优先出库最早入库的物料</p>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">按物料筛选</label>
                  <select
                    value={fifoMaterialId}
                    onChange={(e) => setFifoMaterialId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">全部物料</option>
                    {materialOptions.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <h5 className="font-medium text-gray-700 mb-3">待出库队列（按入库时间排序，最早在前）</h5>
                <div className="space-y-2">
                  {fifoPallets.map((pallet, idx) => (
                    <div key={pallet.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-800 font-mono">{pallet.code}</div>
                            <div className="text-xs text-gray-500">{pallet.materialName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-800">{pallet.quantity}</div>
                          <div className="text-xs text-gray-400">{pallet.inboundTime.slice(5, 10)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {fifoPallets.length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-sm">暂无在库托盘</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'review' && (
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">出库复核</h3>
                <p className="text-sm text-gray-500 mt-1">扫描出库单条码或托盘条码，系统自动核对物料信息</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 border border-gray-200 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">扫码复核（支持出库单号 / 托盘号）</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={reviewCode}
                      onChange={(e) => setReviewCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReview()}
                      placeholder="扫描或输入出库单号 / 托盘号"
                      className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleReview}
                      className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      扫码复核
                    </button>
                  </div>
                </div>

                {reviewResult && !reviewResult.confirmed && (
                  <div className={`p-5 rounded-xl border ${
                    reviewResult.error
                      ? 'bg-red-50 border-red-200'
                      : reviewResult.matched
                      ? 'bg-green-50 border-green-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    {reviewResult.error ? (
                      <div className="text-red-600 text-center py-4">{reviewResult.error}</div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {reviewResult.matched ? (
                              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-amber-600" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {reviewResult.matched ? '复核通过' : '存在差异'}
                              </h4>
                              <p className="text-sm text-gray-500">
                                出库单 {reviewResult.order.code}
                                {reviewResult.scannedByPallet && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">通过托盘匹配</span>}
                              </p>
                            </div>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full ${
                            reviewResult.matched ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {reviewResult.matched ? '信息一致' : '需人工确认'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-white/70 rounded-lg">
                            <span className="text-xs text-gray-500">物料名称</span>
                            <p className="text-sm font-medium text-gray-800 mt-1">{reviewResult.order.materialName}</p>
                          </div>
                          <div className="p-3 bg-white/70 rounded-lg">
                            <span className="text-xs text-gray-500">客户</span>
                            <p className="text-sm font-medium text-gray-800 mt-1">{reviewResult.order.customer}</p>
                          </div>
                          <div className="p-3 bg-white/70 rounded-lg">
                            <span className="text-xs text-gray-500">系统数量</span>
                            <p className="text-sm font-medium text-gray-800 mt-1">{reviewResult.order.quantity}</p>
                          </div>
                          <div className={`p-3 rounded-lg ${
                            reviewResult.actualQty === reviewResult.order.quantity
                              ? 'bg-white/70'
                              : 'bg-red-100'
                          }`}>
                            <span className="text-xs text-gray-500">实际数量</span>
                            <p className={`text-sm font-medium mt-1 ${
                              reviewResult.actualQty === reviewResult.order.quantity
                                ? 'text-gray-800'
                                : 'text-red-600'
                            }`}>
                              {reviewResult.actualQty}
                              {reviewResult.actualQty !== reviewResult.order.quantity && (
                                <span className="ml-1 text-xs">（差异 {reviewResult.actualQty - reviewResult.order.quantity > 0 ? '+' : ''}{reviewResult.actualQty - reviewResult.order.quantity}）</span>
                              )}
                            </p>
                          </div>
                          <div className="p-3 bg-white/70 rounded-lg">
                            <span className="text-xs text-gray-500">托盘号</span>
                            <p className="text-sm font-medium text-gray-800 mt-1 font-mono">{reviewResult.pallet?.code || '-'}</p>
                          </div>
                          <div className="p-3 bg-white/70 rounded-lg">
                            <span className="text-xs text-gray-500">操作员</span>
                            <p className="text-sm font-medium text-gray-800 mt-1">{reviewResult.order.operator}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={handleConfirmOutbound}
                            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                          >
                            {reviewResult.matched ? '确认出库' : '按实际数量出库'}
                          </button>
                          {!reviewResult.matched && (
                            <button className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                              驳回重新拣选
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {reviewResult?.confirmed && (
                  <div className="p-5 rounded-xl border bg-green-50 border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">出库完成</h4>
                        <p className="text-sm text-gray-500">订单 {reviewResult.order.code} 状态已更新为：已完成</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setReviewResult(null); setReviewCode(''); }}
                      className="mt-2 w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      继续复核下一单
                    </button>
                  </div>
                )}

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">复核要点</h5>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• 核对物料名称、规格是否与出库单一致</li>
                    <li>• 核对实际数量与系统数量是否匹配</li>
                    <li>• 检查托盘标签是否完好，批次是否正确</li>
                    <li>• 确认先进先出规则执行情况</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
