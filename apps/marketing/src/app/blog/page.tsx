"use client";
import { CompanyPageLayout } from "@/components/marketing/legal/CompanyPageLayout";
import { trackCTAClick, trackSignupInitiation } from "@/lib/analytics";
import { WEB_APP_URL } from "@/lib/constants";

const POSTS = [
  {
    tag: "Product",
    tagColor: "#7c3aed",
    title: "Introducing Brain Clone 2.0: Smarter Personalization Than Ever",
    excerpt: "Our latest Brain Clone update brings deeper learning profile modeling, faster adaptation, and new sensory accommodation features.",
    date: "Coming Soon",
    readTime: "5 min read",
  },
  {
    tag: "Education",
    tagColor: "#059669",
    title: "How AI Tutors Are Transforming Special Education",
    excerpt: "Discover how AIVO's 14 AI tutors adapt to diverse functioning levels, making quality education accessible to every learner.",
    date: "Coming Soon",
    readTime: "7 min read",
  },
  {
    tag: "Research",
    tagColor: "#2563eb",
    title: "The Science Behind Adaptive Learning: A Deep Dive",
    excerpt: "An exploration of the cognitive science and machine learning techniques powering AIVO's personalized learning pathways.",
    date: "Coming Soon",
    readTime: "10 min read",
  },
  {
    tag: "Company",
    tagColor: "#d97706",
    title: "AIVO's Mission: No Learner Left Behind",
    excerpt: "A look at how our founding team's diverse backgrounds in healthcare, education, and technology shaped AIVO's inclusive vision.",
    date: "Coming Soon",
    readTime: "6 min read",
  },
];

export default function BlogPage() {
  return (
    <CompanyPageLayout
      badge="Blog"
      title="Insights & Updates"
      subtitle="The latest from the AIVO team — product updates, education research, and stories from our community."
      icon="📝"
      accentColor="#7c3aed"
    >
      <div className="mb-12">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl p-8 md:p-12 border border-purple-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">Coming Soon</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 mb-4">Our blog is launching soon</h2>
          <p className="text-slate-600 font-body text-lg leading-relaxed max-w-2xl">
            We are preparing insightful articles about adaptive learning, AI in education, special education best practices, and product updates. Stay tuned!
          </p>
        </div>
      </div>

      <h3 className="text-xl font-heading font-bold text-slate-900 mb-6">Preview of Upcoming Articles</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {POSTS.map((post) => (
          <div key={post.title} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: post.tagColor }}>{post.tag}</span>
              <span className="text-sm text-slate-400 font-body">{post.readTime}</span>
            </div>
            <h4 className="text-lg font-heading font-bold text-slate-900 mb-2 leading-snug">{post.title}</h4>
            <p className="text-slate-500 font-body text-sm leading-relaxed flex-1">{post.excerpt}</p>
            <div className="mt-4 pt-4 border-t border-slate-50">
              <span className="text-sm text-slate-400 font-body">{post.date}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center">
        <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">Want to be notified when we launch?</h3>
        <p className="text-slate-500 font-body mb-6">Sign up for an AIVO account and we will keep you updated.</p>
        <a
          href={`${WEB_APP_URL}/signup?plan=free`}
          onClick={() => {
            trackCTAClick("blog_create_account", `${WEB_APP_URL}/signup?plan=free`);
            trackSignupInitiation("blog");
          }}
          className="inline-flex items-center px-8 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-purple-200"
        >
          Create Free Account
        </a>
      </div>
    </CompanyPageLayout>
  );
}
