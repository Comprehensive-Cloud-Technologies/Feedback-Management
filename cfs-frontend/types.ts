
export type RatingLevel = 1 | 2 | 3 | 4; // 1: Poor, 2: Needs Improvement, 3: Average, 4: Good

export interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
  id?: string;
}

export interface MealSlot {
  category: string;
  startTime: string;
  endTime: string;
}

export interface Canteen {
  id?: number;
  name: string;
  site: string;
  meal_slots?: MealSlot[];
}

export interface RatingOption {
  level: RatingLevel;
  label: string;
  emoji: string;
  color: string;
}

export type CustomFieldType = 'text' | 'dropdown_single' | 'dropdown_multi';

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: CustomFieldType;
  options?: string[];
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  order: number;
}

export type ThemeId = 'default' | 'sunny_split' | 'navy_split' | 'midnight_dark' | 'chalkboard_menu' | 'white_theme';

export interface ThemeCustomTexts {
  title?: string;
  subtitle?: string;
  badge_text?: string;
  submit_text?: string;
  heading?: string;
  subheading?: string;
}

export interface ResolvedThemeTexts {
  title: string;
  subtitle: string;
  badge_text: string;
  submit_text: string;
  heading?: string;
  subheading?: string;
}

export interface FormSettings {
  enable_fullscreen: number | boolean;
  collect_user_info: number | boolean;
  field_name: number | boolean;
  field_department: number | boolean;
  field_suggestion: number | boolean;
  field_meal_slot: number | boolean;
  field_employee_id: number | boolean;
  custom_fields?: CustomFieldDefinition[];
  theme_id?: ThemeId;
  theme_custom_texts?: ThemeCustomTexts | null;
  bg_image_enabled?: number | boolean;
  bg_image_data?: string | null;
}

export type QuestionResponseType =
  | 'smiley_faces'
  | 'star_rating'
  | 'scale'
  | 'yes_no'
  | 'short_answer'
  | 'long_answer'
  | 'dropdown_single'
  | 'dropdown_multi'
  | 'choice_single'
  | 'choice_multi';

export interface SmileyCustomization {
  type: 'smiley_faces';
  options: { value: number; label: string; emoji: string; color: string }[];
}

export interface StarCustomization {
  type: 'star_rating';
  numberOfStars?: number;
  options?: { value: number; label: string }[];
}

export interface ScaleCustomization {
  type: 'scale';
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  symbol?: string;
}

export interface YesNoCustomization {
  type: 'yes_no';
  yesLabel?: string;
  noLabel?: string;
  yesColor?: string;
  noColor?: string;
  visualStyle?: string;
}

export interface TextCustomization {
  type: 'short_answer' | 'long_answer';
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  required?: boolean;
  is_remark?: boolean;
}

export interface DropdownCustomization {
  type: 'dropdown_single' | 'dropdown_multi';
  placeholder?: string;
  options: string[];
  required?: boolean;
}

export interface ChoiceCustomization {
  type: 'choice_single' | 'choice_multi';
  options: string[];
  allowOther?: boolean;
  required?: boolean;
}

export type QuestionCustomization =
  | SmileyCustomization
  | StarCustomization
  | ScaleCustomization
  | YesNoCustomization
  | TextCustomization
  | DropdownCustomization
  | ChoiceCustomization
  | Record<string, unknown>;

export interface Question {
  id: number;
  site: string;
  question_text: string;
  emoji?: string;
  text?: string; // Keep for backward compatibility
  branch_id?: number;
  response_type?: QuestionResponseType;
  customization?: QuestionCustomization & { is_remark?: boolean };
  is_remark?: boolean;
}

export interface FeedbackResponse {
  questionId: number;
  rating?: number | null; // Numeric rating for rating questions, null/undefined for text/choice
  question_text?: string;
  emoji?: string;
  rating_label?: string;
  response_type?: QuestionResponseType;
  answer?: string | string[]; // For non-rating questions (text, choice, dropdown)
  other_text?: string;        // Populated when "Other (please specify)" is used
  is_remark?: boolean;
}

export interface FeedbackSubmission {
  id: string;
  timestamp: number;
  site: string;
  canteen: string;
  name?: string;
  username?: string;
  user_name?: string;
  user_employee_id?: string;
  user_department?: string;
  user_suggestion?: string;
  selected_meal_slot?: string;
  meal_category?: string;
  responses: FeedbackResponse[];
  custom_field_values?: Record<string, string | string[]>;
}
