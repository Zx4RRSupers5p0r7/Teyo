const { spawn } = require('child_process');
const http = require('http');
const Stripe = require('stripe');

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

  return requestRaw(path, body, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    }
  });
}

function requestRaw(path, body, options = {}) {
  const method = options.method || 'GET';
  const headers = options.headers || {};

  return new Promise((resolve, reject) => {
    const req = http.request(
      `${BASE_URL}${path}`,
      {
        method,
        headers
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
      STRIPE_SECRET_KEY: 'sk_test_smoke_key_123456',
      STRIPE_WEBHOOK_SECRET: 'whsec_smoke_guard',
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
    assert(ready.status === 200, 'Ready should report healthy when the app is running with Stripe configured');

    const partnerCreate = await request('/api/partner', {
      method: 'POST',
      body: {
        companyName: 'Smoke Test Co',
        ownerEmail: 'owner@smoketestco.com',
        websiteUrl: 'https://www.smoketestco.com',
        details: 'Smoke test company submission'
      }
    });
    assert(partnerCreate.status === 200 && partnerCreate.body && partnerCreate.body.success, 'Partner creation should succeed');

    const adminPartners = await request('/api/partners', {
      headers: {
        'x-owner-email': OWNER_EMAIL,
        'x-owner-key': OWNER_KEY
      }
    });
    assert(adminPartners.status === 200 && Array.isArray(adminPartners.body), 'Admin partners should return an array');
    const createdPartner = adminPartners.body.find((entry) => entry.companyName === 'Smoke Test Co');
    assert(createdPartner, 'Created partner should be present in admin partner data');
    assert(createdPartner.activeListing === true, 'Created partner should be marked active after setup');
    assert(createdPartner.storeSync && createdPartner.storeSync.enabled === true, 'Created partner should auto-enable website-based marketplace sync');
    assert(createdPartner.storeSync && String(createdPartner.storeSync.sourceUrl || '').includes('smoketestco.com'), 'Created partner should use the company website as its sync source');

    const publicPartners = await request('/api/partners');
    assert(publicPartners.status === 200 && Array.isArray(publicPartners.body), 'Public partners should return an array');
    assert(publicPartners.body.length >= 1, 'Public partners should include created partner');
    assert(!Object.prototype.hasOwnProperty.call(publicPartners.body[0], 'ownerEmail'), 'Public partners must not expose ownerEmail');

    const leadCapture = await request('/api/leads', {
      method: 'POST',
      body: {
        name: 'Smoke Lead',
        email: 'lead@smoketestco.com',
        company: 'Smoke Test Co',
        interest: 'partner access',
        referralCode: 'smoke-ref',
        source: 'smoke-test'
      }
    });
    assert(leadCapture.status === 200 && leadCapture.body && leadCapture.body.success, 'Lead capture should succeed');

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

    assert(adminPartners.body.length >= 1, 'Admin partners should include created partner');
    assert(Object.prototype.hasOwnProperty.call(adminPartners.body[0], 'ownerEmail'), 'Admin partners should include ownerEmail');

    const guardEntity = await request('/api/guard/entities', {
      method: 'POST',
      body: {
        email: 'guard@smoketestco.com',
        companyName: 'Guard Smoke Family Office',
        aum: 75000000,
        primaryResidency: 'US',
        riskTolerance: 'Balanced'
      }
    });
    assert(guardEntity.status === 200 && guardEntity.body && guardEntity.body.success, 'Guard entity creation should succeed');

    const dashboard = await request(`/api/guard/compliance-dashboard/${guardEntity.body.entityId}`, {
      headers: {
        'x-access-key': guardEntity.body.accessKey
      }
    });
    assert(dashboard.status === 200 && dashboard.body && dashboard.body.success, 'Guard dashboard should load for the new entity');

    const stripe = new Stripe('sk_test_replace_with_real_key');
    const payload = JSON.stringify({
      id: `evt_smoke_guard_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_smoke_guard',
          metadata: {
            plan: 'guard',
            entityId: guardEntity.body.entityId,
            accessKey: guardEntity.body.accessKey,
            companyName: 'Guard Smoke Family Office',
            ownerEmail: 'guard@smoketestco.com',
            aum: '75000000',
            primaryResidency: 'US',
            riskTolerance: 'Balanced'
          },
          payment_status: 'paid',
          amount_total: 2500000,
          status: 'complete',
          customer_email: 'guard@smoketestco.com',
          subscription: 'sub_smoke_guard'
        }
      }
    });
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_smoke_guard' });
    const webhook = await requestRaw('/api/stripe/webhook', payload, {
      method: 'POST',
      headers: {
        'Stripe-Signature': header,
        'Content-Type': 'application/json'
      }
    });
    assert(webhook.status === 200, 'Guard webhook should activate the subscription');

    const activatedEntity = await request(`/api/guard/entities/${guardEntity.body.entityId}`, {
      headers: {
        'x-access-key': guardEntity.body.accessKey
      }
    });
    assert(activatedEntity.status === 200 && activatedEntity.body && activatedEntity.body.entity && activatedEntity.body.entity.subscriptionStatus === 'active', 'Guard entity should become active after webhook');

    console.log('Smoke tests passed.');
  } finally {
    server.kill('SIGTERM');
  }
}

run().catch((error) => {
  console.error('Smoke tests failed:', error.message);
  process.exitCode = 1;
});
