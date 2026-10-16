
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSync, FaFilePdf, FaFileCsv, FaEye, FaTrash, FaEdit, FaSave, FaTimes, FaQrcode, FaPrint } from 'react-icons/fa';
import QRCode from "react-qr-code";
import PieChartStats from './PieChartStats';
import RatingFace from './RatingFace';
import StatCard from './StatCard';
import AverageRatingChart from './AverageRatingChart';
import { FeedbackSubmission, Question, RatingLevel, Canteen, MealSlot } from '../types';
import { RATINGS, getEndpoints, FRONTEND_URL, RATING_LABELS } from '../constants';
import catalystLogo from '../src/images/clogo.png';

const toSlug = (name: string) => {
  return name.toLowerCase().replace(/[&]+/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

interface BranchAdminDashboardProps {
    site: string;
    onLogout: () => void;
}

type MainTab = 'dashboard' | 'customize';

const BranchAdminDashboard: React.FC<BranchAdminDashboardProps> = ({ site, onLogout }) => {
    const navigate = useNavigate();
    const endpoints = getEndpoints();

    const getShortName = (text: string) => {
        const commonWords = ['how', 'was', 'the', 'were', 'staff', 'food', 'area', 'you', 'recommend'];
        const words = text.toLowerCase().replace(/[?.,!]/g, '').split(' ');
        const important = words.filter(w => !commonWords.includes(w) && w.length > 2);
        if (important.length > 0) return important[0].charAt(0).toUpperCase() + important[0].slice(1);
        return text.split(' ')[0] || 'Q';
    };

    const handleLogout = () => {
        localStorage.removeItem('canteenAdminJWT');
        navigate('/admin-login');
        if (onLogout) onLogout();
    };
    // --- State ---
    const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
    const [feedbackData, setFeedbackData] = useState<FeedbackSubmission[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [canteens, setCanteens] = useState<Canteen[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [branchLogo, setBranchLogo] = useState<string>('');

    // Filters
    const [selectedCanteen, setSelectedCanteen] = useState<string>('All Canteens');
    const [selectedMealSlot, setSelectedMealSlot] = useState<string>('All Slots');
    const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'single_date' | 'all'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Management State (Feedback)
    const [detailsId, setDetailsId] = useState<string | null>(null);
    const [deleteFbId, setDeleteFbId] = useState<string | null>(null);

    // Management State (Canteens & Slots)
    const [editingCanteen, setEditingCanteen] = useState<Canteen | null>(null);
    const [canteenToDelete, setCanteenToDelete] = useState<Canteen | null>(null);
    const [slotForm, setSlotForm] = useState<MealSlot>({ category: '', startTime: '', endTime: '' });
    const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

    // --- Data Fetching ---

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('canteenAdminJWT');
        const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

        try {
            // 1. Fetch Feedback
            const fbRes = await fetch(`${endpoints.ADMIN_FEEDBACK}?site=${encodeURIComponent(site)}`, { headers });
            if (!fbRes.ok) throw new Error('Failed to fetch feedback');
            const fbData = await fbRes.json();
            const fbArray = Array.isArray(fbData.feedback) ? fbData.feedback : (Array.isArray(fbData) ? fbData : []);

            const processedFb = fbArray.map((fb: any) => ({
                ...fb,
                responses: typeof fb.responses === 'string' ? JSON.parse(fb.responses) : (fb.responses || [{ rating: fb.rating, question_id: fb.question_id }]),
                timestamp: fb.timestamp || fb.created_at || Date.now()
            }));
            setFeedbackData(processedFb);

            // 2. Fetch Questions
            const qRes = await fetch(`${endpoints.QUESTIONS}?site=${encodeURIComponent(site)}`, { headers });
            if (qRes.ok) {
                const qData = await qRes.json();
                setQuestions(Array.isArray(qData.questions) ? qData.questions : []);
            }

            // 3. Fetch Canteens
            const cRes = await fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(site)}`, { headers });
            if (cRes.ok) {
                const cData = await cRes.json();
                if (Array.isArray(cData.details)) {
                    setCanteens(cData.details);
                } else if (Array.isArray(cData.canteens)) {
                    setCanteens(cData.canteens.map((name: string) => ({ name, site, meal_slots: [] })));
                } else {
                    setCanteens([]);
                }
            }

            // 4. Fetch Branch Logo
            try {
                const bRes = await fetch(`${endpoints.ADMIN_BRANCH_ADMINS}?site=${encodeURIComponent(site)}`, { headers });
                if (bRes.ok) {
                    const bData = await bRes.json();
                    if (bData.branch_admins?.length > 0 && bData.branch_admins[0].logo) {
                        setBranchLogo(bData.branch_admins[0].logo);
                    }
                }
            } catch {}

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [site]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Derived Data / Analytics ---
    const uniqueMealSlots = useMemo(() => {
        if (selectedCanteen === 'All Canteens') {
            const allSlots = new Set<string>();
            canteens.forEach(c => {
                if (c.meal_slots) {
                    c.meal_slots.forEach(s => allSlots.add(s.category));
                }
            });
            return Array.from(allSlots);
        } else {
            const canteen = canteens.find(c => c.name === selectedCanteen);
            if (!canteen || !canteen.meal_slots) return [];
            return canteen.meal_slots.map(s => s.category);
        }
    }, [canteens, selectedCanteen]);

    const filteredFeedback = useMemo(() => {
        return feedbackData.filter(fb => {
            // Canteen Filter
            const fbCanteen = fb.canteen || fb.canteen_id || '';
            if (selectedCanteen !== 'All Canteens' && fbCanteen !== selectedCanteen) return false;

            // Meal Slot Filter
            const fbSlot = fb.meal_category || 'Other';
            if (selectedMealSlot !== 'All Slots' && fbSlot !== selectedMealSlot) return false;

            // Time Frame Filter
            if (timeFrame !== 'all') {
                const date = new Date(fb.timestamp);
                const now = new Date();

                if (timeFrame === 'daily' && date.toDateString() !== now.toDateString()) return false;

                if (timeFrame === 'weekly') {
                    const diff = now.getTime() - date.getTime();
                    if (diff / (1000 * 3600 * 24) > 7) return false;
                }

                if (timeFrame === 'monthly') {
                    const diff = now.getTime() - date.getTime();
                    if (diff / (1000 * 3600 * 24) > 30) return false;
                }

                if (timeFrame === 'yearly' && date.getFullYear() !== selectedYear) return false;

                if (timeFrame === 'custom') {
                    if (startDate && new Date(fb.timestamp) < new Date(startDate)) return false;
                    if (endDate) {
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        if (new Date(fb.timestamp) > end) return false;
                    }
                }

                if (timeFrame === 'single_date') {
                    if (!startDate) return true; // Show all if no date selected yet, or handle as 'none'
                    const dateStr = new Date(fb.timestamp).toDateString();
                    const selectedDateStr = new Date(startDate).toDateString();
                    if (dateStr !== selectedDateStr) return false;
                }
            }

            return true;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [feedbackData, selectedCanteen, selectedMealSlot, timeFrame]);



    // --- Analytics Calculation ---
    const analytics = useMemo(() => {
        // Step 1: Determine dynamic rating levels from question customization or feedback data
        const qMap: Record<string, any> = {};
        questions.forEach(q => qMap[String(q.id)] = q);

        // First, try to get the rating scale from question customization (source of truth)
        let customMaxRating = 0;
        let customLabels: string[] = [];
        let customColors: string[] = [];
        for (const q of questions) {
            const cust = (q as any).customization;
            if (cust && cust.options && Array.isArray(cust.options) && cust.options.length >= 2) {
                const sorted = [...cust.options].sort((a: any, b: any) => a.value - b.value);
                if (sorted.length > customMaxRating) {
                    customMaxRating = sorted.length;
                    customLabels = sorted.map((o: any) => o.label);
                    customColors = sorted.map((o: any) => {
                        const c = o.color;
                        if (!c) return 'text-gray-500';
                        // Map hex colors to Tailwind text classes
                        if (c.includes('ef4444') || c.includes('dc2626')) return 'text-red-500';
                        if (c.includes('f97316') || c.includes('ea580c')) return 'text-orange-500';
                        if (c.includes('eab308') || c.includes('ca8a04')) return 'text-yellow-500';
                        if (c.includes('22c55e') || c.includes('16a34a')) return 'text-green-500';
                        if (c.includes('166534') || c.includes('15803d')) return 'text-emerald-700';
                        return 'text-gray-500';
                    });
                }
            }
        }

        // Determine maxRating: prefer customization, fall back to feedback data
        let maxRating = customMaxRating;
        if (maxRating === 0) {
            filteredFeedback.forEach(fb => {
                fb.responses?.forEach(r => {
                    const val = Number(r.rating);
                    if (val > maxRating) maxRating = val;
                });
            });
        }
        if (maxRating === 0) maxRating = 4; // fallback

        // Build dynamic rating levels
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

        // Use customization labels if available, otherwise defaults
        let dynamicLabels: string[] = customLabels.length === maxRating ? customLabels : (defaultLabelsMap[maxRating] || defaultLabelsMap[4]);
        let dynamicColors: string[] = customColors.length === maxRating ? customColors : (defaultColorsMap[maxRating] || defaultColorsMap[4]);

        // Also check feedback rating_label to override labels
        const labelsByLevel: Record<number, string> = {};
        filteredFeedback.forEach(fb => {
            fb.responses?.forEach((r: any) => {
                if (r.rating_label && r.rating) {
                    labelsByLevel[Number(r.rating)] = r.rating_label;
                }
            });
        });
        // If we found labels from feedback data, use them
        if (Object.keys(labelsByLevel).length > 0) {
            const levels = Object.keys(labelsByLevel).map(Number).sort((a, b) => a - b);
            if (levels.length >= maxRating) {
                dynamicLabels = levels.map(l => labelsByLevel[l]);
            }
        }

        // Build the dynamic RATINGS array
        const dynamicRatings = Array.from({ length: maxRating }, (_, i) => ({
            level: i + 1,
            label: dynamicLabels[i] || `Rating ${i + 1}`,
            color: dynamicColors[i] || 'text-gray-500'
        }));

        const ratingCounts: Record<number, number> = {};
        dynamicRatings.forEach(r => ratingCounts[r.level] = 0);
        let totalRatings = 0;
        let weightedSum = 0;

        filteredFeedback.forEach(fb => {
            fb.responses?.forEach(r => {
                const val = Number(r.rating);
                if (val >= 1 && val <= maxRating) {
                    ratingCounts[val] = (ratingCounts[val] || 0) + 1;
                    totalRatings++;
                    weightedSum += val;
                }
            });
        });

        const averageRating = totalRatings > 0 ? (weightedSum / totalRatings).toFixed(2) : '0.00';

        const highestLevel = maxRating;
        const positivePercentage = totalRatings > 0 ? (((ratingCounts[highestLevel] || 0) / totalRatings) * 100).toFixed(1) : '0';
        const positiveLabel = dynamicLabels[maxRating - 1] || 'Good';

        const pieData = dynamicRatings.map(r => ({
            name: r.label,
            value: ratingCounts[r.level] || 0
        }));

        const qStats: Record<string, { ratings: Record<number, number>, total: number, emoji: string }> = {};

        filteredFeedback.forEach(fb => {
            fb.responses?.forEach(r => {
                const qId = String(r.question_id || r.questionId);
                const qText = r.question_text || qMap[qId]?.question_text || `Question ${qId}`;
                const emoji = qMap[qId]?.emoji || '😐';

                if (!qStats[qText]) {
                    const initRatings: Record<number, number> = {};
                    dynamicRatings.forEach(dr => initRatings[dr.level] = 0);
                    qStats[qText] = { ratings: initRatings, total: 0, emoji };
                }
                const val = Number(r.rating);
                if (val >= 1 && val <= maxRating) {
                    qStats[qText].ratings[val]++;
                    qStats[qText].total++;
                }
            });
        });

        const tableData = Object.entries(qStats).map(([text, stats]) => {
            const total = Math.max(stats.total, 1);
            const levelStats = dynamicRatings.map(r => ({
                label: r.label,
                level: r.level,
                count: stats.ratings[r.level] || 0,
                pct: (((stats.ratings[r.level] || 0) / total) * 100).toFixed(1),
                color: r.color
            }));

            return {
                question: text,
                emoji: stats.emoji,
                levelStats,
                average: (dynamicRatings.reduce((sum, r) => sum + ((stats.ratings[r.level] || 0) * r.level), 0) / total).toFixed(2),
                totalResponses: stats.total
            };
        }).sort((a, b) => a.question.localeCompare(b.question));

        const averageChartData = tableData.map(d => ({
            name: getShortName(d.question),
            fullName: d.question,
            value: parseFloat(d.average)
        })).filter(d => parseFloat(d.value.toString()) > 0);

        // Find the most common rating name
        let modalRatingName = dynamicRatings[0]?.label || 'N/A';
        let modalMax = 0;
        dynamicRatings.forEach(r => {
            if ((ratingCounts[r.level] || 0) > modalMax) {
                modalMax = ratingCounts[r.level] || 0;
                modalRatingName = r.label;
            }
        });

        return {
            totalSubmissions: filteredFeedback.length,
            averageRating,
            positivePercentage,
            positiveLabel,
            ratingCounts,
            modalRatingName,
            modalRatingPct: totalRatings > 0 ? ((modalMax / totalRatings) * 100).toFixed(1) : '0',
            pieData,
            tableData,
            averageChartData,
            dynamicRatings
        };
    }, [filteredFeedback, questions]);

    const questionsMap = useMemo(() => {
        const map: Record<string, string> = {};
        questions.forEach(q => {
            map[String(q.id)] = q.question_text;
        });
        return map;
    }, [questions]);

    const handleDeleteFeedback = async () => {
        if (!deleteFbId) return;
        try {
            const token = localStorage.getItem('canteenAdminJWT');
            const res = await fetch(`${endpoints.ADMIN_FEEDBACK}?id=${deleteFbId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setDeleteFbId(null);
                fetchData();
                showNotification('Feedback deleted.');
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteCanteen = async () => {
        if (!canteenToDelete) return;
        try {
            const token = localStorage.getItem('canteenAdminJWT');
            const res = await fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(site)}&name=${encodeURIComponent(canteenToDelete.name)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setCanteenToDelete(null);
                fetchData();
                showNotification('Canteen and its data removed.');
            }
        } catch (e) { console.error(e); }
    };

    const exportCSV = () => {
        // Collect all unique questions from filtered feedback to use as headers
        const allQuestionTexts = new Set<string>();
        filteredFeedback.forEach(fb => {
            fb.responses.forEach(r => {
                const qText = r.question_text || questionsMap[String(r.question_id || r.questionId)] || 'Question';
                allQuestionTexts.add(qText);
            });
        });
        const uniqueQuestions = Array.from(allQuestionTexts).sort();

        let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';

        // Header row: ID, Metadata, and then each unique question
        const headers = ["ID", "Timestamp", "Canteen", "Name", "Employee ID", "Department", "Meal Slot", "Overall Rating", ...uniqueQuestions, "Suggestion"];
        csvContent += headers.map(h => `"${h}"`).join(',') + '\r\n';

        filteredFeedback.forEach(fb => {
            const overallRating = fb.responses.length > 0
                ? (fb.responses.reduce((s, r) => s + r.rating, 0) / fb.responses.length).toFixed(2)
                : '0.00';

            // Base row values
            const rowValues = [
                fb.id,
                new Date(fb.timestamp).toLocaleString(),
                fb.canteen || fb.canteen_id,
                fb.user_name || fb.username || '',
                fb.user_employee_id || '',
                fb.user_department || '',
                fb.selected_meal_slot || fb.meal_category || 'Other',
                overallRating
            ];

            // Add rating or answer for each specific question column
            uniqueQuestions.forEach(qText => {
                const response = fb.responses.find(r =>
                    (r.question_text || questionsMap[String(r.question_id || r.questionId)] || 'Question') === qText
                );
                if (!response) {
                    rowValues.push('');
                } else if (response.rating !== undefined && response.rating !== null && !isNaN(Number(response.rating))) {
                    rowValues.push(String(response.rating));
                } else {
                    let ans = response.answer || '';
                    if (typeof ans === 'string' && ans.startsWith('[') && ans.endsWith(']')) {
                        try {
                            const parsed = JSON.parse(ans);
                            if (Array.isArray(parsed)) ans = parsed.join('; ');
                        } catch {}
                    }
                    if (response.other_text) ans += ` (${response.other_text})`;
                    rowValues.push(ans);
                }
            });

            // Add suggestion at the end
            rowValues.push(fb.user_suggestion || '');

            // Escape each cell and join with comma
            const escapedRow = rowValues.map(v => `"${String(v).replace(/"/g, '""')}"`);
            csvContent += escapedRow.join(',') + '\r\n';
        });

        const link = document.createElement('a');
        link.href = encodeURI(csvContent);
        link.download = `Feedback_${site}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const activeFeedback = filteredFeedback.find(f => f.id === detailsId);

    // --- Slot Management Handlers ---
    const handleAddSlot = () => {
        if (!editingCanteen) return;
        if (!slotForm.category || !slotForm.startTime || !slotForm.endTime) {
            alert('Please fill all fields');
            return;
        }

        const updatedSlots = [...(editingCanteen.meal_slots || [])];
        if (editingSlotIndex !== null) {
            // Update existing slot
            updatedSlots[editingSlotIndex] = { ...slotForm };
            setEditingSlotIndex(null);
        } else {
            // Add new slot
            updatedSlots.push({ ...slotForm });
        }

        setEditingCanteen({ ...editingCanteen, meal_slots: updatedSlots });
        setSlotForm({ category: '', startTime: '', endTime: '' });
    };

    const handleEditSlot = (index: number) => {
        if (!editingCanteen || !editingCanteen.meal_slots) return;
        const slot = editingCanteen.meal_slots[index];
        setSlotForm({ ...slot });
        setEditingSlotIndex(index);
    };

    const handleRemoveSlot = (index: number) => {
        if (!editingCanteen) return;
        const updated = [...(editingCanteen.meal_slots || [])];
        updated.splice(index, 1);
        setEditingCanteen({ ...editingCanteen, meal_slots: updated });

        // Reset edit mode if the slot being edited is removed
        if (editingSlotIndex === index) {
            setEditingSlotIndex(null);
            setSlotForm({ category: '', startTime: '', endTime: '' });
        } else if (editingSlotIndex !== null && editingSlotIndex > index) {
            setEditingSlotIndex(editingSlotIndex - 1);
        }
    };

    const handleSaveSlots = async () => {
        if (!editingCanteen) return;
        setIsLoading(true);
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
            fetchData();
        } catch (err) {
            setError('Failed to save meal slots');
        }
        setIsLoading(false);
    };

    // --- Render ---

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">

            {/* Print Only Logo - Top Right */}
            <div className="hidden print:block absolute top-0 right-0 p-4 z-50">
                <img src={catalystLogo} alt="Catalyst" className="h-16 w-auto object-contain" />
            </div>

            {/* Header */}
            <header className="bg-white shadow-sm z-30 sticky top-0 print:static print:shadow-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {site.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none">Branch Admin Dashboard</h1>
                            <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">{site}</span>
                        </div>
                    </div>

                    {/* Centered Logo in Header */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:block print:hidden">
                        <img src={catalystLogo} alt="Catalyst" className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Tab Switcher */}
                        <div className="bg-gray-100 p-1 rounded-xl flex items-center no-print">
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                📊 Dashboard
                            </button>
                            <button
                                onClick={() => setActiveTab('customize')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'customize' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                ⚙️ Customize
                            </button>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors no-print"
                        >
                            Logout ⏏
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-8 space-y-10 max-w-7xl mx-auto w-full">
                {activeTab === 'dashboard' && (
                    <div className="space-y-10 animate-fade-in">
                        {/* Filters Bar */}
                        <section className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <div className="flex flex-wrap items-center gap-4 justify-between">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="group flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Canteen</label>
                                        <select
                                            value={selectedCanteen}
                                            onChange={(e) => setSelectedCanteen(e.target.value)}
                                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all min-w-[150px] cursor-pointer hover:bg-white"
                                        >
                                            <option value="All Canteens">All Canteens</option>
                                            {canteens.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="group flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Meal Slot</label>
                                        <select
                                            value={selectedMealSlot}
                                            onChange={(e) => setSelectedMealSlot(e.target.value)}
                                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all min-w-[150px] cursor-pointer hover:bg-white"
                                        >
                                            <option value="All Slots">All Slots</option>
                                            {uniqueMealSlots.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    <div className="group flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Time Range</label>
                                        <select
                                            value={timeFrame}
                                            onChange={(e) => setTimeFrame(e.target.value as any)}
                                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all min-w-[120px] cursor-pointer hover:bg-white"
                                        >
                                            <option value="all">Lifetime</option>
                                            <option value="daily">Today</option>
                                            <option value="weekly">This Week</option>
                                            <option value="monthly">This Month</option>
                                            <option value="yearly">By Year</option>
                                            <option value="single_date">Select Date</option>
                                            <option value="custom">Custom Range</option>
                                        </select>
                                    </div>

                                    {timeFrame === 'yearly' && (
                                        <div className="animate-fade-in flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Select Year</label>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer hover:bg-white"
                                            >
                                                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {timeFrame === 'custom' && (
                                        <div className="animate-fade-in flex flex-wrap items-center gap-3 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">Start Date</label>
                                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white border border-indigo-200 rounded-lg p-1.5 text-xs font-bold text-indigo-700 outline-none" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">End Date</label>
                                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white border border-indigo-200 rounded-lg p-1.5 text-xs font-bold text-indigo-700 outline-none" />
                                            </div>
                                        </div>
                                    )}

                                    {timeFrame === 'single_date' && (
                                        <div className="animate-fade-in flex flex-col gap-1 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                                            <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">Date</label>
                                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white border border-indigo-200 rounded-lg p-1.5 text-xs font-bold text-indigo-700 outline-none" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 no-print">
                                    <button
                                        onClick={() => fetchData()}
                                        className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
                                        title="Refresh Data"
                                    >
                                        <span className={isLoading ? 'animate-spin block' : 'group-hover:rotate-180 block'}>
                                            <FaSync />
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 shadow-md transition-all active:scale-95"
                                    >
                                        <FaFilePdf /> PDF
                                    </button>
                                    <button
                                        onClick={exportCSV}
                                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 shadow-md transition-all active:scale-95"
                                    >
                                        <FaFileCsv /> CSV
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Analytics Section */}
                        <section id="analytics" className="space-y-8">
                            <div id="stats-row" className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <StatCard
                                    title="Total Submissions"
                                    value={analytics.totalSubmissions.toString()}
                                    backgroundColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                    textColor="#ffffff"
                                    iconColor="#ffffff"
                                />
                                <StatCard
                                    title="Positive Feedback"
                                    value={`${analytics.positivePercentage}%`}
                                    description={`Ratings of '${analytics.positiveLabel}'`}
                                    backgroundColor="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                                    textColor="#ffffff"
                                    iconColor="#ffffff"
                                />
                                <StatCard
                                    title="Most Common Rating"
                                    value={`${analytics.modalRatingName} (${analytics.modalRatingPct}%)`}
                                    backgroundColor="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                                    textColor="#ffffff"
                                    iconColor="#ffffff"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Question Rating Analysis (Bar Chart) */}
                                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <span className="text-secondary-500">📊</span> Question Rating Analysis
                                    </h3>
                                    <div className="h-[400px]">
                                        {analytics.averageChartData.length > 0 ? (
                                            <AverageRatingChart data={analytics.averageChartData} />
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 font-medium italic">No chart data available for current filters</div>
                                        )}
                                    </div>
                                </div>

                                {/* Overall Distribution (Pie Chart) */}
                                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <span className="text-secondary-500">🍕</span> Overall Distribution
                                    </h3>
                                    <div className="h-[400px]">
                                        <PieChartStats
                                            title=""
                                            data={analytics.pieData}
                                            colors={RATINGS.map(r => {
                                                if (r.color.includes('green')) return '#22c55e';
                                                if (r.color.includes('yellow')) return '#eab308';
                                                if (r.color.includes('orange')) return '#f97316';
                                                if (r.color.includes('red')) return '#ef4444';
                                                return '#4f46e5';
                                            })}
                                            height={350}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Statistics Table */}
                            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 underline decoration-primary-200 decoration-4 underline-offset-8">
                                    Feedback Questions Statistics
                                </h3>
                                <div className="overflow-x-auto rounded-xl border border-gray-100">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Question</th>
                                                {analytics.dynamicRatings.map(r => (
                                                    <th key={r.level} className={`px-3 py-4 text-center text-xs font-bold ${r.color}`}>
                                                        {r.label === 'Needs Improvement' ? 'Needs Imp' : (r.label === 'Average' ? 'Avg' : r.label)}
                                                    </th>
                                                ))}
                                                <th className="px-3 py-4 text-center text-[10px] font-bold text-indigo-600 bg-indigo-50/50">AVERAGE</th>
                                                <th className="px-3 py-4 text-center text-[10px] font-bold text-gray-500">TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {analytics.tableData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-primary-50/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                        <span className="text-lg opacity-50">{idx + 1}.</span> {row.question}
                                                    </td>
                                                    {row.levelStats.map(stat => (
                                                        <td key={stat.level} className="px-3 py-4 text-center">
                                                            <div className={`font-bold ${stat.color}`}>{stat.pct}%</div>
                                                            <div className="text-[10px] text-gray-400">({stat.count})</div>
                                                        </td>
                                                    ))}
                                                    <td className="px-3 py-4 text-center bg-indigo-50/30">
                                                        <div className="text-lg font-black text-indigo-700">{row.average}</div>
                                                    </td>
                                                    <td className="px-3 py-4 text-center">
                                                        <div className="font-bold text-gray-700">{row.totalResponses}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* Manage Feedback Section */}
                        <section id="feedback" className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                                    <span className="bg-orange-500 text-white p-2 rounded-lg text-lg"><FaSync /></span>
                                    Manage Feedback Submissions
                                </h2>
                                <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-bold">
                                    {filteredFeedback.length} Records
                                </span>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-gray-200">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f8f9fa] border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Date / Time</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Canteen</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">User</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Emp ID</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Meal</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Rating</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest print-only">Details</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center no-print">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredFeedback.map(fb => (
                                            <tr key={fb.id} className="hover:bg-gray-50/80 transition-all group">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                                                    {new Date(fb.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-800">
                                                    {fb.canteen || fb.canteen_id}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 italic">
                                                    {fb.user_name || fb.username || 'Anonymous'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {fb.user_employee_id || <span style={{ color: '#aaa' }}>-</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-black uppercase">
                                                        {fb.meal_category || 'Other'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-3 h-3 rounded-full ${Number(fb.responses.reduce((s, r) => s + r.rating, 0) / fb.responses.length) > 3 ? 'bg-green-500' : 'bg-yellow-500'} no-print`}></span>
                                                        <span className="font-black text-gray-800 text-lg">
                                                            {(fb.responses.reduce((s, r) => s + r.rating, 0) / fb.responses.length).toFixed(1)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 print-only">
                                                    <div className="text-[10px] space-y-1">
                                                        {fb.responses.map((r, i) => (
                                                            <div key={i} className="flex justify-between gap-4 border-b border-gray-50 pb-1 last:border-0">
                                                                <span className="text-gray-600 font-medium">
                                                                    {r.question_text || questionsMap[String(r.question_id || r.questionId)] || 'Question'}:
                                                                </span>
                                                                <span className="font-bold text-gray-900">{r.rating}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center no-print">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => setDetailsId(fb.id)}
                                                            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all font-bold text-xs flex items-center gap-2 shadow-sm"
                                                        >
                                                            <FaEye /> View Details
                                                        </button>
                                                        {/* Delete button removed per user request */}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}
                {activeTab === 'customize' && (
                    <div className="space-y-10 animate-fade-in">
                        {/* Manage Canteens Section */}
                        < section id="canteens" className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 no-print" >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                                    <span className="bg-emerald-600 text-white p-2 rounded-lg text-lg">🏪</span>
                                    Manage Canteens
                                </h2>
                            </div>

                            <div className="bg-emerald-50 p-6 rounded-2xl mb-8 border border-emerald-100">
                                <h3 className="text-sm font-black text-emerald-800 uppercase mb-4 tracking-widest text-center">Register New Canteen</h3>
                                <div className="flex gap-4 max-w-2xl mx-auto">
                                    <input
                                        id="newCanteenName"
                                        placeholder="Canteen Name (e.g. Main Cafeteria)"
                                        className="flex-1 px-5 py-3 rounded-xl border border-emerald-200 outline-none focus:ring-4 focus:ring-emerald-500/20 text-sm font-medium bg-white"
                                    />
                                    <button
                                        onClick={async () => {
                                            const input = document.getElementById('newCanteenName') as HTMLInputElement;
                                            if (!input.value.trim()) return;
                                            const token = localStorage.getItem('canteenAdminJWT');
                                            const res = await fetch(endpoints.CANTEENS, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ site, name: input.value.trim() })
                                            });
                                            if (res.ok) { input.value = ''; fetchData(); showNotification('Canteen added!'); }
                                        }}
                                        className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                                    >
                                        REGISTER
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {canteens.map(c => (
                                    <div key={c.name} className="p-6 bg-white rounded-2xl border border-gray-200 relative group hover:shadow-xl transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl">🏪</div>
                                            <div className="flex gap-2 no-print">
                                                <button
                                                    onClick={() => {
                                                        setEditingCanteen(c);
                                                        setSlotForm({ category: '', startTime: '', endTime: '' });
                                                    }}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all font-bold text-xs flex items-center gap-2 shadow-sm"
                                                    title="Manage Meal Slots"
                                                >
                                                    <FaEdit /> Manage Slots
                                                </button>
                                                {/* Delete Canteen button removed per user request */}
                                            </div>
                                        </div>

                                        <h4 className="font-black text-gray-800 text-lg mb-2">{c.name}</h4>

                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                                                {c.meal_slots && c.meal_slots.length > 0 ? (
                                                    c.meal_slots.map((s, idx) => (
                                                        <span key={idx} className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100">
                                                            {s.category}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 italic">No meal slots configured</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 pt-2 border-t border-gray-50 uppercase tracking-tighter">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                Active Branch Canteen
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section >

                        {/* QR Codes Section */}
                        < section id="qrcodes" className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 no-print" >
                            <div className="flex items-center justify-between gap-3 mb-8">
                                <div className="flex items-center gap-3">
                                    <span className="bg-indigo-600 text-white p-2 rounded-lg text-lg"><FaQrcode /></span>
                                    <h2 className="text-2xl font-black text-gray-800">Canteen QR Codes</h2>
                                </div>

                                {/* Print All QR Codes Button */}
                                <button
                                    onClick={() => {
                                        const printWindow = window.open('', '_blank', 'width=900,height=700');
                                        if (!printWindow) {
                                            alert('Please allow pop-ups to print QR codes');
                                            return;
                                        }

                                        const qrPromises = canteens.map(c => {
                                            return new Promise<string>((resolve) => {
                                                const qrUrl = `${window.location.origin}/f/${toSlug(site)}/${toSlug(c.name)}`;
                                                const img = new Image();
                                                img.crossOrigin = 'anonymous';
                                                img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(qrUrl);
                                                img.onload = function () {
                                                    const canvas = document.createElement('canvas');
                                                    canvas.width = 300;
                                                    canvas.height = 300;
                                                    const ctx = canvas.getContext('2d');
                                                    if (ctx) {
                                                        ctx.fillStyle = 'white';
                                                        ctx.fillRect(0, 0, 300, 300);
                                                        ctx.drawImage(img, 0, 0);
                                                    }
                                                    const catalystLogoUrl = new URL(catalystLogo, window.location.origin).href;
                                                    resolve(`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; page-break-after: always; width: 210mm; height: 297mm; padding: 40px; box-sizing: border-box; background: white; position: relative;"><div style="position: absolute; top: 30px; left: 40px; right: 40px; display: flex; justify-content: space-between; align-items: center;"><img src="${catalystLogoUrl}" style="height: 40px; object-fit: contain;">${branchLogo ? `<img src="${branchLogo}" style="height: 50px; object-fit: contain; max-width: 170px;">` : ''}</div><div style="font-weight: 900; font-size: 28px; color: #1a1a1a; margin-bottom: 20px;">We Value Your Feedback</div><img src="${canvas.toDataURL()}" style="width: 280px; height: 280px; border: 3px solid #333; padding: 10px; border-radius: 8px; background: white;"><div style="margin-top: 20px; color: #666; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Scan to provide feedback</div><div style="margin-top: 12px; color: #999; font-size: 11px; font-weight: 500;">www.catalystsolutions.eco</div></div>`);
                                                };
                                                img.onerror = () => {
                                                    resolve(`<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; page-break-after: always; width: 210mm; height: 297mm; padding: 40px; box-sizing: border-box; background: white;"><div style="font-size: 18px; color: #ef4444;">Failed to load QR for ${c.name}</div></div>`);
                                                };
                                            });
                                        });

                                        Promise.all(qrPromises).then(qrHtmls => {
                                            const html = `
                                      <html>
                                        <head>
                                          <meta charset="UTF-8">
                                          <title>All QR Codes - ${site}</title>
                                          <style>
                                            * { margin: 0; padding: 0; box-sizing: border-box; }
                                            html, body { font-family: 'Arial', sans-serif; background: white; }
                                            .print-btn { display: flex; gap: 10px; margin: 20px; justify-content: center; }
                                            .print-btn button { padding: 12px 24px; background: #9333ea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.3s; }
                                            .print-btn button:hover { background: #7e22ce; transform: scale(1.05); }
                                            .qr-container { display: flex; flex-direction: column; gap: 0; }
                                            .qr-page { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 210mm; height: 297mm; padding: 40px; box-sizing: border-box; page-break-after: always; page-break-inside: avoid; break-inside: avoid; background: white; }
                                            .qr-page:last-child { page-break-after: auto; }
                                            .qr-page img { border: 3px solid #333; border-radius: 8px; background: white; }
                                            @media print {
                                              body { margin: 0 !important; padding: 0 !important; }
                                              .print-btn { display: none !important; }
                                              .qr-page { page-break-after: always; page-break-inside: avoid; break-inside: avoid; }
                                              .qr-page:last-child { page-break-after: auto; }
                                            }
                                          </style>
                                        </head>
                                        <body>
                                          <div class="print-btn">
                                            <button onclick="window.print()">🖨️ Print All QR Codes</button>
                                            <button onclick="window.close()">Close</button>
                                          </div>
                                          <div class="qr-container">
                                            ${qrHtmls.join('')}
                                          </div>
                                          <script>
                                            window.onload = function() {
                                              setTimeout(() => { window.focus(); }, 300);
                                            };
                                          </script>
                                        </body>
                                      </html>
                                    `;
                                            printWindow.document.write(html);
                                            printWindow.document.close();
                                        });
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition-all hover:scale-105 no-print"
                                >
                                    <FaPrint /> Print All QR Codes
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {canteens.map(c => {
                                    const qrUrl = `${window.location.origin}/f/${toSlug(site)}/${toSlug(c.name)}`;
                                    return (
                                        <div key={c.name} className="p-8 bg-white rounded-3xl border border-gray-200 flex flex-col items-center text-center group hover:shadow-2xl transition-all relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>

                                            <div className="bg-gray-50 p-6 rounded-2xl mb-6 border border-gray-100 shadow-inner">
                                                <QRCode
                                                    value={qrUrl}
                                                    size={160}
                                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                    viewBox={`0 0 256 256`}
                                                />
                                            </div>

                                            <h3 className="font-black text-gray-800 text-xl mb-1">{c.name}</h3>
                                            <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-widest">{site}</p>

                                            <div className="flex flex-col gap-2 w-full no-print">
                                                <button
                                                    onClick={() => {
                                                        const iframe = document.createElement('iframe');
                                                        iframe.style.display = 'none';
                                                        document.body.appendChild(iframe);
                                                        const doc = iframe.contentWindow?.document;
                                                        if (doc) {
                                                            const catalystLogoUrl = new URL(catalystLogo, window.location.origin).href;
                                                            doc.write(`
                                                        <html>
                                                            <head>
                                                                <title>QR Code - ${c.name}</title>
                                                                <style>
                                                                    body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0; position: relative; }
                                                                    .logos { position: absolute; top: 30px; left: 40px; right: 40px; display: flex; justify-content: space-between; align-items: center; }
                                                                    .logos img { height: 40px; object-fit: contain; }
                                                                    .card { text-align: center; max-width: 500px; }
                                                                    .qr { margin: 20px 0; }
                                                                    img.qr-img { width: 300px; height: 300px; }
                                                                    h1 { margin: 10px 0 20px; font-size: 28px; color: #1a1a1a; font-weight: 900; }
                                                                    .url-box { display: inline-block; padding: 12px 30px; border-radius: 12px; font-family: monospace; font-size: 12px; color: #000; font-weight: 700; background: #f8f9fa; border: 2px solid #eee; word-break: break-all; max-width: 90%; }
                                                                    .scan-text { color: #666; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 20px; }
                                                                    .website { color: #999; font-size: 11px; margin-top: 12px; font-weight: 500; }
                                                                    @media print { body { margin: 0; } }
                                                                </style>
                                                            </head>
                                                            <body>
                                                                <div class="logos">
                                                                    <img src="${catalystLogoUrl}" alt="Catalyst">
                                                                    ${branchLogo ? `<img src="${branchLogo}" alt="Branch Logo" style="max-width: 150px;">` : ''}
                                                                </div>
                                                                <div class="card">
                                                                    <h1>We Value Your Feedback</h1>
                                                                    <div class="qr" id="qr-container"></div>
                                                                    <p class="scan-text">Scan to provide feedback</p>
                                                                    <p class="website">www.catalystsolutions.eco</p>
                                                                </div>
                                                                <script>
                                                                    window.onload = function() {
                                                                        const container = document.getElementById('qr-container');
                                                                        const img = new Image();
                                                                        img.className = 'qr-img';
                                                                        img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent("${qrUrl}");
                                                                        img.onload = function() {
                                                                            container.appendChild(img);
                                                                            setTimeout(() => { 
                                                                                window.focus();
                                                                                window.print();
                                                                                setTimeout(() => {
                                                                                    window.frameElement.remove();
                                                                                }, 1000);
                                                                            }, 500);
                                                                        };
                                                                        img.onerror = function() {
                                                                            alert('Failed to load QR code. Please try again.');
                                                                            window.frameElement.remove();
                                                                        };
                                                                    };
                                                                </script>
                                                            </body>
                                                        </html>
                                                    `);
                                                            doc.close();
                                                        }
                                                    }}
                                                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                                                >
                                                    <FaPrint /> PRINT QR CODE
                                                </button>
                                                <a
                                                    href={qrUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-full bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <FaEye /> OPEN FORM
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}

                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                        body, .min-h-screen { background: white !important; margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; }
                        main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; display: block !important; }
                        section { border: none !important; box-shadow: none !important; break-inside: auto !important; margin-bottom: 20px !important; padding: 10px !important; display: block !important; page-break-inside: auto !important; }
                        #stats-row { 
                            display: grid !important; 
                            grid-template-columns: repeat(3, 1fr) !important; 
                            gap: 15px !important; 
                            margin-bottom: 30px !important;
                        }
                        .animate-slide-up, .animate-fade-in, .animate-scale-up { 
                            animation: none !important; 
                            transform: none !important; 
                            opacity: 1 !important; 
                            visibility: visible !important;
                            transition: none !important;
                        }
                        h2, h3 { margin-bottom: 5px !important; break-after: avoid; }
                        .grid { display: grid !important; }
                        .grid > div { break-inside: avoid; }
                        table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #e5e7eb !important; }
                        th, td { border: 1px solid #e5e7eb !important; padding: 12px 8px !important; }
                        tr { break-inside: avoid !important; page-break-inside: avoid !important; }
                        .print-only { display: table-cell !important; }
                        th.print-only { display: table-cell !important; background: #f9fafb !important; }
                        
                        /* Ensure Dashboard content prints even if hide/show tab is active */
                        #feedback, #analytics { display: block !important; }
                    }
                    .print-only { display: none; }
                `}</style>
            </main>

            {/* --- Modals --- */}

            {/* Details Modal */}
            {
                detailsId && activeFeedback && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDetailsId(null)}>
                        <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="bg-gradient-to-r from-indigo-600 to-primary-500 px-5 py-4 text-white relative flex-shrink-0">
                                <button onClick={() => setDetailsId(null)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors text-lg">
                                    <FaTimes />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-xl text-lg">📅</div>
                                    <div>
                                        <h4 className="font-black text-lg tracking-tight">Feedback Details</h4>
                                        <p className="text-white/70 text-xs font-bold">{new Date(activeFeedback.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 space-y-4 overflow-y-auto flex-1">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Canteen</p>
                                        <p className="font-bold text-sm text-gray-800">{activeFeedback.canteen || activeFeedback.canteen_id}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Meal Slot</p>
                                        <p className="font-bold text-sm text-blue-600">{activeFeedback.selected_meal_slot || activeFeedback.meal_category || 'Other'}</p>
                                    </div>
                                    {activeFeedback.user_name && (
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Name</p>
                                            <p className="font-bold text-sm text-gray-800">{activeFeedback.user_name}</p>
                                        </div>
                                    )}
                                    {activeFeedback.user_employee_id && (
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Employee ID</p>
                                            <p className="font-bold text-sm text-gray-800">{activeFeedback.user_employee_id}</p>
                                        </div>
                                    )}
                                    {activeFeedback.user_department && (
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Department</p>
                                            <p className="font-bold text-sm text-gray-800">{activeFeedback.user_department}</p>
                                        </div>
                                    )}
                                </div>
                                {activeFeedback.user_suggestion && (
                                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                                        <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest mb-0.5">💡 Suggestion</p>
                                        <p className="text-sm text-gray-800 font-medium">{activeFeedback.user_suggestion}</p>
                                    </div>
                                )}
                                {activeFeedback.custom_field_values && typeof activeFeedback.custom_field_values === 'object' && Object.keys(activeFeedback.custom_field_values).length > 0 && (
                                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 mb-3">
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5">Custom Fields</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {Object.entries(activeFeedback.custom_field_values).map(([k, v]) => (
                                                <div key={k}>
                                                    <span className="font-bold text-gray-600 block">{k}:</span>
                                                    <span className="text-gray-800">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <p className="text-xs font-black text-gray-800 uppercase border-b border-gray-100 pb-1.5">Responses</p>
                                    <div className="space-y-2">
                                        {activeFeedback.responses.map((r, i) => {
                                            const isNumericRating = typeof r.rating === 'number' && !isNaN(r.rating) && r.rating !== null;
                                            if (!isNumericRating) {
                                                let displayAns = r.answer || '';
                                                if (typeof displayAns === 'string' && displayAns.startsWith('[') && displayAns.endsWith(']')) {
                                                    try {
                                                        const parsed = JSON.parse(displayAns);
                                                        if (Array.isArray(parsed)) displayAns = parsed.join(', ');
                                                    } catch {}
                                                }
                                                return (
                                                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <span className="text-xs font-bold text-gray-700 flex-1 pr-3">{r.question_text || `Question ${r.question_id}`}</span>
                                                        <div className="flex flex-col items-end flex-shrink-0">
                                                            <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                                                                {displayAns || 'Answered'}
                                                            </span>
                                                            {r.other_text && (
                                                                <span className="text-[10px] text-gray-500 italic mt-0.5">
                                                                    ({r.other_text})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            const label = r.rating_label || RATING_LABELS[r.rating] || 'Rated';
                                            const isPositive = r.rating_label
                                                ? ['good', 'excellent', 'great', 'very good'].some(w => (r.rating_label || '').toLowerCase().includes(w))
                                                : r.rating >= 3;
                                            return (
                                                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <span className="text-xs font-bold text-gray-700 flex-1 pr-3">{r.question_text || `Question ${r.question_id}`}</span>
                                                    <div className="flex flex-col items-end flex-shrink-0">
                                                        <span className={`text-[10px] font-black uppercase ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                            {label}
                                                        </span>
                                                        <span className={`text-sm font-black ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                            {r.rating}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteFbId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Are you sure?</h3>
                            <p className="text-gray-500 font-medium mb-8 italic">"This feedback will be permanently removed from our system."</p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleteFbId(null)} className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all">Cancel</button>
                                <button onClick={handleDeleteFeedback} className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all">Delete</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Slots Modal */}
            {
                editingCanteen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in no-print">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all scale-100 overflow-hidden border border-gray-100">
                            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800">Manage Meal Slots</h3>
                                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-tighter">
                                        Canteen: {editingCanteen.name}
                                    </p>
                                </div>
                                <button onClick={() => setEditingCanteen(null)} className="p-2 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm border border-gray-100 transition-all">
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                                <div className={`${editingSlotIndex !== null ? 'bg-blue-50/50 border-blue-100' : 'bg-indigo-50/50 border-indigo-100'} p-6 rounded-2xl border mb-8 shadow-sm transition-colors`}>
                                    <h4 className={`font-black mb-4 ${editingSlotIndex !== null ? 'text-blue-900' : 'text-indigo-900'} flex items-center justify-between text-sm uppercase tracking-wider`}>
                                        <div className="flex items-center gap-2">
                                            <span>{editingSlotIndex !== null ? '✏️ Edit Slot' : '➕ Add New Slot'}</span>
                                        </div>
                                        {editingSlotIndex !== null && (
                                            <button
                                                onClick={() => {
                                                    setEditingSlotIndex(null);
                                                    setSlotForm({ category: '', startTime: '', endTime: '' });
                                                }}
                                                className="text-[10px] bg-white text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg border border-gray-100 shadow-sm transition-all"
                                            >
                                                CANCEL EDIT
                                            </button>
                                        )}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Category</label>
                                            <input
                                                placeholder="e.g. Lunch"
                                                className="w-full text-xs font-bold p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                                                value={slotForm.category}
                                                onChange={(e) => setSlotForm({ ...slotForm, category: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Start Time</label>
                                            <input
                                                type="time"
                                                className="w-full text-xs font-bold p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                                                value={slotForm.startTime}
                                                onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">End Time</label>
                                            <input
                                                type="time"
                                                className="w-full text-xs font-bold p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                                                value={slotForm.endTime}
                                                onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddSlot}
                                        className={`mt-6 w-full ${editingSlotIndex !== null ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'} text-white text-xs font-black py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide`}
                                    >
                                        {editingSlotIndex !== null ? 'Update Slot Data' : 'Add Slot To Config'}
                                    </button>
                                </div>

                                <div>
                                    <h4 className="font-black mb-4 text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <span>📋</span> Configured Slots
                                    </h4>
                                    {editingCanteen.meal_slots && editingCanteen.meal_slots.length > 0 ? (
                                        <div className="space-y-3">
                                            {editingCanteen.meal_slots.map((slot, i) => (
                                                <div key={i} className={`flex items-center justify-between bg-white p-5 rounded-2xl border ${editingSlotIndex === i ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all group`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2.5 rounded-xl text-xl ${editingSlotIndex === i ? 'bg-blue-100' : 'bg-indigo-50'}`}>⏰</div>
                                                        <div>
                                                            <span className="font-black text-gray-800 text-sm block">{slot.category}</span>
                                                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                                                                {slot.startTime} <span className="text-gray-200 mx-1">➜</span> {slot.endTime}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditSlot(i)}
                                                            className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl font-black text-[10px] transition-all uppercase tracking-widest flex items-center gap-2"
                                                        >
                                                            <FaEdit size={10} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveSlot(i)}
                                                            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl font-black text-[10px] transition-all uppercase tracking-widest flex items-center gap-2"
                                                        >
                                                            <FaTrash size={10} /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No slots configured yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 border-t bg-gray-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingCanteen(null)}
                                    className="px-6 py-3 text-gray-500 font-bold hover:bg-white rounded-xl transition-all text-xs uppercase tracking-widest"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    onClick={handleSaveSlots}
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 transform active:scale-95 transition-all flex items-center gap-2 text-xs uppercase tracking-widest disabled:bg-gray-400"
                                >
                                    {isLoading ? 'Saving...' : 'Confirm & Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Canteen Delete Modal */}
            {
                canteenToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-scale-up">
                            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">🗑️</div>
                            <h3 className="text-2xl font-black text-gray-800 mb-4">Delete Canteen?</h3>
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-8">
                                <p className="text-red-700 font-bold text-sm leading-relaxed">
                                    <span className="block mb-2 uppercase tracking-widest text-[10px] opacity-70">Warning!</span>
                                    This will permanently remove the canteen "<span className="underline decoration-2">{canteenToDelete.name}</span>" and all its associated data, including feedback history and configured meal slots.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCanteenToDelete(null)}
                                    className="flex-1 py-4 px-6 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    No, Keep It
                                </button>
                                <button
                                    onClick={handleDeleteCanteen}
                                    className="flex-1 py-4 px-6 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/30 transition-all active:scale-95"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Notification Toast */}
            {
                notification && (
                    <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl animate-slide-up flex items-center gap-3">
                        <span className="text-green-400 font-bold text-xl">✅</span>
                        <span className="font-bold tracking-tight">{notification}</span>
                    </div>
                )
            }

            <footer className="w-full py-8 text-center text-gray-400 text-sm border-t border-gray-200 bg-white no-print">
                &copy; 2025 Canteen Feedback System. Site Portal: <span className="font-black text-gray-600">{site}</span>
            </footer>
        </div >
    );
};

export default BranchAdminDashboard;
