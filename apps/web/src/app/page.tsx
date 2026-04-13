"use client";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  StickyHeader,
  Hero,
  Features,
  HowItWorks,
  FunctioningLevels,
  BrainClone,
  TutorCarousel,
  Pricing,
  Testimonials,
  FAQ,
  CTASection,
  Footer,
  TUTORS,
} from "@/components/marketing";

function useParallax() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrollY;
}

const ROLE_DASHBOARDS: Record<string, string> = {
  PARENT: "/dashboard/parent",
  LEARNER: "/dashboard/learner",
  TEACHER: "/dashboard/teacher",
  CAREGIVER: "/dashboard/caregiver",
  THERAPIST: "/dashboard/therapist",
  PLATFORM_ADMIN: "/dashboard/admin",
  DISTRICT_ADMIN: "/dashboard/district",
  SALES: "/dashboard/internal/sales",
  MARKETING: "/dashboard/internal/marketing",
  CUSTOMER_CARE: "/dashboard/internal/customer-care",
  SUPPORT: "/dashboard/internal/support",
  FINANCE: "/dashboard/internal/finance",
  DEVOPS: "/dashboard/internal/devops",
};

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const scrollY = useParallax();

  useEffect(() => {
    if (!loading && user) {
      router.push(ROLE_DASHBOARDS[user.role] || "/dashboard/parent");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-cyan-50">
        <div className="animate-pulse motion-reduce:animate-none">
          <Image src="/images/aivo-logo-purple.png" alt="AIVO" width={200} height={60} priority style={{ width: "auto", height: "auto" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <StickyHeader scrollY={scrollY} />

      <main>
        <div className="pt-16">
          <Hero scrollY={scrollY} />
        </div>

        <div id="features">
          <Features scrollY={scrollY} />
        </div>

        <HowItWorks />

        <div id="levels">
          <FunctioningLevels />
        </div>

        <div id="brain">
          <BrainClone />
        </div>

        <div id="tutors">
          <TutorCarousel tutors={TUTORS} />
        </div>

        <Testimonials />

        <Pricing />

        <FAQ />

        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
