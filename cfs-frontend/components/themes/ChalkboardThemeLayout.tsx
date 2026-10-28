import React from 'react';
import { ThemeLayoutProps } from './types';
import { CustomQuestionRenderer } from '../CustomQuestionRenderer';
import { ThemeLogoBadge } from './ThemeLogoBadge';
import { isQuestionRequired } from '../../utils/questionUtils';

export const ChalkboardThemeLayout: React.FC<ThemeLayoutProps> = ({
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
  const normalQuestions = questions.filter(q => !q.customization?.is_remark);
  const remarkQuestions = questions.filter(q => !!q.customization?.is_remark);

  return (
    <div className="flex-grow min-h-0 flex flex-col overflow-hidden relative w-full bg-[#0E1A13] p-1 sm:p-2 md:p-3">
      {/* Wooden Frame Wrapper */}
      <div className="flex-grow min-h-0 flex flex-col bg-[#14231A] text-[#FFF8E7] rounded-xl sm:rounded-2xl border-[6px] sm:border-[10px] md:border-[12px] border-[#5A381E] shadow-2xl overflow-hidden relative">
        {/* Top Header Row (Stacked on Mobile, 3-Column on Desktop) */}
        <header className="px-3 sm:px-6 py-2.5 sm:py-3 border-b-2 border-dashed border-emerald-600/30 flex-shrink-0 bg-[#122018]/90">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
            {/* Mobile Top Logos Row / Desktop Left Logo */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:order-1">
              <div className="bg-white/95 rounded-xl px-2.5 py-1 shadow-sm flex items-center justify-center max-w-[125px] max-h-[42px] flex-shrink-0">
                <img
                  src={catalystLogo}
                  alt="Catalyst"
                  className="max-h-[30px] sm:max-h-[36px] max-w-[105px] w-auto h-auto object-contain flex-shrink-0"
                />
              </div>

              {/* Mobile Right: Branch Logo & Fullscreen (Aligned in top row) */}
              <div className="flex items-center gap-1.5 sm:hidden flex-shrink-0">
                {branchLogo ? (
                  <div className="bg-white/95 rounded-xl px-2.5 py-1 shadow-sm flex items-center justify-center max-w-[125px] max-h-[42px] flex-shrink-0">
                    <img
                      src={branchLogo}
                      alt="Site Logo"
                      className="max-h-[30px] max-w-[105px] w-auto h-auto object-contain flex-shrink-0"
                    />
                  </div>
                ) : null}
                {enableFullscreen && (
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/40 text-amber-200 rounded-lg transition-all cursor-pointer flex-shrink-0"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

            {/* Center: Chalk Title & Subtitle (Centered on Mobile and Desktop) */}
            <div className="text-center min-w-0 flex-grow px-1 sm:px-2 sm:order-2">
              <span className="block text-[10px] sm:text-xs font-serif tracking-[0.25em] text-amber-200/90 uppercase mb-0.5">
                {texts.badge_text || '★ CATALYST ★'}
              </span>
              <h1 className="text-base sm:text-xl md:text-2xl font-serif font-black tracking-wide text-[#FFF8E7] break-words">
                {texts.title || "Today's Feedback Menu"}
              </h1>
              <p className="text-emerald-200/70 italic text-[11px] sm:text-xs font-serif break-words mt-0.5">
                {texts.subtitle || 'Freshly prepared daily'}
              </p>
            </div>

            {/* Desktop Right: Site Logo & Fullscreen (Visible on sm+) */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0 sm:order-3">
              {branchLogo ? (
                <div className="bg-white/95 rounded-xl px-2.5 py-1 shadow-sm flex items-center justify-center max-w-[125px] max-h-[42px] flex-shrink-0">
                  <img
                    src={branchLogo}
                    alt="Site Logo"
                    className="max-h-[34px] sm:max-h-[38px] max-w-[105px] w-auto h-auto object-contain flex-shrink-0"
                  />
                </div>
              ) : null}
              {enableFullscreen && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/40 text-amber-200 rounded-lg transition-all cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Scrollable Chalkboard Content */}
        <div className="flex-grow min-h-0 overflow-y-auto px-3 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-3.5 pb-6">
            {/* Menu Items / Questions */}
            {normalQuestions.map((q, idx) => {
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
                  className="bg-[#182B20]/80 border border-emerald-700/30 rounded-xl p-3 sm:p-4 shadow-sm hover:border-emerald-600/50 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Question title */}
                    <div className="flex items-center gap-2 flex-grow min-w-0">
                      <span className="text-amber-200/90 font-serif font-bold text-xs sm:text-sm">
                        {idx + 1}.
                      </span>
                      <h3 className="font-serif font-bold text-sm sm:text-base text-[#FFF8E7] leading-snug break-words">
                        {q.question_text || q.text}
                        {isQuestionRequired(q) && (
                          <span className="text-red-500 font-bold ml-1 inline-block select-none" aria-required="true" title="Required">
                            *<span className="sr-only"> (required)</span>
                          </span>
                        )}
                      </h3>
                      <div className="border-b border-dotted border-emerald-400/30 flex-grow mx-2 mb-1 hidden sm:block"></div>
                    </div>

                    {/* Right: Square Emoji Buttons - Centered horizontally on mobile */}
                    {isSmiley && smileyOptions ? (
                      <div className="flex items-center gap-2 flex-wrap flex-shrink-0 justify-center sm:justify-end w-full sm:w-auto py-1">
                        {smileyOptions.map((opt: any) => {
                          const isSelected = val !== undefined && val !== null && String(val) === String(opt.value);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => onRatingChange(q.id, opt.value)}
                              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 rounded-lg border transition-all cursor-pointer p-0.5 ${
                                isSelected
                                  ? 'bg-[#FFF8E7] text-[#14231A] border-[#FFF8E7] shadow-md scale-105 ring-2 ring-amber-200/60'
                                  : 'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-600/40 text-[#FFF8E7]'
                              }`}
                              title={`${opt.label}`}
                              aria-label={`${opt.label}`}
                            >
                              <span className="text-xl sm:text-2xl select-none leading-none pointer-events-none">{opt.emoji}</span>
                              <span
                                className={`text-[9px] font-serif font-semibold mt-0.5 pointer-events-none text-center leading-tight break-words max-w-[42px] [overflow-wrap:anywhere] ${
                                  isSelected ? 'text-[#14231A]' : 'text-emerald-200/80'
                                }`}
                              >
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="w-full sm:w-auto flex-grow flex justify-center sm:justify-end">
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

            {/* User Details in Chalk Frame */}
            {!!formSettings.collect_user_info && (
              <div className="bg-[#182B20]/90 border border-dashed border-emerald-600/40 rounded-xl p-3 sm:p-4 space-y-3 font-serif">
                <h4 className="text-xs font-bold text-amber-200 tracking-wider uppercase">
                  Table & Guest Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {!!formSettings.field_name && (
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="Guest Name"
                      className="w-full px-3 py-2 text-sm bg-emerald-950/70 border border-emerald-600/40 focus:border-amber-200 rounded-lg text-[#FFF8E7] placeholder:text-emerald-300/40 outline-none"
                    />
                  )}
                  {!!formSettings.field_employee_id && (
                    <input
                      type="text"
                      value={userEmployeeId}
                      onChange={e => setUserEmployeeId(e.target.value)}
                      placeholder="Emp ID / Table No"
                      className="w-full px-3 py-2 text-sm bg-emerald-950/70 border border-emerald-600/40 focus:border-amber-200 rounded-lg text-[#FFF8E7] placeholder:text-emerald-300/40 outline-none"
                    />
                  )}
                  {!!formSettings.field_department && (
                    <input
                      type="text"
                      value={userDepartment}
                      onChange={e => setUserDepartment(e.target.value)}
                      placeholder="Department"
                      className="w-full px-3 py-2 text-sm bg-emerald-950/70 border border-emerald-600/40 focus:border-amber-200 rounded-lg text-[#FFF8E7] placeholder:text-emerald-300/40 outline-none"
                    />
                  )}
                  {!!formSettings.field_meal_slot && mealSlots.length > 0 && (
                    <select
                      value={selectedMealSlot}
                      onChange={e => setSelectedMealSlot(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-emerald-950/70 border border-emerald-600/40 focus:border-amber-200 rounded-lg text-emerald-100 outline-none cursor-pointer"
                    >
                      <option value="">Select Meal Course...</option>
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
                    placeholder="Chef notes or special requests..."
                    className="w-full px-3 py-2 text-sm bg-emerald-950/70 border border-emerald-600/40 focus:border-amber-200 rounded-lg text-[#FFF8E7] placeholder:text-emerald-300/40 outline-none"
                  />
                )}

                {/* Dynamic Custom Fields */}
                {Array.isArray(formSettings.custom_fields) && formSettings.custom_fields.filter(cf => cf.enabled !== false).map(cf => (
                  <div key={cf.id} className="pt-1">
                    <label className="block text-xs font-bold text-emerald-200 mb-1">
                      {cf.label}{cf.required ? ' *' : ''}
                    </label>
                    {cf.type === 'text' && (
                      <input
                        type="text"
                        value={customFieldValues[cf.id] || ''}
                        onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                        placeholder={cf.label}
                        className="w-full px-3 py-2 text-sm bg-emerald-950/70 border border-emerald-600/40 focus:border-amber-200 rounded-lg text-[#FFF8E7] placeholder:text-emerald-300/40 outline-none"
                      />
                    )}
                    {cf.type === 'dropdown_single' && (
                      <select
                        value={customFieldValues[cf.id] || ''}
                        onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-emerald-950/70 border border-emerald-600/40 focus:border-amber-200 rounded-lg text-emerald-100 outline-none cursor-pointer"
                      >
                        <option value="">{`Select ${cf.label}...`}</option>
                        {(cf.options || []).map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {cf.type === 'dropdown_multi' && (
                      <div className="p-2.5 bg-emerald-950/70 border border-emerald-600/40 rounded-lg flex flex-wrap gap-1.5">
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
                                  ? 'bg-[#FFF8E7] text-[#14231A] border-[#FFF8E7]'
                                  : 'bg-emerald-900/60 text-emerald-200 border-emerald-600/40 hover:border-emerald-500'
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

            {/* Remark Questions — Stacked full-width textareas right above Submit */}
            {remarkQuestions.map((rq) => {
              const cust = rq.customization || {};
              const val = ratings[rq.id] ?? '';
              return (
                <div
                  key={rq.id}
                  className="w-full p-4 rounded-xl border border-emerald-700/50 bg-[#0d1811] shadow-md transition-all"
                >
                  <label className="block text-xs sm:text-sm font-serif font-bold text-[#FFF8E7] mb-1.5">
                    {rq.question_text || rq.text || 'Remark'}
                    {isQuestionRequired(rq) && (
                      <span className="text-red-500 font-bold ml-1 inline-block select-none" aria-required="true" title="Required">
                        *<span className="sr-only"> (required)</span>
                      </span>
                    )}
                  </label>
                  <textarea
                    rows={cust.rows || 3}
                    maxLength={cust.maxLength || 1000}
                    placeholder={cust.placeholder || 'Write your feedback or remarks here...'}
                    value={val}
                    onChange={e => onRatingChange(rq.id, e.target.value)}
                    className="w-full bg-[#14231A] border border-emerald-600/40 focus:border-amber-400 rounded-lg px-3 py-2 text-xs sm:text-sm text-[#FFF8E7] placeholder:text-emerald-300/40 outline-none transition resize-none font-serif"
                  />
                  {cust.maxLength && (
                    <div className="text-[10px] sm:text-[11px] text-emerald-400/60 text-right mt-1 font-mono">
                      {String(val).length}/{cust.maxLength}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Validation Notice */}
            {validationWarning && (
              <div className="p-3 bg-amber-950/80 border border-amber-500/60 rounded-xl text-amber-200 text-xs sm:text-sm font-serif font-bold flex items-center gap-2 animate-bounce">
                <span>⚠️</span>
                <span>{validationWarning}</span>
              </div>
            )}

            {/* Place Order Button */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || !isAllRatingsAnswered}
              className="w-full bg-[#FFF8E7] hover:bg-white disabled:opacity-40 disabled:bg-emerald-900 disabled:text-emerald-400 text-[#14231A] font-serif font-black text-sm sm:text-base py-3 sm:py-3.5 min-h-[48px] rounded-xl shadow-lg border-2 border-amber-200/60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-3 border-[#14231A]/30 border-t-[#14231A] rounded-full"></div>
                  Submitting...
                </>
              ) : (
                <>{texts.submit_text || 'Place Feedback Order'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChalkboardThemeLayout;
