import { jsPDF } from 'jspdf';

export interface TeaserDirector {
  name: string;
  title?: string;
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

  // Primary fields passed by ProjectAssessmentPage.getPDFData()
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
  eqPct?: number | string;
  debtPct?: number | string;
  dscrEstimate?: number | string;
  estInterestRate?: string;
  estimatedLoan?: number | string;
  riskScoreOutOf10?: number | string;
  landStatus?: string;
  collateralStatus?: string;
  promoterExp?: string;
  description?: string;
  bankName?: string;
  branchLocation?: string;
  bankIfscCode?: string;
  bankAppRefNumber?: string;
  directors?: TeaserDirector[];

  // Legacy aliases supported for compatibility
  projectCost?: number | string;
  proposedLoan?: number | string;
  promoterEquity?: number | string;
  dscr?: number | string;
  bankabilityScore?: number | string;
  feasibilityScore?: number | string;
  bankabilityRating?: string;
  financials?: any;
  riskProfile?: any;
  keyHighlights?: string[];
  [key: string]: any;
}

const fmtNum = (val: unknown, fallback = '0.00', decimals = 2): string => {
  if (val === undefined || val === null || val === '') return fallback;
  const parsed = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed.toFixed(decimals) : fallback;
};

const safeText = (val: unknown, fallback = 'Not specified'): string => {
  if (val === undefined || val === null) return fallback;
  const cleaned = String(val)
    .replace(/₹/g, 'INR ')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
};

export function generateProjectTeaserPDF(
  data: TeaserPDFData,
  action: 'download' | 'preview' = 'download'
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 16;
  const contentW = pageW - margin * 2;

  // Resolved real values from ProjectAssessmentPage.getPDFData() with safe fallbacks
  const projectName = safeText(data.projectName, 'Greenfield Industrial Project');
  const sector = safeText(data.industry, 'Industrial Manufacturing');
  const promoter = safeText(data.fullName || data.companyName, 'Lead Promoter');
  const location = safeText(data.location, 'India');
  const contactEmail = safeText(data.email, '');
  const contactPhone = safeText(data.mobile || data.phone, '');

  const totalCost = fmtNum(data.totalCostCr ?? data.projectCost, '0.00');
  const termLoan = fmtNum(data.loanRequiredCr ?? data.termLoanCr ?? data.proposedLoan, '0.00');
  const promoterEquity = fmtNum(
    data.promoterContribCr ?? data.promoterContributionCr ?? data.promoterEquity,
    '0.00'
  );
  const otherFinance = fmtNum(data.otherFinanceCr, '0.00');

  const machineryCost = fmtNum(data.machineryCostCr, '0.00');
  const civilCost = fmtNum(data.civilCostCr, '0.00');
  const consultancyCost = fmtNum(data.consultancyCostCr, '0.00');
  const otherCosts = fmtNum(data.otherCostsCr, '0.00');

  const dscrVal = fmtNum(data.dscrEstimate ?? data.dscr, '1.35');
  const feasibilityVal =
    data.feasibilityScore !== undefined && data.feasibilityScore !== null && data.feasibilityScore !== ''
      ? String(data.feasibilityScore)
      : '82';
  const bankabilityGrade = safeText(
    data.riskScoreOutOf10 ? `${data.riskScoreOutOf10}/10` : data.bankabilityRating,
    'Investment Grade'
  );
  const eqPct = data.eqPct !== undefined ? String(data.eqPct) : '30';
  const debtPct = data.debtPct !== undefined ? String(data.debtPct) : '70';
  const estRate = safeText(data.estInterestRate, '8.85% - 9.40% p.a.');

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const refCode = safeText(
    data.bankAppRefNumber,
    `INS-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
  );

  // Top minimalist brand rule
  doc.setFillColor(37, 99, 235); // Inisio Blue #2563EB
  doc.rect(0, 0, pageW, 3, 'F');

  // Header block
  let y = 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(15, 23, 42);
  doc.text('INISIO', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(37, 99, 235);
  doc.text('GREENFIELD ADVISORY & DEBT SYNDICATION', margin, y + 4.8);

  // Right-aligned report metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE PROJECT TEASER', pageW - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Ref: ${refCode}  |  Date: ${dateStr}`, pageW - margin, y + 4.8, { align: 'right' });

  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(margin, y, pageW - margin, y);

  // Project Title & Summary Line
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(projectName, contentW);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 5.8 + 1;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`${sector}  •  ${location}`, margin, y);

  // 4 Minimalist KPI Cards
  y += 7;
  const gap = 3.5;
  const cardW = (contentW - gap * 3) / 4;
  const cardH = 18;
  const kpis = [
    { label: 'TOTAL PROJECT COST', value: `INR ${totalCost} Cr` },
    { label: 'PROPOSED TERM DEBT', value: `INR ${termLoan} Cr` },
    { label: 'PROMOTER EQUITY', value: `INR ${promoterEquity} Cr` },
    { label: 'AVG DSCR / SCORE', value: `${dscrVal}x (${feasibilityVal}/100)` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardW + gap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 3, y + 13.2);
  });

  // Section 1: Promoter & Project Profile
  y += cardH + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text('1. PROMOTER & PROJECT OVERVIEW', margin, y);

  y += 2.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);

  y += 6;
  const profileRows: Array<[string, string]> = [
    ['Lead Promoter / Signatory', promoter],
    ['Industry / Sector', sector],
    ['Project Location', location],
    ['Contact Details', [contactPhone, contactEmail].filter(Boolean).join('  |  ') || 'On record with Inisio'],
  ];
  if (data.landStatus) profileRows.push(['Land & Site Status', safeText(data.landStatus)]);
  if (data.collateralStatus) profileRows.push(['Collateral Coverage', safeText(data.collateralStatus)]);
  if (data.promoterExp) profileRows.push(['Promoter Experience', safeText(data.promoterExp)]);
  if (data.bankName) {
    const bankMeta = [data.bankName, data.branchLocation, data.bankIfscCode]
      .filter(Boolean)
      .map((item) => safeText(item))
      .join(' • ');
    profileRows.push(['Preferred Lending Bank', bankMeta]);
  }

  profileRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const wrapped = doc.splitTextToSize(value, contentW - 56);
    doc.text(wrapped, margin + 56, y);
    y += Math.max(5.5, wrapped.length * 4.5 + 1.2);
  });

  if (data.description) {
    y += 1.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Project Brief', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const briefLines = doc.splitTextToSize(safeText(data.description), contentW - 56).slice(0, 3);
    doc.text(briefLines, margin + 56, y);
    y += briefLines.length * 4.5 + 2;
  }

  // Section 2: Cost Statement & Means of Finance (Two clean side-by-side tables)
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text('2. PROJECT COST & MEANS OF FINANCE', margin, y);

  y += 2.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);

  y += 5;
  const colGap = 6;
  const halfW = (contentW - colGap) / 2;

  const drawMiniTable = (
    startX: number,
    startY: number,
    title: string,
    rows: Array<[string, string, boolean?]>
  ): number => {
    let ty = startY;
    doc.setFillColor(241, 245, 249);
    doc.rect(startX, ty, halfW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(title, startX + 3, ty + 4.8);
    ty += 7;

    rows.forEach(([k, v, isTotal]) => {
      if (isTotal) {
        doc.setFillColor(239, 246, 255);
        doc.rect(startX, ty, halfW, 7, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(startX, ty + 7, startX + halfW, ty + 7);

      doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(isTotal ? 15 : 51, isTotal ? 23 : 65, isTotal ? 42 : 85);
      doc.text(k, startX + 3, ty + 4.8);
      doc.text(v, startX + halfW - 3, ty + 4.8, { align: 'right' });
      ty += 7;
    });
    return ty;
  };

  const costEndY = drawMiniTable(margin, y, 'Estimated Cost Breakdown', [
    ['Plant & Machinery', `INR ${machineryCost} Cr`],
    ['Civil Works & Building', `INR ${civilCost} Cr`],
    ['Consultancy & Pre-Op', `INR ${consultancyCost} Cr`],
    ['Other / Working Capital', `INR ${otherCosts} Cr`],
    ['Total Project Outlay', `INR ${totalCost} Cr`, true],
  ]);

  const financeEndY = drawMiniTable(margin + halfW + colGap, y, 'Means of Finance', [
    [`Term Loan (${debtPct}%)`, `INR ${termLoan} Cr`],
    [`Promoter Equity (${eqPct}%)`, `INR ${promoterEquity} Cr`],
    ['Subsidy / Other Finance', `INR ${otherFinance} Cr`],
    ['Indicative Debt Pricing', estRate],
    ['Total Funding Mix', `INR ${totalCost} Cr`, true],
  ]);

  y = Math.max(costEndY, financeEndY) + 10;

  // Section 3: Banking Underwriting Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text('3. INSTITUTIONAL UNDERWRITING SUMMARY', margin, y);

  y += 2.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);

  y += 6;
  const dscrNum = parseFloat(dscrVal) || 1.35;
  const dscrNote =
    dscrNum >= 1.33
      ? `Modeled DSCR of ${dscrVal}x exceeds commercial bank greenfield threshold norms (1.33x).`
      : `Modeled DSCR of ${dscrVal}x may benefit from tenor optimization or margin enhancement.`;

  const underwritingBullets = [
    dscrNote,
    `Capital structure reflects a ${debtPct}:${eqPct} Debt-to-Equity ratio across INR ${totalCost} Cr total outlay.`,
    `Preliminary Bankability Rating: ${bankabilityGrade} | Feasibility Score: ${feasibilityVal}/100.`,
  ];

  if (Array.isArray(data.directors) && data.directors.length > 0) {
    const dirSummary = data.directors
      .slice(0, 3)
      .map((d) => safeText(d.name))
      .filter(Boolean)
      .join(', ');
    if (dirSummary) {
      underwritingBullets.push(`Key Promoters / Directors: ${dirSummary}.`);
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  underwritingBullets.forEach((bullet) => {
    const lines = doc.splitTextToSize(`•  ${bullet}`, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 4.6 + 1.4;
  });

  // Clean Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 276, pageW - margin, 276);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(148, 163, 184);
  doc.text('Prepared via Inisio Greenfield Advisory Platform  •  Confidential Commercial Teaser', margin, 282);
  doc.text('Page 1 of 1', pageW - margin, 282, { align: 'right' });

  const fileSlug = projectName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'Project';
  if (action === 'download') {
    doc.save(`Inisio_Teaser_${fileSlug}_${Date.now()}.pdf`);
  } else {
    window.open(doc.output('bloburl'), '_blank');
  }
}

export function sendLeadToWhatsApp(data: TeaserPDFData): void {
  const totalCost = fmtNum(data.totalCostCr ?? data.projectCost, '0.00');
  const termLoan = fmtNum(data.loanRequiredCr ?? data.termLoanCr ?? data.proposedLoan, '0.00');
  const dscr = fmtNum(data.dscrEstimate ?? data.dscr, '1.35');
  const text = encodeURIComponent(
    `*Greenfield Project Lead*\n` +
      `Project: ${data.projectName || 'Greenfield Project'}\n` +
      `Sector: ${data.industry || 'Industrial'}\n` +
      `Promoter: ${data.fullName || 'Promoter'}\n` +
      `Cost: INR ${totalCost} Cr | Loan: INR ${termLoan} Cr\n` +
      `DSCR: ${dscr}x | Feasibility: ${data.feasibilityScore || '82'}/100`
  );
  window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
}
