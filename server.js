require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const fsp = fs.promises;
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const { Pool } = require('pg');
const sanitizeHtml = require('sanitize-html');
const Stripe = require('stripe');

const app = express();
const port = process.env.PORT || 3000;
const storageDir = path.join(__dirname, 'storage');
const dataFile = path.join(storageDir, 'data.json');
const legacyDataFile = path.join(__dirname, 'data.json');
const stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || '').trim();
const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const appBaseUrl = String(process.env.APP_BASE_URL || '').trim();
const adminApiKey = String(process.env.ADMIN_API_KEY || '').trim();
const ownerEmail = sanitizeEmail(process.env.OWNER_EMAIL || '');
const ownerAccessKey = String(process.env.OWNER_ACCESS_KEY || '').trim();

// In-memory live viewer tracking (resets on server restart — intentional)
const _activeSessions = new Map();
const _seenSessionIds  = new Set();
const _SESSION_TTL = 35000; // 35 s — heartbeat fires every 15 s

function getRecommendedPrice(total) {
  if (total >= 10000) return { label: '$2,500', cents: 250000, advice: 'Over 10,000 visitors — original price is now fully justified.' };
  if (total >= 5000)  return { label: '$1,999', cents: 199900, advice: 'Strong platform — raise to $1,999.' };
  if (total >= 2000)  return { label: '$999',   cents: 99900,  advice: 'Proven traction — raise to $999.' };
  if (total >= 500)   return { label: '$499',   cents: 49900,  advice: 'Growing traffic — consider raising to $499.' };
  return { label: '$249', cents: 24900, advice: 'Building your audience — $249 is the right entry price right now.' };
}
const databaseUrl = String(process.env.DATABASE_URL || '').trim();
const validStripeKey = /^sk_(live|test)_[A-Za-z0-9]+$/.test(stripeSecretKey);
const stripe = validStripeKey ? new Stripe(stripeSecretKey) : null;
const PRICING = {
  placement: { amount: 24900, description: 'Teyo premium product placement for $249 one-time access.' },
  monthlyAd: { amount: 12999, description: 'Teyo monthly sponsor ad placement for $129.99/month.' },
  customerOneTime: { amount: 499, description: 'Teyo customer smart checkout pass (one-time).' },
  customerPlus: { trialAmount: 199, recurringAmount: 999, description: 'Teyo Plus customer plan with launch pricing.' }
};
const CUSTOMER_THEME_ENTITLEMENT_DAYS = 30;
const PUBLIC_FILE_ALLOWLIST = new Set([
  'index.html',
  'marketplace.html',
  'partners.html',
  'admin.html',
  'inventory.html',
  'contact.html',
  'styles.css',
  'script.js',
  'favicon.svg'
]);

let inMemoryData = null;
let writeQueue = Promise.resolve();
let storageMode = 'file';
let dbPool = null;

if (!validStripeKey && stripeSecretKey) {
  console.warn('Stripe secret key appears invalid. Checkout is disabled until STRIPE_SECRET_KEY is corrected.');
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://unpkg.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'https://api.stripe.com', 'https://nominatim.openstreetmap.org', 'https://overpass-api.de'],
      frameSrc: ["'self'", 'https://www.google.com', 'https://maps.google.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'", 'https://checkout.stripe.com']
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 15552000,
    includeSubDomains: true,
    preload: true
  }
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);

function hasValidAdminHeader(req) {
  if (!adminApiKey || adminApiKey.length < 32) {
    return false;
  }

  const providedKey = String(req.headers['x-admin-key'] || '').trim();
  return Boolean(providedKey) && secureEquals(providedKey, adminApiKey);
}

function secureEquals(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function requireAdmin(req, res, next) {
  if (!hasOwnerHeader(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized admin request.' });
  }

  next();
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function sanitizePlainText(value, maxLength = 4000) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function sanitizeEmail(value) {
  const email = sanitizePlainText(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function isIsoDate(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return false;
  }

  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime());
}

function sanitizeSizeToken(value) {
  return sanitizePlainText(value, 24).toUpperCase();
}

function sanitizeSizeOptions(value) {
  const tokens = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  const seen = new Set();
  const result = [];

  tokens.forEach((token) => {
    const safe = sanitizeSizeToken(token);
    if (!safe || seen.has(safe)) {
      return;
    }
    seen.add(safe);
    result.push(safe);
  });

  return result.slice(0, 40);
}

function sanitizeSizeInventory(value, fallbackStockStatus = '') {
  const lines = Array.isArray(value)
    ? value.map((entry) => JSON.stringify(entry))
    : String(value || '').split(/\r?\n/);
  const entries = [];

  lines.forEach((line) => {
    const raw = String(line || '').trim();
    if (!raw) {
      return;
    }

    let storeName = '';
    let size = '';
    let status = '';
    let restockDate = '';

    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        storeName = sanitizePlainText(parsed.storeName, 140);
        size = sanitizeSizeToken(parsed.size);
        status = sanitizePlainText(parsed.stockStatus || parsed.status, 80);
        restockDate = sanitizePlainText(parsed.restockDate, 20);
      } catch (error) {
        return;
      }
    } else {
      const [storePart, sizePart, statusPart, datePart] = raw.split('|');
      storeName = sanitizePlainText(storePart, 140);
      size = sanitizeSizeToken(sizePart);
      status = sanitizePlainText(statusPart, 80);
      restockDate = sanitizePlainText(datePart, 20);
    }

    if (!storeName || !size) {
      return;
    }

    entries.push({
      storeName,
      size,
      stockStatus: status || fallbackStockStatus || 'Check availability',
      restockDate: isIsoDate(restockDate) ? restockDate : ''
    });
  });

  return entries.slice(0, 500);
}

function isSafeHttpUrl(value) {
  const urlValue = String(value || '').trim();
  if (!urlValue) {
    return false;
  }

  try {
    const parsed = new URL(urlValue);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function normalizeWebsite(value) {
  const trimmed = sanitizePlainText(value, 2048);
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function isValidBusinessWebsite(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return false;
  }

  const normalized = normalizeWebsite(trimmed);

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();
    const blockedDomains = ['gmail.com','yahoo.com','outlook.com','hotmail.com','live.com','aol.com','mail.com','protonmail.com','icloud.com','zoho.com','gmx.com','msn.com','yandex.com','qq.com','163.com'];

    if (!hostname.includes('.') || hostname === 'localhost' || hostname === '127.0.0.1') {
      return false;
    }

    return !blockedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch (error) {
    return false;
  }
}

function isBusinessOwnerSubmission(companyName, websiteUrl) {
  const normalizedName = String(companyName || '').trim();
  return normalizedName.length >= 2 && isValidBusinessWebsite(websiteUrl);
}

function hasOwnerAccess(customerEmail) {
  const email = sanitizeEmail(customerEmail);
  return Boolean(ownerEmail && email && normalizeName(email) === normalizeName(ownerEmail));
}

function hasOwnerKeyAccess(customerEmail, accessKey = '') {
  return hasOwnerAccess(customerEmail) && Boolean(ownerAccessKey && secureEquals(String(accessKey || '').trim(), ownerAccessKey));
}

function isOwnerConfigured() {
  return Boolean(ownerEmail && ownerAccessKey && ownerEmail.length > 0 && ownerAccessKey.length >= 8);
}

function hasOwnerHeader(req) {
  const providedEmail = sanitizeEmail(req.headers['x-owner-email']);
  const providedKey = String(req.headers['x-owner-key'] || '').trim();
  return hasOwnerKeyAccess(providedEmail, providedKey);
}

function hasPrivilegedAccess(req) {
  return hasValidAdminHeader(req) || hasOwnerHeader(req);
}

function sanitizeCreative(creative) {
  const normalizedImageUrl = normalizeWebsite(creative?.imageUrl || '');

  return {
    accentColor: /^#[0-9a-fA-F]{6}$/.test(String(creative?.accentColor || '')) ? String(creative.accentColor) : '#ffffff',
    backgroundColor: /^#[0-9a-fA-F]{6}$/.test(String(creative?.backgroundColor || '')) ? String(creative.backgroundColor) : '#121212',
    textColor: /^#[0-9a-fA-F]{6}$/.test(String(creative?.textColor || '')) ? String(creative.textColor) : '#ffffff',
    sticker: sanitizePlainText(creative?.sticker, 40),
    ctaLabel: sanitizePlainText(creative?.ctaLabel || 'View offer', 60),
    htmlSnippet: sanitizeHtml(String(creative?.htmlSnippet || ''), {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'],
      allowedAttributes: {
        a: ['href', 'target', 'rel'],
        span: ['class']
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', { rel: 'noreferrer noopener', target: '_blank' })
      }
    }).slice(0, 5000),
    imageUrl: isSafeHttpUrl(normalizedImageUrl) ? normalizedImageUrl : ''
  };
}

function getDefaultData() {
  return {
    partners: [],
    ads: [],
    products: [],
    webhookEvents: [],
    customerEntitlements: [],
    customerSubscriptions: []
  };
}

function ensureDataShape(parsed) {
  return {
    partners: Array.isArray(parsed.partners) ? parsed.partners : [],
    ads: Array.isArray(parsed.ads) ? parsed.ads : [],
    products: Array.isArray(parsed.products) ? parsed.products : [],
    webhookEvents: Array.isArray(parsed.webhookEvents) ? parsed.webhookEvents : [],
    customerEntitlements: Array.isArray(parsed.customerEntitlements) ? parsed.customerEntitlements : [],
    customerSubscriptions: Array.isArray(parsed.customerSubscriptions) ? parsed.customerSubscriptions : [],
    totalVisitors: Number.isInteger(parsed.totalVisitors) ? parsed.totalVisitors : 0
  };
}

function ensureDataFile() {
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    if (fs.existsSync(legacyDataFile)) {
      const legacyRaw = fs.readFileSync(legacyDataFile, 'utf8');
      fs.writeFileSync(dataFile, legacyRaw);
    } else {
      fs.writeFileSync(dataFile, JSON.stringify(getDefaultData(), null, 2));
    }
  }
}

function readLocalDataFallback() {
  ensureDataFile();

  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    return ensureDataShape(parsed);
  } catch (error) {
    return getDefaultData();
  }
}

async function initPostgresStorage() {
  dbPool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS teyo_kv_store (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const stateRow = await dbPool.query('SELECT value FROM teyo_kv_store WHERE key = $1', ['state']);
  if (stateRow.rows.length > 0) {
    inMemoryData = ensureDataShape(stateRow.rows[0].value || {});
    storageMode = 'postgres';
    return;
  }

  const seed = readLocalDataFallback();
  inMemoryData = ensureDataShape(seed);

  await dbPool.query(
    `
      INSERT INTO teyo_kv_store (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    ['state', JSON.stringify(inMemoryData)]
  );

  storageMode = 'postgres';
}

async function initializeStorage() {
  if (!databaseUrl) {
    inMemoryData = readLocalDataFallback();
    storageMode = 'file';
    return;
  }

  try {
    await initPostgresStorage();
  } catch (error) {
    if (dbPool) {
      try {
        await dbPool.end();
      } catch (closeError) {
        // Ignore pool shutdown errors during fallback.
      }
      dbPool = null;
    }

    storageMode = 'file';
    inMemoryData = readLocalDataFallback();
    console.warn(`Postgres storage unavailable, falling back to file storage: ${error.message}`);
  }
}

function loadData() {
  if (inMemoryData) {
    return inMemoryData;
  }

  inMemoryData = readLocalDataFallback();
  return inMemoryData;
}

function saveData(data) {
  inMemoryData = ensureDataShape(data);
  if (storageMode === 'postgres' && dbPool) {
    const snapshot = JSON.stringify(inMemoryData);
    writeQueue = writeQueue
      .then(() => dbPool.query(
        `
          INSERT INTO teyo_kv_store (key, value, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (key)
          DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `,
        ['state', snapshot]
      ))
      .catch(() => dbPool.query(
        `
          INSERT INTO teyo_kv_store (key, value, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (key)
          DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `,
        ['state', snapshot]
      ));
    return;
  }

  const snapshot = JSON.stringify(inMemoryData, null, 2);
  writeQueue = writeQueue
    .then(() => fsp.writeFile(dataFile, snapshot))
    .catch(() => fsp.writeFile(dataFile, snapshot));
}

function serializePublicPartner(entry) {
  return {
    id: entry.id,
    companyName: entry.companyName,
    websiteUrl: entry.websiteUrl,
    paid: Boolean(entry.paid),
    activeListing: Boolean(entry.activeListing),
    createdAt: entry.createdAt
  };
}

function serializePublicAd(entry) {
  return {
    id: entry.id,
    companyName: entry.companyName,
    headline: entry.headline,
    description: entry.description,
    link: entry.link,
    creative: {
      accentColor: entry.creative?.accentColor || '#ffffff',
      backgroundColor: entry.creative?.backgroundColor || '#121212',
      textColor: entry.creative?.textColor || '#ffffff',
      sticker: entry.creative?.sticker || '',
      ctaLabel: entry.creative?.ctaLabel || 'View offer',
      htmlSnippet: '',
      imageUrl: entry.creative?.imageUrl || ''
    },
    paid: Boolean(entry.paid),
    active: Boolean(entry.active),
    createdAt: entry.createdAt
  };
}

function serializePublicProduct(entry) {
  return {
    id: entry.id,
    productName: entry.productName,
    companyName: entry.companyName,
    category: entry.category,
    price: entry.price,
    websiteUrl: entry.websiteUrl,
    description: entry.description,
    imageUrl: entry.imageUrl,
    stockStatus: entry.stockStatus,
    safetyNote: entry.safetyNote,
    stores: Array.isArray(entry.stores) ? entry.stores : [],
    sizeOptions: Array.isArray(entry.sizeOptions) ? entry.sizeOptions : [],
    sizeInventory: Array.isArray(entry.sizeInventory) ? entry.sizeInventory : [],
    rating: entry.rating || '',
    reviewCount: entry.reviewCount || '',
    verifiedSeller: Boolean(entry.verifiedSeller),
    verificationStatus: entry.verificationStatus || '',
    trustSummary: entry.trustSummary || '',
    approved: Boolean(entry.approved),
    visible: Boolean(entry.visible),
    createdAt: entry.createdAt
  };
}

function ensurePartnerRecord(companyName, ownerEmail = '') {
  const data = loadData();
  const safeCompanyName = sanitizePlainText(companyName, 120);
  const safeOwnerEmail = sanitizeEmail(ownerEmail);
  const existing = data.partners.find((entry) => normalizeName(entry.companyName) === normalizeName(safeCompanyName));

  if (existing) {
    if (safeOwnerEmail) {
      existing.ownerEmail = safeOwnerEmail;
    }
    saveData(data);
    return existing;
  }

  const entry = {
    id: Date.now(),
    companyName: safeCompanyName,
    ownerEmail: safeOwnerEmail,
    websiteUrl: '',
    details: '',
    paymentConfirmed: false,
    paid: false,
    activeListing: false,
    createdAt: new Date().toISOString()
  };

  data.partners.push(entry);
  saveData(data);
  return entry;
}

function markPartnerPaid(companyName, ownerEmail = '') {
  const data = loadData();
  const safeCompanyName = sanitizePlainText(companyName, 120);
  let partner = data.partners.find((entry) => normalizeName(entry.companyName) === normalizeName(safeCompanyName));

  if (!partner) {
    const created = ensurePartnerRecord(safeCompanyName, ownerEmail);
    if (!created) {
      return null;
    }
    partner = created;
  }

  partner.paid = true;
  partner.activeListing = true;
  partner.paymentConfirmed = true;
  saveData(data);
  return partner;
}

function markAdPaidByAdId(adId, paymentMeta = {}) {
  const data = loadData();
  const ad = data.ads.find((entry) => String(entry.id) === String(adId));

  if (!ad) {
    return null;
  }

  ad.paid = true;
  ad.active = true;
  ad.lastPaymentAt = new Date().toISOString();
  if (paymentMeta.subscriptionId) {
    ad.subscriptionId = sanitizePlainText(paymentMeta.subscriptionId, 120);
  }
  if (paymentMeta.customerId) {
    ad.customerId = sanitizePlainText(paymentMeta.customerId, 120);
  }
  saveData(data);
  return ad;
}

function setAdSubscriptionState(subscriptionId, isActive) {
  const data = loadData();
  const ad = data.ads.find((entry) => String(entry.subscriptionId || '') === String(subscriptionId || ''));
  if (!ad) {
    return null;
  }

  ad.paid = Boolean(isActive);
  ad.active = Boolean(isActive);
  ad.subscriptionStatus = isActive ? 'active' : 'inactive';
  ad.updatedAt = new Date().toISOString();
  saveData(data);
  return ad;
}

function alreadyProcessedEvent(eventId) {
  const data = loadData();
  return data.webhookEvents.includes(eventId);
}

function recordWebhookEvent(eventId) {
  const data = loadData();
  if (!data.webhookEvents.includes(eventId)) {
    data.webhookEvents.push(eventId);
  }
  if (data.webhookEvents.length > 5000) {
    data.webhookEvents = data.webhookEvents.slice(-5000);
  }
  saveData(data);
}

function grantCustomerEntitlement(customerEmail, sourcePlan, subscriptionId = '') {
  const data = loadData();
  const email = sanitizeEmail(customerEmail);
  if (!email) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CUSTOMER_THEME_ENTITLEMENT_DAYS * 24 * 60 * 60 * 1000);
  const existing = data.customerEntitlements.find((entry) => normalizeName(entry.customerEmail) === normalizeName(email));

  const record = {
    customerEmail: email,
    status: 'active',
    sourcePlan: sanitizePlainText(sourcePlan, 80),
    expiresAt: sourcePlan === 'customer-plus' ? null : expiresAt.toISOString(),
    subscriptionId: subscriptionId ? sanitizePlainText(subscriptionId, 120) : '',
    updatedAt: now.toISOString()
  };

  if (existing) {
    Object.assign(existing, record);
  } else {
    data.customerEntitlements.push(record);
  }

  if (subscriptionId) {
    const existingSub = data.customerSubscriptions.find((entry) => String(entry.subscriptionId) === String(subscriptionId));
    if (existingSub) {
      existingSub.customerEmail = email;
      existingSub.status = 'active';
      existingSub.updatedAt = now.toISOString();
    } else {
      data.customerSubscriptions.push({
        subscriptionId: sanitizePlainText(subscriptionId, 120),
        customerEmail: email,
        status: 'active',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
    }
  }

  saveData(data);
  return record;
}

function setCustomerSubscriptionState(subscriptionId, status) {
  const data = loadData();
  const sub = data.customerSubscriptions.find((entry) => String(entry.subscriptionId) === String(subscriptionId || ''));
  if (!sub) {
    return null;
  }

  sub.status = sanitizePlainText(status || 'inactive', 40);
  sub.updatedAt = new Date().toISOString();

  const entitlement = data.customerEntitlements.find((entry) => String(entry.subscriptionId || '') === String(subscriptionId || ''));
  if (entitlement) {
    entitlement.status = status === 'active' ? 'active' : 'inactive';
    entitlement.updatedAt = new Date().toISOString();
  }
  saveData(data);
  return sub;
}

function hasActiveCustomerThemeAccess(customerEmail) {
  if (hasOwnerAccess(customerEmail)) {
    return true;
  }

  const data = loadData();
  const email = sanitizeEmail(customerEmail);
  if (!email) {
    return false;
  }

  const entitlement = data.customerEntitlements.find((entry) => normalizeName(entry.customerEmail) === normalizeName(email));
  if (!entitlement || entitlement.status !== 'active') {
    return false;
  }

  // Theme customisation is a Teyo Plus exclusive feature
  if (entitlement.sourcePlan !== 'customer-plus') {
    return false;
  }

  if (!entitlement.expiresAt) {
    return true;
  }

  return new Date(entitlement.expiresAt).getTime() > Date.now();
}

app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '2mb' }), (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!stripe || !webhookSecret) {
    return res.status(501).json({ success: false, message: 'Stripe webhook secret is not configured.' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

    if (alreadyProcessedEvent(event.id)) {
      return res.json({ received: true, duplicate: true });
    }
    recordWebhookEvent(event.id);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata || {};
      const { plan } = metadata;
      const expectedAmount = plan === 'placement'
        ? PRICING.placement.amount
        : (plan === 'monthly-ad' ? PRICING.monthlyAd.amount : (plan === 'customer-one-time' ? PRICING.customerOneTime.amount : null));
      const paid = session.payment_status === 'paid' || session.status === 'complete';
      const amountMatches = expectedAmount === null || Number(session.amount_total || 0) === expectedAmount;

      if (!paid || !amountMatches) {
        return res.json({ received: true, ignored: true });
      }

      if (plan === 'placement') {
        markPartnerPaid(metadata.companyName || '', metadata.ownerEmail || '');
      } else if (plan === 'monthly-ad') {
        markAdPaidByAdId(metadata.adId || '', {
          subscriptionId: session.subscription || '',
          customerId: session.customer || ''
        });
      } else if (plan === 'customer-one-time') {
        grantCustomerEntitlement(metadata.customerEmail || '', 'customer-one-time');
      } else if (plan === 'customer-plus') {
        grantCustomerEntitlement(metadata.customerEmail || '', 'customer-plus', session.subscription || '');
      }
    } else if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      if (invoice.subscription) {
        setAdSubscriptionState(invoice.subscription, true);
        setCustomerSubscriptionState(invoice.subscription, 'active');
      }
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      if (invoice.subscription) {
        setAdSubscriptionState(invoice.subscription, false);
        setCustomerSubscriptionState(invoice.subscription, 'inactive');
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      setAdSubscriptionState(subscription.id, false);
      setCustomerSubscriptionState(subscription.id, 'inactive');
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

app.use(express.json({ limit: '2mb' }));

app.post('/api/heartbeat', express.json({ limit: '512b' }), (req, res) => {
  const raw = String(req.body?.s || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (raw.length >= 8) {
    const isNew = !_activeSessions.has(raw) && !_seenSessionIds.has(raw);
    _activeSessions.set(raw, Date.now());
    if (isNew) {
      _seenSessionIds.add(raw);
      const d = loadData();
      d.totalVisitors = (d.totalVisitors || 0) + 1;
      saveData(d);
    }
  }
  res.json({ ok: true });
});

app.get('/api/active-viewers', (req, res) => {
  if (!hasOwnerHeader(req)) return res.status(403).json({ error: 'Forbidden' });
  const cutoff = Date.now() - _SESSION_TTL;
  for (const [id, ts] of _activeSessions) {
    if (ts < cutoff) _activeSessions.delete(id);
  }
  res.json({ count: _activeSessions.size });
});

app.get('/api/live-count', (req, res) => {
  const cutoff = Date.now() - _SESSION_TTL;
  for (const [id, ts] of _activeSessions) {
    if (ts < cutoff) _activeSessions.delete(id);
  }
  res.json({ count: _activeSessions.size });
});

app.get('/api/owner/stats', (req, res) => {
  if (!hasOwnerHeader(req)) return res.status(403).json({ error: 'Forbidden' });
  const cutoff = Date.now() - _SESSION_TTL;
  for (const [id, ts] of _activeSessions) {
    if (ts < cutoff) _activeSessions.delete(id);
  }
  const d = loadData();
  const total = d.totalVisitors || 0;
  const rec = getRecommendedPrice(total);
  res.json({
    liveViewers: _activeSessions.size,
    totalVisitors: total,
    currentPriceCents: PRICING.placement.amount,
    recommendedPrice: rec.label,
    recommendedPriceCents: rec.cents,
    priceAdvice: rec.advice
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    storageMode,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/ready', (req, res) => {
  const ownerConfigured = isOwnerConfigured();
  const stripeConfigured = Boolean(validStripeKey);
  const storageReady = Boolean(dbPool || storageMode === 'file');
  const ready = Boolean(stripeConfigured && ownerConfigured && storageReady);

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not-ready',
    stripeConfigured,
    ownerConfigured,
    storageMode,
    storageReady
  });
});

app.post('/api/admin/verify', adminLimiter, requireAdmin, (req, res) => {
  res.json({ success: true });
});

app.post('/api/owner/verify', adminLimiter, (req, res) => {
  if (!isOwnerConfigured()) {
    return res.status(503).json({ success: false, message: 'Owner protection is not configured.' });
  }

  const providedEmail = sanitizeEmail(req.body.ownerEmail);
  const providedKey = String(req.body.ownerKey || '').trim();

  if (!hasOwnerKeyAccess(providedEmail, providedKey)) {
    return res.status(401).json({ success: false, message: 'Unauthorized owner request.' });
  }

  res.json({ success: true, owner: true });
});

app.post('/api/partner', (req, res) => {
  const companyName = sanitizePlainText(req.body.companyName, 120);
  const ownerEmail = sanitizeEmail(req.body.ownerEmail);
  const websiteUrl = sanitizePlainText(req.body.websiteUrl, 2048);
  const details = sanitizePlainText(req.body.details, 4000);
  const paymentConfirmed = req.body.paymentConfirmed;
  const ownerKey = String(req.body.ownerKey || '').trim();
  const normalizedWebsite = normalizeWebsite(websiteUrl);

  if (!companyName || !ownerEmail || !normalizedWebsite || !isBusinessOwnerSubmission(companyName, normalizedWebsite)) {
    return res.status(400).json({
      success: false,
      message: 'Only real company or business owners with a valid company website can request placement on Teyo.ca.'
    });
  }

  const data = loadData();
  const entry = {
    id: Date.now(),
    companyName,
    ownerEmail,
    websiteUrl: normalizedWebsite,
    details: details || '',
    paymentConfirmed: paymentConfirmed === true || paymentConfirmed === 'true',
    paid: false,
    activeListing: false,
    createdAt: new Date().toISOString()
  };

  if (hasOwnerKeyAccess(ownerEmail, ownerKey)) {
    entry.paymentConfirmed = true;
    entry.paid = true;
    entry.activeListing = true;
  }

  data.partners.push(entry);
  saveData(data);

  res.json({
    success: true,
    message: 'Thanks — your placement request has been received. Once your one-time $249 activation fee is confirmed, your company can add unlimited products to Teyo.ca.'
  });
});

app.get('/api/partners', (req, res) => {
  const data = loadData();
  if (hasOwnerHeader(req)) {
    return res.json(data.partners);
  }
  res.json(data.partners.map(serializePublicPartner));
});

app.post('/api/partners/:id/approve', requireAdmin, (req, res) => {
  const data = loadData();
  const partner = data.partners.find((entry) => String(entry.id) === String(req.params.id));

  if (!partner) {
    return res.status(404).json({ success: false, message: 'Partner not found.' });
  }

  partner.paid = true;
  partner.activeListing = true;
  partner.paymentConfirmed = true;
  saveData(data);

  res.json({ success: true, partner });
});

app.post('/api/ads', (req, res) => {
  const companyName = sanitizePlainText(req.body.companyName, 120);
  const ownerEmail = sanitizeEmail(req.body.ownerEmail);
  const ownerKey = String(req.body.ownerKey || '').trim();
  const headline = sanitizePlainText(req.body.headline, 180);
  const description = sanitizePlainText(req.body.description, 2000);
  const link = sanitizePlainText(req.body.link, 2048);
  const creative = sanitizeCreative(req.body.creative || {});
  const normalizedLink = normalizeWebsite(link);

  if (!companyName || !ownerEmail || !headline || !normalizedLink || !isBusinessOwnerSubmission(companyName, normalizedLink)) {
    return res.status(400).json({ success: false, message: 'Only approved company or business owners with a valid business website can submit ads.' });
  }

  const data = loadData();
  const entry = {
    id: Date.now(),
    companyName,
    ownerEmail,
    headline,
    description,
    link: normalizedLink,
    creative,
    paid: false,
    active: false,
    subscriptionStatus: 'inactive',
    subscriptionId: '',
    customerId: '',
    createdAt: new Date().toISOString()
  };

  if (hasOwnerKeyAccess(ownerEmail, ownerKey)) {
    entry.paid = true;
    entry.active = true;
    entry.subscriptionStatus = 'active';
  }

  data.ads.push(entry);
  saveData(data);

  res.json({
    success: true,
    message: 'Your creative is pending review. Submit payment to activate this ad after approval.',
    adId: entry.id
  });
});

app.get('/api/ads', (req, res) => {
  const data = loadData();
  if (hasOwnerHeader(req)) {
    return res.json(data.ads);
  }
  res.json(data.ads.map(serializePublicAd));
});

app.post('/api/products', (req, res) => {
  const productName = sanitizePlainText(req.body.productName, 180);
  const companyName = sanitizePlainText(req.body.companyName, 120);
  const ownerEmail = sanitizeEmail(req.body.ownerEmail);
  const ownerKey = String(req.body.ownerKey || '').trim();
  const category = sanitizePlainText(req.body.category, 80);
  const price = sanitizePlainText(req.body.price, 80);
  const websiteUrl = sanitizePlainText(req.body.websiteUrl, 2048);
  const description = sanitizePlainText(req.body.description, 3000);
  const imageUrl = normalizeWebsite(req.body.imageUrl || '');
  const stockStatus = sanitizePlainText(req.body.stockStatus, 120);
  const safetyNote = sanitizePlainText(req.body.safetyNote, 500);
  const stores = Array.isArray(req.body.stores) ? req.body.stores : String(req.body.stores || '').split(',').map((value) => value.trim()).filter(Boolean);
  const sizeOptions = sanitizeSizeOptions(req.body.sizeOptions);
  const sizeInventory = sanitizeSizeInventory(req.body.sizeInventory, stockStatus);
  const rating = sanitizePlainText(req.body.rating, 40);
  const reviewCount = sanitizePlainText(req.body.reviewCount, 40);
  const verifiedSeller = req.body.verifiedSeller;
  const verificationStatus = sanitizePlainText(req.body.verificationStatus, 80);
  const trustSummary = sanitizePlainText(req.body.trustSummary, 500);

  const normalizedWebsiteUrl = normalizeWebsite(websiteUrl);

  if (!productName || !companyName || !price || !normalizedWebsiteUrl || !isBusinessOwnerSubmission(companyName, normalizedWebsiteUrl)) {
    return res.status(400).json({ success: false, message: 'Only real company or business owners with a valid company website can submit products.' });
  }

  const data = loadData();
  const partnerMatch = data.partners.find((partner) => normalizeName(partner.companyName) === normalizeName(companyName));
  const ownerOverride = hasOwnerKeyAccess(ownerEmail, ownerKey);

  if (ownerOverride) {
    const ownerPartner = ensurePartnerRecord(companyName, ownerEmail);
    ownerPartner.paid = true;
    ownerPartner.activeListing = true;
    ownerPartner.paymentConfirmed = true;
  }

  if (!ownerOverride && (!partnerMatch || !partnerMatch.paid || !partnerMatch.activeListing || !partnerMatch.paymentConfirmed)) {
    return res.status(403).json({
      success: false,
      message: 'Your company must first complete the one-time $249 placement activation and receive approval before adding products. After that, you can add unlimited products.'
    });
  }

  const entry = {
    id: Date.now(),
    productName,
    companyName,
    ownerEmail,
    category: category || 'general',
    price,
    websiteUrl: normalizedWebsiteUrl,
    description: description || '',
    imageUrl: imageUrl || '',
    stockStatus: stockStatus || 'Pending verification',
    safetyNote: safetyNote || '',
    stores: stores.map((value) => sanitizePlainText(value, 120)).slice(0, 20),
    sizeOptions: sizeOptions.length > 0 ? sizeOptions : Array.from(new Set(sizeInventory.map((record) => sanitizeSizeToken(record.size)).filter(Boolean))).slice(0, 40),
    sizeInventory,
    rating: rating || '',
    reviewCount: reviewCount || '',
    verifiedSeller: verifiedSeller === true || verifiedSeller === 'true',
    verificationStatus: verificationStatus || (verifiedSeller === true || verifiedSeller === 'true' ? 'Verified seller' : 'Pending manual review'),
    trustSummary: trustSummary || '',
    approved: false,
    visible: false,
    createdAt: new Date().toISOString()
  };

  data.products.push(entry);
  saveData(data);

  res.json({
    success: true,
    message: 'Your product submission has been received. It will stay hidden until it is reviewed and approved.'
  });
});

app.get('/api/products', (req, res) => {
  const data = loadData();
  if (hasOwnerHeader(req)) {
    return res.json(data.products);
  }
  res.json(data.products.map(serializePublicProduct));
});

app.post('/api/products/:id/approve', requireAdmin, (req, res) => {
  const data = loadData();
  const product = data.products.find((entry) => String(entry.id) === String(req.params.id));

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  product.approved = true;
  product.visible = true;
  saveData(data);

  res.json({ success: true, product });
});

app.post('/api/products/:id/inventory', (req, res) => {
  if (!hasPrivilegedAccess(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized inventory update request.' });
  }

  const data = loadData();
  const product = data.products.find((entry) => String(entry.id) === String(req.params.id));

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const stockStatus = sanitizePlainText(req.body.stockStatus, 120);
  const stores = Array.isArray(req.body.stores)
    ? req.body.stores
    : String(req.body.stores || '').split(',').map((value) => value.trim()).filter(Boolean);
  const sizeOptions = sanitizeSizeOptions(req.body.sizeOptions);
  const sizeInventory = sanitizeSizeInventory(req.body.sizeInventory, stockStatus || product.stockStatus || '');

  product.stockStatus = stockStatus || product.stockStatus || 'Pending verification';
  product.stores = stores.map((value) => sanitizePlainText(value, 120)).filter(Boolean).slice(0, 20);
  product.sizeOptions = sizeOptions.length > 0
    ? sizeOptions
    : Array.from(new Set(sizeInventory.map((record) => sanitizeSizeToken(record.size)).filter(Boolean))).slice(0, 40);
  product.sizeInventory = sizeInventory;
  product.updatedAt = new Date().toISOString();
  saveData(data);

  res.json({ success: true, product });
});

app.post('/api/ads/:id/approve', requireAdmin, (req, res) => {
  const data = loadData();
  const ad = data.ads.find((entry) => String(entry.id) === String(req.params.id));

  if (!ad) {
    return res.status(404).json({ success: false, message: 'Ad not found.' });
  }

  ad.paid = true;
  ad.active = true;
  saveData(data);

  res.json({ success: true, ad });
});

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(501).json({
      success: false,
      message: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable real checkout.'
    });
  }

  try {
    const { plan = 'monthly-ad', companyName = '', ownerEmail = '', adId = '' } = req.body;
    const normalizedPlan = plan === 'placement' ? 'placement' : (plan === 'monthly-ad' ? 'monthly-ad' : '');
    const safeCompanyName = sanitizePlainText(companyName, 120);
    const safeOwnerEmail = sanitizeEmail(ownerEmail);
    const safeAdId = sanitizePlainText(adId, 40);

    if (!normalizedPlan) {
      return res.status(400).json({ success: false, message: 'Invalid checkout request.' });
    }

    const mode = normalizedPlan === 'placement' ? 'payment' : 'subscription';
    const successBase = appBaseUrl || `${req.protocol}://${req.get('host')}`;
    const lineItems = [];
    let metadata = { plan: normalizedPlan };
    let subscriptionData;

    if (normalizedPlan === 'placement') {
      if (!safeCompanyName) {
        return res.status(400).json({ success: false, message: 'Company name is required for placement checkout.' });
      }
      const existingPartner = ensurePartnerRecord(safeCompanyName, safeOwnerEmail);
      if (existingPartner.paid && existingPartner.activeListing) {
        return res.json({
          success: true,
          message: 'Your one-time placement is already active. You can add unlimited products now.',
          url: null,
          sessionId: null
        });
      }
      metadata = { plan: normalizedPlan, companyName: safeCompanyName, ownerEmail: safeOwnerEmail };
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Teyo Premium Listing',
            description: PRICING.placement.description
          },
          unit_amount: PRICING.placement.amount
        },
        quantity: 1
      });
    } else {
      const data = loadData();
      const ad = data.ads.find((entry) => String(entry.id) === String(safeAdId));
      if (!ad) {
        return res.status(400).json({ success: false, message: 'Submit your ad first, then start monthly checkout.' });
      }

      metadata = {
        plan: normalizedPlan,
        adId: String(ad.id),
        companyName: sanitizePlainText(ad.companyName, 120),
        ownerEmail: sanitizeEmail(ad.ownerEmail)
      };
      subscriptionData = { metadata };

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Teyo Monthly Ad Placement',
            description: PRICING.monthlyAd.description
          },
          unit_amount: PRICING.monthlyAd.amount,
          recurring: { interval: 'month' }
        },
        quantity: 1
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata,
      subscription_data: subscriptionData,
      success_url: `${successBase}/partners.html?checkout=success`,
      cancel_url: `${successBase}/partners.html?checkout=cancelled`
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create checkout session.' });
  }
});

app.post('/api/create-customer-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(501).json({ success: false, message: 'Stripe is not configured yet.' });
  }

  try {
    const customerEmail = sanitizeEmail(req.body.customerEmail);
    const plan = String(req.body.plan || '').trim();
    const normalizedPlan = plan === 'customer-one-time' ? 'customer-one-time' : (plan === 'customer-plus' ? 'customer-plus' : '');

    if (!normalizedPlan || !customerEmail) {
      return res.status(400).json({ success: false, message: 'Valid email and plan are required.' });
    }

    const successBase = appBaseUrl || `${req.protocol}://${req.get('host')}`;
    const isSubscription = normalizedPlan === 'customer-plus';
    const metadata = { plan: normalizedPlan, customerEmail };
    const lineItems = isSubscription
      ? [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Teyo Plus Launch Access',
              description: 'Launch offer charge for your first 30 days of member access.'
            },
            unit_amount: PRICING.customerPlus.trialAmount
          },
          quantity: 1
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Teyo Plus Membership',
              description: PRICING.customerPlus.description
            },
            unit_amount: PRICING.customerPlus.recurringAmount,
            recurring: { interval: 'month' }
          },
          quantity: 1
        }
      ]
      : [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Teyo Smart Checkout Pass',
            description: PRICING.customerOneTime.description
          },
          unit_amount: PRICING.customerOneTime.amount
        },
        quantity: 1
      }];

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      metadata,
      subscription_data: isSubscription ? { metadata, trial_period_days: 30 } : undefined,
      line_items: lineItems,
      success_url: `${successBase}/marketplace.html?customer_checkout=success&plan=${normalizedPlan}`,
      cancel_url: `${successBase}/marketplace.html?customer_checkout=cancelled`
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create customer checkout session.' });
  }
});

app.post('/api/customer/theme-access', (req, res) => {
  const customerEmail = sanitizeEmail(req.body.customerEmail);
  const ownerKey = String(req.body.ownerKey || '').trim();
  if (!customerEmail) {
    return res.status(400).json({ success: false, message: 'A valid customer email is required.' });
  }

  if (hasOwnerKeyAccess(customerEmail, ownerKey)) {
    return res.json({ success: true, owner: true, message: 'Owner access verified. Private theme controls are now unlocked.' });
  }

  if (!hasActiveCustomerThemeAccess(customerEmail)) {
    return res.status(403).json({ success: false, message: 'Private personalization requires an active Teyo Plus subscription. The one-time pass does not include this feature.' });
  }

  res.json({ success: true, message: 'Paid access verified. Private theme controls are now unlocked.' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/:fileName', (req, res, next) => {
  const fileName = String(req.params.fileName || '').trim();

  if (!PUBLIC_FILE_ALLOWLIST.has(fileName)) {
    return next();
  }

  res.sendFile(path.join(__dirname, fileName));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'Route not found' });
  }

  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

async function startServer() {
  try {
    app.listen(port, () => {
      console.log(`Teyo server running on http://localhost:${port} using ${storageMode} storage`);
    });
    await initializeStorage();
  } catch (error) {
    console.error('Failed to initialize storage. Server aborted.', error.message);
    process.exit(1);
  }
}

startServer();