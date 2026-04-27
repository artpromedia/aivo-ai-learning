"use client";
import { LegalPageLayout } from "@/components/marketing/legal/LegalPageLayout";

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      badge="Legal"
      title="Terms of Service"
      subtitle="Welcome to AIVO Learning. These Terms describe the rules for using our adaptive learning platform. Please read them carefully — by using AIVO, you agree to them."
      icon="📜"
      accentColor="#2563eb"
      lastUpdated="December 15, 2026"
      contactEmail="legal@aivo.education"
      sections={[
        {
          title: "Welcome",
          content: [
            "AIVO Learning, Inc. (\"AIVO\", \"we\", \"us\", or \"our\") operates the website at aivolearning.com, our mobile applications, and a set of online services that include our Brain-Clone adaptive learning engine, AI tutors, IEP tools, and progress reporting (together, the \"Services\").",
            "When you use the Services, you are entering into a legal agreement with AIVO. We refer to anyone who uses the Services as a \"User.\" If you are a parent or legal guardian creating an account for a child, you are agreeing to these Terms on behalf of your child. If you are school personnel or a district administrator, you are agreeing on behalf of your institution.",
            "These Terms of Service, together with our Privacy Policy, Cookie Policy, COPPA Compliance Notice, and FERPA Compliance Notice (collectively, the \"Terms\"), set the rules for using our Services. Please note that these Terms include limitations on liability and a binding arbitration clause that affects how disputes are resolved.",
          ],
        },
        {
          title: "Eligibility",
          content: [
            "AIVO is built for learners of all ages, with a particular focus on children with autism, ADHD, dyslexia, and other neurodivergent profiles. Because we serve children, eligibility rules apply.",
            "By using the Services, you represent that one of the following is true: (i) you are at least 18 years old (or the age of majority in your jurisdiction) and are creating an account for yourself; (ii) you are a parent or legal guardian creating and approving an account for your child; or (iii) you are authorized school personnel registering a student under your institution's policies.",
            "Children under 13 in the United States, and children under the equivalent age of digital consent in other jurisdictions, may only use the Services with verifiable parental consent or under a school-based exception, as described in our COPPA Compliance Notice.",
          ],
        },
        {
          title: "Your Account",
          content: [
            "To use most features of AIVO you must create an account. You agree to provide accurate, current, and complete information during registration and to keep that information up to date.",
            "You are responsible for keeping your password and account credentials confidential, and you accept responsibility for all activity that occurs under your account. If you believe your account has been compromised, please email us at security@aivo.education immediately.",
            "Parents and guardians may create and manage learner accounts for their children. School personnel may create and manage student accounts under a District Plan or institutional agreement. Sharing of accounts between learners is not permitted.",
          ],
        },
        {
          title: "Subscription Plans, Billing, and Cancellation",
          content: "AIVO offers several subscription tiers so that families, schools, and districts can choose the option that fits them best:",
          list: [
            "Free Plan — limited access for one learner, English Language Arts content only.",
            "Single Learner Plan — $24.99 per month for one learner with full access to every subject and AI tutor.",
            "Family Plan — $19.99 per month per learner, with discounted multi-learner access for the same household.",
            "District Plan — custom pricing for schools and districts, with volume licensing, rostering, and admin tools governed by a separate written agreement.",
            "Subscriptions renew automatically each billing cycle. You may cancel any time from your account dashboard and will retain access through the end of the current period.",
            "Refunds may be granted within 14 days of initial purchase if the Service has not been substantially used. District contracts follow the refund and termination terms in the underlying agreement.",
          ],
        },
        {
          title: "School and District Use",
          content: [
            "Where AIVO is used as part of a school's educational program, the institution is responsible for obtaining any parental consents and providing any notices required by FERPA, COPPA, and other applicable laws.",
            "Schools may roster students using SSO providers such as Google Classroom, Clever, or ClassLink, in accordance with the institution's written agreement with AIVO. Student data created under a District Plan is treated as an education record under FERPA, and access controls reflect that.",
            "Educators should treat AIVO as an educational aid and not as a substitute for professional judgment. AI-generated guidance is meant to support — not replace — the IEP team, therapists, and qualified teachers.",
          ],
        },
        {
          title: "Acceptable Use",
          content: "You agree not to use the Services in any way that:",
          list: [
            "Violates any applicable law or regulation, including export controls and sanctions.",
            "Infringes any third party's intellectual property, privacy, or publicity rights.",
            "Attempts to gain unauthorized access to other accounts, systems, or data, or to bypass our security or rate limits.",
            "Transmits malicious code, spam, or content designed to harm or disrupt the Services.",
            "Harasses, threatens, exploits, or endangers any learner or other user, especially a child.",
            "Scrapes, copies, or uses Service content to train, fine-tune, or evaluate any third-party machine learning model.",
            "Shares account credentials, resells access, or uses the Services for commercial purposes outside of an authorized District Plan.",
          ],
        },
        {
          title: "Your Content",
          content: [
            "Learners and educators may submit content to the Services — for example, written responses, journal entries, voice recordings, IEP goals, and chat messages with AI tutors (\"User Content\"). You retain ownership of your User Content.",
            "By submitting User Content, you grant AIVO a worldwide, non-exclusive, royalty-free license to host, display, and process that content solely to operate, secure, and improve the Services for you and other authorized users. Where User Content is part of an education record, that record is owned and controlled by the school or district as required by FERPA.",
            "We never sell User Content, and we never use identifiable learner data to train third-party AI models. See our Privacy Policy for full detail on how data is handled.",
          ],
        },
        {
          title: "AI-Powered Features and Brain-Clone",
          content: [
            "AIVO uses artificial intelligence to personalize learning. Our Brain-Clone technology builds a private cognitive model of each learner so that lessons, examples, and tutor responses adapt over time to that learner's strengths and needs.",
            "AI features can occasionally produce inaccurate, incomplete, or unexpected output. Adults supervising a learner should review important AI-generated content, especially anything used for academic decisions or IEP planning. AIVO is not a medical, diagnostic, or therapeutic service.",
            "We may update, add, or remove specific AI features as the underlying models and our research evolve. Where AI features depend on a third-party model provider, the availability of those features may change if the provider's service changes.",
          ],
        },
        {
          title: "AIVO Content and Intellectual Property",
          content: [
            "All software, AI models, curriculum, lesson designs, illustrations, audio, code, trademarks, and the AIVO brand are owned by AIVO Learning, Inc. or our licensors and are protected by copyright, trademark, and other intellectual property laws.",
            "We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for personal, non-commercial educational purposes (or, for District Plans, for the institution's educational use). You may not copy, modify, distribute, sell, lease, or create derivative works from any part of the Services without our written permission.",
          ],
        },
        {
          title: "Third-Party Services",
          content: "The Services may include or link to third-party tools, content, or platforms — for example, payment processors, identity providers, classroom roster providers, or AI model APIs. Your use of those services is governed by the third party's own terms and privacy policy. AIVO is not responsible for third-party services or for content we link to as a convenience.",
        },
        {
          title: "Disclaimers",
          content: "The Services are provided \"as is\" and \"as available.\" To the fullest extent permitted by law, AIVO disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, accuracy, and non-infringement. We do not warrant that the Services will be uninterrupted, error-free, or that AI output will always be accurate. AIVO is an educational tool and is not a substitute for professional medical, therapeutic, special education, or legal advice.",
        },
        {
          title: "Limitation of Liability",
          content: "To the fullest extent permitted by law, AIVO and its directors, employees, contractors, and partners will not be liable for any indirect, incidental, consequential, special, or punitive damages, or any loss of profits, data, or goodwill, arising out of or related to the Services or these Terms. Our total aggregate liability to you for any claim related to the Services will not exceed the greater of (a) the amount you paid AIVO in the twelve months before the event giving rise to the claim or (b) one hundred U.S. dollars (US$100).",
        },
        {
          title: "Termination",
          content: [
            "You may stop using the Services at any time by canceling your subscription and deleting your account from your dashboard. We will delete or de-identify your data in accordance with our retention policy described in the Privacy Policy.",
            "We may suspend or terminate your access if we reasonably believe you have violated these Terms, if required by law, or if continued access would create a safety, security, or legal risk. Where it is reasonable and appropriate, we will provide notice and an opportunity to export your data first.",
          ],
        },
        {
          title: "Changes to These Terms",
          content: "We may update these Terms from time to time. If we make material changes, we will give you reasonable notice — for example, by email to the address on file or by posting a notice on the Services — at least thirty days before the changes take effect, except for changes required for legal or security reasons, which may take effect immediately. Your continued use of the Services after the effective date means you accept the updated Terms.",
        },
        {
          title: "Governing Law and Dispute Resolution",
          content: [
            "These Terms are governed by the laws of the State of Delaware, United States, without regard to its conflict-of-laws rules.",
            "Any dispute arising out of or relating to these Terms or the Services that cannot be resolved through good-faith discussion will be resolved by binding individual arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules. You and AIVO each waive the right to a jury trial and the right to bring or participate in a class action, to the fullest extent permitted by law.",
            "Nothing in this section prevents either party from seeking injunctive or other equitable relief in a court of competent jurisdiction to protect intellectual property rights, account security, or learner safety.",
          ],
        },
        {
          title: "Contact Us",
          content: "If you have questions about these Terms, please contact our legal team at legal@aivo.education. For privacy questions, write to privacy@aivo.education. For questions about school or district use, write to compliance@aivo.education.",
        },
      ]}
    />
  );
}
