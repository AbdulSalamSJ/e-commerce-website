import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CustomerStore } from './pages/CustomerStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { OrdersPage } from './pages/OrdersPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-emerald-500 selection:text-slate-950">
              <Navbar />
              <CartDrawer />
              
              <main className="flex-1">
                <Routes>
                  {/* Public Storefront */}
                  <Route path="/" element={<CustomerStore />} />
                  <Route path="/store/:slug" element={<CustomerStore />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Customer Orders */}
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <OrdersPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Super-Admin Platform Portal */}
                  <Route
                    path="/superadmin"
                    element={
                      <ProtectedRoute allowedRoles={['superadmin']}>
                        <SuperAdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Merchant Admin Dashboard */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Modern Minimal Footer */}
              <footer className="border-t border-white/5 py-8 mt-16 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p>© 2026 Vortex Commerce. Multi-tenant Architecture with Supabase & Drizzle.</p>
                  <div className="flex items-center gap-6">
                    <span className="hover:text-slate-400 cursor-pointer">Security Policy</span>
                    <span className="hover:text-slate-400 cursor-pointer">Merchant Terms</span>
                    <span className="hover:text-slate-400 cursor-pointer">API Status</span>
                  </div>
                </div>
              </footer>
            </div>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
