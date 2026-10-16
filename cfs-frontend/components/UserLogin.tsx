import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEndpoints } from '../constants';

const USER_KEY = 'canteenUsers';

interface UserLoginProps {
  onLogin: (site: string, username: string, token?: string) => void;
}

const UserLogin: React.FC<UserLoginProps> = ({ onLogin }) => {
  const [site, setSite] = useState('');
  const endpoints = getEndpoints();
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [sites, setSites] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(endpoints.SITES)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.sites)) {
          setSites(data.sites.map((s: any) => s.location));
        } else {
          setSites([]);
        }
      })
      .catch(() => setSites([]));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!site || !username || !password) {
      setError('Please fill all fields.');
      return;
    }
    try {
      const res = await fetch(endpoints.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      onLogin(site, username, data.token);
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-orange-100 to-amber-50 relative overflow-hidden font-sans">
      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-orange-400/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[60%] rounded-full bg-yellow-400/10 blur-[100px] animate-pulse"></div>
      </div>

      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row relative z-10 min-h-[600px] animate-fade-in border border-white/60">

        {/* Left Side: Visual/Branding */}
        <div className="md:w-1/2 bg-gradient-to-br from-orange-600 to-amber-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10">
            <div className="bg-white/20 w-fit p-4 rounded-2xl backdrop-blur-md mb-10 shadow-inner">
              <img src="https://catalystsolutions.eco/wp-content/uploads/2023/02/logo.png" alt="Catalyst Logo" className="h-10 w-auto brightness-0 invert" />
            </div>
            <h1 className="text-5xl font-black leading-tight mb-6 tracking-tight">Your Feedback<br />Matters.</h1>
            <p className="text-orange-50 text-lg leading-relaxed font-medium">Help us create the perfect dining experience. We are listening to every detail.</p>
          </div>

          <div className="relative z-10 mt-12 flex items-center gap-4 text-sm font-medium text-orange-100">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-orange-500"></div>
              <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-orange-500"></div>
              <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-orange-500"></div>
            </div>
            <span>Trusted by 50+ locations</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-white/80 backdrop-blur-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-500">Please verify your identity to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Site</label>
              <div className="relative group">
                <select
                  value={site}
                  onChange={e => setSite(e.target.value)}
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium text-gray-700 appearance-none group-hover:bg-gray-100"
                >
                  <option value="" disabled>Choose Location</option>
                  {sites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium text-gray-700 placeholder-gray-400 hover:bg-gray-100"
                placeholder="Enter username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium text-gray-700 placeholder-gray-400 hover:bg-gray-100"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transform hover:-translate-y-0.5 transition-all shadow-lg hover:shadow-xl mt-4"
            >
              START FEEDBACK
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <a href="/admin-login" className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition">Access Admin Portal &rarr;</a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 w-full text-center text-gray-400 text-xs">
        &copy; Catalyst Service Solutions Partners Pvt. Ltd. 2025 All rights reserved.
      </div>
    </div>
  );
};

export default UserLogin;
