import { useState } from 'react'
import {
  Route, Search, Plus, Play, Battery, BatteryCharging,
  MapPin, Clock, AlertTriangle, CheckCircle2, RefreshCw, Navigation
} from 'lucide-react'
import { mockAGVs, mockAGVTasks } from '@/data/mockData'
import { statusColors, statusLabels } from '@/utils'

type TabType = 'monitor' | 'tasks' | 'map'

export default function AGVPage() {
  const [tab, setTab] = useState<TabType>('monitor')
  const [selectedAGV, setSelectedAGV] = useState<string | null>(null)

  const runningCount = mockAGVs.filter(a => a.status === 'moving' || a.status === 'loading').length
  const chargingCount = mockAGVs.filter(a => a.status === 'charging').length
  const faultCount = mockAGVs.filter(a => a.status === 'fault').length

  const pendingTasks = mockAGVTasks.filter(t => t.status === 'pending').length
  const executingTasks = mockAGVTasks.filter(t => t.status === 'executing').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">AGV总数</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{mockAGVs.length}</p>
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
              <p className="text-2xl font-bold text-green-600 mt-1">{runningCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Play className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">充电中</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{chargingCount}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <BatteryCharging className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">故障</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{faultCount}</p>
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
                {mockAGVs.map((agv) => (
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
                          <Route className={`w-5 h-5 ${
                            agv.status === 'moving' || agv.status === 'loading' ? 'text-green-600' :
                            agv.status === 'charging' ? 'text-amber-600' :
                            agv.status === 'fault' ? 'text-red-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{agv.code}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[agv.status]}`}>
                            {statusLabels[agv.status]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Battery className="w-4 h-4" />
                          电量
                        </div>
                        <span className={`text-sm font-medium ${
                          agv.battery > 50 ? 'text-green-600' : agv.battery > 20 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {agv.battery}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            agv.battery > 50 ? 'bg-green-500' : agv.battery > 20 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${agv.battery}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500">位置</div>
                          <div className="text-sm font-mono font-medium text-gray-800">({agv.position.x}, {agv.position.y})</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-500">速度</div>
                          <div className="text-sm font-medium text-gray-800">{agv.speed} m/s</div>
                        </div>
                      </div>

                      {agv.currentTask && (
                        <div className="pt-2 mt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-500">当前任务</div>
                          <div className="text-sm font-medium text-blue-600 mt-0.5">{agv.currentTask}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 border border-gray-200 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-4">设备运行监控</h4>
                  <div className="space-y-4">
                    {mockAGVs.slice(0, 4).map((agv) => (
                      <div key={agv.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-800">{agv.code}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[agv.status]}`}>
                            {statusLabels[agv.status]}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-gray-500">电压</div>
                            <div className="font-medium text-gray-800 mt-0.5">{48 + Math.random().toFixed(1)}V</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-gray-500">电流</div>
                            <div className="font-medium text-gray-800 mt-0.5">{(8 + Math.random() * 4).toFixed(1)}A</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-gray-500">温度</div>
                            <div className="font-medium text-gray-800 mt-0.5">{35 + Math.floor(Math.random() * 10)}°C</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="text-gray-500">运行时长</div>
                            <div className="font-medium text-gray-800 mt-0.5">{(Math.random() * 8).toFixed(1)}h</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 border border-gray-200 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-4">今日搬运统计</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                      <div className="text-3xl font-bold text-blue-600">{200 + Math.floor(Math.random() * 100)}</div>
                      <div className="text-sm text-gray-500 mt-1">总搬运次数</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl text-center">
                      <div className="text-3xl font-bold text-green-600">{Math.floor(Math.random() * 100)}%</div>
                      <div className="text-sm text-gray-500 mt-1">完成率</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">待执行任务</span>
                      <span className="font-medium text-gray-800">{pendingTasks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">执行中任务</span>
                      <span className="font-medium text-gray-800">{executingTasks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">平均执行时间</span>
                      <span className="font-medium text-gray-800">8.5 分钟</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">平均等待时间</span>
                      <span className="font-medium text-gray-800">2.3 分钟</span>
                    </div>
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
                    placeholder="搜索任务号、AGV编号..."
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
                  创建搬运任务
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
                      <th className="px-4 py-3 font-medium">执行AGV</th>
                      <th className="px-4 py-3 font-medium">起点</th>
                      <th className="px-4 py-3 font-medium">终点</th>
                      <th className="px-4 py-3 font-medium">托盘号</th>
                      <th className="px-4 py-3 font-medium">预计时长</th>
                      <th className="px-4 py-3 font-medium">创建时间</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAGVTasks.map((task) => (
                      <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{task.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {mockAGVs.find(a => a.id === task.agvId)?.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.fromPoint}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.toPoint}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{task.palletCode}</td>
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
                                <button className="text-xs px-2 py-1 text-green-600 bg-green-50 rounded hover:bg-green-100">调度</button>
                                <button className="text-xs px-2 py-1 text-red-600 bg-red-50 rounded hover:bg-red-100">取消</button>
                              </>
                            )}
                            {task.status === 'executing' && (
                              <button className="text-xs px-2 py-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100">追踪</button>
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <h4 className="font-semibold text-gray-800 mb-4">AGV路径地图</h4>
                  <div className="bg-gray-900 rounded-xl p-4 relative" style={{ minHeight: '500px' }}>
                    <svg viewBox="0 0 800 500" className="w-full h-full">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="800" height="500" fill="url(#grid)" />

                      <rect x="50" y="50" width="120" height="80" fill="#1e3a8a" rx="4" opacity="0.6" />
                      <text x="110" y="95" textAnchor="middle" fill="#fff" fontSize="12">入库区</text>

                      <rect x="630" y="50" width="120" height="80" fill="#065f46" rx="4" opacity="0.6" />
                      <text x="690" y="95" textAnchor="middle" fill="#fff" fontSize="12">出库区</text>

                      {[0, 1, 2, 3, 4].map((i) => (
                        <g key={i}>
                          <rect
                            x={150 + i * 100}
                            y={180}
                            width={60}
                            height={250}
                            fill="#1e40af"
                            rx="4"
                            opacity={0.4 + Math.random() * 0.3}
                          />
                          <text x={180 + i * 100} y={450} textAnchor="middle" fill="#9ca3af" fontSize="10">
                            A{i + 1}
                          </text>
                        </g>
                      ))}

                      <rect x="50" y="370" width="80" height="60" fill="#78350f" rx="4" opacity="0.6" />
                      <text x="90" y="405" textAnchor="middle" fill="#fff" fontSize="10">充电站</text>

                      <rect x="650" y="370" width="100" height="60" fill="#6b21a8" rx="4" opacity="0.6" />
                      <text x="700" y="405" textAnchor="middle" fill="#fff" fontSize="10">集货区</text>

                      <path d="M 50 170 L 750 170" stroke="#60a5fa" strokeWidth="2" strokeDasharray="8 4" opacity="0.6" />
                      <path d="M 100 170 L 100 370" stroke="#60a5fa" strokeWidth="2" strokeDasharray="8 4" opacity="0.6" />
                      <path d="M 700 170 L 700 370" stroke="#60a5fa" strokeWidth="2" strokeDasharray="8 4" opacity="0.6" />
                      <path d="M 50 450 L 750 450" stroke="#60a5fa" strokeWidth="2" strokeDasharray="8 4" opacity="0.6" />

                      {mockAGVs.slice(0, 6).map((agv, i) => {
                        const positions = [
                          { x: 100, y: 200 },
                          { x: 280, y: 170 },
                          { x: 450, y: 300 },
                          { x: 620, y: 220 },
                          { x: 90, y: 400 },
                          { x: 700, y: 400 },
                        ]
                        const color = agv.status === 'moving' || agv.status === 'loading' ? '#22c55e' :
                          agv.status === 'charging' ? '#f59e0b' :
                          agv.status === 'fault' ? '#ef4444' : '#6b7280'
                        return (
                          <g key={agv.id}>
                            <circle cx={positions[i].x} cy={positions[i].y} r="12" fill={color} />
                            <text x={positions[i].x} y={positions[i].y + 4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                              {i + 1}
                            </text>
                            {(agv.status === 'moving') && (
                              <circle cx={positions[i].x} cy={positions[i].y} r="18" fill="none" stroke={color} strokeWidth="2" opacity="0.4">
                                <animate attributeName="r" from="12" to="22" dur="1.5s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                            )}
                          </g>
                        )
                      })}
                    </svg>

                    <div className="absolute bottom-4 left-4 bg-gray-800/80 rounded-lg p-3">
                      <div className="text-xs text-gray-300 font-medium mb-2">图例</div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-xs text-gray-300">运行中</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                          <span className="text-xs text-gray-300">空闲</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <span className="text-xs text-gray-300">充电中</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-xs text-gray-300">故障</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">AGV调度策略</h4>
                  <div className="space-y-3">
                    <div className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-800">最短路径优先</span>
                      </div>
                      <p className="text-xs text-gray-500">基于Dijkstra算法计算最优路径，减少搬运时间</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-800">任务动态分配</span>
                      </div>
                      <p className="text-xs text-gray-500">实时根据AGV位置和状态分配任务，优化整体效率</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-800">防碰撞机制</span>
                      </div>
                      <p className="text-xs text-gray-500">多AGV协同避障，确保运行安全</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <BatteryCharging className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-gray-800">智能充电调度</span>
                      </div>
                      <p className="text-xs text-gray-500">电量低于阈值自动返回充电，任务间隙补能</p>
                    </div>
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
