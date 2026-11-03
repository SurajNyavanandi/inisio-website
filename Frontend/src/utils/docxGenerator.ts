import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import saveAs from 'file-saver';
import { TeaserPDFData } from './pdfGenerator';

export async function generateProjectTeaserDOCX(data: TeaserPDFData): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'INSIO - GREENFIELD PROJECT TEASER',
            heading: HeadingLevel.TITLE
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Institutional Bankability Appraisal & Debt Syndication Report',
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
              new TextRun({ text: `Promoter / Entity: `, bold: true }),
              new TextRun(data.fullName || 'Lead Promoter')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Target Sector: `, bold: true }),
              new TextRun(data.industry || 'Industrial Greenfield')
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Proposed Location: `, bold: true }),
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
              new TextRun({ text: `Estimated Project Cost: `, bold: true }),
              new TextRun(`₹ ${data.projectCost || '15.00'} Crores`)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Proposed Term Debt: `, bold: true }),
              new TextRun(`₹ ${data.proposedLoan || '10.50'} Crores`)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Promoter Contribution: `, bold: true }),
              new TextRun(`₹ ${data.promoterEquity || '4.50'} Crores`)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Modeled DSCR: `, bold: true }),
              new TextRun(`${data.dscr || '1.48'}x`)
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Institutional Feasibility Score: `, bold: true }),
              new TextRun(`${data.feasibilityScore || '88'} / 100`)
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Inisio_Project_Teaser_${Date.now()}.docx`);
}
