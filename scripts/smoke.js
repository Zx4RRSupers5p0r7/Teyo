const { spawn } = require('child_process');
const http = require('http');

const TEST_PORT = 4310;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const OWNER_EMAIL = 'chazmiller872@gmail.com';
const OWNER_KEY = '^ty8e(%uI98dYhfgjeHDg0adj$#$';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(path, options = {}) {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = options.body ? JSON.stringify(options.body) : null;

  return new Promise((resolve, reject) => {
    const req = http.request(
      `${BASE_URL}${path}`,
      {
        method,
        headers: {
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...headers
        }
      },
      (res) => {
        let chunks = '';
        res.on('data', (chunk) => {
          chunks += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = chunks ? JSON.parse(chunks) : null;
          } catch (error) {
            parsed = chunks;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function waitForHealth(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await request('/api/health');
      if (res.status === 200 && res.body && res.body.status === 'ok') {
        return true;
      }
    } catch (error) {
      // retry
    }
    await wait(500);
  }
  return false;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const server = spawn(process.execPath, ['server.js'], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(TEST_PORT),
      APP_BASE_URL: BASE_URL,
      ADMIN_API_KEY: 'smoke_test_admin_key_1234567890_abcdef',
      OWNER_EMAIL,
      OWNER_ACCESS_KEY: OWNER_KEY,
      STRIPE_SECRET_KEY: '',
      STRIPE_WEBHOOK_SECRET: '',
      DATABASE_URL: ''
    },
    stdio: 'inherit'
  });

  try {
    const healthy = await waitForHealth();
    assert(healthy, 'Server did not become healthy in time');

    const home = await request('/');
    assert(home.status === 200, 'Home page should return 200');

    const ready = await request('/api/ready');
    assert(ready.status === 503, 'Ready should be 503 in smoke mode without Stripe');

    const partnerCreate = await request('/api/partner', {
      method: 'POST',
      body: {
        companyName: 'Smoke Test Co',
        ownerEmail: 'owner@smoketestco.com',
        websiteUrl: 'https://smoketestco.com',
        details: 'Smoke test company submission'
      }
    });
    assert(partnerCreate.status === 200 && partnerCreate.body && partnerCreate.body.success, 'Partner creation should succeed');

    const publicPartners = await request('/api/partners');
    assert(publicPartners.status === 200 && Array.isArray(publicPartners.body), 'Public partners should return an array');
    assert(publicPartners.body.length >= 1, 'Public partners should include created partner');
    assert(!Object.prototype.hasOwnProperty.call(publicPartners.body[0], 'ownerEmail'), 'Public partners must not expose ownerEmail');

    const adminVerifyUnauthorized = await request('/api/admin/verify', { method: 'POST' });
    assert(adminVerifyUnauthorized.status === 401, 'Admin verify should reject missing owner auth');

    const adminVerifyAuthorized = await request('/api/admin/verify', {
      method: 'POST',
      headers: {
        'x-owner-email': OWNER_EMAIL,
        'x-owner-key': OWNER_KEY
      }
    });
    assert(adminVerifyAuthorized.status === 200 && adminVerifyAuthorized.body && adminVerifyAuthorized.body.success, 'Admin verify should pass with valid owner credentials');

    const adminPartners = await request('/api/partners', {
      headers: {
        'x-owner-email': OWNER_EMAIL,
        'x-owner-key': OWNER_KEY
      }
    });
    assert(adminPartners.status === 200 && Array.isArray(adminPartners.body), 'Admin partners should return an array');
    assert(adminPartners.body.length >= 1, 'Admin partners should include created partner');
    assert(Object.prototype.hasOwnProperty.call(adminPartners.body[0], 'ownerEmail'), 'Admin partners should include ownerEmail');

    console.log('Smoke tests passed.');
  } finally {
    server.kill('SIGTERM');
  }
}

run().catch((error) => {
  console.error('Smoke tests failed:', error.message);
  process.exitCode = 1;
});
