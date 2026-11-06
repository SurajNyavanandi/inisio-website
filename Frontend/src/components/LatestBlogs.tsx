import React from 'react';
import { ArrowRight, BookOpen, Clock, Calendar, Sparkles } from 'lucide-react';

interface LatestBlogsProps {
  onOpenAssessment: () => void;
  onOpenConsultation: () => void;
  onNavigateToBlogs: (slug?: string) => void;
}

export const BLOG_POSTS = [
  {
    slug: 'greenfield-dscr-underwriting-norms-2025',
    title: 'How PSU Banks Calculate DSCR for Greenfield Manufacturing in 2025',
    category: 'Debt Syndication',
    date: 'February 2025',
    readTime: '6 min read',
    excerpt: 'Detailed breakdown of gross vs net debt service coverage ratios, acceptable moratorium tenures, and how credit risk rating models evaluate projected EBITDA.',
    featured: true
  },
  {
    slug: 'central-state-subsidies-pmksy-food-processing',
    title: 'Unlocking PMKSY 35%-50% Grants for Agro-Processing & Cold Storage Units',
    category: 'Subsidies & Grants',
    date: 'January 2025',
    readTime: '5 min read',
    excerpt: 'Step-by-step roadmap to integrating Ministry of Food Processing Industries (MoFPI) capital investment grants into your project Means of Finance.',
    featured: false
  },
  {
    slug: 'solar-park-dpr-power-purchase-agreements',
    title: 'Key Technical & Financial Clauses That Make Solar DPRs 100% Bankable',
    category: 'Renewables',
    date: 'January 2025',
    readTime: '7 min read',
    excerpt: 'Evaluating evacuation clearance, CUF generation models, and DISCOM payment escrow mechanisms to secure low-interest green loans from IREDA and SBI.',
    featured: false
  }
];

export const LatestBlogs: React.FC<LatestBlogsProps> = ({
  onOpenAssessment,
  onOpenConsultation,
  onNavigateToBlogs
}) => {
  return (
    <div className="pt-12 sm:pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 flex items-center gap-1.5 font-inter">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Advisory Knowledge Hub</span>
          </p>
          <h3 className="font-manrope text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Latest Insights on Debt Syndication &amp; Project Financing
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onNavigateToBlogs()}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer font-inter shrink-0"
        >
          <span>View All Articles</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter">
        {BLOG_POSTS.map((blog) => (
          <article
            key={blog.slug}
            onClick={() => onNavigateToBlogs(blog.slug)}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 hover:border-blue-400 hover:shadow-sm transition-all duration-200 flex flex-col justify-between cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {blog.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {blog.readTime}
                </span>
              </div>

              <h4 className="font-manrope font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                {blog.title}
              </h4>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {blog.excerpt}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">{blog.date}</span>
              <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Read Analysis <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
