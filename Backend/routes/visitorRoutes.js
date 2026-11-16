import express from 'express';

const router = express.Router();

// Buffer for tracked visitor sessions
const visitorLogs = [];

/**
 * Track visitor page view and session
 * Route: POST /api/visitors/track
 */
router.post('/track', (req, res) => {
  const { sessionId, path: pagePath, userEmail } = req.body || {};
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || '';

  const record = {
    id: `vis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sessionId: sessionId || `sess_${Date.now()}`,
    path: pagePath || '/',
    userEmail: userEmail || null,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  };

  visitorLogs.unshift(record);
  if (visitorLogs.length > 200) {
    visitorLogs.length = 200;
  }

  return res.status(200).json({
    success: true,
    message: 'Visitor session tracked successfully',
    data: record,
  });
});

/**
 * Fetch recent visitor sessions
 * Route: GET /api/visitors
 */
router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    count: visitorLogs.length,
    data: visitorLogs,
  });
});

export default router;
