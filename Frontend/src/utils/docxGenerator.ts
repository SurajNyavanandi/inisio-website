import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import saveAs from 'file-saver';
import { TeaserPDFData } from './pdfGenerator';

const fmtVal = (val: unknown, fallback = '0.00'): string => {
  if (val === undefined || val === null || val === '') return fallback;
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n.toFixed(2) : fallback;
};

export async function generateProjectTeaserDOCX(data: TeaserPDFData): Promise<void> {
  const projectName = data.projectName || 'Greenfield Project';
  const totalCost = fmtVal(data.totalCostCr ?? data.projectCost, '0.00');
  const termLoan = fmtVal(data.loanRequiredCr ?? data.termLoanCr ?? data.proposedLoan, '0.00');
  const promoterEquity = fmtVal(
    data.promoterContribCr ?? data.promoterContributionCr ?? data.promoterEquity,
    '0.00'
  );
  const dscr = fmtVal(data.dscrEstimate ?? data.dscr, '1.35');
  const feasibility = data.feasibilityScore ?? '82';

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `INISIO - ${projectName.toUpperCase()}`,
            heading: HeadingLevel.TITLE
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Institutional Bankability Appraisal & Debt Syndication Teaser',
                bold: true,
                color: '2563EB'
              })
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '1. Project Profile',
            heading: HeadingLevel.HEADING_1
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Promoter / Signatory: ', bold: true }),
              new TextRun(data.fullName || data.companyName || 'Lead Promoter')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Target Sector: ', bold: true }),
              new TextRun(data.industry || 'Industrial Greenfield')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Proposed Location: ', bold: true }),
              new TextRun(data.location || 'India')
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '2. Means of Finance & Key Financials',
            heading: HeadingLevel.HEADING_1
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Estimated Project Cost: ', bold: true }),
              new TextRun(`INR ${totalCost} Crores`)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Proposed Term Debt: ', bold: true }),
              new TextRun(`INR ${termLoan} Crores`)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Promoter Contribution: ', bold: true }),
              new TextRun(`INR ${promoterEquity} Crores`)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Modeled DSCR: ', bold: true }),
              new TextRun(`${dscr}x`)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Institutional Feasibility Score: ', bold: true }),
              new TextRun(`${feasibility} / 100`)
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const slug = projectName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'Project';
  saveAs(blob, `Inisio_Teaser_${slug}_${Date.now()}.docx`);
}
