import { jsPDF } from 'jspdf';

export interface TeaserPDFData {
  projectName?: string;
  industry?: string;
  fullName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  location?: string;
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

export function generateProjectTeaserPDF(data: TeaserPDFData, action: 'download' | 'preview' = 'download'): void {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(30, 58, 138); // Blue
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INSIO - GREENFIELD PROJECT TEASER', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Institutional Bankability & Debt Syndication Appraisal', 14, 28);

  // Content
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Project Overview', 14, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sector / Industry: ${data.industry || 'Industrial Greenfield'}`, 14, 56);
  doc.text(`Promoter Name: ${data.fullName || 'Lead Promoter'}`, 14, 63);
  doc.text(`Location: ${data.location || 'India'}`, 14, 70);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Financial Structuring & Means of Finance', 14, 85);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Estimated Capex: INR ${data.projectCost || '15.00'} Crores`, 14, 93);
  doc.text(`Proposed Term Debt (Bank Loan): INR ${data.proposedLoan || '10.50'} Crores`, 14, 100);
  doc.text(`Promoter Equity Contribution: INR ${data.promoterEquity || '4.50'} Crores`, 14, 107);
  doc.text(`Modeled Average DSCR: ${data.dscr || '1.48'}x`, 14, 114);
  doc.text(`Institutional Feasibility Score: ${data.feasibilityScore || '88'} / 100`, 14, 121);
  doc.text(`Bankability Grade: ${data.bankabilityRating || 'AAA (High Bankability)'}`, 14, 128);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Banking Underwriting Summary', 14, 143);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('• Debt-to-Equity structure aligns with commercial bank priority sector parameters.', 14, 151);
  doc.text('• DSCR exceeds the RBI minimum guideline of 1.33x for greenfield term lending.', 14, 158);
  doc.text('• Project qualifies for state capital investment subsidies and interest subvention.', 14, 165);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 270, 196, 270);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Prepared by Inisio Advisory Desk • Confidential Commercial Teaser', 14, 276);

  if (action === 'download') {
    doc.save(`Inisio_Project_Teaser_${Date.now()}.pdf`);
  } else {
    window.open(doc.output('bloburl'), '_blank');
  }
}

export function sendLeadToWhatsApp(data: TeaserPDFData): void {
  const text = encodeURIComponent(
    `*Greenfield Project Lead*\n` +
    `Sector: ${data.industry || 'Industrial'}\n` +
    `Promoter: ${data.fullName || 'Promoter'}\n` +
    `Cost: ₹${data.projectCost} Cr | Loan: ₹${data.proposedLoan} Cr\n` +
    `DSCR: ${data.dscr} | Feasibility: ${data.feasibilityScore}/100`
  );
  window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
}
