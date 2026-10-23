import React, { useState } from 'react';

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

interface TextCustomization {
  type: 'short_answer' | 'long_answer';
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  required?: boolean;
  is_remark?: boolean;
}

interface DropdownCustomization {
  type: 'dropdown_single' | 'dropdown_multi';
  placeholder?: string;
  options: string[];
  required?: boolean;
}

interface ChoiceCustomization {
  type: 'choice_single' | 'choice_multi';
  options: string[];
  allowOther?: boolean;
  required?: boolean;
}

type Customization =
  | ScaleCustomization
  | StarRatingCustomization
  | SmileyFaceCustomization
  | YesNoCustomization
  | TextCustomization
  | DropdownCustomization
  | ChoiceCustomization
  | any;

interface Question {
  id: number;
  question_text: string;
  response_type: string;
  customization?: Customization;
}

interface CustomQuestionProps {
  question: Question;
  value?: any;
  onChange: (value: any) => void;
  questionCount?: number;
}

export const CustomQuestionRenderer: React.FC<CustomQuestionProps> = ({ question, value, onChange, questionCount = 3 }) => {
  const customization = question.customization;
  const responseType = question.response_type;

  // If we have response_type but no customization, generate default
  if (!customization && responseType) {
    if (responseType === 'smiley_faces') {
      const defaultCustomization: SmileyFaceCustomization = {
        type: 'smiley_faces',
        options: [
          { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
          { value: 2, label: 'Needs Improvement', emoji: '😐', color: '#f97316' },
          { value: 3, label: 'Average', emoji: '🙂', color: '#eab308' },
          { value: 4, label: 'Good', emoji: '😀', color: '#22c55e' }
        ]
      };
      return <SmileyFaceRenderer customization={defaultCustomization} value={value} onChange={onChange} questionCount={questionCount} />;
    } else if (responseType === 'star_rating') {
      const defaultCustomization: StarRatingCustomization = {
        type: 'star_rating',
        numberOfStars: 5,
        options: [
          { value: 1, label: 'Poor' },
          { value: 2, label: 'Fair' },
          { value: 3, label: 'Average' },
          { value: 4, label: 'Good' },
          { value: 5, label: 'Excellent' }
        ]
      };
      return <StarRatingRenderer customization={defaultCustomization} value={value} onChange={onChange} />;
    } else if (responseType === 'scale') {
      const defaultCustomization: ScaleCustomization = {
        type: 'scale',
        minValue: 1,
        maxValue: 10,
        minLabel: 'Poor',
        maxLabel: 'Excellent',
        symbol: 'number'
      };
      return <ScaleRenderer customization={defaultCustomization} value={value} onChange={onChange} questionCount={questionCount} />;
    } else if (responseType === 'yes_no') {
      const defaultCustomization: YesNoCustomization = {
        type: 'yes_no',
        yesLabel: 'Yes',
        noLabel: 'No',
        yesColor: '#22c55e',
        noColor: '#ef4444',
        visualStyle: 'buttons'
      };
      return <YesNoRenderer customization={defaultCustomization} value={value} onChange={onChange} />;
    } else if (responseType === 'short_answer') {
      return <ShortAnswerRenderer customization={{ type: 'short_answer' }} value={value} onChange={onChange} />;
    } else if (responseType === 'long_answer') {
      return <LongAnswerRenderer customization={{ type: 'long_answer' }} value={value} onChange={onChange} />;
    } else if (responseType === 'dropdown_single') {
      return <DropdownSingleRenderer customization={{ type: 'dropdown_single', options: ['Option 1', 'Option 2'] }} value={value} onChange={onChange} />;
    } else if (responseType === 'dropdown_multi') {
      return <DropdownMultiRenderer customization={{ type: 'dropdown_multi', options: ['Option 1', 'Option 2'] }} value={value} onChange={onChange} />;
    } else if (responseType === 'choice_single') {
      return <ChoiceSingleRenderer customization={{ type: 'choice_single', options: ['Option 1', 'Option 2'] }} value={value} onChange={onChange} />;
    } else if (responseType === 'choice_multi') {
      return <ChoiceMultiRenderer customization={{ type: 'choice_multi', options: ['Option 1', 'Option 2'] }} value={value} onChange={onChange} />;
    }
  }

  if (!customization) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-500 text-sm">No customization available</p>
      </div>
    );
  }

  // Branch by type
  if (customization.type === 'smiley_faces' || responseType === 'smiley_faces') {
    return <SmileyFaceRenderer customization={customization} value={value} onChange={onChange} questionCount={questionCount} />;
  }
  if (customization.type === 'star_rating' || responseType === 'star_rating') {
    return <StarRatingRenderer customization={customization} value={value} onChange={onChange} />;
  }
  if (customization.type === 'scale' || responseType === 'scale') {
    return <ScaleRenderer customization={customization} value={value} onChange={onChange} questionCount={questionCount} />;
  }
  if (customization.type === 'yes_no' || responseType === 'yes_no') {
    return <YesNoRenderer customization={customization} value={value} onChange={onChange} />;
  }
  if (customization.type === 'short_answer' || responseType === 'short_answer') {
    return <ShortAnswerRenderer customization={customization} value={value} onChange={onChange} />;
  }
  if (customization.type === 'long_answer' || responseType === 'long_answer') {
    return <LongAnswerRenderer customization={customization} value={value} onChange={onChange} />;
  }
  if (customization.type === 'dropdown_single' || responseType === 'dropdown_single') {
    return <DropdownSingleRenderer customization={customization} value={value} onChange={onChange} />;
  }
  if (customization.type === 'dropdown_multi' || responseType === 'dropdown_multi') {
    return <DropdownMultiRenderer customization={customization} value={value} onChange={onChange} />;
  }
  if (customization.type === 'choice_single' || responseType === 'choice_single') {
    return <ChoiceSingleRenderer customization={customization} value={value} onChange={onChange} />;
  }
  if (customization.type === 'choice_multi' || responseType === 'choice_multi') {
    return <ChoiceMultiRenderer customization={customization} value={value} onChange={onChange} />;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
      Unsupported question type: {responseType || customization.type}
    </div>
  );
};

// ============= 1. SMILEY FACES (EXISTING) =============
const SmileyFaceRenderer: React.FC<{
  customization: SmileyFaceCustomization;
  value?: number | string;
  onChange: (value: number | string) => void;
  questionCount?: number;
}> = ({ customization, value, onChange, questionCount = 3 }) => {
  const options = customization.options || [];

  // Viewport-aware & question-count responsive sizing
  const emojiSize =
    questionCount <= 2 ? 'clamp(2.5rem, 5vh, 3.5rem)' :
      questionCount <= 3 ? 'clamp(2rem, 4vh, 2.8rem)' :
        questionCount <= 4 ? 'clamp(1.6rem, 3vh, 2.2rem)' : 'clamp(1.4rem, 2.5vh, 1.8rem)';

  const activeEmojiSize =
    questionCount <= 2 ? 'clamp(2.8rem, 5.5vh, 4rem)' :
      questionCount <= 3 ? 'clamp(2.2rem, 4.5vh, 3.2rem)' :
        questionCount <= 4 ? 'clamp(1.8rem, 3.5vh, 2.6rem)' : 'clamp(1.6rem, 3vh, 2.2rem)';

  const labelSize =
    questionCount <= 2 ? 'text-sm' :
      questionCount <= 4 ? 'text-[10px] sm:text-xs' : 'text-[9px] sm:text-[10px]';

  const containerPadding =
    questionCount <= 3 ? 'py-2 sm:py-4' :
      questionCount <= 5 ? 'py-1 sm:py-2' : 'py-0';

  return (
    <div className={`flex items-center justify-center gap-4 sm:gap-6 ${containerPadding} w-full px-2`}>
      {options.map((option) => {
        const isSelected = value !== undefined && value !== null && String(value) === String(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center justify-center transition-all duration-300 transform min-w-[50px] sm:min-w-[80px] min-h-[44px] cursor-pointer focus:outline-none ${
              isSelected ? 'scale-110 z-10' : value ? 'opacity-70 hover:opacity-100 hover:scale-105' : 'hover:scale-110'
            }`}
          >
            <div
              className={`flex items-center justify-center transition-all duration-300 ${
                isSelected ? 'drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]' : ''
              }`}
            >
              <span
                className="select-none transition-all duration-300 filter drop-shadow-xs"
                style={{ fontSize: isSelected ? activeEmojiSize : emojiSize }}
              >
                {option.emoji}
              </span>
            </div>
            <span
              className={`mt-1 font-black transition-colors ${labelSize} text-center leading-none`}
              style={{
                color: isSelected ? (option.color || '#22c55e') : '#6b7280'
              }}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ============= 2. STAR RATING (EXISTING) =============
const StarRatingRenderer: React.FC<{
  customization: StarRatingCustomization;
  value?: number | string;
  onChange: (value: number | string) => void;
}> = ({ customization, value, onChange }) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const stars = Array.from({ length: customization.numberOfStars || 5 }, (_, i) => i + 1);
  const activeRating = hoveredStar !== null ? hoveredStar : (Number(value) || 0);

  return (
    <div className="flex flex-col items-center py-3">
      <div className="flex justify-center gap-2">
        {stars.map(star => {
          const isFilled = star <= activeRating;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              className="text-4xl sm:text-5xl transition-transform hover:scale-110 active:scale-95 focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center p-1 cursor-pointer"
            >
              <span className={isFilled ? 'text-yellow-400 drop-shadow-md' : 'text-gray-300'}>
                ★
              </span>
            </button>
          );
        })}
      </div>
      {activeRating > 0 && customization.options && customization.options[activeRating - 1] && (
        <span className="mt-2 text-sm font-semibold text-gray-700">
          {customization.options[activeRating - 1].label}
        </span>
      )}
    </div>
  );
};

// ============= 3. SCALE (EXISTING) =============
const ScaleRenderer: React.FC<{
  customization: ScaleCustomization;
  value?: number | string;
  onChange: (value: number | string) => void;
  questionCount?: number;
}> = ({ customization, value, onChange, questionCount = 3 }) => {
  const min = customization.minValue || 1;
  const max = customization.maxValue || 10;
  const currentVal = value !== undefined && value !== null && !isNaN(Number(value)) ? Number(value) : min;

  // Calculate percentage for pointer
  const range = max - min || 1;
  const percent = Math.max(0, Math.min(100, ((currentVal - min) / range) * 100));

  // Dynamic sizing based on question count
  const containerPadding = questionCount <= 3 ? 'py-8' : questionCount <= 5 ? 'py-4' : 'py-2';
  const barHeight = questionCount <= 3 ? 'h-12' : questionCount <= 5 ? 'h-10' : 'h-8';
  const fontSize = questionCount <= 3 ? 'text-base' : questionCount <= 5 ? 'text-sm' : 'text-xs';
  const triangleTop = questionCount <= 3 ? '-top-12' : questionCount <= 5 ? '-top-10' : '-top-8';

  return (
    <div className={`w-full max-w-2xl mx-auto px-4 ${containerPadding}`}>
      <div className="relative mb-6">
        {/* Triangle Pointer */}
        <div
          className={`absolute ${triangleTop} transition-all duration-300 ease-out transform -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none`}
          style={{ left: `${percent}%` }}
        >
          <div className="bg-gray-800 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg mb-0.5">
            {currentVal}
          </div>
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-gray-800 drop-shadow-md" />
        </div>

        {/* Gradient Bar with Numbers */}
        <div className={`relative ${barHeight} bg-gradient-to-r from-[#ef4444] via-[#facc15] to-[#22c55e] rounded-2xl shadow-inner flex items-center justify-between px-2 overflow-visible`}>
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => (
            <div
              key={num}
              onClick={() => onChange(num)}
              className={`flex-1 text-center transition-all duration-300 select-none cursor-pointer z-10 ${
                currentVal === num ? `font-black ${fontSize} text-white drop-shadow-lg scale-125` : `font-bold ${fontSize} text-white/50`
              }`}
            >
              {num}
            </div>
          ))}

          {/* Invisible Overlay for Range Input to maintain accessibility and touch sliding */}
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={currentVal}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label="Rating scale"
            className="absolute -top-12 bottom-0 left-0 right-0 w-full opacity-0 cursor-grab active:cursor-grabbing z-30"
            style={{ WebkitAppearance: 'none', touchAction: 'pan-y' }}
          />
        </div>

        {/* Helper Labels */}
        <div className="flex justify-between mt-6 px-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Minimum</span>
            <span className="text-xs font-bold text-gray-600">{customization.minLabel || min}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Maximum</span>
            <span className="text-xs font-bold text-gray-600">{customization.maxLabel || max}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= 4. YES / NO (EXISTING) =============
const YesNoRenderer: React.FC<{
  customization: YesNoCustomization;
  value?: number | string;
  onChange: (value: number | string) => void;
}> = ({ customization, value, onChange }) => {
  const yesColor = customization.yesColor || '#22c55e';
  const noColor = customization.noColor || '#ef4444';
  const yesLabel = customization.yesLabel || 'Yes';
  const noLabel = customization.noLabel || 'No';

  return (
    <div className="flex justify-center gap-4 py-3">
      <button
        type="button"
        onClick={() => onChange('yes')}
        style={{
          backgroundColor: value === 'yes' ? yesColor : '#f3f4f6',
          color: value === 'yes' ? 'white' : '#374151'
        }}
        className={`px-8 py-3 min-h-[48px] min-w-[110px] rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
          value === 'yes' ? 'shadow-lg scale-105' : 'hover:bg-gray-200'
        }`}
      >
        <span>✓</span> {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('no')}
        style={{
          backgroundColor: value === 'no' ? noColor : '#f3f4f6',
          color: value === 'no' ? 'white' : '#374151'
        }}
        className={`px-8 py-3 min-h-[48px] min-w-[110px] rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
          value === 'no' ? 'shadow-lg scale-105' : 'hover:bg-gray-200'
        }`}
      >
        <span>✕</span> {noLabel}
      </button>
    </div>
  );
};

// ============= 5. SHORT ANSWER (NEW) =============
const ShortAnswerRenderer: React.FC<{
  customization: TextCustomization;
  value?: any;
  onChange: (value: any) => void;
}> = ({ customization, value, onChange }) => {
  const text = typeof value === 'string' ? value : '';
  const maxLen = customization.maxLength || 255;

  return (
    <div className="w-full max-w-lg mx-auto py-2">
      <input
        type="text"
        value={text}
        maxLength={maxLen}
        onChange={e => onChange(e.target.value)}
        placeholder={customization.placeholder || 'Type your answer here...'}
        className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-800 placeholder:text-gray-400 transition-all shadow-xs"
      />
      {customization.maxLength && (
        <div className="text-right text-[11px] text-gray-400 mt-1">
          {text.length} / {maxLen}
        </div>
      )}
    </div>
  );
};

// ============= 6. LONG ANSWER (NEW) =============
const LongAnswerRenderer: React.FC<{
  customization: TextCustomization;
  value?: any;
  onChange: (value: any) => void;
}> = ({ customization, value, onChange }) => {
  const text = typeof value === 'string' ? value : '';
  const maxLen = customization.maxLength || 1000;
  const rows = customization.rows || 4;

  return (
    <div className="w-full max-w-lg mx-auto py-2">
      <textarea
        rows={rows}
        value={text}
        maxLength={maxLen}
        onChange={e => onChange(e.target.value)}
        placeholder={customization.placeholder || 'Write your detailed feedback here...'}
        className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-800 placeholder:text-gray-400 transition-all resize-y shadow-xs"
      />
      {customization.maxLength && (
        <div className="text-right text-[11px] text-gray-400 mt-1">
          {text.length} / {maxLen}
        </div>
      )}
    </div>
  );
};

// ============= 7. DROPDOWN SINGLE (NEW) =============
const DropdownSingleRenderer: React.FC<{
  customization: DropdownCustomization;
  value?: any;
  onChange: (value: any) => void;
}> = ({ customization, value, onChange }) => {
  const selected = typeof value === 'string' ? value : '';
  const options = customization.options || [];

  return (
    <div className="w-full max-w-lg mx-auto py-2">
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-800 cursor-pointer shadow-xs transition-all"
      >
        <option value="">{customization.placeholder || 'Select an option...'}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============= 8. DROPDOWN MULTI (NEW) =============
const DropdownMultiRenderer: React.FC<{
  customization: DropdownCustomization;
  value?: any;
  onChange: (value: any) => void;
}> = ({ customization, value, onChange }) => {
  const selected: string[] = Array.isArray(value) ? value : (value ? [String(value)] : []);
  const options = customization.options || [];

  const handleToggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(item => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-2">
      <p className="text-xs text-gray-500 mb-2 font-medium">Select all that apply:</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, idx) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleToggle(opt)}
              className={`px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all border flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <span>{isSelected ? '✓' : '+'}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-[11px] text-primary-600 font-medium mt-2">
          {selected.length} selected
        </p>
      )}
    </div>
  );
};

// ============= 9. CHOICE SINGLE / RADIO (NEW) =============
const ChoiceSingleRenderer: React.FC<{
  customization: ChoiceCustomization;
  value?: any;
  onChange: (value: any) => void;
}> = ({ customization, value, onChange }) => {
  const currentAnswer = typeof value === 'object' && value !== null ? value.answer : (typeof value === 'string' ? value : '');
  const currentOtherText = typeof value === 'object' && value !== null ? value.other_text : '';
  const options = customization.options || [];
  const allowOther = !!customization.allowOther;

  const handleSelect = (opt: string) => {
    if (opt === '__other__') {
      onChange({ answer: '__other__', other_text: currentOtherText || '' });
    } else {
      onChange({ answer: opt, other_text: '' });
    }
  };

  const handleOtherTextChange = (text: string) => {
    onChange({ answer: '__other__', other_text: text });
  };

  return (
    <div className="w-full max-w-lg mx-auto py-2 space-y-2.5">
      {options.map((opt, idx) => {
        const isSelected = currentAnswer === opt;
        return (
          <label
            key={idx}
            onClick={() => handleSelect(opt)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-primary-50/70 border-primary-500 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300 bg-white'
              }`}
            >
              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span className={`text-sm sm:text-base font-medium ${isSelected ? 'text-primary-900 font-semibold' : 'text-gray-700'}`}>
              {opt}
            </span>
          </label>
        );
      })}

      {allowOther && (
        <div>
          <label
            onClick={() => handleSelect('__other__')}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              currentAnswer === '__other__'
                ? 'bg-primary-50/70 border-primary-500 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                currentAnswer === '__other__' ? 'border-primary-600 bg-primary-600' : 'border-gray-300 bg-white'
              }`}
            >
              {currentAnswer === '__other__' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span className={`text-sm sm:text-base font-medium ${currentAnswer === '__other__' ? 'text-primary-900 font-semibold' : 'text-gray-700'}`}>
              Other (please specify)
            </span>
          </label>
          {currentAnswer === '__other__' && (
            <div className="mt-2 pl-8">
              <input
                type="text"
                autoFocus
                value={currentOtherText}
                onChange={e => handleOtherTextChange(e.target.value)}
                placeholder="Please describe..."
                className="w-full px-3.5 py-2 text-sm border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============= 10. CHOICE MULTI / CHECKBOX (NEW) =============
const ChoiceMultiRenderer: React.FC<{
  customization: ChoiceCustomization;
  value?: any;
  onChange: (value: any) => void;
}> = ({ customization, value, onChange }) => {
  const selectedList: string[] = Array.isArray(value?.answer)
    ? value.answer
    : (Array.isArray(value) ? value : (value ? [String(value)] : []));
  const currentOtherText = typeof value === 'object' && value !== null ? (value.other_text || '') : '';
  const options = customization.options || [];
  const allowOther = !!customization.allowOther;
  const isOtherSelected = selectedList.includes('__other__');

  const toggleOption = (opt: string) => {
    let next: string[];
    if (selectedList.includes(opt)) {
      next = selectedList.filter(item => item !== opt);
    } else {
      next = [...selectedList, opt];
    }
    onChange({ answer: next, other_text: currentOtherText });
  };

  const handleOtherTextChange = (text: string) => {
    onChange({ answer: selectedList, other_text: text });
  };

  return (
    <div className="w-full max-w-lg mx-auto py-2 space-y-2.5">
      <p className="text-xs text-gray-500 font-medium">Select all that apply:</p>
      {options.map((opt, idx) => {
        const isSelected = selectedList.includes(opt);
        return (
          <label
            key={idx}
            onClick={() => toggleOption(opt)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-primary-50/70 border-primary-500 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white'
              }`}
            >
              {isSelected && <span className="text-xs font-bold leading-none">✓</span>}
            </div>
            <span className={`text-sm sm:text-base font-medium ${isSelected ? 'text-primary-900 font-semibold' : 'text-gray-700'}`}>
              {opt}
            </span>
          </label>
        );
      })}

      {allowOther && (
        <div>
          <label
            onClick={() => toggleOption('__other__')}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              isOtherSelected
                ? 'bg-primary-50/70 border-primary-500 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                isOtherSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white'
              }`}
            >
              {isOtherSelected && <span className="text-xs font-bold leading-none">✓</span>}
            </div>
            <span className={`text-sm sm:text-base font-medium ${isOtherSelected ? 'text-primary-900 font-semibold' : 'text-gray-700'}`}>
              Other (please specify)
            </span>
          </label>
          {isOtherSelected && (
            <div className="mt-2 pl-8">
              <input
                type="text"
                autoFocus
                value={currentOtherText}
                onChange={e => handleOtherTextChange(e.target.value)}
                placeholder="Please describe..."
                className="w-full px-3.5 py-2 text-sm border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomQuestionRenderer;
