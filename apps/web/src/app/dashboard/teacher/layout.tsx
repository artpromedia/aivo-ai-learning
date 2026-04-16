"use client";
import CareTeamLayout from "@/components/layouts/CareTeamLayout";

const NAV_ITEMS = [
  { href: "/dashboard/teacher", label: "Overview", icon: "\uD83D\uDCCA" },
  { href: "/dashboard/teacher/reports", label: "Reports", icon: "\uD83D\uDCC8" },
  { href: "/dashboard/teacher/lesson-plans", label: "Lesson Plans", icon: "\uD83D\uDCDD" },
  { href: "/dashboard/teacher/settings", label: "Settings", icon: "\u2699\uFE0F" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <CareTeamLayout accent="blue" roleLabel="Teacher" allowedRoles={["TEACHER", "PLATFORM_ADMIN"]} basePath="/dashboard/teacher" navItems={NAV_ITEMS}>
      {children}
    </CareTeamLayout>
  );
}
