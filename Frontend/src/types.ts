export type UserRole =
  | 'user'
  | 'promoter'
  | 'ca'
  | 'ca_admin'
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
  membershipPlanId?: 'free_plan' | 'promoter_boost' | 'promoter_plus';
  membershipPlan?: string;
  membershipTier?: string;
  membershipStatus?: 'Free Plan' | 'Active' | 'Expiring Soon' | 'Expired';
  membershipActivatedAt?: string;
  membershipExpiresAt?: string;
  createdAt?: string;
  lastLoginAt?: string;
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

export interface TrustNumber {
  id?: string;
  statId?: string;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon: string;
  order?: number;
}

export interface TestimonialItem {
  id?: string;
  testimonialId?: string;
  recordType?: 'case_study' | 'testimonial';
  projectType?: string;
  fundingRequirement?: string;
  advisoryScope?: string;
  advisoryPartner?: string;
  writtenPermission?: boolean;
  name: string;
  title: string;
  company: string;
  industry: string;
  quote: string;
  fundingAmount?: string;
  rating?: number;
}

export interface BlogPostItem {
  id?: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  content?: string;
  author?: string;
  featured?: boolean;
  tags?: string[];
}

export interface FAQItem {
  id?: string;
  faqId?: string;
  question: string;
  answer: string;
  category?: string;
}
