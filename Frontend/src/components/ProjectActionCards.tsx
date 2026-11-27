import React from 'react';
import { Reveal } from './ui/MotionPrimitives';

interface ProjectActionCardsProps {
  onNavigateToAbout: () => void;
  onNavigateToContact: () => void;
}

export const ProjectActionCards: React.FC<ProjectActionCardsProps> = ({
  onNavigateToAbout,
  onNavigateToContact,
}) => {
  return (
    <section className="py-12 sm:py-16 bg-slate-50/70 bg-section-dots border-y border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 max-w-5xl mx-auto items-start">
          {/* Card 1: Left Column */}
          <Reveal>
            <a
              href="/about"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToAbout();
              }}
              aria-label="Learn why greenfield promoters partner with Inisio Capital for DPR and debt advisory"
              className="group block cursor-pointer rounded-3xl overflow-hidden bg-white p-2.5 sm:p-3 border border-slate-200/90 shadow-[0_6px_24px_-12px_rgba(15,23,42,0.12)] hover:shadow-[0_20px_40px_-18px_rgba(37,99,235,0.22)] hover:border-blue-300/90 hover:-translate-y-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <div className="rounded-2xl overflow-hidden bg-slate-50">
                <img
                  src="https://res.cloudinary.com/aessymvl/image/upload/v1786723928/WhatsApp_Image_2026-08-14_at_9.41.08_PM_qb41zh.jpg"
                  alt="Inisio Capital Greenfield Project Advisory, Bankable DPR Preparation, and Debt Syndication in India"
                  loading="lazy"
                  decoding="async"
                  width={420}
                  height={260}
                  className="w-full h-auto object-contain block group-hover:scale-[1.03] transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            </a>
          </Reveal>

          {/* Card 2: Staggered Right Column (collapses cleanly on mobile) */}
          <Reveal delay={0.08} className="md:mt-8">
            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToContact();
              }}
              aria-label="Contact Inisio Capital Project Finance Desk in Madhapur, Hyderabad"
              className="group block cursor-pointer rounded-3xl overflow-hidden bg-white p-2.5 sm:p-3 border border-slate-200/90 shadow-[0_6px_24px_-12px_rgba(15,23,42,0.12)] hover:shadow-[0_20px_40px_-18px_rgba(37,99,235,0.22)] hover:border-blue-300/90 hover:-translate-y-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <div className="rounded-2xl overflow-hidden bg-slate-50">
                <img
                  src="https://res.cloudinary.com/aessymvl/image/upload/v1786723927/WhatsApp_Image_2026-08-14_at_9.41.14_PM_m1cokg.jpg"
                  alt="Partner With Inisio Capital - Institutional Project Finance Syndicate Desk in Hyderabad"
                  loading="lazy"
                  decoding="async"
                  width={420}
                  height={260}
                  className="w-full h-auto object-contain block group-hover:scale-[1.03] transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
export default ProjectActionCards;
