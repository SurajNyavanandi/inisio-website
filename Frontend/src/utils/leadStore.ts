import { api } from './apiClient';

export interface LeadRecord {
  id: string;
  _id?: string;
  fullName: string;
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
  meansOfFinance?: any;
  riskProfile?: any;
  downloadedPDF?: boolean;
  assignedCA?: string;
  dprAssignedTo?: string;
  consultationAssignedTo?: string;
}

const STORAGE_KEY = 'inisio_stored_leads';

export function normalizeLead(item: any): LeadRecord {
  if (!item) {
    return {
      id: `lead_${Date.now()}`,
      fullName: '',
      email: '',
      phone: '',
      createdAt: new Date().toISOString()
    };
  }

  const id = String(item._id || item.id || `lead_${Date.now()}`);
  const projectCost = item.totalCostCr !== undefined ? item.totalCostCr : item.projectCost || '0';
  const proposedLoan = item.loanRequiredCr !== undefined ? item.loanRequiredCr : item.proposedLoan || '0';
  const dscr = item.dscrEstimate !== undefined ? item.dscrEstimate : item.dscr || '1.45';

  return {
    id,
    _id: item._id || id,
    fullName: item.fullName || item.name || 'Anonymous Promoter',
    email: item.email || '',
    phone: item.mobile || item.phone || '',
    mobile: item.mobile || item.phone || '',
    projectName: item.projectName || 'Greenfield Project Proposal',
    industry: item.industry || 'Manufacturing & Industrial',
    location: item.location || '',
    projectCost,
    totalCostCr: projectCost,
    proposedLoan,
    loanRequiredCr: proposedLoan,
    promoterContribCr: item.promoterContribCr || '0',
    dscr,
    dscrEstimate: dscr,
    bankabilityScore: item.feasibilityScore || item.bankabilityScore || '85',
    bankabilityRating: item.bankabilityRating || 'A',
    feasibilityScore: item.feasibilityScore || '88',
    stage: item.stage || 'Initial Assessment',
    status: item.status || 'Active Lead',
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
    notes: item.notes || '',
    meansOfFinance: item.meansOfFinance,
    riskProfile: item.riskProfile,
    downloadedPDF: Boolean(item.downloadedPDF),
    assignedCA: item.assignedCA,
    dprAssignedTo: item.dprAssignedTo,
    consultationAssignedTo: item.consultationAssignedTo
  };
}

export function getStoredLeads(): LeadRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeLead) : [];
  } catch {
    return [];
  }
}

export async function fetchLeadsFromDatabase(params?: { search?: string; filterSource?: string; email?: string }): Promise<LeadRecord[]> {
  try {
    const res = await api.leads.getAll(params);
    const dataList = Array.isArray(res) ? res : (res as any)?.data || [];
    const normalized = dataList.map(normalizeLead);

    // Keep client cache in sync with real database records
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      } catch (e) {
        console.warn('Could not cache leads in localStorage:', e);
      }
    }
    return normalized;
  } catch (err) {
    console.warn('Database fetch failed, falling back to local session store:', err);
    return getStoredLeads();
  }
}

export async function saveLeadRecord(lead: Partial<LeadRecord>): Promise<LeadRecord> {
  const norm = normalizeLead(lead);

  // Send to real backend database API
  try {
    const payload = {
      fullName: norm.fullName,
      mobile: norm.phone || norm.mobile || '9999999999',
      email: norm.email || 'lead@inisio.in',
      projectName: norm.projectName || 'Greenfield Project',
      industry: norm.industry || 'Manufacturing',
      location: norm.location || 'India',
      totalCostCr: norm.projectCost,
      loanRequiredCr: norm.proposedLoan,
      promoterContribCr: norm.promoterContribCr,
      feasibilityScore: Number(norm.feasibilityScore) || 85,
      bankabilityRating: norm.bankabilityRating || 'A',
      dscrEstimate: Number(norm.dscr) || 1.45,
      notes: norm.notes,
      meansOfFinance: norm.meansOfFinance,
      riskProfile: norm.riskProfile,
      downloadedPDF: norm.downloadedPDF
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
  const updated = [norm, ...currentLeads.filter(l => l.id !== norm.id && l._id !== norm._id)];
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

export async function updateLeadRecord(id: string, updates: Partial<LeadRecord>): Promise<LeadRecord | null> {
  try {
    await api.leads.update(id, updates);
  } catch (err) {
    console.warn('Database update failed:', err);
  }

  const currentLeads = getStoredLeads();
  const index = currentLeads.findIndex(l => l.id === id || l._id === id);
  if (index === -1) return null;

  const updatedLead = { ...currentLeads[index], ...updates };
  currentLeads[index] = updatedLead;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLeads));
  } catch (err) {
    console.warn('Failed to update lead in localStorage:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('inisio_lead_added'));
  }
  return updatedLead;
}

export async function deleteLeadRecord(id: string): Promise<void> {
  try {
    await api.leads.delete(id);
  } catch (err) {
    console.warn('Database delete failed:', err);
  }

  const currentLeads = getStoredLeads();
  const filtered = currentLeads.filter(l => l.id !== id && l._id !== id);
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

  const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Project Name', 'Industry', 'Project Cost (Cr)', 'Loan Amount (Cr)', 'DSCR', 'Status', 'Created At'];
  const rows = leads.map(l => [
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
    l.createdAt
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `inisio_leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
