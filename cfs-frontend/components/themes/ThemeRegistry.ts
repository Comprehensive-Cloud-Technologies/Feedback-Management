import React from 'react';
import { ThemeId, ThemeCustomTexts, ResolvedThemeTexts } from '../../types';
import { ThemeDefinition, ThemeLayoutProps } from './types';
import DefaultThemeLayout from './DefaultThemeLayout';
import SunnySplitThemeLayout from './SunnySplitThemeLayout';
import NavySplitThemeLayout from './NavySplitThemeLayout';
import MidnightDarkThemeLayout from './MidnightDarkThemeLayout';
import ChalkboardThemeLayout from './ChalkboardThemeLayout';

export const THEME_LIST: ThemeDefinition[] = [
  {
    id: 'default',
    name: 'Default Clean',
    tagline: 'Standard production layout',
    description: 'Clean white top bar with centered title, rounded cards, and familiar responsive design.',
    badge: 'Standard',
    accentColor: '#3b82f6',
    thumbnailClass: 'bg-white border-blue-500',
    defaultTexts: {
      title: 'We value your feedback!',
      subtitle: 'Help us improve your dining experience.',
      badge_text: '',
      submit_text: 'Submit Feedback',
    },
  },
  {
    id: 'sunny_split',
    name: 'Sunny Split',
    tagline: 'Warm amber 2-column layout',
    description: 'Solid amber information panel on the left with cream inputs, and round emoji rating buttons on the right.',
    badge: 'Popular',
    accentColor: '#f59e0b',
    thumbnailClass: 'bg-gradient-to-r from-amber-400 to-amber-500 border-amber-600',
    defaultTexts: {
      title: 'How did we do?',
      subtitle: 'Tap a face to rate your dining experience today',
      badge_text: 'Information:',
      submit_text: 'Submit Feedback',
    },
  },
  {
    id: 'navy_split',
    name: 'Navy Split',
    tagline: 'Executive deep navy presentation',
    description: 'Deep navy brand panel on the left and horizontal question rows with emerald selection highlights.',
    badge: 'Corporate',
    accentColor: '#0b1528',
    thumbnailClass: 'bg-[#0b1528] border-cyan-400',
    defaultTexts: {
      title: 'Dining Feedback',
      subtitle: 'Help us maintain quality across all meals.',
      badge_text: 'CATALYST FEEDBACK',
      submit_text: 'Submit Feedback',
    },
  },
  {
    id: 'midnight_dark',
    name: 'Midnight Dark',
    tagline: 'Sleek dark mode with neon glow',
    description: 'Full dark navy canvas with glowing emerald selection tiles, dark inputs, and vibrant cyan submit button.',
    badge: 'Modern',
    accentColor: '#06b6d4',
    thumbnailClass: 'bg-[#0a0f1d] border-emerald-400',
    defaultTexts: {
      title: 'Dining Experience',
      subtitle: 'Rate each service',
      badge_text: 'LIVE FEEDBACK',
      submit_text: 'Submit Feedback',
    },
  },
  {
    id: 'chalkboard_menu',
    name: 'Chalkboard Menu',
    tagline: 'Rustic cafe chalkboard in wood frame',
    description: 'Deep green blackboard slate framed in wood, serif headings, dotted menu leader lines, and cream buttons.',
    badge: 'Artisan',
    accentColor: '#10b981',
    thumbnailClass: 'bg-[#14231a] border-[#5a381e]',
    defaultTexts: {
      title: "Today's Feedback Menu",
      subtitle: 'Freshly prepared daily',
      badge_text: '★ CATALYST ★',
      submit_text: 'Place Feedback Order',
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'default';

export const getThemeDefinition = (themeId?: string): ThemeDefinition => {
  const found = THEME_LIST.find(t => t.id === themeId);
  return found || THEME_LIST[0];
};

export const resolveThemeTexts = (
  themeId?: string,
  customTexts?: ThemeCustomTexts | null
): ResolvedThemeTexts => {
  const def = getThemeDefinition(themeId);
  return {
    title: (customTexts?.title?.trim()) || def.defaultTexts.title,
    subtitle: (customTexts?.subtitle?.trim()) || def.defaultTexts.subtitle,
    badge_text: (customTexts?.badge_text?.trim()) || def.defaultTexts.badge_text,
    submit_text: (customTexts?.submit_text?.trim()) || def.defaultTexts.submit_text,
  };
};

export const getThemeLayout = (themeId?: string): React.FC<ThemeLayoutProps> => {
  switch (themeId) {
    case 'sunny_split':
      return SunnySplitThemeLayout;
    case 'navy_split':
      return NavySplitThemeLayout;
    case 'midnight_dark':
      return MidnightDarkThemeLayout;
    case 'chalkboard_menu':
      return ChalkboardThemeLayout;
    case 'default':
    default:
      return DefaultThemeLayout;
  }
};
