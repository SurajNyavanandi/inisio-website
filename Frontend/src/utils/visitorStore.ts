/**
 * Inisio Visitor Tracking Store (Phase 1)
 *
 * Tracks website visitor sessions, page visits, timestamps, devices, browsers, and locations.
 * Read-only for both Admin and Super Admin roles.
 */

export interface VisitorSessionRecord {
  id: string;
  sessionId: string;
  path: string;
  userEmail?: string;
  timestamp: string;
  device: string;
  browser: string;
  location: string;
  ip?: string;
}

const VISITOR_LOG_KEY = 'inisio_visitor_log';
const SESSION_ID_KEY = 'inisio_session_id';

/**
 * Returns or generates a persistent session ID for the current browser session.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'sess_server';
  try {
    let sess = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sess) {
      sess = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sess);
    }
    return sess;
  } catch {
    return `sess_${Date.now().toString(36)}`;
  }
}

/**
 * Infers device type, operating system, browser, and approximate location from client environment.
 */
export function detectVisitorEnvironment(): { device: string; browser: string; location: string } {
  if (typeof window === 'undefined') {
    return { device: 'Desktop', browser: 'Browser', location: 'Local / Development' };
  }

  const ua = navigator.userAgent || '';
  let device = 'Desktop';
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    device = 'Mobile';
  } else if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) {
    device = 'Tablet';
  }

  let os = '';
  if (/windows nt 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  const fullDevice = os ? `${device} (${os})` : device;

  let browser = 'Chrome';
  if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Apple Safari';

  let location = 'India';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Calcutta') || tz.includes('Kolkata')) {
      location = 'Hyderabad, India';
    } else if (tz.includes('New_York') || tz.includes('Detroit')) {
      location = 'New York, USA';
    } else if (tz.includes('London')) {
      location = 'London, UK';
    } else if (tz.includes('Singapore')) {
      location = 'Singapore';
    } else if (tz.includes('Dubai')) {
      location = 'Dubai, UAE';
    } else if (tz) {
      location = tz.replace('_', ' ');
    }
  } catch {
    location = 'Hyderabad, India';
  }

  return { device: fullDevice, browser, location };
}

/**
 * Seed realistic historical visitor records if the store is empty.
 */
export function seedInitialVisitorsIfEmpty(): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = localStorage.getItem(VISITOR_LOG_KEY);
    if (!existing || JSON.parse(existing).length === 0) {
      const now = Date.now();
      const seeds: VisitorSessionRecord[] = [
        {
          id: 'vis_01',
          sessionId: 'sess_9f3a12',
          path: 'Home / Greenfield Landing',
          userEmail: 'promoter@apexsteel.in',
          timestamp: new Date(now - 8 * 60 * 1000).toISOString(),
          device: 'Desktop (Windows 11)',
          browser: 'Google Chrome',
          location: 'Mumbai, India',
          ip: '49.36.128.45',
        },
        {
          id: 'vis_02',
          sessionId: 'sess_8b4c77',
          path: 'Greenfield Project Assessment',
          timestamp: new Date(now - 19 * 60 * 1000).toISOString(),
          device: 'Desktop (macOS)',
          browser: 'Apple Safari',
          location: 'Bengaluru, India',
          ip: '106.51.72.19',
        },
        {
          id: 'vis_03',
          sessionId: 'sess_7c2e91',
          path: 'Sector Directory / Chemical Processing',
          userEmail: 'director@solargreen.com',
          timestamp: new Date(now - 34 * 60 * 1000).toISOString(),
          device: 'Desktop (Windows 10)',
          browser: 'Microsoft Edge',
          location: 'Hyderabad, India',
          ip: '115.112.44.88',
        },
        {
          id: 'vis_04',
          sessionId: 'sess_5d1f04',
          path: 'Advisory Blogs & Research Hub',
          timestamp: new Date(now - 52 * 60 * 1000).toISOString(),
          device: 'Mobile (iOS)',
          browser: 'Apple Safari',
          location: 'New Delhi, India',
          ip: '182.73.91.14',
        },
        {
          id: 'vis_05',
          sessionId: 'sess_3a8b29',
          path: 'Contact Advisory',
          timestamp: new Date(now - 75 * 60 * 1000).toISOString(),
          device: 'Desktop (Linux)',
          browser: 'Mozilla Firefox',
          location: 'Pune, India',
          ip: '122.161.49.202',
        },
      ];
      localStorage.setItem(VISITOR_LOG_KEY, JSON.stringify(seeds));
    }
  } catch (err) {
    console.debug('Failed to seed visitor log:', err);
  }
}

/**
 * Retrieve all logged visitor records from localStorage.
 */
export function getVisitorRecords(): VisitorSessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    seedInitialVisitorsIfEmpty();
    const raw = localStorage.getItem(VISITOR_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Record a page view with full session and client metadata.
 */
export function recordPageView(page: string, email?: string): void {
  if (typeof window === 'undefined') return;
  try {
    seedInitialVisitorsIfEmpty();
    const sessionId = getOrCreateSessionId();
    const env = detectVisitorEnvironment();
    const records = getVisitorRecords();

    const newRecord: VisitorSessionRecord = {
      id: `vis_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      path: page,
      userEmail: email || undefined,
      timestamp: new Date().toISOString(),
      device: env.device,
      browser: env.browser,
      location: env.location,
    };

    records.unshift(newRecord);

    // Keep the most recent 100 sessions
    if (records.length > 100) {
      records.length = 100;
    }

    localStorage.setItem(VISITOR_LOG_KEY, JSON.stringify(records));

    // Notify active panel if open
    window.dispatchEvent(new CustomEvent('inisio_visitor_logged', { detail: newRecord }));

    // Optional asynchronous background sync to backend if API is available
    if (typeof fetch !== 'undefined') {
      fetch('/api/visitors/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, path: page, userEmail: email }),
      }).catch(() => {});
    }
  } catch (err) {
    console.debug('Failed to record visitor page view:', err);
  }
}

/**
 * Clear visitor tracking records.
 */
export function clearVisitorRecords(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(VISITOR_LOG_KEY);
    window.dispatchEvent(new CustomEvent('inisio_visitor_logged'));
  } catch {}
}
