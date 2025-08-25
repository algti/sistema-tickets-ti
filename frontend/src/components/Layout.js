import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import {
  HomeIcon,
  TicketIcon,
  UsersIcon,
  TagIcon,
  BellIcon,
  ChartBarIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  DocumentDuplicateIcon,
  CogIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { user, logout, isAdmin, isTechnician } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: location.pathname === '/dashboard' },
    { name: 'Tickets', href: '/tickets', icon: TicketIcon, current: location.pathname.startsWith('/tickets') },
    { name: 'Base de Conhecimento', href: '/knowledge-base', icon: BookOpenIcon, current: location.pathname === '/knowledge-base' },
    { name: 'Notificações', href: '/notifications', icon: BellIcon, current: location.pathname === '/notifications' },
  ];

  // Add technician/admin specific navigation
  if (isTechnician) {
    navigation.push(
      { name: 'Usuários', href: '/users', icon: UsersIcon, current: location.pathname === '/users' },
      { name: 'Relatórios', href: '/reports', icon: ChartBarIcon, current: location.pathname === '/reports' }
    );
  }

  if (isAdmin || isTechnician) {
    navigation.push(
      { name: 'Templates', href: '/templates', icon: DocumentDuplicateIcon, current: location.pathname === '/templates' },
      { name: 'Ativos', href: '/assets', icon: ComputerDesktopIcon, current: location.pathname === '/assets' }
    );
  }

  if (isAdmin) {
    navigation.push(
      { name: 'Categorias', href: '/categories', icon: TagIcon, current: location.pathname === '/categories' },
      { name: 'Configurações', href: '/settings', icon: CogIcon, current: location.pathname === '/settings' }
    );
  }



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-semibold text-gray-900">Tickets TI</h1>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                      item.current
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold text-gray-900">Tickets TI</h1>
          </div>
          
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                      item.current
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <NotificationBell />
              
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                    <div className="text-xs text-gray-500">{user?.department}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/profile"
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                      title="Perfil"
                    >
                      <UserIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={logout}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                      title="Sair"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
