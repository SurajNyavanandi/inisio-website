export type UserRole =
  | 'user'
  | 'promoter'
  | 'ca'
  | 'dpr_consultant'
  | 'prosync'
  | 'prosync_admin'
  | 'admin'
  | 'superadmin'
  | 'admin1'
  | 'admin2'
  | 'admin3';

export interface AuthUser {
  email: string;
  role: string;
  name?: string;
  company?: string;
  phone?: string;
  token?: string;
  id?: string;
  membershipPlan?: string;
}

export interface PromoterDetail {
  id: string;
  name: string;
  experienceYears: string;
  qualification: string;
  shareholdingPct: number;
  role: string;
  kycStatus?: string;
}

export function getFeasibilityTerm(score: number): string {
  if (score >= 80) return 'High Bankability';
  if (score >= 65) return 'Moderate Bankability';
  if (score >= 50) return 'Viable with Collateral';
  return 'Structuring & Risk Advisory Needed';
}
