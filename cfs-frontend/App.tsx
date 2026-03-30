
import React, { useState, Component } from 'react';
import './index.css';
import './styles/icons.css';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import FeedbackForm from './components/FeedbackForm';
import QRCodePage from './components/QRCodePage';
import QRCodePrintPage from './components/QRCodePrintPage';
import AdminDashboard from './components/AdminDashboard';
import BranchAdminDashboard from './components/BranchAdminDashboard';
import AdminLogin from './components/AdminLogin';
import AdminQuestionManager from './components/AdminQuestionManager';
import AdminFeedback from './components/AdminFeedback';
import AdminUsers from './components/AdminUsers';
import AdminSites from './components/AdminSites';
import AdminCanteens from './components/AdminCanteens';
import AdminSegments from './components/AdminSegments';
import AdminBranchAdmins from './components/AdminBranchAdmins';
import { useAuth } from './hooks/useAuth';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-600">Something went wrong. Please refresh.</div>;
    }

    return this.props.children;
  }
}




const getUserRole = () => {
  const token = localStorage.getItem('canteenAdminJWT');
  if (!token) return null;
  try {
    let payloadStr = '';
    if (token.includes('.')) {
      payloadStr = atob(token.split('.')[1]);
    } else {
      payloadStr = atob(token);
    }
    const payload = JSON.parse(payloadStr);
    return payload.role || null;
  } catch (error) { return null; }
};

const getUserSite = () => {
  const token = localStorage.getItem('canteenAdminJWT');
  if (!token) return null;
  try {
    let payloadStr = '';
    if (token.includes('.')) {
      payloadStr = atob(token.split('.')[1]);
    } else {
      payloadStr = atob(token);
    }
    const payload = JSON.parse(payloadStr);
    return payload.site || null;
  } catch (error) { return null; }
};

const App: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth();



  // Sidebar link helper
  const SidebarLink = ({ to, label, icon, isCollapsed }: { to: string, label: string, icon?: string, isCollapsed: boolean }) => {
    const active = window.location.hash.startsWith(to);
    return (
      <a href={to}
        title={label}
        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 no-underline mb-2 group
           ${active ? 'bg-primary-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
         `}
      >
        <span className={`text-xl ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{icon || '•'}</span>
        {!isCollapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
      </a>
    );
  };

  const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false); // Default to open
    const role = getUserRole();
    const isAdmin = role === 'admin';
    const isBranchAdmin = role === 'branch_admin';

    // Branch Admin doesn't want side panel
    if (isBranchAdmin && window.location.hash !== '#/admin-login') {
      return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
          {children}
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 flex">
        {window.location.hash.startsWith('#/admin') &&
          window.location.hash !== '#/admin-login' &&
          localStorage.getItem('canteenAdminJWT') && (
            <div
              className={`fixed top-0 left-0 bottom-0 bg-[#111] text-white z-50 flex flex-col transition-all duration-300 shadow-xl
                ${isCollapsed ? 'w-20' : 'w-64'}
              `}
            >
              {/* Toggle Button */}
              <div className="p-4 flex items-center justify-between border-b border-gray-800">
                {!isCollapsed && <span className="font-bold text-lg text-white">Admin</span>}
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition"
                >
                  {isCollapsed ? '☰' : '◀'}
                </button>
              </div>

              <div className="flex-1 py-4 px-2 overflow-y-auto custom-scrollbar">
                <SidebarLink to="#/admin" label="Dashboard" icon="📊" isCollapsed={isCollapsed} />

                {isAdmin && (
                  <SidebarLink to="#/admin/segments" label="Manage Segments" icon="📋" isCollapsed={isCollapsed} />
                )}

                {isAdmin && (
                  <SidebarLink to="#/admin/sites" label="Manage Branches" icon="🏢" isCollapsed={isCollapsed} />
                )}

                {isAdmin && (
                  <SidebarLink to="#/admin/branch-admins" label="Manage Branch Admins" icon="👤" isCollapsed={isCollapsed} />
                )}

                <SidebarLink to="#/admin/canteens" label="Manage Canteens" icon="🏪" isCollapsed={isCollapsed} />
                {isAdmin && (
                  <SidebarLink to="#/admin/question-manager" label="Manage Questions" icon="🎨" isCollapsed={isCollapsed} />
                )}
                <SidebarLink to="#/admin/feedback" label="Manage Feedback" icon="💬" isCollapsed={isCollapsed} />
                <SidebarLink to="#/admin/qr-codes" label="QR Codes" icon="📱" isCollapsed={isCollapsed} />
              </div>

              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={() => { localStorage.clear(); window.location.href = '/#/admin-login'; }}
                  title="Logout"
                  className={`w-full flex items-center justify-center gap-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all font-semibold
                     ${isCollapsed ? 'px-0' : ''}
                   `}
                >
                  <span>🚪</span>
                  {!isCollapsed && <span>Logout</span>}
                </button>
              </div>
            </div>
          )}

        <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${window.location.hash.startsWith('#/admin') && window.location.hash !== '#/admin-login' ? (isCollapsed ? 'ml-20' : 'ml-64') : 'ml-0'}`}>
          <div className="w-full flex-grow">
            {children}
          </div>
          {/* Footer inside content area to align correctly */}
          {window.location.hash.startsWith('#/admin') && (
            <footer className="w-full py-4 text-center text-gray-500 text-sm border-t border-gray-200 mt-auto bg-white/90 backdrop-blur-sm">
              &copy; Catalyst Service Solutions Partners Pvt. Ltd. 2025 All rights reserved .
            </footer>
          )}
        </div>
      </div>
    );
  };

  const AppContent: React.FC = () => {
    const location = useLocation();
    const adminJwt = localStorage.getItem('canteenAdminJWT');

    // Auth wrappers
    const ProtectedAdminFeedback = () => adminJwt ? <AdminFeedback /> : <AdminLogin onLogin={login} />;
    const ProtectedAdminDashboard = () => {
      if (!adminJwt) return <AdminLogin onLogin={login} />;
      const role = getUserRole();
      const site = getUserSite();
      if (role === 'branch_admin' && site) {
        return <BranchAdminDashboard site={site} onLogout={logout} />;
      }
      return <AdminDashboard onLogout={logout} />;
    };

    return (
      <Routes>
        <Route path="/" element={<AdminLayout><AdminLogin onLogin={login} /></AdminLayout>} />
        <Route path="/feedback" element={<AdminLayout><FeedbackForm jwt={null} /></AdminLayout>} />
        <Route path="/admin-login" element={<AdminLayout><AdminLogin onLogin={login} /></AdminLayout>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout><ProtectedAdminDashboard /></AdminLayout>} />
        <Route path="/admin/question-manager" element={<AdminLayout>{adminJwt && getUserRole() === 'admin' ? <AdminQuestionManager /> : <ProtectedAdminDashboard />}</AdminLayout>} />
        <Route path="/admin/feedback" element={<AdminLayout><ProtectedAdminFeedback /></AdminLayout>} />
        <Route path="/admin/segments" element={<AdminLayout>{adminJwt && getUserRole() === 'admin' ? <AdminSegments /> : <AdminLogin onLogin={login} />}</AdminLayout>} />
        <Route path="/admin/sites" element={<AdminLayout>{adminJwt && getUserRole() === 'admin' ? <AdminSites /> : <AdminLogin onLogin={login} />}</AdminLayout>} />
        <Route path="/admin/branch-admins" element={<AdminLayout>{adminJwt && getUserRole() === 'admin' ? <AdminBranchAdmins /> : <AdminLogin onLogin={login} />}</AdminLayout>} />
        <Route path="/admin/canteens" element={<AdminLayout>{adminJwt ? <AdminCanteens /> : <AdminLogin onLogin={login} />}</AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout>{adminJwt ? <AdminUsers /> : <AdminLogin onLogin={login} />}</AdminLayout>} />
        <Route path="/admin/qr-codes" element={<AdminLayout>{adminJwt ? <QRCodePrintPage /> : <AdminLogin onLogin={login} />}</AdminLayout>} />
      </Routes>
    );
  };


  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', background: 'var(--secondary-color)' }}>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </div>
    </ErrorBoundary>
  );
};

export default App;
