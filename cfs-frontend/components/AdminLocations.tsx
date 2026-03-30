import React, { useState, useEffect } from 'react';
import { getEndpoints, API_URL } from '../constants';

type Site = {
  id?: number;
  location: string;
  branch_location: string;
  created_at: string;
};

const AdminLocations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sites, setSites] = useState<Site[]>([]);
  const endpoints = getEndpoints();
  const [siteCanteens, setSiteCanteens] = useState<Record<string, string[]>>({});
  const [expandedSite, setExpandedSite] = useState<string | null>(null);
  const [newCanteenPerSite, setNewCanteenPerSite] = useState<Record<string, string>>({});
  const [canteenMsgPerSite, setCanteenMsgPerSite] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  // Add canteen for a specific site
  const handleAddCanteenForSite = async (siteLocation: string) => {
    const newCanteen = newCanteenPerSite[siteLocation]?.trim();
    if (!newCanteen) {
      setCanteenMsgPerSite(msgs => ({ ...msgs, [siteLocation]: 'Enter canteen name.' }));
      return;
    }
    try {
      const res = await fetch(`${endpoints.ADMIN_CANTEENS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: siteLocation, name: newCanteen })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add canteen');

      setSuccessMessage('Canteen added successfully!');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setSuccessMessage('');
      }, 3000);

      setCanteenMsgPerSite(msgs => ({ ...msgs, [siteLocation]: 'Canteen added!' }));
      setNewCanteenPerSite(vals => ({ ...vals, [siteLocation]: '' }));

      // Refresh canteens for this site
      const res2 = await fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(siteLocation)}`);
      const data2 = await res2.json();
      setSiteCanteens(c => ({ ...c, [siteLocation]: Array.isArray(data2.canteens) ? data2.canteens : [] }));
    } catch (err: any) {
      setCanteenMsgPerSite(msgs => ({ ...msgs, [siteLocation]: err.message }));
    }
  };
  // Delete canteen for a specific site
  const handleDeleteCanteenForSite = async (siteLocation: string, canteenName: string) => {
    if (!window.confirm('Are you sure you want to delete this canteen?')) return;

    try {
      const res = await fetch(`${endpoints.ADMIN_CANTEENS}?site=${encodeURIComponent(siteLocation)}&name=${encodeURIComponent(canteenName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete canteen');

      setSuccessMessage('Canteen deleted successfully!');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setSuccessMessage('');
      }, 3000);

      setCanteenMsgPerSite(msgs => ({ ...msgs, [siteLocation]: 'Canteen deleted!' }));
      // Refresh canteens for this site
      const res2 = await fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(siteLocation)}`);
      const data2 = await res2.json();
      setSiteCanteens(c => ({ ...c, [siteLocation]: Array.isArray(data2.canteens) ? data2.canteens : [] }));
    } catch (err: any) {
      setCanteenMsgPerSite(msgs => ({ ...msgs, [siteLocation]: err.message }));
    }
  };
  const [newLocation, setNewLocation] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [error, setError] = useState('');
  const [editSiteId, setEditSiteId] = useState<number | null>(null);
  const [editLocation, setEditLocation] = useState('');
  const [editBranchLocation, setEditBranchLocation] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetch(endpoints.SITES)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.sites)) setSites(data.sites);
        else setSites([]);
      })
      .catch(() => setSites([]));
  }, []);

  // Fetch canteens for all sites
  useEffect(() => {
    async function fetchCanteens() {
      const canteensMap: Record<string, string[]> = {};
      for (const site of sites) {
        try {
          const res = await fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(site.location)}`);
          const data = await res.json();
          canteensMap[site.location] = Array.isArray(data.canteens) ? data.canteens : [];
        } catch {
          canteensMap[site.location] = [];
        }
      }
      setSiteCanteens(canteensMap);
    }
    if (sites.length > 0) fetchCanteens();
  }, [sites]);

  // Add site handler
  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!newLocation.trim() || !newBranchLocation.trim()) {
      setError('Both fields are required.');
      return;
    }
    try {
      const res = await fetch(endpoints.SITES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: newLocation, branch_location: newBranchLocation })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add site');

      setNewLocation('');
      setNewBranchLocation('');
      setSuccessMessage('Site added successfully!');
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        setSuccessMessage('');
      }, 3000);

      // Refresh site list
      const resSites = await fetch(endpoints.SITES);
      const sitesData = await resSites.json();
      if (Array.isArray(sitesData.sites)) {
        setSites(sitesData.sites);
        // Broadcast event to notify other components about site list update
        window.dispatchEvent(new CustomEvent('sitesUpdated', { detail: sitesData.sites }));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };
  return (
    <>
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {successMessage}
        </div>
      )}
      <div className="card" style={{ maxWidth: 340, margin: '8px auto', padding: '12px 8px 4px 8px' }}>
        <form onSubmit={handleAddSite} className="flex flex-row gap-2 mb-3 items-center flex-nowrap">
          <input
            type="text"
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
            placeholder="Location"
            className="p-1 rounded border border-gray-300 text-xs"
            style={{ width: '90px', minWidth: '60px', height: '26px', fontSize: '12px' }}
            required
          />
          <input
            type="text"
            value={newBranchLocation}
            onChange={e => setNewBranchLocation(e.target.value)}
            placeholder="Branch Location"
            className="p-1 rounded border border-gray-300 text-xs"
            style={{ width: '90px', minWidth: '60px', height: '26px', fontSize: '12px' }}
            required
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-1 py-0 rounded hover:bg-primary-700 text-xs min-w-[48px]"
            style={{ minWidth: '48px', height: '24px', padding: '0 6px', fontSize: '12px' }}
            disabled={!newLocation.trim() || !newBranchLocation.trim()}
          >
            Add
          </button>
        </form>
        {error && <p className="text-red-500 mb-4">{error}</p>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', margin: '8px 0 4px 0', gap: '6px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search locations..."
          className="p-1 rounded border border-gray-300 text-xs"
          style={{ width: '200px', fontSize: '13px' }}
        />
        <button
          type="button"
          className="bg-primary-600 text-white px-2 py-0 rounded text-xs"
          style={{ minWidth: '40px', height: '24px', fontSize: '12px', padding: '0 8px', marginLeft: '2px' }}
          onClick={() => { /* Optionally trigger search/filter logic here */ }}
        >Search</button>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">ID</th>
              <th className="p-2">Location</th>
              <th className="p-2">Branch Location</th>
              <th className="p-2">Date</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.filter(site =>
              site.location.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
              site.branch_location.toLowerCase().includes(searchTerm?.toLowerCase() || '')
            ).map(site => (
              <React.Fragment key={(site.id ?? '') + site.location + site.branch_location}>
                <tr className="border-b">
                  <td className="p-2">{site.id ?? ''}</td>
                  <td className="p-2">{site.location}</td>
                  <td className="p-2">{site.branch_location}</td>
                  <td className="p-2">{site.created_at ? new Date(site.created_at).toLocaleDateString() : ''}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditSiteId(site.id ?? null);
                        setEditLocation(site.location);
                        setEditBranchLocation(site.branch_location);
                      }}
                      className="bg-blue-500 text-white px-2 py-0.5 rounded-md mr-1 text-xs">Edit</button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to delete this site?')) return;
                        try {
                          const res = await fetch(`${endpoints.SITES}/${site.id}`, { method: 'DELETE' });
                          if (!res.ok) throw new Error('Failed to delete site');

                          setSuccessMessage('Site deleted successfully!');
                          setShowSuccessMessage(true);

                          setTimeout(() => {
                            setShowSuccessMessage(false);
                            setSuccessMessage('');
                          }, 3000);

                          const resSites = await fetch(endpoints.SITES);
                          const sitesData = await resSites.json();
                          if (Array.isArray(sitesData.sites)) {
                            setSites(sitesData.sites);
                            window.dispatchEvent(new CustomEvent('sitesUpdated', { detail: sitesData.sites }));
                          }
                        } catch (err) {
                          setError('Failed to delete site. Please try again.');
                        }
                      }}
                      className="bg-red-500 text-white px-2 py-0.5 rounded-md text-xs">Delete</button>
                    <button
                      className="bg-primary-600 text-white px-1 py-0 rounded text-xs min-w-[60px] h-[24px] border border-primary-700 shadow-sm"
                      style={{ padding: '0 8px', fontSize: '12px', minWidth: '60px', height: '24px', fontWeight: 500 }}
                      onClick={() => setExpandedSite(expandedSite === site.location ? null : site.location)}
                    >
                      {expandedSite === site.location ? 'Hide' : 'Show'} Canteens
                    </button>
                  </td>
                </tr>
                {expandedSite === site.location && (
                  <tr>
                    <td colSpan={5} className="bg-gray-50 p-2 text-xs">
                      <b>Canteens for {site.location}:</b>
                      <ul className="list-disc ml-4 mt-1">
                        {(siteCanteens[site.location] || []).length === 0 ? (
                          <li className="text-gray-400">No canteens found.</li>
                        ) : (
                          siteCanteens[site.location].map((c, idx) => (
                            <li key={c + idx} className="flex items-center gap-2">
                              {c}
                              <button
                                className="bg-red-500 text-white px-1 py-0 rounded text-xs ml-2 min-w-[48px] h-[22px]"
                                style={{ padding: '0 6px', fontSize: '12px', minWidth: '48px', height: '22px' }}
                                onClick={() => handleDeleteCanteenForSite(site.location, c)}
                              >Delete</button>
                            </li>
                          ))
                        )}
                      </ul>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={newCanteenPerSite[site.location] || ''}
                          onChange={e => setNewCanteenPerSite(vals => ({ ...vals, [site.location]: e.target.value }))}
                          placeholder="Add canteen..."
                          className="p-1 rounded border border-gray-300 text-xs"
                          style={{ minWidth: '120px' }}
                        />
                        <button
                          className="bg-primary-600 text-white px-1 py-0 rounded text-xs min-w-[48px] h-[24px]"
                          style={{ padding: '0 6px', fontSize: '12px', minWidth: '48px', height: '24px' }}
                          onClick={() => handleAddCanteenForSite(site.location)}
                        >Add</button>
                      </div>
                      {canteenMsgPerSite[site.location] && (
                        <div className={canteenMsgPerSite[site.location].includes('added') ? 'text-green-600 mt-1' : 'text-red-500 mt-1'}>
                          {canteenMsgPerSite[site.location]}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {/* Edit Site Modal/Inline Form */}
      {editSiteId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 min-w-[320px] max-w-[90vw]">
            <h3 className="text-lg font-bold mb-2">Edit Site</h3>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setEditError('');
                if (!editLocation.trim() || !editBranchLocation.trim()) {
                  setEditError('Both fields are required.');
                  return;
                }
                try {
                  const res = await fetch(`${endpoints.SITES}/${editSiteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ location: editLocation, branch_location: editBranchLocation })
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to update site');

                  setEditSiteId(null);
                  setSuccessMessage('Site updated successfully!');
                  setShowSuccessMessage(true);

                  setTimeout(() => {
                    setShowSuccessMessage(false);
                    setSuccessMessage('');
                  }, 3000);

                  // Refresh site list
                  const resSites = await fetch(endpoints.SITES);
                  const sitesData = await resSites.json();
                  if (Array.isArray(sitesData.sites)) {
                    setSites(sitesData.sites);
                    window.dispatchEvent(new CustomEvent('sitesUpdated', { detail: sitesData.sites }));
                  }
                } catch (err: any) {
                  setEditError(err.message);
                }
              }}
              className="flex flex-col gap-3"
            >
              <input
                type="text"
                value={editLocation}
                onChange={e => setEditLocation(e.target.value)}
                placeholder="Location"
                className="p-2 rounded border border-gray-300 text-sm"
                required
              />
              <input
                type="text"
                value={editBranchLocation}
                onChange={e => setEditBranchLocation(e.target.value)}
                placeholder="Branch Location"
                className="p-2 rounded border border-gray-300 text-sm"
                required
              />
              {editError && <div className="text-red-500 text-xs">{editError}</div>}
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-3 py-1 rounded text-xs"
                >Save</button>
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs"
                  onClick={() => setEditSiteId(null)}
                >Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminLocations;
