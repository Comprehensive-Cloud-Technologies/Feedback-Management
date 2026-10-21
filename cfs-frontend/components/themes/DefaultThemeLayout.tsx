import React from 'react';
import { ThemeLayoutProps } from './types';
import { CustomQuestionRenderer } from '../CustomQuestionRenderer';

export const DefaultThemeLayout: React.FC<ThemeLayoutProps> = ({
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

  return (
    <div className="flex-grow min-h-0 flex flex-col overflow-hidden relative w-full pt-1">
      {/* Background Image Layer (Safe iOS viewport cover with subtle contrast overlay) */}
      {isBgEnabled && (
        <div
          className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${formSettings.bg_image_data})`,
          }}
        >
          {/* Subtle contrast overlay to ensure 100% legibility on any image */}
          <div className="absolute inset-0 bg-slate-900/30 backdrop-brightness-95 pointer-events-none" />
        </div>
      )}

      {/* Header / Logo Area - Standardized & Responsive */}
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
              className="h-10 sm:h-14 md:h-16 w-auto object-contain"
            />
          </div>

          {/* Center Column - Text Content */}
          <div className="flex-grow flex flex-col items-center justify-center min-w-0">
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
              className="h-11 sm:h-14 md:h-16 w-auto object-contain max-w-[80px] sm:max-w-[110px] md:max-w-[140px] flex-shrink-0"
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

      {/* Center Questions Area - Scrollable & Responsive */}
      <div className="flex-grow min-h-0 w-full max-w-4xl mx-auto px-2 sm:px-4 py-0.5 flex flex-col overflow-hidden z-10">
        <div className="flex-grow min-h-0 overflow-y-auto overflow-x-hidden px-1 sm:px-2 scrollbar-hide">
          <div className="flex flex-col gap-1 sm:gap-1.5 py-0.5">
            {questions.map((q) => {
              const questionCount = questions.length;
              const containerPadding =
                questionCount <= 2 ? 'p-3 sm:p-4 md:p-5' :
                  questionCount <= 3 ? 'p-2 sm:p-3 md:p-4' :
                    questionCount <= 4 ? 'p-1.5 sm:p-2 md:p-3' : 'p-1 sm:p-1.5 md:p-2';

              const titleSize =
                questionCount <= 2 ? 'text-lg sm:text-2xl md:text-3xl' :
                  questionCount <= 3 ? 'text-base sm:text-lg md:text-2xl' :
                    questionCount <= 4 ? 'text-sm sm:text-base md:text-xl' : 'text-xs sm:text-sm md:text-lg';

              return (
                <div
                  key={q.id}
                  className={`rounded-xl ${containerPadding} flex flex-col items-center justify-center transition-all flex-shrink-0 ${
                    isBgEnabled
                      ? 'bg-white/45 backdrop-blur-md border border-white/40 shadow-md hover:bg-white/55 hover:border-white/60 hover:shadow-lg'
                      : 'bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200'
                  }`}
                >
                  <h3 className={`${titleSize} font-bold text-gray-800 mb-0.5 sm:mb-1 text-center leading-snug w-full px-2`}>
                    {q.question_text || q.text}
                  </h3>

                  <div className="w-full flex justify-center scale-[0.80] sm:scale-[0.90] md:scale-100 origin-center transition-transform">
                    <CustomQuestionRenderer
                      question={{
                        ...q,
                        question_text: q.question_text || q.text || '',
                        response_type: q.response_type || 'smiley_faces',
                        customization: q.customization || {
                          type: 'smiley_faces',
                          options: [
                            { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
                            { value: 2, label: 'Needs Improvement', emoji: '😐', color: '#f97316' },
                            { value: 3, label: 'Average', emoji: '🙂', color: '#eab308' },
                            { value: 4, label: 'Good', emoji: '😀', color: '#22c55e' }
                          ]
                        }
                      } as any}
                      value={ratings[q.id]}
                      onChange={(val) => onRatingChange(q.id, val)}
                      questionCount={questionCount}
                    />
                  </div>
                </div>
              );
            })}

            {/* User Info Fields — inline after questions, same width */}
            {!!formSettings.collect_user_info && (
              <div className="flex-shrink-0 space-y-2 mt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {!!formSettings.field_name && (
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="Your Name"
                      className={`w-full px-3 py-2 text-sm rounded-lg transition-all ${
                        isBgEnabled
                          ? 'bg-white/65 backdrop-blur-sm border border-white/60 text-gray-900 placeholder:text-gray-600 focus:bg-white/85 focus:ring-2 focus:ring-primary-500/30 shadow-xs'
                          : 'bg-gray-50 border border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-500'
                      }`}
                    />
                  )}
                  {!!formSettings.field_employee_id && (
                    <input
                      type="text"
                      value={userEmployeeId}
                      onChange={e => setUserEmployeeId(e.target.value)}
                      placeholder="Employee ID"
                      className={`w-full px-3 py-2 text-sm rounded-lg transition-all ${
                        isBgEnabled
                          ? 'bg-white/65 backdrop-blur-sm border border-white/60 text-gray-900 placeholder:text-gray-600 focus:bg-white/85 focus:ring-2 focus:ring-primary-500/30 shadow-xs'
                          : 'bg-gray-50 border border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-500'
                      }`}
                    />
                  )}
                  {!!formSettings.field_suggestion && (
                    <input
                      type="text"
                      value={userSuggestion}
                      onChange={e => setUserSuggestion(e.target.value)}
                      placeholder="Your suggestions or comments..."
                      className={`w-full px-3 py-2 text-sm rounded-lg transition-all ${
                        isBgEnabled
                          ? 'bg-white/65 backdrop-blur-sm border border-white/60 text-gray-900 placeholder:text-gray-600 focus:bg-white/85 focus:ring-2 focus:ring-primary-500/30 shadow-xs'
                          : 'bg-gray-50 border border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-500'
                      }`}
                    />
                  )}
                  {!!formSettings.field_department && (
                    <input
                      type="text"
                      value={userDepartment}
                      onChange={e => setUserDepartment(e.target.value)}
                      placeholder="Department"
                      className={`w-full px-3 py-2 text-sm rounded-lg transition-all ${
                        isBgEnabled
                          ? 'bg-white/65 backdrop-blur-sm border border-white/60 text-gray-900 placeholder:text-gray-600 focus:bg-white/85 focus:ring-2 focus:ring-primary-500/30 shadow-xs'
                          : 'bg-gray-50 border border-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-500'
                      }`}
                    />
                  )}
                </div>
                {!!formSettings.field_meal_slot && mealSlots.length > 0 && (
                  <select
                    value={selectedMealSlot}
                    onChange={e => setSelectedMealSlot(e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg transition-all appearance-none cursor-pointer ${
                      isBgEnabled
                        ? 'bg-white/65 backdrop-blur-sm border border-white/60 text-gray-800 focus:bg-white/85 focus:ring-2 focus:ring-primary-500/30 shadow-xs'
                        : 'bg-gray-50 border border-gray-400 text-gray-500 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                    }`}
                  >
                    <option value="">Select Meal Slot...</option>
                    {mealSlots.map((slot, idx) => (
                      <option key={idx} value={slot.category}>{slot.category}{slot.startTime && slot.endTime ? ` (${slot.startTime} - ${slot.endTime})` : ''}</option>
                    ))}
                  </select>
                )}

                {/* Dynamic Custom Fields */}
                {Array.isArray(formSettings.custom_fields) && formSettings.custom_fields.filter(cf => cf.enabled !== false).length > 0 && (
                  <div className="pt-2 border-t border-gray-200/60 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formSettings.custom_fields.filter(cf => cf.enabled !== false).map(cf => (
                        <div key={cf.id} className="w-full">
                          {cf.type === 'text' && (
                            <input
                              type="text"
                              value={customFieldValues[cf.id] || ''}
                              onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                              placeholder={`${cf.label}${cf.required ? ' *' : ''}`}
                              className={`w-full px-3 py-2 text-sm rounded-lg transition-all ${
                                isBgEnabled
                                  ? 'bg-white/65 backdrop-blur-sm border border-white/60 text-gray-900 placeholder:text-gray-600 focus:bg-white/85 focus:ring-2 focus:ring-primary-500/30 shadow-xs'
                                  : 'bg-gray-50 border border-gray-400 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20'
                              }`}
                            />
                          )}
                          {cf.type === 'dropdown_single' && (
                            <select
                              value={customFieldValues[cf.id] || ''}
                              onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.id]: e.target.value }))}
                              className={`w-full px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${
                                isBgEnabled
                                  ? 'bg-white/65 backdrop-blur-sm border border-white/60 text-gray-800 focus:bg-white/85 focus:ring-2 focus:ring-primary-500/30 shadow-xs'
                                  : 'bg-gray-50 border border-gray-400 text-gray-700 focus:bg-white focus:ring-2 focus:ring-primary-500/20'
                              }`}
                            >
                              <option value="">{`Select ${cf.label}${cf.required ? ' *' : ''}...`}</option>
                              {(cf.options || []).map((opt, optIdx) => (
                                <option key={optIdx} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                          {cf.type === 'dropdown_multi' && (
                            <div className={`p-2 rounded-lg transition-all ${
                              isBgEnabled
                                ? 'bg-white/50 backdrop-blur-sm border border-white/50 shadow-xs'
                                : 'bg-gray-50 border border-gray-400'
                            }`}>
                              <label className="text-xs font-semibold text-gray-600 block mb-1">
                                {cf.label}{cf.required ? ' *' : ''} <span className="text-[10px] text-gray-400">(multi-select)</span>
                              </label>
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
                                      className={`px-2 py-0.5 text-xs rounded-md font-medium border transition-all ${
                                        isSel
                                          ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
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
                  </div>
                )}
              </div>
            )}

            {/* Validation Warning Notice */}
            {validationWarning && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-bounce flex-shrink-0">
                <span>⚠️</span>
                <span>{validationWarning}</span>
              </div>
            )}

            {/* Submit Button — inline after fields */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || !isAllRatingsAnswered}
              className="w-full flex-shrink-0 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base py-3 sm:py-4 min-h-[48px] rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-1 mb-2 cursor-pointer"
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

export default DefaultThemeLayout;
