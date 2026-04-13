"use client";
import { LegalPageLayout } from "@/components/marketing/legal/LegalPageLayout";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      badge="Privacy"
      title="Privacy Policy"
      subtitle="Your privacy matters. Here's how AIVO Learning collects, uses, and protects your personal information and your child's data."
      icon="🔒"
      accentColor="#7c3aed"
      lastUpdated="April 1, 2026"
      contactEmail="privacy@aivo.education"
      sections={[
        {
          title: "Information We Collect",
          content: "AIVO Learning collects information necessary to provide a personalized, adaptive learning experience. We are committed to collecting only the minimum data required to deliver our services.",
          list: [
            "Account information: name, email address, and password for parents/guardians",
            "Learner profiles: first name, age, grade level, and functioning level (provided by parent/guardian)",
            "Learning data: lesson progress, quiz responses, time spent on activities, and performance metrics",
            "Sensory preferences: optional sensory profile data to customize the learning environment",
            "Device information: browser type, operating system, and screen resolution for optimization",
            "Usage analytics: anonymized interaction patterns to improve our platform",
          ],
        },
        {
          title: "How We Use Your Information",
          content: "We use collected information solely to provide, improve, and personalize the AIVO learning experience.",
          list: [
            "Power the Brain-Clone AI engine to create personalized learning pathways",
            "Adapt content difficulty and presentation based on each learner's needs",
            "Generate progress reports and insights for parents and educators",
            "Improve our AI tutors and curriculum through anonymized, aggregated analytics",
            "Communicate important updates about your account or our services",
            "Ensure platform security and prevent unauthorized access",
          ],
        },
        {
          title: "Children's Privacy (COPPA Compliance)",
          content: [
            "AIVO Learning is designed for children and takes children's privacy extremely seriously. We comply fully with the Children's Online Privacy Protection Act (COPPA).",
            "We never collect personal information from children under 13 without verified parental consent. Parents have the right to review, modify, or delete their child's information at any time through their dashboard.",
            "We do not display behavioral advertising to children. We do not sell or share children's personal information with third parties for marketing purposes.",
          ],
        },
        {
          title: "Data Storage and Security",
          content: "We implement industry-standard security measures to protect your data.",
          list: [
            "All data is encrypted in transit (TLS 1.3) and at rest (AES-256)",
            "Our infrastructure is hosted on SOC 2 Type II certified cloud providers",
            "Access to personal data is restricted to authorized personnel only",
            "Regular security audits and penetration testing are conducted",
            "Data is stored in geographically distributed, redundant data centers within the United States",
          ],
        },
        {
          title: "Data Sharing and Third Parties",
          content: [
            "We do not sell your personal information. Period. We only share data in limited circumstances:",
            "With school districts when authorized through a B2B agreement, to support IEP tracking and educational reporting. With service providers who help us operate the platform (hosting, analytics), bound by strict data processing agreements. When required by law or to protect the safety of our users.",
          ],
        },
        {
          title: "Your Rights and Choices",
          content: "You have full control over your data and your child's data.",
          list: [
            "Access: View all personal data we store about you and your learners",
            "Correction: Update or correct any inaccurate information",
            "Deletion: Request complete deletion of your account and all associated data",
            "Portability: Export your child's learning data in a standard format",
            "Opt-out: Disable optional data collection like sensory profiles at any time",
            "Consent withdrawal: Revoke consent for data processing for your child",
          ],
        },
        {
          title: "Cookies and Tracking",
          content: "AIVO Learning uses only essential cookies required for platform functionality, such as session management and language preferences. We do not use tracking cookies for advertising. Optional analytics cookies help us understand platform usage in aggregate and can be disabled in your account settings.",
        },
        {
          title: "Data Retention",
          content: "We retain account data for as long as your account is active. Learning progress data is retained to maintain continuity in your child's educational journey. Upon account deletion, all personal data is permanently removed within 30 days. Anonymized, aggregated data used for platform improvement may be retained indefinitely.",
        },
        {
          title: "Changes to This Policy",
          content: "We may update this policy to reflect changes in our practices or for legal reasons. We will notify all registered users via email at least 30 days before any material changes take effect. Continued use of the platform after changes constitutes acceptance of the updated policy.",
        },
      ]}
    />
  );
}
