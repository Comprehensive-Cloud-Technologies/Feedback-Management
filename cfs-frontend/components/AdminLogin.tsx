import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEndpoints } from '../constants';
import catalystLogo from '../src/images/clogo.png';

interface AdminLoginProps {
  onLogin: (password: string) => boolean;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'branch_admin' | 'admin'>('branch_admin');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const endpoints = getEndpoints();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!username || !password) {
        setError('Please enter both username and password.');
        setIsLoading(false);
        return;
      }

      if (loginMode === 'admin') {
        const res = await fetch(endpoints.ADMIN_LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invalid username or password.');
          setIsLoading(false);
          return;
        }
        localStorage.setItem('canteenAdminJWT', data.token);
        navigate('/admin');
      } else {
        const res = await fetch(endpoints.BRANCH_ADMIN_LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invalid username or password.');
          setIsLoading(false);
          return;
        }
        localStorage.setItem('canteenAdminJWT', data.token);
        navigate('/admin');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-white">
      {/* Background */}
      <div className="absolute inset-0 bg-white z-0"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Main Card */}
      <div className="glass w-full max-w-lg rounded-3xl shadow-2xl p-0 relative z-10 animate-scale-up overflow-hidden border border-gray-200 backdrop-blur-xl bg-white mx-4">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-transparent p-8 text-center border-b border-gray-200">
          <img src={catalystLogo} alt="Catalyst" className="h-16 w-auto mx-auto mb-6 drop-shadow-lg" />
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
            {loginMode === 'admin' ? 'System Admin' : 'Branch Admin Login'}
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            {loginMode === 'admin' ? 'Restricted Access' : 'Enter your credentials to continue'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="text-xs font-bold text-indigo-700 uppercase ml-1 mb-1.5 block tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium outline-none placeholder-gray-500 transition-all hover:bg-white"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-indigo-700 uppercase ml-1 mb-1.5 block tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 pr-12 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 font-medium outline-none placeholder-gray-500 transition-all hover:bg-white"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium flex items-center gap-3 animate-shake">
                <span className="text-red-600 text-xl">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/30 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : 'Sign In'}
              </span>
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            {loginMode === 'branch_admin' ? (
              <button
                type="button"
                onClick={() => { setLoginMode('admin'); setError(''); setUsername(''); setPassword(''); }}
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium"
              >
                🔒 System Admin Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setLoginMode('branch_admin'); setError(''); setUsername(''); setPassword(''); }}
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors font-medium"
              >
                ← Back to Branch Admin Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center z-10">
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-light">Powered by Catalyst</p>
        <p className="text-[10px] text-gray-400 mt-1">&copy; Catalyst Service Solutions Partners Pvt. Ltd. 2025 All rights reserved.</p>
      </div>
    </div>
  );
};

export default AdminLogin;
