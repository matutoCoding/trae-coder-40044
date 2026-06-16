import { useState } from 'react'
import {
  ClipboardList, Search, Plus, CheckCircle2, Clock, AlertTriangle,
  FileText, MapPin, Calendar, BarChart3, AlertCircle, RefreshCw
} from 'lucide-react'
import { mockStockChecks, mockLocations, mockMaterials } from '@/data/mockData'
import { statusColors, statusLabels } from '@/utils'

type TabType = 'tasks' | 'checking' | 'monitor'

export default function StockCheckPage() {
  const [tab, setTab] = useState<TabType>('tasks')

  const processingChecks = mockStockChecks.filter(c => c.status === 'processing').length
  const completedChecks = mockStockChecks.filter(c => c.status === 'completed').length
  const totalDiffs = mockStockChecks.reduce((sum, c) => sum + c.differences, 0)

  const totalLocations = mockLocations.length
  const occupiedLocations = mockLocations.filter(l => l.status === 'occupied').length
  const emptyLocations = mockLocations.filter(l => l.status === 'empty').length
  const maintenanceLocations = mockLocations.filter(l => l.status === 'maintenance').length

  const occupancyByAisle = Array.from({ length: 5 }, (_, aisle) => {
    const aisleLocs = mockLocations.filter(l => l.aisle === aisle + 1)
    const occupied = aisleLocs.filter(l => l.status === 'occupied').length
    return {
      aisle: aisle + 1,
      total: aisleLocs.length,
      occupied,
      rate: Math.round((occupied / aisleLocs.length) * 100)
    }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">盘点任务</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{mockStockChecks.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">进行中</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{processingChecks}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{completedChecks}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">差异数量</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{totalDiffs}</p>
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
              { id: 'tasks', label: '盘点任务', icon: FileText },
              { id: 'checking', label: '盘点作业', icon: ClipboardList },
              { id: 'monitor', label: '货位监控', icon: MapPin },
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
          {tab === 'tasks' && (
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索盘点单号..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>全部类型</option>
                  <option>定期盘点</option>
                  <option>随机盘点</option>
                  <option>专项盘点</option>
                </select>
                <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>全部状态</option>
                  <option>待处理</option>
                  <option>进行中</option>
                  <option>已完成</option>
                </select>
                <button className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  新建盘点
                </button>
                <button className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Calendar className="w-4 h-4" />
                  周期设置
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
                      <th className="px-4 py-3 font-medium">盘点单号</th>
                      <th className="px-4 py-3 font-medium">类型</th>
                      <th className="px-4 py-3 font-medium">货位数</th>
                      <th className="px-4 py-3 font-medium">已盘</th>
                      <th className="px-4 py-3 font-medium">差异</th>
                      <th className="px-4 py-3 font-medium">操作员</th>
                      <th className="px-4 py-3 font-medium">创建时间</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockStockChecks.map((check) => (
                      <tr
                        key={check.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{check.code}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[check.type]}`}>
                            {statusLabels[check.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{check.locationCount}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                          {check.checkedCount} / {check.locationCount}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${check.differences > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {check.differences > 0 ? check.differences : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{check.operator}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{check.createTime}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[check.status]}`}>
                            {statusLabels[check.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {check.status === 'pending' && (
                              <button className="text-xs px-2 py-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100">开始</button>
                            )}
                            {check.status === 'processing' && (
                              <button className="text-xs px-2 py-1 text-purple-600 bg-purple-50 rounded hover:bg-purple-100">继续盘点</button>
                            )}
                            {check.status === 'completed' && (
                              <button className="text-xs px-2 py-1 text-green-600 bg-green-50 rounded hover:bg-green-100">查看报告</button>
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

          {tab === 'checking' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h4 className="font-semibold text-gray-800 mb-4">盘点进行中</h4>
                <div className="p-5 border border-gray-200 rounded-xl mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="font-semibold text-gray-800">CHK2024005 - 定期盘点</h5>
                      <p className="text-sm text-gray-500 mt-1">操作员：王五 · 开始时间：2024-01-15 09:30</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700">进行中</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">盘点进度</span>
                      <span className="font-medium text-gray-800">18 / 35 货位</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: '51%' }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">15</div>
                      <div className="text-xs text-gray-500 mt-1">正常</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">2</div>
                      <div className="text-xs text-gray-500 mt-1">差异</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-600">1</div>
                      <div className="text-xs text-gray-500 mt-1">待确认</div>
                    </div>
                  </div>
                </div>

                <h5 className="font-medium text-gray-700 mb-3">待盘点货位列表</h5>
                <div className="space-y-2">
                  {mockLocations.filter(l => l.status !== 'maintenance').slice(0, 10).map((loc, idx) => (
                    <div key={loc.id} className={`p-4 border rounded-xl ${
                      idx < 3 ? 'border-green-300 bg-green-50/50' :
                      idx === 3 ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {idx < 3 ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : idx === 3 ? (
                            <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-dashed animate-pulse" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          )}
                          <div>
                            <div className="font-mono font-medium text-gray-800">{loc.code}</div>
                            <div className="text-xs text-gray-500">
                              A{loc.aisle}巷 · C{loc.column}列 · L{loc.layer}层 · {loc.category || '通用'}
                            </div>
                          </div>
                        </div>
                        {loc.status === 'occupied' ? (
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-800">{mockMaterials[idx % mockMaterials.length].name}</div>
                            <div className="text-xs text-gray-500">系统数量: {loc.currentLoad}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">空货位</span>
                        )}
                      </div>
                      {idx === 3 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="实际数量"
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">确认</button>
                            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">跳过</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-4">差异记录</h4>
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">数量差异</span>
                    </div>
                    <div className="font-mono text-sm text-gray-800">A2-C04-L3</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white/70 rounded">
                        <span className="text-gray-500">系统数量</span>
                        <p className="font-bold text-gray-800 mt-0.5">150</p>
                      </div>
                      <div className="p-2 bg-white/70 rounded">
                        <span className="text-gray-500">实际数量</span>
                        <p className="font-bold text-red-600 mt-0.5">145</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-red-600">差异: -5</div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">物料不符</span>
                    </div>
                    <div className="font-mono text-sm text-gray-800">A3-C07-L2</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white/70 rounded">
                        <span className="text-gray-500">系统物料</span>
                        <p className="font-medium text-gray-800 mt-0.5">电子元器件A</p>
                      </div>
                      <div className="p-2 bg-white/70 rounded">
                        <span className="text-gray-500">实际物料</span>
                        <p className="font-medium text-amber-700 mt-0.5">电子元器件B</p>
                      </div>
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-800 mt-6 mb-4">盘点周期设置</h4>
                <div className="p-4 border border-gray-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">月度全面盘点</span>
                    <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">周度抽样盘点</span>
                    <div className="w-10 h-6 bg-blue-600 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">动碰盘点</span>
                    <div className="w-10 h-6 bg-gray-300 rounded-full relative">
                      <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'monitor' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-500">总货位数</div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">{totalLocations}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="text-sm text-gray-500">已占用</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">{occupiedLocations}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-sm text-gray-500">空闲</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">{emptyLocations}</div>
                </div>
                <div className="p-4 bg-gray-100 rounded-xl">
                  <div className="text-sm text-gray-500">维护中</div>
                  <div className="text-2xl font-bold text-gray-600 mt-1">{maintenanceLocations}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">各巷道占用率</h4>
                  <div className="space-y-3">
                    {occupancyByAisle.map((data) => (
                      <div key={data.aisle} className="p-4 border border-gray-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-800">巷道 A{data.aisle}</span>
                          <span className="text-sm font-bold text-gray-800">{data.rate}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              data.rate > 90 ? 'bg-red-500' : data.rate > 70 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${data.rate}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>已占用 {data.occupied}</span>
                          <span>总计 {data.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">货位占用热力图（A1巷道）</h4>
                  <div className="bg-gray-900 rounded-xl p-4">
                    <div className="space-y-1">
                      {Array.from({ length: 8 }, (_, layer) => (
                        <div key={layer} className="flex items-center gap-2">
                          <span className="w-6 text-xs text-gray-400">L{8 - layer}</span>
                          <div className="flex-1 grid grid-cols-20 gap-0.5">
                            {Array.from({ length: 20 }, (_, col) => {
                              const loc = mockLocations.find(l => l.aisle === 1 && l.column === col + 1 && l.layer === 8 - layer)
                              let color = '#374151'
                              if (loc?.status === 'occupied') color = 'rgba(59, 130, 246, 0.8)'
                              else if (loc?.status === 'reserved') color = 'rgba(251, 191, 36, 0.7)'
                              else if (loc?.status === 'maintenance') color = 'rgba(239, 68, 68, 0.7)'
                              return (
                                <div
                                  key={col}
                                  className="h-6 rounded-sm"
                                  style={{ backgroundColor: color }}
                                  title={loc?.code}
                                />
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gray-700 rounded-sm"></div>
                          <span className="text-xs text-gray-400">空</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                          <span className="text-xs text-gray-400">占用</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                          <span className="text-xs text-gray-400">预留</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                          <span className="text-xs text-gray-400">维护</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">整体利用率: {Math.round((occupiedLocations / totalLocations) * 100)}%</span>
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
