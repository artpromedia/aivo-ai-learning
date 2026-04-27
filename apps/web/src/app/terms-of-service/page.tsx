"use client";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { ScrollText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      badge="Legal"
      title="Terms of Service"
      subtitle="The terms and conditions governing your use of the AIVO Learning Platform. Please read these terms carefully before using our services."
      icon={<ScrollText size={22} strokeWidth={2.5} aria-hidden="true" />}
      accentColor="#2563eb"
      lastUpdated="April 1, 2026"
      contactEmail="legal@aivolearning.com"
      sections={[
        {
          title: "Acceptance of Terms",
          content: "By accessing or using the AIVO Learning Platform, you agree to be bound by these Terms of Service. If you are a parent or guardian creating an account for a child, you agree to these terms on behalf of your child. If you are a school or district administrator, you agree to these terms on behalf of your institution.",
        },
        {
          title: "Description of Service",
          content: "AIVO Learning provides an AI-powered adaptive learning platform designed for learners with diverse needs, including those with autism and other developmental differences. Our platform includes:",
          list: [
            "Personalized AI tutors that adapt to each learner's style and pace",
            "Brain-Clone technology that builds a cognitive model of each learner",
            "Curriculum aligned to state and national standards, localized by region",
            "Progress tracking, reporting, and IEP integration tools",
            "Gamified learning experiences with rewards and achievements",
          ],
        },
        {
          title: "Account Registration",
          content: [
            "To use AIVO Learning, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials.",
            "Parents/guardians must be at least 18 years old to create an account. Learner accounts can only be created by a parent, guardian, or authorized educational institution. You are responsible for all activities that occur under your account.",
          ],
        },
        {
          title: "Subscription Plans and Billing",
          content: "AIVO Learning offers several subscription tiers:",
          list: [
            "Free Plan: Limited access for one learner with ELA content only",
            "Single Learner Plan ($24.99/month): Full access for one learner across all subjects",
            "Family Plan ($19.99/month per learner): Discounted multi-learner access for families",
            "District Plan: Custom pricing for schools and districts with volume licensing",
          ],
        },
        {
          title: "Billing and Cancellation",
          content: [
            "Subscriptions are billed monthly or annually. You may cancel your subscription at any time through your account dashboard. Upon cancellation, you retain access until the end of your current billing period.",
            "Refunds may be issued within 14 days of initial purchase if the service has not been substantially used. District contracts have separate terms as specified in their service agreements.",
          ],
        },
        {
          title: "Acceptable Use",
          content: "You agree not to use the platform in any way that:",
          list: [
            "Violates any applicable laws or regulations",
            "Infringes on the intellectual property rights of others",
            "Attempts to gain unauthorized access to other accounts or systems",
            "Transmits malicious software or harmful content",
            "Harasses, threatens, or harms other users",
            "Uses automated systems to scrape content or data from the platform",
            "Shares account credentials with unauthorized individuals",
          ],
        },
        {
          title: "Intellectual Property",
          content: "All content, software, AI models, curriculum materials, and branding on the AIVO Learning Platform are the property of AIVO Learning Inc. and are protected by copyright, trademark, and other intellectual property laws. Users may not reproduce, distribute, or create derivative works from our content without written permission.",
        },
        {
          title: "User-Generated Content",
          content: "Any content submitted by users (such as learner responses, feedback, or communications) remains the property of the user. By submitting content, you grant AIVO Learning a limited license to use it solely for providing and improving our services. We will never use identifiable learner data for purposes outside of education.",
        },
        {
          title: "Limitation of Liability",
          content: "AIVO Learning provides educational technology tools and is not a substitute for professional medical, therapeutic, or special education services. While our platform is designed to support learners with diverse needs, it does not replace IEP teams, therapists, or qualified educators. AIVO Learning shall not be liable for indirect, incidental, or consequential damages arising from use of the platform.",
        },
        {
          title: "Termination",
          content: "We reserve the right to suspend or terminate accounts that violate these terms. In cases of termination, we will provide reasonable notice and an opportunity to export your data, except in cases of severe violations that pose a risk to other users or our platform.",
        },
        {
          title: "Governing Law",
          content: "These terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules.",
        },
      ]}
    />
  );
}
