import React, { useEffect, useState } from 'react';
import { getEndpoints } from '../constants';

interface Segment {
  id: number;
  name: string;
  description?: string;
}

interface MealSlot {
  category: string;
  startTime: string;
  endTime: string;
}

interface Canteen {
  id?: number;
  name: string;
  site: string;
  segment_id?: number;
  segment_name?: string;
  meal_slots?: MealSlot[];
}

const AdminCanteens: React.FC = () => {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const endpoints = getEndpoints();
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [form, setForm] = useState({ segment_id: '', site: '', name: '' });
  const [sites, setSites] = useState<string[]>([]);
  const [sitesWithSegments, setSitesWithSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilterSegment, setSelectedFilterSegment] = useState('All Segments');

  // Slot Editing State
  const [editingCanteen, setEditingCanteen] = useState<Canteen | null>(null);
  const [slotForm, setSlotForm] = useState<MealSlot>({ category: '', startTime: '', endTime: '' });

  // Fetch available sites and segments for dropdown
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('canteenAdminJWT');

        // Fetch sites with segment info
        const sitesRes = await fetch(endpoints.SITES);
        const sitesData = await sitesRes.json();
        let sitesArray: any[] = [];
        if (Array.isArray(sitesData.sites)) {
          sitesArray = sitesData.sites;
          setSitesWithSegments(sitesArray);
          setSites(sitesArray.map((s: any) => s.location));
        }

        // Fetch segments
        const segmentsRes = await fetch(`${endpoints.ADMIN_CANTEENS}/../../api/segments/index.php?action=list`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (segmentsRes.ok) {
          const segmentsData = await segmentsRes.json();
          let segmentsArray: Segment[] = [];
          if (Array.isArray(segmentsData)) {
            segmentsArray = segmentsData;
          } else if (segmentsData && segmentsData.data && Array.isArray(segmentsData.data)) {
            segmentsArray = segmentsData.data;
          }
          setSegments(segmentsArray);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
  }, []);

  const fetchCanteens = async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Create a map of site IDs to segment names
      const siteToSegment: { [key: string]: string } = {};
      sitesWithSegments.forEach((site: any) => {
        siteToSegment[site.location] = segments.find((s) => s.id === site.segment_id)?.name || '-';
      });

      // Fetch canteens for all sites since admin can see all
      const allCanteens: Canteen[] = [];

      for (const site of sites) {
        try {
          const res = await fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(site)}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (res.ok) {
            const data = await res.json();
            // Prefer details with full objects
            if (Array.isArray(data.details)) {
              allCanteens.push(...data.details.map((c: any) => ({
                name: c.name,
                site: c.site || site,
                segment_id: c.segment_id,
                segment_name: siteToSegment[c.site || site] || '-',
                meal_slots: c.meal_slots || [],
                id: c.id
              })));
            } else if (Array.isArray(data.canteens)) {
              // Fallback
              allCanteens.push(...data.canteens.map((name: string) => ({
                name,
                site,
                segment_name: siteToSegment[site] || '-',
                meal_slots: []
              })));
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch canteens for site ${site}:`, err);
        }
      }

      setCanteens(allCanteens);
    } catch (err: any) {
      console.error('Fetch canteens error:', err);
      setError(err.message || 'Failed to fetch canteens');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (sites.length > 0 && segments.length > 0) {
      fetchCanteens();
    }
  }, [sites, segments]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddCanteen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.site) {
      setError('Please select a site first');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      if (!token) throw new Error('Authentication required');

      // Find site ID for selected site (site is location in DB)
      const selectedSite = sitesWithSegments.find((s: any) => s.location === form.site);
      const branchId = selectedSite?.id || null;

      const payload = {
        ...form,
        site_id: selectedSite?.id,
        branch_id: branchId,
        segment_id: selectedSite?.segment_id
      };

      const res = await fetch(endpoints.ADMIN_CANTEENS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(errorData.error || `Failed to add canteen`);
      }

      setForm({ ...form, name: '' });
      await fetchCanteens();
      showNotification('Canteen added successfully! 🎉');
    } catch (err: any) {
      console.error('Add canteen error:', err);
      setError(err.message || 'Failed to add canteen');
    }
    setLoading(false);
  };

  const handleDelete = async (site: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the canteen "${name}"? This will delete all slots and feedback.`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const res = await fetch(`${endpoints.ADMIN_CANTEENS}?site=${encodeURIComponent(site)}&name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete');

      setCanteens(canteens.filter(c => !(c.site === site && c.name === name)));
      showNotification('Canteen deleted successfully');
      await fetchCanteens();
    } catch (err) {
      setError('Failed to delete canteen');
    }
    setLoading(false);
  };

  // --- Slot Management ---

  const handleOpenSlots = (canteen: Canteen) => {
    setEditingCanteen({ ...canteen, meal_slots: canteen.meal_slots || [] });
    setSlotForm({ category: '', startTime: '', endTime: '' });
  };

  const handleAddSlot = () => {
    if (!editingCanteen) return;
    if (!slotForm.category || !slotForm.startTime || !slotForm.endTime) {
      alert('Please fill all fields');
      return;
    }
    const updatedSlots = [...(editingCanteen.meal_slots || []), slotForm];
    setEditingCanteen({ ...editingCanteen, meal_slots: updatedSlots });
    setSlotForm({ category: '', startTime: '', endTime: '' });
  };

  const handleRemoveSlot = (index: number) => {
    if (!editingCanteen) return;
    const updated = [...(editingCanteen.meal_slots || [])];
    updated.splice(index, 1);
    setEditingCanteen({ ...editingCanteen, meal_slots: updated });
  };

  const handleSaveSlots = async () => {
    if (!editingCanteen) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const payload = {
        site: editingCanteen.site,
        name: editingCanteen.name,
        meal_slots: editingCanteen.meal_slots || []
      };

      const res = await fetch(endpoints.ADMIN_CANTEENS, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save slots');

      showNotification('Meal slots updated!');
      setEditingCanteen(null);
      // Wait a bit for DB to commit if needed, then fetch
      setTimeout(() => fetchCanteens(), 500);
    } catch (err) {
      setError('Failed to save meal slots');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-xl mt-6">
      {/* Success Popup */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-down flex items-center gap-2">
          <span className="text-xl">✅</span><span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg py-3 mb-6 shadow flex items-center justify-between px-4">
        <h2 className="text-xl font-bold text-white">Manage Canteens</h2>
        <span className="text-white font-semibold text-base">Total: {canteens.length}</span>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      {/* Add Canteen Form */}
      <form onSubmit={handleAddCanteen} className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">ADD NEW CANTEEN</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Segment</label>
            <select
              name="segment_id"
              value={form.segment_id}
              onChange={e => setForm({ ...form, segment_id: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">-- Choose Segment --</option>
              {segments.map((seg) => <option key={seg.id} value={seg.id}>{seg.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Branch</label>
            <select
              name="site"
              value={form.site}
              onChange={e => setForm({ ...form, site: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">-- Select Branch --</option>
              {sites.map((site, i) => <option key={i} value={site}>{site}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canteen Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleInputChange}
              placeholder="Enter canteen name..."
              className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading || !form.site || !form.segment_id}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-semibold flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>{loading ? 'Adding...' : 'Add Canteen'}
            </button>
          </div>
        </div>
      </form>

      {/* Filter Bar */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Filter By Segment:</label>
          <select
            value={selectedFilterSegment}
            onChange={(e) => setSelectedFilterSegment(e.target.value)}
            className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-primary-500 min-w-[200px] text-sm font-semibold"
          >
            <option value="All Segments">All Segments</option>
            {segments.map((seg) => (
              <option key={seg.id} value={seg.name}>{seg.name}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-xs font-bold text-gray-400">
          Showing {canteens.filter(c => selectedFilterSegment === 'All Segments' || c.segment_name === selectedFilterSegment).length} Canteens
        </div>
      </div>

      {/* Canteens Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Site / Branch</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Canteen Name</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Meal Slots</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {canteens
              .filter(c => selectedFilterSegment === 'All Segments' || c.segment_name === selectedFilterSegment)
              .map((canteen, idx) => (
                <tr key={`${canteen.site}-${canteen.name}-${idx}`} className={`hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="p-3 text-sm font-medium text-blue-600">{canteen.segment_name || '-'}</td>
                  <td className="p-3 text-sm font-medium text-gray-900">{canteen.site}</td>
                  <td className="p-3 text-sm text-gray-600">{canteen.name}</td>
                  <td className="p-3 text-sm">
                    {canteen.meal_slots && canteen.meal_slots.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {canteen.meal_slots.map((slot, sIdx) => (
                          <span key={sIdx} className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded border border-green-200" title={`${slot.startTime} - ${slot.endTime}`}>
                            {slot.category}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">No slots</span>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenSlots(canteen)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                      >
                        <span>⚡</span> Manage Slots
                      </button>
                      <button
                        onClick={() => handleDelete(canteen.site, canteen.name)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1"
                      >
                        <span>🗑️</span> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {canteens.length === 0 && !loading && (
          <p className="text-center py-6 text-gray-500">No canteens found. Add one above.</p>
        )}
      </div>

      {/* Edit Slots Modal */}
      {editingCanteen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all scale-100">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Manage Slots</h3>
                <p className="text-sm text-gray-500">For <span className="font-semibold text-primary-600">{editingCanteen.name}</span> ({editingCanteen.site})</p>
              </div>
              <button onClick={() => setEditingCanteen(null)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">

              {/* Add New Slot Section */}
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 mb-8 shadow-sm">
                <h4 className="font-semibold mb-4 text-blue-900 flex items-center gap-2">
                  <span>➕</span> Add New Slot
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Category</label>
                    <input
                      placeholder="e.g. Lunch"
                      className="w-full text-sm p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      value={slotForm.category}
                      onChange={(e) => setSlotForm({ ...slotForm, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Start Time</label>
                    <input
                      type="time"
                      className="w-full text-sm p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      value={slotForm.startTime}
                      onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">End Time</label>
                    <input
                      type="time"
                      className="w-full text-sm p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      value={slotForm.endTime}
                      onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddSlot}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg transition-all shadow hover:shadow-lg flex items-center justify-center gap-2"
                >
                  Add Slot to List
                </button>
              </div>

              {/* Existing Slots List */}
              <div>
                <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <span>📋</span> Configured Slots
                </h4>
                {editingCanteen.meal_slots && editingCanteen.meal_slots.length > 0 ? (
                  <div className="space-y-3">
                    {editingCanteen.meal_slots.map((slot, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-4">
                          <div className="bg-gray-100 p-2 rounded-lg text-2xl group-hover:bg-primary-50 transition-colors">
                            ⏰
                          </div>
                          <div>
                            <span className="font-bold text-gray-800 text-lg">{slot.category}</span>
                            <div className="text-sm text-gray-500 font-medium">
                              {slot.startTime} <span className="text-gray-300 mx-1">➜</span> {slot.endTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSlotForm(slot);
                              const updated = [...(editingCanteen.meal_slots || [])];
                              updated.splice(i, 1);
                              setEditingCanteen({ ...editingCanteen, meal_slots: updated });
                            }}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveSlot(i)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-400 font-medium">No slots configured yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Add a slot above to get started.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3 cursor-default">
              <button
                onClick={() => setEditingCanteen(null)}
                className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSlots}
                disabled={loading}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2"
              >
                {loading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCanteens;