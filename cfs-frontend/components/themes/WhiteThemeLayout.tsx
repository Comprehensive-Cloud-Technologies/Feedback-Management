import React, { useMemo } from 'react';
import { ThemeLayoutProps } from './types';
import { CustomQuestionRenderer } from '../CustomQuestionRenderer';

interface RatingOption {
  value: any;
  label: string;
  emoji?: string;
  color?: string;
}

interface QuestionGroup {
  type: 'rating_table' | 'standalone';
  options?: RatingOption[];
  questions: any[];
}

export const WhiteThemeLayout: React.FC<ThemeLayoutProps> = ({
  catalystLogo,
  branchLogo,
  texts,
  questions,
  ratings,
  onRatingChange,
  enableFullscreen,
  isFullscreen,
  toggleFullscreen,
  formSettings,
  userName,
  setUserName,
  userEmployeeId,
  setUserEmployeeId,
  userDepartment,
  setUserDepartment,
  userSuggestion,
  setUserSuggestion,
  selectedMealSlot,
  setSelectedMealSlot,
  mealSlots,
  customFieldValues,
  setCustomFieldValues,
  validationWarning,
  isSubmitting,
  isAllRatingsAnswered,
  onSubmit,
}) => {
  const isBgEnabled = !!formSettings?.bg_image_enabled && !!formSettings?.bg_image_data;

  // Group consecutive rating questions sharing identical options for column-header alignment
  const groupedQuestions = useMemo(() => {
    const groups: QuestionGroup[] = [];
    let currentGroup: QuestionGroup | null = null;

    const defaultRatingOptions: RatingOption[] = [
      { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
      { value: 2, label: 'Needs Improvement', emoji: '😐', color: '#f97316' },
      { value: 3, label: 'Average', emoji: '🙂', color: '#eab308' },
      { value: 4, label: 'Good', emoji: '😀', color: '#22c55e' }
    ];

    questions.forEach((q) => {
      const qType = q.response_type || 'smiley_faces';
      const isRating = qType === 'smiley_faces';

      if (isRating) {
        const rawOpts: any[] = q.customization?.options || defaultRatingOptions;
        const opts: RatingOption[] = rawOpts.map((o: any) => ({
          value: o.value,
          label: o.label || '',
          emoji: o.emoji || '🙂',
          color: o.color || '#4f46e5'
        }));

        const signature = opts.map(o => `${o.value}:${o.label}`).join('|');

        if (currentGroup && currentGroup.type === 'rating_table') {
          const currentSignature = (currentGroup.options || []).map(o => `${o.value}:${o.label}`).join('|');
          if (signature === currentSignature) {
            currentGroup.questions.push(q);
            return;
          }
        }

        // Start new rating table group
        currentGroup = {
          type: 'rating_table',
          options: opts,
          questions: [q]
        };
        groups.push(currentGroup);
      } else {
        // Standalone question (star, scale, text, dropdown, choice)
        currentGroup = {
          type: 'standalone',
          questions: [q]
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  }, [questions]);

  return (
    <div className="flex-grow min-h-0 flex flex-col overflow-hidden relative w-full pt-1 font-sans">
      {/* Background Image Layer (Glassmorphism support identical to Default Theme) */}
      {isBgEnabled && (
        <div
          className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${formSettings.bg_image_data})` }}
        >
          <div className="absolute inset-0 bg-slate-900/30 backdrop-brightness-95 pointer-events-none" />
        </div>
      )}

      {/* Header / Logo Area */}
      <header
        className={`text-center w-full max-w-full py-0.5 flex-shrink-0 z-10 transition-all ${
          isBgEnabled
            ? 'bg-white/40 backdrop-blur-md border-b border-white/30 shadow-sm'
            : 'bg-white shadow-sm border-b border-gray-100'
        } mb-0.5`}
      >
        <div className="flex items-center justify-between px-3 sm:px-6 max-w-7xl mx-auto h-14 sm:h-16 md:h-20 gap-2">
          {/* Left Column - Catalyst Logo */}
          <div className="flex-shrink-0 w-20 sm:w-28 md:w-40 flex justify-start">
            <img
              src={catalystLogo}
              alt="Catalyst Logo"
              className="h-10 sm:h-14 md:h-16 w-auto object-contain max-h-[48px] sm:max-h-[64px]"
            />
          </div>

          {/* Center Column - Text Content */}
          <div className="flex-grow flex flex-col items-center justify-center min-w-0">
            {texts.badge_text && (
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-indigo-600 mb-0.5">
                {texts.badge_text}
              </span>
            )}
            <h1 className={`text-sm sm:text-xl md:text-2xl font-black leading-tight tracking-tight break-words text-center w-full ${isBgEnabled ? 'text-gray-900 drop-shadow-xs' : 'text-gray-900'}`}>
              {texts.title || "We value your feedback!"}
            </h1>
            <p className={`text-[8px] sm:text-xs md:text-sm font-semibold italic mt-0.5 break-words text-center w-full ${isBgEnabled ? 'text-gray-800 drop-shadow-xs opacity-90' : 'text-gray-500 opacity-80'}`}>
              {texts.subtitle || "Help us improve your dining experience."}
            </p>
          </div>

          {/* Right Column - Branch Logo + Fullscreen */}
          <div className="flex-shrink-0 flex items-center justify-end gap-1 sm:gap-2">
            <img
              src={branchLogo || catalystLogo}
              alt="Branch Logo"
              className="h-11 sm:h-14 md:h-16 w-auto object-contain max-w-[80px] sm:max-w-[110px] md:max-w-[140px] flex-shrink-0 max-h-[48px] sm:max-h-[64px]"
            />
            {enableFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center p-2 bg-white/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-white text-primary-600 transition-all cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {isFullscreen ? (
                    <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" />
                  ) : (
                    <path d="M3 8V3h5M16 3h5v5M3 16v5h5M16 21h5v-5" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <div className="flex-grow min-h-0 w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 flex flex-col overflow-hidden z-10">
        <div className="flex-grow min-h-0 overflow-y-auto overflow-x-hidden px-1 sm:px-2 scrollbar-hide space-y-3 pb-6">
          {/* Render Groups */}
          {groupedQuestions.map((group, groupIdx) => {
            if (group.type === 'rating_table' && group.options) {
              const options = group.options;
              return (
                <div
                  key={`group-${groupIdx}`}
                  className={`rounded-2xl border overflow-hidden transition-all shadow-xs ${
                    isBgEnabled
                      ? 'bg-white/50 backdrop-blur-md border-white/50 shadow-md'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Table Column Header Row */}
                  <div className="flex items-center border-b border-gray-200/80 bg-gray-50/80 px-2 sm:px-4 py-2.5">
                    {/* Left Question Label Heading */}
                    <div className="w-[38%] sm:w-[32%] md:w-[28%] flex-shrink-0 pr-2">
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-500">
                        Questions
                      </span>
                    </div>

                    {/* Right Columns: Single row of column headers */}
                    <div className="flex-1 grid grid-flow-col auto-cols-fr gap-1 sm:gap-2">
                      {options.map((opt) => (
                        <div key={opt.value} className="text-center px-0.5">
                          <span
                            className="text-[9px] sm:text-[11px] md:text-xs font-black uppercase tracking-tight block text-center leading-tight break-words"
                            style={{
                              color: opt.color || '#4b5563',
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word'
                            }}
                          >
                            {opt.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Rows */}
                  <div className="divide-y divide-gray-100">
                    {group.questions.map((q) => {
                      const val = ratings[q.id];
                      return (
                        <div
                          key={q.id}
                          className="flex items-center px-2 sm:px-4 py-2.5 sm:py-3 hover:bg-indigo-50/20 transition-colors"
                        >
                          {/* Question on the LEFT: text wraps cleanly */}
                          <div className="w-[38%] sm:w-[32%] md:w-[28%] flex-shrink-0 pr-2">
                            <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 leading-snug break-words">
                              {q.question_text || q.text}
                            </h3>
                          </div>

                          {/* Response Emojis in FRONT of it on the SAME line */}
                          <div className="flex-1 grid grid-flow-col auto-cols-fr gap-1 sm:gap-2 items-center justify-items-center">
                            {options.map((opt) => {
                              const isSelected = val !== undefined && val !== null && String(val) === String(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => onRatingChange(q.id, opt.value)}
                                  className={`w-full max-w-[56px] min-h-[44px] sm:min-h-[48px] p-1 flex items-center justify-center rounded-xl transition-all cursor-pointer outline-none ${
                                    isSelected
                                      ? 'bg-amber-100/90 sm:bg-amber-200/70 scale-105 sm:scale-110 shadow-sm ring-2 sm:ring-4 ring-amber-400/50'
                                      : 'hover:bg-gray-100/80 hover:scale-105'
                                  }`}
                                  title={`${q.question_text || q.text}: ${opt.label}`}
                                  aria-label={`${opt.label} for ${q.question_text || q.text}`}
                                >
                                  <span
                                    className="select-none filter drop-shadow-xs transition-transform"
                                    style={{ fontSize: 'clamp(1.4rem, 4.5vw, 2.3rem)' }}
                                  >
                                    {opt.emoji}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Standalone Question Layout (Star, Scale, Yes/No, Short Answer, Long Answer, Dropdown, Choice)
            const q = group.questions[0];
            const val = ratings[q.id];
            const qType = q.response_type || 'short_answer';

            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-3.5 sm:p-5 transition-all shadow-xs mb-3 ${
                  isBgEnabled
                    ? 'bg-white/50 backdrop-blur-md border-white/50 shadow-md'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="sm:max-w-[40%]">
                    <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 leading-snug break-words">
                      {q.question_text || q.text}
                    </h3>
                  </div>

                  <div className="w-full sm:flex-1">
                    <CustomQuestionRenderer
                      question={{
                        ...q,
                        question_text: q.question_text || q.text || '',
                        response_type: qType,
                        customization: q.customization
                      } as any}
                      value={val}
                      onChange={(v) => onRatingChange(q.id, v)}
                      questionCount={questions.length}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* User Info & Suggestions Area */}
          {!!formSettings?.collect_user_info && (
            <div
              className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-all ${
                isBgEnabled
                  ? 'bg-white/50 backdrop-blur-md border-white/50 shadow-md'
                  : 'bg-white border-gray-200 shadow-xs'
              }`}
            >
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                User Details (Optional)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!!formSettings.field_name && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none transition"
                    />
                  </div>
                )}
                {!!formSettings.field_employee_id && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Employee ID</label>
                    <input
                      type="text"
                      value={userEmployeeId}
                      onChange={e => setUserEmployeeId(e.target.value)}
                      placeholder="e.g. EMP1024"
                      className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none transition"
                    />
                  </div>
                )}
                {!!formSettings.field_department && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={userDepartment}
                      onChange={e => setUserDepartment(e.target.value)}
                      placeholder="e.g. Operations / Logistics"
                      className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none transition"
                    />
                  </div>
                )}
                {!!formSettings.field_meal_slot && mealSlots.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Meal Slot</label>
                    <select
                      value={selectedMealSlot}
                      onChange={e => setSelectedMealSlot(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none transition cursor-pointer"
                    >
                      <option value="">Select Meal Slot...</option>
                      {mealSlots.map((slot, idx) => (
                        <option key={idx} value={slot.category}>
                          {slot.category}{slot.startTime && slot.endTime ? ` (${slot.startTime} - ${slot.endTime})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {!!formSettings.field_suggestion && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Suggestions / Comments</label>
                  <textarea
                    rows={2}
                    value={userSuggestion}
                    onChange={e => setUserSuggestion(e.target.value)}
                    placeholder="Share any special thoughts or suggestions..."
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none transition resize-none"
                  />
                </div>
              )}

              {/* Dynamic Custom Fields */}
              {Array.isArray(formSettings.custom_fields) && formSettings.custom_fields.filter(cf => cf.enabled !== false).map(cf => (
                <div key={cf.id}>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {cf.label}{cf.required ? ' *' : ''}
                  </label>
                  {cf.type === 'text' && (
                    <input
                      type="text"
                      value={customFieldValues[cf.id] || ''}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                      placeholder={cf.label}
                      className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none transition"
                    />
                  )}
                  {cf.type === 'dropdown_single' && (
                    <select
                      value={customFieldValues[cf.id] || ''}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none transition cursor-pointer"
                    >
                      <option value="">{`Select ${cf.label}...`}</option>
                      {(cf.options || []).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Validation Notice */}
          {validationWarning && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
              <span>⚠️</span>
              <span>{validationWarning}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || !isAllRatingsAnswered}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base py-3.5 min-h-[48px] rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-3 border-white/30 border-t-white rounded-full"></div>
                  Submitting...
                </>
              ) : (
                <>{texts.submit_text || 'Submit Feedback'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteThemeLayout;
