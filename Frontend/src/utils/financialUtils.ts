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
}

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
  const totalCost = Math.max(0, Number(params.totalCostCr) || 10);
  const loanReq = Math.max(0, Number(params.loanRequiredCr) || totalCost * 0.7);
  const promoterContrib = Math.max(0, Number(params.promoterContribCr) || Math.max(0, totalCost - loanReq));
  const otherFinance = Math.max(0, Number(params.otherFinanceCr) || 0);

  const machinery = params.machineryCostCr !== undefined && params.machineryCostCr !== ''
    ? Number(params.machineryCostCr) || 0
    : totalCost * 0.55;

  const civil = params.civilCostCr !== undefined && params.civilCostCr !== ''
    ? Number(params.civilCostCr) || 0
    : totalCost * 0.25;

  const consultancy = params.consultancyCostCr !== undefined && params.consultancyCostCr !== ''
    ? Number(params.consultancyCostCr) || 0
    : totalCost * 0.03;

  const otherCosts = params.otherCostsCr !== undefined && params.otherCostsCr !== ''
    ? Number(params.otherCostsCr) || 0
    : Math.max(0, totalCost - machinery - civil - consultancy);

  const totalFinance = loanReq + promoterContrib + otherFinance;

  let debtPct = params.debtPct !== undefined && params.debtPct !== '' ? Number(params.debtPct) : NaN;
  let eqPct = params.eqPct !== undefined && params.eqPct !== '' ? Number(params.eqPct) : NaN;

  if (isNaN(debtPct) || isNaN(eqPct)) {
    if (totalCost > 0) {
      debtPct = Math.round((loanReq / totalCost) * 100);
      eqPct = Math.max(0, 100 - debtPct);
    } else {
      debtPct = 70;
      eqPct = 30;
    }
  }

  const isBalanced = totalCost === 0 || Math.abs(totalCost - totalFinance) < 0.05;

  return {
    debtPct,
    eqPct,
    machineryCostCr: machinery,
    civilCostCr: civil,
    consultancyCostCr: consultancy,
    otherCostsCr: Math.max(0, otherCosts),
    totalCostCr: totalCost,
    termLoanCr: loanReq,
    promoterContributionCr: promoterContrib,
    otherFinanceCr: otherFinance,
    totalFinanceCr: totalFinance,
    machineryFormatted: machinery.toFixed(2),
    civilFormatted: civil.toFixed(2),
    consultancyFormatted: consultancy.toFixed(2),
    otherCostsFormatted: Math.max(0, otherCosts).toFixed(2),
    termLoanFormatted: loanReq.toFixed(2),
    promoterContributionFormatted: promoterContrib.toFixed(2),
    otherFinanceFormatted: otherFinance.toFixed(2),
    totalCostFormatted: totalCost.toFixed(2),
    totalFinanceFormatted: totalFinance.toFixed(2),
    isBalanced
  };
}
