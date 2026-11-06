export interface PageViewRecord {
  path: string;
  userEmail?: string;
  timestamp: string;
}

const VISITOR_LOG_KEY = 'inisio_visitor_log';

export function recordPageView(page: string, email?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(VISITOR_LOG_KEY);
    const logs: PageViewRecord[] = raw ? JSON.parse(raw) : [];
    logs.push({
      path: page,
      userEmail: email,
      timestamp: new Date().toISOString()
    });
    // Keep last 100 views
    if (logs.length > 100) logs.shift();
    localStorage.setItem(VISITOR_LOG_KEY, JSON.stringify(logs));
  } catch (err) {
    console.debug('Failed to record page view:', err);
  }
}
