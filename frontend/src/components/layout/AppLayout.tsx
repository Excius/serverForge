import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Server,
  Gamepad2,
  Cloud,
  Users,
  LogOut,
  ChevronRight,
  Flame,
  Shield,
  UserCheck,
  Menu,
  X,
  KeyRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return ['Dashboard'];
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  };

  return (
    <div className="min-h-screen flex bg-[#09090b] text-zinc-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Mobile menu backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 glass-panel bg-zinc-950/90 border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                ServerForge
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0
                </span>
              </span>
              <span className="text-[10px] text-zinc-400 tracking-wide">Control Plane</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Overview
            </div>
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive('/dashboard')
                  ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${isActive('/dashboard') ? 'text-indigo-400' : ''}`} />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/servers"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive('/servers')
                  ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
              }`}
            >
              <Server className={`w-4 h-4 ${isActive('/servers') ? 'text-indigo-400' : ''}`} />
              <span>My Game Servers</span>
            </Link>
          </div>

          {user?.role === 'admin' && (
            <div className="space-y-1 pt-4 border-t border-white/5">
              <div className="px-3 text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Management</span>
                <Shield className="w-3 h-3 text-indigo-400" />
              </div>
              <Link
                to="/admin/games"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive('/admin/games')
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                }`}
              >
                <Gamepad2 className={`w-4 h-4 ${isActive('/admin/games') ? 'text-indigo-400' : ''}`} />
                <span>Games Catalogue</span>
              </Link>
              <Link
                to="/admin/providers"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive('/admin/providers')
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                }`}
              >
                <Cloud className={`w-4 h-4 ${isActive('/admin/providers') ? 'text-indigo-400' : ''}`} />
                <span>Providers & Nodes</span>
              </Link>
              <Link
                to="/admin/servers"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive('/admin/servers')
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                }`}
              >
                <Server className={`w-4 h-4 ${isActive('/admin/servers') ? 'text-indigo-400' : ''}`} />
                <span>All Fleet Servers</span>
              </Link>
              <Link
                to="/admin/access"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive('/admin/access')
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                }`}
              >
                <KeyRound className={`w-4 h-4 ${isActive('/admin/access') ? 'text-indigo-400' : ''}`} />
                <span>Server Access Rules</span>
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive('/admin/users')
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-white border border-indigo-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                }`}
              >
                <Users className={`w-4 h-4 ${isActive('/admin/users') ? 'text-indigo-400' : ''}`} />
                <span>User Management</span>
              </Link>
            </div>
          )}
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/60">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-200 truncate">{user?.email}</span>
                <span className="text-[10px] text-zinc-400 capitalize">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="h-16 sticky top-0 z-30 glass-panel bg-zinc-950/80 border-b border-white/10 px-4 lg:px-8 flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <span className="text-zinc-500">Control Plane</span>
              {getBreadcrumbs().map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                  <span className={idx === getBreadcrumbs().length - 1 ? 'text-zinc-100 font-semibold' : ''}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Quick Stats / System Status indicator */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>API Gateway Connected</span>
            </div>

            <Badge variant="indigo" className="hidden sm:inline-flex gap-1.5">
              <UserCheck className="w-3 h-3" />
              <span className="capitalize">{user?.role}</span>
            </Badge>

            <button
              onClick={logout}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg text-zinc-300 hover:text-rose-400 bg-zinc-900/80 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
