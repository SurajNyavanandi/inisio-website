import { api } from './apiClient';

export interface LeadRecord {
  id: string;
  _id?: string;
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  mobile?: string;
  projectName?: string;
  industry?: string;
  location?: string;
  projectCost?: number | string;
  totalCostCr?: number | string;
  proposedLoan?: number | string;
  loanRequiredCr?: number | string;
  promoterContribCr?: number | string;
  dscr?: number | string;
  dscrEstimate?: number | string;
  bankabilityScore?: number | string;
  bankabilityRating?: string;
  feasibilityScore?: number | string;
  stage?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  description?: string;
  landStatus?: string;
  collateralStatus?: string;
  promoterExp?: string;
  meansOfFinance?: any;
  financials?: any;
  riskProfile?: any;
  riskProfileData?: any;
  downloadedPDF?: boolean;
  assignedCA?: string;
  dprAssignedTo?: string;
  consultationAssignedTo?: string;
  assignedBank?: string;
  bankName?: string;
  branchLocation?: string;
  bankIfscCode?: string;
  bankAppRefNumber?: string;
  caReviewNotes?: string;
  promotersList?: any[];
  costComponents?: any[];
  customCostComponents?: any[];
  customFinanceComponents?: any[];
  uploadedDocuments?: any[];
  documentsUploaded?: boolean;
  dprFile?: string;
  cmaFile?: string;
  checklistUploaded?: boolean;
  checklistFileName?: string;
  documents?: Record<string, string>;
  isFunded?: boolean;
  successProbability?: number;
  recordType?: 'lead' | 'project';
  source?: string;
  submittedAt?: string;
  consultationStatus?: string;
  assessmentCompleted?: boolean;
  promoterContributionAvailable?: 'Yes' | 'No';
  promoterFundAssistanceStatus?: string;
  promoterFundAssistanceRequest?: any;
}

const STORAGE_KEY = 'inisio_stored_leads';

export function normalizeLead(item: any): LeadRecord {
  if (!item) {
    return {
      id: `lead_${Date.now()}`,
      fullName: '',
      email: '',
      phone: '',
      createdAt: new Date().toISOString(),
    };
  }

  const id = String(item._id || item.id || `lead_${Date.now()}`);
  const projectCost =
    item.totalCostCr !== undefined && item.totalCostCr !== ''
      ? item.totalCostCr
      : item.capexCr !== undefined && item.capexCr !== ''
      ? item.capexCr
      : item.projectCost ?? '';
  const proposedLoan =
    item.loanRequiredCr !== undefined && item.loanRequiredCr !== ''
      ? item.loanRequiredCr
      : item.loanCr !== undefined && item.loanCr !== ''
      ? item.loanCr
      : item.proposedLoan ?? '';
  const dscr =
    item.dscrEstimate !== undefined && item.dscrEstimate !== '' && Number(item.dscrEstimate) > 0
      ? item.dscrEstimate
      : item.dscr !== undefined && item.dscr !== '' && Number(item.dscr) > 0
      ? item.dscr
      : '';

  const mergedRiskProfile = item.riskProfileData || item.riskProfile || undefined;
  const mergedCostComponents = Array.isArray(item.costComponents) && item.costComponents.length > 0
    ? item.costComponents
    : Array.isArray(item.customCostComponents) && item.customCostComponents.length > 0
    ? item.customCostComponents
    : undefined;

  return {
    id,
    _id: item._id || id,
    fullName: item.fullName || item.promoterName || item.name || '',
    companyName: item.companyName || item.company || '',
    email: item.email || '',
    phone: item.mobile || item.phone || '',
    mobile: item.mobile || item.phone || '',
    projectName: item.projectName || '',
    industry: item.industry || '',
    location: item.location || '',
    projectCost,
    totalCostCr: projectCost,
    proposedLoan,
    loanRequiredCr: proposedLoan,
    promoterContribCr: item.promoterContribCr ?? item.equityCr ?? '',
    dscr,
    dscrEstimate: dscr,
    bankabilityScore: item.feasibilityScore || item.bankabilityScore || '',
    bankabilityRating: item.bankabilityRating || '',
    feasibilityScore: item.feasibilityScore || '',
    stage: item.stage || 'Initial Assessment',
    status: item.status || 'Active Lead',
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
    notes: item.notes || item.description || item.caReviewNotes || '',
    description: item.description || item.notes || '',
    landStatus: item.landStatus || '',
    collateralStatus: item.collateralStatus || '',
    promoterExp: item.promoterExp || '',
    meansOfFinance: item.meansOfFinance,
    financials: item.financials,
    riskProfile: mergedRiskProfile,
    riskProfileData: mergedRiskProfile,
    downloadedPDF: Boolean(item.downloadedPDF),
    assignedCA: item.assignedCA,
    dprAssignedTo: item.dprAssignedTo,
    consultationAssignedTo: item.consultationAssignedTo,
    assignedBank: item.assignedBank || item.bankName,
    bankName: item.bankName || item.assignedBank,
    branchLocation: item.branchLocation || '',
    bankIfscCode: item.bankIfscCode || '',
    bankAppRefNumber: item.bankAppRefNumber || '',
    caReviewNotes: item.caReviewNotes,
    promotersList: Array.isArray(item.promotersList) ? item.promotersList : undefined,
    costComponents: mergedCostComponents,
    customCostComponents: Array.isArray(item.customCostComponents) ? item.customCostComponents : mergedCostComponents,
    customFinanceComponents: Array.isArray(item.customFinanceComponents) ? item.customFinanceComponents : undefined,
    uploadedDocuments: Array.isArray(item.uploadedDocuments) ? item.uploadedDocuments : undefined,
    documentsUploaded: Boolean(item.documentsUploaded),
    dprFile: item.dprFile,
    cmaFile: item.cmaFile,
    checklistUploaded: Boolean(item.checklistUploaded),
    checklistFileName: item.checklistFileName,
    documents: item.documents && typeof item.documents === 'object' ? item.documents : undefined,
    isFunded: Boolean(item.isFunded),
    successProbability: typeof item.successProbability === 'number' ? item.successProbability : undefined,
    recordType: item.recordType,
    source: item.source,
    submittedAt: item.submittedAt,
    consultationStatus: item.consultationStatus,
    assessmentCompleted: item.assessmentCompleted !== undefined ? Boolean(item.assessmentCompleted) : undefined,
    promoterContributionAvailable: item.promoterContributionAvailable,
    promoterFundAssistanceStatus: item.promoterFundAssistanceStatus,
    promoterFundAssistanceRequest: item.promoterFundAssistanceRequest,
  };
}

export function getStoredLeads(emailFilter?: string): LeadRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list: LeadRecord[] = Array.isArray(parsed) ? parsed.map(normalizeLead) : [];
    if (emailFilter) {
      const clean = emailFilter.toLowerCase().trim();
      return list.filter((l) => (l.email || '').toLowerCase().trim() === clean);
    }
    return list;
  } catch {
    return [];
  }
}

export async function fetchLeadsFromDatabaseStrict(params?: {
  search?: string;
  filterSource?: string;
  email?: string;
}): Promise<LeadRecord[]> {
  const res = await api.leads.getAll(params);
  const dataList = Array.isArray(res) ? res : (res as any)?.data || [];
  const normalized = dataList.map(normalizeLead);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      console.warn('Could not cache leads in localStorage:', e);
    }
  }
  return normalized;
}

export async function fetchLeadsFromDatabase(params?: {
  search?: string;
  filterSource?: string;
  email?: string;
}): Promise<LeadRecord[]> {
  try {
    return await fetchLeadsFromDatabaseStrict(params);
  } catch (err) {
    console.warn('Database fetch failed, falling back to local session store:', err);
    return getStoredLeads(params?.email);
  }
}

export async function saveLeadRecord(lead: Partial<LeadRecord>): Promise<LeadRecord> {
  const norm = normalizeLead(lead);

  // Send full structured assessment & project details to backend database API
  try {
    const payload = {
      fullName: norm.fullName,
      companyName: norm.companyName || undefined,
      mobile: norm.phone || norm.mobile || '',
      email: norm.email || '',
      projectName: norm.projectName || '',
      industry: norm.industry || '',
      location: norm.location || '',
      totalCostCr: norm.projectCost,
      loanRequiredCr: norm.proposedLoan,
      promoterContribCr: norm.promoterContribCr,
      feasibilityScore: Number(norm.feasibilityScore) || 0,
      bankabilityRating: norm.bankabilityRating || '',
      dscrEstimate: Number(norm.dscr) || 0,
      landStatus: norm.landStatus || '',
      collateralStatus: norm.collateralStatus || '',
      promoterExp: norm.promoterExp || '',
      notes: norm.notes || norm.description || '',
      bankName: norm.bankName || norm.assignedBank || '',
      assignedBank: norm.assignedBank || norm.bankName || '',
      branchLocation: norm.branchLocation || '',
      bankIfscCode: norm.bankIfscCode || '',
      bankAppRefNumber: norm.bankAppRefNumber || '',
      meansOfFinance: norm.meansOfFinance,
      financials: norm.financials,
      riskProfile: norm.riskProfileData || norm.riskProfile,
      riskProfileData: norm.riskProfileData || norm.riskProfile,
      promotersList: norm.promotersList,
      costComponents: norm.costComponents,
      customCostComponents: norm.customCostComponents,
      customFinanceComponents: norm.customFinanceComponents,
      downloadedPDF: norm.downloadedPDF,
      source: norm.source,
      assessmentCompleted: norm.assessmentCompleted,
      promoterContributionAvailable: norm.promoterContributionAvailable,
      promoterFundAssistanceStatus: norm.promoterFundAssistanceStatus,
      promoterFundAssistanceRequest: norm.promoterFundAssistanceRequest,
    };

    const res = await api.leads.create(payload);
    if (res && (res._id || res.id)) {
      norm.id = String(res._id || res.id);
      norm._id = norm.id;
    }
  } catch (err) {
    console.warn('API save to database lead collection deferred:', err);
  }

  // Update local storage cache
  const currentLeads = getStoredLeads();
  const updated = [norm, ...currentLeads.filter((l) => l.id !== norm.id && l._id !== norm._id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save lead in localStorage:', err);
  }

  // Notify active UI subscribers
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('inisio_lead_added', { detail: norm }));
  }

  return norm;
}

export async function updateLeadRecord(
  id: string,
  updates: Partial<LeadRecord>,
  _updaterName?: string,
  options?: { throwOnError?: boolean }
): Promise<LeadRecord | null> {
  let serverRecord: LeadRecord | null = null;
  try {
    const res = await api.leads.update(id, updates);
    if (res && (res._id || res.id)) {
      serverRecord = normalizeLead(res);
    }
  } catch (err) {
    console.warn('Database update failed:', err);
    if (options?.throwOnError) {
      throw err;
    }
  }

  const currentLeads = getStoredLeads();
  const index = currentLeads.findIndex((l) => l.id === id || l._id === id);
  const updatedLead =
    serverRecord ||
    (index !== -1
      ? normalizeLead({ ...currentLeads[index], ...updates })
      : normalizeLead({ id, ...updates }));

  const nextList =
    index !== -1
      ? currentLeads.map((l, idx) => (idx === index ? updatedLead : l))
      : [updatedLead, ...currentLeads];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
  } catch (err) {
    console.warn('Failed to update lead in localStorage:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('inisio_lead_added'));
  }
  return updatedLead;
}

export async function deleteLeadRecord(
  id: string,
  options?: { throwOnError?: boolean }
): Promise<void> {
  try {
    await api.leads.delete(id);
  } catch (err) {
    console.warn('Database delete failed:', err);
    if (options?.throwOnError) {
      throw err;
    }
  }

  const currentLeads = getStoredLeads();
  const filtered = currentLeads.filter((l) => l.id !== id && l._id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete lead from localStorage:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('inisio_lead_added'));
  }
}

export async function clearAllLeads(): Promise<void> {
  try {
    await api.leads.clearAll();
  } catch (err) {
    console.warn('Database clear all failed:', err);
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear leads from storage:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('inisio_lead_added'));
  }
}

export function exportLeadsToCSV(leadsToExport?: LeadRecord[]): void {
  const leads = leadsToExport && leadsToExport.length > 0 ? leadsToExport : getStoredLeads();
  if (!leads.length) return;

  const headers = [
    'ID',
    'Full Name',
    'Email',
    'Phone',
    'Project Name',
    'Industry',
    'Project Cost (Cr)',
    'Loan Amount (Cr)',
    'DSCR',
    'Status',
    'Created At',
  ];
  const rows = leads.map((l) => [
    l.id || l._id || '',
    `"${l.fullName || ''}"`,
    `"${l.email || ''}"`,
    `"${l.phone || l.mobile || ''}"`,
    `"${l.projectName || ''}"`,
    `"${l.industry || ''}"`,
    l.projectCost || l.totalCostCr || '',
    l.proposedLoan || l.loanRequiredCr || '',
    l.dscr || l.dscrEstimate || '',
    `"${l.status || ''}"`,
    l.createdAt,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `inisio_leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
