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

export interface PdfGenerationResult {
  blobUrl: string;
  filename: string;
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
  financeRows: Array<{ label: string; value: string }>;

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

const parseNum = (val: unknown): number | null => {
  if (val === undefined || val === null || val === '') return null;
  const parsed = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const fmtCr = (val: number): string => `INR ${val.toFixed(2)} Cr`;

const cleanText = (val: unknown, fallback = ''): string => {
  if (val === undefined || val === null) return fallback;
  const cleaned = String(val)
    .replace(/₹/g, 'INR ')
    .replace(/[•·]/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
};

const makeFileSlug = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'Project';

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
    promoterContribCr:
      fin.promoterContributionCr || mof.equityCr || lead.promoterContribCr,
    promoterContributionCr:
      fin.promoterContributionCr || mof.equityCr || lead.promoterContribCr,
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
 * Reconciles and normalizes all entered/saved project data into a single clean view model
 * shared identically by Teaser PDF, DPR Executive Summary PDF, and Teaser DOCX.
 */
export function resolveDocumentData(data: TeaserPDFData): ResolvedDocumentData {
  const projectName = cleanText(data.projectName, 'Greenfield Industrial Project');
  const sector = cleanText(data.industry, 'Industrial Sector');
  const promoter = cleanText(data.fullName || data.companyName, 'Lead Promoter');
  const companyName = cleanText(data.companyName, '');
  const location = cleanText(data.location, 'India');
  const contactEmail = cleanText(data.email, '');
  const contactPhone = cleanText(data.mobile || data.phone, '');

  const dateObj = data.updatedAt ? new Date(data.updatedAt) : new Date();
  const validDate = Number.isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const dateStr = validDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const refCode = cleanText(
    data.bankAppRefNumber,
    `INS-${validDate.getFullYear()}-${String(validDate.getTime()).slice(-4)}`
  );

  // 1. Resolve Cost Breakdown (custom components first, then explicit standard breakdown)
  const rawCustomCosts =
    Array.isArray(data.costComponents) && data.costComponents.length > 0
      ? data.costComponents
      : Array.isArray(data.customCostComponents) && data.customCostComponents.length > 0
      ? data.customCostComponents
      : [];

  const parsedCustomCosts = rawCustomCosts
    .map((item) => ({
      label: cleanText(item.category || item.name || item.label, ''),
      amountCr: parseNum(item.amountCr ?? item.amount ?? item.value) ?? 0,
    }))
    .filter((item) => item.label && item.amountCr > 0);

  const machineryVal = parseNum(data.machineryCostCr ?? data.financials?.machineryCostCr);
  const civilVal = parseNum(data.civilCostCr ?? data.financials?.civilCostCr);
  const consultancyVal = parseNum(data.consultancyCostCr ?? data.financials?.consultancyCostCr);
  const otherCostVal = parseNum(data.otherCostsCr ?? data.financials?.otherCostsCr);

  const standardCostRows: Array<{ label: string; amountCr: number }> = [];
  if (machineryVal !== null && machineryVal > 0) {
    standardCostRows.push({ label: 'Plant & Machinery', amountCr: machineryVal });
  }
  if (civilVal !== null && civilVal > 0) {
    standardCostRows.push({ label: 'Civil Works, Land & Building', amountCr: civilVal });
  }
  if (consultancyVal !== null && consultancyVal > 0) {
    standardCostRows.push({ label: 'Consultancy, Pre-Op & Contingencies', amountCr: consultancyVal });
  }
  if (otherCostVal !== null && otherCostVal > 0) {
    standardCostRows.push({ label: 'Working Capital Margin / Other Capex', amountCr: otherCostVal });
  }

  let costRows: Array<{ label: string; amountCr: number }> = [];
  let costBreakdownNote = '';

  if (parsedCustomCosts.length > 0) {
    costRows = parsedCustomCosts;
    costBreakdownNote = 'User-specified itemized project cost schedule';
  } else if (standardCostRows.length > 0) {
    costRows = standardCostRows;
    costBreakdownNote =
      data.hasExplicitBreakdown === false
        ? 'Indicative benchmark allocation (subject to DPR quotations)'
        : 'Itemized project cost schedule as entered';
  }

  const itemizedCostSum = costRows.reduce((sum, r) => sum + r.amountCr, 0);
  const explicitTotalCost = parseNum(data.totalCostCr ?? data.projectCost);
  const totalCostNum =
    explicitTotalCost !== null && explicitTotalCost > 0
      ? explicitTotalCost
      : itemizedCostSum > 0
      ? itemizedCostSum
      : 0;

  if (costRows.length === 0 && totalCostNum > 0) {
    costRows = [{ label: 'Total Project Outlay (Consolidated)', amountCr: totalCostNum }];
    costBreakdownNote = 'Consolidated project outlay (detailed capex split pending)';
  }

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
      label: cleanText(item.category || item.name || item.label, ''),
      amountCr: parseNum(item.amountCr ?? item.amount ?? item.value) ?? 0,
    }))
    .filter((item) => item.label && item.amountCr > 0);

  const customFinSum = parsedCustomFinance.reduce((sum, r) => sum + r.amountCr, 0);

  const termLoanNum = rawLoan !== null && rawLoan >= 0 ? rawLoan : 0;
  const promoterEquityNum =
    rawEquity !== null && rawEquity >= 0
      ? rawEquity
      : totalCostNum > 0 && termLoanNum > 0
      ? Math.max(0, Number((totalCostNum - termLoanNum - rawOtherFin - customFinSum).toFixed(2)))
      : 0;
  const otherFinanceNum = Math.max(0, rawOtherFin);
  const totalFundingNum = Number(
    (termLoanNum + promoterEquityNum + otherFinanceNum + customFinSum).toFixed(2)
  );

  const effectiveTotalCost = totalCostNum > 0 ? totalCostNum : totalFundingNum;
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
    debtEquityRatioLabel = `${ratio} : 1 (${debtPct}% Debt / ${eqPct}% Equity)`;
  } else if (termLoanNum > 0 && promoterEquityNum === 0) {
    debtEquityRatioLabel = '100% Debt Proposed';
  } else if (promoterEquityNum > 0 && termLoanNum === 0) {
    debtEquityRatioLabel = '100% Promoter Equity';
  }

  const isFundingBalanced =
    effectiveTotalCost === 0 ||
    totalFundingNum === 0 ||
    Math.abs(effectiveTotalCost - totalFundingNum) < 0.05;

  const estRate = cleanText(data.estInterestRate, '');

  const financeRows: Array<{ label: string; value: string }> = [];
  if (termLoanNum > 0) {
    financeRows.push({
      label: debtPct !== null ? `Proposed Term Loan (${debtPct}%)` : 'Proposed Term Loan',
      value: fmtCr(termLoanNum),
    });
  }
  if (promoterEquityNum > 0) {
    financeRows.push({
      label: eqPct !== null ? `Promoter Equity Contribution (${eqPct}%)` : 'Promoter Equity Contribution',
      value: fmtCr(promoterEquityNum),
    });
  }
  if (otherFinanceNum > 0) {
    financeRows.push({
      label:
        otherPct && otherPct > 0
          ? `Subsidy / Other Finance (${otherPct}%)`
          : 'Subsidy / Other Finance',
      value: fmtCr(otherFinanceNum),
    });
  }
  parsedCustomFinance.forEach((cf) => {
    financeRows.push({ label: cf.label, value: fmtCr(cf.amountCr) });
  });
  if (estRate) {
    financeRows.push({
      label: 'Indicative Debt Pricing',
      value: estRate.toLowerCase().includes('p.a') ? estRate : `${estRate} p.a.`,
    });
  }
  if (termLoanNum > 0 || promoterEquityNum > 0) {
    financeRows.push({
      label: 'Debt : Equity Ratio',
      value: debtEquityRatioLabel,
    });
  }

  // 3. Resolve Scores & Risk Profile
  const dscrNum = parseNum(data.dscrEstimate ?? data.dscr);
  const dscrLabel = dscrNum !== null && dscrNum > 0 ? `${dscrNum.toFixed(2)}x` : 'Pending';

  const feasibilityNum = parseNum(data.feasibilityScore ?? data.bankabilityScore);
  const feasibilityLabel =
    feasibilityNum !== null && feasibilityNum > 0 ? `${Math.round(feasibilityNum)} / 100` : 'Pending';

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

  const ratingLetter = cleanText(computedSummary?.ratingLetter, '');
  const riskLevel = cleanText(computedSummary?.riskLevel, '');
  const bankabilityLabel =
    bankabilityScoreNum !== null
      ? `${bankabilityScoreNum.toFixed(1)} / 10${ratingLetter ? ` (Grade ${ratingLetter})` : ''}`
      : cleanText(data.bankabilityRating, 'Pending');

  const riskHighlights: Array<[string, string]> = [];
  if (rp) {
    if (rp.businessConstitution) {
      riskHighlights.push(['Business Constitution', cleanText(rp.businessConstitution)]);
    }
    if (rp.businessVintage) {
      riskHighlights.push(['Promoter Group Vintage', cleanText(rp.businessVintage)]);
    }
    if (rp.isNewToCredit) {
      riskHighlights.push(['Credit Bureau Profile', 'New to Commercial Credit (NTC)']);
    } else if (rp.cibilScore !== undefined && rp.cibilScore !== null && rp.cibilScore !== '') {
      riskHighlights.push(['Lead Promoter CIBIL / CMR', `${cleanText(rp.cibilScore)}`]);
    }
    if (rp.collateralCoveragePct !== undefined && rp.collateralCoveragePct !== null && rp.collateralCoveragePct !== '') {
      const covNum = parseNum(rp.collateralCoveragePct);
      riskHighlights.push([
        'Collateral Coverage (% of Loan)',
        covNum === 0 ? 'CGTMSE / Clean Lending (0%)' : `${cleanText(rp.collateralCoveragePct)}%`,
      ]);
    }
    if (rp.offtakeSecurity) {
      riskHighlights.push(['Offtake / Revenue Visibility', cleanText(rp.offtakeSecurity)]);
    }
    if (rp.managementTeamStrength) {
      riskHighlights.push(['Management Depth', cleanText(rp.managementTeamStrength)]);
    }
    if (rp.educationalBackground) {
      riskHighlights.push(['Promoter Qualification', cleanText(rp.educationalBackground)]);
    }
  }

  // 4. Resolve Profile & Banking Overview Rows (only populated fields)
  const overviewRows: Array<[string, string]> = [
    ['Lead Promoter / Signatory', promoter],
  ];
  if (companyName && companyName.toLowerCase() !== promoter.toLowerCase()) {
    overviewRows.push(['Company / Borrowing Entity', companyName]);
  }
  overviewRows.push(['Industry / Sector', sector]);
  overviewRows.push(['Project Location', location]);

  const contactLine = [contactPhone, contactEmail].filter(Boolean).join('  |  ');
  if (contactLine) {
    overviewRows.push(['Contact Details', contactLine]);
  }
  if (cleanText(data.landStatus)) {
    overviewRows.push(['Land & Site Status', cleanText(data.landStatus)]);
  }
  if (cleanText(data.collateralStatus)) {
    overviewRows.push(['Collateral Security', cleanText(data.collateralStatus)]);
  }
  if (cleanText(data.promoterExp)) {
    overviewRows.push(['Promoter Experience', cleanText(data.promoterExp)]);
  }
  if (cleanText(data.bankName)) {
    const bankParts = [
      cleanText(data.bankName),
      cleanText(data.branchLocation),
      cleanText(data.bankIfscCode) ? `IFSC: ${cleanText(data.bankIfscCode)}` : '',
    ].filter(Boolean);
    overviewRows.push(['Preferred Lending Bank', bankParts.join(' - ')]);
  }
  if (cleanText(data.bankAppRefNumber)) {
    overviewRows.push(['Bank Application Ref.', cleanText(data.bankAppRefNumber)]);
  }

  const projectBrief = cleanText(data.description || data.notes, '');

  // 5. Resolve Promoters / Directors List
  const promoters: ResolvedDocumentData['promoters'] = [];
  if (Array.isArray(data.promotersList) && data.promotersList.length > 0) {
    data.promotersList.forEach((p, idx) => {
      const name = cleanText(p.name, `Promoter ${idx + 1}`);
      const role = cleanText(p.role, idx === 0 ? 'Lead Promoter' : 'Co-Promoter / Director');
      const exp = cleanText(p.experienceYears || p.experience, '-');
      const qual = cleanText(p.qualification, '-');
      const shareNum = parseNum(p.shareholdingPct);
      const share = shareNum !== null && shareNum > 0 ? `${shareNum}%` : '-';
      promoters.push({ name, role, experience: exp, qualification: qual, shareholding: share });
    });
  } else if (Array.isArray(data.directors) && data.directors.length > 0) {
    data.directors.forEach((d, idx) => {
      promoters.push({
        name: cleanText(d.name, `Director ${idx + 1}`),
        role: cleanText(d.title, idx === 0 ? 'Managing Director / Promoter' : 'Director'),
        experience: idx === 0 ? cleanText(data.promoterExp, '-') : '-',
        qualification: idx === 0 ? cleanText(rp?.educationalBackground, '-') : '-',
        shareholding: '-',
      });
    });
  } else {
    promoters.push({
      name: promoter,
      role: 'Lead Promoter / Authorized Signatory',
      experience: cleanText(data.promoterExp, '-'),
      qualification: cleanText(rp?.educationalBackground, '-'),
      shareholding: '100%',
    });
  }

  // 6. Strengths & Recommendations (grounded in actual numbers)
  const strengths: string[] = [];
  const recommendations: string[] = [];

  if (dscrNum !== null && dscrNum > 0) {
    if (dscrNum >= 1.33) {
      strengths.push(
        `Modeled DSCR of ${dscrNum.toFixed(2)}x exceeds commercial bank greenfield benchmark norms (1.33x).`
      );
    } else {
      recommendations.push(
        `Modeled DSCR of ${dscrNum.toFixed(2)}x is below 1.33x; consider elongating debt tenor or strengthening operating margins.`
      );
    }
  }
  if (eqPct !== null && eqPct >= 25) {
    strengths.push(
      `Promoter equity contribution of ${eqPct}% (${fmtCr(promoterEquityNum)}) provides a healthy bank margin buffer.`
    );
  } else if (eqPct !== null && eqPct > 0 && eqPct < 25) {
    recommendations.push(
      `Promoter equity at ${eqPct}% is below standard 25-30% greenfield margin; lender may seek additional margin or collateral.`
    );
  }
  if (cleanText(data.landStatus).toLowerCase().includes('owned')) {
    strengths.push(`Project land is ${cleanText(data.landStatus)}, lowering site execution risk.`);
  }
  if (rp && !rp.isNewToCredit && parseNum(rp.cibilScore) !== null && Number(rp.cibilScore) >= 750) {
    strengths.push(`Strong promoter credit bureau standing (CIBIL ${cleanText(rp.cibilScore)}).`);
  }
  if (Array.isArray(computedSummary?.strengths)) {
    computedSummary.strengths.forEach((s) => {
      const t = cleanText(s);
      if (t && strengths.length < 4 && !strengths.some((existing) => existing.toLowerCase() === t.toLowerCase())) {
        strengths.push(t);
      }
    });
  }
  if (Array.isArray(computedSummary?.recommendations)) {
    computedSummary.recommendations.forEach((r) => {
      const t = cleanText(r);
      if (t && recommendations.length < 4 && !recommendations.some((existing) => existing.toLowerCase() === t.toLowerCase())) {
        recommendations.push(t);
      }
    });
  }

  // 7. DPR & Document Readiness
  const status = cleanText(data.status, 'Under Appraisal');
  const stage = cleanText(data.stage, 'Initial Feasibility');
  const assignedCA = cleanText(data.assignedCA, 'Pending Assignment');
  const dprAssignedTo = cleanText(data.dprAssignedTo, 'Pending Assignment');
  const caReviewNotes = cleanText(data.caReviewNotes, '');
  const checklistStatus = data.checklistUploaded
    ? `Uploaded${cleanText(data.checklistFileName) ? ` (${cleanText(data.checklistFileName)})` : ''}`
    : 'Pending Submission';

  const docsObj = data.documents || {};
  const documentRows: Array<[string, string]> = [
    ['Pre-Appraisal Checklist', checklistStatus],
    ['Company KYC & Incorporation', cleanText(docsObj.companyKyc) ? `On File (${cleanText(docsObj.companyKyc)})` : 'Pending'],
    ['Promoter KYC & Net Worth', cleanText(docsObj.promoterKyc) ? `On File (${cleanText(docsObj.promoterKyc)})` : 'Pending'],
    [
      'Detailed Project Report (DPR)',
      cleanText(data.dprFile || docsObj.dpr)
        ? `Uploaded (${cleanText(data.dprFile || docsObj.dpr)})`
        : 'In Preparation',
    ],
    [
      'CMA / Financial Projections',
      cleanText(data.cmaFile || docsObj.financialModel)
        ? `Uploaded (${cleanText(data.cmaFile || docsObj.financialModel)})`
        : 'In Preparation',
    ],
  ];

  if (cleanText(docsObj.otherDocs)) {
    documentRows.push(['Supporting Annexures', `On File (${cleanText(docsObj.otherDocs)})`]);
  }
  if (Array.isArray(data.uploadedDocuments) && data.uploadedDocuments.length > 0) {
    const extraNames = data.uploadedDocuments
      .map((item) => (typeof item === 'string' ? cleanText(item) : cleanText(item?.name || item?.label)))
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
// Shared Institutional A4 PDF Builder (Automatic Pagination + Clean Typography)
// ============================================================================

class InstitutionalPdfBuilder {
  doc: jsPDF;
  pageW = 210;
  pageH = 297;
  margin = 16;
  contentW = 178;
  footerLimitY = 269;
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
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.docTitle = opts.docTitle;
    this.projectName = opts.projectName;
    this.refCode = opts.refCode;
    this.dateStr = opts.dateStr;
    this.footerLabel = opts.footerLabel;
    this.drawTopAccentBar();
  }

  drawTopAccentBar(): void {
    this.doc.setFillColor(37, 99, 235);
    this.doc.rect(0, 0, this.pageW, 2.5, 'F');
  }

  addContinuationPage(): void {
    this.doc.addPage();
    this.drawTopAccentBar();
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text('INISIO ADVISORY', this.margin, 11);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.8);
    this.doc.setTextColor(100, 116, 139);
    const shortTitle =
      this.projectName.length > 52 ? `${this.projectName.slice(0, 50)}...` : this.projectName;
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

  drawMainHeader(subtitleLine: string): void {
    this.y = 15;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text('INISIO', this.margin, this.y);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.8);
    this.doc.setTextColor(37, 99, 235);
    this.doc.text('GREENFIELD ADVISORY & DEBT SYNDICATION', this.margin, this.y + 4.6);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(this.docTitle, this.pageW - this.margin, this.y, { align: 'right' });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.8);
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(`Ref: ${this.refCode}  |  Date: ${this.dateStr}`, this.pageW - this.margin, this.y + 4.6, {
      align: 'right',
    });

    this.y += 9;
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
    const subLines = this.doc.splitTextToSize(subtitleLine, this.contentW);
    this.doc.text(subLines, this.margin, this.y);
    this.y += subLines.length * 4.5 + 3.5;
  }

  drawKpiRow(items: Array<{ label: string; value: string; sub?: string }>): void {
    const cardH = 19.5;
    this.ensureSpace(cardH + 6);
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
      this.doc.text(kpi.label, x + 3, this.y + 5.5);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(15, 23, 42);
      const valLines = this.doc.splitTextToSize(kpi.value, cardW - 6);
      this.doc.text(valLines[0] || kpi.value, x + 3, this.y + 11.8);

      if (kpi.sub) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(6.8);
        this.doc.setTextColor(71, 85, 105);
        this.doc.text(kpi.sub, x + 3, this.y + 16.5);
      }
    });

    this.y += cardH + 8;
  }

  drawSectionHeading(title: string): void {
    this.ensureSpace(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(37, 99, 235);
    this.doc.text(title, this.margin, this.y);
    this.y += 2.2;
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.y, this.pageW - this.margin, this.y);
    this.y += 5.5;
  }

  drawKeyValueList(rows: Array<[string, string]>, labelColW = 54): void {
    const valColW = this.contentW - labelColW - 2;
    rows.forEach(([label, value]) => {
      const wrapped = this.doc.splitTextToSize(value, valColW);
      const rowH = Math.max(5.5, wrapped.length * 4.3 + 1.5);
      this.ensureSpace(rowH + 1);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8.3);
      this.doc.setTextColor(71, 85, 105);
      this.doc.text(label, this.margin, this.y);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.3);
      this.doc.setTextColor(15, 23, 42);
      this.doc.text(wrapped, this.margin + labelColW, this.y);

      this.y += rowH;
    });
    this.y += 2;
  }

  drawParagraphBox(label: string, text: string): void {
    if (!text) return;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.3);
    const lines = this.doc.splitTextToSize(text, this.contentW - 6);
    const boxH = lines.length * 4.3 + 9.5;

    // If paragraph is very long, render line-by-line with clean page breaks instead of an oversized single box
    if (boxH > 95) {
      this.ensureSpace(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8);
      this.doc.setTextColor(71, 85, 105);
      this.doc.text(label.toUpperCase(), this.margin, this.y);
      this.y += 4.5;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.3);
      this.doc.setTextColor(51, 65, 85);
      lines.forEach((line: string) => {
        this.ensureSpace(5);
        this.doc.text(line, this.margin, this.y);
        this.y += 4.3;
      });
      this.y += 3;
      return;
    }

    this.ensureSpace(boxH + 4);
    this.doc.setFillColor(248, 250, 252);
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.25);
    this.doc.roundedRect(this.margin, this.y, this.contentW, boxH, 1.5, 1.5, 'FD');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.4);
    this.doc.setTextColor(71, 85, 105);
    this.doc.text(label.toUpperCase(), this.margin + 3, this.y + 4.8);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.2);
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(lines, this.margin + 3, this.y + 9.5);

    this.y += boxH + 5;
  }

  drawTable(opts: {
    headers: Array<{ label: string; width: number; align?: 'left' | 'right' }>;
    rows: Array<{ cells: string[]; isTotal?: boolean }>;
    caption?: string;
  }): void {
    const headerH = 7;

    const renderHeader = () => {
      this.doc.setFillColor(241, 245, 249);
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.25);
      this.doc.rect(this.margin, this.y, this.contentW, headerH, 'F');
      this.doc.line(this.margin, this.y + headerH, this.margin + this.contentW, this.y + headerH);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.6);
      this.doc.setTextColor(30, 41, 59);

      let cx = this.margin;
      opts.headers.forEach((h) => {
        if (h.align === 'right') {
          this.doc.text(h.label, cx + h.width - 2.5, this.y + 4.7, { align: 'right' });
        } else {
          this.doc.text(h.label, cx + 2.5, this.y + 4.7);
        }
        cx += h.width;
      });
      this.y += headerH;
    };

    this.ensureSpace(headerH + 9);
    renderHeader();

    opts.rows.forEach((row) => {
      this.doc.setFont('helvetica', row.isTotal ? 'bold' : 'normal');
      this.doc.setFontSize(8.1);

      const wrappedCells = row.cells.map((cell, idx) => {
        const colW = opts.headers[idx]?.width ?? 30;
        return this.doc.splitTextToSize(cell || '-', Math.max(10, colW - 5));
      });
      const maxLines = Math.max(...wrappedCells.map((l) => l.length), 1);
      const rowH = Math.max(6.8, maxLines * 4.1 + 2.6);

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
      this.doc.setFontSize(8.1);
      this.doc.setTextColor(row.isTotal ? 15 : 51, row.isTotal ? 23 : 65, row.isTotal ? 42 : 85);

      let cx = this.margin;
      wrappedCells.forEach((lines, idx) => {
        const h = opts.headers[idx];
        const colW = h?.width ?? 30;
        if (h?.align === 'right') {
          this.doc.text(lines, cx + colW - 2.5, this.y + 4.6, { align: 'right' });
        } else {
          this.doc.text(lines, cx + 2.5, this.y + 4.6);
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
      this.doc.text(opts.caption, this.margin, this.y + 3.8);
      this.y += 5.5;
    }

    this.y += 4.5;
  }

  drawBulletGroup(heading: string, bullets: string[]): void {
    if (!bullets.length) return;
    this.ensureSpace(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8.2);
    this.doc.setTextColor(30, 41, 59);
    this.doc.text(heading, this.margin, this.y);
    this.y += 4.6;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.2);
    this.doc.setTextColor(51, 65, 85);

    bullets.forEach((bullet) => {
      const lines = this.doc.splitTextToSize(`-  ${bullet}`, this.contentW - 2);
      const h = lines.length * 4.3 + 1.4;
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
      this.doc.line(this.margin, 278, this.pageW - this.margin, 278);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(148, 163, 184);
      this.doc.text(this.footerLabel, this.margin, 283.5);
      this.doc.text(`Page ${page} of ${totalPages}`, this.pageW - this.margin, 283.5, {
        align: 'right',
      });
    }
  }

  output(action: 'download' | 'preview', filename: string): PdfGenerationResult | void {
    this.finalizeFooters();
    if (action === 'download') {
      this.doc.save(filename);
      return;
    }
    const blob = this.doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    return { blobUrl, filename };
  }
}

// ============================================================================
// 1. Project Teaser PDF (Clean, Minimal Institutional Teaser)
// ============================================================================

export function generateProjectTeaserPDF(
  data: TeaserPDFData,
  action: 'download' | 'preview' = 'download'
): PdfGenerationResult | void {
  const r = resolveDocumentData(data);

  const builder = new InstitutionalPdfBuilder({
    docTitle: 'EXECUTIVE PROJECT TEASER',
    projectName: r.projectName,
    refCode: r.refCode,
    dateStr: r.dateStr,
    footerLabel: 'Inisio Greenfield Advisory Platform  |  Confidential Commercial Project Teaser',
  });

  builder.drawMainHeader(`${r.sector}  |  ${r.location}`);

  builder.drawKpiRow([
    {
      label: 'TOTAL PROJECT COST',
      value: r.totalCostNum > 0 ? fmtCr(r.totalCostNum) : 'Pending',
      sub: r.costRows.length > 1 ? `${r.costRows.length} cost heads` : 'Consolidated outlay',
    },
    {
      label: 'PROPOSED TERM DEBT',
      value: r.termLoanNum > 0 ? fmtCr(r.termLoanNum) : 'Pending',
      sub: r.debtPct !== null ? `${r.debtPct}% of funding` : undefined,
    },
    {
      label: 'PROMOTER EQUITY',
      value: r.promoterEquityNum > 0 ? fmtCr(r.promoterEquityNum) : 'Pending',
      sub: r.eqPct !== null ? `${r.eqPct}% margin` : undefined,
    },
    {
      label: 'DSCR / BANKABILITY',
      value: `${r.dscrLabel}`,
      sub: r.bankabilityScoreNum !== null ? `Rating: ${r.bankabilityLabel}` : `Feasibility: ${r.feasibilityLabel}`,
    },
  ]);

  // Section 1: Project & Banking Overview
  builder.drawSectionHeading('1. PROJECT & MANDATE OVERVIEW');
  builder.drawKeyValueList(r.overviewRows);
  if (r.projectBrief) {
    builder.drawParagraphBox('Project Brief & Scope', r.projectBrief);
  }

  // Section 2: Promoters & Management
  if (r.promoters.length > 0) {
    builder.drawSectionHeading('2. PROMOTER & MANAGEMENT PROFILE');
    builder.drawTable({
      headers: [
        { label: 'Promoter / Director', width: 46 },
        { label: 'Role', width: 42 },
        { label: 'Experience', width: 28 },
        { label: 'Qualification', width: 42 },
        { label: 'Holding', width: 20, align: 'right' },
      ],
      rows: r.promoters.map((p) => ({
        cells: [p.name, p.role, p.experience, p.qualification, p.shareholding],
      })),
    });
  }

  // Section 3: Cost of Project & Means of Finance
  builder.drawSectionHeading('3. COST OF PROJECT & MEANS OF FINANCE');

  if (r.costRows.length > 0) {
    builder.drawTable({
      headers: [
        { label: 'Cost Component', width: 112 },
        { label: 'Share (%)', width: 26, align: 'right' },
        { label: 'Amount (INR Cr)', width: 40, align: 'right' },
      ],
      rows: [
        ...r.costRows.map((row) => {
          const share =
            r.totalCostNum > 0 ? `${((row.amountCr / r.totalCostNum) * 100).toFixed(1)}%` : '-';
          return {
            cells: [row.label, share, fmtCr(row.amountCr)],
          };
        }),
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
        { label: 'Means of Finance / Capital Structure', width: 122 },
        { label: 'Proposed Structure', width: 56, align: 'right' },
      ],
      rows: [
        ...r.financeRows.map((row) => ({ cells: [row.label, row.value] })),
        ...(r.totalFundingNum > 0
          ? [
              {
                cells: [
                  r.isFundingBalanced ? 'Total Means of Finance (Reconciled)' : 'Total Means of Finance',
                  fmtCr(r.totalFundingNum),
                ],
                isTotal: true,
              },
            ]
          : []),
      ],
    });
  }

  // Section 4: Credit Risk Profile & Institutional Underwriting Summary
  builder.drawSectionHeading('4. CREDIT RISK PROFILE & UNDERWRITING SUMMARY');

  const summaryRows: Array<[string, string]> = [
    ['Feasibility Score', r.feasibilityLabel],
    ['Bankability Rating', r.bankabilityLabel],
    ['Modeled DSCR', r.dscrLabel],
  ];
  if (r.riskLevel) {
    summaryRows.push(['Credit Risk Classification', r.riskLevel]);
  }
  r.riskHighlights.forEach((row) => summaryRows.push(row));
  builder.drawKeyValueList(summaryRows, 62);

  builder.drawBulletGroup('Key Credit Strengths', r.strengths);
  builder.drawBulletGroup('Recommended Pre-Sanction Actions', r.recommendations);

  const filename = `Inisio_Teaser_${makeFileSlug(r.projectName)}_${new Date().toISOString().slice(0, 10)}.pdf`;
  return builder.output(action, filename);
}

// ============================================================================
// 2. DPR Executive Summary PDF (Comprehensive Institutional DPR Brief)
// ============================================================================

export function generateDprExecutiveSummaryPDF(
  data: TeaserPDFData,
  action: 'download' | 'preview' = 'download'
): PdfGenerationResult | void {
  const r = resolveDocumentData(data);

  const builder = new InstitutionalPdfBuilder({
    docTitle: 'DPR EXECUTIVE SUMMARY',
    projectName: r.projectName,
    refCode: r.refCode,
    dateStr: r.dateStr,
    footerLabel: 'Inisio Greenfield Advisory  |  Detailed Project Report (DPR) Executive Summary',
  });

  builder.drawMainHeader(
    `${r.sector}  |  ${r.location}  |  Status: ${r.status}`
  );

  builder.drawKpiRow([
    {
      label: 'PROJECT OUTLAY',
      value: r.totalCostNum > 0 ? fmtCr(r.totalCostNum) : 'Pending',
      sub: r.isFundingBalanced ? 'Reconciled capex' : 'Review funding gap',
    },
    {
      label: 'TERM LOAN REQUEST',
      value: r.termLoanNum > 0 ? fmtCr(r.termLoanNum) : 'Pending',
      sub: r.debtPct !== null ? `${r.debtPct}% Debt Share` : undefined,
    },
    {
      label: 'PROMOTER MARGIN',
      value: r.promoterEquityNum > 0 ? fmtCr(r.promoterEquityNum) : 'Pending',
      sub: r.eqPct !== null ? `${r.eqPct}% Equity Share` : undefined,
    },
    {
      label: 'APPRAISAL METRICS',
      value: `${r.dscrLabel} DSCR`,
      sub: `Feasibility: ${r.feasibilityLabel}`,
    },
  ]);

  // Section 1: Project Identification, Site & Banking Mandate
  builder.drawSectionHeading('1. PROJECT IDENTIFICATION & BANKING MANDATE');
  builder.drawKeyValueList(r.overviewRows);
  if (r.projectBrief) {
    builder.drawParagraphBox('Technical & Commercial Project Brief', r.projectBrief);
  }

  // Section 2: Promoter & Management Profile
  builder.drawSectionHeading('2. PROMOTER & MANAGEMENT PROFILE');
  builder.drawTable({
    headers: [
      { label: 'Promoter / Director', width: 46 },
      { label: 'Role / Designation', width: 42 },
      { label: 'Experience', width: 28 },
      { label: 'Qualification', width: 42 },
      { label: 'Holding', width: 20, align: 'right' },
    ],
    rows: r.promoters.map((p) => ({
      cells: [p.name, p.role, p.experience, p.qualification, p.shareholding],
    })),
  });

  // Section 3: Reconciled Cost of Project & Means of Finance
  builder.drawSectionHeading('3. PROJECT COST SCHEDULE & MEANS OF FINANCE');

  if (r.costRows.length > 0) {
    builder.drawTable({
      headers: [
        { label: 'Project Cost Head', width: 112 },
        { label: '% of Outlay', width: 26, align: 'right' },
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
          cells: ['Total Project Outlay', r.totalCostNum > 0 ? '100.0%' : '-', fmtCr(r.totalCostNum)],
          isTotal: true,
        },
      ],
      caption: r.costBreakdownNote || undefined,
    });
  }

  if (r.financeRows.length > 0) {
    builder.drawTable({
      headers: [
        { label: 'Funding Source / Financial Metric', width: 122 },
        { label: 'Amount / Ratio', width: 56, align: 'right' },
      ],
      rows: [
        ...r.financeRows.map((row) => ({ cells: [row.label, row.value] })),
        ...(r.totalFundingNum > 0
          ? [
              {
                cells: ['Total Means of Finance', fmtCr(r.totalFundingNum)],
                isTotal: true,
              },
            ]
          : []),
      ],
    });
  }

  // Section 4: Credit Risk & Bankability Assessment
  builder.drawSectionHeading('4. CREDIT RISK PROFILE & BANKABILITY ASSESSMENT');
  const creditRows: Array<[string, string]> = [
    ['Feasibility Score', r.feasibilityLabel],
    ['Institutional Bankability Rating', r.bankabilityLabel],
    ['Modeled Average DSCR', r.dscrLabel],
  ];
  if (r.riskLevel) {
    creditRows.push(['Risk Classification', r.riskLevel]);
  }
  r.riskHighlights.forEach((row) => creditRows.push(row));
  builder.drawKeyValueList(creditRows, 62);

  builder.drawBulletGroup('Identified Viability Strengths', r.strengths);
  builder.drawBulletGroup('DPR & Pre-Disbursement Action Items', r.recommendations);

  // Section 5: DPR Readiness, Document Checklist & Execution Status
  builder.drawSectionHeading('5. DPR READINESS, CHECKLIST & EXECUTION STATUS');
  const execRows: Array<[string, string]> = [
    ['Current Appraisal Status', r.status],
    ['Workflow Stage', r.stage],
    ['Assigned CA Appraiser', r.assignedCA],
    ['Assigned DPR Consultant', r.dprAssignedTo],
    ['Mandate Funding Status', r.isFunded ? 'Funded / Sanctioned' : 'Under Appraisal / Syndication'],
  ];
  builder.drawKeyValueList(execRows, 62);

  builder.drawTable({
    headers: [
      { label: 'DPR & Appraisal Deliverable', width: 76 },
      { label: 'Current Record Status', width: 102 },
    ],
    rows: r.documentRows.map(([docLabel, docStatus]) => ({
      cells: [docLabel, docStatus],
    })),
  });

  if (r.caReviewNotes) {
    builder.drawParagraphBox('Chartered Accountant / Reviewer Notes', r.caReviewNotes);
  }

  const filename = `Inisio_DPR_Summary_${makeFileSlug(r.projectName)}_${new Date().toISOString().slice(0, 10)}.pdf`;
  return builder.output(action, filename);
}
