import React, { useState, useEffect } from 'react';
import { Notification } from '../types';
import { getEndpoints } from '../constants';

interface Segment {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  total_branches: number;
  total_canteens: number;
}

const AdminSegments: React.FC = () => {
  // Use dynamic endpoints from constants
  const endpoints = getEndpoints();

  const [segments, setSegments] = useState<Segment[]>([]);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Fetch segments
  useEffect(() => {
    fetchSegments();
  }, []);

  // Fetch segments from API
  const fetchSegments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const response = await fetch(`${endpoints.SEGMENTS}?action=list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Segments API response:', data); // Debug log

      // Extract array from response - API returns {success: true, data: [...]}
      let segmentsArray: Segment[] = [];
      if (Array.isArray(data)) {
        segmentsArray = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        segmentsArray = data.data;
      } else if (data && typeof data === 'object') {
        segmentsArray = [];
      }
      setSegments(segmentsArray);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch segments';
      setError(message);
      console.error('Fetch segments error:', message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create new segment
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('Segment name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const response = await fetch(`${endpoints.SEGMENTS}?action=create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setFormData({ name: '', description: '' });
      setNotification({
        message: 'Segment created successfully',
        type: 'success',
      });
      fetchSegments();

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create segment';
      setError(message);
      console.error('Create segment error:', message);
    } finally {
      setLoading(false);
    }
  };

  // Edit segment
  const handleEdit = (segment: Segment) => {
    setEditingId(segment.id);
    setFormData({
      name: segment.name,
      description: segment.description || '',
    });
  };

  // Update segment
  const handleUpdate = async () => {
    if (!editingId) return;

    if (!formData.name.trim()) {
      setError('Segment name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const response = await fetch(`${endpoints.SEGMENTS}?action=update&id=${editingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setFormData({ name: '', description: '' });
      setEditingId(null);
      setNotification({
        message: 'Segment updated successfully',
        type: 'success',
      });
      fetchSegments();

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update segment';
      setError(message);
      console.error('Update segment error:', message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  // Delete segment
  const handleDelete = async (segment: Segment) => {
    // Check if segment has linked branches or canteens
    if (segment.total_branches > 0 || segment.total_canteens > 0) {
      const parts = [];
      if (segment.total_branches > 0) parts.push(`${segment.total_branches} branch(es)`);
      if (segment.total_canteens > 0) parts.push(`${segment.total_canteens} canteen(s)`);
      const details = parts.join(' and ');
      setNotification({
        message: `Cannot delete segment "${segment.name}": ${details} are linked. Please reassign or remove them first.`,
        type: 'error',
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete segment "${segment.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const response = await fetch(`${endpoints.SEGMENTS}?action=delete&id=${segment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }

      setNotification({
        message: 'Segment deleted successfully',
        type: 'success',
      });
      fetchSegments();

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete segment';
      setNotification({
        message,
        type: 'error',
      });
      setError(message);
      setTimeout(() => setNotification(null), 5000);
      console.error('Delete segment error:', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="page-header">
        <h1>Manage Segments</h1>
        <p>Configure organizational hierarchy starting with segments.</p>
      </div>

      {/* Toast Notification Container in Top-Right Corner */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-md">
        {notification && (
          <div className={`pointer-events-auto text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-down ${notification.type === 'error' ? 'bg-red-600 border border-red-500' : 'bg-green-600 border border-green-500'}`}>
            <span className="text-xl">{notification.type === 'error' ? '❌' : '✅'}</span>
            <span className="font-semibold text-sm">{notification.message}</span>
          </div>
        )}
        {error && (
          <div className="pointer-events-auto bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 border border-red-500 animate-fade-in-down">
            <div className="flex items-center gap-2">
              <span className="text-xl">❌</span>
              <span className="font-semibold text-sm">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-white hover:text-gray-200 text-lg font-bold ml-2">×</button>
          </div>
        )}
      </div>

      {/* Add/Edit Segment Form */}
      <div className="form-section">
        <h2>{editingId ? 'Edit Segment' : 'Add New Segment'}</h2>

        <div className="form-group">
          <label htmlFor="segment-name">Segment Name *</label>
          <input
            id="segment-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., FM, FS, INFRA"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="segment-description">Description (Optional)</label>
          <textarea
            id="segment-description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="e.g., Facility Management"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          {editingId ? (
            <>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Updating...' : 'Update Segment'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Create Segment'}
            </button>
          )}
        </div>
      </div>

      {/* Segments Table */}
      <div className="table-section">
        <h2>All Segments</h2>

        {loading && !segments.length ? (
          <div className="loading">Loading segments...</div>
        ) : segments.length === 0 ? (
          <div className="no-data">No segments found. Create one to get started!</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Branches</th>
                  <th>Canteens</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {segments.map(segment => (
                  <tr key={segment.id}>
                    <td>{segment.id}</td>
                    <td className="segment-name">{segment.name}</td>
                    <td>{segment.description || '-'}</td>
                    <td className="center">{segment.total_branches}</td>
                    <td className="center">{segment.total_canteens}</td>
                    <td>{new Date(segment.created_at).toLocaleDateString()}</td>
                    <td className="actions">
                      <button
                        onClick={() => handleEdit(segment)}
                        className="btn btn-sm btn-edit"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(segment)}
                        className="btn btn-sm btn-delete"
                        disabled={loading}
                        title={segment.total_branches > 0 || segment.total_canteens > 0 ? `Cannot delete: ${segment.total_branches} branch(es) and ${segment.total_canteens} canteen(s) linked` : 'Delete segment'}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .admin-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: #666;
          font-size: 0.95rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          border-left: 4px solid;
        }

        .alert-error {
          background-color: #fee;
          border-color: #f00;
          color: #c00;
        }

        .alert-success {
          background-color: #efe;
          border-color: #0c0;
          color: #060;
        }

        .form-section {
          background: #f9f9f9;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
          border: 1px solid #ddd;
        }

        .form-section h2 {
          font-size: 1.3rem;
          color: #333;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 0.375rem;
          font-size: 0.95rem;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .form-group input:disabled,
        .form-group textarea:disabled {
          background-color: #f0f0f0;
          color: #999;
          cursor: not-allowed;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #545b62;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        .btn-edit {
          background-color: #28a745;
          color: white;
        }

        .btn-edit:hover:not(:disabled) {
          background-color: #218838;
        }

        .btn-delete {
          background-color: #dc3545;
          color: white;
        }

        .btn-delete:hover:not(:disabled) {
          background-color: #c82333;
        }

        .table-section {
          background: #f9f9f9;
          padding: 1.5rem;
          border-radius: 0.5rem;
          border: 1px solid #ddd;
        }

        .table-section h2 {
          font-size: 1.3rem;
          color: #333;
          margin-bottom: 1rem;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        table thead {
          background-color: #f0f0f0;
        }

        table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #ddd;
        }

        table td {
          padding: 1rem;
          border-bottom: 1px solid #ddd;
        }

        table tbody tr:hover {
          background-color: #f9f9f9;
        }

        .segment-name {
          font-weight: 600;
          color: #007bff;
        }

        .center {
          text-align: center;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .loading,
        .no-data {
          text-align: center;
          padding: 2rem;
          color: #666;
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
};

export default AdminSegments;
