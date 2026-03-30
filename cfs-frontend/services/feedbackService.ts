
import { FeedbackSubmission, FeedbackResponse, RatingLevel } from '../types';

const FEEDBACK_KEY = 'canteenFeedback';

export const feedbackService = {
  getFeedback: (): FeedbackSubmission[] => {
    try {
      const data = localStorage.getItem(FEEDBACK_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Failed to retrieve feedback from localStorage", error);
    }
    return [];
  },

  addFeedback: (site: string, canteen: string, responses: FeedbackResponse[], name?: string): FeedbackSubmission => {
    const submissions = feedbackService.getFeedback();
    const newSubmission: FeedbackSubmission = {
      id: new Date().toISOString() + Math.random().toString(36).substring(2),
      timestamp: Date.now(),
      site,
      canteen,
      name,
      responses,
    };
    submissions.push(newSubmission);
    try {
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(submissions));
    } catch (error) {
      console.error("Failed to save feedback to localStorage", error);
    }
    return newSubmission;
  },

  // For demonstration purposes, let's add some mock data if there is none.
  ensureMockData: () => {
    if (feedbackService.getFeedback().length === 0) {
      const mockSubmissions: FeedbackSubmission[] = [];
      const today = new Date();
    const SITES = ['Site A', 'Site B', 'Site C', 'Site D', 'Site E'];
    for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const numFeedbacks = Math.floor(Math.random() * 5) + 1; // 1 to 5 feedbacks per day
    for (let j = 0; j < numFeedbacks; j++) {
      mockSubmissions.push({
        id: `mock-${i}-${j}`,
        timestamp: date.getTime(),
        site: SITES[Math.floor(Math.random() * SITES.length)],
        canteen: `Canteen ${Math.floor(Math.random() * 5) + 1}`,
        responses: [
          { questionId: 1, rating: (Math.floor(Math.random() * 4) + 1) as RatingLevel },
          { questionId: 2, rating: (Math.floor(Math.random() * 4) + 1) as RatingLevel },
          { questionId: 3, rating: (Math.floor(Math.random() * 4) + 1) as RatingLevel },
          { questionId: 4, rating: (Math.floor(Math.random() * 4) + 1) as RatingLevel },
          { questionId: 5, rating: (Math.floor(Math.random() * 4) + 1) as RatingLevel },
        ]
      });
    }
    }
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(mockSubmissions));
    }
  }
};

// Initialize with some mock data for better demonstration
feedbackService.ensureMockData();
