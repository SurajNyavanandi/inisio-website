import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  PhoneCall,
  Calendar,
  Crown,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  Star,
} from 'lucide-react';
import { AuthUser } from '../types';
import { api } from '../utils/apiClient';
import {
  OFFICIAL_DISCLAIMERS,
  AssessmentQuotaStatus,
  fetchServerAssessmentQuota,
} from '../utils/membershipStore';
import { UISelect } from './ui/Select';
import { showToast } from './ui/Toast';

export interface DirectoryConsultant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  firm: string;
  role?: string;
  servicesOffered: string[];
  specialization: string;
  experience?: string;
  city: string;
  state: string;
  isFeaturedPartner?: boolean;
  isClosest?: boolean;
  feeNote?: string;
}

interface NearbyConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  project?: {
    id?: string;
    projectName?: string;
    location?: string;
    industry?: string;
    totalCostCr?: string | number;
  };
  initialConsultant?: DirectoryConsultant | null;
  initialService?: string;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  onOpenMembership?: (reason?: string, planId?: 'promoter_boost' | 'promoter_plus') => void;
  onIntroductionCreated?: () => void;
}

const SERVICE_OPTIONS = [
  'CMA & Financial Analysis',
  'DPR Preparation',
  'TEV Studies',
  'Debt Syndication',
];

export const NearbyConsultantModal: React.FC<NearbyConsultantModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  project,
  initialConsultant = null,
  initialService = 'CMA & Financial Analysis',
  onOpenAuth,
  onOpenMembership,
  onIntroductionCreated,
}) => {
  const [areaQuery, setAreaQuery] = useState(project?.location || '');
  const [selectedService, setSelectedService] = useState(initialService || 'CMA & Financial Analysis');
  const [consultants, setConsultants] = useState<DirectoryConsultant[]>([]);
  const [featuredPartner, setFeaturedPartner] = useState<DirectoryConsultant | null>(null);
  const [areaCount, setAreaCount] = useState<number>(0);
  const [loadingList, setLoadingList] = useState(false);

  const [selectedConsultant, setSelectedConsultant] = useState<DirectoryConsultant | null>(initialConsultant);
  const [quota, setQuota] = useState<AssessmentQuotaStatus | null>(null);
  const [checkingQuota, setCheckingQuota] = useState(false);

  const [preferredDate, setPreferredDate] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('Morning (10:00 AM - 1:00 PM)');
  const [notes, setNotes] = useState('');
  const [consentShare, setConsentShare] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingResult, setBookingResult] = useState<any>(null);

  const loadDirectoryAndQuota = async (area: string, service: string) => {
    setLoadingList(true);
    try {
      const res = await api.consultants.getDirectory({
        projectLocation: area,
        service,
        sector: project?.industry || '',
        includeProsync: true,
      });
      setConsultants(Array.isArray(res?.consultants) ? res.consultants : []);
      setFeaturedPartner(res?.featuredPartner || null);
      setAreaCount(Number(res?.areaAvailableCount ?? res?.consultants?.length ?? 0));
    } catch {
      setConsultants([]);
    } finally {
      setLoadingList(false);
    }

    if (currentUser?.email) {
      setCheckingQuota(true);
      try {
        const q = await fetchServerAssessmentQuota({ user: currentUser, email: currentUser.email });
        setQuota(q);
      } finally {
        setCheckingQuota(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setBookingResult(null);
      setSubmitError('');
      setConsentShare(false);
      return;
    }
    const initArea = project?.location || '';
    const initSvc = initialService || 'CMA & Financial Analysis';
    setAreaQuery(initArea);
    setSelectedService(initSvc);
    setSelectedConsultant(initialConsultant || null);
    loadDirectoryAndQuota(initArea, initSvc);
  }, [isOpen, project?.location, initialConsultant, initialService, currentUser?.email]);

  useEffect(() => {
    if (!isOpen) return;
    const handleMembershipUpdated = () => {
      if (currentUser?.email) {
        fetchServerAssessmentQuota({ user: currentUser, email: currentUser.email }).then(setQuota);
      }
    };
    window.addEventListener('inisio_membership_updated', handleMembershipUpdated);
    return () => window.removeEventListener('inisio_membership_updated', handleMembershipUpdated);
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const isProsyncSelected = Boolean(selectedConsultant?.isFeaturedPartner);
  const needsMembershipUpgrade = (() => {
    if (!currentUser) return false;
    if (!quota) return false;
    if (!quota.hasPaidMembership || quota.statusLabel === 'Expired') return true;
    if (isProsyncSelected && (quota.prosyncRemaining ?? 0) <= 0) return true;
    if (!isProsyncSelected && (quota.consultantRemaining ?? 0) <= 0) return true;
    return false;
  })();

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) {
        onClose();
        onOpenAuth('login');
      }
      return;
    }
    if (!selectedConsultant) {
      setSubmitError('Please select a nearby CA / Consultant or Prosync Consulting first.');
      return;
    }
    if (needsMembershipUpgrade) {
      if (onOpenMembership) {
        onOpenMembership(
          'Upgrade to Promoter Boost (₹2,999) or Promoter Plus (₹9,999) to unlock consultant introductions and call center coordination.',
          'promoter_boost'
        );
      }
      return;
    }
    if (!consentShare) {
      setSubmitError(
        'Please confirm consent to share your project information with the selected consultant / Prosync Consulting.'
      );
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await api.consultations.createIntroduction({
        projectId: project?.id || '',
        projectName: project?.projectName || 'Greenfield Project',
        projectLocation: areaQuery || project?.location || '',
        projectCostCr: project?.totalCostCr ? String(project.totalCostCr) : '',
        consultantId: selectedConsultant.id,
        consultantName: selectedConsultant.name,
        consultantEmail: selectedConsultant.email,
        consultantPhone: selectedConsultant.phone || '',
        consultantCity: selectedConsultant.city,
        consultantState: selectedConsultant.state,
        isProsync: Boolean(selectedConsultant.isFeaturedPartner),
        serviceCategory: selectedService,
        preferredDate,
        preferredSlot,
        notes,
        consentToShareProjectData: true,
      });

      setBookingResult(res);
      showToast('Consultation booked! Lead transferred to Call Center for slot confirmation.', {
        type: 'success',
      });
      if (onIntroductionCreated) {
        onIntroductionCreated();
      }
    } catch (err: any) {
      if (err?.code === 'MEMBERSHIP_UPGRADE_REQUIRED' || err?.status === 403) {
        setSubmitError(err.message);
      } else {
        setSubmitError(err?.message || 'Unable to submit consultation request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs font-inter">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close consultant modal"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {bookingResult ? (
          <div className="max-w-xl mx-auto py-4 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Lead Generated · Transferred to Call Center
              </span>
              <h2 className="font-manrope text-2xl font-extrabold text-slate-900">
                Consultation Request Submitted
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your introduction with <strong>{selectedConsultant?.name}</strong> has been logged with status <strong>Submitted</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="font-bold text-slate-800">Coordination &amp; Follow-Up Workflow</div>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1. Consultation lead generated &amp; routed to Call Center desk</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>2. Call Center confirms convenient time over call with both CA and Promoter</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>3. Share contact &amp; project details with the CA via WhatsApp below</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>4. Status tracking: Submitted → Contacted → Discussion → Engagement / Closed</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {bookingResult.whatsappShareUrl && (
                <a
                  href={bookingResult.whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    const introId = bookingResult?.introduction?._id;
                    if (introId) {
                      api.consultations
                        .updateIntroductionStatus(introId, { whatsappSharedToConsultant: true })
                        .catch(() => {});
                    }
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Share Details with CA via WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>Find Nearby CA / Consultant · Area Availability</span>
              </div>
              <h2 className="font-manrope text-xl sm:text-2xl font-extrabold text-slate-900">
                Get Connected to Your Nearby CA / Consultant Now
              </h2>
              <p className="text-xs text-slate-500">
                Select your project area and service category to view onboarded CAs and consultants available in your area, then confirm membership &amp; book your consultation.
              </p>
            </div>

            {/* Step 1: Select Area & Service */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Project City / State Area
                  </label>
                  <input
                    type="text"
                    value={areaQuery}
                    onChange={(e) => setAreaQuery(e.target.value)}
                    placeholder="e.g. Hyderabad, Telangana"
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Service Category
                  </label>
                  <UISelect
                    value={selectedService}
                    onValueChange={(val) => {
                      setSelectedService(val);
                      loadDirectoryAndQuota(areaQuery, val);
                    }}
                    options={SERVICE_OPTIONS}
                    triggerClassName="h-10 bg-white border-slate-300 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => loadDirectoryAndQuota(areaQuery, selectedService)}
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Check Nearby CAs
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/80">
                <span className="font-semibold text-slate-800 inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>
                    {loadingList
                      ? 'Checking professionals in your area...'
                      : `${areaCount} professional(s) providing service in ${areaQuery || 'selected area'} (${consultants.length} total onboarded matching filters)`}
                  </span>
                </span>
                {quota && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Plan: {quota.membershipTier} · Introductions Left: {quota.consultantRemaining ?? 0} | Prosync Left: {quota.prosyncRemaining ?? 0}
                  </span>
                )}
              </div>
            </div>

            {/* Step 2: Consultant List + Featured Partner Prosync */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Onboarded Professional
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1">
                {consultants.map((c) => {
                  const active = selectedConsultant?.id === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                        setSelectedConsultant(c);
                        setSubmitError('');
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                        active
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-manrope font-bold text-xs sm:text-sm text-slate-900">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-slate-500">{c.firm}</p>
                        </div>
                        {c.isClosest && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0">
                            Nearest Match
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        <MapPin className="w-3 h-3 inline mr-1 text-blue-600" />
                        {c.city}, {c.state}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{c.specialization}</p>
                    </button>
                  );
                })}

                {featuredPartner && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConsultant(featuredPartner);
                      setSubmitError('');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      selectedConsultant?.id === featuredPartner.id
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                        : 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-manrope font-bold text-xs sm:text-sm text-slate-900">
                          {featuredPartner.name}
                        </p>
                        <p className="text-[11px] font-semibold text-indigo-700">
                          Featured Advisory Partner
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                        <Star className="w-3 h-3" />
                        Featured
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{featuredPartner.specialization}</p>
                  </button>
                )}
              </div>

              {consultants.length === 0 && !loadingList && (
                <p className="text-xs text-slate-500 italic">
                  No independent regional CAs are onboarded in this filter yet. You may choose Prosync Consulting (Featured Advisory Partner) or widen your city/state search.
                </p>
              )}
            </div>

            {/* Step 3: Membership Gate OR Booking & Consent Form */}
            {!currentUser ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-amber-900 font-medium">
                  Sign in to your promoter account to check plan eligibility and book a consultant introduction.
                </p>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth('login');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                  >
                    Sign In to Continue
                  </button>
                )}
              </div>
            ) : needsMembershipUpgrade ? (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800">
                    <Crown className="w-4 h-4 text-blue-600" />
                    <span>Pay Membership to Connect with CA / Consultant</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {quota?.hasPaidMembership
                      ? 'You have used the introductions included in your current plan. Upgrade to Promoter Plus for more introductions.'
                      : 'Free Plan includes 1 project assessment. Upgrade to Promoter Boost (₹2,999 + GST) or Promoter Plus (₹9,999 + GST) to unlock consultant introductions.'}
                  </p>
                </div>
                {onOpenMembership && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenMembership(
                        'Select a paid membership plan to unlock consultant introductions & call center scheduling.',
                        quota?.planId === 'promoter_boost' ? 'promoter_plus' : 'promoter_boost'
                      )
                    }
                    className="min-h-[42px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Pay Membership &amp; Connect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : selectedConsultant ? (
              <form onSubmit={handleBookConsultation} className="space-y-4 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Preferred Call / Consulting Date
                    </label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full h-10 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Preferred Time Slot
                    </label>
                    <UISelect
                      value={preferredSlot}
                      onValueChange={setPreferredSlot}
                      options={[
                        'Morning (10:00 AM - 1:00 PM)',
                        'Afternoon (2:00 PM - 5:00 PM)',
                        'Evening (5:00 PM - 7:30 PM)',
                      ]}
                      triggerClassName="h-10 bg-white border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Project Scope / Consultation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mention documents needed (CMA, DPR, TEV, Debt Syndication) or questions for the consultant..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
                  />
                </div>

                {/* Mandatory Disclaimer + Separate Data Sharing Consent */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {isProsyncSelected
                        ? OFFICIAL_DISCLAIMERS.prosyncAdvisory.title
                        : OFFICIAL_DISCLAIMERS.consultantNetwork.title}
                    </span>
                  </div>
                  {(isProsyncSelected
                    ? OFFICIAL_DISCLAIMERS.prosyncAdvisory.paragraphs
                    : OFFICIAL_DISCLAIMERS.consultantNetwork.paragraphs
                  ).map((p, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {p}
                    </p>
                  ))}

                  <label className="flex items-start gap-2.5 pt-2 border-t border-slate-200 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={consentShare}
                      onChange={(e) => {
                        setConsentShare(e.target.checked);
                        if (e.target.checked) setSubmitError('');
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 shrink-0"
                    />
                    <span>
                      I give separate explicit consent to share my contact and project details with {selectedConsultant.name} for this consultation request and call center scheduling.
                    </span>
                  </label>
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || checkingQuota}
                  className="w-full min-h-[44px] py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Book Consultation &amp; Route to Call Center</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
export default NearbyConsultantModal;
