import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  HelpCircle,
  MessageCircle,
  PhoneCall,
  Loader2
} from 'lucide-react';
import api from '../utils/apiClient';
import { FAQItem } from '../types';

interface FAQSectionProps {
  onOpenConsultation: () => void;
  isStandalone?: boolean;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  onOpenConsultation,
  isStandalone = false
}) => {
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

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? '' : id);
  };

  return (
    <section id="faq" className="py-20 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 flex items-center justify-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Frequently Asked Questions · Project Appraisal</span>
          </p>
          {isStandalone ? (
            <h1 className="font-manrope text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
              Frequently Asked Questions: <span className="text-blue-600">Greenfield Assessment &amp; Bankability</span>
            </h1>
          ) : (
            <h2 className="font-manrope text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
              Everything You Need to Know About <span className="text-blue-600">Greenfield Assessment &amp; Bankability</span>
            </h2>
          )}
          <p className="font-inter text-sm text-slate-600 leading-relaxed">
            Clear, transparent answers from Inisio Capital on bank-grade DPR drafting, CMA financial modeling, bankability ratings, central and state government subsidies, and term loan underwriting across India.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3 font-inter">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 p-5 animate-pulse bg-white space-y-2">
                <div className="h-5 w-2/3 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : faqs.length > 0 ? (
          /* Accordion Items List */
          <div className="space-y-3 font-inter">
            {faqs.map((faq, idx) => {
              const currentId = faq.id || faq.faqId || `faq_${idx}`;
              const isOpen = openId === currentId;

              return (
                <div
                  key={currentId}
                  className={`rounded-2xl transition-all duration-200 overflow-hidden bg-white ${
                    isOpen
                      ? 'border border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                      : 'border border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(currentId)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-manrope font-bold text-sm sm:text-base text-slate-900 group cursor-pointer"
                  >
                    <span className="group-hover:text-blue-700 transition-colors leading-snug">
                      {faq.question}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? 'bg-blue-100 text-blue-700 rotate-180'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 sm:p-6 pt-0 text-sm text-slate-600 font-normal leading-relaxed border-t border-slate-100 mt-1 font-inter">
                          <p>{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">
            No FAQs available currently.
          </div>
        )}

        {/* Still Have Questions CTA */}
        <div className="mt-10 bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-manrope font-bold text-slate-900 text-sm">Have a specific question about your project?</h3>
              <p className="font-inter text-xs text-slate-500">Speak directly with our senior greenfield advisory desk in Hyderabad.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenConsultation}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Speak to a Banking Advisor</span>
          </button>
        </div>
      </div>
    </section>
  );
};
export default FAQSection;
