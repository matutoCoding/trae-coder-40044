import { useState } from 'react'
import {
  AlertTriangle, Search, Bell,
  TrendingDown, TrendingUp, AlertCircle, Package, CalendarDays, RefreshCw, Filter,
  Clock, CheckCircle, XCircle
} from 'lucide-react'
import { useWarehouse } from '@/context/WarehouseContext'
import { statusColors, statusLabels } from '@/utils'
import type { StockAlert } from '@/types'

type TabType = 'all' | 'low' | 'high' | 'obsolete' | 'expiry'

export default function AlertPage() {
  const { state, dispatch } = useWarehouse()
  const [tab, setTab] = useState<TabType>('all')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filterMap: Record<TabType, string | null> = {
    all: null,
    low: 'low_stock',
    high: 'high_stock',
    obsolete: 'obsolete',
    expiry: 'expiry',
  }

  const filteredAlerts = state.alerts.filter(a => {
    if (filterMap[tab] && a.type !== filterMap[tab]) return false
    if (searchText && !a.materialName.includes(searchText)) return false
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    return true
  })

  const activeCount = state.alerts.filter(a => a.status === 'active').length
  const lowStockCount = state.alerts.filter(a => a.type === 'low_stock' && a.status === 'active').length
  const highStockCount = state.alerts.filter(a => a.type === 'high_stock' && a.status === 'active').length
  const obsoleteCount = state.alerts.filter(a => a.type === 'obsolete' && a.status === 'active').length
  const expiryCount = state.alerts.filter(a => a.type === 'expiry' && a.status === 'active').length

  const handleAlertStatus = (alertId: string, newStatus: 'handled' | 'ignored') => {
    dispatch({
      type: 'UPDATE_ALERT',
      payload: { id: alertId, status: newStatus }
    })
  }

  const tabs: { id: TabType; name: string; count: number; color: string }[] = [
    { id: 'all', name: '全部', count: activeCount, color: 'text-gray-800 border-gray-800' },
    { id: 'low', name: '库存不足', count: lowStockCount, color: 'text-orange-600 border-orange-600' },
    { id: 'high', name: '库存过高', count: highStockCount, color: 'text-purple-600 border-purple-600' },
    { id: 'obsolete', name: '呆滞库存', count: obsoleteCount, color: 'text-gray-600 border-gray-600' },
    { id: 'expiry', name: '临期预警', count: expiryCount, color: 'text-amber-600 border-amber-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">预警总数</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{activeCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">库存不足</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{lowStockCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">库存过高</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{highStockCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">呆滞库存</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{obsoleteCount}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">临期预警</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{expiryCount}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6 border-b border-gray-100 w-full overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`pb-3 px-1 whitespace-nowrap text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id ? t.color : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {t.name}
                <span className={`ml-1 text-xs ${
                  tab === t.id ? t.color : 'text-gray-400'
                }`}>
                  ({t.count})
                </span>
              </button>
            ))}
          </div>
          <button className="p-2 hover:bg-gray-50 rounded-lg flex-shrink-0">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索物料名称..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="active">待处理</option>
              <option value="handled">已处理</option>
              <option value="ignored">已忽略</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredAlerts.map(function(alert: StockAlert) {
            return (
              <div key={alert.id} className={`p-4 rounded-lg border ${
                alert.status === 'active' ? 'border-red-100 bg-red-50' :
                alert.status === 'handled' ? 'border-green-100 bg-green-50' :
                'border-gray-100 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      alert.type === 'low_stock' ? 'text-orange-500' :
                      alert.type === 'high_stock' ? 'text-purple-500' :
                      alert.type === 'obsolete' ? 'text-gray-500' :
                      'text-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">{alert.materialName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[alert.type] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[alert.type] || alert.type}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[alert.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[alert.status] || alert.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.createTime}
                        </span>
                        <span>当前库存: {alert.currentQty}</span>
                        <span>阈值: {alert.threshold}</span>
                      </div>
                    </div>
                  </div>
                  {alert.status === 'active' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAlertStatus(alert.id, 'handled')}
                        className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                        title="标记为已处理"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAlertStatus(alert.id, 'ignored')}
                        className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                        title="忽略"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {filteredAlerts.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无符合条件的预警信息</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
