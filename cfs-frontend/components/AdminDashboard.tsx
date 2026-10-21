import React, { useState, useEffect, useMemo } from 'react';
import PieChartStats from './PieChartStats';
import RatingFace from './RatingFace';
import { FeedbackSubmission, Question, RatingLevel } from '../types';
import { RATINGS, getEndpoints } from '../constants';
import StatCard from './StatCard';
import FeedbackChart from './FeedbackChart';
import AverageRatingChart from './AverageRatingChart';

// Pie chart colors for rating levels (Poor, Needs Improvement, Average, Good)
const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

interface AdminDashboardProps {
  onLogout: () => void;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [feedbackData, setFeedbackData] = useState<FeedbackSubmission[]>([]);
  const endpoints = useMemo(() => getEndpoints(), []);
  const [selectedSite, setSelectedSite] = useState<string>('All Sites');
  const [selectedSegment, setSelectedSegment] = useState<string>('All Segments');
  const [selectedCanteenName, setSelectedCanteenName] = useState<string>('All Canteens');
  const [selectedMealSlot, setSelectedMealSlot] = useState<string>('All Slots');
  const [timeRange, setTimeRange] = useState<string>('All Time');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [siteCanteens, setSiteCanteens] = useState<string[]>([]); // List of canteens for the selected site
  const [showStatistics, setShowStatistics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [notification, setNotification] = useState<string | null>(null);
  const [newlyAddedSites, setNewlyAddedSites] = useState<Set<string>>(new Set());

  // Helper to normalize canteen identifier fields from backend
  const canonicalCanteen = (fb: any) => fb?.canteen ?? fb?.canteen_id ?? fb?.canteenId ?? 'Unknown Canteen';

  // Fetch Segments
  const fetchSegments = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      // Segment API might be different, checking from AdminSegments.tsx research
      const res = await fetch(`${endpoints.ADMIN_CANTEENS}/../../api/segments/index.php?action=list`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        setSegments(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching segments:', err);
    }
  }, [endpoints]);

  // Fetch Sites
  const fetchSites = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const res = await fetch(endpoints.SITES, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data && Array.isArray(data.sites)) {
        const validSites = data.sites.filter(site =>
          site &&
          typeof site.location === 'string' &&
          typeof site.branch_location === 'string'
        );
        setSites(validSites);
        setLastRefresh(Date.now());
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
      setSites([]);
    }
  }, [endpoints]);

  // Fetch Canteens for Selected Site
  useEffect(() => {
    if (selectedSite === 'All Sites') {
      setSiteCanteens([]);
      return;
    }
    const token = localStorage.getItem('canteenAdminJWT');
    fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(selectedSite)}`, {
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.canteens)) {
          setSiteCanteens(data.canteens);
        } else {
          setSiteCanteens([]);
        }
      })
      .catch(err => {
        console.error("Error fetching canteens", err);
        setSiteCanteens([]);
      });
  }, [selectedSite]);


  // Fetch Questions for Lookup - Only fetch once for all sites, don't depend on selectedSite
  const fetchQuestions = React.useCallback(async () => {
    if (selectedSite === 'All Sites') return;

    try {
      const token = localStorage.getItem('canteenAdminJWT');

      const res = await fetch(`${endpoints.QUESTIONS}?site=${encodeURIComponent(selectedSite)}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });

      if (res.ok) {
        const data = await res.json();
        const allQuestions = Array.isArray(data.questions) ? data.questions : [];

        // Normalize question structure for consistent access
        const normalized = allQuestions.map((q: any) => ({
          id: q.id || q.question_id,
          site: q.site || '',
          question_text: q.question_text || q.text || '',
          text: q.question_text || q.text || '',
          emoji: q.emoji || ''
        }));

        setQuestions(normalized);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setQuestions([]);
    }
  }, [selectedSite]);

  // Fetch Feedback
  const fetchFeedback = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = selectedSite !== 'All Sites'
        ? `${endpoints.ADMIN_FEEDBACK}?site=${encodeURIComponent(selectedSite)}`
        : endpoints.ADMIN_FEEDBACK;

      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('canteenAdminJWT')}`
        }
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data && (Array.isArray(data.feedback) || Array.isArray(data))) {
        const feedbackArray = Array.isArray(data.feedback) ? data.feedback : data;
        setFeedbackData(feedbackArray.map(fb => ({
          ...fb,
          responses: (() => {
            if (Array.isArray(fb.responses)) return fb.responses;
            if (typeof fb.responses === 'string') {
              try {
                const parsed = JSON.parse(fb.responses);
                if (Array.isArray(parsed)) return parsed;
              } catch (e) { /* ignore */ }
            }
            return [{
              rating: Number(fb.rating),
              question_id: fb.question_id,
              question_text: fb.question_text || ''
            }];
          })(),
          timestamp: fb.timestamp || Date.now()
        })).filter(fb => fb && typeof fb.site === 'string'));
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setFeedbackData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    fetchSegments();
    fetchSites();
    fetchQuestions(); // Fetch questions once on mount
    const interval = setInterval(() => {
      fetchFeedback(); // Keep feedback fresh every 30 seconds
    }, 30000);

    const handleSitesUpdated = (event: CustomEvent) => {
      const { action, location, message } = event.detail;
      if (action === 'added') {
        setNotification(message || `New site "${location}" added successfully!`);
        setNewlyAddedSites(prev => new Set([...prev, location]));
        setTimeout(() => {
          setNewlyAddedSites(prev => {
            const updated = new Set(prev);
            updated.delete(location);
            return updated;
          });
        }, 30000);
      }
      setTimeout(() => setNotification(null), 5000);
      fetchSegments();
      fetchSites();
      fetchQuestions(); // Refresh questions when sites change
      fetchFeedback();
    };
    window.addEventListener('sitesUpdated', handleSitesUpdated as EventListener);
    return () => {
      clearInterval(interval);
      window.removeEventListener('sitesUpdated', handleSitesUpdated as EventListener);
    };
  }, [fetchSegments, fetchSites, fetchQuestions, fetchFeedback]); // endpoints removed from dependencies as it's now stable



  // Handle Dependent Resets
  useEffect(() => {
    // If segment changes, we might need to reset site if it doesn't belong to the new segment
    if (selectedSegment !== 'All Segments') {
      const segId = segments.find(s => s.name === selectedSegment)?.id;
      if (segId && selectedSite !== 'All Sites') {
        const currentSite = sites.find(s => s.location === selectedSite);
        if (currentSite && Number(currentSite.segment_id) !== Number(segId)) {
          setSelectedSite('All Sites');
        }
      }
    }
  }, [selectedSegment, segments, sites, selectedSite]);

  useEffect(() => {
    // If site changes, reset canteen
    setSelectedCanteenName('All Canteens');
  }, [selectedSite]);

  // Fetch questions and feedback when site selection changes
  useEffect(() => {
    if (selectedSite !== 'All Sites') {
      fetchFeedback();
    }
  }, [fetchFeedback, selectedSite]);

  // Centralized Filtered Data
  const filteredData = useMemo(() => {
    if (!Array.isArray(feedbackData)) return [];

    const norm = (s: any) => String(s || '').trim().toLowerCase();

    return feedbackData.filter(fb => {
      // 1. Segment Filter
      if (selectedSegment !== 'All Segments') {
        const segId = fb.segment_id ? String(fb.segment_id) : '';
        const selectedSegId = String(segments.find(s => s.name === selectedSegment)?.id || '');
        if (segId !== selectedSegId) return false;
      }

      // 2. Site Filter
      if (selectedSite !== 'All Sites' && norm(fb.site) !== norm(selectedSite)) {
        return false;
      }

      // 3. Canteen Filter
      if (selectedCanteenName !== 'All Canteens' && norm(canonicalCanteen(fb)) !== norm(selectedCanteenName)) {
        return false;
      }

      // 4. Meal Slot Filter
      if (selectedMealSlot !== 'All Slots' && (fb.meal_category || 'Other') !== selectedMealSlot) {
        return false;
      }

      // 5. Time Range Filter
      if (timeRange !== 'All Time') {
        const fbTime = Number(fb.timestamp);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        if (timeRange === 'Today') {
          if (fbTime < startOfDay) return false;
        } else if (timeRange === 'Last 7 Days') {
          const sevenDaysAgo = startOfDay - (7 * 24 * 60 * 60 * 1000);
          if (fbTime < sevenDaysAgo) return false;
        } else if (timeRange === 'This Month') {
          const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          if (fbTime < firstOfMonth) return false;
        } else if (timeRange === 'This Year') {
          const firstOfYear = new Date(now.getFullYear(), 0, 1).getTime();
          if (fbTime < firstOfYear) return false;
        } else if (timeRange === 'Single Date' && customStartDate) {
          const targetDate = new Date(customStartDate);
          const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
          const dayEnd = dayStart + (24 * 60 * 60 * 1000);
          if (fbTime < dayStart || fbTime >= dayEnd) return false;
        } else if (timeRange === 'Custom Range' && customStartDate && customEndDate) {
          const start = new Date(customStartDate).getTime();
          const endDate = new Date(customEndDate);
          const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59).getTime();
          if (fbTime < start || fbTime > end) return false;
        }
      }

      return true;
    });
  }, [feedbackData, selectedSegment, selectedSite, selectedCanteenName, selectedMealSlot, timeRange, customStartDate, customEndDate, segments]);

  // Analytics Calculation — dynamic rating levels
  const analytics = useMemo(() => {
    // Determine max rating from feedback data
    let maxRating = 0;
    filteredData.forEach(fb => {
      fb.responses?.forEach(r => {
        const val = Number(r.rating);
        if (val > maxRating) maxRating = val;
      });
    });
    if (maxRating === 0) maxRating = 4; // fallback

    // Build dynamic label/color maps based on rating count
    const defaultLabelsMap: Record<number, string[]> = {
      2: ['Poor', 'Good'],
      3: ['Needs Improvement', 'Average', 'Good'],
      4: ['Poor', 'Needs Improvement', 'Average', 'Good'],
      5: ['Poor', 'Needs Improvement', 'Average', 'Good', 'Excellent']
    };
    const defaultPieColorsMap: Record<number, string[]> = {
      2: ['#ef4444', '#22c55e'],
      3: ['#f97316', '#eab308', '#22c55e'],
      4: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
      5: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#059669']
    };

    let dynamicLabels: string[] = defaultLabelsMap[maxRating] || defaultLabelsMap[4];

    // Try to get labels from question customization
    for (const q of questions) {
      const cust = (q as any).customization;
      if (cust?.options && Array.isArray(cust.options) && cust.options.length === maxRating) {
        const sorted = [...cust.options].sort((a: any, b: any) => a.value - b.value);
        dynamicLabels = sorted.map((o: any) => o.label);
        break;
      }
    }

    // Override from feedback rating_label
    const labelsByLevel: Record<number, string> = {};
    filteredData.forEach(fb => {
      fb.responses?.forEach((r: any) => {
        if (r.rating_label && r.rating) labelsByLevel[Number(r.rating)] = r.rating_label;
      });
    });
    if (Object.keys(labelsByLevel).length >= maxRating) {
      const levels = Object.keys(labelsByLevel).map(Number).sort((a, b) => a - b);
      dynamicLabels = levels.map(l => labelsByLevel[l]);
    }

    const pieColors = defaultPieColorsMap[maxRating] || defaultPieColorsMap[4];

    const dynamicRatings = Array.from({ length: maxRating }, (_, i) => ({
      level: i + 1,
      label: dynamicLabels[i] || `Rating ${i + 1}`,
      pieColor: pieColors[i] || '#6b7280'
    }));

    if (!filteredData.length) return {
      totalSubmissions: 0,
      positivePercentage: 0,
      positiveLabel: dynamicLabels[maxRating - 1] || 'Good',
      averageRating: '0.00',
      ratingDistribution: dynamicRatings.map(r => ({ name: r.label, value: 0 })),
      ratingPercentages: dynamicRatings.map(r => ({ name: r.label, value: 0 })),
      dynamicRatings,
      pieColors,
      maxRating
    };

    const ratingCounts: Record<number, number> = {};
    dynamicRatings.forEach(r => ratingCounts[r.level] = 0);
    let totalRatings = 0;
    let weightedSum = 0;

    filteredData.forEach(fb => {
      fb.responses?.forEach(response => {
        const val = Number(response.rating);
        if (!isNaN(val) && val >= 1 && val <= maxRating) {
          ratingCounts[val] = (ratingCounts[val] || 0) + 1;
          totalRatings++;
          weightedSum += val;
        }
      });
    });

    const highestLevel = maxRating;
    const positiveCount = ratingCounts[highestLevel] || 0;
    const positiveLabel = dynamicLabels[maxRating - 1] || 'Good';

    const averageRating = totalRatings > 0 ? (weightedSum / totalRatings).toFixed(2) : '0.00';

    // Find most common rating
    let modalRatingName = dynamicRatings[0]?.label || 'N/A';
    let modalMax = 0;
    dynamicRatings.forEach(r => {
      if ((ratingCounts[r.level] || 0) > modalMax) {
        modalMax = ratingCounts[r.level] || 0;
        modalRatingName = r.label;
      }
    });

    return {
      totalSubmissions: filteredData.length,
      positivePercentage: Number(totalRatings > 0 ? ((positiveCount / totalRatings) * 100).toFixed(1) : 0),
      positiveLabel,
      averageRating,
      ratingDistribution: dynamicRatings.map(r => ({
        name: `${r.label} (${totalRatings > 0 ? (((ratingCounts[r.level] || 0) / totalRatings) * 100).toFixed(1) : '0.0'}%)`,
        value: ratingCounts[r.level] || 0
      })),
      ratingPercentages: dynamicRatings.map(r => ({
        name: r.label,
        value: totalRatings > 0 ? ((ratingCounts[r.level] || 0) / totalRatings * 100).toFixed(1) : 0
      })),
      modalRatingName,
      modalRatingPct: totalRatings > 0 ? ((modalMax / totalRatings) * 100).toFixed(1) : '0',
      dynamicRatings,
      pieColors,
      maxRating
    };
  }, [filteredData, questions]);

  const exportToCSV = () => {
    if (!filteredData.length) return;

    // 1. Collect all unique question texts from the filtered data
    const allQuestionTexts = new Set<string>();
    filteredData.forEach(fb => {
      fb.responses?.forEach(r => {
        const qText = r.question_text || 'Question';
        allQuestionTexts.add(qText);
      });
    });
    const uniqueQuestions = Array.from(allQuestionTexts).sort();

    // 2. Prepare Headers
    const headers = [
      'ID',
      'Timestamp',
      'Segment',
      'Branch',
      'Canteen',
      'Meal Slot',
      'Overall Rating',
      ...uniqueQuestions
    ];

    // 3. Prepare Rows
    const rows = filteredData.map(fb => {
      // Find segment name
      const segment = segments.find(s => String(s.id) === String(fb.segment_id));
      const segmentName = segment ? segment.name : 'Unknown';

      // Calculate overall rating
      const ratingSum = fb.responses?.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) || 0;
      const responseCount = fb.responses?.length || 0;
      const overallRating = responseCount > 0 ? (ratingSum / responseCount).toFixed(2) : '0.00';

      // Format Timestamp
      const formattedTime = new Date(fb.timestamp).toLocaleString();

      // Base Values
      const rowValues = [
        String(fb.id || ''),
        formattedTime,
        segmentName,
        fb.site || '',
        fb.canteen || '',
        fb.meal_category || 'Other',
        overallRating
      ];

      // Add rating for each unique question
      uniqueQuestions.forEach(qText => {
        const response = fb.responses?.find(r => (r.question_text || 'Question') === qText);
        rowValues.push(response ? String(response.rating) : '');
      });

      return rowValues;
    });

    // 4. Generate CSV Content with proper escaping
    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    // 5. Download the file
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalyst_feedback_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ------------------------------------------------------------------
  // Logic for "Bar Graphs for each Canteen" (All Sites)
  // ------------------------------------------------------------------
  const allCanteensBarData = useMemo(() => {
    if (selectedSite !== 'All Sites') return [];

    const maxRating = analytics.maxRating || 4;
    const dynRatings = analytics.dynamicRatings || [];
    const canteenStats: Record<string, { ratings: Record<number, number>; total: number }> = {};
    const normalize = (s: any) => String(s || '').trim();

    filteredData.forEach(fb => {
      const cName = normalize(canonicalCanteen(fb));
      if (!cName) return;
      if (!canteenStats[cName]) {
        const initRatings: Record<number, number> = {};
        for (let i = 1; i <= maxRating; i++) initRatings[i] = 0;
        canteenStats[cName] = { ratings: initRatings, total: 0 };
      }

      fb.responses?.forEach(r => {
        const val = Number(r.rating);
        if (!isNaN(val) && val >= 1 && val <= maxRating) {
          canteenStats[cName].ratings[val] = (canteenStats[cName].ratings[val] || 0) + 1;
          canteenStats[cName].total++;
        }
      });
    });

    return Object.entries(canteenStats).map(([name, stats]) => {
      const total = Math.max(stats.total, 1);
      const row: Record<string, string | number> = { name };
      if (stats.total === 0) {
        dynRatings.forEach(r => { row[r.label] = 0; });
      } else {
        dynRatings.forEach(r => {
          row[r.label] = parseFloat(((stats.ratings[r.level] / total) * 100).toFixed(1));
        });
      }
      return row;
    }).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [filteredData, selectedSite, analytics]);


  // ------------------------------------------------------------------
  // Logic for "Pie Chart for each Canteen" (Single Site)
  // ------------------------------------------------------------------
  const singleSitePieData = useMemo(() => {
    if (selectedSite === 'All Sites') return [];

    const maxRating = analytics.maxRating || 4;
    const dynRatings = analytics.dynamicRatings || [];
    const normalize = (s: any) => String(s || '').trim().toLowerCase();

    let canteensToShow = siteCanteens && siteCanteens.length > 0 ? siteCanteens : [];

    if (canteensToShow.length === 0) {
      const uniqueCanteens = new Set<string>();
      filteredData.forEach(fb => {
        const cName = canonicalCanteen(fb);
        if (cName && cName.trim()) uniqueCanteens.add(cName);
      });
      canteensToShow = Array.from(uniqueCanteens);
    }

    if (selectedCanteenName !== 'All Canteens') {
      canteensToShow = canteensToShow.filter(c => normalize(c) === normalize(selectedCanteenName));
    }

    return canteensToShow.map(cName => {
      const normalizedCName = normalize(cName);

      const canteenFeedbacks = filteredData.filter(fb =>
        normalize(canonicalCanteen(fb)) === normalizedCName
      );

      const ratingCounts: Record<number, number> = {};
      for (let i = 1; i <= maxRating; i++) ratingCounts[i] = 0;
      let total = 0, count = 0;

      canteenFeedbacks.forEach(fb => {
        fb.responses?.forEach(r => {
          const val = Number(r.rating);
          if (!isNaN(val) && val >= 1 && val <= maxRating) {
            ratingCounts[val] = (ratingCounts[val] || 0) + 1;
            total += val;
            count++;
          }
        });
      });

      const pieData = dynRatings.map(r => ({
        name: r.label,
        value: ratingCounts[r.level] || 0
      }));

      return {
        canteenName: cName,
        pieData,
        avgRating: count > 0 ? (total / count).toFixed(2) : 'N/A',
        totalResponses: canteenFeedbacks.length
      };
    });
  }, [filteredData, selectedSite, siteCanteens, analytics]);

  // ------------------------------------------------------------------
  // Logic for "Question-wise Statistics" (Single Site)
  // ------------------------------------------------------------------
  const questionAnalysis = useMemo(() => {
    if (selectedSite === 'All Sites') return { tableData: [], chartData: [], averageChartData: [], dynamicRatings: [] };

    // Filter feedback for the selected site
    let siteFeedback = filteredData;

    // Build question lookup map from questions array
    const questionMap: Record<number | string, { id: number; text: string; emoji?: string; site?: string }> = {};
    questions.forEach(q => {
      const qId = String(q.id || (q as any).question_id || '');
      if (qId) {
        questionMap[qId] = {
          id: q.id || 0,
          text: q.question_text || q.text || `Question ${qId}`,
          emoji: q.emoji || '',
          site: q.site || ''
        };
      }
    });

    // Determine dynamic max rating from feedback data
    let maxRating = 0;
    siteFeedback.forEach(fb => {
      fb.responses?.forEach(r => {
        const val = Number(r.rating);
        if (val > maxRating) maxRating = val;
      });
    });
    if (maxRating === 0) maxRating = 4; // fallback

    // Build dynamic labels
    const defaultLabelsMap: Record<number, string[]> = {
      2: ['Poor', 'Good'],
      3: ['Needs Improvement', 'Average', 'Good'],
      4: ['Poor', 'Needs Improvement', 'Average', 'Good'],
      5: ['Poor', 'Needs Improvement', 'Average', 'Good', 'Excellent']
    };
    const defaultColorsMap: Record<number, string[]> = {
      2: ['text-red-500', 'text-green-500'],
      3: ['text-orange-500', 'text-yellow-500', 'text-green-500'],
      4: ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500'],
      5: ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-emerald-700']
    };

    let dynamicLabels: string[] = defaultLabelsMap[maxRating] || defaultLabelsMap[4];
    let dynamicColors: string[] = defaultColorsMap[maxRating] || defaultColorsMap[4];

    // Try to get labels from question customization
    for (const q of questions) {
      const cust = (q as any).customization;
      if (cust && cust.options && Array.isArray(cust.options) && cust.options.length === maxRating) {
        const sorted = [...cust.options].sort((a: any, b: any) => a.value - b.value);
        dynamicLabels = sorted.map((o: any) => o.label);
        break;
      }
    }

    // Override from feedback rating_label
    const labelsByLevel: Record<number, string> = {};
    siteFeedback.forEach(fb => {
      fb.responses?.forEach((r: any) => {
        if (r.rating_label && r.rating) {
          labelsByLevel[Number(r.rating)] = r.rating_label;
        }
      });
    });
    if (Object.keys(labelsByLevel).length > 0) {
      const levels = Object.keys(labelsByLevel).map(Number).sort((a, b) => a - b);
      if (levels.length >= maxRating) {
        dynamicLabels = levels.map(l => labelsByLevel[l]);
      }
    }

    const dynamicRatings = Array.from({ length: maxRating }, (_, i) => ({
      level: i + 1,
      label: dynamicLabels[i] || `Rating ${i + 1}`,
      color: dynamicColors[i] || 'text-gray-500'
    }));

    // Group feedback by question text
    const stats: Record<string, { ratings: Record<number, number>; total: number; qText: string; emoji?: string }> = {};

    siteFeedback.forEach(fb => {
      fb.responses?.forEach(r => {
        let qText = r.question_text || '';
        let emoji = '';

        if (!qText && r.questionId) {
          const qData = questionMap[r.questionId] || questionMap[String(r.questionId)];
          if (qData) { qText = qData.text; emoji = qData.emoji || ''; }
        }
        if (!qText && r.question_id) {
          const qData = questionMap[r.question_id] || questionMap[String(r.question_id)];
          if (qData) { qText = qData.text; emoji = qData.emoji || ''; }
        }
        if (!qText) { qText = `Question ${r.questionId || r.question_id || 'undefined'}`; }

        if (!stats[qText]) {
          const initRatings: Record<number, number> = {};
          dynamicRatings.forEach(dr => initRatings[dr.level] = 0);
          stats[qText] = { ratings: initRatings, total: 0, qText, emoji };
        }

        const val = Number(r.rating);
        if (!isNaN(val) && val >= 1 && val <= maxRating) {
          stats[qText].ratings[val] = (stats[qText].ratings[val] || 0) + 1;
          stats[qText].total++;
        }
      });
    });

    // If no feedback but we have questions, create empty rows
    if (siteFeedback.length === 0 && questions.length > 0) {
      questions.forEach(q => {
        const qText = q.question_text || q.text || `Question ${q.id}`;
        if (!stats[qText]) {
          const initRatings: Record<number, number> = {};
          dynamicRatings.forEach(dr => initRatings[dr.level] = 0);
          stats[qText] = { ratings: initRatings, total: 0, qText, emoji: q.emoji || '' };
        }
      });
    }

    const getKeyword = (text: string) => {
      const t = text.toLowerCase();
      const keywords = ['Taste', 'Quality', 'Cleanliness', 'Hygiene', 'Staff', 'Service', 'Polite', 'Menu', 'Variety', 'Freshness', 'Hot', 'Price', 'Value', 'Recommend', 'Ambiance', 'Speed', 'Portion'];
      for (const kw of keywords) { if (t.includes(kw.toLowerCase())) return kw; }
      const words = text.split(' ').map(w => w.replace(/[^\w]/g, ''));
      const significant = words.find(w => w.length > 3);
      return significant ? significant.charAt(0).toUpperCase() + significant.slice(1) : text.substring(0, 10);
    };

    const aggregated = Object.values(stats).map(s => {
      const total = Math.max(s.total, 1);
      const levelStats = dynamicRatings.map(r => ({
        label: r.label,
        level: r.level,
        count: s.ratings[r.level] || 0,
        pct: s.total > 0 ? (((s.ratings[r.level] || 0) / total) * 100).toFixed(1) : '0.0',
        color: r.color
      }));

      const weightedSum = dynamicRatings.reduce((sum, r) => sum + ((s.ratings[r.level] || 0) * r.level), 0);
      const avg = s.total > 0 ? (weightedSum / s.total).toFixed(2) : '0.00';

      return {
        question: s.qText,
        emoji: s.emoji || '',
        keyword: getKeyword(s.qText),
        levelStats,
        average: avg,
        totalResponses: s.total
      };
    }).sort((a, b) => a.question.localeCompare(b.question));

    // Distribution Chart Data
    const distributionChartData = aggregated.map(item => {
      const entry: any = { name: item.question.length > 40 ? item.question.substring(0, 40) + '...' : item.question };
      item.levelStats.forEach(ls => { entry[ls.label] = parseFloat(ls.pct); });
      return entry;
    }).filter(d => Object.values(d).some(v => typeof v === 'number' && v > 0));

    // Aggregate Chart Data by Display Name
    const aggregatedAvgData: Record<string, { totalValue: number; count: number; name: string }> = {};
    aggregated.forEach(item => {
      const keyword = item.keyword;
      if (!aggregatedAvgData[keyword]) {
        aggregatedAvgData[keyword] = { totalValue: parseFloat(item.average), count: 1, name: keyword };
      } else {
        aggregatedAvgData[keyword].totalValue += parseFloat(item.average);
        aggregatedAvgData[keyword].count++;
      }
    });

    const finalAvgChartData = Object.values(aggregatedAvgData).map(agg => ({
      name: agg.name.length > 30 ? agg.name.substring(0, 30) + '...' : agg.name,
      fullName: agg.name,
      value: (agg.totalValue / agg.count),
    }));

    return {
      tableData: aggregated,
      chartData: distributionChartData,
      averageChartData: finalAvgChartData,
      dynamicRatings
    };
  }, [filteredData, questions]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {notification}
        </div>
      )}

      <main className="p-4 w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Page Title & Print Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Admin Dashboard</h1>
            <div className="hidden print-header-date text-right">
              <p className="text-sm text-gray-600 font-semibold">{new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Unified Desktop Filters & Actions Row */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 mb-6 print:hidden flex flex-wrap items-end gap-3 justify-between">
            {/* Filters Container */}
            <div className="flex flex-wrap items-end gap-2.5 flex-grow">
              {/* 1. Segment Filter */}
              <div className="flex flex-col gap-1 min-w-[125px] flex-1 sm:flex-initial">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Segment</label>
                <select
                  value={selectedSegment}
                  onChange={e => setSelectedSegment(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-gray-300 text-xs font-semibold bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="All Segments">All Segments</option>
                  {segments.map((seg) => (
                    <option key={seg.id} value={seg.name}>{seg.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Branch (Site) Filter */}
              <div className="flex flex-col gap-1 min-w-[130px] flex-1 sm:flex-initial">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Branch</label>
                <select
                  value={selectedSite}
                  onChange={e => setSelectedSite(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-gray-300 text-xs font-semibold bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="All Sites">All Branches</option>
                  {sites
                    .filter(site => {
                      if (selectedSegment === 'All Segments') return true;
                      const segId = segments.find(s => s.name === selectedSegment)?.id;
                      return Number(site.segment_id) === Number(segId);
                    })
                    .map((site, idx) => (
                      <option key={`${site.id}-${idx}`} value={site.location}>
                        {site.location}
                      </option>
                    ))}
                </select>
              </div>

              {/* 3. Canteen Filter */}
              <div className="flex flex-col gap-1 min-w-[130px] flex-1 sm:flex-initial">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Canteen</label>
                <select
                  value={selectedCanteenName}
                  onChange={e => setSelectedCanteenName(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-gray-300 text-xs font-semibold bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="All Canteens">All Canteens</option>
                  {(selectedSite === 'All Sites'
                    ? Array.from(new Set(feedbackData.map(fb => canonicalCanteen(fb))))
                    : siteCanteens
                  ).sort().map((cName, idx) => (
                    <option key={idx} value={String(cName)}>{String(cName)}</option>
                  ))}
                </select>
              </div>

              {/* 4. Meal Slot Filter */}
              <div className="flex flex-col gap-1 min-w-[110px] flex-1 sm:flex-initial">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Meal Slot</label>
                <select
                  value={selectedMealSlot}
                  onChange={e => setSelectedMealSlot(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-gray-300 text-xs font-semibold bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="All Slots">All Slots</option>
                  {Array.from(new Set(
                    feedbackData
                      .filter(fb => {
                        if (selectedSite === 'All Sites') return true;
                        return String(fb.site).trim().toLowerCase() === String(selectedSite).trim().toLowerCase();
                      })
                      .map(fb => fb.meal_category || 'Other')
                  )).sort().map(slot => (
                    <option key={String(slot)} value={String(slot)}>{String(slot)}</option>
                  ))}
                </select>
              </div>

              {/* 5. Time Range Filter */}
              <div className="flex flex-col gap-1 min-w-[115px] flex-1 sm:flex-initial">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Time Range</label>
                <select
                  value={timeRange}
                  onChange={e => setTimeRange(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-gray-300 text-xs font-semibold bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="This Month">This Month</option>
                  <option value="This Year">This Year</option>
                  <option value="Single Date">Select Date</option>
                  <option value="Custom Range">Date Range</option>
                </select>
              </div>

              {/* 6. Dynamic Date Pickers */}
              {(timeRange === 'Single Date' || timeRange === 'Custom Range') && (
                <div className="flex gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{timeRange === 'Single Date' ? 'Date' : 'Start'}</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="h-9 px-2.5 rounded-lg border border-gray-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  {timeRange === 'Custom Range' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">End</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={e => setCustomEndDate(e.target.value)}
                        className="h-9 px-2.5 rounded-lg border border-gray-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons: Refresh, PDF, CSV */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto pt-1 sm:pt-0">
              <button
                onClick={() => { fetchSegments(); fetchSites(); fetchFeedback(); }}
                disabled={isLoading}
                className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"></div>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                )}
                <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => {
                  setTimeout(() => window.print(), 800);
                }}
                className="h-9 bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 rounded-lg text-xs transition shadow-xs flex items-center gap-1 active:scale-95"
              >
                PDF
              </button>
              <button
                onClick={exportToCSV}
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 rounded-lg text-xs transition shadow-xs flex items-center gap-1 active:scale-95"
              >
                CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Submissions"
              value={analytics.totalSubmissions.toString()}
              backgroundColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              textColor="#ffffff"
              iconColor="#ffffff"
            />
            <StatCard
              title={`Positive Feedback (${analytics.positiveLabel || 'Good'})`}
              value={`${analytics.positivePercentage.toFixed(1)}%`}
              description={`Ratings of '${analytics.positiveLabel || 'Good'}'`}
              backgroundColor="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              textColor="#ffffff"
              iconColor="#ffffff"
            />
            <StatCard
              title="Most Common Rating"
              value={`${analytics.modalRatingName || 'N/A'} (${analytics.modalRatingPct || '0'}%)`}
              backgroundColor="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              textColor="#ffffff"
              iconColor="#ffffff"
            />
          </div>

          {/* All Sites: Canteen-wise Bar Graphs */}
          {selectedSite === 'All Sites' && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Canteen Performance (All Sites)</h3>
              {allCanteensBarData.length > 0 ? (
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  {/* Reuse FeedbackChart for "Canteens" on Y Axis */}
                  <FeedbackChart
                    title="Canteen Rating Distribution"
                    data={allCanteensBarData}
                    ratingKeys={(analytics.dynamicRatings || []).map(r => r.label).reverse()}
                    ratingColors={(analytics.pieColors || []).slice().reverse()}
                  />
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Percentage distribution per canteen.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No feedback data available for canteens yet.</div>
              )}
            </div>
          )}

          {/* Single Site: Feedback Statistics & Charts */}
          {selectedSite !== 'All Sites' && (
            <div className="space-y-8 mb-8">
              {/* Feedback Statistics Table */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Feedback Statistics</h3>

                  {/* Info badges for active filters */}
                  <div className="flex gap-2 mb-2 print:hidden">
                    {selectedSegment !== 'All Segments' && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">{selectedSegment}</span>}
                    {selectedSite !== 'All Sites' && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">{selectedSite}</span>}
                    {selectedCanteenName !== 'All Canteens' && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">{selectedCanteenName}</span>}
                    {selectedMealSlot !== 'All Slots' && <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">{selectedMealSlot}</span>}
                    {timeRange !== 'All Time' && <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">{timeRange}</span>}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Feedback Questions</th>
                        {questionAnalysis.dynamicRatings.map(r => (
                          <th key={r.level} className="px-2 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex flex-col items-center gap-1">
                              <RatingFace level={Math.min(r.level, 4)} size={24} />
                              <span className={`${r.color} font-bold`}>
                                {r.label === 'Needs Improvement' ? 'Needs Imp.' : r.label}
                              </span>
                            </div>
                          </th>
                        ))}
                        <th className="px-2 py-3 bg-gray-50 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Average</th>
                        <th className="px-2 py-3 bg-gray-50 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {questionAnalysis.tableData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition w-full">
                          <td className="px-4 py-4 text-sm font-medium text-blue-800">
                            {idx + 1}. {row.question}
                          </td>
                          {row.levelStats.map(stat => (
                            <td key={stat.level} className="px-2 py-4 text-center">
                              <div className={`${stat.color} font-bold`}>{stat.pct}%</div>
                              <div className="text-xs text-gray-400">({stat.count})</div>
                            </td>
                          ))}
                          <td className="px-2 py-4 text-center">
                            <div className="text-blue-600 font-bold text-lg">{row.average}</div>
                            <div className="text-xs text-blue-400">avg</div>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <div className="text-green-600 font-bold text-lg">{row.totalResponses}</div>
                            <div className="text-xs text-green-400">total</div>
                          </td>
                        </tr>
                      ))}
                      {questionAnalysis.tableData.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                            No feedback data available for this site yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rating Distribution Chart (Switched to AverageRatingChart per user request) */}
              {questionAnalysis.averageChartData && questionAnalysis.averageChartData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Question Rating Analysis</h3>
                  <div className="h-[400px]">
                    <AverageRatingChart
                      data={questionAnalysis.averageChartData}
                    />
                  </div>
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    {/* Legend handled by component */}
                    <span className="text-gray-500 text-xs">Based on average rating (0-4)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Single Site: Canteen-wise Pie Charts */}
          {selectedSite !== 'All Sites' && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">
                Canteen Analysis for {selectedSite}
              </h3>
              {singleSitePieData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print-pie-grid">
                  {singleSitePieData.map((cStats, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 print-grid-chart">
                      <h4 className="font-semibold mb-3 text-lg text-center">{cStats.canteenName}</h4>
                      {cStats.totalResponses > 0 ? (
                        <>
                          <PieChartStats
                            title=""
                            data={cStats.pieData}
                            colors={analytics.pieColors || PIE_COLORS}
                            bare={true}
                            height={220}
                          />
                          <div className="mt-2 text-center border-t pt-2">
                            <div className="font-bold text-gray-700">Avg Rating: {cStats.avgRating}</div>
                            <div className="text-xs text-gray-500">Total Responses: {cStats.totalResponses}</div>
                          </div>
                        </>
                      ) : (
                        <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
                          <p>No Data</p>
                          <p className="text-xs">Waiting for feedback</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No canteens found for this site.</div>
              )}
            </div>
          )}

        </div>
        <div id="admin-print-report" style={{ display: 'none' }}>
          <div className="mt-8 mb-4 page-break-before">
            <h2 className="text-xl font-bold mb-2">Feedback Report: {selectedSite}</h2>
          </div>
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Timestamp</th>
                <th className="border p-2 text-left">Canteen</th>
                <th className="border p-2 text-left">Meal Slot</th>
                <th className="border p-2 text-left">User</th>
                <th className="border p-2 text-left">Rating</th>
                <th className="border p-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {feedbackData.map((fb, i) => (
                <tr key={i} className="border-b break-inside-avoid">
                  <td className="border p-2">{new Date(fb.timestamp).toLocaleString()}</td>
                  <td className="border p-2">{fb.canteen || fb.canteen_id}</td>
                  <td className="border p-2">{fb.meal_category || 'Other'}</td>
                  <td className="border p-2">{fb.username || '-'}</td>
                  <td className="border p-2 font-bold">{Number(fb.rating).toFixed(1)}</td>
                  <td className="border p-2">
                    <div className="text-xs grid grid-cols-1 gap-1">
                      {(fb.responses || []).map((r: any, ri: number) => (
                        <div key={ri}>
                          <span className="font-semibold text-gray-700">{r.question_text?.substring(0, 40) || 'Question'}:</span>
                          <span className="ml-1 font-bold">{r.rating}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {feedbackData.length === 0 && <tr><td colSpan={5} className="p-4 text-center">No data available</td></tr>}
            </tbody>
          </table>
        </div>

        <style>{`

        @media print {
            @page {size: A4 portrait; margin: 10mm; }

          /* RESET AND VISIBILITY */
          nav, aside, header, footer, button, .no-print, .sidebar, div[class*="fixed top-0"] {
            display: none !important; 
          }

          html, body, #root {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            visibility: visible !important;
            text-align: left; /* Reset to left, center containers instead */
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Main Layout - Force Top Left */
          main, .min-h-screen {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          /* Hide all siblings of main if possible, or assume absolute covers them */
          body > :not(#root), #root > :not(div) {
             display: none !important;
          }

          /* Helper for centering content blocks */
          .content-block {
            width: 90% !important;
          max-width: 180mm !important; /* Safe A4 width */
          margin: 0 auto 20px auto !important;
          }

          /* Header Special Handling for Print */
          .print-header-date {display: block !important; margin-left: auto; }

          /* The Header Row */
          .flex-col.md\\:flex-row {
            display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 90% !important;
          max-width: 180mm !important;
          margin: 0 auto 20px auto !important;
          border-bottom: 2px solid #ddd;
          padding-bottom: 10px;
          }

          /* Dashboard Content Blocks (Charts, Stats) */
          .bg-white, .chart-container {
            width: 100% !important; /* Let grid control width */
            max-width: none !important;
            margin: 0 !important; 
            box-shadow: none !important;
            border: 1px solid #eee !important;
            padding: 10px !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Report Table Section */
          #admin-print-report {
            display: block !important;
          width: 90% !important;
          max-width: 180mm !important;
          margin: 20px auto !important;
          }

          /* Charts specific fix */
          /* Main Chart (Bar) - Full Width */
          .print-main-chart .recharts-responsive-container,
          .print-main-chart .recharts-wrapper {
             width: 680px !important;
             height: 400px !important;
             display: block !important;
          }
          
          /* Grid Charts (Pie) - 2 per row approx */
          .print-grid-chart .recharts-responsive-container,
          .print-grid-chart .recharts-wrapper {
             width: 320px !important; 
             height: 250px !important;
             display: block !important;
          }
          
          /* Nuclear option for clipping and visibility */
          .recharts-surface, .recharts-surface * {
             overflow: visible !important;
             clip-path: none !important;
             mask: none !important;
             opacity: 1 !important; 
          }
           
           /* Force Grid Layout for Pies */
           .print-pie-grid {
             display: grid !important;
             grid-template-columns: repeat(2, 1fr) !important;
             gap: 20px !important;
             width: 100% !important;
           }
          /* Ensure paths and rects (bars) are visible */
          path, rect, circle, line {
             fill-opacity: 1 !important;
             stroke-opacity: 1 !important;
             visibility: visible !important;
          }
          
          /* Grid Adjustment - Restore Grid for Print */
          .grid {
            display: grid !important;
            /* Force 3 columns for stats, or auto-fit */
            grid-template-columns: repeat(3, 1fr) !important;
            width: 100% !important;
            margin: 0 auto !important;
            gap: 10px !important;
          }
          /* Handle 2-column or different grids if needed, but primary stats are 3-col */
          /* Forcing simple 3-col for consistency on A4 landscape/portrait scaled */
          
          .grid > div {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            page-break-inside: avoid; 
          }
          
          /* Special case for pie charts grid which might need different cols */
          .grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3 {
             grid-template-columns: repeat(3, 1fr) !important;
          }
          
          /* Special case for single column sections */
          .grid-cols-1 {
             grid-template-columns: 1fr !important;
          }

          /* Titles */
          h1, h2, h3, h4, .text-center { text-align: center !important; }

          /* Tables */
          table {width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-size: 9pt; margin: 0 auto; }
          th, td {border: 1px solid #000; padding: 4px; text-align: left; }
          thead {display: table-header-group; }
          tr { page-break-inside: avoid; }
        }
        `}</style>
      </main>
    </div >
  );
};

export default AdminDashboard;
