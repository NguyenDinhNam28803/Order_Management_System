// Central feature flags for the frontend.
//
// AI feature is temporarily paused. To re-enable the whole AI surface
// (floating assistant, PR AI chat, RAG supplier suggestions, admin RAG sync,
// AI report page) flip AI_ENABLED back to `true`. No other change needed.
export const FEATURES = {
  AI_ENABLED: false,
} as const;

// Shown on hover over any disabled AI entry point.
export const AI_DISABLED_MESSAGE = "Tính năng AI đang trong quá trình phát triển";
