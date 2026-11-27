import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageCircle, PhoneCall, ShieldCheck } from 'lucide-react';
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

const FALLBACK_PROJECT_APPRAISAL_FAQS: FAQItem[] = [
  {
    faqId: 'faq_1',
    question: '1. What is a Project Appraisal?',
    answer:
      'Project Appraisal is a preliminary evaluation of your proposed project to understand its financial viability, funding structure and readiness for approaching banks or financial institutions.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_2',
    question: '2. Who can use Inisio for Project Appraisal?',
    answer:
      'Promoters planning a new greenfield project, expanding an existing business or undertaking a new business venture can use Inisio to assess their project.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_3',
    question: '3. Is the first project assessment free?',
    answer:
      'Yes. Your first project assessment on Inisio is free. You can enter your project details and receive preliminary bankability insights before deciding on further professional assistance.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_4',
    question: '4. What information do I need to provide?',
    answer:
      'You will generally need to provide:\n• Project details and proposed location\n• Nature of business and industry\n• Estimated project cost\n• Promoter contribution or available equity\n• Proposed debt requirement\n• Other sources of funding, if any\n• Current project status\nSupporting documents can help improve the quality of the assessment.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_5',
    question: '5. What does Inisio evaluate during Project Appraisal?',
    answer:
      'The assessment may consider:\n• Project cost and capital expenditure\n• Means of finance\n• Debt-to-equity structure\n• Promoter contribution\n• Indicative debt servicing capacity and DSCR\n• Project readiness and key information gaps',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_6',
    question: '6. Does Inisio provide a bankability score?',
    answer:
      'Yes. Inisio provides an indicative bankability assessment based on the information submitted. It helps identify areas that may require attention before approaching lenders.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_7',
    question: '7. Does a good bankability score guarantee a bank loan?',
    answer:
      'No. The assessment is indicative and does not represent a credit rating, loan eligibility confirmation or sanction. Final lending decisions are made independently by banks and financial institutions after their appraisal and due diligence.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_8',
    question: '8. Do I need to prepare a DPR before using Inisio?',
    answer:
      'No. You can begin with the basic project information available to you. The initial assessment helps identify whether additional documentation, such as a Detailed Project Report (DPR), CMA data or TEV study, may be required.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_9',
    question: '9. Can Inisio help me find DPR, CMA and TEV consultants?',
    answer:
      'Yes. Inisio facilitates connections with independent Chartered Accountants and specialised consultants who offer services such as DPR preparation, CMA data, TEV studies and debt syndication. You can review available professionals and request a consultation.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_10',
    question: '10. Does Inisio prepare DPRs or arrange bank loans directly?',
    answer:
      'Inisio is a technology platform for project assessment and professional connections. DPR preparation, technical studies, financial advisory and debt syndication services are provided by independent professionals or separately engaged advisory partners.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_11',
    question: '11. Can I generate a project teaser through Inisio?',
    answer:
      'Yes. Inisio can generate a preliminary project teaser in editable Word format using the information submitted on the platform. You should review and verify the contents before sharing it with consultants, banks or other parties.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_12',
    question: '12. Can I track my project after completing the assessment?',
    answer:
      'Yes. Your project workspace helps you maintain project information, documents, consultant interactions and progress updates in one place.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_13',
    question: '13. Can I assess an expansion or an existing business?',
    answer:
      'Yes. Inisio can be used for greenfield projects as well as expansion and other business funding requirements, subject to the information and assessment options available on the platform.',
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_14',
    question: '14. Does Inisio guarantee project funding or loan sanction?',
    answer:
      "No. Inisio does not guarantee project viability, lender acceptance, loan sanction or disbursement. These depend on the project's merits, promoter credentials, documentation and the independent assessment of the lender.",
    category: 'Project Appraisal',
  },
  {
    faqId: 'faq_15',
    question: '15. What happens if my project has gaps?',
    answer:
      'The assessment helps identify areas that may need further attention. You can then consider engaging relevant professionals to strengthen the project documentation, financial structure or technical evaluation before approaching lenders.',
    category: 'Project Appraisal',
  },
];

const renderFormattedAnswer = (answer: string) => {
  const lines = String(answer || '').split('\n').filter(Boolean);
  if (lines.length <= 1) {
    return <p>{answer}</p>;
  }
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) =>
        line.trim().startsWith('•') ? (
          <div key={i} className="flex items-start gap-2 pl-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>{line.replace(/^•\s*/, '')}</span>
          </div>
        ) : (
          <p key={i}>{line}</p>
        )
      )}
    </div>
  );
};

export const FAQSection: React.FC<FAQSectionProps> = ({
  onOpenConsultation,
  onNavigateToPage,
  isStandalone = false,
}) => {
  const CtaHeading = isStandalone ? 'h2' : 'h3';
  const [faqs, setFaqs] = useState<FAQItem[]>(FALLBACK_PROJECT_APPRAISAL_FAQS);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string>('faq_1');

  useEffect(() => {
    let isMounted = true;
    api.faqs
      .getAll()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        if (list.length >= 15) {
          setFaqs(list);
          setOpenId(list[0].id || list[0].faqId || 'faq_1');
        }
      })
      .catch(() => {
        // Use structured Project Appraisal FAQ defaults cleanly
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
              <span className="text-blue-600">Project Appraisal</span>
            </h1>
          ) : (
            <h2
              className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Frequently Asked Questions:{' '}
              <span className="text-blue-600">Project Appraisal</span>
            </h2>
          )}
          <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
            Clear answers on how project appraisal works on Inisio, indicative bankability assessments, editable project teasers, and connecting with independent CAs and consultants.
          </p>
        </Reveal>

        {loading && faqs.length === 0 ? (
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
        ) : (
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
                    <AccordionContent>{renderFormattedAnswer(faq.answer)}</AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </Reveal>
        )}

        {/* Important Disclaimer */}
        <Reveal delay={0.06}>
          <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Important Disclaimer</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Project Appraisal on Inisio is a preliminary, indicative assessment based on information provided by the promoter. It is not a statutory valuation, formal credit rating, detailed technical feasibility study, lender appraisal or loan sanction recommendation. The accuracy and usefulness of the assessment depend on the completeness and correctness of the information submitted. Final decisions on project viability and funding remain with the promoter and the relevant financial institutions.
            </p>
          </div>
        </Reveal>

        {/* Still Have Questions CTA */}
        <Reveal delay={0.08}>
          <div className="mt-8 bg-slate-50/90 rounded-2xl p-6 sm:p-7 border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <CtaHeading className="font-manrope font-bold text-slate-900 text-sm sm:text-base">
                  Have a specific question about your project?
                </CtaHeading>
                <p className="font-inter text-xs sm:text-sm text-slate-600">
                  Request a preliminary consultation for feasibility, DPR, CMA, TEV, or funding requirements.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenConsultation}
              className="min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-xs shrink-0 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span>Request a Project Consultation</span>
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
              Start Free Assessment
            </a>
            <a
              href="/pricing"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('pricing'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Membership Plans
            </a>
            <a
              href="/how-it-works"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('how-it-works'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Your Project Journey
            </a>
            <a
              href="/contact"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('contact'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Request Consultation
            </a>
          </nav>
        )}
      </div>
    </section>
  );
};
export default FAQSection;
