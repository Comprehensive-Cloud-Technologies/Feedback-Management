import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaChevronDown, FaTimes } from 'react-icons/fa';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  options: (SearchableSelectOption | string)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  clearValue?: string;
  className?: string;
  triggerClassName?: string;
  variant?: 'default' | 'header-bar';
  id?: string;
  name?: string;
  required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  clearable = false,
  clearValue,
  className = '',
  triggerClassName = '',
  variant = 'default',
  id,
  name,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options to { value, label } format
  const normalizedOptions: SearchableSelectOption[] = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Current selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find(opt => opt.value === value) || null;
  }, [normalizedOptions, value]);

  // Filtered options based on search query (case-insensitive substring match)
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-select-item]');
      const currentItem = items[highlightedIndex] as HTMLElement;
      if (currentItem) {
        currentItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery('');
    const curIdx = filteredOptions.findIndex(o => o.value === value);
    setHighlightedIndex(curIdx >= 0 ? curIdx : 0);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(clearValue !== undefined ? clearValue : '');
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          if (filteredOptions.length === 0) return -1;
          const next = prev + 1;
          return next >= filteredOptions.length ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          if (filteredOptions.length === 0) return -1;
          const next = prev - 1;
          return next < 0 ? filteredOptions.length - 1 : next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input to support form validation/submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required && !value}
        />
      )}

      {/* Main trigger button / display input */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            handleOpen();
          }
        }}
        className={variant === 'header-bar'
          ? `w-full h-[44px] min-h-[44px] px-3 py-2 flex items-center justify-between gap-1.5 bg-white text-gray-800 border rounded-xl cursor-pointer select-none transition-all text-xs sm:text-sm font-semibold shadow-xs ${
              disabled
                ? 'bg-white/60 text-gray-400 border-gray-200/60 cursor-not-allowed shadow-none'
                : isOpen
                ? 'border-primary-500 ring-2 ring-primary-200/80'
                : 'border-gray-200/90 hover:border-gray-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
            } ${triggerClassName}`
          : `w-full min-h-[44px] px-3.5 py-2 flex items-center justify-between gap-2 bg-white border rounded-xl cursor-pointer select-none transition-all text-sm ${
              disabled
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : isOpen
                ? 'border-primary-500 ring-2 ring-primary-100 shadow-xs'
                : 'border-gray-300 hover:border-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
            } ${triggerClassName}`
        }
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
      >
        <span
          className={`truncate flex-1 font-medium ${
            selectedOption ? 'text-gray-800' : 'text-gray-400'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {clearable && !disabled && (clearValue !== undefined ? value !== clearValue && Boolean(value) : Boolean(value)) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition min-w-[24px] min-h-[24px] flex items-center justify-center"
              title="Clear selection"
              aria-label="Clear selection"
            >
              <FaTimes size={12} />
            </button>
          )}
          <span className={`text-gray-400 transition-transform duration-200 flex items-center justify-center ${isOpen ? 'rotate-180 text-primary-600' : ''}`}>
            <FaChevronDown size={14} />
          </span>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          className="absolute left-0 top-full mt-1.5 min-w-full w-max max-w-[min(340px,calc(100vw-32px))] bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] overflow-hidden animate-fade-in flex flex-col"
          style={{ maxHeight: '320px' }}
        >
          {/* Search Input Filter */}
          <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="Type to filter..."
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-400 transition"
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            role="listbox"
            className="flex-1 overflow-y-auto max-h-56 divide-y divide-gray-50 custom-scrollbar"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-center text-xs text-gray-400 font-medium">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    data-select-item
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between min-h-[44px] ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : isHighlighted
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <span className="text-primary-600 font-bold ml-2 text-xs">✓</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
