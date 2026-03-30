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

type Customization = ScaleCustomization | StarRatingCustomization | SmileyFaceCustomization | YesNoCustomization;

interface Question {
  id: number;
  question_text: string;
  response_type: string;
  customization?: Customization;
}

interface CustomQuestionProps {
  question: Question;
  value?: number | string;
  onChange: (value: number | string) => void;
  questionCount?: number;
}

export const CustomQuestionRenderer: React.FC<CustomQuestionProps> = ({ question, value, onChange, questionCount = 3 }) => {
  const customization = question.customization;
  const responseType = question.response_type;

  console.log(`Rendering question ${question.id}:`, {
    question_text: question.question_text,
    response_type: responseType,
    has_customization: !!customization,
    customization_type: customization?.type,
    customization: customization
  });

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
      return <ScaleRenderer customization={defaultCustomization} value={value} onChange={onChange} />;
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
    }
  }

  if (!customization) {
    console.warn('No customization found for question:', question.id);
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No customization available</p>
      </div>
    );
  }

  if (customization.type === 'smiley_faces') {
    return <SmileyFaceRenderer customization={customization} value={value} onChange={onChange} questionCount={questionCount} />;
  }

  if (customization.type === 'star_rating') {
    return <StarRatingRenderer customization={customization} value={value} onChange={onChange} />;
  }

  if (customization.type === 'scale') {
    return <ScaleRenderer customization={customization} value={value} onChange={onChange} />;
  }

  if (customization.type === 'yes_no') {
    return <YesNoRenderer customization={customization} value={value} onChange={onChange} />;
  }

  console.warn('Unknown customization type:', customization.type);
  return null;
};

const SmileyFaceRenderer: React.FC<{
  customization: SmileyFaceCustomization;
  value?: number | string;
  onChange: (value: number | string) => void;
  questionCount?: number;
}> = ({ customization, value, onChange, questionCount = 3 }) => {
  // Ultra-smart shrinking based on question count + viewport-aware
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
      {customization.options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex flex-col items-center justify-center transition-all duration-300 transform ${value === option.value ? 'scale-110 z-10' : value ? 'opacity-70' : ''
            } min-w-[50px] sm:min-w-[80px]`}
        >
          <div
            className={`flex items-center justify-center transition-all duration-300 ${value === option.value ? 'drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]' : ''
              }`}
          >
            <span
              className="select-none transition-all duration-300"
              style={{ fontSize: value === option.value ? activeEmojiSize : emojiSize }}
            >
              {option.emoji}
            </span>
          </div>
          <span
            className={`mt-1 font-black transition-colors ${labelSize} text-center leading-none`}
            style={{
              color: option.color || '#9ca3af'
            }}
          >
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
};

const StarRatingRenderer: React.FC<{
  customization: StarRatingCustomization;
  value?: number | string;
  onChange: (value: number | string) => void;
}> = ({ customization, value, onChange }) => {
  const totalStars = customization.numberOfStars || customization.options.length;
  const selectedValue = Number(value) || 0;

  // Generate color based on star position (1=red, middle=yellow, max=green)
  const getStarColor = (starValue: number) => {
    const ratio = (starValue - 1) / (totalStars - 1);
    if (ratio <= 0.33) return '#ef4444'; // Red for low ratings
    if (ratio <= 0.66) return '#eab308'; // Yellow for mid ratings
    return '#22c55e'; // Green for high ratings
  };

  return (
    <div className="py-3">
      <div className="flex justify-center gap-2 mb-3">
        {customization.options.map((option) => {
          const starValue = option.value;
          // Cumulative: color all stars up to and including selected
          const isColored = starValue <= selectedValue;
          const isCurrentSelection = starValue === selectedValue;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`transition-all duration-300 transform ${isCurrentSelection ? 'scale-125 z-10' : isColored ? 'scale-110' : ''
                } hover:scale-110`}
            >
              <span
                className="transition-all duration-300"
                style={{
                  fontSize: isColored ? '3rem' : '2.5rem',
                  filter: isColored ? 'none' : 'grayscale(100%)',
                  opacity: isColored ? 1 : 0.5,
                  color: isColored ? getStarColor(starValue) : '#9ca3af'
                }}
              >
                ⭐
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs font-semibold text-gray-600 px-2">
        {customization.options.map((option) => (
          <span key={option.value} className="text-center flex-1">
            {option.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// Scale Renderer
const ScaleRenderer: React.FC<{
  customization: ScaleCustomization;
  value?: number | string;
  onChange: (value: number | string) => void;
  questionCount?: number;
}> = ({ customization, value, onChange, questionCount = 3 }) => {
  const min = customization.minValue || 1;
  const max = customization.maxValue || 10;
  const currentVal = Number(value) || min;

  // Calculate percentage for pointer
  const range = max - min || 1;
  const percent = ((currentVal - min) / range) * 100;

  // Dynamic sizing based on question count - EVEN MORE COMPACT
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
              className={`flex-1 text-center transition-all duration-300 select-none ${currentVal === num ? `font-black ${fontSize} text-white drop-shadow-lg scale-125` : `font-bold ${fontSize} text-white/50`
                }`}
            >
              {num}
            </div>
          ))}

          {/* Invisible Overlay for Range Input to maintain accessibility and ease of use */}
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={currentVal}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute -top-12 bottom-0 left-0 right-0 w-full opacity-0 cursor-grab active:cursor-grabbing z-30"
            style={{ WebkitAppearance: 'none' }}
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

// Yes/No Renderer
const YesNoRenderer: React.FC<{
  customization: YesNoCustomization;
  value?: number | string;
  onChange: (value: number | string) => void;
}> = ({ customization, value, onChange }) => {
  if (customization.visualStyle === 'toggle') {
    return (
      <div className="flex justify-center gap-4 py-4">
        <button
          onClick={() => onChange('yes')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${value === 'yes'
            ? 'bg-green-500 text-white shadow-lg scale-110'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          {customization.yesLabel}
        </button>
        <button
          onClick={() => onChange('no')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${value === 'no'
            ? 'bg-red-500 text-white shadow-lg scale-110'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          {customization.noLabel}
        </button>
      </div>
    );
  }

  if (customization.visualStyle === 'radio') {
    return (
      <div className="flex gap-6 py-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="yes-no"
            value="yes"
            checked={value === 'yes'}
            onChange={() => onChange('yes')}
            className="w-5 h-5 cursor-pointer"
          />
          <span className="font-semibold text-gray-700">{customization.yesLabel}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="yes-no"
            value="no"
            checked={value === 'no'}
            onChange={() => onChange('no')}
            className="w-5 h-5 cursor-pointer"
          />
          <span className="font-semibold text-gray-700">{customization.noLabel}</span>
        </label>
      </div>
    );
  }

  // Default: Buttons
  return (
    <div className="flex justify-center gap-4 py-4">
      <button
        onClick={() => onChange('yes')}
        style={{
          backgroundColor: value === 'yes' ? customization.yesColor : '#e5e7eb',
          color: value === 'yes' ? 'white' : '#374151'
        }}
        className="px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2"
      >
        <span>✓</span> {customization.yesLabel}
      </button>
      <button
        onClick={() => onChange('no')}
        style={{
          backgroundColor: value === 'no' ? customization.noColor : '#e5e7eb',
          color: value === 'no' ? 'white' : '#374151'
        }}
        className="px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2"
      >
        <span>✕</span> {customization.noLabel}
      </button>
    </div>
  );
};

export default CustomQuestionRenderer;
