
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

export interface Question {
  id: number;
  site: string;
  question_text: string;
  emoji?: string;
  text?: string; // Keep for backward compatibility
}

export interface FeedbackResponse {
  questionId: number;
  rating: RatingLevel;
  question_text?: string;
  emoji?: string;
}

export interface FeedbackSubmission {
  id: string;
  timestamp: number;
  site: string;
  canteen: string;
  name?: string;
  username?: string;
  meal_category?: string;
  responses: FeedbackResponse[];
}
