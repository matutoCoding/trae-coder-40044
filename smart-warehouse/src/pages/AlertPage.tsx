import { useState } from 'react'
import {
  AlertTriangle, Search, Bell,
  TrendingDown, AlertCircle, Package, CalendarDays, RefreshCw, Filter
} from 'lucide-react'
import { mockStockAlerts, mockMaterials, mockPallets } from '@/data/mockData'
import { statusColors, statusLabels } from '@/utils'

type TabType = 'all' | 'low' | 'high' | 'obsolete' | 'expiry'

export default function AlertPage() {
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

  const filteredAlerts = mockStockAlerts.filter(a => {
    if (filterMap[tab] && a.type !== filterMap[tab]) return false
    if (searchText && !a.materialName.includes(searchText)) return false
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    return true
  })

  const activeCount = mockStockAlerts.filter(a => a.status === 'active').length
  const lowStockCount = mockStockAlerts.filter(a => a.type === 'low_stock' && a.status === 'active').length
  const highStockCount = mockStockAlerts.filter(a => a.type === 'high_stock' && a.status === 'active').length
  const obsoleteCount = mockStockAlerts.filter(a => a.type === 'obsolete' && a.status === 'active').length
  const expiryCount = mockStockAlerts.filter(a => a.type === 'expiry' && a.status === 'active').length

  const obsoleteMaterials = mockPallets.filter(p => {
    const days = Math.floor((Date.now() - new Date(p.inboundTime.replace(' ', 'T')).getTime()) / (1000 * 60 * 60 * 24))
    return days > 60 && p.status === 'stored'
  }).slice(0, 8)

  const lowStockMaterials = mockMaterials.slice(0, 6).map(m => ({
    ...m,
    currentQty: Math.floor(m.safetyStock * 0.5),
  }))

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
              <Package className="w-6 h-6 text-purple-600" />
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
              <CalendarDays className="w-6 h-6 text-gray-600" />
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
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card">
        <div className="border-b border-gray-100 px-5">
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              {[
                { id: 'all', label: '全部预警', count: mockStockAlerts.filter(a => a.status === 'active').length },
                { id: 'low', label: '库存不足', count: lowStockCount },
                { id: 'high', label: '库存过高', count: highStockCount },
                { id: 'obsolete', label: '呆滞库存', count: obsoleteCount },
                { id: 'expiry', label: '临期预警', count: expiryCount },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    tab === t.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                <Filter className="w-4 h-4" />
                筛选
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                <RefreshCw className="w-4 h-4" />
                刷新
              </button>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索物料名称..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="active">待处理</option>
              <option value="handled">已处理</option>
              <option value="ignored">已忽略</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 bg-gray-50">
                  <th className="px-4 py-3 font-medium">预警类型</th>
                  <th className="px-4 py-3 font-medium">物料名称</th>
                  <th className="px-4 py-3 font-medium">当前数量</th>
                  <th className="px-4 py-3 font-medium">阈值</th>
                  <th className="px-4 py-3 font-medium">预警信息</th>
                  <th className="px-4 py-3 font-medium">预警时间</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusColors[alert.type]}`}>
                        {alert.type === 'low_stock' && <TrendingDown className="w-3 h-3" />}
                        {alert.type === 'high_stock' && <Package className="w-3 h-3" />}
                        {alert.type === 'obsolete' && <CalendarDays className="w-3 h-3" />}
                        {alert.type === 'expiry' && <AlertCircle className="w-3 h-3" />}
                        {statusLabels[alert.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{alert.materialName}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${
                      alert.type === 'low_stock' ? 'text-red-600' :
                      alert.type === 'high_stock' ? 'text-purple-600' : 'text-gray-800'
                    }`}>
                      {alert.currentQty}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{alert.threshold}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{alert.message}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{alert.createTime}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[alert.status]}`}>
                        {statusLabels[alert.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <>
                            <button className="text-xs px-2 py-1 text-green-600 bg-green-50 rounded hover:bg-green-100">处理</button>
                            <button className="text-xs px-2 py-1 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">忽略</button>
                          </>
                        )}
                        <button className="text-xs px-2 py-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100">详情</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gray-600" />
              呆滞库存预警
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">查看全部</button>
          </div>
          <div className="space-y-3">
            {obsoleteMaterials.map((pallet) => {
              const days = Math.floor((Date.now() - new Date(pallet.inboundTime.replace(' ', 'T')).getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div key={pallet.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        days > 90 ? 'bg-red-100 text-red-600' :
                        days > 60 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {days}d
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{pallet.materialName}</div>
                        <div className="text-xs text-gray-500 font-mono">{pallet.code}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-800">{pallet.quantity}</div>
                      <div className="text-xs text-gray-500">{pallet.unit || '件'}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">入库时间: {pallet.inboundTime}</span>
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-700">催取出库</button>
                      <button className="text-gray-600 hover:text-gray-700">详情</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              安全库存预警
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">触发采购</button>
          </div>
          <div className="space-y-3">
            {lowStockMaterials.map((mat) => (
              <div key={mat.id} className="p-4 border border-orange-200 rounded-xl bg-orange-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-gray-800">{mat.name}</div>
                    <div className="text-xs text-gray-500">{mat.code} · {mat.spec}</div>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div className="p-2 bg-white rounded">
                    <div className="text-gray-500">当前库存</div>
                    <div className="font-bold text-red-600 mt-0.5">{mat.currentQty}</div>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <div className="text-gray-500">安全库存</div>
                    <div className="font-semibold text-gray-800 mt-0.5">{mat.safetyStock}</div>
                  </div>
                  <div className="p-2 bg-white rounded">
                    <div className="text-gray-500">最大库存</div>
                    <div className="font-semibold text-gray-800 mt-0.5">{mat.maxStock}</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>库存水平</span>
                    <span>{Math.round((mat.currentQty / mat.maxStock) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${(mat.currentQty / mat.maxStock) * 100}%` }}
                    ></div>
                    <div
                      className="absolute top-0 h-full w-0.5 bg-amber-500"
                      style={{ left: `${(mat.safetyStock / mat.maxStock) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 text-xs font-medium text-white bg-orange-600 rounded hover:bg-orange-700">
                    创建采购申请
                  </button>
                  <button className="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                    调拨库存
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">预警规则设置</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-800">库存不足预警</span>
              <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1" />
              </div>
            </div>
            <p className="text-xs text-gray-500">当库存低于安全库存时触发预警</p>
            <div className="mt-3 text-xs text-blue-600">安全库存阈值: 动态</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-800">库存过高预警</span>
              <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1" />
              </div>
            </div>
            <p className="text-xs text-gray-500">当库存超过最大库存时触发预警</p>
            <div className="mt-3 text-xs text-blue-600">超阈值: 100%</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-800">呆滞库存预警</span>
              <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1" />
              </div>
            </div>
            <p className="text-xs text-gray-500">物料入库超过指定天数未出库</p>
            <div className="mt-3 text-xs text-blue-600">呆滞天数: 60天</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-800">临期过期预警</span>
              <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1" />
              </div>
            </div>
            <p className="text-xs text-gray-500">物料距离有效期不足指定天数</p>
            <div className="mt-3 text-xs text-blue-600">提前预警: 30天</div>
          </div>
        </div>
      </div>
    </div>
  )
}
