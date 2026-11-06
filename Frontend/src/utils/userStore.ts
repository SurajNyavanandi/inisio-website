import { AuthUser } from '../types';

const LOGIN_HISTORY_KEY = 'inisio_login_history';

export function recordUserLogin(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOGIN_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.unshift({
      email: user.email,
      role: user.role,
      name: user.name,
      timestamp: new Date().toISOString()
    });
    if (history.length > 50) history.pop();
    localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.debug('Failed to record login:', err);
  }
}
