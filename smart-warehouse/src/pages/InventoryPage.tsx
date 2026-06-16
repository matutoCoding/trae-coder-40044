import { useState, useMemo } from 'react'
import {
  Package, TrendingUp, ArrowDownToLine, ArrowUpFromLine,
  Search, Filter, Clock, User, MapPin, FileText,
  AlertTriangle, CheckCircle, ArrowRight
} from 'lucide-react'
import { useWarehouse, getDeduplicatedInboundQty, getDeduplicatedOutboundQty } from '@/context/WarehouseContext'
import { mockMaterials } from '@/data/mockData'
import { statusColors, statusLabels } from '@/utils'
import type { InventoryRecord, Material } from '@/types'

interface MaterialStock {
  material: Material
  currentStock: number
  safetyStock: number
  maxStock: number
  status: 'normal' | 'low' | 'high'
}

export default function InventoryPage() {
  const { state } = useWarehouse()
  const [materialFilter, setMaterialFilter] = useState<string>('all')
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all')
  const [searchText, setSearchText] = useState('')

  const totalInbound = useMemo(() =>
    getDeduplicatedInboundQty(state.inventoryRecords),
    [state.inventoryRecords]
  )

  const totalOutbound = useMemo(() =>
    getDeduplicatedOutboundQty(state.inventoryRecords),
    [state.inventoryRecords]
  )

  const currentStock = useMemo(() =>
    state.pallets
      .filter(p => p.status === 'stored')
      .reduce((sum, p) => sum + p.quantity, 0),
    [state.pallets]
  )

  const inventoryTurnover = useMemo(() => {
    const beginningStock = currentStock + totalOutbound - totalInbound
    const averageStock = (beginningStock + currentStock) / 2
    return averageStock > 0 ? (totalOutbound / averageStock).toFixed(2) : '0.00'
  }, [totalOutbound, totalInbound, currentStock])

  const materialStockList = useMemo((): MaterialStock[] => {
    const stockMap = new Map<string, number>()
    state.pallets.forEach(pallet => {
      if (pallet.status === 'stored') {
        const current = stockMap.get(pallet.materialId) || 0
        stockMap.set(pallet.materialId, current + pallet.quantity)
      }
    })

    return mockMaterials.map(material => {
      const currentStock = stockMap.get(material.id) || 0
      let status: 'normal' | 'low' | 'high' = 'normal'
      if (currentStock < material.safetyStock) {
        status = 'low'
      } else if (currentStock > material.maxStock) {
        status = 'high'
      }
      return {
        material,
        currentStock,
        safetyStock: material.safetyStock,
        maxStock: material.maxStock,
        status
      }
    })
  }, [state.pallets])

  const filteredMaterialStock = useMemo(() =>
    materialStockList.filter(item => {
      if (materialFilter !== 'all' && item.material.id !== materialFilter) return false
      if (searchText && !item.material.name.includes(searchText) && !item.material.code.includes(searchText)) return false
      return true
    }),
    [materialStockList, materialFilter, searchText]
  )

  const filteredRecords = useMemo(() => {
    let records = [...state.inventoryRecords]
    if (materialFilter !== 'all') {
      records = records.filter(r => r.materialId === materialFilter)
    }
    if (recordTypeFilter !== 'all') {
      records = records.filter(r => r.type === recordTypeFilter)
    }
    return records.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [state.inventoryRecords, materialFilter, recordTypeFilter])

  const statCards = useMemo(() => [
    { title: '总入库量', value: totalInbound, unit: '件', icon: ArrowDownToLine, color: 'from-green-500 to-green-600' },
    { title: '总出库量', value: totalOutbound, unit: '件', icon: ArrowUpFromLine, color: 'from-blue-500 to-blue-600' },
    { title: '当前库存', value: currentStock, unit: '件', icon: Package, color: 'from-purple-500 to-purple-600' },
    { title: '库存周转率', value: inventoryTurnover, unit: '次', icon: TrendingUp, color: 'from-orange-500 to-orange-600' },
  ], [totalInbound, totalOutbound, currentStock, inventoryTurnover])

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-red-100 text-red-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      default: return 'bg-green-100 text-green-700'
    }
  }

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'low': return '库存不足'
      case 'high': return '库存过高'
      default: return '正常'
    }
  }

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'inbound': return <ArrowDownToLine className="w-4 h-4 text-green-500" />
      case 'outbound': return <ArrowUpFromLine className="w-4 h-4 text-blue-500" />
      case 'transfer': return <ArrowRight className="w-4 h-4 text-purple-500" />
      case 'adjust': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'check': return <CheckCircle className="w-4 h-4 text-cyan-500" />
      default: return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(function(card, i) {
          const Icon = card.icon
          return (
            <div key={i} className="bg-white rounded-xl shadow-card hover:shadow-cardHover p-5 transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-800">{card.value}</span>
                    <span className="text-sm text-gray-400">{card.unit}</span>
                  </div>
                </div>
                <div className={'w-12 h-12 bg-gradient-to-br ' + card.color + ' rounded-xl flex items-center justify-center'}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索物料名称或编码..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部物料</option>
            {mockMaterials.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={recordTypeFilter}
            onChange={(e) => setRecordTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部记录类型</option>
            <option value="inbound">入库</option>
            <option value="outbound">出库</option>
            <option value="transfer">移库</option>
            <option value="adjust">调整</option>
            <option value="check">盘点</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">物料库存汇总</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="pb-3 pr-4 font-medium">物料名称</th>
                <th className="pb-3 pr-4 font-medium">物料编码</th>
                <th className="pb-3 pr-4 font-medium">分类</th>
                <th className="pb-3 pr-4 font-medium">当前库存</th>
                <th className="pb-3 pr-4 font-medium">安全库存</th>
                <th className="pb-3 pr-4 font-medium">最大库存</th>
                <th className="pb-3 font-medium">库存状态</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterialStock.map(function(item) {
                return (
                  <tr key={item.material.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 text-sm font-medium text-gray-800">{item.material.name}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{item.material.code}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{item.material.category}</td>
                    <td className="py-3 pr-4 text-sm font-semibold text-gray-800">{item.currentStock}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{item.safetyStock}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{item.maxStock}</td>
                    <td className="py-3">
                      <span className={'text-xs px-2 py-1 rounded-full ' + getStockStatusColor(item.status)}>
                        {getStockStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">操作记录时间线</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-4">
            {filteredRecords.map(function(record: InventoryRecord) {
              return (
                <div key={record.id} className="relative pl-10">
                  <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    {getRecordIcon(record.type)}
                  </div>
                  <div className="p-4 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (statusColors[record.type] || 'bg-gray-100 text-gray-600')}>
                          {statusLabels[record.type] || record.type}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{record.materialName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{record.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">数量变化:</span>
                        <span className="text-gray-600">{record.beforeQty}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className={record.afterQty > record.beforeQty ? 'text-green-600 font-medium' :
                                        record.afterQty < record.beforeQty ? 'text-red-600 font-medium' : 'text-gray-600 font-medium'}>
                          {record.afterQty}
                        </span>
                        <span className={record.afterQty > record.beforeQty ? 'text-green-500' : record.afterQty < record.beforeQty ? 'text-red-500' : 'text-gray-400'}>
                          ({record.afterQty > record.beforeQty ? '+' : ''}{record.afterQty - record.beforeQty})
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-gray-400" />
                        <span>{record.palletCode}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{record.locationCode}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {record.orderCode && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>订单号: {record.orderCode}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>操作人: {record.operator}</span>
                      </span>
                      {record.remark && (
                        <span className="text-gray-400">备注: {record.remark}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
