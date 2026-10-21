import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  debounceMs = 250,
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onChange, value]);

  const handleClear = () => {
    setInternalValue('');
    onChange('');
  };

  return (
    <div className={`relative flex items-center w-full sm:w-auto ${className}`}>
      <span className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center justify-center">
        <FaSearch size={14} />
      </span>
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full sm:w-64 pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition flex items-center justify-center"
          title="Clear search"
          aria-label="Clear search"
        >
          <FaTimes size={12} />
        </button>
      )}
    </div>
  );
};

export const matchesSearch = (query: string, fields: (string | number | null | undefined)[]) => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  return fields.some((field) => {
    if (field === null || field === undefined) return false;
    return String(field).toLowerCase().includes(trimmed);
  });
};
