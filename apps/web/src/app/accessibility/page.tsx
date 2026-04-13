"use client";
import { LegalPageLayout } from "@/components/marketing/legal/LegalPageLayout";

export default function AccessibilityPage() {
  return (
    <LegalPageLayout
      badge="Accessibility"
      title="Accessibility Statement"
      subtitle="AIVO Learning is committed to ensuring our platform is accessible to all users, including those with disabilities."
      icon="♿"
      accentColor="#8b5cf6"
      lastUpdated="April 1, 2026"
      contactEmail="accessibility@aivo.education"
      sections={[
        {
          title: "Our Commitment",
          content: [
            "AIVO Learning was built specifically to serve learners with diverse needs, including those with autism, developmental differences, and other disabilities. Accessibility isn't an afterthought — it's at the core of everything we build.",
            "We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and are continuously improving our platform to meet and exceed these standards.",
          ],
        },
        {
          title: "Accessibility Features",
          content: "Our platform includes numerous built-in accessibility features:",
          list: [
            "Full keyboard navigation support across all interactive elements",
            "Screen reader compatibility with ARIA labels and semantic HTML",
            "High contrast mode and customizable color themes",
            "Adjustable text sizes and font choices including dyslexia-friendly options",
            "Reduced motion mode for users sensitive to animations",
            "Sensory profiles that customize visual, audio, and interaction elements per learner",
            "Alternative text for all images and visual content",
            "Captioned and transcribed audio/video content",
          ],
        },
        {
          title: "Sensory Accommodations",
          content: "Uniquely to AIVO, our platform offers deep sensory accommodations:",
          list: [
            "Visual: adjustable brightness, contrast, color temperature, and visual complexity",
            "Auditory: volume controls, sound effect toggles, and text-to-speech options",
            "Interaction: adjustable timing, simplified interfaces, and touch/click accommodation",
            "Content: multiple representation modes (visual, text, audio) for the same content",
            "Each accommodation can be configured per learner and saved to their profile",
          ],
        },
        {
          title: "Functioning Level Support",
          content: "AIVO supports five functioning levels, each designed with specific accessibility considerations:",
          list: [
            "Level 1 (Standard): Full curriculum access with standard accessibility features",
            "Level 2 (Supported): Simplified navigation, additional scaffolding, visual supports",
            "Level 3 (Guided): Step-by-step guidance, reduced cognitive load, larger targets",
            "Level 4 (Intensive): High-contrast visuals, symbol-based communication, simplified interactions",
            "Level 5 (Pre-Symbolic): Cause-and-effect activities, switch access support, sensory-rich content",
          ],
        },
        {
          title: "Assistive Technology Compatibility",
          content: "AIVO is designed to work with a wide range of assistive technologies:",
          list: [
            "Screen readers: JAWS, NVDA, VoiceOver, TalkBack",
            "Switch access devices and alternative input methods",
            "Eye tracking systems",
            "Augmentative and Alternative Communication (AAC) devices",
            "Voice control software (Dragon NaturallySpeaking, Voice Control)",
            "Screen magnification software",
          ],
        },
        {
          title: "Ongoing Improvements",
          content: "We are continuously working to improve accessibility. Our efforts include regular accessibility audits by third-party experts, automated accessibility testing integrated into our development process, user testing with individuals who use assistive technologies, and ongoing staff training on accessibility best practices.",
        },
        {
          title: "Known Limitations",
          content: "While we strive for full accessibility, some areas are still being improved. We maintain a detailed accessibility roadmap and prioritize fixes based on user impact. If you encounter an accessibility barrier, please let us know so we can address it promptly.",
        },
        {
          title: "Feedback and Contact",
          content: "We welcome feedback on the accessibility of AIVO Learning. If you encounter any accessibility barriers, have suggestions for improvement, or need content in an alternative format, please contact our accessibility team. We aim to respond to accessibility feedback within 2 business days.",
        },
      ]}
    />
  );
}
