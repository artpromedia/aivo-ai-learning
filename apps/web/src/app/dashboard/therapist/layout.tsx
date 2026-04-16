"use client";
import CareTeamLayout from "@/components/layouts/CareTeamLayout";

const NAV_ITEMS = [
  { href: "/dashboard/therapist", label: "Caseload", icon: "\uD83D\uDC65" },
  { href: "/dashboard/therapist/reports", label: "Reports", icon: "\uD83D\uDCCB" },
  { href: "/dashboard/therapist/sessions", label: "Sessions", icon: "\uD83D\uDCC5" },
  { href: "/dashboard/therapist/settings", label: "Settings", icon: "\u2699\uFE0F" },
];

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <CareTeamLayout accent="pink" roleLabel="Therapist" allowedRoles={["THERAPIST", "PLATFORM_ADMIN"]} basePath="/dashboard/therapist" navItems={NAV_ITEMS}>
      {children}
    </CareTeamLayout>
  );
}
