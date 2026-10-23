import { Question, FeedbackResponse } from '../types';

/**
 * Response types that are NOT ratings.
 * Answers to these types are textual or choice selections, not numerical scores.
 */
export const NON_RATING_RESPONSE_TYPES = new Set<string>([
  'short_answer',
  'long_answer',
  'dropdown_single',
  'dropdown_multi',
  'choice_single',
  'choice_multi'
]);

/**
 * Standard rating response types.
 */
export const RATING_RESPONSE_TYPES = new Set<string>([
  'smiley_faces',
  'star_rating',
  'scale',
  'yes_no'
]);

export interface QuestionLike {
  id?: number | string;
  question_id?: number | string;
  response_type?: string;
  customization?: any;
  is_remark?: boolean;
}

export interface ResponseLike {
  questionId?: number | string;
  question_id?: number | string;
  rating?: number | null | string;
  response_type?: string;
  is_remark?: boolean;
  [key: string]: any;
}

/**
 * Determines whether a question is a rating question.
 * A question is a rating question if:
 * 1. It is NOT flagged as a remark (customization.is_remark or q.is_remark is not true)
 * 2. Its response_type is not in NON_RATING_RESPONSE_TYPES
 * (defaults to true if response_type is unset or smiley_faces)
 */
export function isRatingQuestion(q?: QuestionLike | null): boolean {
  if (!q) return false;
  // If flagged as a remark question, it is not a rating question
  if (q.customization?.is_remark === true || (q as any).is_remark === true) {
    return false;
  }
  const type = q.response_type;
  if (!type) return true; // Default fallback is smiley_faces rating
  if (NON_RATING_RESPONSE_TYPES.has(type)) return false;
  return RATING_RESPONSE_TYPES.has(type);
}

/**
 * Determines whether a response represents a valid numeric rating.
 * Returns false if:
 * - The response has is_remark === true
 * - The associated question or response has a non-rating response_type
 * - The rating is null, undefined, blank string, NaN, or non-finite
 * - The numeric rating is less than 1
 */
export function isRatingResponse(
  r: ResponseLike | null | undefined,
  qOrMap?: QuestionLike | Record<string, QuestionLike> | null
): boolean {
  if (!r) return false;
  if (r.is_remark === true) return false;

  const qId = String(r.question_id ?? r.questionId ?? '');
  let qObj: QuestionLike | null = null;
  if (qOrMap) {
    if ('id' in qOrMap || 'question_text' in qOrMap || 'customization' in qOrMap || 'response_type' in qOrMap) {
      qObj = qOrMap as QuestionLike;
    } else {
      qObj = (qOrMap as Record<string, QuestionLike>)[qId] || null;
    }
  }

  // Check remark on associated question
  if (qObj?.customization?.is_remark === true || (qObj as any)?.is_remark === true) {
    return false;
  }

  // Check response type
  const type = r.response_type || qObj?.response_type;
  if (type && NON_RATING_RESPONSE_TYPES.has(type)) {
    return false;
  }

  // Check numeric rating validity
  if (r.rating === undefined || r.rating === null || r.rating === '') {
    return false;
  }

  const num = Number(r.rating);
  return Number.isFinite(num) && num >= 1;
}

/**
 * Calculates the arithmetic mean rating for a collection of responses.
 * Only valid rating responses are considered.
 * Returns null if no valid rating responses exist (NEVER NaN, NEVER Infinity, NEVER 0.0 when unrated).
 */
export function calculateAverageRating(
  responses: ResponseLike[] | null | undefined,
  qMap?: Record<string, QuestionLike>
): number | null {
  if (!Array.isArray(responses) || responses.length === 0) {
    return null;
  }

  const ratingResponses = responses.filter(r => isRatingResponse(r, qMap));
  if (ratingResponses.length === 0) {
    return null;
  }

  const sum = ratingResponses.reduce((acc, r) => acc + Number(r.rating), 0);
  const avg = sum / ratingResponses.length;
  return Number.isFinite(avg) ? avg : null;
}

/**
 * Formats a numeric average rating to a fixed number of decimals,
 * or returns '-' if null or undefined.
 */
export function formatAverageRating(
  avg: number | null | undefined,
  decimals: number = 1
): string {
  if (avg === null || avg === undefined || !Number.isFinite(avg)) {
    return '-';
  }
  return avg.toFixed(decimals);
}
