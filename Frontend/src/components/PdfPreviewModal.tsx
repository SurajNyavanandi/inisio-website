import React, { useEffect, useState } from 'react';
import { Download, FileCode, FileText, Eye, X } from 'lucide-react';
import type { ResolvedDocumentData } from '../utils/pdfGenerator';

const fmtCr = (val: number): string => {
  const safe = Number.isFinite(val) ? val : 0;
  return `INR ${safe.toFixed(2)} Cr`;
};

export interface PdfPreviewState {
  blobUrl: string;
  filename: string;
  title: string;
  subtitle?: string;
  resolved?: ResolvedDocumentData;
  documentType?: 'teaser' | 'dpr';
  onDownloadDocx?: () => void;
}

interface PdfPreviewModalProps {
  preview: PdfPreviewState | null;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ preview, onClose }) => {
  const [viewMode, setViewMode] = useState<'document' | 'raw_pdf'>('document');

  useEffect(() => {
    if (!preview) return;
    setViewMode(preview.resolved ? 'document' : 'raw_pdf');
  }, [preview]);

  useEffect(() => {
    if (!preview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [preview, onClose]);

  useEffect(() => {
    const urlToRevoke = preview?.blobUrl;
    return () => {
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(urlToRevoke);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [preview?.blobUrl]);

  if (!preview) return null;

  const handleDownloadPdf = () => {
    const link = document.createElement('a');
    link.href = preview.blobUrl;
    link.download = preview.filename;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const r = preview.resolved;
  const docType = preview.documentType || 'teaser';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={preview.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-5xl h-[92vh] sm:h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate font-manrope">
                {preview.title}
              </h3>
              {preview.subtitle && (
                <p className="text-xs text-slate-500 truncate">{preview.subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto justify-end">
            {r && (
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('document')}
                  className={`min-h-[34px] px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 ${
                    viewMode === 'document'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('raw_pdf')}
                  className={`min-h-[34px] px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 ${
                    viewMode === 'raw_pdf'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">PDF</span>
                </button>
              </div>
            )}

            {preview.onDownloadDocx && (
              <button
                type="button"
                onClick={preview.onDownloadDocx}
                className="min-h-[38px] px-2.5 sm:px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-600" />
                <span>DOCX</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="min-h-[38px] px-3 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 bg-slate-100 overflow-y-auto relative">
          {viewMode === 'document' && r ? (
            <div className="p-2.5 sm:p-8 flex justify-center">
              <div className="w-full max-w-[794px] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                {/* Top Accent Line */}
                <div className="h-1.5 bg-blue-600 w-full" />

                <div className="p-4 sm:p-10 space-y-6 sm:space-y-7 text-slate-800">
                  {/* Document Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
                    <div>
                      <div className="text-xl font-extrabold tracking-tight text-slate-950 font-manrope">
                        INISIO
                      </div>
                      <div className="text-[10px] font-semibold tracking-wider text-blue-600 uppercase mt-0.5">
                        Project Advisory &amp; Bank Funding
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-bold tracking-wide text-slate-900 uppercase">
                        {docType === 'teaser'
                          ? 'Confidential - Project Teaser'
                          : 'Detailed Project Report (DPR)'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        Ref: {r.refCode} &nbsp;|&nbsp; Date: {r.dateStr}
                      </div>
                    </div>
                  </div>

                  {/* Project Title */}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-manrope">
                      {r.projectName}
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                      {r.sector} &nbsp;|&nbsp; {r.location}
                      {docType === 'dpr' ? `  |  Promoter: ${r.companyName || r.promoter}` : ''}
                    </p>
                  </div>

                  {/* Section 1: Snapshot / Executive Summary */}
                  <section className="space-y-4">
                    <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                      {docType === 'teaser' ? '1. Project Snapshot (At a Glance)' : '1. Executive Summary'}
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          Total Project Cost
                        </div>
                        <div className="text-sm font-bold text-slate-950 mt-1 tabular-nums">
                          {r.totalCostNum > 0 ? fmtCr(r.totalCostNum) : 'To be finalized'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {r.costRows.length > 1 ? `${r.costRows.length} cost items` : 'Consolidated total'}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          Term Loan Requested
                        </div>
                        <div className="text-sm font-bold text-slate-950 mt-1 tabular-nums">
                          {r.termLoanNum > 0 ? fmtCr(r.termLoanNum) : 'To be finalized'}
                        </div>
                        {r.debtPct !== null && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{r.debtPct}% of funding</div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          Promoter Contribution
                        </div>
                        <div className="text-sm font-bold text-slate-950 mt-1 tabular-nums">
                          {r.promoterEquityNum > 0 ? fmtCr(r.promoterEquityNum) : 'To be finalized'}
                        </div>
                        {r.eqPct !== null && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{r.eqPct}% own equity</div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          Repayment &amp; Score
                        </div>
                        <div className="text-sm font-bold text-slate-950 mt-1 tabular-nums">
                          {r.dscrLabel} DSCR
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {r.bankabilityScoreNum !== null
                            ? `Rating: ${r.bankabilityLabel}`
                            : `Feasibility: ${r.feasibilityLabel}`}
                        </div>
                      </div>
                    </div>

                    {docType === 'teaser' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs pt-1">
                        <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Debt-to-Equity Ratio</span>
                          <span className="font-medium text-slate-900 text-right">{r.debtEquityRatioLabel}</span>
                        </div>
                        <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100">
                          <span className="font-semibold text-slate-500">Feasibility Score</span>
                          <span className="font-medium text-slate-900 text-right">{r.feasibilityLabel}</span>
                        </div>
                        <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100 sm:col-span-2">
                          <span className="font-semibold text-slate-500">Bankability Rating</span>
                          <span className="font-medium text-slate-900 text-right">
                            {r.riskLevel ? `${r.bankabilityLabel} (${r.riskLevel})` : r.bankabilityLabel}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Executive Overview &amp; Viability Verdict
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700">{r.executiveVerdict}</p>
                      </div>
                    )}
                  </section>

                  {/* Teaser Sections 2-5 vs DPR Sections 2-8 */}
                  {docType === 'teaser' ? (
                    <>
                      {/* 2. Business Overview & Readiness */}
                      <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          2. Business Overview &amp; Readiness
                        </h2>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700">
                          {r.businessOverviewSummary}
                        </div>
                        {r.readinessRows.length > 0 && (
                          <div className="divide-y divide-slate-100 text-xs">
                            {r.readinessRows.map(([k, v]) => (
                              <div key={k} className="py-1.5 flex justify-between gap-4">
                                <span className="font-semibold text-slate-500">{k}</span>
                                <span className="text-slate-900 text-right">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      {/* 3. Promoter & Company Details */}
                      <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          3. Promoter &amp; Company Details
                        </h2>
                        <div className="divide-y divide-slate-100 text-xs">
                          <div className="py-1.5 flex justify-between gap-4">
                            <span className="font-semibold text-slate-500">Lead Promoter</span>
                            <span className="text-slate-900 font-medium">{r.promoter}</span>
                          </div>
                          {r.companyName && r.companyName.toLowerCase() !== r.promoter.toLowerCase() && (
                            <div className="py-1.5 flex justify-between gap-4">
                              <span className="font-semibold text-slate-500">Company / Borrowing Entity</span>
                              <span className="text-slate-900 font-medium">{r.companyName}</span>
                            </div>
                          )}
                          {(r.contactPhone || r.contactEmail) && (
                            <div className="py-1.5 flex justify-between gap-4">
                              <span className="font-semibold text-slate-500">Verified Contact Details</span>
                              <span className="text-slate-900">
                                {[r.contactPhone, r.contactEmail].filter(Boolean).join('  |  ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                              <tr>
                                <th className="px-3 py-2">Promoter / Director</th>
                                <th className="px-3 py-2">Role</th>
                                <th className="px-3 py-2">Experience</th>
                                <th className="px-3 py-2">Qualification</th>
                                <th className="px-3 py-2 text-right">Share %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {r.promoters.map((p, idx) => (
                                <tr key={`${p.name}-${idx}`}>
                                  <td className="px-3 py-2 font-semibold text-slate-900">{p.name}</td>
                                  <td className="px-3 py-2 text-slate-700">{p.role}</td>
                                  <td className="px-3 py-2 text-slate-600">{p.experience}</td>
                                  <td className="px-3 py-2 text-slate-600">{p.qualification}</td>
                                  <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                                    {p.shareholding}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {/* 4. Cost of Project & Means of Finance */}
                      <section className="space-y-4">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          4. Cost of Project &amp; Means of Finance
                        </h2>
                        {r.costRows.length > 0 && (
                          <div>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                                  <tr>
                                    <th className="px-3 py-2">Project Cost Item (CAPEX)</th>
                                    <th className="px-3 py-2 text-right">Share (%)</th>
                                    <th className="px-3 py-2 text-right">Amount (INR Cr)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {r.costRows.map((row, idx) => (
                                    <tr key={`${row.label}-${idx}`}>
                                      <td className="px-3 py-2 text-slate-700">{row.label}</td>
                                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                                        {r.totalCostNum > 0
                                          ? `${((row.amountCr / r.totalCostNum) * 100).toFixed(1)}%`
                                          : '-'}
                                      </td>
                                      <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                                        {fmtCr(row.amountCr)}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="bg-blue-50/70 font-bold text-slate-950">
                                    <td className="px-3 py-2">Total Project Cost</td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                      {r.totalCostNum > 0 ? '100.0%' : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                      {fmtCr(r.totalCostNum)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            {r.costBreakdownNote && (
                              <p className="text-[11px] italic text-slate-500 mt-1.5">
                                {r.costBreakdownNote}
                              </p>
                            )}
                          </div>
                        )}

                        {r.financeRows.length > 0 && (
                          <div>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                                  <tr>
                                    <th className="px-3 py-2">Source of Funds (Means of Finance)</th>
                                    <th className="px-3 py-2 text-right">Share (%)</th>
                                    <th className="px-3 py-2 text-right">Amount (INR Cr)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {r.financeRows.map((row, idx) => (
                                    <tr key={`${row.label}-${idx}`}>
                                      <td className="px-3 py-2 text-slate-700">{row.label}</td>
                                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                                        {row.sharePct}
                                      </td>
                                      <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                                        {row.value}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="bg-blue-50/70 font-bold text-slate-950">
                                    <td className="px-3 py-2">
                                      {r.isFundingBalanced
                                        ? 'Total Means of Finance (Matched)'
                                        : 'Total Means of Finance'}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                      {r.totalFundingNum > 0 ? '100.0%' : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                      {fmtCr(r.totalFundingNum)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <p className="text-[11px] italic text-slate-500 mt-1.5">
                              Debt-to-Equity Ratio: {r.debtEquityRatioLabel}
                            </p>
                          </div>
                        )}
                      </section>

                      {/* 5. Preferred Bank & Next Steps */}
                      <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          5. Preferred Bank &amp; Next Steps
                        </h2>
                        {r.bankRows.length > 0 && (
                          <div className="divide-y divide-slate-100 text-xs">
                            {r.bankRows.map(([k, v]) => (
                              <div key={k} className="py-1.5 flex justify-between gap-4">
                                <span className="font-semibold text-slate-500">{k}</span>
                                <span className="text-slate-900 text-right">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-5">
                          {r.nextStepsLines.map((line, i) => (
                            <li key={i} className="leading-relaxed">
                              {line}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </>
                  ) : (
                    <>
                      {/* DPR 2. Promoter & Management Profile */}
                      <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          2. Promoter &amp; Management Profile
                        </h2>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                              <tr>
                                <th className="px-3 py-2">Promoter / Director</th>
                                <th className="px-3 py-2">Role</th>
                                <th className="px-3 py-2">Experience</th>
                                <th className="px-3 py-2">Qualification</th>
                                <th className="px-3 py-2 text-right">Share %</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {r.promoters.map((p, idx) => (
                                <tr key={`${p.name}-${idx}`}>
                                  <td className="px-3 py-2 font-semibold text-slate-900">{p.name}</td>
                                  <td className="px-3 py-2 text-slate-700">{p.role}</td>
                                  <td className="px-3 py-2 text-slate-600">{p.experience}</td>
                                  <td className="px-3 py-2 text-slate-600">{p.qualification}</td>
                                  <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                                    {p.shareholding}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {r.riskHighlights.length > 0 && (
                          <div className="divide-y divide-slate-100 text-xs">
                            {r.riskHighlights.map(([k, v]) => (
                              <div key={k} className="py-1.5 flex justify-between gap-4">
                                <span className="font-semibold text-slate-500">{k}</span>
                                <span className="text-slate-900 text-right">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      {/* DPR 3. Project Details & Implementation Readiness */}
                      <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          3. Project Details &amp; Implementation Readiness
                        </h2>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700">
                          {r.businessOverviewSummary}
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-5">
                          {r.setupMilestones.map((m, i) => (
                            <li key={i} className="leading-relaxed">
                              {m}
                            </li>
                          ))}
                        </ul>
                      </section>

                      {/* DPR 4. Project Cost Breakdown (CAPEX) */}
                      <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          4. Project Cost Breakdown (CAPEX)
                        </h2>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                              <tr>
                                <th className="px-3 py-2">Cost Component</th>
                                <th className="px-3 py-2 text-right">Share (%)</th>
                                <th className="px-3 py-2 text-right">Amount (INR Cr)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {r.costRows.map((row, idx) => (
                                <tr key={`${row.label}-${idx}`}>
                                  <td className="px-3 py-2 text-slate-700">{row.label}</td>
                                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                                    {r.totalCostNum > 0
                                      ? `${((row.amountCr / r.totalCostNum) * 100).toFixed(1)}%`
                                      : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                                    {fmtCr(row.amountCr)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-blue-50/70 font-bold text-slate-950">
                                <td className="px-3 py-2">Total Project Cost</td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {r.totalCostNum > 0 ? '100.0%' : '-'}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {fmtCr(r.totalCostNum)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {/* DPR 5. Means of Finance & Capital Structure */}
                      <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          5. Means of Finance &amp; Capital Structure
                        </h2>
                        {r.financeRows.length > 0 ? (
                          <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                                <tr>
                                  <th className="px-3 py-2">Funding Source</th>
                                  <th className="px-3 py-2 text-right">Share (%)</th>
                                  <th className="px-3 py-2 text-right">Amount (INR Cr)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {r.financeRows.map((row, idx) => (
                                  <tr key={`${row.label}-${idx}`}>
                                    <td className="px-3 py-2 text-slate-700">{row.label}</td>
                                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                                      {row.sharePct}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                                      {row.value}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-blue-50/70 font-bold text-slate-950">
                                  <td className="px-3 py-2">
                                    {r.isFundingBalanced
                                      ? 'Total Means of Finance (Matched)'
                                      : 'Total Means of Finance'}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {r.totalFundingNum > 0 ? '100.0%' : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {fmtCr(r.totalFundingNum)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600">Funding split to be finalized.</p>
                        )}
                      </section>

                      {/* DPR 6. Financial Viability & Repayment Comfort */}
                      <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          6. Financial Viability &amp; Repayment Comfort
                        </h2>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                              <tr>
                                <th className="px-3 py-2">Bankability Indicator</th>
                                <th className="px-3 py-2">Project Figure</th>
                                <th className="px-3 py-2">What This Means for Loan Safety</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {r.viabilityIndicators.map((v, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 font-semibold text-slate-900">{v.metric}</td>
                                  <td className="px-3 py-2 font-semibold text-blue-700 whitespace-nowrap">
                                    {v.value}
                                  </td>
                                  <td className="px-3 py-2 text-slate-600 leading-relaxed">{v.meaning}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {/* DPR 7. Key Risks & Mitigants */}
                      <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          7. Key Risks &amp; Mitigants
                        </h2>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                              <tr>
                                <th className="px-3 py-2">Risk Area</th>
                                <th className="px-3 py-2">Key Risk</th>
                                <th className="px-3 py-2">How It Is Managed</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {r.riskMitigants.map((rm, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 font-semibold text-slate-900">{rm.area}</td>
                                  <td className="px-3 py-2 text-slate-600 leading-relaxed">{rm.risk}</td>
                                  <td className="px-3 py-2 text-slate-700 leading-relaxed">{rm.mitigant}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>

                      {/* DPR 8. Bank Details & Submission Checklist */}
                      <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-wider text-blue-600 uppercase pb-1.5 border-b border-slate-200">
                          8. Bank Details &amp; Submission Checklist
                        </h2>
                        {r.bankRows.length > 0 && (
                          <div className="divide-y divide-slate-100 text-xs">
                            {r.bankRows.map(([k, v]) => (
                              <div key={k} className="py-1.5 flex justify-between gap-4">
                                <span className="font-semibold text-slate-500">{k}</span>
                                <span className="text-slate-900 text-right">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                              <tr>
                                <th className="px-3 py-2">Standard Bank Submission Document</th>
                                <th className="px-3 py-2">Current Status / Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {r.documentRows.map(([docLabel, docStatus], idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 font-medium text-slate-800">{docLabel}</td>
                                  <td className="px-3 py-2 text-slate-600">{docStatus}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {r.caReviewNotes && (
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Reviewer Notes
                            </div>
                            {r.caReviewNotes}
                          </div>
                        )}
                      </section>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full min-h-[60vh] flex flex-col">
              <object
                data={`${preview.blobUrl}#toolbar=1&navpanes=0&view=FitH`}
                type="application/pdf"
                className="w-full flex-1 bg-white"
              >
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-800">
                    Your browser blocks inline PDF embeds in this window.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md">
                    Switch to <strong>Document View</strong> to read the full formatted report here,
                    or click <strong>Download PDF</strong> to open it offline.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </object>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <span className="truncate font-mono text-[11px] text-slate-600">{preview.filename}</span>
          <div className="flex items-center gap-3">
            <span>Ready to view online or download offline.</span>
            <button
              type="button"
              onClick={onClose}
              className="font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
