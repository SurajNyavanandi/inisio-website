import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TESTIMONIALS } from '../data/landingData';
import {
  Star,
  Building2,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  Quote
} from 'lucide-react';

export const Testimonials: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  const industries = ['All', 'Manufacturing', 'Healthcare', 'Food Processing', 'Solar & Renewable'];

  const filteredTestimonials = selectedIndustry === 'All'
    ? TESTIMONIALS
    : TESTIMONIALS.filter(t => t.industry === selectedIndustry);

  // Reset current index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedIndustry]);

  // Autoplay interval
  useEffect(() => {
    if (!isAutoplay || filteredTestimonials.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoplay, filteredTestimonials.length]);

  const handlePrev = () => {
    setIsAutoplay(false);
    setCurrentIndex((prev) => (prev === 0 ? filteredTestimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsAutoplay(false);
    setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
  };

  const currentItem = filteredTestimonials[currentIndex] || TESTIMONIALS[0];

  return (
    <section id="testimonials" className="pt-14 sm:pt-20 pb-12 sm:pb-16 bg-slate-50/60 border-t border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Minimalist Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 flex items-center justify-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>Client Track Record · Bank-Sanctioned Case Studies</span>
          </p>
          <h2 className="font-manrope text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Proven Greenfield Project Appraisals
          </h2>
          <p className="font-inter text-sm text-slate-600 leading-relaxed">
            Verified founder feedback on debt syndication, DPR preparation, and commercial bank sanction timelines.
          </p>

          {/* Industry Filter Segmented Control */}
          <div className="pt-3 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
              {industries.map((ind) => (
                <button
                  type="button"
                  key={ind}
                  onClick={() => setSelectedIndustry(ind)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedIndustry === ind
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Interactive Carousel */}
        <div className="max-w-5xl mx-auto relative px-2 sm:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentItem.id}-${currentIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm relative space-y-6"
            >
              <Quote className="absolute top-6 right-6 w-12 h-12 text-blue-100/70 pointer-events-none" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Rating */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(currentItem.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-1">5.0 / 5.0</span>
                </div>

                {/* Funding Secured */}
                <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentItem.fundingAmount} Debt Sanctioned</span>
                </div>
              </div>

              {/* Minimalist Quote */}
              <p className="font-inter text-base sm:text-lg text-slate-800 font-normal leading-relaxed italic">
                "{currentItem.quote}"
              </p>

              {/* Promoter Author Info */}
              <div className="pt-5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4 font-inter">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-manrope font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {currentItem.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-manrope font-bold text-sm text-slate-900">
                      {currentItem.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {currentItem.title}, <span className="font-semibold text-slate-700">{currentItem.company}</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-0 sm:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200/90 shadow-md text-gray-700 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition-all cursor-pointer z-10"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 sm:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200/90 shadow-md text-gray-700 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition-all cursor-pointer z-10"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {filteredTestimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsAutoplay(false);
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 bg-blue-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Minimal Turnaround Badge */}
        <div className="mt-6 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50/80 rounded-2xl border border-blue-100 text-xs text-blue-900 font-semibold">
            <Award className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Average Credit Approval Turnaround Time: 28 Days</span>
          </div>
        </div>

      </div>
    </section>
  );
};
