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
    message: '',
  });

  const [sectors, setSectors] = useState<string[]>([]);

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
      .catch((err) => {
        console.error('Failed to load industries in contact section:', err);
      });

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

    // 1. Send to Backend Express API / MongoDB contact collection
    api.contact
      .sendMessage({
        fullName: formData.fullName || 'Contact Inquiry',
        email: formData.email,
        phone: formData.phone,
        message: `Sector: ${formData.projectType || 'N/A'} | Capex: ₹${formData.investmentAmount || '0'} Cr | Loan: ₹${formData.loanRequirement || '0'} Cr | Message: ${formData.message || 'N/A'}`,
        subject: `Project Inquiry - ${formData.projectType || 'Greenfield'}`,
      })
      .catch(() => undefined);

    // 2. Save into Live Admin Lead Store (shows on Admin Dashboard immediately)
    await saveLeadRecord({
      fullName: formData.fullName || 'Contact Lead',
      mobile: formData.phone || 'N/A',
      email: formData.email || 'N/A',
      projectName: `${formData.projectType || 'Greenfield'} Project Inquiry`,
      industry: formData.projectType || 'General Sector',
      location: 'India',
      totalCostCr: formData.investmentAmount || 'N/A',
      loanRequiredCr: formData.loanRequirement || 'N/A',
      source: 'Contact Form Submitted',
      downloadedPDF: false,
      notes: formData.message,
    });

    // 3. Open WhatsApp chat with pre-filled message
    const text =
      `*NEW CONTACT & ADVISORY BRIEF* 📩\n\n` +
      `• Name: ${formData.fullName}\n` +
      `• Phone: ${formData.phone}\n` +
      `• Email: ${formData.email}\n` +
      `• Sector/Industry: ${formData.projectType}\n` +
      `• Investment/Capex: ₹ ${formData.investmentAmount} Cr\n` +
      `• Required Loan: ₹ ${formData.loanRequirement} Cr\n` +
      (formData.message ? `• Summary/Notes: ${formData.message}` : '');

    window.open(`https://wa.me/916302026462?text=${encodeURIComponent(text)}`, '_blank');
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
            <span>Senior Advisory Desk · Greenfield Capital</span>
          </p>
          {isStandalone ? (
            <h1
              className="font-manrope text-3xl sm:text-4xl font-extrabold text-slate-900 leading-[1.15] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Contact Inisio Capital Advisory | Hyderabad Desk
            </h1>
          ) : (
            <h2
              className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-[1.15] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Book Your Free Advisory Call
            </h2>
          )}
          <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
            Discuss your greenfield project feasibility, Detailed Project Report (DPR), CMA modeling, and bank loan syndication with Inisio Capital&apos;s senior advisory desk in Madhapur, Hyderabad, serving promoters across Telangana and India.
          </p>
        </Reveal>

        {/* Two-Column Zig-Zag Layout (Info Cards Left, Form Card Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Contact Info Cards */}
          <Reveal className="lg:col-span-5 flex flex-col justify-between gap-4 font-inter text-left">
            <div className="space-y-4">
              {isStandalone ? (
                <h2 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Inisio Advisory Headquarters
                </h2>
              ) : (
                <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Inisio Advisory Headquarters
                </h3>
              )}

              <div className="space-y-3.5">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-manrope font-bold text-slate-900 block text-sm">
                      Corporate Address
                    </span>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      2nd Floor, Plot 24 &amp; 25, Kakatiya Hills, Road No 9, Madhapur, Hyderabad, Telangana - 500081
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-manrope font-bold text-slate-900 block text-sm">
                      Consultation Helpline
                    </span>
                    <a
                      href="tel:+916302026462"
                      className="text-blue-700 font-semibold hover:underline text-sm tabular-nums"
                    >
                      +91 63020 26462
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-manrope font-bold text-slate-900 block text-sm">
                      Direct Email
                    </span>
                    {/* TODO: Confirm official contact email (advisory@inisio.in here vs contact@inisio.com in Footer) */}
                    <a
                      href="mailto:advisory@inisio.in"
                      className="text-slate-900 font-semibold hover:text-blue-700 hover:underline text-sm"
                    >
                      advisory@inisio.in
                    </a>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] hover:border-blue-300/90 hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-manrope font-bold text-slate-900 block text-sm">
                      Working Hours
                    </span>
                    {/* TODO: Confirm official office hours (9:00 AM - 7:00 PM here vs 9:30 AM - 6:30 PM in Footer & index.html) */}
                    <p className="text-slate-600 text-xs sm:text-sm">
                      Monday - Saturday | 9:00 AM - 7:00 PM IST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Confidentiality Guarantee */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)] space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-manrope font-bold text-sm text-slate-900">
                  100% Confidentiality Guaranteed
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict Non-Disclosure Agreement (NDA) applied for all greenfield briefs and proprietary financials.
              </p>
            </div>
          </Reveal>

          {/* Right Column: Contact Form Card */}
          <Reveal delay={0.08} className="lg:col-span-7">
            <div className="h-full bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 shadow-[0_12px_36px_-18px_rgba(15,23,42,0.12)] text-left">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <FormHeading className="text-2xl font-bold text-slate-900 font-manrope">
                    Consultation Booked Successfully!
                  </FormHeading>
                  <p className="text-base text-slate-600 font-inter max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{formData.fullName}</strong>. A Senior Greenfield Advisor will review your project brief and reach out within 2 business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="min-h-[44px] px-6 py-3 text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Submit Another Project Brief
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 font-inter">
                  <div className="border-b border-slate-100 pb-4">
                    <FormHeading className="text-lg sm:text-xl font-bold text-slate-900 font-manrope">
                      Project Consultation Form
                    </FormHeading>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Fill in your project requirements to request an underwriting review.
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
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-full-name"
                        className="text-xs font-semibold text-slate-700 block"
                      >
                        Full Name *
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

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-email"
                        className="text-xs font-semibold text-slate-700 block"
                      >
                        Email Address *
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
                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-phone"
                        className="text-xs font-semibold text-slate-700 block"
                      >
                        Phone Number *
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

                    {/* Project Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Project Type / Sector *
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
                    {/* Investment Amount */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-investment"
                        className="text-xs font-semibold text-slate-700 block"
                      >
                        Total Project Capex (₹ Cr) *
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

                    {/* Loan Requirement */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-loan"
                        className="text-xs font-semibold text-slate-700 block"
                      >
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

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-message"
                      className="text-xs font-semibold text-slate-700 block"
                    >
                      Project Summary / Notes
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      placeholder="Enter details about land status, equipment suppliers, or target disbursement timeline..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-slate-50/50 focus:bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    className="w-full min-h-[46px] py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] rounded-xl shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition-all cursor-pointer inline-flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    <span>Book Free Advisory Call</span>
                  </button>
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
              Free Bankability Scorecard
            </a>
            <a
              href="/how-it-works"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('how-it-works'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              6-Step Funding Process
            </a>
            <a
              href="/about"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('about'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Why Choose Inisio Capital
            </a>
            <a
              href="/industries"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('industries'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Explore Priority Sectors
            </a>
            <a
              href="/blogs"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('blogs'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Advisory Blogs &amp; Research
            </a>
            <a
              href="/faq"
              onClick={(e) => { e.preventDefault(); onNavigateToPage('faq'); }}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Greenfield Funding FAQs
            </a>
          </nav>
        )}
      </div>
    </section>
  );
};
export default ContactSection;
