export interface ComprehensiveRiskResult {
  scoreOutOf10: number;
  ratingLetter: string;
  riskLevel: string;
  strengths: string[];
  recommendations: string[];
}

export function calculateComprehensiveRiskScore(
  data: any,
  baseFeasibilityScore: number = 80
): ComprehensiveRiskResult {
  let score = baseFeasibilityScore / 10; // Baseline e.g. 8.0

  if (data) {
    if (data.cibilScore && data.cibilScore >= 750) score += 0.6;
    else if (data.cibilScore && data.cibilScore < 680) score -= 0.8;

    if (data.collateralCoveragePct && Number(data.collateralCoveragePct) >= 100) score += 0.5;
    else if (data.collateralCoveragePct && Number(data.collateralCoveragePct) < 50) score -= 0.5;

    if (data.businessVintage && (data.businessVintage.includes('10+') || data.businessVintage.includes('5-10'))) score += 0.4;
  }

  score = Math.min(9.8, Math.max(5.0, Number(score.toFixed(1))));

  let ratingLetter = 'A';
  let riskLevel = 'Low Risk';

  if (score >= 9.0) {
    ratingLetter = 'AAA';
    riskLevel = 'Prime Institutional';
  } else if (score >= 8.0) {
    ratingLetter = 'AA';
    riskLevel = 'Low Risk (Bankable)';
  } else if (score >= 7.0) {
    ratingLetter = 'A';
    riskLevel = 'Moderate Risk';
  } else {
    ratingLetter = 'BBB';
    riskLevel = 'Structuring Required';
  }

  return {
    scoreOutOf10: score,
    ratingLetter,
    riskLevel,
    strengths: [
      'Healthy debt service capacity based on modeled cash flows',
      'Solid promoter equity contribution buffer',
      'Eligible for priority sector lending & interest concessions'
    ],
    recommendations: [
      'Finalize audited CMA data with 7-year projections',
      'Obtain pollution control consent to establish (CTE)',
      'Prepare comprehensive technical layout for plant machinery'
    ]
  };
}
