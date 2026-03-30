import React, { useEffect, useState } from 'react';
import { getEndpoints } from '../constants';
import { FaSave, FaTimes } from 'react-icons/fa';
import { CustomQuestionRenderer } from './CustomQuestionRenderer';

// ============= TYPES =============
interface CustomizationOption {
  value: number;
  label: string;
  emoji?: string;
  color?: string;
}

interface ScaleCustomization {
  type: 'scale';
  minValue: number;
  maxValue: number;
  minLabel: string;
  maxLabel: string;
  symbol: 'number' | 'stars' | 'bars';
}

interface StarRatingCustomization {
  type: 'star_rating';
  numberOfStars: number;
  options: CustomizationOption[];
}

interface SmileyFaceCustomization {
  type: 'smiley_faces';
  options: CustomizationOption[];
}

interface YesNoCustomization {
  type: 'yes_no';
  yesLabel: string;
  noLabel: string;
  yesColor: string;
  noColor: string;
  visualStyle: 'buttons' | 'toggle' | 'radio';
}

type Customization = ScaleCustomization | StarRatingCustomization | SmileyFaceCustomization | YesNoCustomization;

interface Canteen {
  id: number;
  name: string;
  site_id: number;
  site: string;
  meal_slots?: any;
}

interface Question {
  id: number;
  site: string;
  question_text: string;
  emoji?: string;
  response_type?: string;
  customization?: Customization;
}

const EMOJI_PRESETS = ['😞', '😐', '🙂', '😊', '😍', '👎', '👍', '⭐', '🌟', '❤️', '🔥', '💯', '✨', '🎉', '🙌'];

// Emoji Preset Sets for Smiley Faces
const EMOJI_PRESET_SETS = {
  preset1: {
    name: 'Classic Smileys',
    options: [
      { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
      { value: 2, label: 'Needs Improvement', emoji: '😐', color: '#f97316' },
      { value: 3, label: 'Average', emoji: '🙂', color: '#eab308' },
      { value: 4, label: 'Good', emoji: '😀', color: '#22c55e' }
    ]
  },
  preset2: {
    name: 'Expressive Faces',
    options: [
      { value: 1, label: 'Very Unhappy', emoji: '😢', color: '#dc2626' },
      { value: 2, label: 'Unhappy', emoji: '😞', color: '#f97316' },
      { value: 3, label: 'Neutral', emoji: '😐', color: '#eab308' },
      { value: 4, label: 'Happy', emoji: '😄', color: '#65a30d' },
      { value: 5, label: 'Very Happy', emoji: '😄', color: '#22c55e' }
    ]
  },
  preset3: {
    name: 'Thumbs & Hearts',
    options: [
      { value: 1, label: 'Disappointed', emoji: '👎', color: '#ef4444' },
      { value: 2, label: 'Dislike', emoji: '😕', color: '#f97316' },
      { value: 3, label: 'Neutral', emoji: '😐', color: '#eab308' },
      { value: 4, label: 'Like', emoji: '😊', color: '#22c55e' },
      { value: 5, label: 'Love', emoji: '❤️', color: '#ec4899' }
    ]
  },
  preset4: {
    name: 'Star Ratings',
    options: [
      { value: 1, label: 'Terrible', emoji: '⭐', color: '#7f1d1d' },
      { value: 2, label: 'Poor', emoji: '⭐⭐', color: '#dc2626' },
      { value: 3, label: 'Average', emoji: '⭐⭐⭐', color: '#eab308' },
      { value: 4, label: 'Good', emoji: '⭐⭐⭐⭐', color: '#22c55e' },
      { value: 5, label: 'Excellent', emoji: '⭐⭐⭐⭐⭐', color: '#166534' }
    ]
  },
  preset5: {
    name: 'Energy Levels',
    options: [
      { value: 1, label: 'Drained', emoji: '😫', color: '#ef4444' },
      { value: 2, label: 'Tired', emoji: '😪', color: '#f97316' },
      { value: 3, label: 'Okay', emoji: '🙂', color: '#eab308' },
      { value: 4, label: 'Energetic', emoji: '😊', color: '#22c55e' },
      { value: 5, label: 'Pumped', emoji: '🔥', color: '#15803d' }
    ]
  }
};

// ============= CUSTOMIZATION EDITOR COMPONENT =============
interface CustomizationEditorProps {
  customization: Customization;
  onUpdate: (customization: Customization) => void;
}

const CustomizationEditor: React.FC<CustomizationEditorProps> = ({ customization, onUpdate }) => {
  if (customization.type === 'smiley_faces') {
    const sfc = customization as SmileyFaceCustomization;
    const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);

    const handleAddEmoji = () => {
      const newOption: CustomizationOption = {
        value: sfc.options.length + 1,
        label: `Option ${sfc.options.length + 1}`,
        emoji: '😊',
        color: '#22c55e'
      };
      onUpdate({ ...customization, options: [...sfc.options, newOption] });
    };

    const handleRemoveEmoji = (index: number) => {
      if (sfc.options.length > 2) {
        const newOpts = sfc.options.filter((_, i) => i !== index);
        onUpdate({ ...customization, options: newOpts });
      }
    };

    const handleUpdateEmoji = (index: number, field: 'emoji' | 'label' | 'color', value: string) => {
      const newOpts = [...sfc.options];
      newOpts[index] = { ...newOpts[index], [field]: value };
      onUpdate({ ...customization, options: newOpts });
    };

    const handleApplyPreset = (presetKey: string) => {
      const preset = EMOJI_PRESET_SETS[presetKey as keyof typeof EMOJI_PRESET_SETS];
      if (preset) {
        onUpdate({ ...customization, options: preset.options });
      }
    };

    return (
      <div className="p-4 bg-gray-100 rounded border border-gray-300 space-y-4">
        <div className="flex justify-between items-center mb-3">
          <h5 className="font-semibold text-lg">🎨 Emoji Customization</h5>
          <button
            type="button"
            onClick={handleAddEmoji}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            + Add Emoji
          </button>
        </div>

        {/* Preset Selector */}
        <div className="p-3 bg-blue-50 rounded border border-blue-300">
          <label className="text-sm font-semibold text-gray-700 block mb-2">📦 Quick Presets:</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(EMOJI_PRESET_SETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleApplyPreset(key)}
                className="p-2 bg-white border-2 border-blue-300 rounded text-xs font-medium text-gray-700 hover:bg-blue-100 hover:border-blue-500 transition text-center"
                title={preset.name}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {sfc.options.map((opt, i) => (
            <div key={i} className="p-4 bg-white rounded border-2 border-gray-300 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">Option {i + 1}</span>
                {sfc.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmoji(i)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Emoji Selector */}
                <div>
                  <label className="text-xs font-medium block mb-1">Emoji</label>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(showEmojiPicker === i ? null : i)}
                    style={{ backgroundColor: opt.color }}
                    className="w-full p-3 rounded text-3xl font-bold text-white border-2 border-gray-300"
                  >
                    {opt.emoji}
                  </button>
                  {showEmojiPicker === i && (
                    <div className="mt-2 p-2 bg-white border-2 border-gray-300 rounded grid grid-cols-5 gap-1">
                      {EMOJI_PRESETS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            handleUpdateEmoji(i, 'emoji', emoji);
                            setShowEmojiPicker(null);
                          }}
                          className="p-2 text-2xl hover:bg-gray-100 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Label */}
                <div>
                  <label className="text-xs font-medium block mb-1">Label</label>
                  <input
                    type="text"
                    value={opt.label}
                    onChange={e => handleUpdateEmoji(i, 'label', e.target.value)}
                    className="w-full p-2 border-2 border-gray-300 rounded text-sm"
                    placeholder="e.g., Good"
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="text-xs font-medium block mb-1">Color</label>
                  <input
                    type="color"
                    value={opt.color || '#22c55e'}
                    onChange={e => handleUpdateEmoji(i, 'color', e.target.value)}
                    className="w-full p-2 border-2 border-gray-300 rounded h-10 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (customization.type === 'star_rating') {
    const sc = customization as StarRatingCustomization;
    return (
      <div className="p-4 bg-gray-100 rounded border border-gray-300 space-y-3">
        <h5 className="font-semibold">Star Count</h5>
        <input
          type="number"
          min="3"
          max="10"
          value={sc.numberOfStars}
          onChange={e => onUpdate({ ...customization, numberOfStars: parseInt(e.target.value) })}
          className="w-20 p-2 border rounded"
        />
      </div>
    );
  }

  if (customization.type === 'scale') {
    const sc = customization as ScaleCustomization;
    return (
      <div className="p-4 bg-gray-100 rounded border border-gray-300 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Min Value</label>
            <input type="number" value={sc.minValue} onChange={e => onUpdate({ ...customization, minValue: parseInt(e.target.value) })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">Max Value</label>
            <input type="number" value={sc.maxValue} onChange={e => onUpdate({ ...customization, maxValue: parseInt(e.target.value) })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">Min Label</label>
            <input type="text" value={sc.minLabel} onChange={e => onUpdate({ ...customization, minLabel: e.target.value })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">Max Label</label>
            <input type="text" value={sc.maxLabel} onChange={e => onUpdate({ ...customization, maxLabel: e.target.value })} className="w-full p-2 border rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (customization.type === 'yes_no') {
    const yn = customization as YesNoCustomization;
    return (
      <div className="p-4 bg-gray-100 rounded border border-gray-300 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Yes Label</label>
            <input type="text" value={yn.yesLabel} onChange={e => onUpdate({ ...customization, yesLabel: e.target.value })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">No Label</label>
            <input type="text" value={yn.noLabel} onChange={e => onUpdate({ ...customization, noLabel: e.target.value })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">Yes Color</label>
            <input type="color" value={yn.yesColor} onChange={e => onUpdate({ ...customization, yesColor: e.target.value })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">No Color</label>
            <input type="color" value={yn.noColor} onChange={e => onUpdate({ ...customization, noColor: e.target.value })} className="w-full p-2 border rounded" />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ============= MAIN COMPONENT =============
interface AdminQuestionManagerProps {
  site?: string; // Optional prop to lock to a specific site
}

const AdminQuestionManager: React.FC<AdminQuestionManagerProps> = ({ site: initialSite }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const endpoints = getEndpoints();
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [form, setForm] = useState({ site: initialSite || '', question_text: '', response_type: 'smiley_faces' });
  const [customization, setCustomization] = useState<Customization | null>(() => {
    // Default to 'smiley_faces' with clean colorful emojis
    return {
      type: 'smiley_faces',
      options: [
        { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
        { value: 2, label: 'Needs Improvement', emoji: '😐', color: '#f97316' },
        { value: 3, label: 'Average', emoji: '🙂', color: '#eab308' },
        { value: 4, label: 'Good', emoji: '😀', color: '#22c55e' }
      ]
    } as SmileyFaceCustomization;
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingCustomization, setEditingCustomization] = useState<Customization | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showEditCustomizer, setShowEditCustomizer] = useState(false);

  const [sites, setSites] = useState<string[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>(initialSite || '');
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteen, setSelectedCanteen] = useState<string>(''); // Stores canteen name
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSelectedSite, setImportSelectedSite] = useState<string>('');
  const [importCanteensForSite, setImportCanteensForSite] = useState<Canteen[]>([]);
  const [importCanteenId, setImportCanteenId] = useState<number | ''>(''); // Stores canteen ID for import
  const [userRole, setUserRole] = useState<string>('');
  const [branchAdminSite, setBranchAdminSite] = useState<string>('');

  // Get user role from JWT
  useEffect(() => {
    if (initialSite) {
      setSelectedSite(initialSite);
      setForm(prev => ({ ...prev, site: initialSite }));
    }
    const token = localStorage.getItem('canteenAdminJWT');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || '');
        if (payload.role === 'branch_admin' && payload.site) {
          setBranchAdminSite(payload.site);
          if (!initialSite) setSelectedSite(payload.site);
        }
      } catch { }
    }
  }, [initialSite]);

  // Fetch sites
  useEffect(() => {
    fetch(endpoints.SITES)
      .then(res => res.json())
      .then(data => {
        const allSites = Array.isArray(data.sites) ? data.sites.map((s: any) => s.location) : [];
        // Filter sites for branch admins
        if (userRole === 'branch_admin' && branchAdminSite) {
          setSites([branchAdminSite]);
        } else {
          setSites(allSites);
        }
      })
      .catch(() => setSites([]));
  }, [userRole, branchAdminSite]);

  // Fetch canteens for import modal when site changes
  useEffect(() => {
    if (!importSelectedSite) {
      setImportCanteensForSite([]);
      setImportCanteenId('');
      return;
    }
    const token = localStorage.getItem('canteenAdminJWT');
    fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(importSelectedSite)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const canteenList: Canteen[] = data.details || [];
        setImportCanteensForSite(canteenList);
        setImportCanteenId('');
      })
      .catch(() => setImportCanteensForSite([]));
  }, [importSelectedSite]);

  // Fetch canteens when site changes
  useEffect(() => {
    if (!selectedSite) {
      setCanteens([]);
      setSelectedCanteen('');
      return;
    }
    const token = localStorage.getItem('canteenAdminJWT');
    fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(selectedSite)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const canteenList: Canteen[] = data.details || []; // details contains the full objects including id
        setCanteens(canteenList);
        setSelectedCanteen('');
      })
      .catch(() => setCanteens([]));
  }, [selectedSite]);

  // Fetch questions when site and/or canteen changes
  const fetchQuestions = async () => {
    if (!selectedSite) {
      setQuestions([]);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      // Find the canteen ID if selected
      const canteenObj = canteens.find(c => c.name === selectedCanteen);
      const branchIdParam = canteenObj ? `&branch_id=${canteenObj.id}` : '';

      const res = await fetch(`${endpoints.QUESTIONS}?site=${encodeURIComponent(selectedSite)}${branchIdParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.questions) ? data.questions : [];
        const processedItems = items.map((q: any) => {
          // Parse customization if it's a JSON string
          let customization = q.customization;
          if (typeof customization === 'string') {
            try {
              customization = JSON.parse(customization);
            } catch (e) {
              console.warn('Failed to parse customization for question', q.id, ':', customization);
              customization = null;
            }
          }
          return {
            ...q,
            site: selectedSite,
            customization: customization
          };
        });
        setQuestions(processedItems);
        console.log('Fetched questions for admin:', processedItems);
      }
    } catch (err: any) {
      setError('Failed to fetch questions');
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedSite, selectedCanteen]); // Re-fetch when selectedCanteen changes

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const getInitialCustomization = (type: string): Customization => {
    switch (type) {
      case 'smiley_faces':
        return {
          type: 'smiley_faces',
          options: [
            { value: 1, label: 'Poor', emoji: '😡', color: '#ef4444' },
            { value: 2, label: 'Needs Improvement', emoji: '😟', color: '#f97316' },
            { value: 3, label: 'Average', emoji: '😐', color: '#eab308' },
            { value: 4, label: 'Good', emoji: '😊', color: '#22c55e' },
            { value: 5, label: 'Excellent', emoji: '😍', color: '#ec4899' }
          ]
        } as SmileyFaceCustomization;
      case 'star_rating':
        return {
          type: 'star_rating',
          numberOfStars: 5,
          options: [
            { value: 1, label: 'Poor' },
            { value: 2, label: 'Fair' },
            { value: 3, label: 'Average' },
            { value: 4, label: 'Good' },
            { value: 5, label: 'Excellent' }
          ]
        } as StarRatingCustomization;
      case 'scale':
        return {
          type: 'scale',
          minValue: 1,
          maxValue: 10,
          minLabel: 'Poor',
          maxLabel: 'Excellent',
          symbol: 'number'
        } as ScaleCustomization;
      case 'yes_no':
        return {
          type: 'yes_no',
          yesLabel: 'Yes',
          noLabel: 'No',
          yesColor: '#22c55e',
          noColor: '#ef4444',
          visualStyle: 'buttons'
        } as YesNoCustomization;
      default:
        return {} as any;
    }
  };

  const handleResponseTypeChange = (type: any) => {
    setForm({ ...form, response_type: type });
    setCustomization(getInitialCustomization(type));
  };

  const handleEditResponseTypeChange = (type: any) => {
    if (!editingQuestion) return;
    setEditingId(editingId); // Keep ID
    const initialCust = getInitialCustomization(type);
    setEditingQuestion({ ...editingQuestion, response_type: type, customization: initialCust });
    setEditingCustomization(initialCust);
  };

  const handleImportQuestions = async () => {
    if (!importCanteenId || !selectedCanteen) {
      setError('Please select a source canteen and ensure a destination canteen is selected.');
      return;
    }
    const currentCanteen = canteens.find(c => c.name === selectedCanteen);
    if (!currentCanteen) {
      setError('Destination canteen not found.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      // 1. Fetch questions from source canteen - MUST pass site to avoid getting everything
      const resSource = await fetch(`${endpoints.QUESTIONS}?site=${encodeURIComponent(importSelectedSite)}&branch_id=${importCanteenId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataSource = await resSource.json();
      const sourceQuestions = dataSource.questions || [];

      if (sourceQuestions.length === 0) {
        showNotification('No questions found in source canteen.');
        setLoading(false);
        setShowImportModal(false);
        return;
      }

      // 2. Map and POST each question to current canteen
      let successCount = 0;
      let failCount = 0;

      for (const q of sourceQuestions) {
        const res = await fetch(endpoints.QUESTIONS, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            site: selectedSite,
            branch_id: currentCanteen.id, // Use the ID of the currently selected canteen
            question_text: q.question_text,
            emoji: q.emoji,
            response_type: q.response_type,
            customization: q.customization
          })
        });
        if (res.ok) successCount++;
        else failCount++;
      }

      await fetchQuestions();
      setShowImportModal(false);
      if (failCount > 0) {
        showNotification(`Imported ${successCount} questions, but ${failCount} failed. ⚠️`);
      } else {
        showNotification(`Imported all ${successCount} questions! 🚀`);
      }
    } catch (err) {
      setError('Failed to import questions');
      console.error('Import error:', err);
    }
    setLoading(false);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite || !form.question_text.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!selectedCanteen) {
      setError('Please select a canteen to add the question to.');
      return;
    }

    setError('');
    if (!form.question_text.trim()) {
      setError('Question text cannot be empty.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const canteenObj = canteens.find(c => c.name === selectedCanteen);

      const payload: any = {
        site: selectedSite,
        question_text: form.question_text,
        response_type: form.response_type,
      };

      if (customization) {
        payload.customization = customization;
      }

      if (canteenObj) {
        payload.branch_id = canteenObj.id; // Use the ID of the selected canteen
      } else {
        setError('Selected canteen not found.');
        setLoading(false);
        return;
      }

      const res = await fetch(endpoints.QUESTIONS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to add question');

      setForm({ site: selectedSite, question_text: '', response_type: 'smiley_faces' });
      setCustomization(null);
      setShowCustomizer(false);
      await fetchQuestions();
      showNotification('Question added! 🎉');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const res = await fetch(`${endpoints.QUESTIONS}?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== id));
        showNotification('Deleted.');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to delete');
      }
    } catch (e) {
      console.error(e);
      setError('Error deleting question');
    }
    setLoading(false);
  };

  const handleEditSave = async (id: number) => {
    if (!editingQuestion || !editingQuestion.question_text.trim()) {
      setError('Question text cannot be empty');
      return;
    }
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const payload: any = {
        question_text: editingQuestion.question_text,
        response_type: editingQuestion.response_type
      };

      if (editingCustomization) {
        payload.customization = editingCustomization;
      }

      const res = await fetch(`${endpoints.QUESTIONS}/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditingId(null);
        setEditingQuestion(null);
        await fetchQuestions();
        showNotification('Updated. 🎉');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to update question');
      }
    } catch (e: any) {
      console.error(e);
      setError('Error updating question: ' + e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-xl mt-6">
      {/* Import Questions Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-scale-up border border-indigo-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Import Questions</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
            </div>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              Copy all questions from another canteen to <strong>{selectedCanteen}</strong>. This will help you reuse common question sets quickly.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-indigo-600 uppercase mb-2 tracking-widest">Step 1: Select Source Site</label>
                <select
                  value={importSelectedSite}
                  onChange={(e) => setImportSelectedSite(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium"
                >
                  <option value="">Select a site...</option>
                  {sites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-indigo-600 uppercase mb-2 tracking-widest">Step 2: Select Source Canteen</label>
                <select
                  value={importCanteenId}
                  onChange={(e) => setImportCanteenId(parseInt(e.target.value))}
                  disabled={!importSelectedSite}
                  className="w-full p-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium disabled:opacity-50"
                >
                  <option value="">Select a canteen...</option>
                  {importCanteensForSite.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-4 px-6 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all border-2 border-transparent"
              >
                Go Back
              </button>
              <button
                onClick={handleImportQuestions}
                disabled={!importCanteenId || loading}
                className="flex-[2] py-4 px-6 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></div>
                    Importing...
                  </>
                ) : (
                  <>Confirm Import 🚀</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-8 right-8 z-[200] animate-slide-up">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <span className="text-xl">✅</span>
            <span className="font-bold">{notification}</span>
          </div>
        </div>
      )}

      {error && <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">❌ {error}</div>}

      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg py-3 mb-6 shadow px-4">
        <h2 className="text-xl font-bold text-white">📋 Manage Questions with Customization {userRole === 'branch_admin' && `(${branchAdminSite})`}</h2>
      </div>

      {/* Site & Canteen Selection */}
      <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">🎯 Step 1: Select Context</h3>
        {userRole === 'branch_admin' && (
          <div className="mb-4 p-3 bg-blue-100 border-l-4 border-blue-500 text-sm text-blue-700">
            ℹ️ As a Branch Admin, you can only manage questions for your site: <strong>{branchAdminSite}</strong>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📍 Select Site (Required)</label>
            <select
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
              disabled={userRole === 'branch_admin'}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Site --</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🏪 Select Canteen</label>
            <select value={selectedCanteen} onChange={e => setSelectedCanteen(e.target.value)} disabled={!selectedSite} className="w-full p-3 border-2 border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed">
              <option value="">-- Select Canteen --</option>
              {canteens.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Add New Question */}
      {selectedSite && (
        <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">➕ Step 2: Add New Question</h3>
          <form onSubmit={handleAddQuestion} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
              <input value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="e.g. How was the food quality?" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Response Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'smiley_faces', label: 'Smiley Faces', icon: '😊' },
                  { id: 'star_rating', label: 'Star Rating', icon: '⭐' },
                  { id: 'scale', label: 'Scale', icon: '📊' },
                  { id: 'yes_no', label: 'Yes/No', icon: '✅' }
                ].map(type => (
                  <button key={type.id} type="button" onClick={() => handleResponseTypeChange(type.id)}
                    className={`p-4 rounded-lg font-semibold transition-all border-2 flex flex-col items-center gap-2 ${form.response_type === type.id ? 'bg-primary-600 text-white border-primary-700 shadow-lg' : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                      }`}>
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-xs">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {form.response_type && customization && (
              <div className="p-4 bg-white rounded-lg border-2 border-primary-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">🎨 Customization</h4>
                  <button type="button" onClick={() => setShowCustomizer(!showCustomizer)} className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {showCustomizer ? '🔽 Hide' : '🔼 Edit'}
                  </button>
                </div>

                {/* Modern Preview Area - Matches Feedback Form */}
                <div className="mb-6 p-6 bg-gray-50 rounded-2xl border-2 border-indigo-50 shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Question Preview</span>
                    <button type="button" onClick={() => setShowCustomizer(!showCustomizer)} className="text-[10px] px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg font-black hover:bg-indigo-200 transition-colors uppercase">
                      {showCustomizer ? 'Hide Editor' : 'Edit Options'}
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <h3 className="font-bold text-gray-800 mb-6 text-center">{form.question_text || 'Your Question Here?'}</h3>
                    <CustomQuestionRenderer
                      question={{ id: 0, question_text: form.question_text, response_type: form.response_type, customization: customization || undefined }}
                      onChange={() => { }}
                    />
                  </div>
                </div>

                {showCustomizer && (
                  <div className="p-4 bg-white rounded-xl border-2 border-indigo-100 mb-6">
                    <CustomizationEditor customization={customization || getInitialCustomization(form.response_type)} onUpdate={setCustomization} />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !form.question_text.trim() || !selectedSite || !selectedCanteen}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-primary-200 transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <FaSave /> {loading ? 'Saving...' : '➕ Add Question'}
              </button>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                disabled={loading || !selectedCanteen}
                className="flex-1 bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-bold py-4 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                📥 Use Existing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">📝 Step 3: View & Manage Questions {selectedSite && `for ${selectedSite}`}</h3>

        {loading && <div className="text-center py-6 text-gray-500">Loading questions...</div>}

        {!loading && questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="bg-white p-4 rounded-lg border-l-4 border-primary-500 shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {editingId === q.id && editingQuestion ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Question Text</label>
                          <input value={editingQuestion.question_text} onChange={e => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })} className="w-full p-2 border-2 border-primary-500 rounded-lg text-lg font-semibold" placeholder="Question text" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase mb-3 block tracking-widest">Select new response type if needed</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {[
                              { id: 'smiley_faces', label: 'Smileys', icon: '😊' },
                              { id: 'star_rating', label: 'Stars', icon: '⭐' },
                              { id: 'scale', label: 'Scale', icon: '📊' },
                              { id: 'yes_no', label: 'Yes/No', icon: '✅' }
                            ].map(type => (
                              <button key={type.id} type="button" onClick={() => handleEditResponseTypeChange(type.id)}
                                className={`p-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${editingQuestion.response_type === type.id ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
                                  }`}>
                                <span className="text-xl">{type.icon}</span>
                                <span className="text-[10px] uppercase">{type.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {editingQuestion.response_type && editingCustomization && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-2xl border-2 border-indigo-50">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-bold text-indigo-400 uppercase text-[10px] tracking-widest">Question Preview</h4>
                              <button type="button" onClick={() => setShowEditCustomizer(!showEditCustomizer)} className="text-[10px] px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-black hover:bg-indigo-100 transition-colors uppercase">
                                {showEditCustomizer ? 'Hide Editor' : 'Edit Options'}
                              </button>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center mb-4">
                              <h3 className="font-bold text-gray-800 mb-6 text-center">{editingQuestion.question_text}</h3>
                              <CustomQuestionRenderer
                                question={{ id: editingQuestion.id, question_text: editingQuestion.question_text, response_type: editingQuestion.response_type, customization: editingCustomization }}
                                onChange={() => { }}
                              />
                            </div>

                            {showEditCustomizer && (
                              <div className="mt-2 pt-4 border-t border-gray-100 animate-slide-down">
                                <CustomizationEditor customization={editingCustomization} onUpdate={setEditingCustomization} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-gray-800">{q.question_text}</div>
                        <div className="text-sm text-gray-600 mt-1">Type: <span className="font-medium">{q.response_type || 'smiley_faces'}</span></div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingId === q.id ? (
                      <>
                        <button onClick={() => handleEditSave(q.id)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold flex items-center gap-1"><FaSave /> Save</button>
                        <button onClick={() => { setEditingId(null); setEditingQuestion(null); }} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold flex items-center gap-1"><FaTimes /> Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(q.id); setEditingQuestion(q); setEditingCustomization(q.customization || null); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">✏️ Edit</button>
                        <button onClick={() => handleDelete(q.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">🗑️ Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && <div className="text-center py-8 text-gray-500">{selectedSite ? 'No questions found for this site.' : 'Select a site to view questions.'}</div>
        )}
      </div>
    </div>
  );
};

export default AdminQuestionManager;
