import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ITableCellBorders,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import {
  fmtCr,
  makeSafeFileSlug,
  resolveDocumentData,
  TeaserPDFData,
  triggerBlobDownload,
} from './pdfGenerator';

const COLOR_DARK = '0F172A';
const COLOR_BODY = '334155';
const COLOR_MUTED = '64748B';
const COLOR_BLUE = '2563EB';
const COLOR_BORDER = 'E2E8F0';
const COLOR_HEADER_BG = 'F1F5F9';
const COLOR_TINT_BG = 'F8FAFC';
const COLOR_TOTAL_BG = 'EFF6FF';

// A4 page width = 11906 DXA (210mm), margins = 1000 DXA left + 1000 DXA right -> printable width = 9906 DXA
const PAGE_WIDTH_DXA = 11906;
const PAGE_HEIGHT_DXA = 16838;
const MARGIN_DXA = 1000;
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - MARGIN_DXA * 2; // 9906 DXA

const cellBorders: ITableCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
};

const subtleBottomBorders: ITableCellBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const cellMargins = { top: 90, bottom: 90, left: 130, right: 130 };

const sectionHeading = (title: string): Paragraph =>
  new Paragraph({
    spacing: { before: 260, after: 110 },
    keepNext: true,
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 20,
        color: COLOR_BLUE,
        font: 'Calibri',
      }),
    ],
  });

const makeCell = (opts: {
  text: string;
  widthDxa: number;
  bold?: boolean;
  color?: string;
  size?: number;
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  shading?: string;
  borders?: ITableCellBorders;
}): TableCell =>
  new TableCell({
    width: { size: opts.widthDxa, type: WidthType.DXA },
    shading: opts.shading
      ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.shading }
      : undefined,
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

const buildKeyValueTable = (rows: Array<[string, string]>, labelW = 3400): Table => {
  const valW = CONTENT_WIDTH_DXA - labelW;
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [labelW, valW],
    layout: TableLayoutType.FIXED,
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          cantSplit: true,
          children: [
            makeCell({
              text: label,
              widthDxa: labelW,
              bold: true,
              color: COLOR_MUTED,
              borders: subtleBottomBorders,
            }),
            makeCell({
              text: value,
              widthDxa: valW,
              color: COLOR_DARK,
              borders: subtleBottomBorders,
            }),
          ],
        })
    ),
  });
};

export async function buildProjectTeaserDocxBlob(
  data: TeaserPDFData
): Promise<{ blob: Blob; filename: string }> {
  const r = resolveDocumentData(data);
  const children: Array<Paragraph | Table> = [];

  // Top Header & Document Meta
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'INISIO  ', bold: true, size: 32, color: COLOR_DARK, font: 'Calibri' }),
        new TextRun({
          text: 'PROJECT ADVISORY & BANK FUNDING',
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
          text: `CONFIDENTIAL - PROJECT TEASER   |   Ref: ${r.refCode}   |   Date: ${r.dateStr}`,
          size: 17,
          color: COLOR_MUTED,
          font: 'Calibri',
        }),
      ],
    })
  );

  // Project Title & Location
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 50 },
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
      spacing: { after: 180 },
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

  // 1. Project Snapshot (At a Glance)
  children.push(sectionHeading('1. PROJECT SNAPSHOT (AT A GLANCE)'));

  const kpiItems = [
    {
      label: 'TOTAL PROJECT COST',
      value: r.totalCostNum > 0 ? fmtCr(r.totalCostNum) : 'To be finalized',
      sub: r.costRows.length > 1 ? `${r.costRows.length} cost items` : 'Consolidated total',
    },
    {
      label: 'TERM LOAN REQUESTED',
      value: r.termLoanNum > 0 ? fmtCr(r.termLoanNum) : 'To be finalized',
      sub: r.debtPct !== null ? `${r.debtPct}% of funding` : '',
    },
    {
      label: 'PROMOTER CONTRIBUTION',
      value: r.promoterEquityNum > 0 ? fmtCr(r.promoterEquityNum) : 'To be finalized',
      sub: r.eqPct !== null ? `${r.eqPct}% own equity` : '',
    },
    {
      label: 'REPAYMENT & SCORE',
      value: `${r.dscrLabel} DSCR`,
      sub: r.bankabilityScoreNum !== null ? r.bankabilityLabel : r.feasibilityLabel,
    },
  ];

  const kpiW = Math.floor(CONTENT_WIDTH_DXA / 4);
  const kpiLastW = CONTENT_WIDTH_DXA - kpiW * 3;
  const kpiWidths = [kpiW, kpiW, kpiW, kpiLastW];

  children.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: kpiWidths,
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          cantSplit: true,
          children: kpiItems.map((k, i) =>
            new TableCell({
              width: { size: kpiWidths[i], type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: COLOR_TINT_BG },
              borders: cellBorders,
              margins: { top: 100, bottom: 100, left: 110, right: 110 },
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
                  spacing: { before: 0, after: k.sub ? 30 : 0 },
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
                ...(k.sub
                  ? [
                      new Paragraph({
                        spacing: { before: 0, after: 0 },
                        children: [
                          new TextRun({
                            text: k.sub,
                            size: 15,
                            color: COLOR_MUTED,
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ]
                  : []),
              ],
            })
          ),
        }),
      ],
    })
  );

  children.push(new Paragraph({ spacing: { before: 100, after: 0 }, children: [] }));
  children.push(
    buildKeyValueTable([
      ['Debt-to-Equity Ratio', r.debtEquityRatioLabel],
      ['Feasibility Score', r.feasibilityLabel],
      ['Bankability Rating', r.riskLevel ? `${r.bankabilityLabel} (${r.riskLevel})` : r.bankabilityLabel],
    ])
  );

  // 2. Business Overview & Readiness
  children.push(sectionHeading('2. BUSINESS OVERVIEW & READINESS'));
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: COLOR_TINT_BG },
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
        left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
        right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      },
      children: [
        new TextRun({
          text: r.businessOverviewSummary,
          size: 19,
          color: COLOR_BODY,
          font: 'Calibri',
        }),
      ],
    })
  );

  if (r.readinessRows.length > 0) {
    children.push(buildKeyValueTable(r.readinessRows));
  }

  // 3. Promoter & Company Details
  children.push(sectionHeading('3. PROMOTER & COMPANY DETAILS'));
  const entityRows: Array<[string, string]> = [['Lead Promoter', r.promoter]];
  if (r.companyName && r.companyName.toLowerCase() !== r.promoter.toLowerCase()) {
    entityRows.push(['Company / Borrowing Entity', r.companyName]);
  }
  const contactLine = [r.contactPhone, r.contactEmail].filter(Boolean).join('  |  ');
  if (contactLine) {
    entityRows.push(['Verified Contact Details', contactLine]);
  }
  children.push(buildKeyValueTable(entityRows));

  if (r.promoters.length > 0) {
    children.push(new Paragraph({ spacing: { before: 100, after: 0 }, children: [] }));
    const promCols = [2500, 2200, 1500, 2500, 1206];
    children.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        columnWidths: promCols,
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: [
              makeCell({ text: 'Promoter / Director', widthDxa: promCols[0], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG }),
              makeCell({ text: 'Role', widthDxa: promCols[1], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG }),
              makeCell({ text: 'Experience', widthDxa: promCols[2], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG }),
              makeCell({ text: 'Qualification', widthDxa: promCols[3], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG }),
              makeCell({ text: 'Share %', widthDxa: promCols[4], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, align: AlignmentType.RIGHT }),
            ],
          }),
          ...r.promoters.map(
            (p) =>
              new TableRow({
                cantSplit: true,
                children: [
                  makeCell({ text: p.name, widthDxa: promCols[0], bold: true, color: COLOR_DARK }),
                  makeCell({ text: p.role, widthDxa: promCols[1] }),
                  makeCell({ text: p.experience, widthDxa: promCols[2] }),
                  makeCell({ text: p.qualification, widthDxa: promCols[3] }),
                  makeCell({ text: p.shareholding, widthDxa: promCols[4], align: AlignmentType.RIGHT }),
                ],
              })
          ),
        ],
      })
    );
  }

  // 4. Cost of Project & Means of Finance
  children.push(sectionHeading('4. COST OF PROJECT & MEANS OF FINANCE'));
  const finCols = [5906, 1600, 2400];

  if (r.costRows.length > 0) {
    children.push(
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        columnWidths: finCols,
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: [
              makeCell({ text: 'Project Cost Item (CAPEX)', widthDxa: finCols[0], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG }),
              makeCell({ text: 'Share (%)', widthDxa: finCols[1], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, align: AlignmentType.RIGHT }),
              makeCell({ text: 'Amount (INR Cr)', widthDxa: finCols[2], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, align: AlignmentType.RIGHT }),
            ],
          }),
          ...r.costRows.map((row) => {
            const share = r.totalCostNum > 0 ? `${((row.amountCr / r.totalCostNum) * 100).toFixed(1)}%` : '-';
            return new TableRow({
              cantSplit: true,
              children: [
                makeCell({ text: row.label, widthDxa: finCols[0] }),
                makeCell({ text: share, widthDxa: finCols[1], align: AlignmentType.RIGHT }),
                makeCell({ text: fmtCr(row.amountCr), widthDxa: finCols[2], align: AlignmentType.RIGHT }),
              ],
            });
          }),
          new TableRow({
            cantSplit: true,
            children: [
              makeCell({ text: 'Total Project Cost', widthDxa: finCols[0], bold: true, color: COLOR_DARK, shading: COLOR_TOTAL_BG }),
              makeCell({ text: r.totalCostNum > 0 ? '100.0%' : '-', widthDxa: finCols[1], bold: true, color: COLOR_DARK, shading: COLOR_TOTAL_BG, align: AlignmentType.RIGHT }),
              makeCell({ text: fmtCr(r.totalCostNum), widthDxa: finCols[2], bold: true, color: COLOR_DARK, shading: COLOR_TOTAL_BG, align: AlignmentType.RIGHT }),
            ],
          }),
        ],
      })
    );

    if (r.costBreakdownNote) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 140 },
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
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        columnWidths: finCols,
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: [
              makeCell({ text: 'Source of Funds (Means of Finance)', widthDxa: finCols[0], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG }),
              makeCell({ text: 'Share (%)', widthDxa: finCols[1], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, align: AlignmentType.RIGHT }),
              makeCell({ text: 'Amount (INR Cr)', widthDxa: finCols[2], bold: true, color: COLOR_DARK, shading: COLOR_HEADER_BG, align: AlignmentType.RIGHT }),
            ],
          }),
          ...r.financeRows.map(
            (row) =>
              new TableRow({
                cantSplit: true,
                children: [
                  makeCell({ text: row.label, widthDxa: finCols[0] }),
                  makeCell({ text: row.sharePct, widthDxa: finCols[1], align: AlignmentType.RIGHT }),
                  makeCell({ text: row.value, widthDxa: finCols[2], align: AlignmentType.RIGHT }),
                ],
              })
          ),
          new TableRow({
            cantSplit: true,
            children: [
              makeCell({
                text: r.isFundingBalanced ? 'Total Means of Finance (Matched)' : 'Total Means of Finance',
                widthDxa: finCols[0],
                bold: true,
                color: COLOR_DARK,
                shading: COLOR_TOTAL_BG,
              }),
              makeCell({
                text: r.totalFundingNum > 0 ? '100.0%' : '-',
                widthDxa: finCols[1],
                bold: true,
                color: COLOR_DARK,
                shading: COLOR_TOTAL_BG,
                align: AlignmentType.RIGHT,
              }),
              makeCell({
                text: fmtCr(r.totalFundingNum),
                widthDxa: finCols[2],
                bold: true,
                color: COLOR_DARK,
                shading: COLOR_TOTAL_BG,
                align: AlignmentType.RIGHT,
              }),
            ],
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [
          new TextRun({
            text: `Debt-to-Equity Ratio: ${r.debtEquityRatioLabel}`,
            italics: true,
            size: 16,
            color: COLOR_MUTED,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  if (r.workingCapitalAssessedNum !== null && r.workingCapitalAssessedNum > 0) {
    children.push(
      buildKeyValueTable([
        ['Working Capital Assessed', fmtCr(r.workingCapitalAssessedNum)],
      ])
    );
  }

  // 5. Preferred Bank & Next Steps
  children.push(sectionHeading('5. PREFERRED BANK & NEXT STEPS'));
  if (r.bankRows.length > 0) {
    children.push(buildKeyValueTable(r.bankRows));
  }

  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: 'Summary of Funding Request',
          bold: true,
          size: 19,
          color: COLOR_DARK,
          font: 'Calibri',
        }),
      ],
    })
  );

  r.nextStepsLines.forEach((line) => {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        indent: { left: 260, hanging: 180 },
        children: [
          new TextRun({ text: '-  ', bold: true, size: 19, color: COLOR_BLUE, font: 'Calibri' }),
          new TextRun({ text: line, size: 19, color: COLOR_BODY, font: 'Calibri' }),
        ],
      })
    );
  });

  const doc = new Document({
    creator: 'Inisio Advisory',
    title: `${r.projectName} - Project Teaser`,
    description: 'Confidential Project Teaser prepared via Inisio Greenfield Advisory Platform',
    sections: [
      {
        properties: {
          page: {
            size: {
              width: PAGE_WIDTH_DXA,
              height: PAGE_HEIGHT_DXA,
            },
            margin: {
              top: 900,
              bottom: 900,
              left: MARGIN_DXA,
              right: MARGIN_DXA,
            },
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
                    text: 'Confidential - Project Teaser  |  Page ',
                    size: 15,
                    color: COLOR_MUTED,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 15,
                    color: COLOR_MUTED,
                    font: 'Calibri',
                  }),
                  new TextRun({ text: ' of ', size: 15, color: COLOR_MUTED, font: 'Calibri' }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 15,
                    color: COLOR_MUTED,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const rawBlob = await Packer.toBlob(doc);
  const docxBlob = new Blob([rawBlob], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const filename = `${makeSafeFileSlug(r.projectName)}_Teaser.docx`;
  return { blob: docxBlob, filename };
}

export async function generateProjectTeaserDOCX(data: TeaserPDFData): Promise<string> {
  const { blob, filename } = await buildProjectTeaserDocxBlob(data);
  triggerBlobDownload(blob, filename);
  return filename;
}
