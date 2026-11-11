import React, { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Clock, Loader2 } from 'lucide-react';
import api from '../utils/apiClient';
import { BlogPostItem } from '../types';

interface LatestBlogsProps {
  onOpenAssessment: () => void;
  onOpenConsultation: () => void;
  onNavigateToBlogs: (slug?: string) => void;
}

export const LatestBlogs: React.FC<LatestBlogsProps> = ({
  onNavigateToBlogs
}) => {
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200/90 p-6 animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-slate-200 rounded-full" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter">
          {blogs.slice(0, 3).map((blog) => (
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
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          No advisory articles published yet.
        </div>
      )}
    </div>
  );
};
export default LatestBlogs;
