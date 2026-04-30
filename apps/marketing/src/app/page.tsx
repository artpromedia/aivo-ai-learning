import {
  TrustStrip,
  HowItWorks,
  FunctioningLevels,
  BrainClone,
  TutorCarousel,
  Pricing,
  Testimonials,
  FAQ as Faq,
  CTASection,
  Footer,
  TUTORS,
} from "@/components/marketing";
import { HomePageHeroShell } from "@/components/marketing/HomePageHeroShell";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main>
        <HomePageHeroShell />

        <TrustStrip />

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
          <Faq />
        </div>

        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
