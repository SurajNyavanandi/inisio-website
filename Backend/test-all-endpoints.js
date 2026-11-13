import http from 'http';

let PORT = 5000;
let server = null;
let authToken = '';
const testEmail = `test_audit_${Date.now()}@example.com`;
const testPassword = 'Password123!Secure';

async function request(path, options = {}) {
  const url = `http://localhost:${PORT}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  // Check if port 5000 is already active
  let isPort5000Active = false;
  try {
    const healthCheck = await fetch('http://localhost:5000/health');
    if (healthCheck.ok) {
      isPort5000Active = true;
      PORT = 5000;
      console.log('⚡ Connected to running Inisio Backend on port 5000');
    }
  } catch {}

  if (!isPort5000Active) {
    process.env.NODE_ENV = 'test';
    const { default: app } = await import('./server.js');
    PORT = 5055;
    console.log('🚀 Starting standalone test server on port', PORT);
    await new Promise((resolve) => {
      server = app.listen(PORT, resolve);
    });
  }

  console.log('⏳ Waiting for MongoDB Atlas connection...');
  for (let i = 0; i < 20; i++) {
    const health = await request('/health');
    if (health.data?.database === 'connected') {
      console.log('✅ Connected to MongoDB Atlas!');
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const results = [];

  async function check(name, testFn) {
    try {
      const res = await testFn();
      if (res.ok) {
        console.log(`  ✅ [${res.status}] ${name}`);
        results.push({ name, pass: true, status: res.status });
      } else {
        console.error(`  ❌ [${res.status}] ${name}:`, res.data);
        results.push({ name, pass: false, status: res.status, error: res.data });
      }
    } catch (err) {
      console.error(`  ❌ [EXCEPTION] ${name}:`, err.message);
      results.push({ name, pass: false, error: err.message });
    }
  }

  console.log('\n--- 1. Health Endpoints ---');
  await check('GET /health', () => request('/health'));
  await check('GET /api/health', () => request('/api/health'));

  console.log('\n--- 2. Public Platform Data Endpoints ---');
  await check('GET /api/stats', () => request('/api/stats'));
  await check('GET /api/industries', () => request('/api/industries'));
  await check('GET /api/testimonials', () => request('/api/testimonials'));
  await check('GET /api/faqs', () => request('/api/faqs'));
  await check('GET /api/blogs', () => request('/api/blogs'));

  console.log('\n--- 3. Authentication & 6-Digit Email OTP Flow ---');
  let otpCode = '';
  await check('POST /api/auth/register (Generates 6-digit OTP & dispatches email)', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Audit Test User',
        email: testEmail,
        password: testPassword,
        phone: '9848012398',
        company: 'Audit Corp',
      },
    });
    if (res.ok && res.data?.data?.otp) {
      otpCode = res.data.data.otp;
      console.log(`  ℹ️ Dispatched 6-digit verification code: ${otpCode}`);
    }
    return res;
  });

  await check('POST /api/auth/verify-email (Submits 6-digit OTP to activate account)', async () => {
    const res = await request('/api/auth/verify-email', {
      method: 'POST',
      body: {
        email: testEmail,
        otp: otpCode,
      },
    });
    if (res.ok && res.data?.data?.token) {
      authToken = res.data.data.token;
    }
    return res;
  });

  await check('POST /api/auth/login', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
      },
    });
    if (res.ok && res.data?.data?.token) {
      authToken = res.data.data.token;
    }
    return res;
  });

  await check('GET /api/auth/me (Authenticated)', () => request('/api/auth/me'));

  console.log('\n--- 4. Interactive & Business Endpoints ---');
  await check('POST /api/contact', () =>
    request('/api/contact', {
      method: 'POST',
      body: {
        name: 'Ramesh Sharma',
        email: 'ramesh@sharma-industries.com',
        phone: '9848012398',
        company: 'Sharma Industries',
        subject: 'Term Loan Syndication Inquiry',
        message: 'Looking for 25 Cr term loan for greenfield plant expansion.',
      },
    })
  );

  await check('POST /api/leads (Assessment submission)', () =>
    request('/api/leads', {
      method: 'POST',
      body: {
        fullName: 'Audit Test User',
        mobile: '9848012398',
        email: testEmail,
        companyName: 'Audit Corp',
        industry: 'Manufacturing',
        projectCost: '15.00',
        termLoanRequired: '10.50',
        location: 'Hyderabad, Telangana',
      },
    })
  );

  await check('GET /api/leads (Authenticated)', () => request('/api/leads'));

  await check('POST /api/projects (Project creation)', () =>
    request('/api/projects', {
      method: 'POST',
      body: {
        promoterName: 'Audit Test User',
        projectName: 'Solar Greenfield Park Phase 1',
        industry: 'Renewables & Solar',
        capexCr: 25.0,
        loanCr: 17.5,
        location: 'Gujarat Solar Park',
      },
    })
  );

  await check('GET /api/projects (Authenticated)', () => request('/api/projects'));
  await check('GET /api/notifications (Authenticated)', () => request('/api/notifications'));

  console.log('\n=============================================');
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`Test Summary: ${passed} / ${total} endpoints passed.`);

  if (server) {
    server.close(() => {
      process.exit(passed === total ? 0 : 1);
    });
  } else {
    process.exit(passed === total ? 0 : 1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  process.exit(1);
});
