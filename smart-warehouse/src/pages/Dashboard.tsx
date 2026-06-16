import {
  Package, Bot, Truck, Route, AlertTriangle,
  TrendingUp, TrendingDown, CheckCircle2, Clock, AlertCircle
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { mockInboundOrders, mockOutboundOrders, mockLocations, mockStackers, mockAGVs, mockStockAlerts } from '@/data/mockData'

const statCards = [
  { title: '今日入库', value: '128', unit: '托盘', icon: Package, color: 'from-blue-500 to-blue-600', trend: '+12%', trendUp: true },
  { title: '今日出库', value: '96', unit: '托盘', icon: Truck, color: 'from-green-500 to-green-600', trend: '+8%', trendUp: true },
  { title: '在库托盘', value: '1,856', unit: '个', icon: Package, color: 'from-purple-500 to-purple-600', trend: '+3%', trendUp: true },
  { title: '预警数量', value: '12', unit: '条', icon: AlertTriangle, color: 'from-orange-500 to-orange-600', trend: '-5%', trendUp: false },
]

const weeklyData = [
  { name: '周一', 入库: 120, 出库: 85 },
  { name: '周二', 入库: 98, 出库: 110 },
  { name: '周三', 入库: 145, 出库: 92 },
  { name: '周四', 入库: 110, 出库: 130 },
  { name: '周五', 入库: 168, 出库: 95 },
  { name: '周六', 入库: 75, 出库: 60 },
  { name: '周日', 入库: 52, 出库: 45 },
]

const deviceData = [
  { name: '运行中', value: 8, color: '#10b981' },
  { name: '空闲', value: 4, color: '#6b7280' },
  { name: '故障', value: 1, color: '#ef4444' },
  { name: '维护中', value: 2, color: '#f59e0b' },
]

const categoryData = [
  { name: '电子元器件', value: 856 },
  { name: '结构件', value: 520 },
  { name: '电路板', value: 312 },
  { name: '机电组件', value: 168 },
]

export default function Dashboard() {
  const recentInbounds = mockInboundOrders.slice(0, 5)
  const recentOutbounds = mockOutboundOrders.slice(0, 5)
  const activeAlerts = mockStockAlerts.filter(function(a) { return a.status === 'active' }).slice(0, 5)

  const occupancyRate = Math.round((mockLocations.filter(function(l) { return l.status === 'occupied' }).length / mockLocations.length) * 100)
  const stackerRunning = mockStackers.filter(function(s) { return s.status === 'running' }).length
  const agvMoving = mockAGVs.filter(function(a) { return a.status === 'moving' || a.status === 'loading' }).length
  const categoryTotal = categoryData.reduce(function(s, c) { return s + c.value }, 0)

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
                  <div className="mt-2 flex items-center gap-1">
                    {card.trendUp ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={card.trendUp ? 'text-sm text-green-600' : 'text-sm text-red-600'}>
                      {card.trend}
                    </span>
                    <span className="text-sm text-gray-400">较上周</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">本周出入库趋势</h3>
            <span className="text-sm text-gray-400">近7天</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="入库" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="出库" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">设备运行状态</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  {deviceData.map(function(entry, index) {
                    return <Cell key={'cell-' + index} fill={entry.color} />
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {deviceData.map(function(item, i) {
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className="text-sm font-medium text-gray-800">{item.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">实时运行监控</h3>
          <div className="space-y-4">
            <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">货位占用率</span>
                <span className="text-sm font-semibold text-gray-800">{occupancyRate}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: occupancyRate + '%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-5 h-5 text-blue-500" />
                  <span className="text-xs text-gray-500">堆垛机运行</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-gray-800">{stackerRunning}</span>
                  <span className="text-xs text-gray-400">/ {mockStackers.length}</span>
                </div>
              </div>
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <Route className="w-5 h-5 text-green-500" />
                  <span className="text-xs text-gray-500">AGV作业中</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-gray-800">{agvMoving}</span>
                  <span className="text-xs text-gray-400">/ {mockAGVs.length}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">库存分类</h4>
              <div className="space-y-2">
                {categoryData.map(function(cat, i) {
                  const percent = Math.round((cat.value / categoryTotal) * 100)
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{cat.name}</span>
                        <span>{cat.value}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                          style={{ width: percent + '%' }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">最近入库</h3>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="space-y-3">
            {recentInbounds.map(function(order) {
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{order.materialName}</div>
                    <div className="text-xs text-gray-400">{order.code} · {order.supplier}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-800">{order.quantity}</div>
                    <div className="text-xs text-gray-400">{order.createTime.slice(5, 16)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">库存预警</h3>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="space-y-3">
            {activeAlerts.map(function(alert) {
              return (
                <div key={alert.id} className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800">{alert.materialName}</div>
                      <div className="text-xs text-gray-500 mt-1">{alert.message}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">最近出库</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="pb-3 pr-4 font-medium">单号</th>
                <th className="pb-3 pr-4 font-medium">物料名称</th>
                <th className="pb-3 pr-4 font-medium">数量</th>
                <th className="pb-3 pr-4 font-medium">客户</th>
                <th className="pb-3 pr-4 font-medium">优先级</th>
                <th className="pb-3 pr-4 font-medium">操作员</th>
                <th className="pb-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {recentOutbounds.map(function(order) {
                return (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 text-sm text-gray-600">{order.code}</td>
                    <td className="py-3 pr-4 text-sm text-gray-800 font-medium">{order.materialName}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{order.quantity}</td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{order.customer}</td>
                    <td className="py-3 pr-4">
                      <span className={
                        'text-xs px-2 py-0.5 rounded-full ' + (
                          order.priority === 'urgent' ? 'bg-orange-100 text-orange-700' :
                          order.priority === 'vip' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        )
                      }>
                        {order.priority === 'urgent' ? '紧急' : order.priority === 'vip' ? 'VIP' : '普通'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600">{order.operator}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-1">
                        {order.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : order.status === 'pending' ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-blue-500" />
                        )}
                        <span className="text-sm text-gray-600">
                          {order.status === 'completed' ? '已完成' : order.status === 'pending' ? '待处理' : '处理中'}
                        </span>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
