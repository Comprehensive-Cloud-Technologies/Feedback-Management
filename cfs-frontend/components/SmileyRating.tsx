import React from 'react';
import { RATINGS } from '../constants';
import { RatingLevel } from '../types';
import RatingFace from './RatingFace';

interface SmileyRatingProps {
  selectedValue?: RatingLevel;
  onChange: (level: RatingLevel) => void;
  size?: number;
}

const SmileyRating: React.FC<SmileyRatingProps & { questionCount?: number }> = ({ selectedValue, onChange, size = 100, questionCount = 3 }) => {
  // Dynamic sizing based on question count
  const adjustedSize = questionCount <= 3 ? size : questionCount <= 5 ? size * 0.8 : size * 0.6;
  const gapSize = questionCount <= 3 ? '2em' : questionCount <= 5 ? '1.2em' : '1em';
  const fontSize = questionCount <= 3 ? 'text-xs' : 'text-[10px]';
  return (
    <div
      className="flex flex-row items-center justify-center w-full"
      style={{ gap: gapSize, flexWrap: 'nowrap', overflow: 'visible', minWidth: 0 }}
    >
      {RATINGS.map(({ level, label, color }) => (
        <div key={level} className="flex flex-col items-center justify-center" style={{ minWidth: `${adjustedSize}px` }}>
          <button
            type="button"
            onClick={() => onChange(level)}
            className="transition-all duration-300 focus:outline-none transform"
            style={{
              width: `${adjustedSize}px`,
              height: `${adjustedSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              filter: selectedValue && selectedValue !== level ? 'grayscale(100%)' : 'none',
              opacity: selectedValue && selectedValue !== level ? 0.6 : 1,
              transform: selectedValue === level ? 'scale(1.3)' : (selectedValue ? 'scale(0.8)' : 'scale(1)'),
              cursor: 'pointer',
              zIndex: selectedValue === level ? 10 : 1
            }}
          >
            <RatingFace level={level} size={adjustedSize * 1.0} />
          </button>
          <span
            className={`mt-1 block ${fontSize} font-bold transition-all duration-500 ${color}`}
            style={{
              textAlign: 'center',
              filter: selectedValue && selectedValue !== level ? 'grayscale(100%)' : 'none',
              opacity: selectedValue && selectedValue !== level ? 0.6 : 1,
              transform: selectedValue === level ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SmileyRating;
