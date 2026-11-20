import { jsPDF } from 'jspdf';
import type { DetailedRiskProfileData } from '../components/DetailedRiskProfileForm';
import type { LeadRecord } from './leadStore';
import { calculateComprehensiveRiskScore } from './underwritingScorer';

export interface TeaserDirector {
  name: string;
  title?: string;
}

export interface TeaserPromoter {
  id?: string;
  name: string;
  role?: string;
  experienceYears?: string;
  experience?: string;
  qualification?: string;
  shareholdingPct?: number | string;
  kycStatus?: string;
}

export interface CostComponentItem {
  category?: string;
  name?: string;
  label?: string;
  amountCr?: number | string;
  amount?: number | string;
  value?: number | string;
}

export interface PdfRiskSummary {
  scoreOutOf10?: number;
  ratingLetter?: string;
  riskLevel?: string;
  strengths?: string[];
  recommendations?: string[];
}

export interface ViabilityIndicatorRow {
  metric: string;
  value: string;
  meaning: string;
}

export interface RiskMitigantRow {
  area: string;
  risk: string;
  mitigant: string;
}

export interface TeaserPDFData {
  projectName?: string;
  industry?: string;
  fullName?: string;
  companyName?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  location?: string;

  // Financial figures
  totalCostCr?: number | string;
  loanRequiredCr?: number | string;
  promoterContribCr?: number | string;
  promoterContributionCr?: number | string;
  termLoanCr?: number | string;
  otherFinanceCr?: number | string;
  machineryCostCr?: number | string;
  civilCostCr?: number | string;
  consultancyCostCr?: number | string;
  otherCostsCr?: number | string;
  hasExplicitBreakdown?: boolean;
  costComponents?: CostComponentItem[];
  customCostComponents?: CostComponentItem[];
  customFinanceComponents?: CostComponentItem[];
  meansOfFinance?: {
    equityCr?: number | string;
    debtCr?: number | string;
    subsidyCr?: number | string;
    otherCr?: number | string;
  };
  eqPct?: number | string;
  debtPct?: number | string;
  dscrEstimate?: number | string;
  estInterestRate?: string;
  estimatedLoan?: number | string;

  // Scores & Risk Profile
  riskScoreOutOf10?: number | string;
  feasibilityScore?: number | string;
  bankabilityScore?: number | string;
  bankabilityRating?: string;
  riskProfileData?: DetailedRiskProfileData;
  riskProfile?: DetailedRiskProfileData;
  riskSummary?: PdfRiskSummary;

  // Site, Security, Promoters & Banking
  landStatus?: string;
  collateralStatus?: string;
  promoterExp?: string;
  description?: string;
  notes?: string;
  bankName?: string;
  branchLocation?: string;
  bankIfscCode?: string;
  bankAppRefNumber?: string;
  directors?: TeaserDirector[];
  promotersList?: TeaserPromoter[];

  // DPR & Execution Metadata
  status?: string;
  stage?: string;
  assignedCA?: string;
  dprAssignedTo?: string;
  consultationAssignedTo?: string;
  caReviewNotes?: string;
  checklistUploaded?: boolean;
  checklistFileName?: string;
  documents?: Record<string, string>;
  uploadedDocuments?: Array<string | { name?: string; label?: string; type?: string; url?: string }>;
  dprFile?: string;
  cmaFile?: string;
  isFunded?: boolean;
  successProbability?: number;
  createdAt?: string;
  updatedAt?: string;

  // Legacy aliases
  projectCost?: number | string;
  proposedLoan?: number | string;
  promoterEquity?: number | string;
  dscr?: number | string;
  financials?: any;
  keyHighlights?: string[];
  [key: string]: any;
}

export interface ResolvedDocumentData {
  projectName: string;
  sector: string;
  promoter: string;
  companyName: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  refCode: string;
  dateStr: string;

  // Financial Totals
  totalCostNum: number;
  termLoanNum: number;
  promoterEquityNum: number;
  otherFinanceNum: number;
  totalFundingNum: number;
  debtPct: number | null;
  eqPct: number | null;
  otherPct: number | null;
  debtEquityRatioLabel: string;
  isFundingBalanced: boolean;
  estRate: string;

  // Itemized Schedules
  costRows: Array<{ label: string; amountCr: number }>;
  costBreakdownNote: string;
  financeRows: Array<{ label: string; sharePct: string; value: string }>;

  // Scores & Risk
  dscrNum: number | null;
  dscrLabel: string;
  feasibilityNum: number | null;
  feasibilityLabel: string;
  bankabilityScoreNum: number | null;
  bankabilityLabel: string;
  ratingLetter: string;
  riskLevel: string;
  riskHighlights: Array<[string, string]>;
  strengths: string[];
  recommendations: string[];

  // Plain-English Narratives & Tables
  executiveVerdict: string;
  businessOverviewSummary: string;
  nextStepsLines: string[];
  readinessRows: Array<[string, string]>;
  bankRows: Array<[string, string]>;
  viabilityIndicators: ViabilityIndicatorRow[];
  riskMitigants: RiskMitigantRow[];
  setupMilestones: string[];

  // Profile & Banking
  overviewRows: Array<[string, string]>;
  projectBrief: string;
  promoters: Array<{
    name: string;
    role: string;
    experience: string;
    qualification: string;
    shareholding: string;
  }>;

  // DPR & Document Readiness
  status: string;
  stage: string;
  assignedCA: string;
  dprAssignedTo: string;
  caReviewNotes: string;
  checklistStatus: string;
  documentRows: Array<[string, string]>;
  isFunded: boolean;
}

export interface PdfGenerationResult {
  blobUrl: string;
  blob: Blob;
  filename: string;
  resolved: ResolvedDocumentData;
  documentType: 'teaser' | 'dpr';
}

const parseNum = (val: unknown): number | null => {
  if (val === undefined || val === null || val === '') return null;
  const parsed = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

export const fmtCr = (val: number): string => {
  const safe = Number.isFinite(val) ? val : 0;
  return `INR ${safe.toFixed(2)} Cr`;
};

export const cleanAsciiText = (val: unknown, fallback = ''): string => {
  if (val === undefined || val === null) return fallback;
  const cleaned = String(val)
    .replace(/₹/g, 'INR ')
    .replace(/[•·]/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
};

export const makeSafeFileSlug = (name: string): string =>
  cleanAsciiText(name, 'Project')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'Project';

/**
 * Reliable cross-browser Blob download helper (safe inside iframes and desktop/mobile browsers).
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore cleanup error
      }
    }, 3000);
  }
}

/**
 * Maps any saved MongoDB LeadRecord / Project record into a complete TeaserPDFData payload
 * with zero dropped fields and zero fabricated defaults.
 */
export function mapLeadRecordToPdfData(lead: LeadRecord): TeaserPDFData {
  const fin = lead.financials || {};
  const mof = lead.meansOfFinance || {};
  const rp = lead.riskProfileData || lead.riskProfile || undefined;

  const customCosts =
    Array.isArray(lead.costComponents) && lead.costComponents.length > 0
      ? lead.costComponents
      : Array.isArray(lead.customCostComponents) && lead.customCostComponents.length > 0
      ? lead.customCostComponents
      : undefined;

  const hasExplicitFinBreakdown = Boolean(
    (fin.machineryCostCr !== undefined && fin.machineryCostCr !== '') ||
      (fin.civilCostCr !== undefined && fin.civilCostCr !== '') ||
      (fin.consultancyCostCr !== undefined && fin.consultancyCostCr !== '') ||
      (fin.otherCostsCr !== undefined && fin.otherCostsCr !== '')
  );

  const feasibilityNum = parseNum(lead.feasibilityScore ?? lead.bankabilityScore);
  const computedRisk =
    rp || (feasibilityNum !== null && feasibilityNum > 0)
      ? calculateComprehensiveRiskScore(rp, feasibilityNum ?? 78)
      : undefined;

  return {
    projectName: lead.projectName || 'Greenfield Project',
    industry: lead.industry || '',
    fullName: lead.fullName || '',
    companyName: lead.companyName || '',
    email: lead.email || '',
    mobile: lead.mobile || lead.phone || '',
    phone: lead.phone || lead.mobile || '',
    location: lead.location || '',

    totalCostCr: fin.totalProjectCost || lead.totalCostCr || lead.projectCost,
    loanRequiredCr: fin.termLoanCr || mof.debtCr || lead.loanRequiredCr || lead.proposedLoan,
    termLoanCr: fin.termLoanCr || mof.debtCr || lead.loanRequiredCr || lead.proposedLoan,
    promoterContribCr: fin.promoterContributionCr || mof.equityCr || lead.promoterContribCr,
    promoterContributionCr: fin.promoterContributionCr || mof.equityCr || lead.promoterContribCr,
    otherFinanceCr: fin.otherFinanceCr ?? mof.subsidyCr ?? mof.otherCr,

    machineryCostCr: fin.machineryCostCr,
    civilCostCr: fin.civilCostCr,
    consultancyCostCr: fin.consultancyCostCr,
    otherCostsCr: fin.otherCostsCr,
    hasExplicitBreakdown: hasExplicitFinBreakdown,
    costComponents: customCosts,
    customCostComponents: customCosts,
    customFinanceComponents: lead.customFinanceComponents,
    meansOfFinance: mof,

    dscrEstimate: lead.dscrEstimate || lead.dscr,
    feasibilityScore: lead.feasibilityScore || lead.bankabilityScore,
    bankabilityRating: lead.bankabilityRating,
    riskScoreOutOf10: computedRisk?.scoreOutOf10,
    riskProfileData: rp,
    riskSummary: computedRisk,

    landStatus: lead.landStatus,
    collateralStatus: lead.collateralStatus,
    promoterExp: lead.promoterExp,
    description: lead.description || lead.notes,
    notes: lead.notes,
    bankName: lead.bankName || lead.assignedBank,
    branchLocation: lead.branchLocation,
    bankIfscCode: lead.bankIfscCode,
    bankAppRefNumber: lead.bankAppRefNumber,
    promotersList: lead.promotersList,

    status: lead.status,
    stage: lead.stage,
    assignedCA: lead.assignedCA,
    dprAssignedTo: lead.dprAssignedTo,
    consultationAssignedTo: lead.consultationAssignedTo,
    caReviewNotes: lead.caReviewNotes,
    checklistUploaded: lead.checklistUploaded,
    checklistFileName: lead.checklistFileName,
    documents: lead.documents,
    uploadedDocuments: lead.uploadedDocuments,
    dprFile: lead.dprFile,
    cmaFile: lead.cmaFile,
    isFunded: lead.isFunded,
    successProbability: lead.successProbability,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

/**
 * Reconciles and normalizes all entered/saved project data into one plain-English view model
 * shared identically by Teaser PDF, DPR PDF, Teaser DOCX, and the in-app preview modal.
 */
export function resolveDocumentData(data: TeaserPDFData): ResolvedDocumentData {
  const projectName = cleanAsciiText(data.projectName, 'Greenfield Industrial Project');
  const sector = cleanAsciiText(data.industry, 'Industrial Sector');
  const promoter = cleanAsciiText(data.fullName || data.companyName, 'Lead Promoter');
  const companyName = cleanAsciiText(data.companyName, '');
  const location = cleanAsciiText(data.location, 'India');
  const contactEmail = cleanAsciiText(data.email, '');
  const contactPhone = cleanAsciiText(data.mobile || data.phone, '');

  const dateObj = data.updatedAt ? new Date(data.updatedAt) : new Date();
  const validDate = Number.isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const dateStr = cleanAsciiText(
    validDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  );

  const refCode = cleanAsciiText(
    data.bankAppRefNumber,
    `INS-${validDate.getFullYear()}-${String(validDate.getTime()).slice(-4)}`
  );

  // 1. Resolve Cost Breakdown (custom components first, then explicit standard items)
  const rawCustomCosts =
    Array.isArray(data.costComponents) && data.costComponents.length > 0
      ? data.costComponents
      : Array.isArray(data.customCostComponents) && data.customCostComponents.length > 0
      ? data.customCostComponents
      : [];

  const parsedCustomCosts = rawCustomCosts
    .map((item) => ({
      label: cleanAsciiText(item.category || item.name || item.label, ''),
      amountCr: parseNum(item.amountCr ?? item.amount ?? item.value) ?? 0,
    }))
    .filter((item) => item.label && item.amountCr > 0);

  const machineryVal = parseNum(data.machineryCostCr ?? data.financials?.machineryCostCr);
  const civilVal = parseNum(data.civilCostCr ?? data.financials?.civilCostCr);
  const consultancyVal = parseNum(data.consultancyCostCr ?? data.financials?.consultancyCostCr);
  const otherCostVal = parseNum(data.otherCostsCr ?? data.financials?.otherCostsCr);

  const standardCostRows: Array<{ label: string; amountCr: number }> = [];
  if (machineryVal !== null && machineryVal > 0) {
    standardCostRows.push({ label: 'Plant and Machinery', amountCr: machineryVal });
  }
  if (civilVal !== null && civilVal > 0) {
    standardCostRows.push({ label: 'Land, Building and Civil Works', amountCr: civilVal });
  }
  if (consultancyVal !== null && consultancyVal > 0) {
    standardCostRows.push({ label: 'Consultancy, Pre-Operative and Contingencies', amountCr: consultancyVal });
  }
  if (otherCostVal !== null && otherCostVal > 0) {
    standardCostRows.push({ label: 'Working Capital Margin and Other Costs', amountCr: otherCostVal });
  }

  let costRows: Array<{ label: string; amountCr: number }> = [];
  let costBreakdownNote = '';

  if (parsedCustomCosts.length > 0) {
    costRows = parsedCustomCosts;
    costBreakdownNote = 'Itemized cost breakdown as provided by the promoter.';
  } else if (standardCostRows.length > 0) {
    costRows = standardCostRows;
    costBreakdownNote =
      data.hasExplicitBreakdown === false
        ? 'Estimated cost split based on sector benchmarks; final amounts will follow vendor quotes.'
        : 'Itemized project cost breakdown as entered.';
  }

  const itemizedCostSum = Number(costRows.reduce((sum, r) => sum + r.amountCr, 0).toFixed(2));
  const explicitTotalCost = parseNum(data.totalCostCr ?? data.projectCost);
  const totalCostNum =
    explicitTotalCost !== null && explicitTotalCost > 0
      ? explicitTotalCost
      : itemizedCostSum > 0
      ? itemizedCostSum
      : 0;

  // If itemized entries exist and don't match explicit total cost, reconcile cleanly using itemized sum or add balancing note
  if (costRows.length === 0 && totalCostNum > 0) {
    costRows = [{ label: 'Total Estimated Project Cost (Consolidated)', amountCr: totalCostNum }];
    costBreakdownNote = 'Consolidated project cost entered; detailed item-wise split will be finalized with quotes.';
  } else if (costRows.length > 0 && explicitTotalCost !== null && explicitTotalCost > 0) {
    const diff = Number((explicitTotalCost - itemizedCostSum).toFixed(2));
    if (diff > 0.05) {
      costRows.push({ label: 'Unallocated / Other Project Costs', amountCr: diff });
    }
  }

  const reconciledCostTotal =
    costRows.length > 0
      ? Number(costRows.reduce((sum, r) => sum + r.amountCr, 0).toFixed(2))
      : totalCostNum;

  // 2. Resolve Means of Finance (exact values, hide zero optional rows)
  const rawLoan = parseNum(
    data.termLoanCr ?? data.loanRequiredCr ?? data.proposedLoan ?? data.meansOfFinance?.debtCr
  );
  const rawEquity = parseNum(
    data.promoterContributionCr ??
      data.promoterContribCr ??
      data.promoterEquity ??
      data.meansOfFinance?.equityCr
  );
  const rawOtherFin =
    parseNum(data.otherFinanceCr ?? data.meansOfFinance?.subsidyCr ?? data.meansOfFinance?.otherCr) ?? 0;

  const parsedCustomFinance = (Array.isArray(data.customFinanceComponents) ? data.customFinanceComponents : [])
    .map((item) => ({
      label: cleanAsciiText(item.category || item.name || item.label, ''),
      amountCr: parseNum(item.amountCr ?? item.amount ?? item.value) ?? 0,
    }))
    .filter((item) => item.label && item.amountCr > 0);

  const customFinSum = Number(parsedCustomFinance.reduce((sum, r) => sum + r.amountCr, 0).toFixed(2));

  const termLoanNum = rawLoan !== null && rawLoan > 0 ? rawLoan : 0;
  const promoterEquityNum =
    rawEquity !== null && rawEquity > 0
      ? rawEquity
      : reconciledCostTotal > 0 && termLoanNum > 0
      ? Math.max(0, Number((reconciledCostTotal - termLoanNum - rawOtherFin - customFinSum).toFixed(2)))
      : 0;
  const otherFinanceNum = Math.max(0, rawOtherFin);
  const totalFundingNum = Number(
    (termLoanNum + promoterEquityNum + otherFinanceNum + customFinSum).toFixed(2)
  );

  const effectiveTotalCost = reconciledCostTotal > 0 ? reconciledCostTotal : totalFundingNum;
  const denom = totalFundingNum > 0 ? totalFundingNum : effectiveTotalCost;

  let debtPct: number | null = null;
  let eqPct: number | null = null;
  let otherPct: number | null = null;

  if (denom > 0) {
    debtPct = Math.round((termLoanNum / denom) * 100);
    eqPct = Math.round((promoterEquityNum / denom) * 100);
    otherPct = Math.max(0, 100 - debtPct - eqPct);
  }

  let debtEquityRatioLabel = 'Not specified';
  if (termLoanNum > 0 && promoterEquityNum > 0) {
    const ratio = (termLoanNum / promoterEquityNum).toFixed(2);
    debtEquityRatioLabel = `${ratio} : 1 (${debtPct}% Loan / ${eqPct}% Equity)`;
  } else if (termLoanNum > 0 && promoterEquityNum === 0) {
    debtEquityRatioLabel = '100% Loan Requested';
  } else if (promoterEquityNum > 0 && termLoanNum === 0) {
    debtEquityRatioLabel = '100% Promoter Funded';
  }

  const isFundingBalanced =
    effectiveTotalCost === 0 ||
    totalFundingNum === 0 ||
    Math.abs(effectiveTotalCost - totalFundingNum) < 0.05;

  const estRate = cleanAsciiText(data.estInterestRate, '');

  const financeRows: Array<{ label: string; sharePct: string; value: string }> = [];
  if (termLoanNum > 0) {
    financeRows.push({
      label: 'Term Loan Requested from Bank',
      sharePct: denom > 0 ? `${((termLoanNum / denom) * 100).toFixed(1)}%` : '-',
      value: fmtCr(termLoanNum),
    });
  }
  if (promoterEquityNum > 0) {
    financeRows.push({
      label: 'Promoter Contribution (Own Funds / Equity)',
      sharePct: denom > 0 ? `${((promoterEquityNum / denom) * 100).toFixed(1)}%` : '-',
      value: fmtCr(promoterEquityNum),
    });
  }
  if (otherFinanceNum > 0) {
    financeRows.push({
      label: 'Government Subsidy / Other Funding',
      sharePct: denom > 0 ? `${((otherFinanceNum / denom) * 100).toFixed(1)}%` : '-',
      value: fmtCr(otherFinanceNum),
    });
  }
  parsedCustomFinance.forEach((cf) => {
    financeRows.push({
      label: cf.label,
      sharePct: denom > 0 ? `${((cf.amountCr / denom) * 100).toFixed(1)}%` : '-',
      value: fmtCr(cf.amountCr),
    });
  });

  // 3. Resolve Scores & Risk Profile
  const dscrNum = parseNum(data.dscrEstimate ?? data.dscr);
  const dscrLabel = dscrNum !== null && dscrNum > 0 ? `${dscrNum.toFixed(2)}x` : 'To be calculated';

  const feasibilityNum = parseNum(data.feasibilityScore ?? data.bankabilityScore);
  const feasibilityLabel =
    feasibilityNum !== null && feasibilityNum > 0 ? `${Math.round(feasibilityNum)} / 100` : 'Pending review';

  const rp = data.riskProfileData || data.riskProfile;
  const computedSummary =
    data.riskSummary ||
    (rp || (feasibilityNum !== null && feasibilityNum > 0)
      ? calculateComprehensiveRiskScore(rp, feasibilityNum ?? 78)
      : undefined);

  const explicitBankability = parseNum(data.bankabilityRating);
  const bankabilityScoreNum =
    rp && computedSummary?.scoreOutOf10
      ? computedSummary.scoreOutOf10
      : explicitBankability !== null && explicitBankability > 0
      ? explicitBankability
      : computedSummary?.scoreOutOf10 ?? null;

  const ratingLetter = cleanAsciiText(computedSummary?.ratingLetter, '');
  const riskLevel = cleanAsciiText(computedSummary?.riskLevel, '');
  const bankabilityLabel =
    bankabilityScoreNum !== null
      ? `${bankabilityScoreNum.toFixed(1)} / 10${ratingLetter ? ` (Grade ${ratingLetter})` : ''}`
      : cleanAsciiText(data.bankabilityRating, 'Pending review');

  const riskHighlights: Array<[string, string]> = [];
  if (rp) {
    if (rp.businessConstitution) {
      riskHighlights.push(['Business Structure', cleanAsciiText(rp.businessConstitution)]);
    }
    if (rp.businessVintage) {
      riskHighlights.push(['Years in Business', cleanAsciiText(rp.businessVintage)]);
    }
    if (rp.isNewToCredit) {
      riskHighlights.push(['Credit Score (CIBIL)', 'New to Commercial Credit (No prior score)']);
    } else if (rp.cibilScore !== undefined && rp.cibilScore !== null && rp.cibilScore !== '') {
      riskHighlights.push(['Lead Promoter CIBIL Score', cleanAsciiText(rp.cibilScore)]);
    }
    if (rp.collateralCoveragePct !== undefined && rp.collateralCoveragePct !== null && rp.collateralCoveragePct !== '') {
      const covNum = parseNum(rp.collateralCoveragePct);
      riskHighlights.push([
        'Collateral Coverage',
        covNum === 0 ? 'No collateral offered (CGTMSE / clean route)' : `${cleanAsciiText(rp.collateralCoveragePct)}% of loan value`,
      ]);
    }
    if (rp.offtakeSecurity) {
      riskHighlights.push(['Customer / Sales Visibility', cleanAsciiText(rp.offtakeSecurity)]);
    }
    if (rp.managementTeamStrength) {
      riskHighlights.push(['Management Team Depth', cleanAsciiText(rp.managementTeamStrength)]);
    }
    if (rp.educationalBackground) {
      riskHighlights.push(['Promoter Education', cleanAsciiText(rp.educationalBackground)]);
    }
  }

  // 4. Profile, Readiness & Banking Details (only populated fields)
  const landStatus = cleanAsciiText(data.landStatus, '');
  const collateralStatus = cleanAsciiText(data.collateralStatus, '');
  const promoterExp = cleanAsciiText(data.promoterExp, '');
  const bankName = cleanAsciiText(data.bankName, '');
  const branchLocation = cleanAsciiText(data.branchLocation, '');
  const bankIfscCode = cleanAsciiText(data.bankIfscCode, '');
  const bankAppRefNumber = cleanAsciiText(data.bankAppRefNumber, '');
  const projectBrief = cleanAsciiText(data.description || data.notes, '');

  const overviewRows: Array<[string, string]> = [
    ['Project Name', projectName],
    ['Industry / Sector', sector],
    ['Project Location', location],
    ['Lead Promoter', promoter],
  ];
  if (companyName && companyName.toLowerCase() !== promoter.toLowerCase()) {
    overviewRows.push(['Company / Entity Name', companyName]);
  }
  const contactLine = [contactPhone, contactEmail].filter(Boolean).join('  |  ');
  if (contactLine) {
    overviewRows.push(['Contact Details', contactLine]);
  }

  const readinessRows: Array<[string, string]> = [];
  if (landStatus) readinessRows.push(['Land & Site Readiness', landStatus]);
  if (collateralStatus) readinessRows.push(['Collateral Security', collateralStatus]);
  if (promoterExp) readinessRows.push(['Promoter Experience', promoterExp]);
  if (estRate) {
    readinessRows.push([
      'Expected Interest Rate',
      estRate.toLowerCase().includes('p.a') ? estRate : `${estRate} p.a.`,
    ]);
  }

  const bankRows: Array<[string, string]> = [];
  if (bankName) bankRows.push(['Preferred Bank', bankName]);
  if (branchLocation) bankRows.push(['Branch / City', branchLocation]);
  if (bankIfscCode) bankRows.push(['IFSC Code', bankIfscCode]);
  if (bankAppRefNumber) bankRows.push(['Application Reference', bankAppRefNumber]);

  // 5. Promoters / Directors List
  const promoters: ResolvedDocumentData['promoters'] = [];
  if (Array.isArray(data.promotersList) && data.promotersList.length > 0) {
    data.promotersList.forEach((p, idx) => {
      const name = cleanAsciiText(p.name, `Promoter ${idx + 1}`);
      const role = cleanAsciiText(p.role, idx === 0 ? 'Lead Promoter' : 'Co-Promoter / Director');
      const exp = cleanAsciiText(p.experienceYears || p.experience, 'Not provided');
      const qual = cleanAsciiText(p.qualification, 'Not provided');
      const shareNum = parseNum(p.shareholdingPct);
      const share = shareNum !== null && shareNum > 0 ? `${shareNum}%` : '-';
      promoters.push({ name, role, experience: exp, qualification: qual, shareholding: share });
    });
  } else if (Array.isArray(data.directors) && data.directors.length > 0) {
    data.directors.forEach((d, idx) => {
      promoters.push({
        name: cleanAsciiText(d.name, `Director ${idx + 1}`),
        role: cleanAsciiText(d.title, idx === 0 ? 'Managing Director' : 'Director'),
        experience: idx === 0 ? cleanAsciiText(promoterExp, 'Not provided') : 'Not provided',
        qualification: idx === 0 ? cleanAsciiText(rp?.educationalBackground, 'Not provided') : 'Not provided',
        shareholding: '-',
      });
    });
  } else {
    promoters.push({
      name: promoter,
      role: 'Lead Promoter',
      experience: cleanAsciiText(promoterExp, 'Not provided'),
      qualification: cleanAsciiText(rp?.educationalBackground, 'Not provided'),
      shareholding: '100%',
    });
  }

  // 6. Plain-English Summaries (Zero Jargon, Grounded in Actual Entered Data)
  const costPhrase = effectiveTotalCost > 0 ? fmtCr(effectiveTotalCost) : 'an estimated outlay to be finalized';
  const loanPhrase = termLoanNum > 0 ? fmtCr(termLoanNum) : 'term loan funding';
  const eqPhrase =
    promoterEquityNum > 0
      ? `${fmtCr(promoterEquityNum)}${eqPct !== null ? ` (${eqPct}% of project cost)` : ''}`
      : 'promoter contribution to be confirmed';

  const viabilityVerdict =
    dscrNum !== null && dscrNum >= 1.33 && (eqPct === null || eqPct >= 25)
      ? 'Overall, the project shows comfortable loan repayment ability and meets standard bank funding norms.'
      : dscrNum !== null && dscrNum > 0
      ? 'The project is viable for bank review, with final loan terms subject to detailed financial projections and collateral verification.'
      : 'Initial project inputs are captured below; final bank viability will be confirmed once full financial figures are completed.';

  const executiveVerdict = cleanAsciiText(
    `${projectName} is a ${sector} project planned in ${location} with a total estimated project cost of ${costPhrase}. ` +
      `The promoter proposes to fund this with a bank term loan of ${loanPhrase} and own equity of ${eqPhrase}. ` +
      (dscrNum !== null && dscrNum > 0
        ? `At an estimated Debt Service Coverage Ratio (DSCR) of ${dscrNum.toFixed(2)}x, `
        : '') +
      viabilityVerdict
  );

  const businessOverviewSummary = cleanAsciiText(
    projectBrief ||
      `${projectName} is proposed as a ${sector} venture located in ${location}, led by ${promoter}. ` +
        (landStatus ? `Land readiness is currently recorded as "${landStatus}". ` : '') +
        (collateralStatus ? `Collateral status is "${collateralStatus}". ` : '') +
        (promoterExp ? `The promoter brings ${promoterExp} of experience to project execution.` : 'The promoter team is preparing the project for bank financing.')
  );

  const nextStepsLines: string[] = [
    `Funding Request: Seeking a bank term loan of ${loanPhrase}${effectiveTotalCost > 0 ? ` toward a total project cost of ${costPhrase}` : ''}${promoterEquityNum > 0 ? `, backed by ${fmtCr(promoterEquityNum)} in promoter funds` : ''}.`,
    bankName
      ? `Target Bank: Prepared for initial review with ${bankName}${branchLocation ? ` (${branchLocation})` : ''}${bankIfscCode ? `, IFSC ${bankIfscCode}` : ''}.`
      : 'Target Bank: Ready to be shared with preferred commercial banks or NBFC lenders for initial in-principle feedback.',
    'Next Step: Following initial lender interest, submit full KYC, land papers, vendor quotes, and a complete bank-format DPR / CMA projection file.',
  ];

  // 7. Plain-English Viability Indicators Table (DPR Section 6)
  const viabilityIndicators: ViabilityIndicatorRow[] = [];
  if (dscrNum !== null && dscrNum > 0) {
    viabilityIndicators.push({
      metric: 'Estimated DSCR (Repayment Comfort)',
      value: `${dscrNum.toFixed(2)}x`,
      meaning:
        dscrNum >= 1.5
          ? 'Strong cushion: expected business cash flows cover yearly loan EMIs more than 1.5 times.'
          : dscrNum >= 1.33
          ? 'Healthy cushion: meets standard bank comfort of at least 1.33x cash flow over loan EMIs.'
          : 'Tight cushion: cash flows are close to loan EMIs; a longer repayment period or higher margin helps.',
    });
  } else {
    viabilityIndicators.push({
      metric: 'Estimated DSCR (Repayment Comfort)',
      value: 'Pending',
      meaning: 'Shows how many times yearly business profit covers bank loan EMIs; banks usually prefer 1.33x or higher.',
    });
  }

  viabilityIndicators.push({
    metric: 'Debt-to-Equity Ratio',
    value: debtEquityRatioLabel,
    meaning:
      termLoanNum > 0 && promoterEquityNum > 0
        ? termLoanNum / promoterEquityNum <= 2.5
          ? 'Balanced funding mix: loan amount is within typical bank comfort compared to promoter equity.'
          : 'Higher loan share: banks may ask for stronger collateral or slightly more promoter margin.'
        : 'Compares borrowed bank loan against the promoter own money invested in the project.',
  });

  if (eqPct !== null && promoterEquityNum > 0) {
    viabilityIndicators.push({
      metric: 'Promoter Margin (Own Investment)',
      value: `${eqPct}% (${fmtCr(promoterEquityNum)})`,
      meaning:
        eqPct >= 25
          ? 'Meets standard bank rule requiring promoters to bring at least 25% of total project cost.'
          : 'Below the usual 25% bank margin; lender may request additional promoter funds or subsidy proof.',
    });
  }

  viabilityIndicators.push({
    metric: 'Feasibility Score',
    value: feasibilityLabel,
    meaning:
      feasibilityNum !== null && feasibilityNum >= 75
        ? 'High readiness across project cost, promoter profile, and site fundamentals.'
        : feasibilityNum !== null && feasibilityNum > 0
        ? 'Moderate readiness; completing pending site or financial details will strengthen bank approval chances.'
        : 'Overall readiness score summarizing project strength for bank screening.',
  });

  viabilityIndicators.push({
    metric: 'Bankability & Risk Rating',
    value: riskLevel ? `${bankabilityLabel} - ${riskLevel}` : bankabilityLabel,
    meaning: 'Summarizes overall lending comfort based on promoter background, credit profile, collateral, and funding structure.',
  });

  // 8. Key Risks & Mitigants (4-5 project-grounded points for DPR Section 7)
  const riskMitigants: RiskMitigantRow[] = [];

  // Land / Site risk
  const landLower = landStatus.toLowerCase();
  riskMitigants.push({
    area: 'Land & Site Readiness',
    risk: landLower.includes('owned')
      ? 'Low site acquisition delay risk since land is already owned.'
      : landStatus
      ? `Site status is "${landStatus}", which requires clear title or lease continuity before loan release.`
      : 'Land ownership or lease arrangement is not yet finalized.',
    mitigant: landLower.includes('owned')
      ? 'Keep registered sale deed, land conversion, and local approvals ready for bank legal verification.'
      : 'Complete lease agreement or land allotment letter early so project setup stays on schedule.',
  });

  // Collateral risk
  const collLower = collateralStatus.toLowerCase();
  const covNum = parseNum(rp?.collateralCoveragePct);
  riskMitigants.push({
    area: 'Collateral & Loan Security',
    risk:
      collLower.includes('available') || collLower.includes('yes') || (covNum !== null && covNum >= 50)
        ? 'Standard property valuation and title verification required by the lending bank.'
        : 'Limited collateral coverage may increase lender caution for larger loan amounts.',
    mitigant:
      collLower.includes('available') || collLower.includes('yes') || (covNum !== null && covNum >= 50)
        ? 'Provide updated property documents for quick bank valuation alongside primary plant and machinery hypothecation.'
        : 'Explore CGTMSE credit guarantee coverage (for eligible MSME loans) or offer additional promoter margin.',
  });

  // Promoter experience risk
  riskMitigants.push({
    area: 'Execution & Management',
    risk: promoterExp
      ? `Project delivery depends on timely machinery installation and team hiring (Promoter experience: ${promoterExp}).`
      : 'Execution timelines can slip if key technical and operations roles are not lined up early.',
    mitigant:
      'Use fixed-price vendor quotations, stage-wise milestone tracking, and experienced plant/operations supervisors.',
  });

  // Credit / CIBIL risk
  const cibilVal = parseNum(rp?.cibilScore);
  riskMitigants.push({
    area: 'Credit Track Record',
    risk: rp?.isNewToCredit
      ? 'Promoter is new to commercial borrowing, so banks have limited past repayment history to review.'
      : cibilVal !== null && cibilVal >= 750
      ? `Strong CIBIL score (${cibilVal}) supports smooth credit clearance.`
      : cibilVal !== null
      ? `CIBIL score of ${cibilVal} may draw closer review of existing loans or repayment track record.`
      : 'Promoter credit bureau report (CIBIL) will be verified by the bank during appraisal.',
    mitigant:
      cibilVal !== null && cibilVal >= 750
        ? 'Maintain clean repayment history on all existing accounts during the loan appraisal window.'
        : 'Keep all existing EMIs and tax filings up to date and document promoter net worth clearly.',
  });

  // Leverage / Cash flow risk
  riskMitigants.push({
    area: 'Debt & Cash Flow Comfort',
    risk:
      eqPct !== null && eqPct < 25
        ? `Higher loan share (${debtPct}% loan vs ${eqPct}% equity) increases fixed monthly EMI pressure in early months.`
        : 'Initial ramp-up period after launch can tighten working capital if sales scale slower than planned.',
    mitigant:
      'Request an appropriate construction/moratorium period from the bank and keep a working capital buffer for initial operations.',
  });

  // 9. Setup Readiness Milestones (DPR Section 3)
  const setupMilestones: string[] = [
    `Site & Land: ${landStatus || 'Land ownership or lease arrangement to be confirmed before bank sanction.'}`,
    `Security & Collateral: ${collateralStatus || 'Primary security on project assets; collateral details to be confirmed with bank.'}`,
    `Promoter Readiness: ${promoterExp ? `${promoterExp} experience on record` : 'Promoter track record and KYC documentation under compilation'}.`,
    bankName
      ? `Banking Alignment: Preferred lender identified as ${bankName}${branchLocation ? ` (${branchLocation})` : ''}.`
      : 'Banking Alignment: Lender shortlist to be finalized based on loan size and sector preference.',
  ];

  // 10. Strengths & Recommendations (grounded in real data)
  const strengths: string[] = [];
  const recommendations: string[] = [];

  if (dscrNum !== null && dscrNum > 0) {
    if (dscrNum >= 1.33) {
      strengths.push(
        `Estimated DSCR of ${dscrNum.toFixed(2)}x meets the standard bank comfort level (1.33x or above).`
      );
    } else {
      recommendations.push(
        `Estimated DSCR of ${dscrNum.toFixed(2)}x is below 1.33x; consider a slightly longer loan tenure or higher promoter margin.`
      );
    }
  }
  if (eqPct !== null && eqPct >= 25) {
    strengths.push(
      `Promoter contribution of ${eqPct}% (${fmtCr(promoterEquityNum)}) provides a healthy own-funds margin.`
    );
  } else if (eqPct !== null && eqPct > 0 && eqPct < 25) {
    recommendations.push(
      `Promoter contribution is ${eqPct}%; most banks prefer 25% to 30% own investment for new projects.`
    );
  }
  if (landLower.includes('owned')) {
    strengths.push(`Project land is ${landStatus}, which reduces setup delay risk.`);
  }
  if (rp && !rp.isNewToCredit && cibilVal !== null && cibilVal >= 750) {
    strengths.push(`Strong promoter credit score (CIBIL ${cibilVal}).`);
  }
  if (Array.isArray(computedSummary?.strengths)) {
    computedSummary.strengths.forEach((s) => {
      const t = cleanAsciiText(s);
      if (t && strengths.length < 4 && !strengths.some((ex) => ex.toLowerCase() === t.toLowerCase())) {
        strengths.push(t);
      }
    });
  }
  if (Array.isArray(computedSummary?.recommendations)) {
    computedSummary.recommendations.forEach((rec) => {
      const t = cleanAsciiText(rec);
      if (t && recommendations.length < 4 && !recommendations.some((ex) => ex.toLowerCase() === t.toLowerCase())) {
        recommendations.push(t);
      }
    });
  }

  // 11. DPR & Bank Submission Checklist
  const status = cleanAsciiText(data.status, 'In Review');
  const stage = cleanAsciiText(data.stage, 'Initial Assessment');
  const assignedCA = cleanAsciiText(data.assignedCA, 'Not assigned yet');
  const dprAssignedTo = cleanAsciiText(data.dprAssignedTo, 'Not assigned yet');
  const caReviewNotes = cleanAsciiText(data.caReviewNotes, '');
  const checklistStatus = data.checklistUploaded
    ? `Uploaded${cleanAsciiText(data.checklistFileName) ? ` (${cleanAsciiText(data.checklistFileName)})` : ''}`
    : 'To be submitted';

  const docsObj = data.documents || {};
  const documentRows: Array<[string, string]> = [
    [
      'Company KYC (PAN, GST, Registration / COI)',
      cleanAsciiText(docsObj.companyKyc) ? `Uploaded (${cleanAsciiText(docsObj.companyKyc)})` : 'Required for bank submission',
    ],
    [
      'Promoter KYC (PAN, Aadhaar, Net Worth Statement)',
      cleanAsciiText(docsObj.promoterKyc) ? `Uploaded (${cleanAsciiText(docsObj.promoterKyc)})` : 'Required for bank submission',
    ],
    [
      'Land / Lease Papers & Local Approvals',
      landLower.includes('owned') ? 'Land owned - attach title deed & tax receipts' : 'Attach lease / allotment agreement',
    ],
    [
      'Machinery & Civil Cost Quotations',
      checklistStatus,
    ],
    [
      'Detailed Project Report (DPR)',
      cleanAsciiText(data.dprFile || docsObj.dpr)
        ? `Uploaded (${cleanAsciiText(data.dprFile || docsObj.dpr)})`
        : 'In preparation',
    ],
    [
      'Financial Statements, ITRs & CMA Projections',
      cleanAsciiText(data.cmaFile || docsObj.financialModel)
        ? `Uploaded (${cleanAsciiText(data.cmaFile || docsObj.financialModel)})`
        : 'In preparation',
    ],
  ];

  if (cleanAsciiText(docsObj.otherDocs)) {
    documentRows.push(['Supporting Documents', `Uploaded (${cleanAsciiText(docsObj.otherDocs)})`]);
  }
  if (Array.isArray(data.uploadedDocuments) && data.uploadedDocuments.length > 0) {
    const extraNames = data.uploadedDocuments
      .map((item) => (typeof item === 'string' ? cleanAsciiText(item) : cleanAsciiText(item?.name || item?.label)))
      .filter(Boolean);
    if (extraNames.length > 0) {
      documentRows.push(['Additional Uploaded Files', extraNames.join(', ')]);
    }
  }

  return {
    projectName,
    sector,
    promoter,
    companyName,
    location,
    contactEmail,
    contactPhone,
    refCode,
    dateStr,
    totalCostNum: effectiveTotalCost,
    termLoanNum,
    promoterEquityNum,
    otherFinanceNum,
    totalFundingNum,
    debtPct,
    eqPct,
    otherPct,
    debtEquityRatioLabel,
    isFundingBalanced,
    estRate,
    costRows,
    costBreakdownNote,
    financeRows,
    dscrNum,
    dscrLabel,
    feasibilityNum,
    feasibilityLabel,
    bankabilityScoreNum,
    bankabilityLabel,
    ratingLetter,
    riskLevel,
    riskHighlights,
    strengths,
    recommendations,
    executiveVerdict,
    businessOverviewSummary,
    nextStepsLines,
    readinessRows,
    bankRows,
    viabilityIndicators,
    riskMitigants,
    setupMilestones,
    overviewRows,
    projectBrief,
    promoters,
    status,
    stage,
    assignedCA,
    dprAssignedTo,
    caReviewNotes,
    checklistStatus,
    documentRows,
    isFunded: Boolean(data.isFunded),
  };
}

// ============================================================================
// Shared Minimalist Institutional A4 PDF Builder
// ============================================================================

class InstitutionalPdfBuilder {
  doc: jsPDF;
  pageW = 210;
  pageH = 297;
  margin = 16;
  contentW = 178;
  footerLimitY = 270;
  y = 16;
  docTitle: string;
  projectName: string;
  refCode: string;
  dateStr: string;
  footerLabel: string;

  constructor(opts: {
    docTitle: string;
    projectName: string;
    refCode: string;
    dateStr: string;
    footerLabel: string;
  }) {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    this.doc.setProperties({
      title: `${opts.projectName} - ${opts.docTitle}`,
      subject: opts.docTitle,
      author: 'Inisio Advisory',
      creator: 'Inisio Greenfield Advisory Platform',
    });
    this.docTitle = cleanAsciiText(opts.docTitle);
    this.projectName = cleanAsciiText(opts.projectName);
    this.refCode = cleanAsciiText(opts.refCode);
    this.dateStr = cleanAsciiText(opts.dateStr);
    this.footerLabel = cleanAsciiText(opts.footerLabel);
    this.drawTopAccentBar();
  }

  drawTopAccentBar(): void {
    this.doc.setFillColor(37, 99, 235);
    this.doc.rect(0, 0, this.pageW, 2.2, 'F');
  }

  addContinuationPage(): void {
    this.doc.addPage();
    this.drawTopAccentBar();

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text('INISIO ADVISORY', this.margin, 11);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.6);
    this.doc.setTextColor(100, 116, 139);
    const shortTitle =
      this.projectName.length > 48 ? `${this.projectName.slice(0, 46)}...` : this.projectName;
    this.doc.text(`${shortTitle}  |  ${this.docTitle}`, this.pageW - this.margin, 11, {
      align: 'right',
    });

    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.25);
    this.doc.line(this.margin, 14, this.pageW - this.margin, 14);
    this.y = 21;
  }

  ensureSpace(neededMm: number): void {
    if (this.y + neededMm > this.footerLimitY) {
      this.addContinuationPage();
    }
  }

  drawMainHeader(subtitleLine: string, badgeLine: string): void {
    this.y = 14.5;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(15);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text('INISIO', this.margin, this.y);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('PROJECT ADVISORY & BANK FUNDING', this.margin, this.y + 4.4);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(cleanAsciiText(badgeLine), this.pageW - this.margin, this.y, { align: 'right' });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(`Ref: ${this.refCode}  |  Date: ${this.dateStr}`, this.pageW - this.margin, this.y + 4.4, {
      align: 'right',
    });

    this.y += 8.8;
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.y, this.pageW - this.margin, this.y);

    this.y += 7.5;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(15, 23, 42);
    const titleLines = this.doc.splitTextToSize(this.projectName, this.contentW);
    this.doc.text(titleLines, this.margin, this.y);
    this.y += titleLines.length * 5.8 + 1;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.8);
    this.doc.setTextColor(71, 85, 105);
    const subLines = this.doc.splitTextToSize(cleanAsciiText(subtitleLine), this.contentW);
    this.doc.text(subLines, this.margin, this.y);
    this.y += subLines.length * 4.4 + 4;
  }

  drawKpiRow(items: Array<{ label: string; value: string; sub?: string }>): void {
    const cardH = 19.5;
    this.ensureSpace(cardH + 5);
    const gap = 3.5;
    const cardW = (this.contentW - gap * (items.length - 1)) / items.length;

    items.forEach((kpi, idx) => {
      const x = this.margin + idx * (cardW + gap);
      this.doc.setFillColor(248, 250, 252);
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.25);
      this.doc.roundedRect(x, this.y, cardW, cardH, 1.5, 1.5, 'FD');

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(cleanAsciiText(kpi.label), x + 3, this.y + 5.2);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9.4);
      this.doc.setTextColor(15, 23, 42);
      const valLines = this.doc.splitTextToSize(cleanAsciiText(kpi.value), cardW - 6);
      this.doc.text(valLines[0] || cleanAsciiText(kpi.value), x + 3, this.y + 11.4);

      if (kpi.sub) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(6.7);
        this.doc.setTextColor(71, 85, 105);
        const subLines = this.doc.splitTextToSize(cleanAsciiText(kpi.sub), cardW - 6);
        this.doc.text(subLines[0] || '', x + 3, this.y + 16.2);
      }
    });

    this.y += cardH + 7;
  }

  drawSectionHeading(title: string): void {
    this.ensureSpace(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.4);
    this.doc.setTextColor(37, 99, 235);
    this.doc.text(cleanAsciiText(title), this.margin, this.y);
    this.y += 2.2;
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.y, this.pageW - this.margin, this.y);
    this.y += 5.4;
  }

  drawKeyValueList(rows: Array<[string, string]>, labelColW = 54): void {
    if (!rows.length) return;
    const valColW = this.contentW - labelColW - 2;
    rows.forEach(([label, value]) => {
      const safeVal = cleanAsciiText(value, '-');
      const wrapped = this.doc.splitTextToSize(safeVal, valColW);
      const rowH = Math.max(5.4, wrapped.length * 4.2 + 1.5);
      this.ensureSpace(rowH + 1);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8.2);
      this.doc.setTextColor(71, 85, 105);
      this.doc.text(cleanAsciiText(label), this.margin, this.y);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.2);
      this.doc.setTextColor(15, 23, 42);
      this.doc.text(wrapped, this.margin + labelColW, this.y);

      this.y += rowH;
    });
    this.y += 2.5;
  }

  drawParagraph(text: string): void {
    const safe = cleanAsciiText(text);
    if (!safe) return;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.4);
    this.doc.setTextColor(51, 65, 85);
    const lines = this.doc.splitTextToSize(safe, this.contentW);
    lines.forEach((line: string) => {
      this.ensureSpace(5);
      this.doc.text(line, this.margin, this.y);
      this.y += 4.3;
    });
    this.y += 3;
  }

  drawParagraphBox(label: string, text: string): void {
    const safe = cleanAsciiText(text);
    if (!safe) return;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.3);
    const lines = this.doc.splitTextToSize(safe, this.contentW - 6);
    const boxH = lines.length * 4.3 + 9.2;

    if (boxH > 90) {
      this.ensureSpace(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.8);
      this.doc.setTextColor(71, 85, 105);
      this.doc.text(cleanAsciiText(label).toUpperCase(), this.margin, this.y);
      this.y += 4.4;
      this.drawParagraph(safe);
      return;
    }

    this.ensureSpace(boxH + 4);
    this.doc.setFillColor(248, 250, 252);
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.25);
    this.doc.roundedRect(this.margin, this.y, this.contentW, boxH, 1.5, 1.5, 'FD');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.3);
    this.doc.setTextColor(71, 85, 105);
    this.doc.text(cleanAsciiText(label).toUpperCase(), this.margin + 3, this.y + 4.7);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.2);
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(lines, this.margin + 3, this.y + 9.2);

    this.y += boxH + 4.5;
  }

  drawTable(opts: {
    headers: Array<{ label: string; width: number; align?: 'left' | 'right' }>;
    rows: Array<{ cells: string[]; isTotal?: boolean }>;
    caption?: string;
  }): void {
    if (!opts.rows.length) return;
    const headerH = 7;

    const renderHeader = () => {
      this.doc.setFillColor(241, 245, 249);
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.25);
      this.doc.rect(this.margin, this.y, this.contentW, headerH, 'F');
      this.doc.line(this.margin, this.y + headerH, this.margin + this.contentW, this.y + headerH);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(30, 41, 59);

      let cx = this.margin;
      opts.headers.forEach((h) => {
        if (h.align === 'right') {
          this.doc.text(cleanAsciiText(h.label), cx + h.width - 2.5, this.y + 4.7, { align: 'right' });
        } else {
          this.doc.text(cleanAsciiText(h.label), cx + 2.5, this.y + 4.7);
        }
        cx += h.width;
      });
      this.y += headerH;
    };

    this.ensureSpace(headerH + 9);
    renderHeader();

    opts.rows.forEach((row) => {
      this.doc.setFont('helvetica', row.isTotal ? 'bold' : 'normal');
      this.doc.setFontSize(8);

      const wrappedCells = row.cells.map((cell, idx) => {
        const colW = opts.headers[idx]?.width ?? 30;
        return this.doc.splitTextToSize(cleanAsciiText(cell, '-'), Math.max(10, colW - 5));
      });
      const maxLines = Math.max(...wrappedCells.map((l) => l.length), 1);
      const rowH = Math.max(6.6, maxLines * 4.0 + 2.6);

      if (this.y + rowH > this.footerLimitY) {
        this.addContinuationPage();
        renderHeader();
      }

      if (row.isTotal) {
        this.doc.setFillColor(239, 246, 255);
        this.doc.rect(this.margin, this.y, this.contentW, rowH, 'F');
      }

      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.2);
      this.doc.line(this.margin, this.y + rowH, this.margin + this.contentW, this.y + rowH);

      this.doc.setFont('helvetica', row.isTotal ? 'bold' : 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(row.isTotal ? 15 : 51, row.isTotal ? 23 : 65, row.isTotal ? 42 : 85);

      let cx = this.margin;
      wrappedCells.forEach((lines, idx) => {
        const h = opts.headers[idx];
        const colW = h?.width ?? 30;
        if (h?.align === 'right') {
          this.doc.text(lines, cx + colW - 2.5, this.y + 4.5, { align: 'right' });
        } else {
          this.doc.text(lines, cx + 2.5, this.y + 4.5);
        }
        cx += colW;
      });

      this.y += rowH;
    });

    if (opts.caption) {
      this.ensureSpace(5);
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(7.2);
      this.doc.setTextColor(100, 116, 139);
      this.doc.text(cleanAsciiText(opts.caption), this.margin, this.y + 3.6);
      this.y += 5.2;
    }

    this.y += 4;
  }

  drawBulletGroup(heading: string | null, bullets: string[]): void {
    const cleanBullets = bullets.map((b) => cleanAsciiText(b)).filter(Boolean);
    if (!cleanBullets.length) return;
    if (heading) {
      this.ensureSpace(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8.2);
      this.doc.setTextColor(30, 41, 59);
      this.doc.text(cleanAsciiText(heading), this.margin, this.y);
      this.y += 4.5;
    }

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.2);
    this.doc.setTextColor(51, 65, 85);

    cleanBullets.forEach((bullet) => {
      const lines = this.doc.splitTextToSize(`-  ${bullet}`, this.contentW - 2);
      const h = lines.length * 4.2 + 1.4;
      this.ensureSpace(h + 1);
      this.doc.text(lines, this.margin + 1, this.y);
      this.y += h;
    });
    this.y += 2.5;
  }

  finalizeFooters(): void {
    const totalPages = this.doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      this.doc.setPage(page);
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.25);
      this.doc.line(this.margin, 279, this.pageW - this.margin, 279);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7.4);
      this.doc.setTextColor(148, 163, 184);
      this.doc.text(this.footerLabel, this.margin, 284.5);
      this.doc.text(`Page ${page} of ${totalPages}`, this.pageW - this.margin, 284.5, {
        align: 'right',
      });
    }
  }

  output(
    action: 'download' | 'preview',
    filename: string,
    resolved: ResolvedDocumentData,
    documentType: 'teaser' | 'dpr'
  ): PdfGenerationResult {
    this.finalizeFooters();
    const arrayBuffer = this.doc.output('arraybuffer');
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

    if (action === 'download') {
      triggerBlobDownload(blob, filename);
      return { blobUrl: '', blob, filename, resolved, documentType };
    }

    const blobUrl = URL.createObjectURL(blob);
    return { blobUrl, blob, filename, resolved, documentType };
  }
}

// ============================================================================
// 1. Project Teaser PDF (Clean, Simple-English 1-2 Page Lender Summary)
// ============================================================================

export function generateProjectTeaserPDF(
  data: TeaserPDFData,
  action: 'download' | 'preview' = 'download'
): PdfGenerationResult {
  const r = resolveDocumentData(data);

  const builder = new InstitutionalPdfBuilder({
    docTitle: 'Project Teaser',
    projectName: r.projectName,
    refCode: r.refCode,
    dateStr: r.dateStr,
    footerLabel: 'Inisio Advisory  |  Confidential - Project Teaser',
  });

  builder.drawMainHeader(
    `${r.sector}  |  ${r.location}`,
    'CONFIDENTIAL - PROJECT TEASER'
  );

  // Section 1: Project Snapshot (At a Glance)
  builder.drawSectionHeading('1. PROJECT SNAPSHOT (AT A GLANCE)');
  builder.drawKpiRow([
    {
      label: 'TOTAL PROJECT COST',
      value: r.totalCostNum > 0 ? fmtCr(r.totalCostNum) : 'To be finalized',
      sub: r.costRows.length > 1 ? `${r.costRows.length} cost items` : 'Consolidated total',
    },
    {
      label: 'TERM LOAN REQUESTED',
      value: r.termLoanNum > 0 ? fmtCr(r.termLoanNum) : 'To be finalized',
      sub: r.debtPct !== null ? `${r.debtPct}% of total funding` : undefined,
    },
    {
      label: 'PROMOTER CONTRIBUTION',
      value: r.promoterEquityNum > 0 ? fmtCr(r.promoterEquityNum) : 'To be finalized',
      sub: r.eqPct !== null ? `${r.eqPct}% own equity` : undefined,
    },
    {
      label: 'REPAYMENT & SCORE',
      value: `${r.dscrLabel} DSCR`,
      sub:
        r.bankabilityScoreNum !== null
          ? `Rating: ${r.bankabilityLabel}`
          : `Feasibility: ${r.feasibilityLabel}`,
    },
  ]);

  const snapshotRows: Array<[string, string]> = [
    ['Debt-to-Equity Ratio', r.debtEquityRatioLabel],
    ['Feasibility Score', r.feasibilityLabel],
    ['Bankability Rating', r.riskLevel ? `${r.bankabilityLabel} (${r.riskLevel})` : r.bankabilityLabel],
  ];
  builder.drawKeyValueList(snapshotRows, 54);

  // Section 2: Business Overview & Readiness
  builder.drawSectionHeading('2. BUSINESS OVERVIEW & READINESS');
  builder.drawParagraphBox('What This Project Does', r.businessOverviewSummary);
  if (r.readinessRows.length > 0) {
    builder.drawKeyValueList(r.readinessRows, 54);
  }

  // Section 3: Promoter & Company Details
  builder.drawSectionHeading('3. PROMOTER & COMPANY DETAILS');
  const entityRows: Array<[string, string]> = [['Lead Promoter', r.promoter]];
  if (r.companyName && r.companyName.toLowerCase() !== r.promoter.toLowerCase()) {
    entityRows.push(['Company / Borrowing Entity', r.companyName]);
  }
  const contactSummary = [r.contactPhone, r.contactEmail].filter(Boolean).join('  |  ');
  if (contactSummary) {
    entityRows.push(['Verified Contact Details', contactSummary]);
  }
  builder.drawKeyValueList(entityRows, 54);

  if (r.promoters.length > 0) {
    builder.drawTable({
      headers: [
        { label: 'Promoter / Director', width: 46 },
        { label: 'Role', width: 40 },
        { label: 'Experience', width: 28 },
        { label: 'Qualification', width: 44 },
        { label: 'Share %', width: 20, align: 'right' },
      ],
      rows: r.promoters.map((p) => ({
        cells: [p.name, p.role, p.experience, p.qualification, p.shareholding],
      })),
    });
  }

  // Section 4: Cost of Project & Means of Finance
  builder.drawSectionHeading('4. COST OF PROJECT & MEANS OF FINANCE');

  if (r.costRows.length > 0) {
    builder.drawTable({
      headers: [
        { label: 'Project Cost Item (CAPEX)', width: 112 },
        { label: 'Share (%)', width: 26, align: 'right' },
        { label: 'Amount (INR Cr)', width: 40, align: 'right' },
      ],
      rows: [
        ...r.costRows.map((row) => ({
          cells: [
            row.label,
            r.totalCostNum > 0 ? `${((row.amountCr / r.totalCostNum) * 100).toFixed(1)}%` : '-',
            fmtCr(row.amountCr),
          ],
        })),
        {
          cells: ['Total Project Cost', r.totalCostNum > 0 ? '100.0%' : '-', fmtCr(r.totalCostNum)],
          isTotal: true,
        },
      ],
      caption: r.costBreakdownNote || undefined,
    });
  }

  if (r.financeRows.length > 0) {
    builder.drawTable({
      headers: [
        { label: 'Source of Funds (Means of Finance)', width: 112 },
        { label: 'Share (%)', width: 26, align: 'right' },
        { label: 'Amount (INR Cr)', width: 40, align: 'right' },
      ],
      rows: [
        ...r.financeRows.map((row) => ({
          cells: [row.label, row.sharePct, row.value],
        })),
        {
          cells: [
            r.isFundingBalanced ? 'Total Means of Finance (Matched)' : 'Total Means of Finance',
            r.totalFundingNum > 0 ? '100.0%' : '-',
            fmtCr(r.totalFundingNum),
          ],
          isTotal: true,
        },
      ],
      caption: `Debt-to-Equity Ratio: ${r.debtEquityRatioLabel}`,
    });
  }

  // Section 5: Preferred Bank & Next Steps
  builder.drawSectionHeading('5. PREFERRED BANK & NEXT STEPS');
  if (r.bankRows.length > 0) {
    builder.drawKeyValueList(r.bankRows, 54);
  }
  builder.drawBulletGroup('Summary of Funding Request', r.nextStepsLines);

  const filename = `${makeSafeFileSlug(r.projectName)}_Teaser.pdf`;
  return builder.output(action, filename, r, 'teaser');
}

// ============================================================================
// 2. Detailed Project Report (DPR) Executive Summary PDF (8 Clear Sections)
// ============================================================================

export function generateDprExecutiveSummaryPDF(
  data: TeaserPDFData,
  action: 'download' | 'preview' = 'download'
): PdfGenerationResult {
  const r = resolveDocumentData(data);

  const builder = new InstitutionalPdfBuilder({
    docTitle: 'Detailed Project Report (DPR)',
    projectName: r.projectName,
    refCode: r.refCode,
    dateStr: r.dateStr,
    footerLabel: 'Inisio Advisory  |  Detailed Project Report (DPR) Executive Summary',
  });

  builder.drawMainHeader(
    `${r.sector}  |  ${r.location}  |  Promoter: ${r.companyName || r.promoter}`,
    'DETAILED PROJECT REPORT (DPR)'
  );

  // Section 1: Executive Summary
  builder.drawSectionHeading('1. EXECUTIVE SUMMARY');
  builder.drawKpiRow([
    {
      label: 'TOTAL PROJECT COST',
      value: r.totalCostNum > 0 ? fmtCr(r.totalCostNum) : 'To be finalized',
      sub: r.isFundingBalanced ? 'Cost & funding matched' : 'Check funding balance',
    },
    {
      label: 'TERM LOAN REQUESTED',
      value: r.termLoanNum > 0 ? fmtCr(r.termLoanNum) : 'To be finalized',
      sub: r.debtPct !== null ? `${r.debtPct}% loan share` : undefined,
    },
    {
      label: 'PROMOTER MARGIN',
      value: r.promoterEquityNum > 0 ? fmtCr(r.promoterEquityNum) : 'To be finalized',
      sub: r.eqPct !== null ? `${r.eqPct}% own funds` : undefined,
    },
    {
      label: 'REPAYMENT COMFORT',
      value: `${r.dscrLabel} DSCR`,
      sub: `Feasibility: ${r.feasibilityLabel}`,
    },
  ]);
  builder.drawParagraphBox('Executive Overview & Viability Verdict', r.executiveVerdict);

  // Section 2: Promoter & Management Profile
  builder.drawSectionHeading('2. PROMOTER & MANAGEMENT PROFILE');
  const promoterMeta: Array<[string, string]> = [['Lead Promoter', r.promoter]];
  if (r.companyName && r.companyName.toLowerCase() !== r.promoter.toLowerCase()) {
    promoterMeta.push(['Company / Borrowing Entity', r.companyName]);
  }
  const contactLine = [r.contactPhone, r.contactEmail].filter(Boolean).join('  |  ');
  if (contactLine) promoterMeta.push(['Contact Details', contactLine]);
  builder.drawKeyValueList(promoterMeta, 56);

  builder.drawTable({
    headers: [
      { label: 'Promoter / Director', width: 46 },
      { label: 'Role', width: 40 },
      { label: 'Experience', width: 28 },
      { label: 'Qualification', width: 44 },
      { label: 'Share %', width: 20, align: 'right' },
    ],
    rows: r.promoters.map((p) => ({
      cells: [p.name, p.role, p.experience, p.qualification, p.shareholding],
    })),
  });

  if (r.riskHighlights.length > 0) {
    builder.drawKeyValueList(r.riskHighlights, 62);
  }

  // Section 3: Project Details & Implementation Readiness
  builder.drawSectionHeading('3. PROJECT DETAILS & IMPLEMENTATION READINESS');
  const projectDetailRows: Array<[string, string]> = [
    ['Industry / Sector', r.sector],
    ['Project Location', r.location],
    ...r.readinessRows,
  ];
  builder.drawKeyValueList(projectDetailRows, 56);
  builder.drawParagraphBox('Business Description & Scope', r.businessOverviewSummary);
  builder.drawBulletGroup('Key Setup & Readiness Milestones', r.setupMilestones);

  // Section 4: Project Cost Breakdown (CAPEX)
  builder.drawSectionHeading('4. PROJECT COST BREAKDOWN (CAPEX)');
  if (r.costRows.length > 0) {
    builder.drawTable({
      headers: [
        { label: 'Cost Component', width: 112 },
        { label: 'Share (%)', width: 26, align: 'right' },
        { label: 'Amount (INR Cr)', width: 40, align: 'right' },
      ],
      rows: [
        ...r.costRows.map((row) => ({
          cells: [
            row.label,
            r.totalCostNum > 0 ? `${((row.amountCr / r.totalCostNum) * 100).toFixed(1)}%` : '-',
            fmtCr(row.amountCr),
          ],
        })),
        {
          cells: ['Total Project Cost', r.totalCostNum > 0 ? '100.0%' : '-', fmtCr(r.totalCostNum)],
          isTotal: true,
        },
      ],
      caption: r.costBreakdownNote || undefined,
    });
  }

  // Section 5: Means of Finance & Capital Structure
  builder.drawSectionHeading('5. MEANS OF FINANCE & CAPITAL STRUCTURE');
  if (r.financeRows.length > 0) {
    builder.drawTable({
      headers: [
        { label: 'Funding Source', width: 112 },
        { label: 'Share (%)', width: 26, align: 'right' },
        { label: 'Amount (INR Cr)', width: 40, align: 'right' },
      ],
      rows: [
        ...r.financeRows.map((row) => ({
          cells: [row.label, row.sharePct, row.value],
        })),
        {
          cells: [
            r.isFundingBalanced ? 'Total Means of Finance (Matched)' : 'Total Means of Finance',
            r.totalFundingNum > 0 ? '100.0%' : '-',
            fmtCr(r.totalFundingNum),
          ],
          isTotal: true,
        },
      ],
      caption: `Calculated Debt-to-Equity Ratio: ${r.debtEquityRatioLabel}`,
    });
  } else {
    builder.drawParagraph('Funding split (Term Loan vs. Promoter Equity) is yet to be finalized.');
  }

  // Section 6: Financial Viability & Repayment Comfort
  builder.drawSectionHeading('6. FINANCIAL VIABILITY & REPAYMENT COMFORT');
  builder.drawTable({
    headers: [
      { label: 'Bankability Indicator', width: 48 },
      { label: 'Project Figure', width: 38 },
      { label: 'What This Means for Loan Safety', width: 92 },
    ],
    rows: r.viabilityIndicators.map((v) => ({
      cells: [v.metric, v.value, v.meaning],
    })),
  });
  builder.drawBulletGroup('Key Project Strengths', r.strengths);
  builder.drawBulletGroup('Points to Strengthen Before Sanction', r.recommendations);

  // Section 7: Key Risks & Mitigants
  builder.drawSectionHeading('7. KEY RISKS & MITIGANTS');
  builder.drawTable({
    headers: [
      { label: 'Risk Area', width: 36 },
      { label: 'Key Risk', width: 66 },
      { label: 'How It Is Managed', width: 76 },
    ],
    rows: r.riskMitigants.map((rm) => ({
      cells: [rm.area, rm.risk, rm.mitigant],
    })),
  });

  // Section 8: Bank Details & Submission Checklist
  builder.drawSectionHeading('8. BANK DETAILS & SUBMISSION CHECKLIST');
  if (r.bankRows.length > 0) {
    builder.drawKeyValueList(r.bankRows, 56);
  }
  const trackingRows: Array<[string, string]> = [
    ['Current Status', r.status],
    ['Workflow Stage', r.stage],
  ];
  if (r.assignedCA && r.assignedCA !== 'Not assigned yet') {
    trackingRows.push(['Assigned CA Reviewer', r.assignedCA]);
  }
  if (r.dprAssignedTo && r.dprAssignedTo !== 'Not assigned yet') {
    trackingRows.push(['Assigned DPR Consultant', r.dprAssignedTo]);
  }
  builder.drawKeyValueList(trackingRows, 56);

  builder.drawTable({
    headers: [
      { label: 'Standard Bank Submission Document', width: 88 },
      { label: 'Current Status / Action', width: 90 },
    ],
    rows: r.documentRows.map(([docLabel, docStatus]) => ({
      cells: [docLabel, docStatus],
    })),
    caption: 'Note: Exact document requirements may vary slightly depending on the lending bank and loan scheme.',
  });

  if (r.caReviewNotes) {
    builder.drawParagraphBox('Reviewer Notes', r.caReviewNotes);
  }

  const filename = `${makeSafeFileSlug(r.projectName)}_DPR.pdf`;
  return builder.output(action, filename, r, 'dpr');
}
