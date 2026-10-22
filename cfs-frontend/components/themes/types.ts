import React from 'react';
import { ThemeId, ResolvedThemeTexts, FormSettings, FeedbackResponse } from '../../types';

export interface ThemeLayoutProps {
  // Brand & identity
  catalystLogo: string;
  branchLogo: string;
  site: string;
  canteen: string;

  // Custom texts
  texts: ResolvedThemeTexts;

  // Questions and responses
  questions: Array<{
    id: number;
    question_text?: string;
    text?: string;
    response_type?: string;
    customization?: any;
  }>;
  ratings: Record<number, any>;
  onRatingChange: (questionId: number, level: any) => void;
  isRatingType: (type?: string) => boolean;

  // Fullscreen
  enableFullscreen: boolean;
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  // User Info & Custom Fields
  formSettings: FormSettings;
  userName: string;
  setUserName: (v: string) => void;
  userEmployeeId: string;
  setUserEmployeeId: (v: string) => void;
  userDepartment: string;
  setUserDepartment: (v: string) => void;
  userSuggestion: string;
  setUserSuggestion: (v: string) => void;
  selectedMealSlot: string;
  setSelectedMealSlot: (v: string) => void;
  mealSlots: Array<{ category: string; startTime: string; endTime: string }>;
  customFieldValues: Record<string, any>;
  setCustomFieldValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;

  // Warnings & Submission
  validationWarning: string;
  isSubmitting: boolean;
  isAllRatingsAnswered: boolean;
  onSubmit: (e: React.FormEvent) => void;

  // Logout (optional)
  onLogout?: () => void;

  // Preview Mode Flag (when rendered inside Step 4 preview)
  isPreview?: boolean;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  accentColor: string;
  thumbnailClass: string;
  defaultTexts: ResolvedThemeTexts;
  isLegacy?: boolean;
}
