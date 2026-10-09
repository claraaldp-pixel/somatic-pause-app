import posthog from 'posthog-js';

const enabled = () => posthog.__loaded;

export const analytics = {
  sessionStarted:    (survivalState, trigger) =>
    enabled() && posthog.capture('session_started', { survival_state: survivalState, trigger }),
  sessionCompleted:  (survivalState, preScore, postScore, exercisesCount) =>
    enabled() && posthog.capture('session_completed', {
      survival_state: survivalState,
      pre_score: preScore,
      post_score: postScore,
      score_delta: postScore - preScore,
      exercises_count: exercisesCount,
    }),
  pageViewed:        (page) => enabled() && posthog.capture('$pageview', { page }),
};
