import React from 'react';
import { ArrowLeft, BookOpen, Clock, Calendar, ArrowRight, Share2, CheckCircle2 } from 'lucide-react';
import { BLOG_POSTS } from './LatestBlogs';

interface BlogsPageProps {
  activeSlug: string;
  onOpenAssessment: (industry?: string) => void;
  onOpenConsultation: () => void;
  onSelectBlog: (slug: string) => void;
  onBackToBlogs: () => void;
  onNavigateHome: () => void;
}

export const BlogsPage: React.FC<BlogsPageProps> = ({
  activeSlug,
  onOpenAssessment,
  onOpenConsultation,
  onSelectBlog,
  onBackToBlogs,
  onNavigateHome
}) => {
  const currentBlog = BLOG_POSTS.find(b => b.slug === activeSlug) || BLOG_POSTS[0];

  if (activeSlug) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-inter">
        <button
          type="button"
          onClick={onBackToBlogs}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Advisory Hub</span>
        </button>

        <article className="space-y-6">
          <div className="space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              {currentBlog.category}
            </span>
            <h1 className="font-manrope text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              {currentBlog.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span>{currentBlog.date}</span>
              <span>•</span>
              <span>{currentBlog.readTime}</span>
              <span>•</span>
              <span>Inisio Research &amp; Advisory Desk</span>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4 pt-4 border-t border-slate-200">
            <p className="font-semibold text-slate-900">
              {currentBlog.excerpt}
            </p>
            <p>
              When evaluating a greenfield capital expenditure outlay, commercial banks in India apply standardized credit risk appraisal rubrics. The primary metric reviewed by the sanctioning authority is the Debt Service Coverage Ratio (DSCR), alongside the internal rate of return (IRR) and sensitivity under a 10% drop in capacity utilization.
            </p>
            <h3 className="text-lg font-bold text-slate-900 font-manrope">1. Bankability Benchmarks and RBI Guidelines</h3>
            <p>
              Under RBI's prudential norms, an average gross DSCR of 1.40x to 1.75x across the loan repayment tenure (usually 7 to 10 years including construction moratorium) is considered institutional-grade. A DSCR falling below 1.25x triggers mandatory promoter guarantees, cash collateral covenants, or higher promoter equity contribution.
            </p>
            <h3 className="text-lg font-bold text-slate-900 font-manrope">2. Structuring Means of Finance</h3>
            <p>
              A classic debt-equity ratio of 70:30 or 65:35 is standard. Including state government capital investment subsidies or interest subvention (3-4% under priority sector schemes) can significantly reduce financial leverage and improve the project's break-even point.
            </p>
          </div>

          {/* Call to action inside blog */}
          <div className="mt-10 p-6 bg-blue-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-manrope font-bold text-base text-slate-900">
                Evaluating your own greenfield project?
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Calculate your project's bank feasibility score, DSCR, and term loan eligibility in 3 minutes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenAssessment()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Start Free Assessment
            </button>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-inter space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Knowledge Base &amp; Publications
        </span>
        <h1 className="font-manrope text-3xl sm:text-4xl font-extrabold text-slate-900">
          Greenfield Project Advisory &amp; Debt Research
        </h1>
        <p className="text-sm text-slate-600">
          In-depth technical guides, CMA modeling insights, subsidy updates, and banking norms for enterprise founders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {BLOG_POSTS.map((blog) => (
          <article
            key={blog.slug}
            onClick={() => onSelectBlog(blog.slug)}
            className="bg-white rounded-3xl border border-slate-200/90 p-6 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
          >
            <div className="space-y-3">
              <span className="font-bold text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                {blog.category}
              </span>
              <h3 className="font-manrope font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                {blog.title}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {blog.excerpt}
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">{blog.date}</span>
              <span className="font-bold text-blue-600 flex items-center gap-1">
                Read Article <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
