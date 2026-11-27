import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageCircle, PhoneCall } from 'lucide-react';
import api from '../utils/apiClient';
import { FAQItem } from '../types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/Accordion';
import { Reveal } from './ui/MotionPrimitives';

interface FAQSectionProps {
  onOpenConsultation: () => void;
  onNavigateToPage?: (tab: string) => void;
  isStandalone?: boolean;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  onOpenConsultation,
  onNavigateToPage,
  isStandalone = false,
}) => {
  const CtaHeading = isStandalone ? 'h2' : 'h3';
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    api.faqs
      .getAll()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        setFaqs(list);
        if (list.length > 0) {
          setOpenId(list[0].id || list[0].faqId || 'faq_0');
        }
      })
      .catch((err) => {
        console.error('Failed to load FAQs:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white relative font-inter">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <p className="text-xs font-semibold tracking-wide text-blue-700 inline-flex items-center justify-center gap-1.5 font-inter">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Frequently Asked Questions · Project Appraisal</span>
          </p>
          {isStandalone ? (
            <h1
              className="font-manrope text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Frequently Asked Questions:{' '}
              <span className="text-blue-600">Greenfield Assessment &amp; Bankability</span>
            </h1>
          ) : (
            <h2
              className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Everything You Need to Know About{' '}
              <span className="text-blue-600">Greenfield Assessment &amp; Bankability</span>
            </h2>
          )}
          <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
            Clear, transparent answers from Inisio Capital on bank-grade DPR drafting, CMA financial modeling, bankability ratings, central and state government subsidies, and term loan underwriting across India.
          </p>
        </Reveal>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3 font-inter">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-200/90 p-5 sm:p-6 animate-pulse bg-white flex items-center justify-between gap-4"
              >
                <div className="h-5 w-2/3 bg-slate-200 rounded" />
                <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
              </div>
            ))}
          </div>
        ) : faqs.length > 0 ? (
          <Reveal delay={0.05}>
            <Accordion
              type="single"
              collapsible
              value={openId}
              onValueChange={(val) => setOpenId(val)}
              className="space-y-3"
            >
              {faqs.map((faq, idx) => {
                const currentId = faq.id || faq.faqId || `faq_${idx}`;
                return (
                  <AccordionItem key={currentId} value={currentId}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p>{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </Reveal>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 text-center text-slate-500 py-10 text-sm">
            No FAQs available currently.
          </div>
        )}

        {/* Still Have Questions CTA */}
        <Reveal delay={0.08}>
          <div className="mt-10 bg-slate-50/90 rounded-2xl p-6 sm:p-7 border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <CtaHeading className="font-manrope font-bold text-slate-900 text-sm sm:text-base">
                  Have a specific question about your project?
                </CtaHeading>
                <p className="font-inter text-xs sm:text-sm text-slate-600">
                  Speak directly with our senior greenfield advisory desk in Hyderabad.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenConsultation}
              className="min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-xs shrink-0 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span>Speak to a Banking Advisor</span>
            </button>
          </div>
        </Reveal>

        {isStandalone && onNavigateToPage && (
          <nav aria-label="Related advisory pages" className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
            <a
              href="/assessment"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('assessment'); }}
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Free Bankability Scorecard
            </a>
            <a
              href="/how-it-works"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('how-it-works'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              6-Step Funding Process
            </a>
            <a
              href="/about"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('about'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Why Choose Inisio Capital
            </a>
            <a
              href="/industries"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('industries'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Explore Priority Sectors
            </a>
            <a
              href="/blogs"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('blogs'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Advisory Blogs &amp; Research
            </a>
            <a
              href="/contact"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('contact'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Contact Hyderabad Advisory Desk
            </a>
          </nav>
        )}
      </div>
    </section>
  );
};
export default FAQSection;
