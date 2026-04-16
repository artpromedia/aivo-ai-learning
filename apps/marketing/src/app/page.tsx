"use client";
import { useEffect, useState } from "react";
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

export default function Home() {
  const scrollY = useParallax();

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

        <div id="faq">
          <FAQ />
        </div>

        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
