import { AuthUser } from '../types';

export function canUserStartAssessment(user: AuthUser | null): { allowed: boolean; reason?: string } {
  // Free assessments are open to all users and guests
  return { allowed: true };
}

export function recordAssessmentCompletion(userEmail?: string, projectId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = 'inisio_completed_assessments';
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    list.push({
      userEmail,
      projectId,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.debug('Failed to record assessment:', err);
  }
}
