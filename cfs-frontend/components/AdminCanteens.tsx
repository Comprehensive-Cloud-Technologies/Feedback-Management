import React, { useEffect, useState, useMemo } from 'react';
import { getEndpoints } from '../constants';
import { SearchInput, matchesSearch } from './SearchInput';
import { SearchableSelect } from './SearchableSelect';

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
  is_active?: number;
  slug?: string;
  site_slug?: string;
}

const AdminCanteens: React.FC = () => {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const endpoints = getEndpoints();
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  const [form, setForm] = useState({ segment_id: '', site: '', name: '' });
  const [sites, setSites] = useState<string[]>([]);
  const [sitesWithSegments, setSitesWithSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilterSegment, setSelectedFilterSegment] = useState('All Segments');

  // Slot Editing State
  const [editingCanteen, setEditingCanteen] = useState<Canteen | null>(null);
  const [slotForm, setSlotForm] = useState<MealSlot>({ category: '', startTime: '', endTime: '' });

  // Canteen Name Editing State
  const [renamingCanteen, setRenamingCanteen] = useState<Canteen | null>(null);
  const [newCanteenName, setNewCanteenName] = useState('');

  // Segment options for SearchableSelect
  const segmentOptions = useMemo(() => {
    return segments.map(seg => ({
      value: String(seg.id),
      label: seg.name
    }));
  }, [segments]);

  // Available Branch options depending on the selected Segment
  const availableBranchOptions = useMemo(() => {
    if (!form.segment_id) return [];
    return sitesWithSegments
      .filter((s: any) => String(s.segment_id) === String(form.segment_id))
      .map((s: any) => ({
        value: s.location,
        label: s.location
      }));
  }, [sitesWithSegments, form.segment_id]);

  const handleSegmentChange = (segId: string) => {
    setForm(prev => ({
      ...prev,
      segment_id: segId,
      site: '' // Changing Segment resets Branch
    }));
  };

  const handleBranchChange = (branchSite: string) => {
    setForm(prev => ({
      ...prev,
      site: branchSite
    }));
  };

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
                id: c.id,
                is_active: c.is_active ?? 1,
                slug: c.slug || '',
                site_slug: c.site_slug || ''
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
    if (!slotForm.category) {
      alert('Please enter a category name');
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

  const handleRenameCanteen = async () => {
    if (!renamingCanteen || !newCanteenName.trim()) return;
    if (newCanteenName.trim() === renamingCanteen.name) {
      setRenamingCanteen(null);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const res = await fetch(endpoints.ADMIN_CANTEENS, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          site: renamingCanteen.site,
          name: renamingCanteen.name,
          new_name: newCanteenName.trim()
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to rename canteen');
      }
      showNotification('Canteen renamed successfully!');
      setRenamingCanteen(null);
      setNewCanteenName('');
      await fetchCanteens();
    } catch (err: any) {
      setError(err.message || 'Failed to rename canteen');
    }
    setLoading(false);
  };

  const handleToggleActive = async (canteen: Canteen) => {
    const newStatus = canteen.is_active ? 0 : 1;
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const res = await fetch(endpoints.ADMIN_CANTEENS, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          site: canteen.site,
          name: canteen.name,
          is_active: newStatus
        })
      });
      if (!res.ok) throw new Error('Failed to update status');
      showNotification(`Canteen ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      await fetchCanteens();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle canteen status');
    }
    setLoading(false);
  };

  const filteredCanteens = canteens.filter((c) => {
    const matchesSegment = selectedFilterSegment === 'All Segments' || c.segment_name === selectedFilterSegment;
    const matchesSearchText = matchesSearch(searchQuery, [c.name, c.site, c.segment_name]);
    return matchesSegment && matchesSearchText;
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

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg py-3 mb-6 shadow flex items-center justify-between px-4">
        <h2 className="text-xl font-bold text-white">Manage Canteens</h2>
        <span className="text-white font-semibold text-base">
          {searchQuery.trim() || selectedFilterSegment !== 'All Segments'
            ? `Showing ${filteredCanteens.length} of ${canteens.length}`
            : `Total: ${canteens.length}`}
        </span>
      </div>

      {/* Add Canteen Form */}
      <form onSubmit={handleAddCanteen} className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">ADD NEW CANTEEN</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Segment</label>
            <SearchableSelect
              options={segmentOptions}
              value={form.segment_id}
              onChange={handleSegmentChange}
              placeholder="-- Choose Segment --"
              clearable
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Branch</label>
            <SearchableSelect
              options={availableBranchOptions}
              value={form.site}
              onChange={handleBranchChange}
              placeholder={form.segment_id ? "-- Select Branch --" : "-- Select Segment First --"}
              disabled={!form.segment_id}
              clearable
              required
            />
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
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
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
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search canteens, branch, segment..."
          className="w-full sm:w-72"
        />
        <div className="sm:ml-auto text-xs font-bold text-gray-400">
          {searchQuery.trim() || selectedFilterSegment !== 'All Segments'
            ? `Showing ${filteredCanteens.length} of ${canteens.length} Canteens`
            : `Showing ${canteens.length} Canteens`}
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
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Meal Slots</th>
              <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCanteens.map((canteen, idx) => (
                <tr key={`${canteen.site}-${canteen.name}-${idx}`} className={`hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="p-3 text-sm font-medium text-blue-600">{canteen.segment_name || '-'}</td>
                  <td className="p-3 text-sm font-medium text-gray-900">{canteen.site}</td>
                  <td className="p-3 text-sm text-gray-600">{canteen.name}</td>
                  <td className="p-3 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${canteen.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {canteen.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {canteen.meal_slots && canteen.meal_slots.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {canteen.meal_slots.map((slot, sIdx) => (
                          <span key={sIdx} className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded border border-green-200" title={slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : 'No time set'}>
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
                        onClick={() => { setRenamingCanteen(canteen); setNewCanteenName(canteen.name); }}
                        className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center gap-1"
                      >
                        <span>✏️</span> Edit
                      </button>
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
                      <button
                        onClick={() => handleToggleActive(canteen)}
                        className={`font-medium text-sm flex items-center gap-1 ${canteen.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                      >
                        <span>{canteen.is_active ? '⏸️' : '▶️'}</span> {canteen.is_active ? 'Deactivate' : 'Activate'}
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
        {canteens.length > 0 && filteredCanteens.length === 0 && !loading && (
          <p className="text-center py-6 text-gray-500">No canteens match your filters or search.</p>
        )}
      </div>

      {/* Rename Canteen Modal */}
      {renamingCanteen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all scale-100">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Rename Canteen</h3>
                <p className="text-sm text-gray-500">Current: <span className="font-semibold text-primary-600">{renamingCanteen.name}</span></p>
              </div>
              <button onClick={() => { setRenamingCanteen(null); setNewCanteenName(''); }} className="text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Canteen Name</label>
              <input
                type="text"
                value={newCanteenName}
                onChange={(e) => setNewCanteenName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter new canteen name"
              />
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => { setRenamingCanteen(null); setNewCanteenName(''); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >Cancel</button>
              <button
                onClick={handleRenameCanteen}
                disabled={!newCanteenName.trim() || newCanteenName.trim() === renamingCanteen.name}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >Save</button>
            </div>
          </div>
        </div>
      )}

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
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Start Time <span className="text-gray-400 normal-case">(Optional)</span></label>
                    <input
                      type="time"
                      className="w-full text-sm p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      value={slotForm.startTime}
                      onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">End Time <span className="text-gray-400 normal-case">(Optional)</span></label>
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
                            {(slot.startTime || slot.endTime) && (
                              <div className="text-sm text-gray-500 font-medium">
                                {slot.startTime || '--:--'} <span className="text-gray-300 mx-1">➜</span> {slot.endTime || '--:--'}
                              </div>
                            )}
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