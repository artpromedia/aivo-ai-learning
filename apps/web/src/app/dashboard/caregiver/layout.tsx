"use client";
import CareTeamLayout from "@/components/layouts/CareTeamLayout";

const NAV_ITEMS = [
  { href: "/dashboard/caregiver", label: "Overview", icon: "\uD83D\uDCCA" },
  { href: "/dashboard/caregiver/observations", label: "Observations", icon: "\uD83D\uDCDD" },
  { href: "/dashboard/caregiver/sessions", label: "Sessions", icon: "\uD83D\uDCC5" },
  { href: "/dashboard/caregiver/settings", label: "Settings", icon: "\u2699\uFE0F" },
];

export default function CaregiverLayout({ children }: { children: React.ReactNode }) {
  return (
    <CareTeamLayout accent="green" roleLabel="Caregiver" allowedRoles={["CAREGIVER", "PLATFORM_ADMIN"]} basePath="/dashboard/caregiver" navItems={NAV_ITEMS}>
      {children}
    </CareTeamLayout>
  );
}
