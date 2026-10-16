import React, { useState, useEffect } from 'react';
import { FormSettings, ThemeId, ThemeCustomTexts } from '../types';
import { THEME_LIST, getThemeDefinition, resolveThemeTexts, getThemeLayout } from './themes/ThemeRegistry';
import { FaDesktop, FaMobileAlt, FaUndo, FaSave, FaCheckCircle, FaPalette } from 'react-icons/fa';
import catalystLogo from '../src/images/clogo.png';
import { getEndpoints } from '../constants';

interface ThemeManagerSectionProps {
  selectedSite: string;
  selectedCanteen: string;
  selectedCanteenId: number;
  formSettings: FormSettings;
  setFormSettings: React.Dispatch<React.SetStateAction<FormSettings>>;
  questions: any[];
  saveFormSettings: (updated: FormSettings) => Promise<void>;
  savingSettings: boolean;
}

export const ThemeManagerSection: React.FC<ThemeManagerSectionProps> = ({
  selectedSite,
  selectedCanteen,
  selectedCanteenId,
  formSettings,
  setFormSettings,
  questions,
  saveFormSettings,
  savingSettings,
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [previewRatings, setPreviewRatings] = useState<Record<number, any>>({});
  const [previewCustomFields, setPreviewCustomFields] = useState<Record<string, any>>({});
  const [showAdvancedTexts, setShowAdvancedTexts] = useState<boolean>(true);
  const endpoints = getEndpoints();

  const currentThemeId: ThemeId = (formSettings.theme_id as ThemeId) || 'default';
  const currentCustomTexts = formSettings.theme_custom_texts || {};
  const currentThemeDef = getThemeDefinition(currentThemeId);
  const resolvedTexts = resolveThemeTexts(currentThemeId, currentCustomTexts);

  // Fetch Site Logo for preview accuracy
  useEffect(() => {
    if (!selectedSite) return;
    fetch(`${endpoints.BRANCH_ADMINS_INFO}?site=${encodeURIComponent(selectedSite)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data[0]?.logo) {
          setSiteLogo(data[0].logo);
        } else if (data?.branch_admins?.[0]?.logo) {
          setSiteLogo(data.branch_admins[0].logo);
        } else if (data?.logo) {
          setSiteLogo(data.logo);
        } else {
          setSiteLogo('');
        }
      })
      .catch(() => setSiteLogo(''));
  }, [selectedSite]);

  // Handle Theme Selection
  const handleSelectTheme = (themeId: ThemeId) => {
    const updated: FormSettings = {
      ...formSettings,
      theme_id: themeId,
    };
    setFormSettings(updated);
  };

  // Handle Custom Text Change
  const handleTextChange = (field: keyof ThemeCustomTexts, val: string) => {
    const updatedTexts: ThemeCustomTexts = {
      ...currentCustomTexts,
      [field]: val,
    };
    const updated: FormSettings = {
      ...formSettings,
      theme_custom_texts: updatedTexts,
    };
    setFormSettings(updated);
  };

  // Reset to theme default texts
  const handleResetTexts = () => {
    const updated: FormSettings = {
      ...formSettings,
      theme_custom_texts: null,
    };
    setFormSettings(updated);
  };

  // Resolve Active Layout Component for Live Preview
  const ActiveLayout = getThemeLayout(currentThemeId);

  // Sample questions fallback if canteen has no questions configured yet
  const displayQuestions = questions && questions.length > 0 ? questions : [
    {
      id: 991,
      question_text: 'How was the food quality today?',
      response_type: 'smiley_faces',
      customization: {
        type: 'smiley_faces',
        options: [
          { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
          { value: 2, label: 'Fair', emoji: '😐', color: '#f97316' },
          { value: 3, label: 'Good', emoji: '🙂', color: '#eab308' },
          { value: 4, label: 'Excellent', emoji: '😀', color: '#22c55e' }
        ]
      }
    },
    {
      id: 992,
      question_text: 'Cleanliness & hygiene of the dining area?',
      response_type: 'smiley_faces',
      customization: {
        type: 'smiley_faces',
        options: [
          { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
          { value: 2, label: 'Fair', emoji: '😐', color: '#f97316' },
          { value: 3, label: 'Good', emoji: '🙂', color: '#eab308' },
          { value: 4, label: 'Excellent', emoji: '😀', color: '#22c55e' }
        ]
      }
    }
  ];

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <FaPalette className="text-indigo-600" />
            Step 4: Choose Form Theme & Appearance
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Pick a branded theme for public feedback forms opened at <strong>{selectedCanteen}</strong> ({selectedSite}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => saveFormSettings(formSettings)}
            disabled={savingSettings}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
          >
            {savingSettings ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave /> Save Theme Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Theme Selection Cards Grid */}
      <div>
        <label className="block text-xs font-black uppercase text-indigo-700 tracking-wider mb-3">
          Select Form Theme
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {THEME_LIST.map((t) => {
            const isSelected = currentThemeId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleSelectTheme(t.id)}
                className={`cursor-pointer rounded-2xl p-4 transition-all relative flex flex-col justify-between border-2 ${
                  isSelected
                    ? 'bg-white border-indigo-600 shadow-lg ring-4 ring-indigo-400/30 scale-[1.02]'
                    : 'bg-white/80 hover:bg-white border-gray-200 hover:border-indigo-300 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Active Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 text-indigo-600 bg-indigo-50 rounded-full p-1 shadow-xs">
                    <FaCheckCircle size={16} />
                  </div>
                )}

                <div>
                  {/* Color / Style Swatch */}
                  <div className="h-10 w-full rounded-xl mb-3 flex items-center justify-center shadow-inner overflow-hidden border border-black/10"
                       style={{ background: t.accentColor }}>
                    <span className="text-white text-xs font-black drop-shadow-sm uppercase tracking-wider">
                      {t.badge}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h4 className="text-sm font-extrabold text-gray-900 leading-snug">
                    {t.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">
                    {t.tagline}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                {/* Bottom Radio indicator */}
                <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center gap-2">
                  <input
                    type="radio"
                    name="theme_selection"
                    checked={isSelected}
                    onChange={() => handleSelectTheme(t.id)}
                    className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-500'}`}>
                    {isSelected ? 'Active Theme' : 'Select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Customizable Theme Texts */}
      <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-gray-900">
              Customize Form Texts for "{currentThemeDef.name}"
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Override default titles, captions, or submit button labels for this canteen.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetTexts}
            className="text-xs font-bold text-gray-600 hover:text-indigo-600 flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Reset texts back to theme defaults"
          >
            <FaUndo size={11} /> Reset to Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Header Title
            </label>
            <input
              type="text"
              value={currentCustomTexts.title || ''}
              onChange={e => handleTextChange('title', e.target.value)}
              placeholder={currentThemeDef.defaultTexts.title}
              className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder:text-gray-400 font-medium"
            />
            <p className="text-[10px] text-gray-400 mt-1">Default: "{currentThemeDef.defaultTexts.title}"</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Header Subtitle
            </label>
            <input
              type="text"
              value={currentCustomTexts.subtitle || ''}
              onChange={e => handleTextChange('subtitle', e.target.value)}
              placeholder={currentThemeDef.defaultTexts.subtitle}
              className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder:text-gray-400 font-medium"
            />
            <p className="text-[10px] text-gray-400 mt-1">Default: "{currentThemeDef.defaultTexts.subtitle}"</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Badge / Section Tag Text
            </label>
            <input
              type="text"
              value={currentCustomTexts.badge_text || ''}
              onChange={e => handleTextChange('badge_text', e.target.value)}
              placeholder={currentThemeDef.defaultTexts.badge_text || 'None'}
              className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder:text-gray-400 font-medium"
            />
            <p className="text-[10px] text-gray-400 mt-1">Default: "{currentThemeDef.defaultTexts.badge_text || 'None'}"</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Submit Button Text
            </label>
            <input
              type="text"
              value={currentCustomTexts.submit_text || ''}
              onChange={e => handleTextChange('submit_text', e.target.value)}
              placeholder={currentThemeDef.defaultTexts.submit_text}
              className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none placeholder:text-gray-400 font-medium"
            />
            <p className="text-[10px] text-gray-400 mt-1">Default: "{currentThemeDef.defaultTexts.submit_text}"</p>
          </div>
        </div>
      </div>

      {/* 3. Interactive Sandboxed Live Preview */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800 space-y-4">
        {/* Preview Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Sandboxed Preview — {currentThemeDef.name}
            </span>
          </div>

          {/* Viewport Toggles (Desktop vs Mobile) */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewport === 'desktop'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FaDesktop size={12} /> Desktop View
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewport === 'mobile'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FaMobileAlt size={12} /> Mobile View (390px)
            </button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="flex justify-center items-center py-2 min-h-[500px] overflow-hidden">
          <div
            className={`transition-all duration-300 overflow-hidden bg-white ${
              viewport === 'mobile'
                ? 'w-[390px] h-[680px] rounded-[2.5rem] border-[10px] border-slate-700 shadow-2xl flex flex-col relative'
                : 'w-full h-[620px] rounded-xl border border-slate-700 shadow-2xl flex flex-col'
            }`}
          >
            {/* Mobile Notch Bar if in Mobile View */}
            {viewport === 'mobile' && (
              <div className="h-5 bg-slate-800 w-full flex-shrink-0 flex items-center justify-center">
                <div className="w-24 h-3 bg-slate-900 rounded-b-xl"></div>
              </div>
            )}

            {/* Sandboxed Theme Layout */}
            <div className="flex-grow min-h-0 flex flex-col overflow-hidden relative">
              <ActiveLayout
                catalystLogo={catalystLogo}
                branchLogo={siteLogo}
                site={selectedSite}
                canteen={selectedCanteen}
                texts={resolvedTexts}
                questions={displayQuestions}
                ratings={previewRatings}
                onRatingChange={(qid, val) => setPreviewRatings(prev => ({ ...prev, [qid]: val }))}
                isRatingType={(t) => !t || t === 'smiley_faces' || t === 'star_rating' || t === 'scale' || t === 'yes_no'}
                enableFullscreen={!!formSettings.enable_fullscreen}
                isFullscreen={false}
                toggleFullscreen={() => {}}
                formSettings={formSettings}
                userName=""
                setUserName={() => {}}
                userEmployeeId=""
                setUserEmployeeId={() => {}}
                userDepartment=""
                setUserDepartment={() => {}}
                userSuggestion=""
                setUserSuggestion={() => {}}
                selectedMealSlot=""
                setSelectedMealSlot={() => {}}
                mealSlots={[]}
                customFieldValues={previewCustomFields}
                setCustomFieldValues={setPreviewCustomFields}
                validationWarning=""
                isSubmitting={false}
                isAllRatingsAnswered={true}
                onSubmit={(e) => { e.preventDefault(); }}
                isPreview={true}
              />
            </div>
          </div>
        </div>

        {/* Footer info under preview */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>QR code link for this canteen will immediately display this theme once saved.</span>
          <button
            type="button"
            onClick={() => saveFormSettings(formSettings)}
            disabled={savingSettings}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
          >
            Save Changes Now →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeManagerSection;
