import { useState, useMemo } from 'react'
import {
  Route, Search, Plus, Play, Battery, BatteryCharging,
  MapPin, Clock, AlertTriangle, CheckCircle2, RefreshCw, Navigation, Pause
} from 'lucide-react'
import { useWarehouse } from '@/context/WarehouseContext'
import { statusColors, statusLabels } from '@/utils'

type TabType = 'monitor' | 'tasks' | 'map'

export default function AGVPage() {
  const { state, dispatch } = useWarehouse()
  const [tab, setTab] = useState<TabType>('monitor')
  const [selectedAGV, setSelectedAGV] = useState<string | null>(null)

  const stats = useMemo(() => ({
    total: state.agvs.length,
    running: state.agvs.filter(a => a.status === 'moving' || a.status === 'loading').length,
    charging: state.agvs.filter(a => a.status === 'charging').length,
    fault: state.agvs.filter(a => a.status === 'fault').length,
    pendingTasks: state.agvTasks.filter(t => t.status === 'pending').length,
    executingTasks: state.agvTasks.filter(t => t.status === 'executing').length,
  }), [state.agvs, state.agvTasks])

  const handleExecuteTask = (taskId: string) => {
    const task = state.agvTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_AGV_TASK', payload: { id: taskId, status: 'executing' } })
    dispatch({ type: 'UPDATE_AGV', payload: { id: task.agvId, status: 'moving', currentTask: task.code } })
  }

  const handleDispatchTask = (taskId: string) => {
    const task = state.agvTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_AGV_TASK', payload: { id: taskId, status: 'executing' } })
    dispatch({ type: 'UPDATE_AGV', payload: { id: task.agvId, status: 'loading', currentTask: task.code } })
  }

  const handleCancelTask = (taskId: string) => {
    const task = state.agvTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_AGV_TASK', payload: { id: taskId, status: 'failed' } })
    const stillExecuting = state.agvTasks.some(t => t.agvId === task.agvId && t.status === 'executing' && t.id !== taskId)
    if (!stillExecuting) {
      const agv = state.agvs.find(a => a.id === task.agvId)
      dispatch({
        type: 'UPDATE_AGV',
        payload: {
          id: task.agvId,
          status: (agv?.battery || 100) < 20 ? 'charging' : 'idle',
          currentTask: undefined
        }
      })
    }
  }

  const handlePauseTask = (taskId: string) => {
    const task = state.agvTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_AGV_TASK', payload: { id: taskId, status: 'pending' } })
    const stillExecuting = state.agvTasks.some(t => t.agvId === task.agvId && t.status === 'executing' && t.id !== taskId)
    if (!stillExecuting) {
      dispatch({ type: 'UPDATE_AGV', payload: { id: task.agvId, status: 'idle' } })
    }
  }

  const handleCompleteTask = (taskId: string) => {
    const task = state.agvTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_AGV_TASK', payload: { id: taskId, status: 'completed' } })
    const stillExecuting = state.agvTasks.some(t => t.agvId === task.agvId && t.status === 'executing' && t.id !== taskId)
    const agv = state.agvs.find(a => a.id === task.agvId)
    dispatch({
      type: 'UPDATE_AGV',
      payload: {
        id: task.agvId,
        status: stillExecuting ? 'moving' : ((agv?.battery || 100) < 20 ? 'charging' : 'idle'),
        currentTask: stillExecuting ? agv?.currentTask : undefined,
        battery: Math.max(5, (agv?.battery || 100) - 5)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">AGV总数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">作业中</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.running}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Play className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待执行任务</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingTasks}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">故障设备</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.fault}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card">
        <div className="border-b border-gray-100 px-5">
          <div className="flex gap-1">
            {[
              { id: 'monitor', label: '设备监控', icon: Route },
              { id: 'tasks', label: '搬运任务', icon: Clock },
              { id: 'map', label: '路径地图', icon: MapPin },
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
          {tab === 'monitor' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {state.agvs.map((agv) => (
                  <div
                    key={agv.id}
                    onClick={() => setSelectedAGV(agv.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedAGV === agv.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-card'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          agv.status === 'moving' || agv.status === 'loading' ? 'bg-green-100' :
                          agv.status === 'charging' ? 'bg-amber-100' :
                          agv.status === 'fault' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          <Navigation className={`w-5 h-5 ${
                            agv.status === 'moving' || agv.status === 'loading' ? 'text-green-600' :
                            agv.status === 'charging' ? 'text-amber-600' :
                            agv.status === 'fault' ? 'text-red-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{agv.code}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            ({agv.position.x}, {agv.position.y})
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[agv.status]}`}>
                        {statusLabels[agv.status]}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          {agv.status === 'charging' ? <BatteryCharging className="w-4 h-4" /> : <Battery className="w-4 h-4" />}
                          电量
                        </div>
                        <span className={`font-medium ${agv.battery < 20 ? 'text-red-600' : agv.battery < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                          {agv.battery}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${agv.battery < 20 ? 'bg-red-500' : agv.battery < 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${agv.battery}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-2 text-gray-500">
                        <span>速度: {agv.status === 'moving' ? `${agv.speed}m/s` : '0m/s'}</span>
                        {agv.currentTask && <span className="text-blue-600">任务: {agv.currentTask}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                <h5 className="text-sm font-medium text-gray-700 mb-3">运行参数概览</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-xs text-gray-500">平均速度</div>
                    <div className="text-lg font-semibold text-gray-800 mt-1">1.2 m/s</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-xs text-gray-500">充电中</div>
                    <div className="text-lg font-semibold text-amber-600 mt-1">{stats.charging} 台</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-xs text-gray-500">执行中任务</div>
                    <div className="text-lg font-semibold text-blue-600 mt-1">{stats.executingTasks} 个</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-xs text-gray-500">今日完成</div>
                    <div className="text-lg font-semibold text-green-600 mt-1">{state.agvTasks.filter(t => t.status === 'completed').length} 个</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'tasks' && (
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索任务号、起始点、目标点..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>全部状态</option>
                  <option>待执行</option>
                  <option>执行中</option>
                  <option>已完成</option>
                  <option>失败</option>
                </select>
                <button className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  新建搬运任务
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
                      <th className="px-4 py-3 font-medium">任务编号</th>
                      <th className="px-4 py-3 font-medium">执行设备</th>
                      <th className="px-4 py-3 font-medium">起始位置</th>
                      <th className="px-4 py-3 font-medium">目标位置</th>
                      <th className="px-4 py-3 font-medium">托盘号</th>
                      <th className="px-4 py-3 font-medium">预计耗时</th>
                      <th className="px-4 py-3 font-medium">创建时间</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.agvTasks.map((task) => (
                      <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{task.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {state.agvs.find(a => a.id === task.agvId)?.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{task.fromPoint}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{task.toPoint}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{task.palletCode || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.estimatedTime} 分钟</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{task.createTime}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]}`}>
                            {statusLabels[task.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {task.status === 'pending' && (
                              <>
                                <button onClick={() => handleExecuteTask(task.id)} className="text-xs px-2 py-1 text-green-600 bg-green-50 rounded hover:bg-green-100">执行</button>
                                <button onClick={() => handleDispatchTask(task.id)} className="text-xs px-2 py-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100">调度</button>
                                <button onClick={() => handleCancelTask(task.id)} className="text-xs px-2 py-1 text-red-600 bg-red-50 rounded hover:bg-red-100">取消</button>
                              </>
                            )}
                            {task.status === 'executing' && (
                              <>
                                <button onClick={() => handlePauseTask(task.id)} className="text-xs px-2 py-1 text-amber-600 bg-amber-50 rounded hover:bg-amber-100 flex items-center gap-1">
                                  <Pause className="w-3 h-3" />暂停
                                </button>
                                <button onClick={() => handleCompleteTask(task.id)} className="text-xs px-2 py-1 text-green-600 bg-green-50 rounded hover:bg-green-100 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />完成
                                </button>
                              </>
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

          {tab === 'map' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">AGV 路径地图</h4>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">AGV</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-600">入库点</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-gray-600">出库点</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-gray-600">充电桩</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-auto">
                <svg viewBox="0 0 800 500" className="w-full h-auto" style={{ minHeight: 400 }}>
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="800" height="500" fill="url(#grid)" />

                  <rect x="50" y="50" width="180" height="60" rx="8" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
                  <text x="140" y="85" textAnchor="middle" fill="#166534" fontSize="14" fontWeight="600">入库站台 A</text>

                  <rect x="570" y="50" width="180" height="60" rx="8" fill="#ffedd5" stroke="#f97316" strokeWidth="2" />
                  <text x="660" y="85" textAnchor="middle" fill="#9a3412" fontSize="14" fontWeight="600">出库站台 B</text>

                  <rect x="50" y="390" width="140" height="60" rx="8" fill="#f3e8ff" stroke="#a855f7" strokeWidth="2" />
                  <text x="120" y="425" textAnchor="middle" fill="#6b21a8" fontSize="14" fontWeight="600">充电区 (×4)</text>

                  <rect x="280" y="160" width="240" height="180" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3" />
                  <text x="400" y="255" textAnchor="middle" fill="#1e40af" fontSize="16" fontWeight="600">立体货架区</text>
                  <text x="400" y="275" textAnchor="middle" fill="#3b82f6" fontSize="12">×5巷道 · ×8层 · ×20列</text>

                  <line x1="100" y1="110" x2="100" y2="250" stroke="#9ca3af" strokeWidth="3" strokeDasharray="8 4" />
                  <line x1="700" y1="110" x2="700" y2="250" stroke="#9ca3af" strokeWidth="3" strokeDasharray="8 4" />
                  <line x1="100" y1="250" x2="700" y2="250" stroke="#9ca3af" strokeWidth="3" strokeDasharray="8 4" />
                  <line x1="200" y1="340" x2="400" y2="340" stroke="#9ca3af" strokeWidth="3" strokeDasharray="8 4" />
                  <line x1="400" y1="340" x2="400" y2="390" stroke="#9ca3af" strokeWidth="3" strokeDasharray="8 4" />

                  {state.agvs.map((agv, idx) => {
                    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#6366f1', '#ec4899']
                    const px = 80 + agv.position.x * 75
                    const py = 130 + agv.position.y * 55
                    return (
                      <g key={agv.id}>
                        <circle cx={px} cy={py} r="20" fill={colors[idx % colors.length]} fillOpacity="0.2" />
                        <circle cx={px} cy={py} r="14" fill={colors[idx % colors.length]} />
                        <text x={px} y={py + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{idx + 1}</text>
                        <text x={px} y={py + 38} textAnchor="middle" fill="#374151" fontSize="11" fontWeight="600">{agv.code}</text>
                        <text x={px} y={py + 50} textAnchor="middle" fill="#6b7280" fontSize="10">
                          {agv.battery}% · {statusLabels[agv.status]}
                        </text>
                      </g>
                    )
                  })}

                  {state.agvTasks.filter(t => t.status === 'executing').slice(0, 3).map((task, idx) => {
                    const fromX = 140
                    const fromY = 80
                    const toX = 660
                    const toY = 80
                    return (
                      <g key={task.id}>
                        <path
                          d={`M ${fromX + idx * 30} ${fromY + idx * 20} Q 400 ${180 + idx * 40} ${toX - idx * 30} ${toY + idx * 20}`}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeDasharray="5 4"
                          opacity="0.7"
                        />
                        <circle cx={fromX + idx * 30} cy={fromY + idx * 20} r="4" fill="#22c55e" />
                        <circle cx={toX - idx * 30} cy={toY + idx * 20} r="4" fill="#f97316" />
                      </g>
                    )
                  })}
                </svg>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  调度策略说明
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-700">
                  <div className="p-3 bg-white/60 rounded-lg">
                    <div className="font-medium mb-1">最近邻优先</div>
                    <div className="text-blue-600/80">自动分配距离任务点最近的空闲AGV</div>
                  </div>
                  <div className="p-3 bg-white/60 rounded-lg">
                    <div className="font-medium mb-1">任务队列</div>
                    <div className="text-blue-600/80">按优先级和到达时间排序执行</div>
                  </div>
                  <div className="p-3 bg-white/60 rounded-lg">
                    <div className="font-medium mb-1">动态避障</div>
                    <div className="text-blue-600/80">实时路径规划避免设备冲突</div>
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
