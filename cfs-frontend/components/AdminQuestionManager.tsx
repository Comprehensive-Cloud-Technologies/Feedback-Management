import React, { useEffect, useState, useRef } from 'react';
import { getEndpoints } from '../constants';
import { FaSave, FaTimes, FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaCog } from 'react-icons/fa';
import { CustomQuestionRenderer } from './CustomQuestionRenderer';
import { CustomFieldDefinition, CustomFieldType, QuestionResponseType, FormSettings, ThemeId, ThemeCustomTexts } from '../types';
import ThemeManagerSection from './ThemeManagerSection';
import { SearchInput, matchesSearch } from './SearchInput';
import { isQuestionRequired } from '../utils/questionUtils';

// ============= SEARCHABLE DROPDOWN COMPONENT =============
interface SearchableDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ value, onChange, options, placeholder, disabled }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={open ? search : value || ''}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        onFocus={() => { setOpen(true); setSearch(''); }}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
      />
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
          )}
          {filtered.map(o => (
            <div
              key={o}
              className={`px-4 py-3 text-sm cursor-pointer hover:bg-primary-50 transition-colors ${o === value ? 'bg-primary-100 font-semibold text-primary-700' : 'text-gray-700'}`}
              onMouseDown={() => { onChange(o); setSearch(''); setOpen(false); }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============= RESPONSE TYPES =============
const RESPONSE_TYPES: { id: QuestionResponseType; label: string; icon: string }[] = [
  { id: 'smiley_faces', label: 'Smiley Faces', icon: '😊' },
  { id: 'star_rating', label: 'Star Rating', icon: '⭐' },
  { id: 'scale', label: 'Scale (1-10)', icon: '📊' },
  { id: 'yes_no', label: 'Yes / No', icon: '✅' },
  { id: 'short_answer', label: 'Short Text', icon: '📝' },
  { id: 'long_answer', label: 'Long Text', icon: '📄' },
  { id: 'dropdown_single', label: 'Dropdown', icon: '▾' },
  { id: 'dropdown_multi', label: 'Multi Dropdown', icon: '📑' },
  { id: 'choice_single', label: 'Single Choice', icon: '🔘' },
  { id: 'choice_multi', label: 'Checkboxes', icon: '☑️' }
];

// ============= TYPES =============
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

interface Canteen {
  id: number;
  name: string;
  site_id: number;
  site: string;
  meal_slots?: any;
}

interface Question {
  id: number;
  site: string;
  question_text: string;
  emoji?: string;
  response_type?: string;
  customization?: Customization;
}

const EMOJI_PRESETS = ['😞', '😐', '🙂', '😊', '😍', '👎', '👍', '⭐', '🌟', '❤️', '🔥', '💯', '✨', '🎉', '🙌'];

// Emoji Preset Sets for Smiley Faces - organized by response count
const EMOJI_PRESET_SETS = {
  responses2: {
    name: '2 Responses',
    options: [
      { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
      { value: 2, label: 'Good', emoji: '😀', color: '#22c55e' }
    ]
  },
  responses3: {
    name: '3 Responses',
    options: [
      { value: 1, label: 'Needs Improvement', emoji: '😐', color: '#f97316' },
      { value: 2, label: 'Average', emoji: '🙂', color: '#eab308' },
      { value: 3, label: 'Good', emoji: '😀', color: '#22c55e' }
    ]
  },
  responses4: {
    name: '4 Responses',
    options: [
      { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
      { value: 2, label: 'Needs Improvement', emoji: '😐', color: '#f97316' },
      { value: 3, label: 'Average', emoji: '🙂', color: '#eab308' },
      { value: 4, label: 'Good', emoji: '😀', color: '#22c55e' }
    ]
  },
  responses5: {
    name: '5 Responses',
    options: [
      { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
      { value: 2, label: 'Needs Improvement', emoji: '😐', color: '#f97316' },
      { value: 3, label: 'Average', emoji: '🙂', color: '#eab308' },
      { value: 4, label: 'Good', emoji: '😀', color: '#22c55e' },
      { value: 5, label: 'Excellent', emoji: '😍', color: '#166534' }
    ]
  }
};

// ============= CUSTOMIZATION EDITOR COMPONENT =============
interface CustomizationEditorProps {
  customization: Customization;
  onUpdate: (customization: Customization) => void;
}

const CustomizationEditor: React.FC<CustomizationEditorProps> = ({ customization, onUpdate }) => {
  if (customization.type === 'smiley_faces') {
    const sfc = customization as SmileyFaceCustomization;
    const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);

    const reindexOptions = (opts: CustomizationOption[]) => 
      opts.map((opt, i) => ({ ...opt, value: i + 1 }));

    const handleAddEmoji = () => {
      const newOption: CustomizationOption = {
        value: sfc.options.length + 1,
        label: `Option ${sfc.options.length + 1}`,
        emoji: '😊',
        color: '#22c55e'
      };
      onUpdate({ ...customization, options: reindexOptions([...sfc.options, newOption]) });
    };

    const handleRemoveEmoji = (index: number) => {
      if (sfc.options.length > 2) {
        const newOpts = sfc.options.filter((_, i) => i !== index);
        onUpdate({ ...customization, options: reindexOptions(newOpts) });
      }
    };

    const handleUpdateEmoji = (index: number, field: 'emoji' | 'label' | 'color', value: string) => {
      const newOpts = [...sfc.options];
      newOpts[index] = { ...newOpts[index], [field]: value };
      onUpdate({ ...customization, options: newOpts });
    };

    const handleApplyPreset = (presetKey: string) => {
      const preset = EMOJI_PRESET_SETS[presetKey as keyof typeof EMOJI_PRESET_SETS];
      if (preset) {
        onUpdate({ ...customization, options: preset.options });
      }
    };

    return (
      <div className="p-4 bg-gray-100 rounded border border-gray-300 space-y-4">
        <div className="flex justify-between items-center mb-3">
          <h5 className="font-semibold text-lg">🎨 Emoji Customization</h5>
          <button
            type="button"
            onClick={handleAddEmoji}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            + Add Emoji
          </button>
        </div>

        {/* Preset Selector */}
        <div className="p-3 bg-blue-50 rounded border border-blue-300">
          <label className="text-sm font-semibold text-gray-700 block mb-2">📦 Quick Presets:</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(EMOJI_PRESET_SETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleApplyPreset(key)}
                className="p-2 bg-white border-2 border-blue-300 rounded text-xs font-medium text-gray-700 hover:bg-blue-100 hover:border-blue-500 transition text-center"
                title={`${preset.options.length} response options`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {sfc.options.map((opt, i) => (
            <div key={i} className="p-4 bg-white rounded border-2 border-gray-300 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">Option {i + 1}</span>
                {sfc.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmoji(i)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Emoji Selector */}
                <div>
                  <label className="text-xs font-medium block mb-1">Emoji</label>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(showEmojiPicker === i ? null : i)}
                    style={{ backgroundColor: opt.color }}
                    className="w-full p-3 rounded text-3xl font-bold text-white border-2 border-gray-300"
                  >
                    {opt.emoji}
                  </button>
                  {showEmojiPicker === i && (
                    <div className="mt-2 p-2 bg-white border-2 border-gray-300 rounded grid grid-cols-5 gap-1">
                      {EMOJI_PRESETS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            handleUpdateEmoji(i, 'emoji', emoji);
                            setShowEmojiPicker(null);
                          }}
                          className="p-2 text-2xl hover:bg-gray-100 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Label */}
                <div>
                  <label className="text-xs font-medium block mb-1">Label</label>
                  <input
                    type="text"
                    value={opt.label}
                    onChange={e => handleUpdateEmoji(i, 'label', e.target.value)}
                    className="w-full p-2 border-2 border-gray-300 rounded text-sm"
                    placeholder="e.g., Good"
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="text-xs font-medium block mb-1">Color</label>
                  <input
                    type="color"
                    value={opt.color || '#22c55e'}
                    onChange={e => handleUpdateEmoji(i, 'color', e.target.value)}
                    className="w-full p-2 border-2 border-gray-300 rounded h-10 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (customization.type === 'star_rating') {
    const sc = customization as StarRatingCustomization;
    return (
      <div className="p-4 bg-gray-100 rounded border border-gray-300 space-y-3">
        <h5 className="font-semibold">Star Count</h5>
        <input
          type="number"
          min="3"
          max="10"
          value={sc.numberOfStars}
          onChange={e => onUpdate({ ...customization, numberOfStars: parseInt(e.target.value) })}
          className="w-20 p-2 border rounded"
        />
      </div>
    );
  }

  if (customization.type === 'scale') {
    const sc = customization as ScaleCustomization;
    return (
      <div className="p-4 bg-gray-100 rounded border border-gray-300 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Min Value</label>
            <input type="number" value={sc.minValue} onChange={e => onUpdate({ ...customization, minValue: parseInt(e.target.value) })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">Max Value</label>
            <input type="number" value={sc.maxValue} onChange={e => onUpdate({ ...customization, maxValue: parseInt(e.target.value) })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">Min Label</label>
            <input type="text" value={sc.minLabel} onChange={e => onUpdate({ ...customization, minLabel: e.target.value })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">Max Label</label>
            <input type="text" value={sc.maxLabel} onChange={e => onUpdate({ ...customization, maxLabel: e.target.value })} className="w-full p-2 border rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (customization.type === 'yes_no') {
    const yn = customization as YesNoCustomization;
    return (
      <div className="p-4 bg-gray-100 rounded border border-gray-300 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Yes Label</label>
            <input type="text" value={yn.yesLabel} onChange={e => onUpdate({ ...customization, yesLabel: e.target.value })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">No Label</label>
            <input type="text" value={yn.noLabel} onChange={e => onUpdate({ ...customization, noLabel: e.target.value })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">Yes Color</label>
            <input type="color" value={yn.yesColor} onChange={e => onUpdate({ ...customization, yesColor: e.target.value })} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm font-medium">No Color</label>
            <input type="color" value={yn.noColor} onChange={e => onUpdate({ ...customization, noColor: e.target.value })} className="w-full p-2 border rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (customization.type === 'short_answer' || customization.type === 'long_answer') {
    const isLong = customization.type === 'long_answer';
    return (
      <div className="p-4 bg-gray-100 rounded-xl border border-gray-300 space-y-4">
        <h5 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
          {isLong ? '📝 Long Answer Settings' : '✏️ Short Answer Settings'}
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Placeholder Text</label>
            <input
              type="text"
              value={customization.placeholder || ''}
              onChange={e => onUpdate({ ...customization, placeholder: e.target.value })}
              placeholder={isLong ? 'Enter your detailed feedback...' : 'Type your answer here...'}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Max Character Limit</label>
            <input
              type="number"
              min={10}
              max={2000}
              value={customization.maxLength || (isLong ? 1000 : 255)}
              onChange={e => onUpdate({ ...customization, maxLength: parseInt(e.target.value) || 255 })}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
            />
          </div>
          {isLong && (
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Textarea Rows</label>
              <input
                type="number"
                min={2}
                max={10}
                value={customization.rows || 4}
                onChange={e => onUpdate({ ...customization, rows: parseInt(e.target.value) || 4 })}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="field-required"
              checked={!!customization.required}
              onChange={e => onUpdate({ ...customization, required: e.target.checked })}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="field-required" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Mark as Required Question
            </label>
          </div>
          {isLong && (
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="field-is-remark"
                checked={!!customization.is_remark}
                onChange={e => onUpdate({ ...customization, is_remark: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="field-is-remark" className="text-sm font-semibold text-gray-800 cursor-pointer flex items-center gap-1.5">
                <span>Show this question as remark</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Bottom of form</span>
              </label>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (customization.type === 'dropdown_single' || customization.type === 'dropdown_multi') {
    const isMulti = customization.type === 'dropdown_multi';
    const options: string[] = customization.options || [];

    const handleAddOption = (optText: string) => {
      const trimmed = optText.trim();
      if (!trimmed || options.includes(trimmed)) return;
      onUpdate({ ...customization, options: [...options, trimmed] });
    };

    const handleRemoveOption = (index: number) => {
      if (options.length <= 1) return;
      onUpdate({ ...customization, options: options.filter((_, i) => i !== index) });
    };

    const handleMoveOption = (index: number, dir: 'up' | 'down') => {
      const targetIndex = dir === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= options.length) return;
      const next = [...options];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      onUpdate({ ...customization, options: next });
    };

    const handleEditOption = (index: number, val: string) => {
      const next = [...options];
      next[index] = val;
      onUpdate({ ...customization, options: next });
    };

    return (
      <OptionsBuilderEditor
        title={isMulti ? '📑 Multi-Select Dropdown Options' : '🔽 Single-Select Dropdown Options'}
        hasPlaceholder={true}
        placeholderValue={customization.placeholder || ''}
        onPlaceholderChange={(val: string) => onUpdate({ ...customization, placeholder: val })}
        options={options}
        onAddOption={handleAddOption}
        onRemoveOption={handleRemoveOption}
        onMoveOption={handleMoveOption}
        onEditOption={handleEditOption}
        required={!!customization.required}
        onRequiredChange={(req: boolean) => onUpdate({ ...customization, required: req })}
      />
    );
  }

  if (customization.type === 'choice_single' || customization.type === 'choice_multi') {
    const isMulti = customization.type === 'choice_multi';
    const options: string[] = customization.options || [];

    const handleAddOption = (optText: string) => {
      const trimmed = optText.trim();
      if (!trimmed || options.includes(trimmed)) return;
      onUpdate({ ...customization, options: [...options, trimmed] });
    };

    const handleRemoveOption = (index: number) => {
      if (options.length <= 1) return;
      onUpdate({ ...customization, options: options.filter((_, i) => i !== index) });
    };

    const handleMoveOption = (index: number, dir: 'up' | 'down') => {
      const targetIndex = dir === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= options.length) return;
      const next = [...options];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      onUpdate({ ...customization, options: next });
    };

    const handleEditOption = (index: number, val: string) => {
      const next = [...options];
      next[index] = val;
      onUpdate({ ...customization, options: next });
    };

    return (
      <OptionsBuilderEditor
        title={isMulti ? '☑️ Choice Multi (Checkboxes) Options' : '🔘 Choice Single (Radio Buttons) Options'}
        hasAllowOther={true}
        allowOther={!!customization.allowOther}
        onAllowOtherChange={(allow: boolean) => onUpdate({ ...customization, allowOther: allow })}
        options={options}
        onAddOption={handleAddOption}
        onRemoveOption={handleRemoveOption}
        onMoveOption={handleMoveOption}
        onEditOption={handleEditOption}
        required={!!customization.required}
        onRequiredChange={(req: boolean) => onUpdate({ ...customization, required: req })}
      />
    );
  }

  return null;
};

// Reusable Options Builder for Dropdown and Choice question customizations
interface OptionsBuilderEditorProps {
  title: string;
  hasPlaceholder?: boolean;
  placeholderValue?: string;
  onPlaceholderChange?: (val: string) => void;
  hasAllowOther?: boolean;
  allowOther?: boolean;
  onAllowOtherChange?: (val: boolean) => void;
  options: string[];
  onAddOption: (opt: string) => void;
  onRemoveOption: (index: number) => void;
  onMoveOption: (index: number, dir: 'up' | 'down') => void;
  onEditOption: (index: number, val: string) => void;
  required: boolean;
  onRequiredChange: (val: boolean) => void;
}

const OptionsBuilderEditor: React.FC<OptionsBuilderEditorProps> = ({
  title,
  hasPlaceholder,
  placeholderValue,
  onPlaceholderChange,
  hasAllowOther,
  allowOther,
  onAllowOtherChange,
  options,
  onAddOption,
  onRemoveOption,
  onMoveOption,
  onEditOption,
  required,
  onRequiredChange
}) => {
  const [newOptText, setNewOptText] = useState('');

  const submitAdd = () => {
    if (newOptText.trim()) {
      onAddOption(newOptText.trim());
      setNewOptText('');
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-xl border border-gray-300 space-y-4">
      <h5 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">{title}</h5>

      {hasPlaceholder && onPlaceholderChange && (
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Dropdown Placeholder / Hint</label>
          <input
            type="text"
            value={placeholderValue || ''}
            onChange={e => onPlaceholderChange(e.target.value)}
            placeholder="Select an option..."
            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-600 block">Options List</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newOptText}
            onChange={e => setNewOptText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitAdd();
              }
            }}
            placeholder="Type option name and press Add..."
            className="flex-1 p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={submitAdd}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition"
          >
            + Add
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto mt-2 pr-1">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
              <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
              <input
                type="text"
                value={opt}
                onChange={e => onEditOption(i, e.target.value)}
                className="flex-1 p-1 text-sm border-b border-gray-200 focus:border-primary-500 outline-none"
              />
              <button
                type="button"
                disabled={i === 0}
                onClick={() => onMoveOption(i, 'up')}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
                title="Move Up"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={i === options.length - 1}
                onClick={() => onMoveOption(i, 'down')}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30"
                title="Move Down"
              >
                ▼
              </button>
              {options.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveOption(i)}
                  className="px-2 py-1 text-xs text-red-500 hover:text-red-700 font-bold"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 space-y-2 border-t border-gray-200">
        {hasAllowOther && onAllowOtherChange && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!allowOther}
              onChange={e => onAllowOtherChange(e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-semibold text-gray-700">
              Allow "Other (please specify)" option with free-text box
            </span>
          </label>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!required}
            onChange={e => onRequiredChange(e.target.checked)}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-semibold text-gray-700">
            Mark as Required Question
          </span>
        </label>
      </div>
    </div>
  );
};

// ============= MAIN COMPONENT =============
interface AdminQuestionManagerProps {
  site?: string; // Optional prop to lock to a specific site
}

const AdminQuestionManager: React.FC<AdminQuestionManagerProps> = ({ site: initialSite }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const endpoints = getEndpoints();
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  const [form, setForm] = useState<{ site: string; question_text: string; response_type: string; is_required: boolean }>({
    site: initialSite || '',
    question_text: '',
    response_type: 'smiley_faces',
    is_required: false
  });
  const [customization, setCustomization] = useState<Customization | null>(() => {
    // Default to 'smiley_faces' with clean colorful emojis
    return {
      type: 'smiley_faces',
      options: [
        { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
        { value: 2, label: 'Needs Improvement', emoji: '😐', color: '#f97316' },
        { value: 3, label: 'Average', emoji: '🙂', color: '#eab308' },
        { value: 4, label: 'Good', emoji: '😀', color: '#22c55e' }
      ]
    } as SmileyFaceCustomization;
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingCustomization, setEditingCustomization] = useState<Customization | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showEditCustomizer, setShowEditCustomizer] = useState(false);

  const [sites, setSites] = useState<string[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>(initialSite || '');
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteen, setSelectedCanteen] = useState<string>(''); // Stores canteen name
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset search when site or canteen context changes
  useEffect(() => {
    setSearchQuery('');
  }, [selectedSite, selectedCanteen]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSelectedSite, setImportSelectedSite] = useState<string>('');
  const [importCanteensForSite, setImportCanteensForSite] = useState<Canteen[]>([]);
  const [importCanteenId, setImportCanteenId] = useState<number | ''>(''); // Stores canteen ID for import
  const [userRole, setUserRole] = useState<string>('');
  const [branchAdminSite, setBranchAdminSite] = useState<string>('');

  // Form Settings State
  const [formSettings, setFormSettings] = useState<FormSettings>({
    enable_fullscreen: 0,
    collect_user_info: 0,
    field_name: 0,
    field_department: 0,
    field_suggestion: 0,
    field_meal_slot: 0,
    field_employee_id: 0,
    custom_fields: [],
    theme_id: 'default',
    theme_custom_texts: null,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Get selected canteen ID
  const selectedCanteenObj = canteens.find(c => c.name === selectedCanteen);
  const selectedCanteenId = selectedCanteenObj?.id;

  // Fetch form settings when canteen changes
  useEffect(() => {
    if (!selectedCanteenId) {
      setFormSettings({
        enable_fullscreen: 0,
        collect_user_info: 0,
        field_name: 0,
        field_department: 0,
        field_suggestion: 0,
        field_meal_slot: 0,
        field_employee_id: 0,
        custom_fields: [],
        theme_id: 'default',
        theme_custom_texts: null,
      });
      return;
    }
    fetch(`${endpoints.FORM_SETTINGS}?canteen_id=${selectedCanteenId}`)
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setFormSettings({
            ...data.settings,
            custom_fields: Array.isArray(data.settings.custom_fields) ? data.settings.custom_fields : [],
            theme_id: data.settings.theme_id || 'default',
            theme_custom_texts: data.settings.theme_custom_texts || null,
          });
        }
      })
      .catch(() => {});
  }, [selectedCanteenId]);

  // Save form settings
  const saveFormSettings = async (updatedSettings: typeof formSettings) => {
    if (!selectedCanteenId) return;
    setSavingSettings(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      await fetch(endpoints.FORM_SETTINGS, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ canteen_id: selectedCanteenId, ...updatedSettings })
      });
      showNotification('Form settings saved! ✅');
    } catch {
      setError('Failed to save form settings');
    }
    setSavingSettings(false);
  };

  const handleSettingToggle = (field: 'enable_fullscreen' | 'collect_user_info' | 'field_name' | 'field_department' | 'field_suggestion' | 'field_meal_slot' | 'field_employee_id') => {
    const updated = { ...formSettings, [field]: formSettings[field] ? 0 : 1 };
    // If disabling collect_user_info, also disable all standard sub-fields
    if (field === 'collect_user_info' && updated.collect_user_info === 0) {
      updated.field_name = 0;
      updated.field_department = 0;
      updated.field_suggestion = 0;
      updated.field_meal_slot = 0;
      updated.field_employee_id = 0;
    }
    setFormSettings(updated);
  };

  // Custom Fields Handlers
  const handleAddCustomField = () => {
    const currentFields = formSettings.custom_fields || [];
    const newField: CustomFieldDefinition = {
      id: 'cf_' + Date.now(),
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
      enabled: true,
      order: currentFields.length
    };
    setFormSettings({ ...formSettings, custom_fields: [...currentFields, newField] });
  };

  const handleUpdateCustomField = (id: string, updates: Partial<CustomFieldDefinition>) => {
    const currentFields = formSettings.custom_fields || [];
    const nextFields = currentFields.map(f => f.id === id ? { ...f, ...updates } : f);
    setFormSettings({ ...formSettings, custom_fields: nextFields });
  };

  const handleRemoveCustomField = (id: string) => {
    const currentFields = formSettings.custom_fields || [];
    setFormSettings({ ...formSettings, custom_fields: currentFields.filter(f => f.id !== id) });
  };

  const handleMoveCustomField = (index: number, dir: 'up' | 'down') => {
    const currentFields = [...(formSettings.custom_fields || [])];
    const targetIndex = dir === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentFields.length) return;
    const temp = currentFields[index];
    currentFields[index] = currentFields[targetIndex];
    currentFields[targetIndex] = temp;
    currentFields.forEach((f, i) => (f.order = i));
    setFormSettings({ ...formSettings, custom_fields: currentFields });
  };

  const handleAddCustomFieldOption = (fieldId: string, optText: string) => {
    const trimmed = optText.trim();
    if (!trimmed) return;
    const currentFields = formSettings.custom_fields || [];
    const nextFields = currentFields.map(f => {
      if (f.id === fieldId) {
        const opts = f.options || [];
        if (!opts.includes(trimmed)) {
          return { ...f, options: [...opts, trimmed] };
        }
      }
      return f;
    });
    setFormSettings({ ...formSettings, custom_fields: nextFields });
  };

  const handleRemoveCustomFieldOption = (fieldId: string, optIndex: number) => {
    const currentFields = formSettings.custom_fields || [];
    const nextFields = currentFields.map(f => {
      if (f.id === fieldId) {
        const opts = (f.options || []).filter((_, i) => i !== optIndex);
        return { ...f, options: opts };
      }
      return f;
    });
    setFormSettings({ ...formSettings, custom_fields: nextFields });
  };

  // Get user role from JWT
  useEffect(() => {
    if (initialSite) {
      setSelectedSite(initialSite);
      setForm(prev => ({ ...prev, site: initialSite }));
    }
    const token = localStorage.getItem('canteenAdminJWT');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || '');
        if (payload.role === 'branch_admin' && payload.site) {
          setBranchAdminSite(payload.site);
          if (!initialSite) setSelectedSite(payload.site);
        }
      } catch { }
    }
  }, [initialSite]);

  // Fetch sites
  useEffect(() => {
    fetch(endpoints.SITES)
      .then(res => res.json())
      .then(data => {
        const allSites = Array.isArray(data.sites) ? data.sites.map((s: any) => s.location) : [];
        // Filter sites for branch admins
        if (userRole === 'branch_admin' && branchAdminSite) {
          setSites([branchAdminSite]);
        } else {
          setSites(allSites);
        }
      })
      .catch(() => setSites([]));
  }, [userRole, branchAdminSite]);

  // Fetch canteens for import modal when site changes
  useEffect(() => {
    if (!importSelectedSite) {
      setImportCanteensForSite([]);
      setImportCanteenId('');
      return;
    }
    const token = localStorage.getItem('canteenAdminJWT');
    fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(importSelectedSite)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const canteenList: Canteen[] = data.details || [];
        setImportCanteensForSite(canteenList);
        setImportCanteenId('');
      })
      .catch(() => setImportCanteensForSite([]));
  }, [importSelectedSite]);

  // Fetch canteens when site changes
  useEffect(() => {
    if (!selectedSite) {
      setCanteens([]);
      setSelectedCanteen('');
      return;
    }
    const token = localStorage.getItem('canteenAdminJWT');
    fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(selectedSite)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const canteenList: Canteen[] = data.details || []; // details contains the full objects including id
        setCanteens(canteenList);
        setSelectedCanteen('');
      })
      .catch(() => setCanteens([]));
  }, [selectedSite]);

  // Fetch questions when site and/or canteen changes
  const fetchQuestions = async () => {
    if (!selectedSite) {
      setQuestions([]);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      // Find the canteen ID if selected
      const canteenObj = canteens.find(c => c.name === selectedCanteen);
      const branchIdParam = canteenObj ? `&branch_id=${canteenObj.id}` : '';

      const res = await fetch(`${endpoints.QUESTIONS}?site=${encodeURIComponent(selectedSite)}${branchIdParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data.questions) ? data.questions : [];
        const processedItems = items.map((q: any) => {
          // Parse customization if it's a JSON string
          let customization = q.customization;
          if (typeof customization === 'string') {
            try {
              customization = JSON.parse(customization);
            } catch (e) {
              console.warn('Failed to parse customization for question', q.id, ':', customization);
              customization = null;
            }
          }
          return {
            ...q,
            site: selectedSite,
            customization: customization
          };
        });
        setQuestions(processedItems);
        console.log('Fetched questions for admin:', processedItems);
      }
    } catch (err: any) {
      setError('Failed to fetch questions');
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedSite, selectedCanteen]); // Re-fetch when selectedCanteen changes

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const getInitialCustomization = (type: string): Customization => {
    switch (type) {
      case 'smiley_faces':
        return {
          type: 'smiley_faces',
          options: [
            { value: 1, label: 'Poor', emoji: '😡', color: '#ef4444' },
            { value: 2, label: 'Needs Improvement', emoji: '😟', color: '#f97316' },
            { value: 3, label: 'Average', emoji: '😐', color: '#eab308' },
            { value: 4, label: 'Good', emoji: '😊', color: '#22c55e' },
            { value: 5, label: 'Excellent', emoji: '😍', color: '#ec4899' }
          ]
        } as SmileyFaceCustomization;
      case 'star_rating':
        return {
          type: 'star_rating',
          numberOfStars: 5,
          options: [
            { value: 1, label: 'Poor' },
            { value: 2, label: 'Fair' },
            { value: 3, label: 'Average' },
            { value: 4, label: 'Good' },
            { value: 5, label: 'Excellent' }
          ]
        } as StarRatingCustomization;
      case 'scale':
        return {
          type: 'scale',
          minValue: 1,
          maxValue: 10,
          minLabel: 'Poor',
          maxLabel: 'Excellent',
          symbol: 'number'
        } as ScaleCustomization;
      case 'yes_no':
        return {
          type: 'yes_no',
          yesLabel: 'Yes',
          noLabel: 'No',
          yesColor: '#22c55e',
          noColor: '#ef4444',
          visualStyle: 'buttons'
        } as YesNoCustomization;
      case 'short_answer':
        return {
          type: 'short_answer',
          placeholder: 'Type your answer here...',
          maxLength: 255,
          required: false
        } as TextCustomization;
      case 'long_answer':
        return {
          type: 'long_answer',
          placeholder: 'Write your detailed feedback here...',
          maxLength: 1000,
          rows: 4,
          required: false,
          is_remark: false
        } as TextCustomization;
      case 'dropdown_single':
        return {
          type: 'dropdown_single',
          placeholder: 'Select an option...',
          options: ['Option 1', 'Option 2', 'Option 3'],
          required: false
        } as DropdownCustomization;
      case 'dropdown_multi':
        return {
          type: 'dropdown_multi',
          placeholder: 'Select options...',
          options: ['Option 1', 'Option 2', 'Option 3'],
          required: false
        } as DropdownCustomization;
      case 'choice_single':
        return {
          type: 'choice_single',
          options: ['Option 1', 'Option 2', 'Option 3'],
          allowOther: true,
          required: false
        } as ChoiceCustomization;
      case 'choice_multi':
        return {
          type: 'choice_multi',
          options: ['Option 1', 'Option 2', 'Option 3'],
          allowOther: true,
          required: false
        } as ChoiceCustomization;
      default:
        return {} as any;
    }
  };

  const handleResponseTypeChange = (type: any) => {
    setForm({ ...form, response_type: type });
    setCustomization(getInitialCustomization(type));
  };

  const handleEditResponseTypeChange = (type: any) => {
    if (!editingQuestion) return;
    setEditingId(editingId); // Keep ID
    const initialCust = getInitialCustomization(type);
    setEditingQuestion({ ...editingQuestion, response_type: type, customization: initialCust });
    setEditingCustomization(initialCust);
  };

  const handleImportQuestions = async () => {
    if (!importCanteenId || !selectedCanteen) {
      setError('Please select a source canteen and ensure a destination canteen is selected.');
      return;
    }
    const currentCanteen = canteens.find(c => c.name === selectedCanteen);
    if (!currentCanteen) {
      setError('Destination canteen not found.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      // 1. Fetch questions from source canteen - MUST pass site to avoid getting everything
      const resSource = await fetch(`${endpoints.QUESTIONS}?site=${encodeURIComponent(importSelectedSite)}&branch_id=${importCanteenId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataSource = await resSource.json();
      const sourceQuestions = dataSource.questions || [];

      if (sourceQuestions.length === 0) {
        showNotification('No questions found in source canteen.');
        setLoading(false);
        setShowImportModal(false);
        return;
      }

      // 2. Map and POST each question to current canteen
      let successCount = 0;
      let failCount = 0;

      for (const q of sourceQuestions) {
        const res = await fetch(endpoints.QUESTIONS, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            site: selectedSite,
            branch_id: currentCanteen.id, // Use the ID of the currently selected canteen
            question_text: q.question_text,
            emoji: q.emoji,
            response_type: q.response_type,
            customization: {
              ...(typeof q.customization === 'object' && q.customization !== null ? q.customization : {}),
              required: isQuestionRequired(q)
            },
            is_required: isQuestionRequired(q) ? 1 : 0
          })
        });
        if (res.ok) successCount++;
        else failCount++;
      }

      await fetchQuestions();
      setShowImportModal(false);
      if (failCount > 0) {
        showNotification(`Imported ${successCount} questions, but ${failCount} failed. ⚠️`);
      } else {
        showNotification(`Imported all ${successCount} questions! 🚀`);
      }
    } catch (err) {
      setError('Failed to import questions');
      console.error('Import error:', err);
    }
    setLoading(false);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite || !form.question_text.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!selectedCanteen) {
      setError('Please select a canteen to add the question to.');
      return;
    }

    setError('');
    if (!form.question_text.trim()) {
      setError('Question text cannot be empty.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const canteenObj = canteens.find(c => c.name === selectedCanteen);

      const payload: any = {
        site: selectedSite,
        question_text: form.question_text,
        response_type: form.response_type,
        is_required: form.is_required ? 1 : 0,
      };

      const finalCustomization = {
        ...(customization || getInitialCustomization(form.response_type)),
        required: Boolean(form.is_required)
      };
      payload.customization = finalCustomization;

      if (canteenObj) {
        payload.branch_id = canteenObj.id; // Use the ID of the selected canteen
      } else {
        setError('Selected canteen not found.');
        setLoading(false);
        return;
      }

      const res = await fetch(endpoints.QUESTIONS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to add question');
      }

      setForm({ site: selectedSite, question_text: '', response_type: 'smiley_faces', is_required: false });
      setCustomization(null);
      setShowCustomizer(false);
      await fetchQuestions();
      showNotification('Question added! 🎉');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const res = await fetch(`${endpoints.QUESTIONS}?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== id));
        showNotification('Deleted.');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to delete');
      }
    } catch (e) {
      console.error(e);
      setError('Error deleting question');
    }
    setLoading(false);
  };

  const handleEditSave = async (id: number) => {
    if (!editingQuestion || !editingQuestion.question_text.trim()) {
      setError('Question text cannot be empty');
      return;
    }
    try {
      const token = localStorage.getItem('canteenAdminJWT');
      const reqState = isQuestionRequired(editingQuestion);
      const payload: any = {
        id,
        question_text: editingQuestion.question_text,
        response_type: editingQuestion.response_type,
        is_required: reqState ? 1 : 0
      };

      const finalCustomization = {
        ...(editingCustomization || (editingQuestion.customization as any) || {}),
        required: reqState
      };
      payload.customization = finalCustomization;

      const res = await fetch(`${endpoints.QUESTIONS}?id=${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditingId(null);
        setEditingQuestion(null);
        await fetchQuestions();
        showNotification('Question updated successfully! 🎉');
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Failed to update question');
      }
    } catch (e: any) {
      console.error(e);
      setError('Error updating question: ' + e.message);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const typeObj = RESPONSE_TYPES.find((t) => t.id === q.response_type);
    const typeLabel = typeObj ? typeObj.label : '';
    return matchesSearch(searchQuery, [q.question_text, q.response_type, typeLabel]);
  });

  return (
    <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-xl mt-6">
      {/* Import Questions Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-scale-up border border-indigo-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Import Questions</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
            </div>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              Copy all questions from another canteen to <strong>{selectedCanteen}</strong>. This will help you reuse common question sets quickly.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-indigo-600 uppercase mb-2 tracking-widest">Step 1: Select Source Site</label>
                <select
                  value={importSelectedSite}
                  onChange={(e) => setImportSelectedSite(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium"
                >
                  <option value="">Select a site...</option>
                  {sites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-indigo-600 uppercase mb-2 tracking-widest">Step 2: Select Source Canteen</label>
                <select
                  value={importCanteenId}
                  onChange={(e) => setImportCanteenId(parseInt(e.target.value))}
                  disabled={!importSelectedSite}
                  className="w-full p-4 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium disabled:opacity-50"
                >
                  <option value="">Select a canteen...</option>
                  {importCanteensForSite.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-4 px-6 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all border-2 border-transparent"
              >
                Go Back
              </button>
              <button
                onClick={handleImportQuestions}
                disabled={!importCanteenId || loading}
                className="flex-[2] py-4 px-6 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></div>
                    Importing...
                  </>
                ) : (
                  <>Confirm Import 🚀</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container in Top-Right Corner */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-md">
        {notification && (
          <div className="pointer-events-auto bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-green-500 animate-fade-in-down">
            <span className="text-xl">✅</span>
            <span className="font-semibold text-sm">{notification}</span>
          </div>
        )}
        {error && (
          <div className="pointer-events-auto bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 border border-red-500 animate-fade-in-down">
            <div className="flex items-center gap-2">
              <span className="text-xl">❌</span>
              <span className="font-semibold text-sm">{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-white hover:text-gray-200 text-lg font-bold ml-2">×</button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg py-3 mb-6 shadow px-4">
        <h2 className="text-xl font-bold text-white">📋 Manage Questions with Customization {userRole === 'branch_admin' && `(${branchAdminSite})`}</h2>
      </div>

      {/* Site & Canteen Selection */}
      <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">🎯 Step 1: Select Context</h3>
        {userRole === 'branch_admin' && (
          <div className="mb-4 p-3 bg-blue-100 border-l-4 border-blue-500 text-sm text-blue-700">
            ℹ️ As a Branch Admin, you can only manage questions for your site: <strong>{branchAdminSite}</strong>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📍 Select Site (Required)</label>
            <SearchableDropdown
              value={selectedSite}
              onChange={val => setSelectedSite(val)}
              options={sites}
              placeholder="-- Search & Select Site --"
              disabled={userRole === 'branch_admin'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🏪 Select Canteen</label>
            <SearchableDropdown
              value={selectedCanteen}
              onChange={val => setSelectedCanteen(val)}
              options={canteens.map(c => c.name)}
              placeholder="-- Search & Select Canteen --"
              disabled={!selectedSite}
            />
          </div>
        </div>
      </div>

      {/* Form Settings — shown when a canteen is selected */}
      {selectedSite && selectedCanteen && selectedCanteenId && (
        <div className="mb-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">⚙️ Feedback Form Settings <span className="text-sm font-normal text-gray-500">for {selectedCanteen}</span></h3>

          <div className="space-y-4">
            {/* Full Screen Mode */}
            <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-amber-400 transition-all">
              <input
                type="checkbox"
                checked={!!formSettings.enable_fullscreen}
                onChange={() => handleSettingToggle('enable_fullscreen')}
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-semibold text-gray-800">🖥️ Enable Full Screen Mode</span>
                <p className="text-xs text-gray-500">Feedback form will auto-enter fullscreen when opened for this canteen</p>
              </div>
            </label>

            {/* Collect User Info */}
            <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-amber-400 transition-all">
              <input
                type="checkbox"
                checked={!!formSettings.collect_user_info}
                onChange={() => handleSettingToggle('collect_user_info')}
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-semibold text-gray-800">📋 Collect User Feedback Info</span>
                <p className="text-xs text-gray-500">Show additional fields on the feedback form to collect user details</p>
              </div>
            </label>

            {/* Sub-fields — only shown when collect_user_info is enabled */}
            {!!formSettings.collect_user_info && (
              <div className="ml-8 pl-4 border-l-4 border-amber-300 space-y-3">
                <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-amber-300 transition-all">
                  <input type="checkbox" checked={!!formSettings.field_name} onChange={() => handleSettingToggle('field_name')} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm font-medium text-gray-700">👤 Name Field</span>
                </label>
                <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-amber-300 transition-all">
                  <input type="checkbox" checked={!!formSettings.field_employee_id} onChange={() => handleSettingToggle('field_employee_id')} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm font-medium text-gray-700">🪪 Employee ID Field</span>
                </label>
                <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-amber-300 transition-all">
                  <input type="checkbox" checked={!!formSettings.field_department} onChange={() => handleSettingToggle('field_department')} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm font-medium text-gray-700">🏢 Department Field</span>
                </label>
                <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-amber-300 transition-all">
                  <input type="checkbox" checked={!!formSettings.field_suggestion} onChange={() => handleSettingToggle('field_suggestion')} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm font-medium text-gray-700">💬 Description / Suggestion Box</span>
                </label>
                <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-amber-300 transition-all">
                  <input type="checkbox" checked={!!formSettings.field_meal_slot} onChange={() => handleSettingToggle('field_meal_slot')} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm font-medium text-gray-700">🍽️ Meal Slot Dropdown</span>
                </label>

                {/* Dynamic Custom Fields Section */}
                <div className="pt-4 mt-4 border-t border-amber-200">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block">Custom User Info Fields</span>
                      <p className="text-xs text-gray-500">Add canteen-specific inputs (e.g. Contractor Company, Floor Number, Seat No)</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <FaPlus size={11} /> Add Custom Field
                    </button>
                  </div>

                  {(!formSettings.custom_fields || formSettings.custom_fields.length === 0) ? (
                    <div className="p-4 bg-white/70 rounded-lg border border-dashed border-amber-300 text-center text-xs text-gray-500">
                      No custom fields added yet for this canteen. Click <strong>+ Add Custom Field</strong> above to define one.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formSettings.custom_fields.map((cf, idx) => (
                        <div key={cf.id} className="p-3.5 bg-white rounded-xl border border-amber-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">#{idx + 1}</span>
                              <input
                                type="text"
                                value={cf.label}
                                onChange={e => handleUpdateCustomField(cf.id, { label: e.target.value })}
                                placeholder="Field Label (e.g. Company, Seat No)"
                                className="text-sm font-bold text-gray-800 border border-gray-300 rounded px-2.5 py-1 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 flex-1 max-w-xs"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveCustomField(idx, 'up')}
                                className="p-1.5 text-gray-500 hover:text-amber-700 disabled:opacity-25 rounded hover:bg-amber-50 transition-colors"
                                title="Move Up"
                              >
                                <FaArrowUp size={11} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === formSettings.custom_fields!.length - 1}
                                onClick={() => handleMoveCustomField(idx, 'down')}
                                className="p-1.5 text-gray-500 hover:text-amber-700 disabled:opacity-25 rounded hover:bg-amber-50 transition-colors"
                                title="Move Down"
                              >
                                <FaArrowDown size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomField(cf.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors ml-1"
                                title="Delete Custom Field"
                              >
                                <FaTrash size={11} />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-gray-500 uppercase mr-1">Type:</span>
                              {[
                                { type: 'text', label: 'Text' },
                                { type: 'dropdown_single', label: 'Dropdown (Single)' },
                                { type: 'dropdown_multi', label: 'Dropdown (Multi)' }
                              ].map(t => (
                                <button
                                  key={t.type}
                                  type="button"
                                  onClick={() => handleUpdateCustomField(cf.id, {
                                    type: t.type as any,
                                    options: t.type !== 'text' && (!cf.options || cf.options.length === 0) ? ['Option 1', 'Option 2'] : cf.options
                                  })}
                                  className={`px-2.5 py-1 text-xs rounded font-medium border transition-all ${
                                    cf.type === t.type
                                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!cf.required}
                                  onChange={e => handleUpdateCustomField(cf.id, { required: e.target.checked })}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-xs font-semibold text-gray-700">Required</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={cf.enabled !== false}
                                  onChange={e => handleUpdateCustomField(cf.id, { enabled: e.target.checked })}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-xs font-semibold text-gray-700">Active</span>
                              </label>
                            </div>
                          </div>

                          {cf.type === 'text' ? (
                            <div>
                              <input
                                type="text"
                                value={cf.placeholder || ''}
                                onChange={e => handleUpdateCustomField(cf.id, { placeholder: e.target.value })}
                                placeholder="Placeholder text (e.g. Enter company name...)"
                                className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 bg-gray-50/50"
                              />
                            </div>
                          ) : (
                            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Dropdown Options</span>
                                <span className="text-[10px] text-gray-400">{(cf.options || []).length} options</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(cf.options || []).map((opt, optIdx) => (
                                  <span key={optIdx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 text-amber-900 text-xs font-semibold rounded-full shadow-xs">
                                    <span>{opt}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomFieldOption(cf.id, optIdx)}
                                      className="text-amber-500 hover:text-red-600 transition-colors ml-0.5"
                                      title="Remove option"
                                    >
                                      <FaTimes size={10} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-2 pt-1">
                                <input
                                  type="text"
                                  id={`new-opt-${cf.id}`}
                                  placeholder="Type option name (e.g. Floor 1)..."
                                  className="flex-1 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 bg-white"
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const input = e.currentTarget;
                                      handleAddCustomFieldOption(cf.id, input.value);
                                      input.value = '';
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`new-opt-${cf.id}`) as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                      handleAddCustomFieldOption(cf.id, input.value);
                                      input.value = '';
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                                >
                                  <FaPlus size={10} /> Add
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {savingSettings && <p className="text-xs text-amber-600 mt-2 animate-pulse">Saving settings...</p>}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => saveFormSettings(formSettings)}
              disabled={savingSettings}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-lg shadow-amber-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {savingSettings ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Add New Question */}
      {selectedSite && (
        <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">➕ Step 2: Add New Question</h3>
            {/* Required checkbox aligned right */}
            <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3.5 py-1.5 rounded-xl border border-green-300 shadow-sm hover:border-green-500 hover:bg-green-50/50 transition-all self-start sm:self-auto">
              <input
                type="checkbox"
                checked={form.is_required}
                onChange={e => {
                  const checked = e.target.checked;
                  setForm({ ...form, is_required: checked });
                  if (customization) {
                    setCustomization({ ...customization, required: checked } as any);
                  }
                }}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
              />
              <span className="text-sm font-bold text-gray-700">Required</span>
              <span className="text-xs text-red-500 font-bold">*</span>
            </label>
          </div>
          <form onSubmit={handleAddQuestion} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
              <input value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="e.g. How was the food quality?" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Response Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {RESPONSE_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleResponseTypeChange(type.id)}
                    className={`p-3 rounded-xl font-semibold transition-all border-2 flex flex-col items-center gap-1.5 ${
                      form.response_type === type.id
                        ? 'bg-primary-600 text-white border-primary-700 shadow-md ring-2 ring-primary-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-xs text-center leading-tight">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {form.response_type && customization && (
              <div className="p-4 bg-white rounded-lg border-2 border-primary-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">🎨 Customization</h4>
                  <button type="button" onClick={() => setShowCustomizer(!showCustomizer)} className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {showCustomizer ? '🔽 Hide' : '🔼 Edit'}
                  </button>
                </div>

                {/* Modern Preview Area - Matches Feedback Form */}
                <div className="mb-6 p-6 bg-gray-50 rounded-2xl border-2 border-indigo-50 shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Question Preview</span>
                    <button type="button" onClick={() => setShowCustomizer(!showCustomizer)} className="text-[10px] px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg font-black hover:bg-indigo-200 transition-colors uppercase">
                      {showCustomizer ? 'Hide Editor' : 'Edit Options'}
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                    {customization?.is_remark ? (
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full uppercase tracking-wider border border-amber-200">
                            Remark (Form Bottom)
                          </span>
                        </div>
                        <label className="block text-sm font-bold text-gray-800 mb-1.5">
                          {form.question_text || 'Your Question Here?'}
                          {(form.is_required || customization.required) && (
                            <span className="text-red-500 ml-1 font-bold select-none" aria-required="true" title="Required">
                              *<span className="sr-only"> (required)</span>
                            </span>
                          )}
                        </label>
                        <textarea
                          rows={customization.rows || 3}
                          placeholder={customization.placeholder || 'Write your detailed feedback here...'}
                          disabled
                          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-500 resize-none"
                        />
                        <div className="mt-3 p-2.5 bg-amber-50/80 border border-dashed border-amber-300 rounded-lg text-center">
                          <span className="text-xs font-semibold text-amber-800">
                            ⬇️ Will appear at the bottom of the public form right above the Submit button
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-gray-800 mb-6 text-center">
                          {form.question_text || 'Your Question Here?'}
                          {(form.is_required || (customization as any)?.required) && (
                            <span className="text-red-500 ml-1 font-bold select-none" aria-required="true" title="Required">
                              *<span className="sr-only"> (required)</span>
                            </span>
                          )}
                        </h3>
                        <CustomQuestionRenderer
                          question={{ id: 0, question_text: form.question_text, response_type: form.response_type, customization: customization || undefined }}
                          onChange={() => { }}
                        />
                      </>
                    )}
                  </div>
                </div>

                {showCustomizer && (
                  <div className="p-4 bg-white rounded-xl border-2 border-indigo-100 mb-6">
                    <CustomizationEditor customization={customization || getInitialCustomization(form.response_type)} onUpdate={setCustomization} />
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !form.question_text.trim() || !selectedSite || !selectedCanteen}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-primary-200 transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <FaSave /> {loading ? 'Saving...' : '➕ Add Question'}
              </button>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                disabled={loading || !selectedCanteen}
                className="flex-1 bg-white border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-bold py-4 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                📥 Use Existing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">📝 Step 3: View & Manage Questions {selectedSite && `for ${selectedSite}`}</h3>
            {searchQuery.trim() && (
              <span className="text-xs text-gray-500 font-semibold">
                ({filteredQuestions.length} of {questions.length})
              </span>
            )}
          </div>
          {questions.length > 0 && (
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search questions or type..."
              className="w-full sm:w-64"
            />
          )}
        </div>

        {loading && <div className="text-center py-6 text-gray-500">Loading questions...</div>}

        {!loading && questions.length > 0 ? (
          filteredQuestions.length > 0 ? (
            <div className="space-y-3">
              {filteredQuestions.map(q => (
              <div key={q.id} className="bg-white p-4 rounded-lg border-l-4 border-primary-500 shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {editingId === q.id && editingQuestion ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                            <label className="text-xs font-bold text-gray-500 uppercase block">Question Text</label>
                            <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-xs hover:border-indigo-400 self-start sm:self-auto">
                              <input
                                type="checkbox"
                                checked={isQuestionRequired(editingQuestion)}
                                onChange={e => {
                                  const checked = e.target.checked;
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    is_required: checked,
                                    customization: { ...(editingQuestion.customization || {}), required: checked }
                                  });
                                  if (editingCustomization) {
                                    setEditingCustomization({ ...editingCustomization, required: checked } as any);
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="text-xs font-bold text-gray-700">Required</span>
                              <span className="text-xs text-red-500 font-bold">*</span>
                            </label>
                          </div>
                          <input value={editingQuestion.question_text} onChange={e => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })} className="w-full p-2 border-2 border-primary-500 rounded-lg text-lg font-semibold" placeholder="Question text" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase mb-3 block tracking-widest">Select new response type if needed</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {RESPONSE_TYPES.map(type => (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() => handleEditResponseTypeChange(type.id)}
                                className={`p-2.5 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${
                                  editingQuestion.response_type === type.id
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-200'
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'
                                }`}
                              >
                                <span className="text-xl">{type.icon}</span>
                                <span className="text-[10px] text-center leading-tight uppercase">{type.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {editingQuestion.response_type && editingCustomization && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-2xl border-2 border-indigo-50">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-bold text-indigo-400 uppercase text-[10px] tracking-widest">Question Preview</h4>
                              <button type="button" onClick={() => setShowEditCustomizer(!showEditCustomizer)} className="text-[10px] px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-black hover:bg-indigo-100 transition-colors uppercase">
                                {showEditCustomizer ? 'Hide Editor' : 'Edit Options'}
                              </button>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center mb-4">
                              {editingCustomization?.is_remark ? (
                                <div className="w-full">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full uppercase tracking-wider border border-amber-200">
                                      Remark (Form Bottom)
                                    </span>
                                  </div>
                                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                                    {editingQuestion.question_text || 'Your Question Here?'}
                                    {isQuestionRequired(editingQuestion) && (
                                      <span className="text-red-500 ml-1 font-bold select-none" aria-required="true" title="Required">
                                        *<span className="sr-only"> (required)</span>
                                      </span>
                                    )}
                                  </label>
                                  <textarea
                                    rows={editingCustomization.rows || 3}
                                    placeholder={editingCustomization.placeholder || 'Write your detailed feedback here...'}
                                    disabled
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-500 resize-none"
                                  />
                                  <div className="mt-3 p-2.5 bg-amber-50/80 border border-dashed border-amber-300 rounded-lg text-center">
                                    <span className="text-xs font-semibold text-amber-800">
                                      ⬇️ Will appear at the bottom of the public form right above the Submit button
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h3 className="font-bold text-gray-800 mb-6 text-center">
                                    {editingQuestion.question_text}
                                    {isQuestionRequired(editingQuestion) && (
                                      <span className="text-red-500 ml-1 font-bold select-none" aria-required="true" title="Required">
                                        *<span className="sr-only"> (required)</span>
                                      </span>
                                    )}
                                  </h3>
                                  <CustomQuestionRenderer
                                    question={{ id: editingQuestion.id, question_text: editingQuestion.question_text, response_type: editingQuestion.response_type, customization: editingCustomization }}
                                    onChange={() => { }}
                                  />
                                </>
                              )}
                            </div>

                            {showEditCustomizer && (
                              <div className="mt-2 pt-4 border-t border-gray-100 animate-slide-down">
                                <CustomizationEditor customization={editingCustomization} onUpdate={setEditingCustomization} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-800">{q.question_text}</span>
                          {isQuestionRequired(q) ? (
                            <span className="text-xs font-bold px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200 flex items-center gap-1">
                              <span>Required</span>
                              <span className="text-red-500">*</span>
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                              Optional
                            </span>
                          )}
                          {q.customization?.is_remark && (
                            <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                              Remark
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Type: <span className="font-medium">{q.response_type || 'smiley_faces'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingId === q.id ? (
                      <>
                        <button onClick={() => handleEditSave(q.id)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold flex items-center gap-1"><FaSave /> Save</button>
                        <button onClick={() => { setEditingId(null); setEditingQuestion(null); }} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold flex items-center gap-1"><FaTimes /> Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(q.id); setEditingQuestion(q); setEditingCustomization(q.customization || null); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">✏️ Edit</button>
                        <button onClick={() => handleDelete(q.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold">🗑️ Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No questions match your search "{searchQuery}".
            </div>
          )
        ) : (
          !loading && <div className="text-center py-8 text-gray-500">{selectedSite ? 'No questions found for this site.' : 'Select a site to view questions.'}</div>
        )}
      </div>

      {/* Step 4: Choose Form Theme & Appearance */}
      {selectedSite && selectedCanteen && selectedCanteenId && (
        <ThemeManagerSection
          selectedSite={selectedSite}
          selectedCanteen={selectedCanteen}
          selectedCanteenId={selectedCanteenId}
          formSettings={formSettings}
          setFormSettings={setFormSettings}
          questions={questions}
          saveFormSettings={saveFormSettings}
          savingSettings={savingSettings}
        />
      )}
    </div>
  );
};

export default AdminQuestionManager;
