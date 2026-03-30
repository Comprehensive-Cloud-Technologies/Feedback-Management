import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEndpoints } from '../constants';

const USER_KEY = 'canteenUsers';

const UserSignup = () => {
  const [sites, setSites] = useState<string[]>([]);
  const [site, setSite] = useState('');
  const endpoints = getEndpoints();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(endpoints.SITES)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.sites)) {
          setSites(data.sites.map((s: any) => s.location));
        }
      })
      .catch(err => {
        console.error('Failed to fetch sites:', err);
        setError('Failed to load sites');
      });
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!site || !username || !password) {
      setError('Please fill all fields.');
      return;
    }
    try {
      const res = await fetch(endpoints.SIGNUP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }
      setSuccess(true);
      setSite('');
      setUsername('');
      setPassword('');
      setTimeout(() => {
        setSuccess(false);
        navigate('/');
      }, 1500);
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 bg-gradient-to-r from-primary-50 to-primary-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <img src="https://catalystsolutions.eco/wp-content/uploads/2023/02/logo.png" alt="Catalyst Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Registration</h1>
        </div>
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Select Site</label>
            <select value={site} onChange={e => setSite(e.target.value)} required className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500">
              <option value="" disabled>Select a site...</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500" />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
          {success && <p className="text-green-500 text-sm bg-green-50 p-3 rounded-lg">Signup successful! You can now login.</p>}
          <button type="submit" className="w-full bg-primary-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default UserSignup;
