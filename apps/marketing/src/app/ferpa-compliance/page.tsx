"use client";
import { LegalPageLayout } from "@/components/marketing/legal/LegalPageLayout";

export default function FerpaCompliancePage() {
  return (
    <LegalPageLayout
      badge="Education Privacy"
      title="FERPA Compliance"
      subtitle="How AIVO Learning protects student education records in compliance with the Family Educational Rights and Privacy Act."
      icon="🎓"
      accentColor="#2563eb"
      lastUpdated="April 1, 2026"
      contactEmail="compliance@aivolearning.com"
      sections={[
        {
          title: "Our Commitment to Education Privacy",
          content: [
            "AIVO Learning serves students, parents, and educational institutions. When we work with schools and districts, student data is protected under FERPA, and we take this responsibility seriously.",
            "We act as a 'school official' under FERPA when providing services to educational institutions, and we maintain strict data handling practices that meet or exceed FERPA requirements.",
          ],
        },
        {
          title: "What Qualifies as Education Records",
          content: "Under FERPA, education records include any records directly related to a student that are maintained by an educational institution or a party acting on its behalf. Within AIVO, this includes:",
          list: [
            "Student learning profiles and Brain Clone data created through school-authorized accounts",
            "Assessment results, quiz scores, and performance metrics",
            "IEP-related data uploaded or generated within the platform",
            "Progress reports and learning analytics",
            "Accommodations and sensory profile configurations set by educators",
          ],
        },
        {
          title: "School Official Exception",
          content: [
            "When AIVO provides services to a school or district under a contractual agreement, we operate under the 'school official' exception to FERPA. This means schools can share education records with us without requiring individual parent consent, provided our agreement meets FERPA's requirements.",
            "Our agreements with schools and districts include all required FERPA provisions: we use education records only for the purposes specified in our agreement, we maintain appropriate data security, and we do not re-disclose personally identifiable information without authorization.",
          ],
        },
        {
          title: "Data Access Controls",
          content: "AIVO implements strict access controls to ensure education records are only accessible to authorized individuals:",
          list: [
            "Teachers see only their assigned students' data",
            "District administrators have access scoped to their district",
            "Parents access only their own children's records",
            "AIVO platform staff access is limited to technical support needs and is logged",
            "Role-based access control (RBAC) with 13 defined roles ensures least-privilege access",
          ],
        },
        {
          title: "Data Use Limitations",
          content: "Education records received from schools are used exclusively for providing and improving the educational service:",
          list: [
            "Personalizing learning experiences through Brain Clone AI",
            "Generating progress reports for authorized teachers, parents, and administrators",
            "Aligning curriculum with IEP goals and state standards",
            "Aggregated, de-identified analytics for platform improvement (never individually identifiable)",
            "We never use education records for marketing, advertising, or any non-educational purpose",
          ],
        },
        {
          title: "Parent and Eligible Student Rights",
          content: "FERPA grants parents (and eligible students over 18) specific rights regarding education records:",
          list: [
            "Right to inspect and review education records maintained by AIVO",
            "Right to request correction of inaccurate records",
            "Right to consent to disclosure of records (except under FERPA exceptions)",
            "Right to file a complaint with the U.S. Department of Education",
            "Schools and parents can request these through our compliance team or their AIVO dashboard",
          ],
        },
        {
          title: "Data Security Measures",
          content: "We protect education records with enterprise-grade security:",
          list: [
            "Encryption in transit (TLS 1.3) and at rest (AES-256)",
            "SOC 2 Type II certified infrastructure",
            "Regular third-party security audits and penetration testing",
            "Multi-factor authentication for all staff accessing student data",
            "Automated data loss prevention and anomaly detection",
            "Incident response plan with notification procedures for data breaches",
          ],
        },
        {
          title: "Data Retention and Deletion",
          content: "When our agreement with a school or district ends, we follow strict data disposition procedures. Education records are returned to the institution or securely deleted within 60 days of contract termination, unless the institution requests a different timeline. We provide written confirmation of data deletion upon request.",
        },
        {
          title: "State Privacy Laws",
          content: "In addition to FERPA, AIVO complies with applicable state student privacy laws, including but not limited to state-specific student data privacy acts. We maintain compliance with the Student Privacy Pledge and regularly review our practices against evolving state requirements.",
        },
      ]}
    />
  );
}
