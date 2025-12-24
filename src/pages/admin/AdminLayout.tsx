import React, { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AdminSkeleton } from '../../components/admin/AdminSkeleton';

export const AdminLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const navigation = [
    { name: 'Overview', path: '/admin', icon: '📊', shortcut: 'Ctrl+1' },
    { name: 'Bookings', path: '/admin/bookings', icon: '📅', shortcut: 'Ctrl+2' },
    { name: 'Barbers', path: '/admin/barbers', icon: '💈', shortcut: 'Ctrl+3' },
    { name: 'Products', path: '/admin/products', icon: '🛒', shortcut: 'Ctrl+4' },
    { name: 'Services', path: '/admin/services', icon: '✂️', shortcut: 'Ctrl+5' },
    { name: 'Customers', path: '/admin/customers', icon: '👥', shortcut: 'Ctrl+6' },
    { name: 'Analytics', path: '/admin/analytics', icon: '📈', shortcut: 'Ctrl+7' },
    { name: 'Settings', path: '/admin/settings', icon: '⚙️', shortcut: 'Ctrl+8' },
  ];

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index >= 0 && index < navigation.length) {
          navigate(navigation[index].path);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform ${
        sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
      }`}>
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">LuxeCut Admin</h1>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ◀
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
              <span className="text-xs text-gray-400">{item.shortcut}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="text-sm text-gray-600">
            Press <kbd className="px-2 py-1 bg-gray-200 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-200 rounded">1-8</kbd> to navigate
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all ${
        sidebarCollapsed ? 'ml-0' : 'ml-64'
      }`}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ▶
                </button>
              )}
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Quick Actions
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Suspense fallback={<AdminSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};