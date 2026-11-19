import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import api from '../utils/apiClient';
import { BlogPostItem } from '../types';

interface BlogsPageProps {
  activeSlug: string;
  onOpenAssessment: (industry?: string) => void;
  onOpenConsultation: () => void;
  onSelectBlog: (slug: string) => void;
  onBackToBlogs: () => void;
  onBlogLoaded?: (blog: BlogPostItem | null) => void;
  onNavigateToPage?: (tab: string) => void;
  onNavigateHome: () => void;
}

export const BlogsPage: React.FC<BlogsPageProps> = ({
  activeSlug,
  onOpenAssessment,
  onSelectBlog,
  onBackToBlogs,
  onBlogLoaded,
  onNavigateToPage,
}) => {
  const [blogs, setBlogs] = useState<BlogPostItem[]>([]);
  const [activeBlog, setActiveBlog] = useState<BlogPostItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all blogs
  useEffect(() => {
    let isMounted = true;
    api.blogs
      .getAll()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        setBlogs(list);
      })
      .catch((err) => {
        console.error('Failed to load blog posts:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // When activeSlug is provided, fetch or select the single blog
  useEffect(() => {
    if (!activeSlug) {
      setActiveBlog(null);
      onBlogLoaded?.(null);
      return;
    }

    let isMounted = true;
    api.blogs
      .getBySlug(activeSlug)
      .then((data) => {
        if (!isMounted) return;
        const post = (data as any)?.data || data;
        setActiveBlog(post);
        onBlogLoaded?.(post);
      })
      .catch(() => {
        // Fallback to local array find if already loaded
        const found = blogs.find((b) => b.slug === activeSlug);
        if (isMounted && found) {
          setActiveBlog(found);
          onBlogLoaded?.(found);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeSlug, blogs]);

  if (loading && blogs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-3 font-inter">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading advisory research...</p>
      </div>
    );
  }

  if (activeSlug && activeBlog) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-inter">
        <a
          href="/blogs"
          onClick={(e) => {
            e.preventDefault();
            onBackToBlogs();
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Advisory Hub</span>
        </a>

        <article className="space-y-6">
          <div className="space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              {activeBlog.category}
            </span>
            <h1 className="font-manrope text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              {activeBlog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
              <span>{activeBlog.date}</span>
              <span>•</span>
              <span>{activeBlog.readTime}</span>
              <span>•</span>
              <span>{activeBlog.author || 'Inisio Research & Advisory Desk'}</span>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4 pt-4 border-t border-slate-200">
            <p className="font-semibold text-slate-900">
              {activeBlog.excerpt}
            </p>
            {activeBlog.content ? (
              <p>{activeBlog.content}</p>
            ) : null}
            <h2 className="text-lg font-bold text-slate-900 font-manrope">1. Bankability Benchmarks and RBI Guidelines</h2>
            <p>
              Under RBI's prudential norms, an average gross DSCR of 1.40x to 1.75x across the loan repayment tenure (usually 7 to 10 years including construction moratorium) is considered institutional-grade. A DSCR falling below 1.25x triggers mandatory promoter guarantees, cash collateral covenants, or higher promoter equity contribution.
            </p>
            <h2 className="text-lg font-bold text-slate-900 font-manrope">2. Structuring Means of Finance</h2>
            <p>
              A classic debt-equity ratio of 70:30 or 65:35 is standard. Including state government capital investment subsidies or interest subvention (3-4% under priority sector schemes) can significantly reduce financial leverage and improve the project's break-even point.
            </p>
          </div>

          {/* Call to action inside blog */}
          <div className="mt-10 p-6 bg-blue-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-manrope font-bold text-base text-slate-900">
                Evaluating your own greenfield project?
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Calculate your project's bank feasibility score, DSCR, and term loan eligibility with Inisio in minutes.
              </p>
            </div>
            <a
              href="/assessment"
              onClick={(e) => {
                e.preventDefault();
                onOpenAssessment();
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer text-center"
            >
              Start Free Assessment
            </a>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-inter space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
          Knowledge Base &amp; Publications
        </span>
        <h1 className="font-manrope text-3xl sm:text-4xl font-extrabold text-slate-900">
          Greenfield Project Advisory &amp; Debt Research
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Practical guides from the Inisio Capital advisory desk in Hyderabad covering PSU bank DSCR underwriting, CMA financial modeling, central and state capital subsidies, and bankable Detailed Project Reports across India.
        </p>
      </div>

      {blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <article
              key={blog.slug}
              className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <a
                href={`/blogs/${blog.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectBlog(blog.slug);
                }}
                className="p-6 flex flex-col justify-between h-full cursor-pointer"
              >
                <div className="space-y-3">
                  <span className="inline-block font-bold text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    {blog.category}
                  </span>
                  <h2 className="font-manrope font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {blog.title}
                  </h2>
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
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          No articles published yet.
        </div>
      )}

      {/* Related Advisory Resources */}
      <nav aria-label="Related advisory pages" className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
        <a
          href="/assessment"
          onClick={(e) => {
            e.preventDefault();
            onOpenAssessment();
          }}
          className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          Free Bankability Scorecard
        </a>
        <a
          href="/industries"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToPage?.('industries');
          }}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Explore Priority Sectors
        </a>
        <a
          href="/how-it-works"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToPage?.('how-it-works');
          }}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          6-Step Funding Process
        </a>
        <a
          href="/faq"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToPage?.('faq');
          }}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Greenfield Funding FAQs
        </a>
        <a
          href="/contact"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToPage?.('contact');
          }}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Contact Hyderabad Advisory Desk
        </a>
      </nav>
    </div>
  );
};
export default BlogsPage;
