import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getEndpoints } from '../constants';
import { RatingLevel, FeedbackResponse } from '../types';
import SmileyRating from './SmileyRating';
import { CustomQuestionRenderer } from './CustomQuestionRenderer';
import catalystLogo from '../src/images/clogo.png';
import jabilLogo from '../src/images/jabil.png';

interface FeedbackFormProps {
  jwt?: string | null;
  site?: string;
  onLogout?: () => void;
}

interface Question {
  id: number;
  question_text?: string;
  text?: string;
  response_type?: string;
  customization?: any;
}


const FeedbackForm: React.FC<FeedbackFormProps> = ({ jwt, site: propSite, onLogout }) => {
  const [ratings, setRatings] = useState<Record<number, RatingLevel | number | string | undefined>>({});
  const [questions, setQuestions] = useState<Question[]>([]);

  const location = useLocation();
  const getSiteFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get('site') || '';
  };
  const getCanteenFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get('canteen') || '';
  };
  const initialSite = propSite || getSiteFromQuery();
  const initialCanteen = getCanteenFromQuery();
  const [site, setSite] = useState<string>(initialSite);
  const [sites, setSites] = useState<string[]>([]);

  const isJabilSite = (site || initialSite || '').toLowerCase().includes('jabil');

  const [userInfo] = useState<{ site: string; username: string; id?: number }>(() => {
    try {
      const auth = localStorage.getItem('canteenUserAuth');
      const jwtToken = localStorage.getItem('canteenUserJWT');
      if (auth && jwtToken) {
        const payload = JSON.parse(atob(jwtToken.split('.')[1]));
        return { ...JSON.parse(auth), id: payload.userId };
      }
      if (auth) return JSON.parse(auth);
    } catch { }
    return { site: '', username: '' };
  });

  const [canteen, setCanteen] = useState<string>(initialCanteen);
  const [canteens, setCanteens] = useState<string[]>([]);
  const [branchLogo, setBranchLogo] = useState<string>('');
  const endpoints = getEndpoints();

  // React to URL changes (Deep Linking Fix)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newSite = params.get('site');
    const newCanteen = params.get('canteen');

    if (newSite && newSite !== site) {
      setSite(newSite);
      // Reset canteen if site changes, unless newCanteen is provided
      if (!newCanteen) setCanteen('');
    }
    if (newCanteen && newCanteen !== canteen) {
      setCanteen(newCanteen);
    }
  }, [location.search]);


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [username, setUsername] = useState(userInfo.username || '');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    fetch(endpoints.SITES)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.sites)) {
          setSites(data.sites.map((s: any) => s.location));
        } else {
          setSites([]);
        }
      })
      .catch(() => setSites([]));
  }, []);

  useEffect(() => {
    if (!site) return;
    setLoadingDetails(true);

    // Step 1: Fetch Canteens and Branch Admin Info
    Promise.all([
      fetch(`${endpoints.CANTEENS}?site=${encodeURIComponent(site)}`).then(res => res.json()).catch(() => null),
      fetch(`${endpoints.BRANCH_ADMINS_INFO}?site=${encodeURIComponent(site)}`).then(res => res.json()).catch(() => null)
    ]).then(async ([canteenData, branchData]) => {
      console.log('Raw API Response for canteens:', canteenData);
      console.log('Raw API Response for branch:', branchData);

      const canteenList = Array.isArray(canteenData?.details) ? canteenData.details : [];
      setCanteens(canteenList.map((c: any) => c.name));

      // Identify the current canteen's ID to filter questions
      const selectedCanteenObj = canteenList.find((c: any) => c.name === canteen);
      const canteenId = selectedCanteenObj?.id;

      // Set branch logo
      if (Array.isArray(branchData) && branchData.length > 0 && branchData[0].logo) {
        setBranchLogo(branchData[0].logo);
      } else if (branchData && branchData.branch_admins && Array.isArray(branchData.branch_admins) && branchData.branch_admins.length > 0 && branchData.branch_admins[0].logo) {
        setBranchLogo(branchData.branch_admins[0].logo);
      } else if (branchData && branchData.logo) {
        setBranchLogo(branchData.logo);
      } else {
        setBranchLogo('');
      }

      // Step 2: Fetch Questions for the specific canteen if ID is found
      let questionUrl = `${endpoints.QUESTIONS}?site=${encodeURIComponent(site)}`;
      if (canteenId) {
        questionUrl += `&branch_id=${canteenId}`;
      }

      const questionRes = await fetch(questionUrl).catch(() => null);
      const questionData = questionRes ? await questionRes.json().catch(() => null) : null;
      console.log('Raw API Response for questions (filtered):', questionData);

      if (Array.isArray(questionData?.questions)) {
        const processedQuestions = questionData.questions.map(q => {
          // Parse customization if it's a JSON string
          let customization = q.customization;
          if (typeof customization === 'string') {
            try {
              customization = JSON.parse(customization);
            } catch (e) {
              console.warn('Failed to parse customization:', customization);
              customization = null;
            }
          }

          // Ensure response_type has a value
          const responseType = q.response_type || q.type || 'smiley_faces';

          const processedQuestion = {
            id: q.id,
            question_text: q.question_text ?? q.text,
            response_type: responseType,
            customization: customization
          };

          console.log(`Question ${q.id}:`, {
            question_text: processedQuestion.question_text,
            response_type: responseType,
            has_customization: !!customization,
            customization_type: customization?.type,
            raw_customization: q.customization
          });

          return processedQuestion;
        });
        setQuestions(processedQuestions);
        console.log('All processed questions:', processedQuestions);
      } else {
        setQuestions([]);
      }
      setLoadingDetails(false);
    });
  }, [site, canteen]); // Depend on canteen name to re-fetch when it changes



  const handleRatingChange = (questionId: number, level: RatingLevel) => {
    setRatings(prev => ({ ...prev, [questionId]: level }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site || !canteen) return;

    if (Object.keys(ratings).length !== questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    const responses: FeedbackResponse[] = questions.map(q => ({
      questionId: q.id,
      rating: ratings[q.id]!,
      question_text: q.question_text || q.text || 'Unknown Question',
      emoji: '😐' // Default emoji since we removed dynamic ones from question object. Or if we have them, use q.emoji
    }));

    console.log('Submitting feedback:', { site, canteen, responses, userId: userInfo.id, username });

    try {
      const res = await fetch(endpoints.SUBMIT_FEEDBACK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        },
        body: JSON.stringify({ site, canteen, responses, userId: userInfo.id || null, username })
      });

      const responseData = await res.json();
      console.log('Submit response status:', res.status);
      console.log('Submit response data:', responseData);

      if (!res.ok) {
        console.error('Failed to submit feedback. Server error:', responseData);
        alert(`Failed to submit feedback: ${responseData.error || 'Unknown error'}`);
      } else {
        setIsSubmitted(true);
        setRatings({});
        // We no longer reset canteen here to allow "Submit Another" to work directly
        setUsername(userInfo.username || '');
        // Automatically reopen the form after 2 seconds
        setTimeout(() => setIsSubmitted(false), 2000);
      }
    } catch (err) {
      console.error('Network error', err);
      alert(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setIsSubmitting(false);
  };



  if (isSubmitted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4 bg-gray-50 overflow-hidden">
        <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl text-center max-w-lg w-full transform animate-scale-up">
          <div className="text-8xl mb-8 animate-bounce">🎉</div>
          <h2 className="text-4xl font-black text-gray-800 mb-2 tracking-tight">Success!</h2>
          <p className="text-gray-500 mb-10 text-xl font-medium">Thank you for your valuable feedback.</p>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full bg-primary-600 text-white font-black text-xl py-5 rounded-2xl hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all active:scale-95"
            >
              Submit Another 📝
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-gray-50 font-sans text-gray-800 overflow-hidden relative">

      {/* Top Left Logout Button */}
      {onLogout && (
        <button
          onClick={onLogout}
          className="absolute top-6 left-6 z-50 text-gray-500 hover:text-red-500 font-semibold flex items-center gap-2 transition-colors px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Logout
        </button>
      )}



      <main className="flex-grow min-h-0 flex flex-col overflow-hidden relative w-full pt-1">
        {/* Header / Logo Area - Standardized & Responsive */}
        <header className="text-center w-full max-w-full py-0.5 flex-shrink-0 bg-white shadow-sm border-b border-gray-100 mb-0.5">
          {/* Header Row - Flex Grid for Perfect Alignment & No Overlaps */}
          <div className="flex items-center justify-between px-3 sm:px-6 max-w-7xl mx-auto h-14 sm:h-16 md:h-20 gap-2">

            {/* Left Column - Catalyst Logo */}
            <div className="flex-shrink-0 w-20 sm:w-28 md:w-40 flex justify-start">
              <img
                src={catalystLogo}
                alt="Catalyst Logo"
                className="h-10 sm:h-14 md:h-16 w-auto object-contain"
              />
            </div>

            {/* Center Column - Text Content */}
            <div className="flex-grow flex flex-col items-center justify-center min-w-0">
              <h1 className="text-sm sm:text-xl md:text-2xl font-black text-gray-900 leading-tight tracking-tight truncate w-full">
                We value your feedback!
              </h1>
              <p className="text-gray-500 text-[8px] sm:text-xs md:text-sm font-medium italic opacity-80 mt-0.5 truncate w-full">
                Help us improve your dining experience.
              </p>
            </div>

            {/* Right Column - Branch Logo + Fullscreen */}
            <div className="flex-shrink-0 flex items-center justify-end gap-1 sm:gap-2">
              <img
                src={branchLogo || catalystLogo}
                alt="Branch Logo"
                className="h-11 sm:h-14 md:h-16 w-auto object-contain max-w-[80px] sm:max-w-[110px] md:max-w-[140px]"
              />
              <button
                onClick={toggleFullscreen}
                className="flex-shrink-0 p-1.5 sm:p-2 bg-white/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-white text-primary-600 transition-all"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {isFullscreen ? (
                    <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" />
                  ) : (
                    <path d="M3 8V3h5M16 3h5v5M3 16v5h5M16 21h5v-5" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Center Questions Area - Flex Grow / Stretch / Scroll Restricted */}
        <div className="flex-grow min-h-0 w-full max-w-4xl mx-auto px-2 sm:px-4 py-0.5 flex flex-col overflow-hidden">
          {site && canteen && questions.length > 0 ? (
            <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
              <div className="flex-grow flex flex-col min-h-0 overflow-hidden px-1 sm:px-2">
                {questions.map((q, idx) => {
                  const questionCount = questions.length;
                  const containerPadding =
                    questionCount <= 2 ? 'p-3 sm:p-4' :
                      questionCount <= 3 ? 'p-1 sm:p-2' :
                        questionCount <= 4 ? 'p-1' : 'p-0.5';

                  const titleSize =
                    questionCount <= 2 ? 'text-2xl sm:text-3xl' :
                      questionCount <= 3 ? 'text-base sm:text-xl md:text-2xl' :
                        questionCount <= 4 ? 'text-sm sm:text-lg md:text-xl' : 'text-sm sm:text-base md:text-lg';

                  return (
                    <div
                      key={q.id}
                      className={`flex-1 min-h-0 bg-white rounded-xl ${containerPadding} shadow-sm border border-gray-100 flex flex-col items-center justify-center transition-all hover:shadow-md hover:border-primary-200 mb-0.5`}
                    >
                      <h3 className={`${titleSize} font-bold text-gray-800 mb-0.5 text-center leading-tight truncate w-full px-2`}>
                        {q.question_text}
                      </h3>

                      <div className="w-full flex justify-center scale-[0.85] sm:scale-100 origin-center transition-transform">
                        <CustomQuestionRenderer
                          question={{
                            ...q,
                            customization: q.customization || {
                              type: 'smiley_faces',
                              options: [
                                { value: 1, label: 'Poor', emoji: '😞', color: '#ef4444' },
                                { value: 2, label: 'Needs Improvement', emoji: '😐', color: '#f97316' },
                                { value: 3, label: 'Average', emoji: '🙂', color: '#eab308' },
                                { value: 4, label: 'Good', emoji: '😀', color: '#22c55e' }
                              ]
                            }
                          } as any}
                          value={ratings[q.id]}
                          onChange={(val) => handleRatingChange(q.id, val)}
                          questionCount={questionCount}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Step 1 & 2: Selection Views (Centered) */
            <div className="flex-grow flex flex-col items-center justify-center space-y-4">
              {!site && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100 max-w-2xl w-full my-4 flex-shrink-0">
                  <label className="block text-lg font-bold text-gray-800 mb-4">Select Location</label>
                  <select
                    value={site}
                    onChange={e => setSite(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-4 focus:ring-primary-500/20 text-base text-gray-700 font-medium appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Choose a location...</option>
                    {sites.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {site && !canteen && (
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 max-w-2xl w-full animate-fade-in relative my-4 flex-shrink-0">
                  <button
                    onClick={() => setSite('')}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
                    title="Back to locations"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                  </button>

                  <h2 className="text-lg font-bold text-gray-800 mb-4">Select Canteen</h2>
                  <select
                    value={canteen}
                    onChange={e => setCanteen(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary-500/20 text-sm text-gray-700 font-medium shadow-sm transition-all hover:shadow-md cursor-pointer appearance-none"
                  >
                    <option value="" disabled>Choose a canteen...</option>
                    {canteens.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {canteens.length === 0 && !loadingDetails && (
                    <p className="text-red-500 text-sm mt-3">No canteens found for this site.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM LAYER: Fixed Footer / Submit Button */}
        {site && canteen && questions.length > 0 && (
          <footer className="p-2 sm:p-3 bg-white border-t border-gray-100 flex-shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] w-full">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(ratings).length !== questions.length}
              className="w-full max-w-xl mx-auto bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base py-2.5 sm:py-4 rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-3 border-white/30 border-t-white rounded-full"></div>
                  Submitting...
                </>
              ) : (
                <>Submit Feedback</>
              )}
            </button>
          </footer>
        )}
      </main>
    </div>
  );
};

export default FeedbackForm;
