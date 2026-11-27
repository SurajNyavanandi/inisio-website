import React, { useState, useEffect } from 'react';
import { saveLeadRecord } from '../utils/leadStore';
import api from '../utils/apiClient';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { validateIndianMobileNumber } from '../utils/validation';
import { UISelect } from './ui/Select';
import { Reveal } from './ui/MotionPrimitives';

interface ContactSectionProps {
  isStandalone?: boolean;
  onNavigateToPage?: (tab: string) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  isStandalone = false,
  onNavigateToPage,
}) => {
  const FormHeading = isStandalone ? 'h2' : 'h3';
  const [submitted, setSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    projectType: '',
    investmentAmount: '',
    loanRequirement: '',
    location: '',
    projectStage: '',
    message: '',
  });

  const [sectors, setSectors] = useState<string[]>([
    'Manufacturing',
    'Food Processing & Cold Chain',
    'Healthcare & Hospitals',
    'Solar & Renewable Energy',
    'Infrastructure & Warehousing',
    'Textiles & Apparel',
    'Other Sector',
  ]);

  useEffect(() => {
    let isMounted = true;
    api.industries
      .getAll()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : (data as any)?.data || [];
        const names = list.map((item: any) => item.name).filter(Boolean);
        if (names.length > 0) {
          setSectors(names);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    const phoneValidation = validateIndianMobileNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(
        phoneValidation.error || 'Please enter a valid 10-digit Indian mobile number'
      );
      return;
    }
    setSubmitted(true);

    api.contact
      .sendMessage({
        fullName: formData.fullName || 'Contact Inquiry',
        email: formData.email,
        phone: formData.phone,
        message: `Sector: ${formData.projectType || 'N/A'} | Capex: ₹${formData.investmentAmount || '0'} Cr | Loan: ₹${formData.loanRequirement || '0'} Cr | Location: ${formData.location || 'India'} | Stage: ${formData.projectStage || 'N/A'} | Summary: ${formData.message || 'N/A'}`,
        subject: `Project Consultation Request - ${formData.projectType || 'Greenfield'}`,
      })
      .catch(() => undefined);

    await saveLeadRecord({
      fullName: formData.fullName || 'Contact Lead',
      mobile: formData.phone || 'N/A',
      email: formData.email || 'N/A',
      projectName: `${formData.projectType || 'Greenfield'} Consultation Request`,
      industry: formData.projectType || 'General Sector',
      location: formData.location || 'India',
      totalCostCr: formData.investmentAmount || 'N/A',
      loanRequiredCr: formData.loanRequirement || 'N/A',
      stage: formData.projectStage || 'Preliminary Review',
      source: 'Project Consultation Request',
      downloadedPDF: false,
      notes: formData.message,
    });
  };

  return (
    <section
      id="contact"
      className="py-16 sm:py-24 bg-slate-50/70 bg-section-dots border-t border-slate-200/80 relative font-inter"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-14">
        {/* Section Header */}
        <Reveal className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-semibold tracking-wide text-blue-700 inline-flex items-center justify-center gap-2 font-inter">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Contact Inisio · Project Consultation</span>
          </p>
          {isStandalone ? (
            <h1
              className="font-manrope text-3xl sm:text-4xl font-extrabold text-slate-900 leading-[1.15] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Request a Project Consultation
            </h1>
          ) : (
            <h2
              className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-[1.15] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Request a Project Consultation
            </h2>
          )}
          <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
            Connect with project finance professionals for feasibility, DPR, CMA, TEV and debt funding requirements.
          </p>
        </Reveal>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Contact Inisio */}
          <Reveal className="lg:col-span-5 flex flex-col justify-between gap-4 font-inter text-left">
            <div className="space-y-4">
              {isStandalone ? (
                <h2 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Contact Inisio
                </h2>
              ) : (
                <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Contact Inisio
                </h3>
              )}

              <div className="space-y-3.5">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 transition-all duration-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-manrope font-bold text-slate-900 block text-sm">
                      Corporate office – Madhapur, Hyderabad
                    </span>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      2nd Floor, Plot 24 &amp; 25, Kakatiya Hills, Road No 9, Madhapur, Hyderabad, Telangana - 500081
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 transition-all duration-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-manrope font-bold text-slate-900 block text-sm">
                      Consultation helpline
                    </span>
                    <a
                      href="tel:+916302026462"
                      className="text-blue-700 font-semibold hover:underline text-sm tabular-nums"
                    >
                      +91 63020 26462
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 transition-all duration-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-manrope font-bold text-slate-900 block text-sm">
                      Direct Email
                    </span>
                    <a
                      href="mailto:advisory@inisio.in"
                      className="text-slate-900 font-semibold hover:text-blue-700 hover:underline text-sm"
                    >
                      advisory@inisio.in
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 transition-all duration-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-manrope font-bold text-slate-900 block text-sm">
                      Working hours
                    </span>
                    <p className="text-slate-600 text-xs sm:text-sm">
                      Monday - Saturday | 9:30 AM - 6:30 PM IST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-manrope font-bold text-sm text-slate-900">
                  Preliminary Consultation Notice
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Free initial consultation request. Subject to availability and preliminary review. No funding assurance or loan sanction guarantee.
              </p>
            </div>
          </Reveal>

          {/* Right Column: Project Consultation Request Form */}
          <Reveal delay={0.08} className="lg:col-span-7">
            <div className="h-full bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 shadow-[0_12px_36px_-18px_rgba(15,23,42,0.12)] text-left">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <FormHeading className="text-2xl font-bold text-slate-900 font-manrope">
                    Consultation Request Received
                  </FormHeading>
                  <p className="text-base text-slate-600 font-inter max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{formData.fullName}</strong>. Your project consultation request has been logged for preliminary review, subject to availability.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="min-h-[44px] px-6 py-3 text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 font-inter">
                  <div className="border-b border-slate-100 pb-4">
                    <FormHeading className="text-lg sm:text-xl font-bold text-slate-900 font-manrope">
                      Project Consultation Request
                    </FormHeading>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Share your project requirements to help us understand your needs and identify the appropriate advisory support.
                    </p>
                  </div>

                  {phoneError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
                    >
                      {phoneError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-full-name" className="text-xs font-semibold text-slate-700 block">
                        Name *
                      </label>
                      <input
                        id="contact-full-name"
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full min-h-[44px] px-4 py-2.5 text-sm bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="contact-email" className="text-xs font-semibold text-slate-700 block">
                        Email *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        placeholder="e.g. ramesh@enterprise.in"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full min-h-[44px] px-4 py-2.5 text-sm bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-phone" className="text-xs font-semibold text-slate-700 block">
                        Mobile *
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (phoneError) setPhoneError('');
                        }}
                        className={`w-full min-h-[44px] px-4 py-2.5 text-sm ${
                          phoneError
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-slate-200 bg-slate-50/50 focus:bg-white'
                        } border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Sector
                      </label>
                      <UISelect
                        value={formData.projectType}
                        onValueChange={(val) => setFormData({ ...formData, projectType: val })}
                        placeholder="Select Industry Sector"
                        options={sectors.map((sector) => ({ value: sector, label: sector }))}
                        triggerClassName="h-11 bg-slate-50/50 border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-investment" className="text-xs font-semibold text-slate-700 block">
                        Project Cost (₹ Cr) *
                      </label>
                      <input
                        id="contact-investment"
                        type="text"
                        required
                        placeholder="e.g. 25 Cr"
                        value={formData.investmentAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, investmentAmount: e.target.value })
                        }
                        className="w-full min-h-[44px] px-4 py-2.5 text-sm bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="contact-loan" className="text-xs font-semibold text-slate-700 block">
                        Loan Requirement (₹ Cr) *
                      </label>
                      <input
                        id="contact-loan"
                        type="text"
                        required
                        placeholder="e.g. 18 Cr"
                        value={formData.loanRequirement}
                        onChange={(e) =>
                          setFormData({ ...formData, loanRequirement: e.target.value })
                        }
                        className="w-full min-h-[44px] px-4 py-2.5 text-sm bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-location" className="text-xs font-semibold text-slate-700 block">
                        Location (City, State)
                      </label>
                      <input
                        id="contact-location"
                        type="text"
                        placeholder="e.g. Hyderabad, Telangana"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full min-h-[44px] px-4 py-2.5 text-sm bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Project Stage
                      </label>
                      <UISelect
                        value={formData.projectStage}
                        onValueChange={(val) => setFormData({ ...formData, projectStage: val })}
                        placeholder="Select Project Stage"
                        options={[
                          'Idea / Concept Stage',
                          'Land Identification / Acquisition',
                          'DPR / CMA Preparation Needed',
                          'TEV Study / Financial Modeling',
                          'Ready to Approach Lenders',
                          'Expansion of Existing Unit',
                        ]}
                        triggerClassName="h-11 bg-slate-50/50 border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-message" className="text-xs font-semibold text-slate-700 block">
                      Project Summary
                    </label>
                    <textarea
                      id="contact-message"
                      rows={3}
                      placeholder="Briefly describe your project requirements, land status, or support needed..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full min-h-[46px] py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] rounded-xl shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition-all cursor-pointer inline-flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    <span>Request a Project Consultation</span>
                  </button>

                  <p className="text-[11px] text-slate-500 text-center pt-1">
                    Free initial consultation request · Subject to availability and preliminary review. No funding assurance.
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>

        {isStandalone && onNavigateToPage && (
          <nav aria-label="Related advisory pages" className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
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
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Promoter Membership Plans
            </a>
            <a
              href="/how-it-works"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('how-it-works'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Your Project Journey
            </a>
            <a
              href="/faq"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('faq'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Project Appraisal FAQs
            </a>
          </nav>
        )}
      </div>
    </section>
  );
};
export default ContactSection;
