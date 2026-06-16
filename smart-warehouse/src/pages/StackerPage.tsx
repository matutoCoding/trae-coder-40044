import { useState, useMemo } from 'react'
import {
  Bot, Play, Pause, AlertTriangle, CheckCircle2,
  Search, ArrowRightLeft, Package, Truck, FileText, RefreshCw,
  ListTodo, X, Clock, User
} from 'lucide-react'
import { useWarehouse, generateId, getNowTime } from '@/context/WarehouseContext'
import { mockLocations } from '@/data/mockData'
import { statusColors, statusLabels } from '@/utils'
import type { StackerTask, TaskLog } from '@/types'

type TabType = 'overview' | 'tasks' | 'taskLogs' | 'control'

export default function StackerPage() {
  const { state, dispatch } = useWarehouse()
  const [tab, setTab] = useState<TabType>('overview')
  const [selectedStacker, setSelectedStacker] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<StackerTask | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const stats = useMemo(() => ({
    total: state.stackers.length,
    running: state.stackers.filter(s => s.status === 'running').length,
    pendingTasks: state.stackerTasks.filter(t => t.status === 'pending').length,
    executingTasks: state.stackerTasks.filter(t => t.status === 'executing').length,
    completedTasks: state.stackerTasks.filter(t => t.status === 'completed').length,
    fault: state.stackers.filter(s => s.status === 'fault').length,
  }), [state.stackers, state.stackerTasks])

  const executingTasks = useMemo(
    () => state.stackerTasks.filter(t => t.status === 'executing'),
    [state.stackerTasks]
  )

  const stackerTaskLogs = useMemo(
    () => state.taskLogs
      .filter(log => log.taskType === 'stacker')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [state.taskLogs]
  )

  const addTaskLog = (
    taskId: string,
    action: TaskLog['action'],
    task: StackerTask,
    result: string
  ) => {
    const stacker = state.stackers.find(s => s.id === task.stackerId)
    dispatch({
      type: 'ADD_TASK_LOG',
      payload: {
        id: generateId('LOG'),
        taskId,
        taskType: 'stacker',
        action,
        operator: '系统操作员',
        timestamp: getNowTime(),
        deviceId: task.stackerId,
        deviceCode: stacker?.code || '',
        palletCode: task.palletCode,
        fromLocation: task.fromLocation,
        toLocation: task.toLocation,
        result,
      }
    })
  }

  const handleExecuteTask = (taskId: string) => {
    const task = state.stackerTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_STACKER_TASK', payload: { id: taskId, status: 'executing', startTime: getNowTime() } })
    dispatch({ type: 'UPDATE_STACKER', payload: { id: task.stackerId, status: 'running', currentTask: task.code } })
    addTaskLog(taskId, 'execute', task, '任务已开始执行')
  }

  const handleDispatchTask = (taskId: string) => {
    const task = state.stackerTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_STACKER_TASK', payload: { id: taskId, status: 'executing', startTime: getNowTime() } })
    dispatch({ type: 'UPDATE_STACKER', payload: { id: task.stackerId, status: 'running', currentTask: task.code } })
    addTaskLog(taskId, 'dispatch', task, '任务已调度执行')
  }

  const handleCancelTask = (taskId: string) => {
    const task = state.stackerTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_STACKER_TASK', payload: { id: taskId, status: 'failed', endTime: getNowTime() } })
    const stillExecuting = state.stackerTasks.some(t => t.stackerId === task.stackerId && t.status === 'executing' && t.id !== taskId)
    if (!stillExecuting) {
      dispatch({ type: 'UPDATE_STACKER', payload: { id: task.stackerId, status: 'idle', currentTask: undefined } })
    }
    addTaskLog(taskId, 'cancel', task, '任务已取消')
  }

  const handlePauseTask = (taskId: string) => {
    const task = state.stackerTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_STACKER_TASK', payload: { id: taskId, status: 'pending' } })
    const stillExecuting = state.stackerTasks.some(t => t.stackerId === task.stackerId && t.status === 'executing' && t.id !== taskId)
    if (!stillExecuting) {
      dispatch({ type: 'UPDATE_STACKER', payload: { id: task.stackerId, status: 'idle' } })
    }
    addTaskLog(taskId, 'pause', task, '任务已暂停')
  }

  const handleCompleteTask = (taskId: string) => {
    const task = state.stackerTasks.find(t => t.id === taskId)
    if (!task) return
    dispatch({ type: 'UPDATE_STACKER_TASK', payload: { id: taskId, status: 'completed', endTime: getNowTime() } })
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
    addTaskLog(taskId, 'complete', task, '任务已完成')
  }

  const handleViewDetail = (task: StackerTask) => {
    setSelectedTask(task)
    setShowDetailModal(true)
  }

  const getTaskLogs = (taskId: string) => {
    return state.taskLogs
      .filter(log => log.taskId === taskId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <p className="text-sm text-gray-500">待执行</p>
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
              <p className="text-sm text-gray-500">执行中</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.executingTasks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedTasks}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
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
              { id: 'taskLogs', label: '任务日志', icon: ListTodo },
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
                            <button onClick={() => handleViewDetail(task)} className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded">详情</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'taskLogs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">任务日志</h4>
                <div className="text-sm text-gray-500">共 {stackerTaskLogs.length} 条记录</div>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-4">
                  {stackerTaskLogs.map((log) => (
                    <div key={log.id} className="relative pl-10">
                      <div className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 border-white ${
                        log.action === 'execute' ? 'bg-green-500' :
                        log.action === 'dispatch' ? 'bg-blue-500' :
                        log.action === 'pause' ? 'bg-amber-500' :
                        log.action === 'cancel' ? 'bg-red-500' :
                        'bg-green-500'
                      }`}></div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[log.action]}`}>
                              {statusLabels[log.action]}
                            </span>
                            <span className="text-sm font-medium text-gray-800">{log.deviceCode}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {log.timestamp}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">操作人</span>
                            <div className="flex items-center gap-1 mt-1 text-gray-700">
                              <User className="w-3 h-3" />
                              {log.operator}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">托盘号</span>
                            <div className="mt-1 font-mono text-gray-700">{log.palletCode || '-'}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">起点</span>
                            <div className="mt-1 font-mono text-gray-700">{log.fromLocation || '-'}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">终点</span>
                            <div className="mt-1 font-mono text-gray-700">{log.toLocation || '-'}</div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs text-gray-500">处理结果：</span>
                          <span className="text-xs text-gray-700">{log.result}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stackerTaskLogs.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-sm">
                      暂无任务日志
                    </div>
                  )}
                </div>
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

      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">任务详情</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-130px)]">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">任务编号</label>
                    <p className="mt-1 font-medium text-gray-800">{selectedTask.code}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">任务类型</label>
                    <p className="mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedTask.type]}`}>
                        {statusLabels[selectedTask.type]}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">执行设备</label>
                    <p className="mt-1 font-medium text-gray-800">
                      {state.stackers.find(s => s.id === selectedTask.stackerId)?.code}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">托盘号</label>
                    <p className="mt-1 font-mono text-gray-800">{selectedTask.palletCode}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">起始位置</label>
                    <p className="mt-1 font-mono text-gray-800">{selectedTask.fromLocation || '入库站台'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">目标位置</label>
                    <p className="mt-1 font-mono text-gray-800">{selectedTask.toLocation || '出库站台'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">创建时间</label>
                    <p className="mt-1 text-gray-800">{selectedTask.createTime}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">状态</label>
                    <p className="mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedTask.status]}`}>
                        {statusLabels[selectedTask.status]}
                      </span>
                    </p>
                  </div>
                  {selectedTask.startTime && (
                    <div>
                      <label className="text-sm text-gray-500">开始时间</label>
                      <p className="mt-1 text-gray-800">{selectedTask.startTime}</p>
                    </div>
                  )}
                  {selectedTask.endTime && (
                    <div>
                      <label className="text-sm text-gray-500">结束时间</label>
                      <p className="mt-1 text-gray-800">{selectedTask.endTime}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-3">操作日志</h4>
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-3">
                      {getTaskLogs(selectedTask.id).map((log) => (
                        <div key={log.id} className="relative pl-8">
                          <div className={`absolute left-1 top-1 w-4 h-4 rounded-full border-2 border-white ${
                            log.action === 'execute' ? 'bg-green-500' :
                            log.action === 'dispatch' ? 'bg-blue-500' :
                            log.action === 'pause' ? 'bg-amber-500' :
                            log.action === 'cancel' ? 'bg-red-500' :
                            'bg-green-500'
                          }`}></div>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[log.action]}`}>
                                {statusLabels[log.action]}
                              </span>
                              <span className="text-xs text-gray-500">{log.timestamp}</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              <span className="text-gray-500">操作人：</span>{log.operator}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="text-gray-500">处理结果：</span>{log.result}
                            </div>
                          </div>
                        </div>
                      ))}
                      {getTaskLogs(selectedTask.id).length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-4">
                          暂无操作日志
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                关闭
              </button>
              {selectedTask.status === 'pending' && (
                <>
                  <button
                    onClick={() => { handleExecuteTask(selectedTask.id); setShowDetailModal(false); }}
                    className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    执行
                  </button>
                  <button
                    onClick={() => { handleDispatchTask(selectedTask.id); setShowDetailModal(false); }}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    调度
                  </button>
                </>
              )}
              {selectedTask.status === 'executing' && (
                <>
                  <button
                    onClick={() => { handlePauseTask(selectedTask.id); setShowDetailModal(false); }}
                    className="px-4 py-2 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                  >
                    暂停
                  </button>
                  <button
                    onClick={() => { handleCompleteTask(selectedTask.id); setShowDetailModal(false); }}
                    className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    完成
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
