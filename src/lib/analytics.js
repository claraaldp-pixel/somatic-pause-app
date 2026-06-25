import posthog from 'posthog-js';

const enabled = () => posthog.__loaded;

export const analytics = {
  paywallViewed:     () => enabled() && posthog.capture('paywall_viewed'),
  checkoutStarted:   () => enabled() && posthog.capture('checkout_started'),
  checkoutCompleted: () => enabled() && posthog.capture('checkout_completed'),
  sessionStarted:    (survivalState, trigger) =>
    enabled() && posthog.capture('session_started', { survival_state: survivalState, trigger }),
  sessionCompleted:  (survivalState, preScore, postScore, exercisesCount) => {
    console.log('[analytics] sessionCompleted called', { survivalState, preScore, postScore, exercisesCount, enabled: enabled() });
    return enabled() && posthog.capture('session_completed', {
      survival_state: survivalState,
      pre_score: preScore,
      post_score: postScore,
      score_delta: postScore - preScore,
      exercises_count: exercisesCount,
    });
  },
  pageViewed:        (page) => enabled() && posthog.capture('$pageview', { page }),
};
