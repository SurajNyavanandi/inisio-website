import React, { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import api from '../utils/apiClient';
import { BlogPostItem } from '../types';
import { Reveal, StaggerGroup, StaggerItem } from './ui/MotionPrimitives';

interface LatestBlogsProps {
  onOpenAssessment: () => void;
  onOpenConsultation: () => void;
  onNavigateToBlogs: (slug?: string) => void;
}

export const BLOG_POSTS: BlogPostItem[] = [
  {
    slug: 'greenfield-dscr-underwriting-norms-2025',
    title: 'How PSU Banks Calculate DSCR for Greenfield Manufacturing in 2025',
    category: 'Debt Syndication',
    date: 'February 2025',
    readTime: '6 min read',
    excerpt:
      'Detailed breakdown of gross vs net debt service coverage ratios, acceptable moratorium tenures, and how credit risk rating models evaluate projected EBITDA.',
    featured: true,
  },
  {
    slug: 'central-state-subsidies-pmksy-food-processing',
    title: 'Unlocking PMKSY 35%-50% Grants for Agro-Processing & Cold Storage Units',
    category: 'Subsidies & Grants',
    date: 'January 2025',
    readTime: '5 min read',
    excerpt:
      'Step-by-step roadmap to integrating Ministry of Food Processing Industries (MoFPI) capital investment grants into your project Means of Finance.',
    featured: false,
  },
  {
    slug: 'solar-park-dpr-power-purchase-agreements',
    title: 'Key Technical & Financial Clauses That Make Solar DPRs 100% Bankable',
    category: 'Renewables',
    date: 'January 2025',
    readTime: '7 min read',
    excerpt:
      'Evaluating evacuation clearance, CUF generation models, and DISCOM payment escrow mechanisms to secure low-interest green loans from IREDA and SBI.',
    featured: false,
  },
];

export const LatestBlogs: React.FC<LatestBlogsProps> = ({ onNavigateToBlogs }) => {
  const [blogs, setBlogs] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.error('Failed to load blog insights:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      className="py-16 sm:py-20 bg-white border-t border-slate-100 font-inter"
      aria-labelledby="latest-insights-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-blue-700 inline-flex items-center gap-1.5 font-inter">
              <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Advisory Knowledge Hub</span>
            </p>
            <h2
              id="latest-insights-heading"
              className="font-manrope text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug"
              style={{ textWrap: 'balance' }}
            >
              Latest Insights on Debt Syndication &amp; Project Financing
            </h2>
          </div>

          <a
            href="/blogs"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToBlogs();
            }}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5 cursor-pointer font-inter shrink-0 whitespace-nowrap group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            <span>View All Articles</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden animate-pulse"
              >
                <div className="h-32 bg-slate-100" />
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-4 w-16 bg-slate-100 rounded" />
                  </div>
                  <div className="h-5 w-4/5 bg-slate-200 rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-100 rounded" />
                    <div className="h-4 w-5/6 bg-slate-100 rounded" />
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <div className="h-4 w-20 bg-slate-100 rounded" />
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length > 0 ? (
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter">
            {blogs.slice(0, 3).map((blog) => {
              const coverUrl = (blog as any).coverImage || (blog as any).image || '';

              return (
                <StaggerItem key={blog.slug} className="h-full">
                  <article className="h-full bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 hover:shadow-[0_18px_36px_-16px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden group">
                    <a
                      href={`/blogs/${blog.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigateToBlogs(blog.slug);
                      }}
                      className="flex flex-col h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                    >
                      {/* Visual Top Frame with Smooth Zoom on Hover */}
                      <div className="relative h-36 w-full overflow-hidden bg-slate-100 border-b border-slate-100 shrink-0">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={blog.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="relative w-full h-full bg-[#0B2A6B] bg-gradient-to-br from-[#0B2A6B] via-[#133E96] to-[#1D4ED8] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-section-grid-dark opacity-70" />
                            <BookOpen className="relative z-10 w-9 h-9 text-sky-200/80" />
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex flex-col justify-between flex-1">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-blue-700">{blog.category}</span>
                            {blog.readTime && (
                              <>
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  {blog.readTime}
                                </span>
                              </>
                            )}
                          </div>

                          <h3 className="font-manrope font-bold text-base sm:text-lg text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                            {blog.title}
                          </h3>

                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                            {blog.excerpt}
                          </p>
                        </div>

                        <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">{blog.date}</span>
                          <span className="font-semibold text-blue-600 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Read Analysis <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </a>
                  </article>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        ) : (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            No advisory articles published yet.
          </div>
        )}
      </div>
    </section>
  );
};
export default LatestBlogs;
