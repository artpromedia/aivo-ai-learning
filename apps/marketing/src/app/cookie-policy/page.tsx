"use client";
import { LegalPageLayout } from "@/components/marketing/legal/LegalPageLayout";

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      badge="Legal"
      title="Cookie Policy"
      subtitle="Cookies are small files we use to keep AIVO working, remember your preferences, and understand how the platform is used. This page explains what we use and the choices you have."
      icon="🍪"
      accentColor="#ea580c"
      lastUpdated="December 15, 2026"
      contactEmail="privacy@aivo.education"
      sections={[
        {
          title: "What Are Cookies?",
          content: [
            "A \"cookie\" is a small text file that a website stores on your device. Cookies let a site remember things between visits — for example, that you are signed in or that you prefer a certain language. Similar technologies — like local storage, session storage, and small tracking pixels — work in much the same way, and we treat them all together as \"cookies\" in this policy.",
            "Cookies do not run programs on your device or harm your computer. They simply hold information that the Services can read and update.",
          ],
        },
        {
          title: "How AIVO Uses Cookies",
          content: "We use cookies for a small number of clearly defined purposes. We group them into four categories:",
          list: [
            "Strictly necessary — required for the Services to work, including authentication, session security, load balancing, and saving cookie-preference choices. These cannot be turned off.",
            "Functional — remember your preferences such as language, accessibility settings, and learner profile selection so you don't have to re-enter them every visit.",
            "Performance and analytics — help us understand how the Services are used in aggregate so we can fix bugs and improve learning experiences. Analytics on learner-facing pages is configured to limit data collection and to avoid third-party advertising trackers.",
            "Marketing — used only on adult-facing pages of aivolearning.com (such as the home page or pricing page) to measure the effectiveness of our outreach. We do not run third-party advertising trackers on learner pages or on pages directed at children.",
          ],
        },
        {
          title: "Cookies on Learner Pages",
          content: "Pages that are directed to learners — including children under 13 — only use strictly necessary and functional cookies. We do not place advertising cookies, behavioral targeting cookies, or third-party analytics for marketing on those pages. This is consistent with our COPPA commitments.",
        },
        {
          title: "Third-Party Cookies",
          content: "A small number of cookies are set by trusted third parties that support the Services — for example, our payment processor on checkout pages, our error-monitoring tool, and our enterprise analytics provider. These third parties may use cookies only for the limited purposes they perform on our behalf, under contracts that prohibit them from using the data for their own marketing.",
        },
        {
          title: "Your Choices",
          content: "You are in control of optional cookies:",
          list: [
            "Cookie banner — when you first visit AIVO you will see a banner that lets you accept all cookies, reject all non-essential cookies, or open settings to choose by category.",
            "Cookie settings — you can change your choices at any time from the \"Cookie preferences\" link in the footer of the site.",
            "Browser controls — most browsers let you block or delete cookies entirely. Doing so may break parts of the Services that depend on strictly necessary cookies (for example, signing in).",
            "Do Not Track and Global Privacy Control — we honor recognized opt-out signals such as Global Privacy Control on adult-facing marketing pages where required by law.",
          ],
        },
        {
          title: "How Long Cookies Last",
          content: "Cookies are either \"session\" cookies, which are deleted when you close your browser, or \"persistent\" cookies, which last for a defined period (commonly between 30 days and 12 months) or until you delete them. Strictly necessary security cookies expire quickly to protect your account; preference cookies are kept longer so your settings stay put.",
        },
        {
          title: "Changes to This Cookie Policy",
          content: "We may update this Cookie Policy as our use of cookies changes. If we make material changes — for example, adding a new category of cookie — we will update this page and, where appropriate, ask for your choices again through the cookie banner.",
        },
        {
          title: "Contact Us",
          content: "If you have questions about how AIVO uses cookies, please email privacy@aivo.education. For questions about cookies in a school or district deployment, write to compliance@aivo.education.",
        },
      ]}
    />
  );
}
