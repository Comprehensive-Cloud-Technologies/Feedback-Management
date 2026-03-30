import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { getEndpoints } from '../constants';

interface Segment {
  id: number;
  name: string;
  description?: string;
}

const AdminFeedback: React.FC = () => {
  const [feedback, setFeedback] = useState([]);
  const endpoints = getEndpoints();
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState<number>(0);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<{ [key: string]: any }>({});

  // Filtering State
  const [selectedSegment, setSelectedSegment] = useState<string>('All Segments');
  const [selectedSite, setSelectedSite] = useState<string>('All Sites');
  const [selectedCanteen, setSelectedCanteen] = useState<string>('All Canteens');
  const [selectedMealSlot, setSelectedMealSlot] = useState<string>('All Slots');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [availableCanteens, setAvailableCanteens] = useState<string[]>([]);

  // Fetch Sites and Segments
  useEffect(() => {
    const fetchSitesAndSegments = async () => {
      try {
        const token = localStorage.getItem('canteenAdminJWT');
        
        // Fetch sites
        const sitesRes = await fetch(endpoints.SITES, { headers: { Authorization: `Bearer ${token}` } });
        const sitesData = await sitesRes.json();
        if (sitesData && Array.isArray(sitesData.sites)) setSites(sitesData.sites);
        
        // Fetch segments
        const segmentsRes = await fetch(`${endpoints.SITES}/../../api/segments/index.php?action=list`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
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
      } catch (e) { 
        console.error('Error fetching sites/segments for filter', e); 
      }
    };
    fetchSitesAndSegments();
  }, []);

  // Compute available canteens when site or segment changes
  useEffect(() => {
    if (selectedSite === 'All Sites') {
      setAvailableCanteens([]);
      setSelectedCanteen('All Canteens');
      return;
    }
    const token = localStorage.getItem('canteenAdminJWT');
    fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(selectedSite)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.canteens)) setAvailableCanteens(data.canteens);
        else setAvailableCanteens([]);
      })
      .catch(() => setAvailableCanteens([]));
    setSelectedCanteen('All Canteens');
  }, [selectedSite, selectedSegment]);

  // Filter Logic
  const filteredFeedback = feedback.filter((fb: any) => {
    // Segment filter: find segment ID from site and check if it matches
    if (selectedSegment !== 'All Segments') {
      const selectedSegmentId = parseInt(selectedSegment);
      const siteWithSegment = sites.find((s: any) => s.location === fb.site);
      if (!siteWithSegment || siteWithSegment.segment_id !== selectedSegmentId) return false;
    }
    if (selectedSite !== 'All Sites' && fb.site !== selectedSite) return false;
    if (selectedCanteen !== 'All Canteens' && (fb.canteen || fb.canteen_id) !== selectedCanteen) return false;
    if (selectedMealSlot !== 'All Slots' && (fb.meal_category || 'Other') !== selectedMealSlot) return false;
    return true;
  });

  // Extract unique meal slots dynamically from current feedback [NEW]
  const uniqueMealSlots = Array.from(new Set(feedback.map((fb: any) => fb.meal_category || 'Other'))).sort();

  const fetchFeedback = async () => {
    setError('');
    try {
      // Only fetch feedback here. Questions are fetched on-demand per-site when viewing details.
      const token = localStorage.getItem('canteenAdminJWT');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const res = await fetch(endpoints.ADMIN_FEEDBACK, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse response' }));
        throw new Error(errorData.error || `Feedback API Error: ${res.status}`);
      }

      const data = await res.json();

      // Ensure we have an array of feedback
      const feedbackArray = Array.isArray(data) ? data :
        (data.feedback ? (Array.isArray(data.feedback) ? data.feedback : [data.feedback]) : []);

      // Process each feedback entry
      const processed = feedbackArray.map(fb => {
        if (!fb || !fb.site) return null;

        let overallRating = 0;
        let responses = [];
        const siteQuestions = questions[fb.site.trim()] || [];

        // Handle responses array (responses may be JSON string in DB)
        let rawResponses: any = fb.responses;
        if (typeof rawResponses === 'string') {
          try {
            rawResponses = JSON.parse(rawResponses);
          } catch (e) {
            rawResponses = [];
          }
        }

        if (Array.isArray(rawResponses) && rawResponses.length > 0) {
          responses = rawResponses.map(r => {
            // normalize possible id keys
            const qid = r.question_id ?? r.questionId ?? r.id ?? r.question;
            const questionData = siteQuestions.find(q => String(q.id) === String(qid)) || {};
            return {
              ...r,
              question_id: String(qid),
              question_text: questionData.question_text || r.question_text || r.text || 'Unknown Question',
              emoji: questionData.emoji || r.emoji || '😐'
            };
          });

          // Calculate overall rating from valid responses
          const validRatings = responses.filter(r => typeof r.rating === 'number');
          if (validRatings.length > 0) {
            overallRating = validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length;
            overallRating = Math.round(overallRating * 100) / 100;
          }
        }
        // Handle single rating
        else if (typeof fb.rating === 'number') {
          overallRating = fb.rating;
          if (fb.question_id) {
            const questionData = siteQuestions.find(q => String(q.id) === String(fb.question_id)) || {};
            responses = [{
              question_id: fb.question_id,
              rating: fb.rating,
              question_text: questionData.question_text || 'Unknown Question',
              emoji: questionData.emoji || '😐'
            }];
          }
        }

        return {
          ...fb,
          responses,
          overallRating,
          timestamp: fb.timestamp || fb.created_at || Date.now(),
          site: fb.site || 'Unknown Site',
          canteen_id: fb.canteen_id || fb.canteen || 'Unknown Canteen'
        };
      }).filter(Boolean) // Remove null entries
        .sort((a, b) => { // Sort by timestamp
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB.getTime() - dateA.getTime();
        });

      setFeedback(processed);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch questions for a specific site on demand
  const loadQuestionsForSite = async (rawSite: string) => {
    if (!rawSite) return;
    const site = rawSite.trim();
    // already loaded
    if (questions[site]) return;
    try {
      const token = localStorage.getItem('canteenAdminJWT') || '';
      const url = `${endpoints.QUESTIONS}?site=${encodeURIComponent(site)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody.error || `Questions API returned ${res.status}`;
        console.warn('Failed to load questions for site', site, msg);
        setError(`Failed to load questions for ${site}: ${msg}`);
        setQuestions(prev => ({ ...prev, [site]: [] }));
        return;
      }
      const body = await res.json().catch(() => ({}));
      const arr = Array.isArray(body) ? body : (body.questions || []);
      setQuestions(prev => ({ ...prev, [site]: arr }));
    } catch (err) {
      console.error('Error loading questions for site', site, err);
      setQuestions(prev => ({ ...prev, [site]: [] }));
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleEdit = (id: string, rating: number) => {
    setEditingId(id);
    setEditingRating(rating);
  };

  const handleSave = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`${endpoints.ADMIN_FEEDBACK}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: editingRating })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update feedback');
      setEditingId(null);
      setEditingRating(0);
      fetchFeedback();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const res = await fetch(`${endpoints.ADMIN_FEEDBACK}?id=${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse response' }));
        throw new Error(errorData.error || `Failed to delete feedback: ${res.status}`);
      }

      setDeleteId(null);
      await fetchFeedback(); // Refresh the feedback list
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete feedback');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-2xl mt-10">
      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-xl py-3 px-4 mb-4 shadow flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white whitespace-nowrap">Manage Feedback</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center flex-1 justify-center md:justify-end">
          <select
            value={selectedSegment}
            onChange={e => setSelectedSegment(e.target.value)}
            className="px-2 py-1 rounded text-sm min-w-[120px]"
          >
            <option value="All Segments">All Segments</option>
            {segments.map((s: Segment) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            value={selectedSite}
            onChange={e => setSelectedSite(e.target.value)}
            className="px-2 py-1 rounded text-sm min-w-[120px]"
          >
            <option value="All Sites">All Sites</option>
            {sites.map((s: any) => <option key={s.location} value={s.location}>{s.location}</option>)}
          </select>

          <select
            value={selectedCanteen}
            onChange={e => setSelectedCanteen(e.target.value)}
            className="px-2 py-1 rounded text-sm min-w-[120px]"
            disabled={selectedSite === 'All Sites'}
          >
            <option value="All Canteens">All Canteens</option>
            {availableCanteens.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Meal Slot Filter */}
          <select
            value={selectedMealSlot}
            onChange={e => setSelectedMealSlot(e.target.value)}
            className="px-2 py-1 rounded text-sm min-w-[120px]"
          >
            <option value="All Slots">All Slots</option>
            {uniqueMealSlots.map((slot: string) => <option key={slot} value={slot}>{slot}</option>)}
          </select>

          <button
            className="bg-white text-primary-600 hover:bg-gray-100 px-3 py-1 rounded font-bold text-xs shadow transition-colors"
            onClick={() => fetchFeedback()}
          >
            Refresh
          </button>

          {/* Export PDF Button */}
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-bold text-xs shadow transition-colors"
            onClick={() => window.print()}
          >
            Export PDF
          </button>

          <button
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-bold text-xs shadow transition-colors"
            onClick={() => {
              let csvContent = 'data:text/csv;charset=utf-8,';
              // Add BOM for Excel correct display of characters
              csvContent += '\uFEFF';
              csvContent += '"ID","Timestamp","Site","Canteen","Username","Meal Slot","OverallRating","Response Details"\r\n';
              filteredFeedback.forEach((fb: any) => {
                // Format responses into a single string for the CSV cell
                const responseDetails = (fb.responses || []).map((r: any) =>
                  `${r.question_text || 'Q'}: ${r.rating} ${r.emoji || ''}`
                ).join(' | ');

                const row = [
                  `"${fb.id}"`,
                  `"${new Date(fb.timestamp).toLocaleString()}"`,
                  `"${fb.site}"`,
                  `"${fb.canteen || fb.canteen_id}"`,
                  `"${fb.username || ''}"`,
                  `"${fb.meal_category || 'Other'}"`,
                  `"${fb.overallRating}"`,
                  `"${responseDetails.replace(/"/g, '""')}"` // Escape quotes
                ];
                csvContent += row.join(',') + '\r\n';
              });
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', 'feedback_submissions.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Export CSV ({filteredFeedback.length})
          </button>

          {/* Print Styles for PDF Export */}
          <style>{`
            @media print {
              @page { size: A4 landscape; margin: 10mm; }
              body * { visibility: hidden; }
              .feedback-table-container, .feedback-table-container * { visibility: visible; }
              .feedback-table-container { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                overflow: visible !important;
              }
              /* Hide "Actions" column (last column) */
              th:last-child, td:last-child { display: none; }
              /* Table styling for print */
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th, td { border: 1px solid #333 !important; padding: 4px; text-align: left; }
              thead tr { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
            }
          `}</style>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
      <div className="overflow-x-auto feedback-table-container">
        <table className="w-full border-collapse mb-6 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border">Timestamp</th>
              <th className="p-3 border">Site</th>
              <th className="p-3 border">Canteen</th>
              <th className="p-3 border">Username</th>
              <th className="p-3 border">Meal Slot</th>
              <th className="p-3 border">Overall Rating</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedback.map((fb: any, idx: number) => (
              <tr key={fb.id} className={"transition-colors duration-200 " + (idx % 2 === 0 ? "bg-white" : "bg-gray-50") + " hover:bg-primary-50"}>
                <td className="p-3 border">{new Date(fb.timestamp).toLocaleString()}</td>
                <td className="p-3 border">{fb.site}</td>
                <td className="p-3 border">{fb.canteen || fb.canteen_id}</td>
                <td className="p-3 border">{fb.username || <span style={{ color: '#aaa' }}>-</span>}</td>
                <td className="p-3 border">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100 font-medium">
                    {fb.meal_category || 'Other'}
                  </span>
                </td>
                <td className="p-3 border">
                  <span className="font-bold text-primary-700">{fb.overallRating}</span>
                </td>
                <td className="p-3 border">
                  <div className="flex gap-2">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow text-xs"
                      onClick={async () => {
                        await loadQuestionsForSite(fb.site.trim());
                        setDetailsId(fb.id);
                      }}
                    >
                      View Details
                    </button>
                    <button onClick={() => handleDelete(fb.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow text-xs">
                      <span className="icon"><FaTrash /></span> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredFeedback.length === 0 && <p className="text-gray-500 text-center">No feedback submissions found.</p>}
      {/* Modal for question-wise ratings */}
      {detailsId && (() => {
        const fb = feedback.find((f: any) => f.id === detailsId);
        if (!fb) return null;

        const siteQuestions = questions[fb.site.trim()] || [];
        const responsesMap = (fb.responses || []).reduce((acc, rr) => {
          const r = rr || {};
          const qid = String(r.question_id ?? r.questionId ?? r.id ?? r.question ?? '');
          if (qid) acc[qid] = r;
          return acc;
        }, {} as Record<string, any>);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl font-bold"
                onClick={() => setDetailsId(null)}
                aria-label="Close"
              >&times;</button>
              <h3 className="text-lg font-bold mb-4 text-primary-700">Feedback Details</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Submitted on: {new Date(fb.timestamp).toLocaleString()}</p>
                <p className="text-sm text-gray-600">Site: {fb.site}</p>
                <p className="text-sm text-gray-600">Canteen: {fb.canteen || fb.canteen_id}</p>
                <p className="text-sm text-gray-600">Meal Slot: <span className="font-semibold text-primary-600">{fb.meal_category || 'Other'}</span></p>
                {fb.username && <p className="text-sm text-gray-600">User: {fb.username}</p>}
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-700 mb-3">Question-wise Ratings</h4>
                <ul className="space-y-4">
                  {(fb.responses || []).map((r: any, idx: number) => {
                    const rating = r.rating;
                    const emoji = r.emoji || (rating ? (
                      rating >= 4 ? '😀' : rating === 3 ? '🙂' : rating === 2 ? '😐' : '😞'
                    ) : '❓');

                    const ratingText = (() => {
                      switch (rating) {
                        case 4: return 'Good';
                        case 3: return 'Average';
                        case 2: return 'Needs Improvement';
                        case 1: return 'Poor';
                        default: return 'Not Answered';
                      }
                    })();

                    // compute width percent using detected max scale (4 if max rating <=4 else 5)
                    const maxScale = (rating && rating <= 4) ? 4 : 5;
                    const percent = rating ? Math.round((Number(rating) / maxScale) * 100) : 0;

                    return (
                      <li key={r.question_id || idx} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <p className="font-medium text-gray-800 mb-2">{r.question_text || 'Unknown Question'}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl select-none">{emoji}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                <div
                                  className="h-full bg-primary-500 rounded-full"
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-primary-700 min-w-[90px]">
                                {ratingText}{rating !== undefined ? ` (${rating})` : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {(fb.responses || []).length === 0 && (
                    <li className="text-gray-500 text-center py-4">No responses recorded.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {
        deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm animate-fade-in">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this feedback? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminFeedback;
