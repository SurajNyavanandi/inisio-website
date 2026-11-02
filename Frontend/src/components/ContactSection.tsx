import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { MAIN_SECTORS } from '../data/landingData';
import { validateIndianMobileNumber } from '../utils/validation';

export const ContactSection: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    projectType: '',
    investmentAmount: '',
    loanRequirement: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    const phoneValidation = validateIndianMobileNumber(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setSubmitted(true);

    // 1. Send to Backend Express API / MongoDB contact collection
    api.contact.sendMessage({
      fullName: formData.fullName || 'Contact Inquiry',
      email: formData.email,
      phone: formData.phone,
      message: `Sector: ${formData.projectType || 'N/A'} | Capex: ₹${formData.investmentAmount || '0'} Cr | Loan: ₹${formData.loanRequirement || '0'} Cr | Message: ${formData.message || 'N/A'}`,
      subject: `Project Inquiry - ${formData.projectType || 'Greenfield'}`
    }).catch(() => undefined);

    // 2. Save into Live Admin Lead Store (shows on Admin Dashboard immediately)
    saveLeadRecord({
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
      notes: formData.message
    });

    // 3. Open WhatsApp chat with pre-filled message
    const text = `*NEW CONTACT & ADVISORY BRIEF* 📩\n\n` +
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
    <section id="contact" className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Page Header (Centered) */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Senior Advisory Desk · Greenfield Capital</span>
          </p>
          <h2 className="font-manrope text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-[1.2] tracking-tight">
            Book Your Free Advisory Call
          </h2>
          <p className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed">
            Discuss your greenfield project feasibility, capital requirements, and bank loan syndication with our senior advisory team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          
          {/* Left Column: Contact Details (Left Aligned) */}
          <div className="lg:col-span-5 space-y-6 font-inter text-left">
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
              <h3 className="font-manrope text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Inisio Advisory Headquarters
              </h3>

              <div className="space-y-5 text-sm sm:text-base text-slate-600">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 mt-0.5 shadow-2xs">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-900 block text-sm">Corporate Address</span>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">2nd Floor, Plot 24 & 25, Kakatiya Hills, Road No 9, Madhapur, Hyderabad, Telangana - 500081</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 mt-0.5 shadow-2xs">
                    <PhoneCall className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-900 block text-sm">Consultation Helpline</span>
                    <a href="tel:+916302026462" className="text-blue-700 font-semibold hover:underline text-sm">+91 63020 26462</a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 mt-0.5 shadow-2xs">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-900 block text-sm">Direct Email</span>
                    <a href="mailto:advisory@inisio.in" className="text-slate-900 font-semibold hover:underline text-sm">advisory@inisio.in</a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 mt-0.5 shadow-2xs">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-900 block text-sm">Working Hours</span>
                    <p className="text-slate-600 text-xs sm:text-sm">Monday - Saturday | 9:00 AM - 7:00 PM IST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Confidentiality Guarantee */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-sm text-slate-900">100% Confidentiality Guaranteed</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Strict Non-Disclosure Agreement (NDA) applied for all greenfield briefs and proprietary financials.
              </p>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-left">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 font-manrope">Consultation Booked Successfully!</h3>
                <p className="text-base text-slate-600 font-inter max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{formData.fullName}</strong>. A Senior Greenfield Advisor will review your project brief and reach out within 2 business hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-3 text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Submit Another Project Brief
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 font-inter">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-manrope">
                    Project Consultation Form
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill in your project requirements to request an underwriting review.
                  </p>
                </div>

                {phoneError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {phoneError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@enterprise.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (phoneError) setPhoneError('');
                      }}
                      className={`w-full px-4 py-3 text-sm bg-white border ${phoneError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'} rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all`}
                    />
                  </div>

                  {/* Project Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">Project Type / Sector *</label>
                    <select
                      required
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all cursor-pointer"
                    >
                      <option value="">Select Industry Sector</option>
                      {MAIN_SECTORS.map((sector) => (
                        <option key={sector} value={sector}>{sector}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Investment Amount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">Total Project Capex (₹ Cr) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 25 Cr"
                      value={formData.investmentAmount}
                      onChange={(e) => setFormData({ ...formData, investmentAmount: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Loan Requirement */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">Loan Requirement (₹ Cr) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 18 Cr"
                      value={formData.loanRequirement}
                      onChange={(e) => setFormData({ ...formData, loanRequirement: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">Project Summary / Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Enter details about land status, equipment suppliers, or target disbursement timeline..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  className="w-full py-3.5 text-sm sm:text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span>Book Free Advisory Call</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
