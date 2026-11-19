import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import saveAs from 'file-saver';
import { resolveDocumentData, TeaserPDFData } from './pdfGenerator';

const COLOR_DARK = '0F172A';
const COLOR_BODY = '334155';
const COLOR_MUTED = '64748B';
const COLOR_BLUE = '2563EB';
const COLOR_BORDER = 'E2E8F0';
const COLOR_HEADER_BG = 'F1F5F9';
const COLOR_TINT_BG = 'F8FAFC';
const COLOR_TOTAL_BG = 'EFF6FF';

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
};

const subtleBottomBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const cellMargins = { top: 90, bottom: 90, left: 120, right: 120 };

const sectionHeading = (title: string): Paragraph =>
  new Paragraph({
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 21,
        color: COLOR_BLUE,
        font: 'Calibri',
      }),
    ],
  });

const makeCell = (opts: {
  text: string;
  bold?: boolean;
  color?: string;
  size?: number;
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  shading?: string;
  widthPct?: number;
  borders?: any;
}): TableCell =>
  new TableCell({
    width: opts.widthPct ? { size: opts.widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    borders: opts.borders ?? cellBorders,
    margins: cellMargins,
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: opts.text || '-',
            bold: opts.bold,
            color: opts.color ?? COLOR_BODY,
            size: opts.size ?? 19,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });

const fmtCr = (val: number): string => `INR ${val.toFixed(2)} Cr`;

export async function generateProjectTeaserDOCX(data: TeaserPDFData): Promise<void> {
  const r = resolveDocumentData(data);

  const children: Array<Paragraph | Table> = [];

  // Top Header Title Block
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'INISIO  ', bold: true, size: 32, color: COLOR_DARK, font: 'Calibri' }),
        new TextRun({
          text: 'GREENFIELD ADVISORY & DEBT SYNDICATION',
          bold: true,
          size: 16,
          color: COLOR_BLUE,
          font: 'Calibri',
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 180 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 10, color: COLOR_BLUE },
      },
      children: [
        new TextRun({
          text: `EXECUTIVE PROJECT TEASER   |   Ref: ${r.refCode}   |   Date: ${r.dateStr}`,
          size: 17,
          color: COLOR_MUTED,
          font: 'Calibri',
        }),
      ],
    })
  );

  // Project Title & Subtitle
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: r.projectName,
          bold: true,
          size: 28,
          color: COLOR_DARK,
          font: 'Calibri',
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${r.sector}   |   ${r.location}`,
          size: 20,
          color: COLOR_MUTED,
          font: 'Calibri',
        }),
      ],
    })
  );

  // 4-Column Executive KPI Table
  const kpiItems = [
    {
      label: 'TOTAL PROJECT COST',
      value: r.totalCostNum > 0 ? fmtCr(r.totalCostNum) : 'Pending',
    },
    {
      label: 'PROPOSED TERM DEBT',
      value: r.termLoanNum > 0 ? fmtCr(r.termLoanNum) : 'Pending',
    },
    {
      label: 'PROMOTER EQUITY',
      value: r.promoterEquityNum > 0 ? fmtCr(r.promoterEquityNum) : 'Pending',
    },
    {
      label: 'DSCR / BANKABILITY',
      value: `${r.dscrLabel} (${r.bankabilityScoreNum !== null ? r.bankabilityLabel : r.feasibilityLabel})`,
    },
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: kpiItems.map((k) =>
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: COLOR_TINT_BG },
              borders: cellBorders,
              margins: { top: 110, bottom: 110, left: 120, right: 120 },
              children: [
                new Paragraph({
                  spacing: { after: 40 },
                  children: [
                    new TextRun({
                      text: k.label,
                      bold: true,
                      size: 14,
                      color: COLOR_MUTED,
                      font: 'Calibri',
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({
                      text: k.value,
                      bold: true,
                      size: 20,
                      color: COLOR_DARK,
                      font: 'Calibri',
                    }),
                  ],
                }),
              ],
            })
          ),
        }),
      ],
    })
  );

  // Section 1: Project & Mandate Overview
  children.push(sectionHeading('1. PROJECT & MANDATE OVERVIEW'));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: r.overviewRows.map(
        ([label, value]) =>
          new TableRow({
            children: [
              makeCell({
                text: label,
                bold: true,
                color: COLOR_MUTED,
                widthPct: 34,
                borders: subtleBottomBorders,
              }),
              makeCell({
                text: value,
                color: COLOR_DARK,
                widthPct: 66,
                borders: subtleBottomBorders,
              }),
            ],
          })
      ),
    })
  );

  if (r.projectBrief) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({
            text: 'Project Brief & Scope',
            bold: true,
            size: 18,
            color: COLOR_DARK,
            font: 'Calibri',
          }),
        ],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 140 },
        shading: { type: ShadingType.CLEAR, fill: COLOR_TINT_BG },
        children: [
          new TextRun({
            text: r.projectBrief,
            size: 19,
            color: COLOR_BODY,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  // Section 2: Promoters & Management Profile
  if (r.promoters.length > 0) {
    children.push(sectionHeading('2. PROMOTER & MANAGEMENT PROFILE'));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              makeCell({ text: 'Promoter / Director', bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, widthPct: 26 }),
              makeCell({ text: 'Role', bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, widthPct: 24 }),
              makeCell({ text: 'Experience', bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, widthPct: 16 }),
              makeCell({ text: 'Qualification', bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, widthPct: 22 }),
              makeCell({
                text: 'Holding',
                bold: true,
                color: COLOR_DARK,
                shading: COLOR_HEADER_BG,
                widthPct: 12,
                align: AlignmentType.RIGHT,
              }),
            ],
          }),
          ...r.promoters.map(
            (p) =>
              new TableRow({
                children: [
                  makeCell({ text: p.name, bold: true, color: COLOR_DARK, widthPct: 26 }),
                  makeCell({ text: p.role, widthPct: 24 }),
                  makeCell({ text: p.experience, widthPct: 16 }),
                  makeCell({ text: p.qualification, widthPct: 22 }),
                  makeCell({ text: p.shareholding, widthPct: 12, align: AlignmentType.RIGHT }),
                ],
              })
          ),
        ],
      })
    );
  }

  // Section 3: Cost of Project & Means of Finance
  children.push(sectionHeading('3. COST OF PROJECT & MEANS OF FINANCE'));

  if (r.costRows.length > 0) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              makeCell({ text: 'Cost Component', bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, widthPct: 60 }),
              makeCell({
                text: 'Share (%)',
                bold: true,
                color: COLOR_DARK,
                shading: COLOR_HEADER_BG,
                widthPct: 16,
                align: AlignmentType.RIGHT,
              }),
              makeCell({
                text: 'Amount (INR Cr)',
                bold: true,
                color: COLOR_DARK,
                shading: COLOR_HEADER_BG,
                widthPct: 24,
                align: AlignmentType.RIGHT,
              }),
            ],
          }),
          ...r.costRows.map((row) => {
            const share =
              r.totalCostNum > 0 ? `${((row.amountCr / r.totalCostNum) * 100).toFixed(1)}%` : '-';
            return new TableRow({
              children: [
                makeCell({ text: row.label, widthPct: 60 }),
                makeCell({ text: share, widthPct: 16, align: AlignmentType.RIGHT }),
                makeCell({ text: fmtCr(row.amountCr), widthPct: 24, align: AlignmentType.RIGHT }),
              ],
            });
          }),
          new TableRow({
            children: [
              makeCell({ text: 'Total Project Cost', bold: true, color: COLOR_DARK, shading: COLOR_TOTAL_BG, widthPct: 60 }),
              makeCell({
                text: r.totalCostNum > 0 ? '100.0%' : '-',
                bold: true,
                color: COLOR_DARK,
                shading: COLOR_TOTAL_BG,
                widthPct: 16,
                align: AlignmentType.RIGHT,
              }),
              makeCell({
                text: fmtCr(r.totalCostNum),
                bold: true,
                color: COLOR_DARK,
                shading: COLOR_TOTAL_BG,
                widthPct: 24,
                align: AlignmentType.RIGHT,
              }),
            ],
          }),
        ],
      })
    );

    if (r.costBreakdownNote) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 160 },
          children: [
            new TextRun({
              text: r.costBreakdownNote,
              italics: true,
              size: 16,
              color: COLOR_MUTED,
              font: 'Calibri',
            }),
          ],
        })
      );
    }
  }

  if (r.financeRows.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 80 },
        children: [
          new TextRun({
            text: 'Means of Finance & Capital Structure',
            bold: true,
            size: 19,
            color: COLOR_DARK,
            font: 'Calibri',
          }),
        ],
      })
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              makeCell({ text: 'Funding Source / Parameter', bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, widthPct: 65 }),
              makeCell({
                text: 'Amount / Structure',
                bold: true,
                color: COLOR_DARK,
                shading: COLOR_HEADER_BG,
                widthPct: 35,
                align: AlignmentType.RIGHT,
              }),
            ],
          }),
          ...r.financeRows.map(
            (row) =>
              new TableRow({
                children: [
                  makeCell({ text: row.label, widthPct: 65 }),
                  makeCell({ text: row.value, widthPct: 35, align: AlignmentType.RIGHT }),
                ],
              })
          ),
          ...(r.totalFundingNum > 0
            ? [
                new TableRow({
                  children: [
                    makeCell({
                      text: r.isFundingBalanced
                        ? 'Total Means of Finance (Reconciled)'
                        : 'Total Means of Finance',
                      bold: true,
                      color: COLOR_DARK,
                      shading: COLOR_TOTAL_BG,
                      widthPct: 65,
                    }),
                    makeCell({
                      text: fmtCr(r.totalFundingNum),
                      bold: true,
                      color: COLOR_DARK,
                      shading: COLOR_TOTAL_BG,
                      widthPct: 35,
                      align: AlignmentType.RIGHT,
                    }),
                  ],
                }),
              ]
            : []),
        ],
      })
    );
  }

  // Section 4: Credit Risk Profile & Underwriting Summary
  children.push(sectionHeading('4. CREDIT RISK PROFILE & UNDERWRITING SUMMARY'));

  const underwritingRows: Array<[string, string]> = [
    ['Feasibility Score', r.feasibilityLabel],
    ['Bankability Rating', r.bankabilityLabel],
    ['Modeled DSCR', r.dscrLabel],
  ];
  if (r.riskLevel) {
    underwritingRows.push(['Credit Risk Classification', r.riskLevel]);
  }
  r.riskHighlights.forEach((row) => underwritingRows.push(row));

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: underwritingRows.map(
        ([label, value]) =>
          new TableRow({
            children: [
              makeCell({
                text: label,
                bold: true,
                color: COLOR_MUTED,
                widthPct: 40,
                borders: subtleBottomBorders,
              }),
              makeCell({
                text: value,
                color: COLOR_DARK,
                widthPct: 60,
                borders: subtleBottomBorders,
              }),
            ],
          })
      ),
    })
  );

  if (r.strengths.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({ text: 'Key Credit Strengths', bold: true, size: 19, color: COLOR_DARK, font: 'Calibri' }),
        ],
      })
    );
    r.strengths.forEach((item) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 50 },
          children: [new TextRun({ text: item, size: 19, color: COLOR_BODY, font: 'Calibri' })],
        })
      );
    });
  }

  if (r.recommendations.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 60 },
        children: [
          new TextRun({
            text: 'Recommended Pre-Sanction Actions',
            bold: true,
            size: 19,
            color: COLOR_DARK,
            font: 'Calibri',
          }),
        ],
      })
    );
    r.recommendations.forEach((item) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 50 },
          children: [new TextRun({ text: item, size: 19, color: COLOR_BODY, font: 'Calibri' })],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 900, bottom: 900, left: 950, right: 950 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `INISIO ADVISORY  |  ${r.projectName}`,
                    size: 15,
                    color: COLOR_MUTED,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Confidential Commercial Project Teaser  |  Page ',
                    size: 15,
                    color: COLOR_MUTED,
                    font: 'Calibri',
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 15, color: COLOR_MUTED, font: 'Calibri' }),
                  new TextRun({ text: ' of ', size: 15, color: COLOR_MUTED, font: 'Calibri' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, color: COLOR_MUTED, font: 'Calibri' }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const slug =
    r.projectName
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48) || 'Project';
  saveAs(blob, `Inisio_Teaser_${slug}_${new Date().toISOString().slice(0, 10)}.docx`);
}
