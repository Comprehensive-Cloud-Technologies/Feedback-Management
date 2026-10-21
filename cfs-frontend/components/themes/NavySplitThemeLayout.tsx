import React from 'react';
import { ThemeLayoutProps } from './types';
import { CustomQuestionRenderer } from '../CustomQuestionRenderer';
import { ThemeLogoBadge } from './ThemeLogoBadge';

export const NavySplitThemeLayout: React.FC<ThemeLayoutProps> = ({
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
    <div className="flex-grow min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative w-full bg-[#F8FAFC] font-sans text-slate-800">
      {/* LEFT COLUMN: Deep Navy Panel */}
      <aside className="w-full md:w-[38%] lg:w-[32%] bg-[#0B1528] text-white p-4 sm:p-6 md:p-8 flex flex-col justify-between flex-shrink-0 shadow-xl z-10 md:overflow-y-auto">
        <div>
          {/* Top Row: Catalyst Logo & Fullscreen */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
            <div className="bg-white rounded-xl px-3 py-1.5 shadow-sm inline-block flex-shrink-0">
              <img
                src={catalystLogo}
                alt="Catalyst"
                className="h-9 sm:h-11 w-auto object-contain flex-shrink-0"
              />
            </div>
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

          {/* Badge & Titles */}
          <div className="space-y-3 mb-4 sm:mb-6">
            <span className="inline-block text-[11px] font-black tracking-widest text-cyan-400 uppercase bg-cyan-950/70 border border-cyan-800/60 px-3 py-1 rounded-full">
              {texts.badge_text || 'CATALYST FEEDBACK'}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight break-words">
              {texts.title || 'Dining Feedback'}
            </h1>
            <p className="text-slate-300 text-sm font-medium leading-relaxed break-words">
              {texts.subtitle || 'Help us maintain quality across all meals.'}
            </p>
          </div>

          <div className="hidden md:block py-4 border-t border-slate-800">
            <p className="text-xs text-slate-400 leading-relaxed">
              Every submission directly impacts menu preparation, dining hygiene, and canteen management.
            </p>
          </div>
        </div>

        {/* Bottom Row in Navy Column: Branch Logo */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <ThemeLogoBadge
            branchLogo={branchLogo}
            fallbackLogo={catalystLogo}
            contrastChip={true}
            className="h-10 sm:h-12 w-auto object-contain max-w-[120px]"
          />
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            Verified Feedback
          </span>
        </div>
      </aside>

      {/* RIGHT COLUMN: Clean Light Area */}
      <section className="flex-grow flex flex-col bg-[#F8FAFC] overflow-visible md:overflow-hidden md:min-h-0">
        {/* Scrollable Questions and User Info */}
        <div className="flex-grow min-h-0 md:overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4">
          {/* Question Rows */}
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
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-3 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Question title */}
                  <div className="flex items-start gap-2.5 flex-grow min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
                      {q.question_text || q.text}
                    </h3>
                  </div>

                  {/* Right: Options (Horizontal Tiles) */}
                  {isSmiley && smileyOptions ? (
                    <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end flex-shrink-0">
                      {smileyOptions.map((opt: any) => {
                        const isSelected = val !== undefined && val !== null && String(val) === String(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => onRatingChange(q.id, opt.value)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-2 ring-emerald-500/20'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="text-base select-none pointer-events-none">{opt.emoji}</span>
                            <span className="pointer-events-none">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="w-full sm:w-auto flex-grow">
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

          {/* User Information Card */}
          {!!formSettings.collect_user_info && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                User Information (Optional)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!!formSettings.field_name && (
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1528]/20 focus:border-[#0B1528] bg-slate-50 placeholder:text-slate-400"
                  />
                )}
                {!!formSettings.field_employee_id && (
                  <input
                    type="text"
                    value={userEmployeeId}
                    onChange={e => setUserEmployeeId(e.target.value)}
                    placeholder="Employee ID"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1528]/20 focus:border-[#0B1528] bg-slate-50 placeholder:text-slate-400"
                  />
                )}
                {!!formSettings.field_department && (
                  <input
                    type="text"
                    value={userDepartment}
                    onChange={e => setUserDepartment(e.target.value)}
                    placeholder="Department"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1528]/20 focus:border-[#0B1528] bg-slate-50 placeholder:text-slate-400"
                  />
                )}
                {!!formSettings.field_meal_slot && mealSlots.length > 0 && (
                  <select
                    value={selectedMealSlot}
                    onChange={e => setSelectedMealSlot(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1528]/20 focus:border-[#0B1528] bg-slate-50 text-slate-700 cursor-pointer"
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
                  placeholder="Suggestions or remarks..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1528]/20 focus:border-[#0B1528] bg-slate-50 placeholder:text-slate-400"
                />
              )}

              {/* Dynamic Custom Fields */}
              {Array.isArray(formSettings.custom_fields) && formSettings.custom_fields.filter(cf => cf.enabled !== false).map(cf => (
                <div key={cf.id} className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {cf.label}{cf.required ? ' *' : ''}
                  </label>
                  {cf.type === 'text' && (
                    <input
                      type="text"
                      value={customFieldValues[cf.id] || ''}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                      placeholder={cf.label}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1528]/20 focus:border-[#0B1528] bg-slate-50"
                    />
                  )}
                  {cf.type === 'dropdown_single' && (
                    <select
                      value={customFieldValues[cf.id] || ''}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B1528]/20 focus:border-[#0B1528] bg-slate-50 cursor-pointer"
                    >
                      <option value="">{`Select ${cf.label}...`}</option>
                      {(cf.options || []).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {cf.type === 'dropdown_multi' && (
                    <div className="p-2 bg-slate-50 border border-slate-300 rounded-lg flex flex-wrap gap-1.5">
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
                            className={`px-2 py-0.5 text-xs rounded-md font-semibold border transition-all ${
                              isSel
                                ? 'bg-[#0B1528] text-white border-[#0B1528]'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
              <span>⚠️</span>
              <span>{validationWarning}</span>
            </div>
          )}
        </div>

        {/* Bottom Submission Bar */}
        <div className="p-3 sm:px-8 sm:py-4 border-t border-slate-200 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !isAllRatingsAnswered}
            className="w-full bg-[#0B1528] hover:bg-[#15233E] disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 min-h-[48px] rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 tracking-wide cursor-pointer"
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
      </section>
    </div>
  );
};

export default NavySplitThemeLayout;
