import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import ServersList from './pages/servers/ServersList';
import ServerDetails from './pages/servers/ServerDetails';
import GamesList from './pages/admin/GamesList';
import ProvidersList from './pages/admin/ProvidersList';
import AdminServersList from './pages/admin/AdminServersList';
import AdminAccessPage from './pages/admin/AdminAccessPage';
import UsersList from './pages/admin/UsersList';
import { Flame, Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-3 text-zinc-100">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <Flame className="w-6 h-6 text-indigo-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Loading Control Plane Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="servers" element={<ServersList />} />
        <Route path="servers/:id" element={<ServerDetails />} />

        {/* Admin Routes */}
        <Route
          path="admin/games"
          element={
            <ProtectedRoute requireAdmin>
              <GamesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/providers"
          element={
            <ProtectedRoute requireAdmin>
              <ProvidersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/servers"
          element={
            <ProtectedRoute requireAdmin>
              <AdminServersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/access"
          element={
            <ProtectedRoute requireAdmin>
              <AdminAccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <UsersList />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
