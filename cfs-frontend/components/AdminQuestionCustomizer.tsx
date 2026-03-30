import React, { useState, useEffect } from 'react';
import { getEndpoints } from '../constants';
import { FaSave, FaTimes } from 'react-icons/fa';

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
  customization: Customization;
  site: string;
  segment_id?: number;
}

interface Props {
  segmentId: string;
  siteId: string;
  onQuestionAdded?: (question: Question) => void;
  onCancel?: () => void;
}

const EMOJI_PRESETS = [
  '😞', '😐', '🙂', '😊', '😍',
  '👎', '👍', '⭐', '🌟', '❤️',
  '🔥', '💯', '✨', '🎉', '🙌'
];

const AdminQuestionCustomizer: React.FC<Props> = ({ segmentId, siteId, onQuestionAdded, onCancel }) => {
  const endpoints = getEndpoints();
  const [questionText, setQuestionText] = useState('');
  const [responseType, setResponseType] = useState<'smiley_faces' | 'star_rating' | 'scale' | 'yes_no'>('smiley_faces');
  const [customization, setCustomization] = useState<Customization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize customization based on response type
  useEffect(() => {
    initializeCustomization(responseType);
  }, [responseType]);

  const initializeCustomization = (type: string) => {
    switch (type) {
      case 'smiley_faces':
        setCustomization({
          type: 'smiley_faces',
          options: [
            { value: 1, label: 'Poor', emoji: '😞' },
            { value: 2, label: 'Needs Improvement', emoji: '😐' },
            { value: 3, label: 'Average', emoji: '🙂' },
            { value: 4, label: 'Good', emoji: '😀' }
          ]
        } as SmileyFaceCustomization);
        break;
      case 'star_rating':
        setCustomization({
          type: 'star_rating',
          numberOfStars: 5,
          options: [
            { value: 1, label: 'Poor' },
            { value: 2, label: 'Fair' },
            { value: 3, label: 'Average' },
            { value: 4, label: 'Good' },
            { value: 5, label: 'Excellent' }
          ]
        } as StarRatingCustomization);
        break;
      case 'scale':
        setCustomization({
          type: 'scale',
          minValue: 1,
          maxValue: 10,
          minLabel: 'Very Poor',
          maxLabel: 'Outstanding',
          symbol: 'number'
        } as ScaleCustomization);
        break;
      case 'yes_no':
        setCustomization({
          type: 'yes_no',
          yesLabel: 'Yes',
          noLabel: 'No',
          yesColor: '#22c55e',
          noColor: '#ef4444',
          visualStyle: 'buttons'
        } as YesNoCustomization);
        break;
    }
  };

  const handleAddQuestion = async () => {
    if (!questionText.trim() || !customization) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const res = await fetch(endpoints.QUESTIONS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          site: siteId,
          segment_id: parseInt(segmentId),
          question_text: questionText,
          response_type: responseType,
          customization: customization
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add question');
      }

      setQuestionText('');
      setResponseType('smiley_faces');
      setCustomization(null);
      if (onQuestionAdded) {
        onQuestionAdded(data.question);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl">
      {/* Contextual Targeting */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">1</span> Contextual Targeting
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">SEGMENT</label>
            <input
              type="text"
              value={segmentId}
              disabled
              className="w-full p-2 rounded border border-gray-300 bg-gray-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">SITE (REQUIRED)</label>
            <input
              type="text"
              value={siteId}
              disabled
              className="w-full p-2 rounded border border-gray-300 bg-gray-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">CANTEEN (OPTIONAL)</label>
            <input
              type="text"
              placeholder="All Canteens"
              disabled
              className="w-full p-2 rounded border border-gray-300 bg-gray-50 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Question Details */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">2</span> Question Details
        </h3>

        {/* Question Text */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2">QUESTION TEXT</label>
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question here..."
            className="w-full p-3 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Response Type Selection */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-3">RESPONSE TYPE</label>
          <div className="grid grid-cols-4 gap-3">
            {(['smiley_faces', 'star_rating', 'scale', 'yes_no'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setResponseType(type)}
                className={`p-3 rounded border-2 transition-all ${responseType === type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
              >
                <div className="text-2xl mb-1">
                  {type === 'smiley_faces' && '😊'}
                  {type === 'star_rating' && '⭐'}
                  {type === 'scale' && '📊'}
                  {type === 'yes_no' && '👍'}
                </div>
                <div className="text-xs font-semibold text-gray-700 capitalize">
                  {type.replace(/_/g, ' ')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Customization Form */}
        {customization && responseType === 'smiley_faces' && (
          <SmileyFaceCustomizer
            customization={customization as SmileyFaceCustomization}
            onChange={(c) => setCustomization(c)}
          />
        )}

        {customization && responseType === 'star_rating' && (
          <StarRatingCustomizer
            customization={customization as StarRatingCustomization}
            onChange={(c) => setCustomization(c)}
          />
        )}

        {customization && responseType === 'scale' && (
          <ScaleCustomizer
            customization={customization as ScaleCustomization}
            onChange={(c) => setCustomization(c)}
          />
        )}

        {customization && responseType === 'yes_no' && (
          <YesNoCustomizer
            customization={customization as YesNoCustomization}
            onChange={(c) => setCustomization(c)}
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 disabled:opacity-50"
          >
            Discard
          </button>
        )}
        <button
          onClick={handleAddQuestion}
          disabled={loading}
          className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <FaSave size={16} />
          {loading ? 'Adding...' : 'Add Question'}
        </button>
      </div>
    </div>
  );
};

// Smiley Face Customizer
const SmileyFaceCustomizer: React.FC<{
  customization: SmileyFaceCustomization;
  onChange: (c: SmileyFaceCustomization) => void;
}> = ({ customization, onChange }) => {
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-blue-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <h4 className="font-semibold text-gray-700">Theme Customization: Smiley Faces</h4>
      </div>

      <label className="block text-xs font-semibold text-gray-600 mb-2">OPTION LABELS</label>
      <div className="grid grid-cols-5 gap-2">
        {customization.options.map((opt, idx) => (
          <div key={idx} className="text-center">
            <button
              onClick={() => setSelectedEmoji(selectedEmoji === idx ? null : idx)}
              className={`w-full p-2 rounded border-2 mb-2 transition-all ${selectedEmoji === idx
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white'
                }`}
            >
              <div className="text-3xl mb-1">{opt.emoji}</div>
              <div className="text-xs font-medium">Star {idx + 1}</div>
            </button>
            <input
              type="text"
              value={opt.label}
              onChange={(e) => {
                const newOptions = [...customization.options];
                newOptions[idx].label = e.target.value;
                onChange({ ...customization, options: newOptions });
              }}
              className="w-full p-1 text-xs border border-gray-300 rounded"
            />
          </div>
        ))}
      </div>

      {selectedEmoji !== null && (
        <div className="mt-4 p-3 bg-white rounded border border-gray-300">
          <label className="block text-xs font-semibold text-gray-600 mb-2">SELECT EMOJI</label>
          <div className="grid grid-cols-8 gap-2">
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  const newOptions = [...customization.options];
                  newOptions[selectedEmoji].emoji = emoji;
                  onChange({ ...customization, options: newOptions });
                }}
                className="p-2 text-2xl hover:bg-gray-100 rounded border border-gray-300"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Star Rating Customizer
const StarRatingCustomizer: React.FC<{
  customization: StarRatingCustomization;
  onChange: (c: StarRatingCustomization) => void;
}> = ({ customization, onChange }) => {
  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-blue-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <h4 className="font-semibold text-gray-700">Theme Customization: Star Rating</h4>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-2">NUMBER OF STARS</label>
        <select
          value={customization.numberOfStars}
          onChange={(e) => {
            const numStars = parseInt(e.target.value);
            const newOptions = Array.from({ length: numStars }, (_, i) => ({
              value: i + 1,
              label: customization.options[i]?.label || `Star ${i + 1}`
            }));
            onChange({ ...customization, numberOfStars: numStars, options: newOptions });
          }}
          className="w-full p-2 border border-gray-300 rounded text-sm"
        >
          {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n} Stars
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">STAR LABELS</label>
        <div className="grid grid-cols-5 gap-2">
          {customization.options.map((opt, idx) => (
            <div key={idx}>
              <div className="text-center mb-2">
                <span className="text-xl">⭐</span> <span className="text-xs font-medium">Star {idx + 1}</span>
              </div>
              <input
                type="text"
                value={opt.label}
                onChange={(e) => {
                  const newOptions = [...customization.options];
                  newOptions[idx].label = e.target.value;
                  onChange({ ...customization, options: newOptions });
                }}
                className="w-full p-1 text-xs border border-gray-300 rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Scale Customizer
const ScaleCustomizer: React.FC<{
  customization: ScaleCustomization;
  onChange: (c: ScaleCustomization) => void;
}> = ({ customization, onChange }) => {
  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-blue-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <h4 className="font-semibold text-gray-700">Theme Customization: SCALE</h4>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">MINIMUM VALUE</label>
          <input
            type="number"
            value={customization.minValue}
            onChange={(e) => onChange({ ...customization, minValue: parseInt(e.target.value) })}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">MAXIMUM VALUE</label>
          <input
            type="number"
            value={customization.maxValue}
            onChange={(e) => onChange({ ...customization, maxValue: parseInt(e.target.value) })}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">SYMBOL</label>
          <select
            value={customization.symbol}
            onChange={(e) => onChange({ ...customization, symbol: e.target.value as any })}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          >
            <option value="number">Number</option>
            <option value="stars">Stars</option>
            <option value="bars">Bars</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">LOW LABEL</label>
          <input
            type="text"
            value={customization.minLabel}
            onChange={(e) => onChange({ ...customization, minLabel: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">HIGH LABEL</label>
          <input
            type="text"
            value={customization.maxLabel}
            onChange={(e) => onChange({ ...customization, maxLabel: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>
    </div>
  );
};

// Yes/No Customizer
const YesNoCustomizer: React.FC<{
  customization: YesNoCustomization;
  onChange: (c: YesNoCustomization) => void;
}> = ({ customization, onChange }) => {
  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-blue-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 13a3 3 0 105.119-1H9a1 1 0 012 0v1.5a1 1 0 11-2 0v-.5a1 1 0 00-1-1H5a1 1 0 000 2z" />
          </svg>
        </div>
        <h4 className="font-semibold text-gray-700">Theme Customization: YES - NO</h4>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">POSITIVE LABEL</label>
          <input
            type="text"
            value={customization.yesLabel}
            onChange={(e) => onChange({ ...customization, yesLabel: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">NEGATIVE LABEL</label>
          <input
            type="text"
            value={customization.noLabel}
            onChange={(e) => onChange({ ...customization, noLabel: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">POSITIVE COLOR</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={customization.yesColor}
              onChange={(e) => onChange({ ...customization, yesColor: e.target.value })}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={customization.yesColor}
              onChange={(e) => onChange({ ...customization, yesColor: e.target.value })}
              className="flex-1 p-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">NEGATIVE COLOR</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={customization.noColor}
              onChange={(e) => onChange({ ...customization, noColor: e.target.value })}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={customization.noColor}
              onChange={(e) => onChange({ ...customization, noColor: e.target.value })}
              className="flex-1 p-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-2">VISUAL STYLE</label>
        <select
          value={customization.visualStyle}
          onChange={(e) => onChange({ ...customization, visualStyle: e.target.value as any })}
          className="w-full p-2 border border-gray-300 rounded text-sm"
        >
          <option value="buttons">Buttons</option>
          <option value="toggle">Toggle</option>
          <option value="radio">Radio</option>
        </select>
      </div>

      <div className="p-3 bg-white rounded border border-gray-300">
        <label className="block text-xs font-semibold text-gray-600 mb-3">LIVE PREVIEW</label>
        <div className="flex gap-2">
          <button
            style={{ backgroundColor: customization.yesColor }}
            className="flex-1 py-2 rounded font-semibold text-white"
          >
            ✓ {customization.yesLabel}
          </button>
          <button
            style={{ backgroundColor: customization.noColor }}
            className="flex-1 py-2 rounded font-semibold text-white"
          >
            ✕ {customization.noLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionCustomizer;
