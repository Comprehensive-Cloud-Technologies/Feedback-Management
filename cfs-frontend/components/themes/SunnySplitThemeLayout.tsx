import React from 'react';
import { ThemeLayoutProps } from './types';
import { CustomQuestionRenderer } from '../CustomQuestionRenderer';
import { ThemeLogoBadge } from './ThemeLogoBadge';

export const SunnySplitThemeLayout: React.FC<ThemeLayoutProps> = ({
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
    <div className="flex-grow min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative w-full bg-[#FFFBEB] font-sans text-slate-900">
      {/* LEFT COLUMN: Solid Amber Panel */}
      <aside className="w-full md:w-[38%] lg:w-[34%] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-4 sm:p-6 md:p-8 flex flex-col justify-between flex-shrink-0 shadow-lg md:shadow-2xl z-10 md:overflow-y-auto">
        <div>
          {/* Top Branding Row (Stacked & Balanced for Mobile, Preserved on Desktop) */}
          <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
            <div className="bg-white/95 rounded-xl px-2.5 py-1.5 shadow-sm flex items-center justify-center max-w-[130px] max-h-[48px] flex-shrink-0">
              <img
                src={catalystLogo}
                alt="Catalyst"
                className="max-h-[34px] sm:max-h-[44px] max-w-[110px] w-auto h-auto object-contain flex-shrink-0"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {branchLogo ? (
                <div className="bg-white/95 rounded-xl px-2.5 py-1.5 shadow-sm flex items-center justify-center max-w-[130px] max-h-[48px] flex-shrink-0">
                  <img
                    src={branchLogo}
                    alt="Site Logo"
                    className="max-h-[34px] sm:max-h-[44px] max-w-[110px] w-auto h-auto object-contain flex-shrink-0"
                  />
                </div>
              ) : null}
              {enableFullscreen && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-amber-600/60 hover:bg-amber-700 text-white rounded-xl shadow-sm transition-all cursor-pointer flex-shrink-0"
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

          {/* Heading & Subheading (Customizable, Centered on Mobile) */}
          <div className="mb-5 sm:mb-6 text-center md:text-left flex flex-col items-center md:items-start">
            <span className="inline-block text-[11px] font-black tracking-widest text-amber-950 uppercase bg-amber-300/80 px-2.5 py-1 rounded-full mb-2">
              {texts.badge_text || 'Information:'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-amber-950 leading-tight break-words text-center md:text-left w-full">
              {texts.heading || 'Tell us about you'}
            </h2>
            <p className="text-amber-950/80 text-xs sm:text-sm font-medium mt-1 break-words text-center md:text-left w-full">
              {texts.subheading || 'Your identity helps us resolve dining feedback quickly.'}
            </p>
          </div>

          {/* User Info Fields - Stacked Cream Inputs with thick borders */}
          {!!formSettings.collect_user_info ? (
            <div className="space-y-3">
              {!!formSettings.field_name && (
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-[#FFFDF7] border-2 border-amber-900/30 focus:border-amber-950 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-amber-950 placeholder:text-amber-900/40 font-medium transition-all shadow-inner outline-none"
                  />
                </div>
              )}

              {!!formSettings.field_employee_id && (
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={userEmployeeId}
                    onChange={e => setUserEmployeeId(e.target.value)}
                    placeholder="e.g. EMP1024"
                    className="w-full bg-[#FFFDF7] border-2 border-amber-900/30 focus:border-amber-950 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-amber-950 placeholder:text-amber-900/40 font-medium transition-all shadow-inner outline-none"
                  />
                </div>
              )}

              {!!formSettings.field_department && (
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Department</label>
                  <input
                    type="text"
                    value={userDepartment}
                    onChange={e => setUserDepartment(e.target.value)}
                    placeholder="e.g. Operations / Engineering"
                    className="w-full bg-[#FFFDF7] border-2 border-amber-900/30 focus:border-amber-950 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-amber-950 placeholder:text-amber-900/40 font-medium transition-all shadow-inner outline-none"
                  />
                </div>
              )}

              {!!formSettings.field_suggestion && (
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Suggestions / Comments</label>
                  <textarea
                    rows={2}
                    value={userSuggestion}
                    onChange={e => setUserSuggestion(e.target.value)}
                    placeholder="Share any special thoughts or suggestions..."
                    className="w-full bg-[#FFFDF7] border-2 border-amber-900/30 focus:border-amber-950 focus:bg-white rounded-xl px-3.5 py-2 text-sm text-amber-950 placeholder:text-amber-900/40 font-medium transition-all shadow-inner outline-none resize-none"
                  />
                </div>
              )}

              {!!formSettings.field_meal_slot && mealSlots.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">Meal Slot</label>
                  <select
                    value={selectedMealSlot}
                    onChange={e => setSelectedMealSlot(e.target.value)}
                    className="w-full bg-[#FFFDF7] border-2 border-amber-900/30 focus:border-amber-950 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-amber-950 font-medium transition-all shadow-inner outline-none cursor-pointer"
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

              {/* Dynamic Custom Fields */}
              {Array.isArray(formSettings.custom_fields) && formSettings.custom_fields.filter(cf => cf.enabled !== false).map(cf => (
                <div key={cf.id}>
                  <label className="block text-xs font-bold text-amber-950 mb-1">
                    {cf.label}{cf.required ? ' *' : ''}
                  </label>
                  {cf.type === 'text' && (
                    <input
                      type="text"
                      value={customFieldValues[cf.id] || ''}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                      placeholder={cf.label}
                      className="w-full bg-[#FFFDF7] border-2 border-amber-900/30 focus:border-amber-950 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-amber-950 placeholder:text-amber-900/40 font-medium transition-all shadow-inner outline-none"
                    />
                  )}
                  {cf.type === 'dropdown_single' && (
                    <select
                      value={customFieldValues[cf.id] || ''}
                      onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                      className="w-full bg-[#FFFDF7] border-2 border-amber-900/30 focus:border-amber-950 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-amber-950 font-medium transition-all shadow-inner outline-none cursor-pointer"
                    >
                      <option value="">{`Select ${cf.label}...`}</option>
                      {(cf.options || []).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {cf.type === 'dropdown_multi' && (
                    <div className="p-2.5 bg-[#FFFDF7] border-2 border-amber-900/30 rounded-xl">
                      <div className="flex flex-wrap gap-1.5">
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
                              className={`px-2.5 py-1 text-xs rounded-lg font-bold border-2 transition-all ${
                                isSel
                                  ? 'bg-amber-900 text-amber-100 border-amber-900 shadow-sm'
                                  : 'bg-white text-amber-950 border-amber-900/20 hover:border-amber-900/50'
                              }`}
                            >
                              {isSel ? '✓ ' : '+ '}{opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-amber-400/50 rounded-2xl border-2 border-dashed border-amber-950/20 text-center">
              <p className="text-xs font-bold text-amber-950/80">Anonymous Feedback Enabled</p>
              <p className="text-[11px] text-amber-950/60 mt-0.5">No personal details required to submit.</p>
            </div>
          )}
        </div>

        {/* Footer note in left column */}
        <div className="mt-6 pt-4 border-t border-amber-950/15 hidden md:block">
          <p className="text-[11px] font-semibold text-amber-950/70">
            Powered by Catalyst service solutions
          </p>
        </div>
      </aside>

      {/* RIGHT COLUMN: White Feedback Area */}
      <section className="flex-grow flex flex-col bg-white overflow-visible md:overflow-hidden md:min-h-0">
        {/* Top Header of Right Column (Centered on Mobile, Left-aligned on Desktop) */}
        <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-3 border-b border-amber-100 flex-shrink-0 bg-white text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight break-words">
            {texts.title || 'How did we do?'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 break-words">
            {texts.subtitle || 'Tap a face to rate your dining experience today'}
          </p>
        </div>

        {/* Questions Scrollable Body */}
        <div className="flex-grow min-h-0 md:overflow-y-auto px-3 sm:px-8 py-4 space-y-4">
          {questions.map((q, idx) => {
            const val = ratings[q.id];
            const qType = q.response_type || 'smiley_faces';

            // Check if smiley_faces or default 4-level
            const isSmiley = qType === 'smiley_faces';
            const smileyOptions = isSmiley
              ? (q.customization?.options || [
                  { value: 1, label: 'Poor', emoji: '😞' },
                  { value: 2, label: 'Fair', emoji: '😐' },
                  { value: 3, label: 'Good', emoji: '🙂' },
                  { value: 4, label: 'Great', emoji: '😀' }
                ])
              : null;

            return (
              <div
                key={q.id}
                className="bg-amber-50/40 hover:bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 sm:p-5 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug break-words">
                      {q.question_text || q.text}
                    </h3>
                  </div>
                </div>

                {/* Question Options: Strictly 1 line on mobile with equal-width columns, scaled emojis & wrapping labels */}
                {isSmiley && smileyOptions ? (
                  <div className="flex flex-nowrap w-full items-start justify-between gap-1 sm:gap-2 md:w-auto md:justify-start md:gap-6 py-2 overflow-x-hidden">
                    {smileyOptions.map((opt: any) => {
                      const isSelected = val !== undefined && val !== null && String(val) === String(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => onRatingChange(q.id, opt.value)}
                          className="flex-1 min-w-0 md:flex-initial flex flex-col items-center justify-start group outline-none cursor-pointer min-h-[44px] py-1 px-0.5"
                          title={`${opt.label}`}
                          aria-label={`${opt.label}`}
                        >
                          <div
                            className={`rounded-full flex items-center justify-center transition-all pointer-events-none w-[clamp(2.1rem,8.5vw,3.5rem)] h-[clamp(2.1rem,8.5vw,3.5rem)] md:w-16 md:h-16 ${
                              isSelected
                                ? 'bg-amber-400 ring-3 sm:ring-4 ring-amber-300 ring-offset-1 sm:ring-offset-2 scale-105 sm:scale-110 shadow-md text-slate-950'
                                : 'bg-white hover:bg-amber-100/80 border-2 border-amber-200/80 shadow-xs hover:scale-105'
                            }`}
                          >
                            <span className="select-none filter drop-shadow-xs text-[clamp(1.2rem,5vw,2.2rem)] md:text-4xl leading-none">
                              {opt.emoji}
                            </span>
                          </div>
                          <span
                            className={`w-full text-center text-[10px] sm:text-xs leading-tight transition-colors pointer-events-none mt-1.5 break-words [overflow-wrap:anywhere] ${
                              isSelected ? 'text-amber-950 font-black' : 'text-slate-600 group-hover:text-slate-900 font-medium'
                            }`}
                            style={{ wordBreak: 'break-word' }}
                          >
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full">
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
            );
          })}

          {/* Validation Notice */}
          {validationWarning && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
              <span>⚠️</span>
              <span>{validationWarning}</span>
            </div>
          )}
        </div>

        {/* Bottom Submission Bar */}
        <div className="p-4 sm:px-8 sm:py-5 border-t border-amber-100 bg-[#FFFDF7] flex-shrink-0">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !isAllRatingsAnswered}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-slate-950 font-black text-base sm:text-lg py-3.5 sm:py-4 min-h-[48px] rounded-2xl shadow-xl shadow-amber-300/60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-5 w-5 border-3 border-amber-950/30 border-t-amber-950 rounded-full"></div>
                Submitting...
              </>
            ) : (
              <>{texts.submit_text || 'Submit Feedback'}</>
            )}
          </button>
          <div className="text-center pt-3 md:hidden">
            <p className="text-[11px] font-semibold text-slate-400">
              Powered by Catalyst service solutions
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SunnySplitThemeLayout;
