import { Question } from '../types';

/**
 * Checks whether a question is mandatory (required).
 * 
 * Backward compatibility:
 * 1. If explicit `is_required` or `customization.required` is stored (boolean or 1/0), respect it.
 * 2. If neither is explicitly present (legacy questions in DB):
 *    - Rating questions (smiley, star, scale, yes_no) were historically mandatory.
 *    - Non-rating questions (text, choice, dropdown) were historically optional.
 */
export function isQuestionRequired(q: Question | any): boolean {
  if (!q) return false;

  // 1. Check top-level is_required column/prop
  if (q.is_required !== undefined && q.is_required !== null) {
    return Number(q.is_required) === 1 || q.is_required === true;
  }

  // 2. Check customization.required
  const cust = typeof q.customization === 'string'
    ? (() => { try { return JSON.parse(q.customization); } catch { return null; } })()
    : q.customization;

  if (cust?.required !== undefined && cust?.required !== null) {
    return Boolean(cust.required);
  }

  // 3. Legacy behavior: rating types were mandatory; non-rating were optional
  const type = q.response_type || q.type || 'smiley_faces';
  const isRating = !type || type === 'smiley_faces' || type === 'star_rating' || type === 'scale' || type === 'numeric_scale' || type === 'thumbs' || type === 'yes_no';
  const isRemark = Boolean(cust?.is_remark);

  if (isRating && !isRemark) {
    return true; // Legacy rating question default
  }

  return false;
}

/**
 * Checks if a question has been answered according to its response type.
 * - rating/yes-no/scale/choice-single/dropdown-single: need a selection
 * - multi-select: needs at least one selection
 * - text / remark: needs a non-empty trimmed value
 */
export function isQuestionAnswered(q: Question | any, val: any): boolean {
  if (val === undefined || val === null) return false;

  const type = q.response_type || q.type || 'smiley_faces';
  const cust = typeof q.customization === 'string'
    ? (() => { try { return JSON.parse(q.customization); } catch { return null; } })()
    : q.customization;
  const isRemark = Boolean(cust?.is_remark);

  // Text questions or remarks: must have non-empty trimmed text
  if (type === 'short_answer' || type === 'long_answer' || type === 'short_text' || type === 'long_text' || isRemark) {
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'object' && val !== null && typeof val.answer === 'string') {
      return val.answer.trim().length > 0;
    }
    return String(val).trim().length > 0;
  }

  // Multi-select choices: must have at least one selection
  if (type === 'choice_multi' || type === 'choice_multiple' || type === 'dropdown_multi') {
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return val.trim().length > 0;
      }
    }
    return false;
  }

  // Single choice / dropdown / rating:
  if (typeof val === 'object' && val !== null) {
    if (val.answer === '__other__') {
      return Boolean(val.other_text && val.other_text.trim().length > 0);
    }
    return val.answer !== undefined && val.answer !== null && String(val.answer).trim() !== '';
  }

  return String(val).trim() !== '';
}
