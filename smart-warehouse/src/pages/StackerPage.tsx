import { useState, useMemo } from 'react'
import {
  Bot, Play, Pause, AlertTriangle, CheckCircle2,
  Search, ArrowRightLeft, Package, Truck, FileText, RefreshCw
} from 'lucide-react'
import { useWarehouse } from '@/context/WarehouseContext'
import { mockLocations } from '@/data/mockData'
import { statusColors, statusLabels } from '@/utils'

type TabType = 'overview' | 'tasks' | 'control'

export default function StackerPage() {
  const { state, dispatch } = useWarehouse()
  const [tab, setTab] = useState<TabType>('overview')
  const [selectedStacker, setSelectedStacker] = useState<string | null>(null)

  const stats = useMemo(() => ({
    total: state.stackers.length,
    running: state.stackers.filter(s => s.status === 'running').length,
    pendingTasks: state.stackerTasks.filter(t => t.status === 'pending').length,
    fault: state.stackers.filter(s => s.status === 'fault').length,
  }), [state.stackers, state.stackerTasks])

  const executingTasks = useMemo(
    () => state.stackerTasks.filter(t => t.status === 'executing'),
    [state.stackerTasks]
  )

  const handleExecuteTask = (taskId: string) => {
    const task = state.stackerTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_STACKER_TASK', payload: { id: taskId, status: 'executing', startTime: new Date().toISOString().slice(0, 16).replace('T', ' ') } })
    dispatch({ type: 'UPDATE_STACKER', payload: { id: task.stackerId, status: 'running', currentTask: task.code } })
  }

  const handleCancelTask = (taskId: string) => {
    const task = state.stackerTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_STACKER_TASK', payload: { id: taskId, status: 'failed', endTime: new Date().toISOString().slice(0, 16).replace('T', ' ') } })
    const stillExecuting = state.stackerTasks.some(t => t.stackerId === task.stackerId && t.status === 'executing' && t.id !== taskId)
    if (!stillExecuting) {
      dispatch({ type: 'UPDATE_STACKER', payload: { id: task.stackerId, status: 'idle', currentTask: undefined } })
    }
  }

  const handlePauseTask = (taskId: string) => {
    const task = state.stackerTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_STACKER_TASK', payload: { id: taskId, status: 'pending' } })
    const stillExecuting = state.stackerTasks.some(t => t.stackerId === task.stackerId && t.status === 'executing' && t.id !== taskId)
    if (!stillExecuting) {
      dispatch({ type: 'UPDATE_STACKER', payload: { id: task.stackerId, status: 'idle' } })
    }
  }

  const handleCompleteTask = (taskId: string) => {
    const task = state.stackerTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_STACKER_TASK', payload: { id: taskId, status: 'completed', endTime: new Date().toISOString().slice(0, 16).replace('T', ' ') } })
    const stillExecuting = state.stackerTasks.some(t => t.stackerId === task.stackerId && t.status === 'executing' && t.id !== taskId)
    const stacker = state.stackers.find(s => s.id === task.stackerId)
    dispatch({
      type: 'UPDATE_STACKER',
      payload: {
        id: task.stackerId,
        status: stillExecuting ? 'running' : 'idle',
        currentTask: stillExecuting ? stacker?.currentTask : undefined,
        completedTasks: (stacker?.completedTasks || 0) + 1
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">堆垛机总数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">运行中</p>
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
              <FileText className="w-6 h-6 text-amber-600" />
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
              { id: 'overview', label: '设备总览', icon: Bot },
              { id: 'tasks', label: '任务调度', icon: FileText },
              { id: 'control', label: '手动控制', icon: ArrowRightLeft },
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
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h4 className="font-semibold text-gray-800 mb-4">立体仓库布局</h4>
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="space-y-2">
                    {Array.from({ length: 8 }, (_, layer) => (
                      <div key={layer} className="flex items-center gap-2">
                        <span className="w-6 text-xs text-gray-400">L{8 - layer}</span>
                        <div className="flex-1 flex gap-1">
                          {Array.from({ length: 5 }, (_, aisle) => (
                            <div key={aisle} className="flex-1 flex gap-0.5">
                              {Array.from({ length: 20 }, (_, col) => {
                                const targetCode = `A${aisle + 1}-C${String(col + 1).padStart(2, '0')}-L${8 - layer}`
                                const found = state.locations.find(l => l.code === targetCode)
                                let color = '#374151'
                                if (found?.status === 'occupied') color = 'rgba(59, 130, 246, 0.85)'
                                else if (found?.status === 'reserved') color = 'rgba(245, 158, 11, 0.7)'
                                else if (found?.status === 'maintenance') color = 'rgba(239, 68, 68, 0.7)'
                                return (
                                  <div
                                    key={col}
                                    className="flex-1 h-5 rounded-sm"
                                    style={{ backgroundColor: color }}
                                    title={targetCode}
                                  />
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-700 rounded-sm"></div>
                        <span className="text-xs text-gray-400">空货位</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500/50 rounded-sm"></div>
                        <span className="text-xs text-gray-400">半载</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                        <span className="text-xs text-gray-400">满载</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-500/50 rounded-sm"></div>
                        <span className="text-xs text-gray-400">作业中</span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {Array.from({ length: 5 }, (_, i) => {
                        const stacker = state.stackers[i]
                        return (
                          <div key={i} className="text-center">
                            <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center ${
                              stacker?.status === 'running' ? 'bg-green-500' :
                              stacker?.status === 'idle' ? 'bg-gray-500' :
                              stacker?.status === 'fault' ? 'bg-red-500' : 'bg-gray-500'
                            }`}>
                              <Bot className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs text-gray-400 mt-1">{stacker?.code || `STK${String(i + 1).padStart(2, '0')}`}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-800 mt-6 mb-4">堆垛机列表</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.stackers.map((stacker) => (
                    <div
                      key={stacker.id}
                      onClick={() => setSelectedStacker(stacker.id)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedStacker === stacker.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-card'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            stacker.status === 'running' ? 'bg-green-100' :
                            stacker.status === 'idle' ? 'bg-gray-100' : 'bg-red-100'
                          }`}>
                            <Bot className={`w-5 h-5 ${
                              stacker.status === 'running' ? 'text-green-600' :
                              stacker.status === 'idle' ? 'text-gray-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{stacker.code}</div>
                            <div className="text-xs text-gray-500">巷道 {stacker.aisle}</div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[stacker.status]}`}>
                          {statusLabels[stacker.status]}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">作业效率</span>
                          <span className="font-medium text-gray-800">{stacker.efficiency}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                            style={{ width: `${stacker.efficiency}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <div>
                            <span className="text-gray-500">已完成任务</span>
                            <span className="ml-1 font-medium text-gray-800">{stacker.completedTasks}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">总任务</span>
                            <span className="ml-1 font-medium text-gray-800">{stacker.totalTasks}</span>
                          </div>
                        </div>
                        {stacker.currentTask && (
                          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-blue-600">
                            当前任务: {stacker.currentTask}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-4">执行中任务（{executingTasks.length}）</h4>
                <div className="space-y-3">
                  {executingTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">{task.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[task.type]}`}>
                          {statusLabels[task.type]}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        托盘 <span className="font-mono text-gray-700">{task.palletCode}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{task.fromLocation || '站台'}</span>
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>{task.toLocation || '站台'}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-gray-500">执行设备</span>
                          <span className="ml-1 text-blue-600 font-medium">
                            {state.stackers.find(s => s.id === task.stackerId)?.code}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handlePauseTask(task.id)} className="text-xs px-2 py-0.5 text-amber-600 bg-amber-50 rounded hover:bg-amber-100">暂停</button>
                          <button onClick={() => handleCompleteTask(task.id)} className="text-xs px-2 py-0.5 text-green-600 bg-green-50 rounded hover:bg-green-100">完成</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {executingTasks.length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-sm border border-gray-200 rounded-xl">
                      暂无执行中任务
                    </div>
                  )}
                </div>

                <h4 className="font-semibold text-gray-800 mt-6 mb-4">设备运行监控</h4>
                <div className="space-y-3">
                  {state.stackers.slice(0, 3).map((stacker) => (
                    <div key={stacker.id} className="p-3 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">{stacker.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[stacker.status]}`}>
                          {statusLabels[stacker.status]}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-gray-500">温度</div>
                          <div className="font-medium text-gray-800 mt-0.5">{35 + Math.floor(Math.random() * 10)}°C</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-gray-500">电压</div>
                          <div className="font-medium text-gray-800 mt-0.5">{380}V</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-gray-500">转速</div>
                          <div className="font-medium text-gray-800 mt-0.5">{stacker.status === 'running' ? 1200 + Math.floor(Math.random() * 300) : 0}rpm</div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                    placeholder="搜索任务号、托盘号..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>全部类型</option>
                  <option>入库</option>
                  <option>出库</option>
                  <option>移库</option>
                </select>
                <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>全部状态</option>
                  <option>待执行</option>
                  <option>执行中</option>
                  <option>已完成</option>
                  <option>失败</option>
                </select>
                <button className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Package className="w-4 h-4" />
                  创建入库任务
                </button>
                <button className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Truck className="w-4 h-4" />
                  创建出库任务
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
                      <th className="px-4 py-3 font-medium">类型</th>
                      <th className="px-4 py-3 font-medium">执行设备</th>
                      <th className="px-4 py-3 font-medium">起始位置</th>
                      <th className="px-4 py-3 font-medium">目标位置</th>
                      <th className="px-4 py-3 font-medium">托盘号</th>
                      <th className="px-4 py-3 font-medium">创建时间</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.stackerTasks.map((task) => (
                      <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{task.code}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.type]}`}>
                            {statusLabels[task.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {state.stackers.find(s => s.id === task.stackerId)?.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{task.fromLocation || '入库站台'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{task.toLocation || '出库站台'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{task.palletCode}</td>
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
                                <button onClick={() => handleCancelTask(task.id)} className="text-xs px-2 py-1 text-red-600 bg-red-50 rounded hover:bg-red-100">取消</button>
                              </>
                            )}
                            {task.status === 'executing' && (
                              <>
                                <button onClick={() => handlePauseTask(task.id)} className="text-xs px-2 py-1 text-amber-600 bg-amber-50 rounded hover:bg-amber-100">暂停</button>
                                <button onClick={() => handleCompleteTask(task.id)} className="text-xs px-2 py-1 text-green-600 bg-green-50 rounded hover:bg-green-100">完成</button>
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

          {tab === 'control' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">堆垛机手动控制</h3>
                <p className="text-sm text-gray-500 mt-1">请谨慎操作，手动控制仅在特殊情况下使用</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-gray-200 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-4">选择设备</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {state.stackers.map((stacker) => (
                      <button
                        key={stacker.id}
                        onClick={() => setSelectedStacker(stacker.id)}
                        disabled={stacker.status === 'fault'}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedStacker === stacker.id
                            ? 'border-blue-500 bg-blue-50'
                            : stacker.status === 'fault'
                            ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Bot className={`w-6 h-6 mx-auto ${
                          stacker.status === 'running' ? 'text-green-600' :
                          stacker.status === 'idle' ? 'text-gray-600' : 'text-red-600'
                        }`} />
                        <div className="text-xs font-medium text-gray-800 mt-1">{stacker.code}</div>
                        <div className={`text-xs mt-1 ${
                          stacker.status === 'running' ? 'text-green-600' :
                          stacker.status === 'idle' ? 'text-gray-500' : 'text-red-600'
                        }`}>
                          {statusLabels[stacker.status]}
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedStacker && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">当前巷道</span>
                          <p className="font-medium text-gray-800 mt-1">
                            {state.stackers.find(s => s.id === selectedStacker)?.code}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">当前位置</span>
                          <p className="font-medium text-gray-800 mt-1 font-mono">
                            {mockLocations[Math.floor(Math.random() * mockLocations.length)].code}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 border border-gray-200 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-4">运动控制</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">目标货位</label>
                      <input
                        type="text"
                        placeholder="例如：A1-C03-L4"
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">巷道</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                          {Array.from({ length: 5 }, (_, i) => (
                            <option key={i} value={i + 1}>巷道 {i + 1}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">列</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                          {Array.from({ length: 20 }, (_, i) => (
                            <option key={i} value={i + 1}>列 {i + 1}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">层</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                          {Array.from({ length: 8 }, (_, i) => (
                            <option key={i} value={i + 1}>层 {i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col items-center py-4">
                      <button className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <div className="flex items-center gap-2">
                        <button className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button className="w-14 h-14 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center">
                          <Pause className="w-6 h-6 text-red-600" />
                        </button>
                        <button className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      <button className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center mt-2">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-500 mt-2">方向控制（点动）</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button className="py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                        <Play className="w-4 h-4" />
                        开始执行
                      </button>
                      <button className="py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        回原位
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <h5 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  安全提示
                </h5>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• 手动操作前请确认巷道内无人员和障碍物</li>
                  <li>• 设备运行中请勿离开，保持观察设备状态</li>
                  <li>• 遇到异常情况请立即按下急停按钮</li>
                  <li>• 操作完成后请将设备恢复至自动模式</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
