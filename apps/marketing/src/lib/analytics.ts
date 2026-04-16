export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, params);
  }
}

export const AnalyticsEvents = {
  CTA_CLICK: "cta_click",
  FORM_SUBMIT: "form_submit",
  PRICING_SELECT: "pricing_select",
  SIGNUP_INITIATE: "signup_initiate",
  DEMO_REQUEST: "demo_request",
  NEWSLETTER_SIGNUP: "newsletter_signup",
  CONTACT_SUBMIT: "contact_submit",
} as const;
