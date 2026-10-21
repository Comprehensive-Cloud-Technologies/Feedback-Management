import React from 'react';
import { ThemeLayoutProps } from './types';
import { CustomQuestionRenderer } from '../CustomQuestionRenderer';
import { ThemeLogoBadge } from './ThemeLogoBadge';

export const MidnightDarkThemeLayout: React.FC<ThemeLayoutProps> = ({
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
  return (
    <div className="flex-grow min-h-0 flex flex-col overflow-hidden relative w-full bg-[#0A0F1D] text-slate-100 font-sans">
      {/* Top Header Bar */}
      <header className="bg-[#0E1629] border-b border-slate-800/80 px-4 sm:px-8 py-2.5 flex-shrink-0 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Catalyst Logo in chip */}
          <div className="bg-white/95 rounded-xl px-2.5 py-1 shadow-sm">
            <img
              src={catalystLogo}
              alt="Catalyst"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </div>

          {/* Center Titles */}
          <div className="text-center min-w-0 flex-grow px-2">
            <h1 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight break-words">
              {texts.title || 'Dining Experience'}
            </h1>
            <p className="text-slate-400 text-[10px] sm:text-xs font-medium break-words mt-0.5">
              {texts.subtitle || 'Rate each service'}
            </p>
          </div>

          {/* Right: Site Logo & Fullscreen */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeLogoBadge
              branchLogo={branchLogo}
              fallbackLogo={catalystLogo}
              contrastChip={true}
              className="h-8 sm:h-10 w-auto object-contain max-w-[90px] sm:max-w-[120px]"
            />
            {enableFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl transition-all cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Main Scrollable Questions Area */}
      <div className="flex-grow min-h-0 overflow-y-auto px-3 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-3 pb-6">
          {questions.map((q, idx) => {
            const val = ratings[q.id];
            const qType = q.response_type || 'smiley_faces';
            const isSmiley = qType === 'smiley_faces';
            const smileyOptions = isSmiley
              ? (q.customization?.options || [
                  { value: 1, label: 'Poor', emoji: '😞' },
                  { value: 2, label: 'Needs Improvement', emoji: '😐' },
                  { value: 3, label: 'Average', emoji: '🙂' },
                  { value: 4, label: 'Good', emoji: '😀' }
                ])
              : null;

            return (
              <div
                key={q.id}
                className="bg-[#131B2E] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2.5 flex-grow min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug break-words">
                      {q.question_text || q.text}
                    </h3>
                  </div>

                  {/* Horizontal Tiles with Neon Green Glow on Select */}
                  {isSmiley && smileyOptions ? (
                    <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end flex-shrink-0">
                      {smileyOptions.map((opt: any) => {
                        const isSelected = val !== undefined && val !== null && String(val) === String(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => onRatingChange(q.id, opt.value)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                : 'bg-[#1B253D] hover:bg-[#223050] border-slate-700/80 text-slate-300'
                            }`}
                          >
                            <span className="text-base select-none pointer-events-none">{opt.emoji}</span>
                            <span className="pointer-events-none">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="w-full sm:w-auto flex-grow dark-scheme-custom">
                      <CustomQuestionRenderer
                        question={{
                          ...q,
                          question_text: q.question_text || q.text || '',
                          response_type: q.response_type || 'smiley_faces',
                          customization: q.customization
                        } as any}
                        value={val}
                        onChange={(v) => onRatingChange(q.id, v)}
                        questionCount={questions.length}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* User Information in Dark Container */}
          {!!formSettings.collect_user_info && (
            <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                User Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {!!formSettings.field_name && (
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 text-sm bg-[#0E1629] border border-slate-700 focus:border-cyan-400 rounded-xl text-white placeholder:text-slate-500 outline-none"
                  />
                )}
                {!!formSettings.field_employee_id && (
                  <input
                    type="text"
                    value={userEmployeeId}
                    onChange={e => setUserEmployeeId(e.target.value)}
                    placeholder="Employee ID"
                    className="w-full px-3 py-2 text-sm bg-[#0E1629] border border-slate-700 focus:border-cyan-400 rounded-xl text-white placeholder:text-slate-500 outline-none"
                  />
                )}
                {!!formSettings.field_department && (
                  <input
                    type="text"
                    value={userDepartment}
                    onChange={e => setUserDepartment(e.target.value)}
                    placeholder="Department"
                    className="w-full px-3 py-2 text-sm bg-[#0E1629] border border-slate-700 focus:border-cyan-400 rounded-xl text-white placeholder:text-slate-500 outline-none"
                  />
                )}
                {!!formSettings.field_meal_slot && mealSlots.length > 0 && (
                  <select
                    value={selectedMealSlot}
                    onChange={e => setSelectedMealSlot(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#0E1629] border border-slate-700 focus:border-cyan-400 rounded-xl text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">Select Meal Slot...</option>
                    {mealSlots.map((slot, idx) => (
                      <option key={idx} value={slot.category}>{slot.category}{slot.startTime && slot.endTime ? ` (${slot.startTime} - ${slot.endTime})` : ''}</option>
                    ))}
                  </select>
                )}
              </div>

              {!!formSettings.field_suggestion && (
                <input
                  type="text"
                  value={userSuggestion}
                  onChange={e => setUserSuggestion(e.target.value)}
                  placeholder="Suggestions or comments..."
                  className="w-full px-3 py-2 text-sm bg-[#0E1629] border border-slate-700 focus:border-cyan-400 rounded-xl text-white placeholder:text-slate-500 outline-none"
                />
              )}

              {/* Dynamic Custom Fields */}
              {Array.isArray(formSettings.custom_fields) && formSettings.custom_fields.filter(cf => cf.enabled !== false).map(cf => (
                <div key={cf.id} className="pt-1">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {cf.label}{cf.required ? ' *' : ''}
                  </label>
                  {cf.type === 'text' && (
                    <input
                      type="text"
                      value={customFieldValues[cf.id] || ''}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                      placeholder={cf.label}
                      className="w-full px-3 py-2 text-sm bg-[#0E1629] border border-slate-700 focus:border-cyan-400 rounded-xl text-white placeholder:text-slate-500 outline-none"
                    />
                  )}
                  {cf.type === 'dropdown_single' && (
                    <select
                      value={customFieldValues[cf.id] || ''}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-[#0E1629] border border-slate-700 focus:border-cyan-400 rounded-xl text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="">{`Select ${cf.label}...`}</option>
                      {(cf.options || []).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {cf.type === 'dropdown_multi' && (
                    <div className="p-2.5 bg-[#0E1629] border border-slate-700 rounded-xl flex flex-wrap gap-1.5">
                      {(cf.options || []).map((opt, optIdx) => {
                        const currentSelected: string[] = customFieldValues[cf.id] || [];
                        const isSel = currentSelected.includes(opt);
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => {
                              const updated = isSel
                                ? currentSelected.filter(item => item !== opt)
                                : [...currentSelected, opt];
                              setCustomFieldValues(prev => ({ ...prev, [cf.id]: updated }));
                            }}
                            className={`px-2 py-0.5 text-xs rounded-md font-bold border transition-all ${
                              isSel
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                                : 'bg-[#1B253D] text-slate-300 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {isSel ? '✓ ' : '+ '}{opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Validation Notice */}
          {validationWarning && (
            <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
              <span>⚠️</span>
              <span>{validationWarning}</span>
            </div>
          )}

          {/* Cyan Submit Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !isAllRatingsAnswered}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-black text-sm sm:text-base py-3.5 sm:py-4 min-h-[48px] rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-5 w-5 border-3 border-slate-950/30 border-t-slate-950 rounded-full"></div>
                Submitting...
              </>
            ) : (
              <>{texts.submit_text || 'Submit Feedback'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MidnightDarkThemeLayout;
