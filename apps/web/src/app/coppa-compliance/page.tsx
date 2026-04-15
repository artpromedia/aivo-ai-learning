"use client";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function CoppaCompliancePage() {
  return (
    <LegalPageLayout
      badge="Children's Privacy"
      title="COPPA Compliance"
      subtitle="How AIVO Learning protects children's online privacy in full compliance with the Children's Online Privacy Protection Act."
      icon="🛡️"
      accentColor="#059669"
      lastUpdated="April 1, 2026"
      contactEmail="privacy@aivo.education"
      sections={[
        {
          title: "Our Commitment to Children's Privacy",
          content: [
            "AIVO Learning is built from the ground up with children's safety and privacy as a core design principle. As a platform that primarily serves children, including those with autism and developmental differences, we hold ourselves to the highest standards of data protection.",
            "We comply fully with the Children's Online Privacy Protection Act (COPPA), which governs the collection, use, and disclosure of personal information from children under 13 years of age.",
          ],
        },
        {
          title: "Verifiable Parental Consent",
          content: "Before collecting any personal information from a child under 13, we obtain verifiable parental consent through:",
          list: [
            "Email-plus method: A consent form sent to the parent's verified email, requiring a signed response",
            "Parent dashboard verification: Parents create the child's account through their own verified account",
            "School authorization: For B2B deployments, schools act as agents of consent under COPPA's school exception, with appropriate agreements in place",
            "Parents can withdraw consent at any time through their dashboard or by contacting us directly",
          ],
        },
        {
          title: "What We Collect from Children",
          content: "We collect only the minimum information necessary to provide our educational services:",
          list: [
            "First name (or nickname) chosen by the parent",
            "Age and grade level for content calibration",
            "Functioning level designation for adaptive learning",
            "Learning activity data: responses, progress, and performance within lessons",
            "Optional sensory preferences set by the parent to customize the experience",
          ],
        },
        {
          title: "What We Never Collect from Children",
          content: "AIVO Learning strictly avoids collecting:",
          list: [
            "Full names, home addresses, or phone numbers from children directly",
            "Social media profiles or contact lists",
            "Photos, videos, or audio recordings of children",
            "Geolocation data from children's devices",
            "Any information beyond what is needed for the educational service",
          ],
        },
        {
          title: "How Children's Data Is Used",
          content: "Children's personal information is used exclusively for educational purposes:",
          list: [
            "Powering the Brain-Clone AI to personalize learning pathways",
            "Adapting lesson difficulty, pacing, and sensory presentation",
            "Generating progress reports visible only to authorized parents and educators",
            "Improving the platform through anonymized, aggregated learning analytics",
          ],
        },
        {
          title: "No Advertising to Children",
          content: "AIVO Learning does not display any advertising to children. There are no behavioral ads, targeted promotions, or third-party marketing materials shown to learners. Our platform is entirely funded through subscriptions and institutional licenses, ensuring a distraction-free learning environment.",
        },
        {
          title: "Data Sharing Restrictions",
          content: "We do not sell children's personal information under any circumstances. Data is shared only with:",
          list: [
            "Parents/guardians through their secure dashboard",
            "School administrators and teachers when authorized through institutional agreements",
            "Service providers bound by strict data processing agreements who help us operate the platform",
            "Law enforcement when required by law to protect a child's safety",
          ],
        },
        {
          title: "Parental Rights Under COPPA",
          content: "Parents have the following rights regarding their child's information:",
          list: [
            "Review: Access all personal information collected about their child",
            "Modify: Update or correct any information about their child",
            "Delete: Request deletion of their child's account and all associated data",
            "Refuse further collection: Opt out of future data collection while retaining existing data",
            "Revoke consent: Withdraw consent at any time, triggering data deletion within 30 days",
          ],
        },
        {
          title: "Data Retention for Children",
          content: "Children's personal information is retained only as long as the account is active and the parent maintains consent. Upon account deletion or consent withdrawal, all of the child's personal data is permanently deleted within 30 days. Anonymized learning analytics that cannot be linked back to any individual may be retained for educational research and platform improvement.",
        },
        {
          title: "Safe Harbor Compliance",
          content: "AIVO Learning participates in an FTC-approved COPPA Safe Harbor program, providing an additional layer of oversight and accountability for our children's privacy practices. Our compliance is regularly audited by independent third parties to ensure ongoing adherence to COPPA requirements.",
        },
      ]}
    />
  );
}
