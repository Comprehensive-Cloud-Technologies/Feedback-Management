import React from 'react';

interface ThemeLogoBadgeProps {
  branchLogo: string;
  fallbackLogo: string;
  alt?: string;
  className?: string;
  contrastChip?: boolean;
}

export const ThemeLogoBadge: React.FC<ThemeLogoBadgeProps> = ({
  branchLogo,
  fallbackLogo,
  alt = 'Site Logo',
  className = 'h-10 sm:h-12 md:h-14 w-auto object-contain max-w-[80px] sm:max-w-[110px] md:max-w-[140px]',
  contrastChip = false,
}) => {
  const logoSrc = branchLogo || fallbackLogo;

  if (contrastChip && branchLogo) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 shadow-sm flex items-center justify-center border border-white/40 flex-shrink-0">
        <img
          src={logoSrc}
          alt={alt}
          className={`${className} flex-shrink-0`}
        />
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={`${className} flex-shrink-0`}
    />
  );
};

export default ThemeLogoBadge;
