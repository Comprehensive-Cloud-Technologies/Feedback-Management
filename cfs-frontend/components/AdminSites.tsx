import React, { useEffect, useState } from 'react';
import { getEndpoints } from '../constants';
import { SearchInput, matchesSearch } from './SearchInput';

interface Segment {
  id: number;
  name: string;
  description?: string;
}

interface Site {
  id: number;
  location: string;
  branch_location: string;
  segment_id?: number;
  segment_name?: string;
  created_at: string;
  admins?: { username: string }[];
}

const AdminSites: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  const [form, setForm] = useState({ location: '', branch_location: '', segment_id: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingSite, setEditingSite] = useState({ location: '', branch_location: '', segment_id: '' });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const endpoints = getEndpoints();

  const fetchSites = async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const [sitesRes, adminsRes] = await Promise.all([
        fetch(endpoints.SITES, { headers }),
        fetch(endpoints.ADMIN_BRANCH_ADMINS, { headers }).catch(() => null)
      ]);

      if (!sitesRes.ok) {
        throw new Error(`Failed to fetch sites: ${sitesRes.status}`);
      }

      const sitesData = await sitesRes.json();
      let sitesList: Site[] = Array.isArray(sitesData.sites) ? sitesData.sites : [];

      if (adminsRes && adminsRes.ok) {
        const adminsData = await adminsRes.json();
        const admins = Array.isArray(adminsData.branch_admins) ? adminsData.branch_admins : [];

        // Merge admins into sites
        sitesList = sitesList.map(site => {
          const siteAdmins = admins.filter((a: any) => a.site === site.location);
          return { ...site, admins: siteAdmins };
        });
      }

      setSites(sitesList);
    } catch (err: any) {
      console.error('Fetch sites error:', err);
      setError(err.message || 'Failed to fetch sites');
    }
    setLoading(false);
  };

  const fetchSegments = async () => {
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const response = await fetch(`${endpoints.ADMIN_CANTEENS}/../../api/segments/index.php?action=list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch segments: ${response.status}`);
      }

      const data = await response.json();
      // Extract array from response {success: true, data: [...]}
      let segmentsArray: Segment[] = [];
      if (Array.isArray(data)) {
        segmentsArray = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        segmentsArray = data.data;
      }
      setSegments(segmentsArray);
    } catch (err: any) {
      console.error('Fetch segments error:', err);
    }
  };

  useEffect(() => {
    fetchSegments();
    fetchSites();
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      if (!token) throw new Error('Authentication required.');

      const res = await fetch(endpoints.SITES, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: form.location,
          branch_location: form.branch_location,
          segment_id: form.segment_id ? parseInt(form.segment_id) : null
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add site: ${res.status}`);
      }

      setForm({ location: '', branch_location: '', segment_id: '' });
      await fetchSites();
      showNotification('Site added successfully! 🎉');

      window.dispatchEvent(new CustomEvent('sitesUpdated', {
        detail: { action: 'added', location: form.location }
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to add site');
    }
    setLoading(false);
  };

  const handleEdit = (site: Site) => {
    setEditingId(site.id);
    setEditingSite({
      location: site.location,
      branch_location: site.branch_location,
      segment_id: site.segment_id ? site.segment_id.toString() : ''
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingSite({ ...editingSite, [e.target.name]: e.target.value });
  };

  const handleSave = async (id: number) => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const res = await fetch(`${endpoints.SITES}/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          location: editingSite.location,
          branch_location: editingSite.branch_location,
          segment_id: editingSite.segment_id ? parseInt(editingSite.segment_id) : null
        })
      });

      if (!res.ok) throw new Error(`Failed to update: ${res.status}`);

      setEditingId(null);
      setEditingSite({ location: '', branch_location: '', segment_id: '' });
      await fetchSites();
      showNotification('Site updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update site');
    }
    setLoading(false);
  };

  const handleDelete = async (id: number, location: string) => {
    if (!confirm(`⚠️ DANGER: Delete "${location}"?\n\nThis will DELETE ALL DATA (Canteens, Feedback, Admins) for this branch.`)) {
      return;
    }

    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      // Fix: Send ID as query parameter, not path parameter, as backend expects ?id=...
      const res = await fetch(`${endpoints.SITES}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      setSites(sites.filter(s => s.id !== id));
      await fetchSites();
      showNotification('Site deleted');

      window.dispatchEvent(new CustomEvent('sitesUpdated', {
        detail: { action: 'deleted', id, location }
      }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete site');
    }
    setLoading(false);
  };

  const filteredSites = sites.filter((site) => {
    const adminUsernames = site.admins ? site.admins.map((a) => a.username).join(' ') : '';
    return matchesSearch(searchQuery, [
      site.segment_name,
      site.location,
      site.branch_location,
      adminUsernames,
    ]);
  });

  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-xl mt-6">
      {/* Toast Notification Container in Top-Right Corner */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-md">
        {notification && (
          <div className="pointer-events-auto bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-green-500 animate-fade-in-down">
            <span className="text-xl">✅</span>
            <span className="font-semibold text-sm">{notification}</span>
          </div>
        )}
        {error && (
          <div className="pointer-events-auto bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 border border-red-500 animate-fade-in-down">
            <div className="flex items-center gap-2">
              <span className="text-xl">❌</span>
              <span className="font-semibold text-sm">{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-white hover:text-gray-200 text-lg font-bold ml-2">×</button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg py-3 mb-6 shadow flex items-center justify-between px-4">
        <h2 className="text-xl font-bold text-white">Manage Branches</h2>
        <span className="text-white font-semibold text-base">
          {searchQuery.trim() ? `Showing ${filteredSites.length} of ${sites.length}` : `Total: ${sites.length}`}
        </span>
      </div>

      <form onSubmit={handleAddSite} className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">ADD NEW BRANCH / SITE</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Segment</label>
            <select value={form.segment_id} onChange={(e) => setForm({ ...form, segment_id: e.target.value })} className="w-full border p-2 rounded" required>
              <option value="">-- Choose Segment --</option>
              {segments.map(seg => (
                <option key={seg.id} value={seg.id}>{seg.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name (Site ID)</label>
            <input name="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g., Mumbai Central" className="w-full border p-2 rounded" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input name="branch_location" value={form.branch_location} onChange={(e) => setForm({ ...form, branch_location: e.target.value })} placeholder="e.g., Andheri East Area (Optional)" className="w-full border p-2 rounded" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white p-2 rounded font-semibold flex items-center justify-center gap-2">
            <span>+</span> {loading ? 'Adding...' : 'Add Branch'}
          </button>
        </div>
      </form>

      {/* Search Bar placed directly above the table, aligned to the right */}
      <div className="flex justify-end items-center mb-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search branches..."
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 mb-10">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Branch Name</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Admins (Username)</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSites.map((site, idx) => (
              <tr key={site.id} className={`hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="p-3 text-sm text-gray-500 font-mono">{site.id}</td>
                <td className="p-3 text-sm font-medium text-blue-600">
                  {editingId === site.id ?
                    <select value={editingSite.segment_id} onChange={(e) => setEditingSite({ ...editingSite, segment_id: e.target.value })} className="border p-1 rounded w-full text-xs">
                      <option value="">-- No Segment --</option>
                      {segments.map(seg => (
                        <option key={seg.id} value={seg.id}>{seg.name}</option>
                      ))}
                    </select> :
                    site.segment_name || '-'}
                </td>
                <td className="p-3 text-sm font-medium text-gray-900">
                  {editingId === site.id ?
                    <input name="location" value={editingSite.location} onChange={(e) => setEditingSite({ ...editingSite, location: e.target.value })} className="border p-1 rounded w-full" /> :
                    site.location}
                </td>
                <td className="p-3 text-sm text-gray-500">
                  {editingId === site.id ?
                    <input name="branch_location" value={editingSite.branch_location} onChange={(e) => setEditingSite({ ...editingSite, branch_location: e.target.value })} className="border p-1 rounded w-full" /> :
                    site.branch_location}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {site.admins && site.admins.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {site.admins.map((a, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="font-mono bg-gray-100 px-1 rounded">{a.username}</span>
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-gray-400 italic">No admins</span>}
                </td>
                <td className="p-3 text-sm">
                  {editingId === site.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(site.id)} className="text-green-600 font-medium">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 font-medium">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(site)} className="text-blue-600 font-medium">Edit</button>
                      <button onClick={() => handleDelete(site.id, site.location)} className="text-red-600 font-medium">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sites.length === 0 && !loading && <p className="text-center py-8 text-gray-500">No sites found.</p>}
        {sites.length > 0 && filteredSites.length === 0 && !loading && (
          <p className="text-center py-8 text-gray-500">No branches match your search "{searchQuery}".</p>
        )}
      </div>

    </div>
  );
};

export default AdminSites;
