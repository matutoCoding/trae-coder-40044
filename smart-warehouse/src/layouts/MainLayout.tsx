import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Bot, Truck, ClipboardList,
  Route, AlertTriangle, Menu, X, ChevronRight,
  Warehouse, User
} from 'lucide-react'

const menuItems = [
  { id: 'dashboard', name: '工作台', icon: LayoutDashboard, path: '/' },
  { id: 'inbound', name: '入库上架', icon: Package, path: '/inbound' },
  { id: 'stacker', name: '堆垛机调度', icon: Bot, path: '/stacker' },
  { id: 'outbound', name: '拣选出库', icon: Truck, path: '/outbound' },
  { id: 'stockcheck', name: '盘点管理', icon: ClipboardList, path: '/stockcheck' },
  { id: 'agv', name: 'AGV搬运', icon: Route, path: '/agv' },
  { id: 'alert', name: '库存预警', icon: AlertTriangle, path: '/alert' },
]

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const currentPath = location.pathname

  return (
    <div className="flex h-full bg-gray-50">
      <aside
        className={`${collapsed ? 'w-16' : 'w-60'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-800 text-lg">智能仓储</span>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-100 rounded">
            {collapsed ? <Menu className="w-5 h-5 text-gray-500" /> : <X className="w-5 h-5 text-gray-500" />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path))
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 truncate">仓库管理员</div>
                <div className="text-xs text-gray-400">admin</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {menuItems.find(m => currentPath === m.path || (m.path !== '/' && currentPath.startsWith(m.path)))?.name || '工作台'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></span>
              <AlertTriangle className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-sm text-gray-500">欢迎回来，管理员</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
