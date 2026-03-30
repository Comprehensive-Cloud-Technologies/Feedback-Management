import React, { useEffect, useState } from 'react';
import { getEndpoints } from '../constants';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ site: '', username: '', password: '' });
  const [editingId, setEditingId] = useState<number|null>(null);
  const [editingUser, setEditingUser] = useState({ site: '', username: '', password: '' });
  const [sites, setSites] = useState<string[]>([]);
  const endpoints = getEndpoints();
  // Fetch available sites for dropdown
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

  const fetchUsers = async () => {
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const res = await fetch(endpoints.ADMIN_USERS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse response' }));
        throw new Error(errorData.error || `Failed to fetch users: ${res.status}`);
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setError(err.message || 'Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const res = await fetch(endpoints.ADMIN_USERS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse response' }));
        throw new Error(errorData.error || `Failed to add user: ${res.status}`);
      }

      setForm({ site: '', username: '', password: '' });
      await fetchUsers();
    } catch (err: any) {
      console.error('Add user error:', err);
      setError(err.message || 'Failed to add user');
    }
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setEditingUser({ site: user.site, username: user.username, password: '' });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  const handleSave = async (id: number) => {
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const res = await fetch(`${endpoints.ADMIN_USERS}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingUser)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse response' }));
        throw new Error(errorData.error || `Failed to update user: ${res.status}`);
      }

      setEditingId(null);
      setEditingUser({ site: '', username: '', password: '' });
      await fetchUsers();
    } catch (err: any) {
      console.error('Update user error:', err);
      setError(err.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const res = await fetch(`${endpoints.ADMIN_USERS}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse response' }));
        throw new Error(errorData.error || `Failed to delete user: ${res.status}`);
      }

      await fetchUsers(); // Refresh the users list
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  return (
  <div className="max-w-2xl mx-auto bg-white p-4 rounded-xl shadow-xl mt-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg py-2 mb-4 shadow flex items-center justify-between px-3">
  <h2 className="text-xl font-bold text-white">Manage Users</h2>
        <span className="text-white font-semibold text-base">Total: {users.length}</span>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
  <form onSubmit={handleAddUser} className="mb-4 flex gap-2 items-end font-light text-sm">
  <select name="site" value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} className="border p-1 rounded w-24" required>
          <option value="">Select Site</option>
          {sites.map(site => (
            <option key={site} value={site}>{site}</option>
          ))}
        </select>
  <input name="username" value={form.username} onChange={handleInputChange} placeholder="Username" className="border p-1 rounded w-24 font-light" required />
  <input name="password" value={form.password} onChange={handleInputChange} placeholder="Password" className="border p-1 rounded w-24 font-light" required type="password" />
  <button type="submit" className="bg-primary-600 text-white px-2 py-1 rounded font-bold text-xs">Add User</button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-4 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Site</th>
              <th className="p-2 border">Username</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any, idx: number) => (
              <tr key={user.id} className={"transition-colors duration-200 " + (idx % 2 === 0 ? "bg-white" : "bg-gray-50") + " hover:bg-primary-50 text-xs"}>
                <td className="p-2 border font-mono">{user.id}</td>
                <td className="p-2 border">{editingId === user.id ? (
                  <select name="site" value={editingUser.site} onChange={handleEditInputChange} className="border p-1 rounded w-20 font-light text-xs">
                    <option value="">Select Site</option>
                    {sites.map(site => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                ) : user.site}</td>
                <td className="p-2 border">{editingId === user.id ? (
                  <input name="username" value={editingUser.username} onChange={handleEditInputChange} className="border p-1 rounded w-20 font-light text-xs" />
                ) : user.username}</td>
                <td className="p-2 border">
                  {editingId === user.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(user.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">Save</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(user)} className="bg-blue-600 hover:bg-blue-700 text-white px-1 py-0.5 rounded text-xs">Edit</button>
                      <button onClick={() => handleDelete(user.id)} className="bg-red-600 hover:bg-red-700 text-white px-1 py-0.5 rounded text-xs">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <p className="text-gray-500 text-center">No users found.</p>}
    </div>
  );
};

export default AdminUsers;
