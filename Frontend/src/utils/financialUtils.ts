export function calculateSystemDscr(params: { industry?: string; projectCost?: number }): number {
  const ind = (params.industry || '').toLowerCase();
  if (/solar|renewable|clean|power/.test(ind)) return 1.35;
  if (/manufactur|engineering|steel|metal/.test(ind)) return 1.48;
  if (/food|rice|agro|dairy/.test(ind)) return 1.45;
  if (/health|pharma|hospital/.test(ind)) return 1.52;
  if (/warehouse|logistic/.test(ind)) return 1.38;
  if (/hotel|hospitality/.test(ind)) return 1.35;
  return 1.45;
}

export interface ReconciledFinancials {
  debtPct: number;
  eqPct: number;
  machineryCostCr: number;
  civilCostCr: number;
  consultancyCostCr: number;
  otherCostsCr: number;
  totalCostCr: number;
  termLoanCr: number;
  promoterContributionCr: number;
  otherFinanceCr: number;
  totalFinanceCr: number;
  machineryFormatted: string;
  civilFormatted: string;
  consultancyFormatted: string;
  otherCostsFormatted: string;
  termLoanFormatted: string;
  promoterContributionFormatted: string;
  otherFinanceFormatted: string;
  totalCostFormatted: string;
  totalFinanceFormatted: string;
  isBalanced: boolean;
  hasExplicitBreakdown: boolean;
}

const parsePositiveNum = (val: number | string | undefined | null): number | null => {
  if (val === undefined || val === null || val === '') return null;
  const parsed = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, parsed);
};

export function reconcileProjectFinancials(params: {
  totalCostCr?: number | string;
  loanRequiredCr?: number | string;
  promoterContribCr?: number | string;
  debtPct?: number | string;
  eqPct?: number | string;
  consultancyCostCr?: number | string;
  machineryCostCr?: number | string;
  civilCostCr?: number | string;
  otherCostsCr?: number | string;
  termLoanCr?: number | string;
  promoterContributionCr?: number | string;
  otherFinanceCr?: number | string;
}): ReconciledFinancials {
  const explicitMachinery = parsePositiveNum(params.machineryCostCr);
  const explicitCivil = parsePositiveNum(params.civilCostCr);
  const explicitConsultancy = parsePositiveNum(params.consultancyCostCr);
  const explicitOtherCosts = parsePositiveNum(params.otherCostsCr);

  const hasExplicitBreakdown =
    explicitMachinery !== null ||
    explicitCivil !== null ||
    explicitConsultancy !== null ||
    explicitOtherCosts !== null;

  const explicitBreakdownSum =
    (explicitMachinery ?? 0) +
    (explicitCivil ?? 0) +
    (explicitConsultancy ?? 0) +
    (explicitOtherCosts ?? 0);

  const rawTotalCost = parsePositiveNum(params.totalCostCr);
  const explicitTermLoan = parsePositiveNum(params.termLoanCr) ?? parsePositiveNum(params.loanRequiredCr);
  const explicitPromoterContrib =
    parsePositiveNum(params.promoterContributionCr) ?? parsePositiveNum(params.promoterContribCr);
  const explicitOtherFinance = parsePositiveNum(params.otherFinanceCr) ?? 0;

  const explicitFinanceSum =
    (explicitTermLoan ?? 0) + (explicitPromoterContrib ?? 0) + explicitOtherFinance;

  // Prefer explicit breakdown total when detailed breakdown is entered; otherwise use entered totalCostCr or sum of funding
  const totalCost =
    rawTotalCost !== null && rawTotalCost > 0
      ? rawTotalCost
      : explicitBreakdownSum > 0
      ? explicitBreakdownSum
      : explicitFinanceSum > 0
      ? explicitFinanceSum
      : 0;

  const termLoan =
    explicitTermLoan !== null
      ? explicitTermLoan
      : totalCost > 0 && explicitPromoterContrib !== null
      ? Math.max(0, totalCost - explicitPromoterContrib - explicitOtherFinance)
      : totalCost > 0
      ? Number((totalCost * 0.7).toFixed(2))
      : 0;

  const promoterContrib =
    explicitPromoterContrib !== null
      ? explicitPromoterContrib
      : totalCost > 0
      ? Math.max(0, Number((totalCost - termLoan - explicitOtherFinance).toFixed(2)))
      : 0;

  const otherFinance = explicitOtherFinance;

  // Preserve exact user-entered cost breakdown values (including 0); only estimate when user has not entered any breakdown
  const machinery = hasExplicitBreakdown
    ? explicitMachinery ?? 0
    : totalCost > 0
    ? Number((totalCost * 0.55).toFixed(2))
    : 0;

  const civil = hasExplicitBreakdown
    ? explicitCivil ?? 0
    : totalCost > 0
    ? Number((totalCost * 0.25).toFixed(2))
    : 0;

  const consultancy = hasExplicitBreakdown
    ? explicitConsultancy ?? 0
    : totalCost > 0
    ? Number((totalCost * 0.03).toFixed(2))
    : 0;

  const otherCosts = hasExplicitBreakdown
    ? explicitOtherCosts ?? 0
    : totalCost > 0
    ? Math.max(0, Number((totalCost - machinery - civil - consultancy).toFixed(2)))
    : 0;

  const finalTotalCost =
    hasExplicitBreakdown && explicitBreakdownSum > 0 && rawTotalCost === null
      ? explicitBreakdownSum
      : totalCost;

  const totalFinance = Number((termLoan + promoterContrib + otherFinance).toFixed(2));
  const denom = totalFinance > 0 ? totalFinance : finalTotalCost;

  let debtPct: number;
  let eqPct: number;
  if (denom > 0) {
    debtPct = Math.round((termLoan / denom) * 100);
    eqPct = Math.round((promoterContrib / denom) * 100);
    if (otherFinance === 0 && debtPct + eqPct !== 100) {
      eqPct = Math.max(0, 100 - debtPct);
    }
  } else {
    const fallbackDebt = parsePositiveNum(params.debtPct);
    const fallbackEq = parsePositiveNum(params.eqPct);
    debtPct = fallbackDebt !== null ? Math.round(fallbackDebt) : 0;
    eqPct = fallbackEq !== null ? Math.round(fallbackEq) : 0;
  }

  const isBalanced = finalTotalCost === 0 || Math.abs(finalTotalCost - totalFinance) < 0.05;

  return {
    debtPct,
    eqPct,
    machineryCostCr: machinery,
    civilCostCr: civil,
    consultancyCostCr: consultancy,
    otherCostsCr: Math.max(0, otherCosts),
    totalCostCr: finalTotalCost,
    termLoanCr: termLoan,
    promoterContributionCr: promoterContrib,
    otherFinanceCr: otherFinance,
    totalFinanceCr: totalFinance,
    machineryFormatted: machinery.toFixed(2),
    civilFormatted: civil.toFixed(2),
    consultancyFormatted: consultancy.toFixed(2),
    otherCostsFormatted: Math.max(0, otherCosts).toFixed(2),
    termLoanFormatted: termLoan.toFixed(2),
    promoterContributionFormatted: promoterContrib.toFixed(2),
    otherFinanceFormatted: otherFinance.toFixed(2),
    totalCostFormatted: finalTotalCost.toFixed(2),
    totalFinanceFormatted: totalFinance.toFixed(2),
    isBalanced,
    hasExplicitBreakdown,
  };
}
