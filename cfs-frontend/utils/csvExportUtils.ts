import { isRatingResponse } from './ratingUtils';

export interface CsvQuestionColumn {
  id: string; // Question ID as string
  header: string; // Header title (e.g. Question text + '(Remark)' if remark)
  isRemark: boolean;
  isRating: boolean;
  orderKey: number;
}

export interface CsvColumnDef<T = any> {
  header: string;
  isUserText?: boolean;
  getValue: (row: T) => any;
}

/**
 * Escapes and sanitizes a cell value according to RFC 4180
 * and protects against spreadsheet formula injection for user-provided text.
 */
export function sanitizeCsvCell(val: any, isUserText: boolean = false): string {
  if (val === undefined || val === null) {
    return '""';
  }
  let str = Array.isArray(val) ? val.join('; ') : String(val);

  // Apply spreadsheet formula injection protection ONLY to text-type user-provided values
  if (isUserText && str.length > 0) {
    const firstChar = str.charAt(0);
    if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r') {
      str = `'${str}`;
    }
  }

  // RFC 4180: double quotes inside cell are doubled, whole cell wrapped in double quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Extracts the display value for a question response according to its type.
 */
export function extractResponseValue(
  response: any,
  qObj?: any,
  qMap?: Record<string, any>
): { value: string; isUserText: boolean } {
  if (!response) {
    return { value: '', isUserText: false };
  }

  const isRating = isRatingResponse(response, qMap || (qObj ? { [String(qObj.id)]: qObj } : undefined));

  if (isRating) {
    // Rating response: numeric value
    if (response.rating !== undefined && response.rating !== null && !isNaN(Number(response.rating))) {
      return { value: String(response.rating), isUserText: false };
    }
    return { value: '', isUserText: false };
  }

  // Non-rating response: short/long text, dropdown, choice, remark
  let ans = response.answer;
  if (ans === undefined || ans === null) {
    ans = '';
  } else if (Array.isArray(ans)) {
    ans = ans.map(String).join('; ');
  } else if (typeof ans === 'string' && ans.startsWith('[') && ans.endsWith(']')) {
    try {
      const parsed = JSON.parse(ans);
      if (Array.isArray(parsed)) {
        ans = parsed.map(String).join('; ');
      }
    } catch {
      // keep raw string if json parse fails
    }
  } else {
    ans = String(ans);
  }

  if (response.other_text) {
    ans = ans ? `${ans} (Other: ${response.other_text})` : `Other: ${response.other_text}`;
  }

  return { value: String(ans), isUserText: true };
}

/**
 * Builds an ordered list of question columns for CSV export.
 * - Keyed by question id (distinct column per question id)
 * - Header = question text (+ ' (Remark)' if remark question and header doesn't already contain remark)
 * - Sequence: active questions in configured form sequence (canteen order, then question id order),
 *   followed by historical/deleted questions with answers in feedback (ordered by id).
 */
export function buildOrderedQuestionColumns(
  feedbackList: any[],
  activeQuestions: any[] = [],
  canteensList?: { name: string }[] | string[],
  qMap?: Record<string, any>,
  questionsMap?: Record<string, string>
): CsvQuestionColumn[] {
  const canteenOrderMap = new Map<string, number>();
  if (canteensList) {
    canteensList.forEach((c, idx) => {
      const cName = typeof c === 'string' ? c : c.name;
      if (cName) canteenOrderMap.set(cName, idx);
    });
  }

  const questionCols: CsvQuestionColumn[] = [];
  const seenQIds = new Set<string>();

  // Helper to normalize question
  const processQuestion = (q: any, defaultCanteenOrder: number = 0) => {
    if (!q || !q.id) return;
    const qIdStr = String(q.id);
    if (seenQIds.has(qIdStr)) return;
    seenQIds.add(qIdStr);

    const isRemark = q.customization?.is_remark === true || q.is_remark === true;
    let header = q.question_text || (questionsMap ? questionsMap[qIdStr] : '') || `Question ${qIdStr}`;
    if (isRemark && !header.toLowerCase().includes('(remark)')) {
      header = `${header} (Remark)`;
    }

    const isRating = !isRemark && (!q.response_type || !['short_answer', 'long_answer', 'dropdown_single', 'dropdown_multi', 'choice_single', 'choice_multi'].includes(q.response_type));

    // Sort key: canteen order * 1000000 + numeric id (or index)
    const canteenIdx = q.canteen && canteenOrderMap.has(q.canteen) ? canteenOrderMap.get(q.canteen)! : defaultCanteenOrder;
    const numId = Number(q.id);
    const orderKey = canteenIdx * 1000000 + (isNaN(numId) ? 0 : numId);

    questionCols.push({
      id: qIdStr,
      header,
      isRemark,
      isRating,
      orderKey
    });
  };

  // 1. Process active questions (they define the primary sequence)
  if (Array.isArray(activeQuestions)) {
    const sortedActive = [...activeQuestions].sort((a, b) => {
      const cA = a.canteen && canteenOrderMap.has(a.canteen) ? canteenOrderMap.get(a.canteen)! : 0;
      const cB = b.canteen && canteenOrderMap.has(b.canteen) ? canteenOrderMap.get(b.canteen)! : 0;
      if (cA !== cB) return cA - cB;
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      return idA - idB;
    });

    sortedActive.forEach(q => processQuestion(q));
  }

  // 2. Discover historical/deleted questions present in feedback responses but not in active questions
  const historicalQuestions: { id: string; header: string; isRemark: boolean; isRating: boolean; numId: number }[] = [];
  feedbackList.forEach(fb => {
    const responses = Array.isArray(fb.responses) ? fb.responses : [];
    responses.forEach((r: any) => {
      const qId = String(r.question_id ?? r.questionId ?? '');
      if (!qId || seenQIds.has(qId)) return;
      seenQIds.add(qId);

      const qObj = qMap ? qMap[qId] : undefined;
      const isRemark = r.is_remark === true || qObj?.customization?.is_remark === true || qObj?.is_remark === true;
      let header = r.question_text || qObj?.question_text || (questionsMap ? questionsMap[qId] : '') || `Question ${qId}`;
      if (isRemark && !header.toLowerCase().includes('(remark)')) {
        header = `${header} (Remark)`;
      }
      const isRating = isRatingResponse(r, qMap);
      const numId = Number(qId);

      historicalQuestions.push({
        id: qId,
        header,
        isRemark,
        isRating,
        numId: isNaN(numId) ? 999999 : numId
      });
    });
  });

  // Sort historical questions by id ascending
  historicalQuestions.sort((a, b) => a.numId - b.numId);

  // Append historical questions after active ones
  historicalQuestions.forEach((hq, idx) => {
    questionCols.push({
      id: hq.id,
      header: hq.header,
      isRemark: hq.isRemark,
      isRating: hq.isRating,
      orderKey: 500000000 + idx
    });
  });

  return questionCols;
}

/**
 * Generates an RFC 4180 CSV string with CRLF line endings.
 */
export function generateCsv<T>(
  data: T[],
  columns: { header: string; isUserText?: boolean; getValue: (item: T) => any }[]
): string {
  const headerLine = columns.map(c => sanitizeCsvCell(c.header, false)).join(',');
  const rowLines = data.map(item => {
    return columns.map(c => {
      const val = c.getValue(item);
      return sanitizeCsvCell(val, c.isUserText ?? false);
    }).join(',');
  });

  return [headerLine, ...rowLines].join('\r\n') + '\r\n';
}

/**
 * Triggers a browser download of a CSV file using Blob and UTF-8 BOM.
 */
export function downloadCsv(filename: string, csvString: string): void {
  // Prepend UTF-8 BOM for Microsoft Excel compatibility
  const blob = new Blob(['\uFEFF', csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}
