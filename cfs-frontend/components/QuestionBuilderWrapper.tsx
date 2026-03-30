import React, { useState, useEffect } from 'react';
import { getEndpoints } from '../constants';
import AdminQuestionCustomizer from './AdminQuestionCustomizer';

interface Segment {
  id: number;
  name: string;
  description?: string;
}

const QuestionBuilderWrapper: React.FC = () => {
  const endpoints = getEndpoints();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [sitesWithSegments, setSitesWithSegments] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch segments and sites on mount
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
        }

        // Fetch segments
        const segmentsRes = await fetch(`${endpoints.QUESTIONS}/../../api/segments/index.php?action=list`, {
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

  // Filter sites based on selected segment
  const filteredSites = selectedSegment
    ? sitesWithSegments
        .filter((s: any) => s.segment_id === parseInt(selectedSegment))
        .map((s: any) => s.location)
    : [];

  // Reset site when segment changes
  useEffect(() => {
    setSelectedSite('');
  }, [selectedSegment]);

  if (!selectedSegment || !selectedSite) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Advanced Question Customizer</h1>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Segment Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Segment</label>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-700"
              >
                <option value="">Choose a segment...</option>
                {segments.map((seg) => (
                  <option key={seg.id} value={seg.id}>
                    {seg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Site Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Site / Branch</label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                disabled={!selectedSegment}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Choose a site...</option>
                {filteredSites.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
              {!selectedSegment && (
                <p className="text-sm text-red-600 mt-2">Please select a segment first</p>
              )}
            </div>
          </div>

          {selectedSegment && !filteredSites.length && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              No sites found for the selected segment.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => { setSelectedSegment(''); setSelectedSite(''); }}
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
        >
          ← Back to Selection
        </button>
      </div>
      <AdminQuestionCustomizer
        segmentId={selectedSegment}
        siteId={selectedSite}
      />
    </div>
  );
};

export default QuestionBuilderWrapper;
