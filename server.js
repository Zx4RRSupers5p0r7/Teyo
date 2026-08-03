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
const nodemailer = require('nodemailer');

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
  if (total >= 10000) return { label: '$299', cents: 29900, advice: 'Over 10,000 visitors — the platform can support a higher listing price.' };
  if (total >= 5000)  return { label: '$149', cents: 14900, advice: 'Strong traction — consider raising to $149.' };
  if (total >= 2000)  return { label: '$79',  cents: 7900,  advice: 'Momentum is building — test a raise to $79.' };
  if (total >= 500)   return { label: '$49',  cents: 4900,  advice: 'Early traffic is coming in — $49 could be a good next step.' };
  return { label: 'Free', cents: 0, advice: 'One-time activation is currently free to help more companies join early.' };
}
const databaseUrl = String(process.env.DATABASE_URL || '').trim();
const validStripeKey = /^sk_(live|test)_[A-Za-z0-9]+$/.test(stripeSecretKey);
const stripe = validStripeKey ? new Stripe(stripeSecretKey) : null;
const PRICING = {
  placement: { amount: 0, description: 'Teyo one-time company setup fee is $0 with AI catalog onboarding.' },
  monthlyAd: { amount: 1500, description: 'Teyo monthly sponsor ad placement for $15/month.' },
  customerOneTime: { amount: 499, description: 'Teyo customer smart checkout pass (one-time).' },
  customerPlus: { trialAmount: 199, recurringAmount: 999, description: 'Teyo Plus customer plan with launch pricing.' }
};
const STORE_SYNC_INTERVAL_MS = Math.max(60 * 1000, Number.parseInt(process.env.STORE_SYNC_INTERVAL_MS || '300000', 10) || (5 * 60 * 1000));
const STORE_SYNC_TIMEOUT_MS = Math.max(3000, Number.parseInt(process.env.STORE_SYNC_TIMEOUT_MS || '12000', 10) || 12000);
const STORE_SYNC_MAX_PRODUCTS = 250;
const CUSTOMER_THEME_ENTITLEMENT_DAYS = 30;
const PUBLIC_FILE_ALLOWLIST = new Set([
  'index.html',
  'marketplace.html',
  'partners.html',
  'admin.html',
  'inventory.html',
  'contact.html',
  'favicon.ico',
  'favicon-48x48.png',
  'styles.css',
  'script.js',
  'favicon.svg',
  'teyo-watermark.svg',
  'teyo-watermark-secondary.svg'
]);

let inMemoryData = null;
let writeQueue = Promise.resolve();
let storageMode = 'file';
let dbPool = null;
const storeSyncLocks = new Set();

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

function normalizeHexColorToken(value) {
  const token = String(value || '').trim();
  const shortMatch = token.match(/^#([a-f0-9]{3})$/i);
  if (shortMatch) {
    const p = shortMatch[1].toLowerCase();
    return `#${p[0]}${p[0]}${p[1]}${p[1]}${p[2]}${p[2]}`;
  }

  const fullMatch = token.match(/^#([a-f0-9]{6})$/i);
  if (!fullMatch) {
    return '';
  }

  return `#${fullMatch[1].toLowerCase()}`;
}

function rgbToHex(red, green, blue) {
  const clampColor = (value) => Math.max(0, Math.min(255, Number.parseInt(value, 10) || 0));
  const toHex = (value) => clampColor(value).toString(16).padStart(2, '0');
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function parseRgbColorToken(value) {
  const token = String(value || '').trim();
  const match = token.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) {
    return '';
  }

  const parts = match[1].split(',').map((part) => part.trim());
  if (parts.length < 3) {
    return '';
  }

  const red = Number.parseFloat(parts[0]);
  const green = Number.parseFloat(parts[1]);
  const blue = Number.parseFloat(parts[2]);
  if (!Number.isFinite(red) || !Number.isFinite(green) || !Number.isFinite(blue)) {
    return '';
  }

  return rgbToHex(red, green, blue);
}

function hexToRgb(hexColor) {
  const match = String(hexColor || '').trim().match(/^#([a-f0-9]{6})$/i);
  if (!match) {
    return [255, 255, 255];
  }

  const hex = match[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ];
}

function colorLuminanceScore(hexColor) {
  const [red, green, blue] = hexToRgb(hexColor);
  return ((red * 299) + (green * 587) + (blue * 114)) / 1000;
}

function shiftHexColor(hexColor, amount) {
  const [red, green, blue] = hexToRgb(hexColor);
  const clampColor = (value) => Math.max(0, Math.min(255, value));
  return rgbToHex(clampColor(red + amount), clampColor(green + amount), clampColor(blue + amount));
}

function extractWebsiteColorCandidates(html) {
  const content = String(html || '');
  const hexMatches = content.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
  const rgbMatches = content.match(/rgba?\([^\)]+\)/gi) || [];

  const counts = new Map();
  hexMatches.forEach((match) => {
    const normalized = normalizeHexColorToken(match);
    if (!normalized) {
      return;
    }
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });

  rgbMatches.forEach((match) => {
    const normalized = parseRgbColorToken(match);
    if (!normalized) {
      return;
    }
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([color, hits]) => ({ color, hits, luminance: colorLuminanceScore(color) }))
    .filter((entry) => entry.luminance > 20 && entry.luminance < 245)
    .sort((left, right) => right.hits - left.hits)
    .slice(0, 12);
}

function buildWebsiteThemePalette(colorCandidates) {
  if (!Array.isArray(colorCandidates) || colorCandidates.length === 0) {
    return null;
  }

  const primary = colorCandidates[0].color;
  const secondary = colorCandidates[1] ? colorCandidates[1].color : shiftHexColor(primary, -16);
  const tertiary = colorCandidates[2] ? colorCandidates[2].color : shiftHexColor(primary, 26);
  const brightest = colorCandidates
    .slice()
    .sort((left, right) => right.luminance - left.luminance)[0].color;
  const darkest = colorCandidates
    .slice()
    .sort((left, right) => left.luminance - right.luminance)[0].color;

  return {
    auraColor: shiftHexColor(primary, 18),
    ringColor: secondary,
    starColor: shiftHexColor(brightest, 8),
    coreColor: shiftHexColor(brightest, 20),
    sparkleColor: tertiary,
    fogColor: shiftHexColor(darkest, -8)
  };
}

async function fetchTextWithTimeout(urlValue, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(urlValue, {
      method: 'GET',
      headers: {
        'Accept': 'text/html, text/css;q=0.9, */*;q=0.8',
        'User-Agent': 'TeyoColorAnalyzer/1.0'
      },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}
function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatPrice(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  const normalized = raw.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return '';
  }
  return `$${parsed.toFixed(parsed >= 100 ? 0 : 2).replace(/\.00$/, '')}`;
}

function normalizeFeedFormat(value) {
  const raw = sanitizePlainText(value, 40).toLowerCase();
  if (raw === 'shopify-json' || raw === 'generic-json') {
    return raw;
  }
  return 'auto';
}

function normalizePhysicalStoreFlag(value) {
  const raw = String(value || '').trim().toLowerCase();
  return raw === 'yes' || raw === 'true' || raw === '1';
}

function createDefaultStoreSyncConfig(sourceUrl = '') {
  const normalizedSourceUrl = isSafeHttpUrl(sourceUrl) ? sourceUrl : '';
  return {
    enabled: Boolean(normalizedSourceUrl),
    format: 'auto',
    sourceUrl: normalizedSourceUrl,
    lastSyncAt: '',
    lastSuccessAt: '',
    lastError: '',
    lastImportedCount: 0,
    lastChangedCount: 0
  };
}

function getPartnerStoreSyncConfig(partner) {
  const existing = (partner && typeof partner.storeSync === 'object' && partner.storeSync) ? partner.storeSync : null;
  const fallbackSource = normalizeWebsite(partner?.storeCatalogUrl || partner?.websiteUrl || '');
  const defaults = createDefaultStoreSyncConfig(fallbackSource);
  if (!existing) {
    return defaults;
  }

  return {
    enabled: Boolean(existing.enabled) && Boolean(isSafeHttpUrl(existing.sourceUrl || fallbackSource)),
    format: normalizeFeedFormat(existing.format),
    sourceUrl: isSafeHttpUrl(existing.sourceUrl || fallbackSource) ? normalizeWebsite(existing.sourceUrl || fallbackSource) : '',
    lastSyncAt: sanitizePlainText(existing.lastSyncAt, 40),
    lastSuccessAt: sanitizePlainText(existing.lastSuccessAt, 40),
    lastError: sanitizePlainText(existing.lastError, 400),
    lastImportedCount: Number.isInteger(existing.lastImportedCount) ? existing.lastImportedCount : 0,
    lastChangedCount: Number.isInteger(existing.lastChangedCount) ? existing.lastChangedCount : 0
  };
}

function buildStoreSyncAttemptUrls(sourceUrl) {
  const attempts = [];
  const normalized = normalizeWebsite(sourceUrl);
  if (!isSafeHttpUrl(normalized)) {
    return attempts;
  }

  attempts.push(normalized);
  try {
    const parsed = new URL(normalized);
    if (parsed.pathname === '/' || parsed.pathname === '') {
      attempts.push(`${parsed.origin}/products.json?limit=250`);
      attempts.push(`${parsed.origin}/collections/all/products.json?limit=250`);
    }
  } catch (error) {
    return attempts;
  }

  return Array.from(new Set(attempts));
}

async function fetchJsonWithTimeout(urlValue, timeoutMs = STORE_SYNC_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(urlValue, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeShopifyProducts(payload, partner, sourceUrl) {
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const websiteBase = normalizeWebsite(partner?.websiteUrl || sourceUrl);
  const sourceHost = (() => {
    try {
      return new URL(websiteBase).origin;
    } catch (error) {
      return '';
    }
  })();
  const onlineStoreName = `${sanitizePlainText(partner?.companyName, 120) || 'Store'} Online`;
  const hasPhysicalStore = normalizePhysicalStoreFlag(partner?.hasPhysicalStore);
  const physicalStoreLocation = sanitizePlainText(partner?.storeLocation, 220);
  const physicalStoreName = sanitizePlainText(partner?.companyName, 120) ? `${sanitizePlainText(partner?.companyName, 120)} Store` : 'Physical store';

  return products.map((product) => {
    const title = sanitizePlainText(product?.title, 180);
    if (!title) {
      return null;
    }

    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const firstVariant = variants[0] || {};
    const handle = sanitizePlainText(product?.handle, 180);
    const productPath = handle ? `/products/${handle}` : '';
    const websiteUrl = (sourceHost && productPath) ? `${sourceHost}${productPath}` : normalizeWebsite(sourceUrl);
    const imageUrl = normalizeWebsite(product?.image?.src || product?.images?.[0]?.src || '');
    const price = formatPrice(firstVariant?.price || product?.price || '');
    const sizeOptions = Array.from(new Set(
      variants
        .map((variant) => sanitizeSizeToken(variant?.option1 || ''))
        .filter(Boolean)
    )).slice(0, 40);
    const sizeInventory = variants
      .map((variant) => {
        const size = sanitizeSizeToken(variant?.option1 || '');
        if (!size) {
          return null;
        }
        const available = Boolean(variant?.available);
        return {
          storeName: onlineStoreName,
          size,
          stockStatus: available ? 'In stock' : 'Out of stock',
          restockDate: ''
        };
      })
      .filter(Boolean)
      .slice(0, 500);

    const inStock = variants.some((variant) => Boolean(variant?.available));
    const externalId = sanitizePlainText(
      product?.id || product?.admin_graphql_api_id || `${title}-${websiteUrl}`,
      200
    );

    const stores = [onlineStoreName];
    if (hasPhysicalStore && physicalStoreLocation) {
      stores.push(`${physicalStoreName}|In stock`);
    }

    return {
      sourceProductId: externalId,
      productName: title,
      category: sanitizePlainText(product?.product_type || 'general', 80) || 'general',
      price: price || '$0',
      websiteUrl: websiteUrl || normalizeWebsite(sourceUrl),
      description: sanitizePlainText(stripHtml(product?.body_html || product?.description || ''), 3000),
      imageUrl: isSafeHttpUrl(imageUrl) ? imageUrl : '',
      stockStatus: inStock ? 'In stock' : 'Out of stock',
      stores,
      sizeOptions,
      sizeInventory,
      safetyNote: sanitizePlainText(stripHtml(product?.safetyNote || product?.safety || ''), 500),
      trustSummary: sanitizePlainText(stripHtml(product?.trustSummary || product?.brandPromise || ''), 500),
      rating: sanitizePlainText(product?.rating || product?.ratingAverage || '', 40),
      reviewCount: sanitizePlainText(product?.reviewCount || product?.reviews || '', 40),
      verificationStatus: sanitizePlainText(product?.verificationStatus || '', 80),
      verifiedSeller: product?.verifiedSeller === true || product?.verified === true,
      hasPhysicalStore,
      physicalStoreLocation
    };
  }).filter(Boolean);
}

function normalizeGenericProducts(payload, sourceUrl, partner = null) {
  const list = Array.isArray(payload)
    ? payload
    : (Array.isArray(payload?.products) ? payload.products : (Array.isArray(payload?.items) ? payload.items : []));
  const websiteFallback = normalizeWebsite(sourceUrl);
  const onlineStoreName = 'Online store';
  const hasPhysicalStore = normalizePhysicalStoreFlag(partner?.hasPhysicalStore);
  const physicalStoreLocation = sanitizePlainText(partner?.storeLocation, 220);

  return list.map((product) => {
    const productName = sanitizePlainText(
      product?.productName || product?.title || product?.name || product?.label,
      180
    );
    if (!productName) {
      return null;
    }

    const websiteUrl = normalizeWebsite(product?.websiteUrl || product?.url || product?.link || websiteFallback);
    const imageUrl = normalizeWebsite(product?.imageUrl || product?.image || product?.thumbnail || '');
    const price = formatPrice(product?.price || product?.amount || product?.cost || '');
    const sizeOptions = sanitizeSizeOptions(product?.sizeOptions || product?.sizes || []);
    const sizeInventory = sanitizeSizeInventory(product?.sizeInventory || [], product?.stockStatus || product?.status || 'In stock');
    const stockStatus = sanitizePlainText(product?.stockStatus || product?.status || (sizeInventory.length ? '' : 'In stock'), 120)
      || (sizeInventory.some((entry) => String(entry.stockStatus || '').toLowerCase().includes('in')) ? 'In stock' : 'Out of stock');
    const stores = Array.isArray(product?.stores)
      ? product.stores.map((value) => sanitizePlainText(value, 120)).filter(Boolean).slice(0, 20)
      : [onlineStoreName];

    const externalId = sanitizePlainText(product?.id || product?.sku || `${productName}-${websiteUrl}`, 200);
    return {
      sourceProductId: externalId,
      productName,
      category: sanitizePlainText(product?.category || 'general', 80) || 'general',
      price: price || '$0',
      websiteUrl: websiteUrl || websiteFallback,
      description: sanitizePlainText(stripHtml(product?.description || product?.summary || ''), 3000),
      imageUrl: isSafeHttpUrl(imageUrl) ? imageUrl : '',
      stockStatus,
      stores,
      sizeOptions,
      sizeInventory,
      safetyNote: sanitizePlainText(stripHtml(product?.safetyNote || product?.safety || ''), 500),
      trustSummary: sanitizePlainText(stripHtml(product?.trustSummary || product?.brandPromise || ''), 500),
      rating: sanitizePlainText(product?.rating || product?.ratingAverage || '', 40),
      reviewCount: sanitizePlainText(product?.reviewCount || product?.reviews || '', 40),
      verificationStatus: sanitizePlainText(product?.verificationStatus || '', 80),
      verifiedSeller: product?.verifiedSeller === true || product?.verified === true
      ,
      hasPhysicalStore,
      physicalStoreLocation
    };
  }).filter(Boolean);
}

function normalizeStoreFeedProducts(payload, partner, sourceUrl, format = 'auto') {
  const normalizedFormat = normalizeFeedFormat(format);
  if (normalizedFormat === 'shopify-json') {
    return normalizeShopifyProducts(payload, partner, sourceUrl);
  }
  if (normalizedFormat === 'generic-json') {
    return normalizeGenericProducts(payload, sourceUrl, partner);
  }

  if (Array.isArray(payload?.products) && payload.products.some((product) => product && (product.variants || product.handle || product.body_html))) {
    return normalizeShopifyProducts(payload, partner, sourceUrl);
  }

  return normalizeGenericProducts(payload, sourceUrl, partner);
}

function buildStoreSyncProductKey(companyName, ownerEmail, sourceProductId, websiteUrl, productName) {
  const companyKey = normalizeName(companyName);
  const ownerKey = normalizeName(ownerEmail);
  const sourceKey = sanitizePlainText(sourceProductId, 200) || sanitizePlainText(websiteUrl, 300) || sanitizePlainText(productName, 180);
  return `${companyKey}::${ownerKey}::${normalizeName(sourceKey)}`;
}

function isPartnerActive(partner) {
  return Boolean(partner && partner.paid && partner.activeListing && partner.paymentConfirmed && getPartnerRequestStatus(partner) === 'approved');
}

function applyStoreSyncProducts(data, partner, importedProducts) {
  const companyKey = normalizeName(partner.companyName);
  const ownerKey = normalizeName(partner.ownerEmail);
  const existingAutoProducts = data.products.filter((entry) =>
    normalizeName(entry.companyName) === companyKey
    && normalizeName(entry.ownerEmail) === ownerKey
    && entry.sourceType === 'store-sync'
  );

  const existingByKey = new Map();
  existingAutoProducts.forEach((entry) => {
    const key = buildStoreSyncProductKey(
      entry.companyName,
      entry.ownerEmail,
      entry.sourceProductId || '',
      entry.websiteUrl || '',
      entry.productName || ''
    );
    existingByKey.set(key, entry);
  });

  let changedCount = 0;
  let createdCount = 0;
  const nowIso = new Date().toISOString();
  const visibleByDefault = isPartnerActive(partner);
  const incomingKeys = new Set();
  let idCounter = 0;

  importedProducts.slice(0, STORE_SYNC_MAX_PRODUCTS).forEach((product) => {
    const key = buildStoreSyncProductKey(
      partner.companyName,
      partner.ownerEmail,
      product.sourceProductId || '',
      product.websiteUrl || '',
      product.productName || ''
    );
    incomingKeys.add(key);
    const current = existingByKey.get(key);
    const resolvedSafetyNote = sanitizePlainText(product.safetyNote || current?.safetyNote || '', 500);
    const resolvedTrustSummary = sanitizePlainText(
      product.trustSummary || current?.trustSummary || 'Automatically synced from company catalog feed.',
      500
    );
    const resolvedRating = sanitizePlainText(product.rating || current?.rating || '', 40);
    const resolvedReviewCount = sanitizePlainText(product.reviewCount || current?.reviewCount || '', 40);
    const resolvedVerificationStatus = sanitizePlainText(
      product.verificationStatus
      || current?.verificationStatus
      || (product.verifiedSeller ? 'Verified seller' : 'Auto-synced listing'),
      80
    );
    const resolvedVerifiedSeller = Boolean(product.verifiedSeller || current?.verifiedSeller);
    const nextValues = {
      productName: sanitizePlainText(product.productName, 180),
      companyName: sanitizePlainText(partner.companyName, 120),
      ownerEmail: sanitizeEmail(partner.ownerEmail),
      category: sanitizePlainText(product.category || 'general', 80) || 'general',
      price: sanitizePlainText(product.price || '$0', 80) || '$0',
      websiteUrl: normalizeWebsite(product.websiteUrl || partner.websiteUrl || ''),
      description: sanitizePlainText(product.description || '', 3000),
      imageUrl: isSafeHttpUrl(product.imageUrl) ? product.imageUrl : '',
      stockStatus: sanitizePlainText(product.stockStatus || 'In stock', 120),
      safetyNote: resolvedSafetyNote,
      stores: Array.isArray(product.stores) ? product.stores.map((value) => sanitizePlainText(value, 120)).filter(Boolean).slice(0, 20) : [],
      sizeOptions: sanitizeSizeOptions(product.sizeOptions || []),
      sizeInventory: sanitizeSizeInventory(product.sizeInventory || [], product.stockStatus || 'In stock'),
      rating: resolvedRating,
      reviewCount: resolvedReviewCount,
      verifiedSeller: resolvedVerifiedSeller,
      verificationStatus: resolvedVerificationStatus,
      trustSummary: resolvedTrustSummary,
      hasPhysicalStore: Boolean(product.hasPhysicalStore),
      physicalStoreLocation: sanitizePlainText(product.physicalStoreLocation || '', 220),
      approved: visibleByDefault,
      visible: visibleByDefault,
      sourceType: 'store-sync',
      sourceProductId: sanitizePlainText(product.sourceProductId, 200),
      sourceUpdatedAt: nowIso,
      updatedAt: nowIso
    };

    if (current) {
      const before = JSON.stringify({
        productName: current.productName,
        category: current.category,
        price: current.price,
        websiteUrl: current.websiteUrl,
        description: current.description,
        imageUrl: current.imageUrl,
        stockStatus: current.stockStatus,
        safetyNote: current.safetyNote,
        trustSummary: current.trustSummary,
        rating: current.rating,
        reviewCount: current.reviewCount,
        verifiedSeller: current.verifiedSeller,
        verificationStatus: current.verificationStatus,
        stores: current.stores,
        sizeOptions: current.sizeOptions,
        sizeInventory: current.sizeInventory,
        approved: current.approved,
        visible: current.visible
      });
      Object.assign(current, nextValues);
      const after = JSON.stringify({
        productName: current.productName,
        category: current.category,
        price: current.price,
        websiteUrl: current.websiteUrl,
        description: current.description,
        imageUrl: current.imageUrl,
        stockStatus: current.stockStatus,
        safetyNote: current.safetyNote,
        trustSummary: current.trustSummary,
        rating: current.rating,
        reviewCount: current.reviewCount,
        verifiedSeller: current.verifiedSeller,
        verificationStatus: current.verificationStatus,
        stores: current.stores,
        sizeOptions: current.sizeOptions,
        sizeInventory: current.sizeInventory,
        approved: current.approved,
        visible: current.visible
      });
      if (before !== after) {
        changedCount += 1;
      }
      return;
    }

    idCounter += 1;
    data.products.push({
      id: Date.now() + idCounter,
      createdAt: nowIso,
      ...nextValues
    });
    createdCount += 1;
    changedCount += 1;
  });

  existingAutoProducts.forEach((entry) => {
    const key = buildStoreSyncProductKey(
      entry.companyName,
      entry.ownerEmail,
      entry.sourceProductId || '',
      entry.websiteUrl || '',
      entry.productName || ''
    );
    if (incomingKeys.has(key)) {
      return;
    }
    if (entry.visible || entry.approved) {
      changedCount += 1;
    }
    entry.visible = false;
    entry.approved = false;
    entry.archivedAt = nowIso;
    entry.updatedAt = nowIso;
  });

  return {
    importedCount: importedProducts.length,
    createdCount,
    changedCount
  };
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

function generateCompanyAccessKey() {
  return crypto.randomBytes(16).toString('hex').slice(0, 24);
}

function findLatestPartner(data, companyName, ownerEmail = '') {
  const normalizedCompany = normalizeName(companyName);
  const normalizedOwner = normalizeName(ownerEmail);
  const matches = data.partners
    .filter((entry) => normalizeName(entry.companyName) === normalizedCompany)
    .filter((entry) => !normalizedOwner || normalizeName(entry.ownerEmail) === normalizedOwner)
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());

  return matches[0] || null;
}

function hasCompanyKeyAccess(companyName, ownerEmail, companyKey, options = {}) {
  const data = loadData();
  const partner = findLatestPartner(data, companyName, ownerEmail);
  if (!partner) {
    return false;
  }

  const storedKey = String(partner.companyAccessKey || '').trim();
  if (!storedKey || !secureEquals(String(companyKey || '').trim(), storedKey)) {
    return false;
  }

  if (options.requireActiveListing && (!partner.paid || !partner.activeListing || !partner.paymentConfirmed)) {
    return false;
  }

  return true;
}

function getCompanyHeaderAuth(req, options = {}) {
  const companyName = sanitizePlainText(req.headers['x-company-name'], 120);
  const ownerEmail = sanitizeEmail(req.headers['x-company-email']);
  const companyKey = sanitizePlainText(req.headers['x-company-key'], 80);
  if (!companyName || !ownerEmail || !companyKey) {
    return null;
  }

  if (!hasCompanyKeyAccess(companyName, ownerEmail, companyKey, options)) {
    return null;
  }

  return {
    companyName,
    ownerEmail
  };
}

function resolveCompanyPartnerContext(req, options = {}) {
  const data = loadData();
  const ownerAccess = hasOwnerHeader(req);

  if (ownerAccess) {
    const companyName = sanitizePlainText(req.body?.companyName || req.query?.companyName, 120);
    const ownerEmailFromRequest = sanitizeEmail(req.body?.ownerEmail || req.query?.ownerEmail);
    if (!companyName) {
      return { data, partner: null, message: 'Company name is required for owner-managed sync requests.' };
    }
    const partner = findLatestPartner(data, companyName, ownerEmailFromRequest)
      || findLatestPartner(data, companyName);
    if (!partner) {
      return { data, partner: null, message: 'No partner listing was found for that company.' };
    }
    if (options.requireActiveListing && !isPartnerActive(partner)) {
      return { data, partner: null, message: 'This company listing must be approved before sync is available.' };
    }
    return { data, partner, message: '' };
  }

  const companyAuth = getCompanyHeaderAuth(req, { requireActiveListing: options.requireActiveListing });
  if (!companyAuth) {
    return { data, partner: null, message: 'Company access is required for this request.' };
  }

  const partner = findLatestPartner(data, companyAuth.companyName, companyAuth.ownerEmail);
  if (!partner) {
    return { data, partner: null, message: 'No matching company listing was found for this session.' };
  }
  if (options.requireActiveListing && !isPartnerActive(partner)) {
    return { data, partner: null, message: 'This company listing must be approved before sync is available.' };
  }

  return { data, partner, message: '' };
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
    customerSubscriptions: [],
    partnerAnalytics: [],
    partnerReminderLog: []
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
    partnerAnalytics: Array.isArray(parsed.partnerAnalytics) ? parsed.partnerAnalytics : [],
    partnerReminderLog: Array.isArray(parsed.partnerReminderLog) ? parsed.partnerReminderLog : [],
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

function getPartnerRequestStatus(entry) {
  const explicit = String(entry?.requestStatus || '').trim().toLowerCase();
  if (explicit === 'approved' || explicit === 'denied' || explicit === 'banned' || explicit === 'pending') {
    return explicit;
  }

  if (entry?.bannedAt) {
    return 'banned';
  }
  if (entry?.deniedAt) {
    return 'denied';
  }
  if (entry?.approvedAt || (entry?.activeListing && entry?.paid && entry?.paymentConfirmed)) {
    return 'approved';
  }
  return 'pending';
}

function getPartnerClaimStatus(entry) {
  const explicit = String(entry?.claimStatus || '').trim().toLowerCase();
  if (explicit === 'unclaimed' || explicit === 'claimed') {
    return explicit;
  }
  if (!sanitizeEmail(entry?.ownerEmail) && !entry?.activeListing) {
    return 'unclaimed';
  }
  return 'claimed';
}

function isClaimablePartner(entry) {
  return getPartnerClaimStatus(entry) === 'unclaimed' && getPartnerRequestStatus(entry) !== 'banned';
}

function serializePublicPartner(entry) {
  return {
    id: entry.id,
    companyName: entry.companyName,
    websiteUrl: entry.websiteUrl,
    storeCatalogUrl: entry.storeCatalogUrl || '',
    storeNiche: entry.storeNiche || '',
    details: entry.details || '',
    paid: Boolean(entry.paid),
    activeListing: Boolean(entry.activeListing),
    claimable: isClaimablePartner(entry),
    claimStatus: getPartnerClaimStatus(entry),
    requestStatus: getPartnerRequestStatus(entry),
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
    slug: buildProductSlug(entry),
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
    hasPhysicalStore: Boolean(entry.hasPhysicalStore),
    physicalStoreLocation: entry.physicalStoreLocation || '',
    approved: Boolean(entry.approved),
    visible: Boolean(entry.visible),
    createdAt: entry.createdAt
  };
}

function isClaimedPartnerProfile(entry) {
  const claimState = String(entry?.claimStatus || '').toLowerCase();
  return getPartnerRequestStatus(entry) !== 'banned'
    && Boolean(entry?.ownerEmail || claimState === 'claimed' || entry?.activeListing || entry?.paymentConfirmed || entry?.approvedAt);
}

function buildPartnerUpgradeHook(summary, isClaimed) {
  if (!summary?.shouldTrigger) {
    return null;
  }

  let tierId = 'growth';
  let tierLabel = 'Growth';
  let monthlyPrice = 29;
  let features = [
    'Verified badge',
    'Priority search ranking',
    'Profile analytics dashboard'
  ];

  if (summary.clickCount >= 3 || summary.viewCount >= 12) {
    tierId = 'scale';
    tierLabel = 'Scale';
    monthlyPrice = 99;
    features = [
      'Featured placement',
      'Priority search ranking',
      'Advanced analytics dashboard',
      'Automated customer messaging'
    ];
  } else if (summary.clickCount >= 1 || summary.viewCount >= 7) {
    tierId = 'performance';
    tierLabel = 'Performance';
    monthlyPrice = 59;
    features = [
      'Featured placement',
      'Traffic-source analytics',
      'Lead follow-up tools',
      'Conversion tracking'
    ];
  }

  const triggerReason = summary.clickCount > 0
    ? `${summary.clickCount} shoppers already clicked to claim or engage with this profile.`
    : `${summary.viewCount} shoppers already viewed this profile.`;

  return {
    partnerId: summary.id,
    companyName: summary.companyName,
    claimState: isClaimed ? 'claimed' : 'unclaimed',
    tierId,
    tierLabel,
    monthlyPrice,
    triggerReason,
    nextAction: isClaimed
      ? `Invite ${summary.companyName} to unlock ${tierLabel} tools.`
      : `Invite ${summary.companyName} to claim the profile first, then unlock ${tierLabel}.`,
    features
  };
}

function buildPartnerAnalyticsSummary(data) {
  const analytics = Array.isArray(data.partnerAnalytics) ? data.partnerAnalytics : [];
  const reminderLog = Array.isArray(data.partnerReminderLog) ? data.partnerReminderLog : [];
  const partnerSummaries = data.partners
    .filter((entry) => isClaimablePartner(entry))
    .map((entry) => {
      const events = analytics.filter((event) => String(event.partnerId) === String(entry.id));
      const viewCount = events.filter((event) => event.eventType === 'profile-view').length;
      const clickCount = events.filter((event) => event.eventType === 'claim-click').length;
      const lastEvent = events.slice().sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())[0] || null;
      const shouldTrigger = viewCount >= 3 || clickCount > 0;
      const claimed = isClaimedPartnerProfile(entry);
      const upgradeHook = buildPartnerUpgradeHook({
        id: entry.id,
        companyName: entry.companyName,
        viewCount,
        clickCount,
        shouldTrigger
      }, claimed);
      return {
        id: entry.id,
        companyName: entry.companyName,
        websiteUrl: entry.websiteUrl || '',
        storeNiche: entry.storeNiche || '',
        viewCount,
        clickCount,
        lastEventAt: lastEvent?.createdAt || '',
        shouldTrigger,
        urgency: clickCount > 0 ? 'high' : (viewCount >= 5 ? 'medium' : 'low'),
        claimed,
        upgradeHook
      };
    })
    .sort((left, right) => {
      if (right.viewCount !== left.viewCount) {
        return right.viewCount - left.viewCount;
      }
      if (right.clickCount !== left.clickCount) {
        return right.clickCount - left.clickCount;
      }
      return new Date(right.lastEventAt || 0).getTime() - new Date(left.lastEventAt || 0).getTime();
    });

  const recentEvents = analytics
    .slice()
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime())
    .slice(0, 10)
    .map((event) => ({
      id: event.id,
      partnerId: event.partnerId,
      companyName: event.companyName || '',
      eventType: event.eventType,
      createdAt: event.createdAt,
      source: event.source || 'profile'
    }));

  const reminders = partnerSummaries
    .filter((entry) => entry.shouldTrigger)
    .map((entry) => ({
      id: `reminder-${entry.id}`,
      partnerId: entry.id,
      companyName: entry.companyName,
      websiteUrl: entry.websiteUrl || '',
      storeNiche: entry.storeNiche || '',
      reason: entry.clickCount > 0
        ? 'Claim CTA clicked by a visitor'
        : `${entry.viewCount} profile views already happened`,
      suggestedAction: entry.clickCount > 0
        ? 'Send a follow-up invite to claim the profile and finish onboarding.'
        : 'Send a reminder that this profile is attracting real attention.',
      urgency: entry.urgency,
      viewCount: entry.viewCount,
      clickCount: entry.clickCount,
      lastEventAt: entry.lastEventAt
    }));

  const sourceBreakdown = Object.entries(
    analytics.reduce((accumulator, event) => {
      const source = sanitizePlainText(event.source || 'partners-page', 80) || 'partners-page';
      const record = accumulator[source] || { source, profileViews: 0, claimClicks: 0 };
      if (event.eventType === 'profile-view') {
        record.profileViews += 1;
      } else if (event.eventType === 'claim-click') {
        record.claimClicks += 1;
      }
      accumulator[source] = record;
      return accumulator;
    }, {})
  )
    .map(([, entry]) => ({
      source: entry.source,
      profileViews: Number(entry.profileViews || 0),
      claimClicks: Number(entry.claimClicks || 0),
      conversionRate: entry.profileViews > 0 ? Number(entry.claimClicks || 0) / Number(entry.profileViews || 1) : 0
    }))
    .map((entry) => {
      let quality = 'emerging';
      if (entry.claimClicks >= 2 || entry.conversionRate >= 0.25) {
        quality = 'high intent';
      } else if (entry.claimClicks >= 1 || entry.profileViews >= 4 || entry.conversionRate >= 0.1) {
        quality = 'qualified';
      }
      return {
        ...entry,
        quality
      };
    })
    .sort((left, right) => {
      if (right.claimClicks !== left.claimClicks) {
        return right.claimClicks - left.claimClicks;
      }
      if (right.profileViews !== left.profileViews) {
        return right.profileViews - left.profileViews;
      }
      return left.source.localeCompare(right.source);
    });

  const claimedProfiles = data.partners.filter((entry) => isClaimedPartnerProfile(entry)).length;
  const upgradeHooks = partnerSummaries
    .map((entry) => entry.upgradeHook)
    .filter(Boolean)
    .sort((left, right) => right.monthlyPrice - left.monthlyPrice || left.companyName.localeCompare(right.companyName));

  const totalProfileViews = analytics.filter((event) => event.eventType === 'profile-view').length;
  const totalClaimClicks = analytics.filter((event) => event.eventType === 'claim-click').length;
  const deliverySummary = {
    totalSent: reminderLog.filter((entry) => String(entry.status || '').toLowerCase() === 'sent').length,
    totalQueued: reminderLog.filter((entry) => String(entry.status || '').toLowerCase() === 'queued').length,
    recent: reminderLog.slice(-6).map((entry) => ({
      partnerId: entry.partnerId,
      companyName: entry.companyName || '',
      status: entry.status || 'queued',
      sentAt: entry.sentAt || ''
    }))
  };

  return {
    totalViews: totalProfileViews,
    totalClaimClicks: totalClaimClicks,
    conversionRate: totalProfileViews > 0 ? totalClaimClicks / totalProfileViews : 0,
    claimedProfiles,
    upgradeSummary: {
      readyCount: upgradeHooks.length,
      potentialMonthlyRevenue: upgradeHooks.reduce((sum, entry) => sum + Number(entry.monthlyPrice || 0), 0)
    },
    triggerProfiles: partnerSummaries.filter((entry) => entry.shouldTrigger),
    profiles: partnerSummaries,
    recentEvents,
    reminders,
    sourceBreakdown,
    deliverySummary,
    upgradeHooks
  };
}

function getReminderTransporter() {
  if (global.__teyoReminderTransporter) {
    return global.__teyoReminderTransporter;
  }

  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

  if (!host || !user || !pass) {
    global.__teyoReminderTransporter = null;
    return null;
  }

  global.__teyoReminderTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  return global.__teyoReminderTransporter;
}

async function deliverPartnerReminderEmail(partner, reminder) {
  const recipient = sanitizeEmail(partner?.ownerEmail || '');
  if (!recipient) {
    return { delivered: false, status: 'queued', recipient: '', reason: 'No owner email on file.' };
  }

  const transporter = getReminderTransporter();
  if (!transporter) {
    return { delivered: false, status: 'queued', recipient, reason: 'SMTP delivery is not configured. Reminder queued for later.' };
  }

  const fromAddress = sanitizeEmail(process.env.SMTP_FROM_EMAIL || process.env.NOTIFICATION_FROM_EMAIL || process.env.OWNER_EMAIL || '') || 'noreply@teyo.ca';
  const subject = `Teyo reminder: ${sanitizePlainText(reminder.companyName || 'Your company profile', 120)}`;
  const text = [
    `Hi there,`,
    '',
    `Teyo noticed that your company profile is getting attention.`,
    `Reason: ${sanitizePlainText(reminder.reason || 'Keep your profile live and up to date.', 500)}`,
    `Suggested action: ${sanitizePlainText(reminder.suggestedAction || 'Claim your profile and finish onboarding.', 500)}`,
    '',
    `Visit https://teyo.ca/partners to claim or update your profile.`
  ].join('\n');
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.55;">
      <h3 style="margin-bottom: 8px;">Teyo reminder</h3>
      <p>Hi there,</p>
      <p>Teyo noticed that your company profile is getting attention.</p>
      <p><strong>Why this matters:</strong> ${sanitizeHtml(sanitizePlainText(reminder.reason || 'Keep your profile live and up to date.', 500))}</p>
      <p><strong>Suggested action:</strong> ${sanitizeHtml(sanitizePlainText(reminder.suggestedAction || 'Claim your profile and finish onboarding.', 500))}</p>
      <p>Visit <a href="https://teyo.ca/partners" target="_blank" rel="noreferrer">https://teyo.ca/partners</a> to claim or update your profile.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `Teyo <${fromAddress}>`,
    to: recipient,
    subject,
    text,
    html
  });

  return { delivered: true, status: 'sent', recipient, reason: 'Email delivered.' };
}

function findClaimablePartner(data, companyName, websiteUrl = '') {
  const normalizedCompany = normalizeName(companyName);
  const normalizedWebsite = normalizeWebsite(websiteUrl);
  const matches = data.partners
    .filter((entry) => isClaimablePartner(entry))
    .filter((entry) => normalizeName(entry.companyName) === normalizedCompany || (normalizedWebsite && normalizeWebsite(entry.websiteUrl || '') === normalizedWebsite))
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
  return matches[0] || null;
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
    if (!existing.companyAccessKey) {
      existing.companyAccessKey = generateCompanyAccessKey();
    }
    existing.storeSync = getPartnerStoreSyncConfig(existing);
    saveData(data);
    return existing;
  }

  const entry = {
    id: Date.now(),
    companyName: safeCompanyName,
    ownerEmail: safeOwnerEmail,
    websiteUrl: '',
    storeCatalogUrl: '',
    details: '',
    storeNiche: '',
    paymentConfirmed: false,
    paid: false,
    activeListing: false,
    requestStatus: 'pending',
    claimStatus: safeOwnerEmail ? 'claimed' : 'unclaimed',
    storeSync: createDefaultStoreSyncConfig(''),
    companyAccessKey: generateCompanyAccessKey(),
    createdAt: new Date().toISOString()
  };

  data.partners.push(entry);
  saveData(data);
  return entry;
}

function markPartnerPaid(companyName, ownerEmail = '') {
  const data = loadData();
  const safeCompanyName = sanitizePlainText(companyName, 120);
  const safeOwnerEmail = sanitizeEmail(ownerEmail);
  let partner = findLatestPartner(data, safeCompanyName, safeOwnerEmail)
    || findLatestPartner(data, safeCompanyName);

  if (!partner) {
    const created = ensurePartnerRecord(safeCompanyName, safeOwnerEmail);
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

async function runPartnerStoreSync(partner, data, options = {}) {
  const lockKey = `${normalizeName(partner.companyName)}::${normalizeName(partner.ownerEmail)}`;
  if (storeSyncLocks.has(lockKey)) {
    return { success: false, message: 'A sync is already running for this company.', importedCount: 0, changedCount: 0 };
  }
  storeSyncLocks.add(lockKey);
  try {
    const nowIso = new Date().toISOString();
    const sync = getPartnerStoreSyncConfig(partner);
    partner.storeSync = sync;
    partner.storeCatalogUrl = sync.sourceUrl || partner.storeCatalogUrl || '';
    partner.storeSync.lastSyncAt = nowIso;

    if (!sync.enabled || !sync.sourceUrl) {
      partner.storeSync.lastError = 'Auto-sync is disabled or missing a source URL.';
      partner.storeSync.lastImportedCount = 0;
      partner.storeSync.lastChangedCount = 0;
      return { success: false, message: partner.storeSync.lastError, importedCount: 0, changedCount: 0 };
    }

    if (!isPartnerActive(partner)) {
      partner.storeSync.lastError = 'Partner listing must be approved before auto-sync can run.';
      partner.storeSync.lastImportedCount = 0;
      partner.storeSync.lastChangedCount = 0;
      return { success: false, message: partner.storeSync.lastError, importedCount: 0, changedCount: 0 };
    }

    const attempts = buildStoreSyncAttemptUrls(sync.sourceUrl);
    if (!attempts.length) {
      partner.storeSync.lastError = 'Invalid store URL. Use a valid http(s) URL.';
      partner.storeSync.lastImportedCount = 0;
      partner.storeSync.lastChangedCount = 0;
      return { success: false, message: partner.storeSync.lastError, importedCount: 0, changedCount: 0 };
    }

    let payload = null;
    let selectedUrl = '';
    let lastError = 'Store source could not be reached.';
    for (const candidate of attempts) {
      try {
        payload = await fetchJsonWithTimeout(candidate);
        selectedUrl = candidate;
        break;
      } catch (error) {
        lastError = `${candidate}: ${sanitizePlainText(error.message, 240) || 'fetch failed'}`;
      }
    }

    if (!payload) {
      partner.storeSync.lastError = lastError;
      partner.storeSync.lastImportedCount = 0;
      partner.storeSync.lastChangedCount = 0;
      return { success: false, message: lastError, importedCount: 0, changedCount: 0 };
    }

    const importedProducts = normalizeStoreFeedProducts(payload, partner, selectedUrl, sync.format)
      .filter((entry) => entry && entry.productName && entry.websiteUrl)
      .slice(0, STORE_SYNC_MAX_PRODUCTS);

    if (!importedProducts.length) {
      partner.storeSync.lastError = 'No supported products were found in the provided feed.';
      partner.storeSync.lastImportedCount = 0;
      partner.storeSync.lastChangedCount = 0;
      return { success: false, message: partner.storeSync.lastError, importedCount: 0, changedCount: 0 };
    }

    const result = applyStoreSyncProducts(data, partner, importedProducts);
    partner.storeSync.lastSuccessAt = nowIso;
    partner.storeSync.lastError = '';
    partner.storeSync.lastImportedCount = result.importedCount;
    partner.storeSync.lastChangedCount = result.changedCount;
    partner.storeSync.sourceUrl = selectedUrl;
    partner.storeCatalogUrl = selectedUrl;
    return {
      success: true,
      message: options.reason === 'manual'
        ? 'Store sync completed successfully.'
        : 'Store sync refreshed successfully.',
      importedCount: result.importedCount,
      changedCount: result.changedCount
    };
  } finally {
    storeSyncLocks.delete(lockKey);
  }
}

let storeSyncRunning = false;
async function runScheduledStoreSync() {
  if (storeSyncRunning) {
    return;
  }
  storeSyncRunning = true;
  try {
    const data = loadData();
    const eligiblePartners = data.partners.filter((partner) => {
      const sync = getPartnerStoreSyncConfig(partner);
      return Boolean(sync.enabled && sync.sourceUrl && isPartnerActive(partner));
    });

    for (const partner of eligiblePartners) {
      await runPartnerStoreSync(partner, data, { reason: 'scheduled' });
    }

    if (eligiblePartners.length > 0) {
      saveData(data);
    }
  } finally {
    storeSyncRunning = false;
  }
}

function scheduleStoreSyncWorker() {
  setTimeout(() => {
    runScheduledStoreSync().catch((error) => {
      console.warn(`Store sync warm-up failed: ${error.message}`);
    });
  }, 20000);

  setInterval(() => {
    runScheduledStoreSync().catch((error) => {
      console.warn(`Scheduled store sync failed: ${error.message}`);
    });
  }, STORE_SYNC_INTERVAL_MS);
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


app.post('/api/theme/website-colors', express.json({ limit: '40kb' }), async (req, res) => {
  const websiteUrl = normalizeWebsite(req.body?.websiteUrl || '');
  if (!isSafeHttpUrl(websiteUrl)) {
    return res.status(400).json({ success: false, message: 'Enter a valid website URL for automatic color analysis.' });
  }

  try {
    const html = await fetchTextWithTimeout(websiteUrl, STORE_SYNC_TIMEOUT_MS);
    const colors = extractWebsiteColorCandidates(html);
    const palette = buildWebsiteThemePalette(colors);
    if (!palette) {
      return res.status(422).json({ success: false, message: 'No usable brand colors were found on that website.' });
    }

    return res.json({
      success: true,
      source: websiteUrl,
      palette,
      sampleColors: colors.slice(0, 6).map((entry) => entry.color)
    });
  } catch (error) {
    return res.status(502).json({ success: false, message: `Website color analysis failed: ${error.message}` });
  }
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

app.post('/api/company/verify', adminLimiter, (req, res) => {
  const companyName = sanitizePlainText(req.body.companyName, 120);
  const providedEmail = sanitizeEmail(req.body.ownerEmail);
  const companyKey = sanitizePlainText(req.body.companyKey, 80);

  if (!companyName || !providedEmail || !companyKey) {
    return res.status(400).json({ success: false, message: 'Enter company name, owner email, and company access key.' });
  }

  const data = loadData();
  const partner = findLatestPartner(data, companyName, providedEmail);
  if (!partner) {
    return res.status(404).json({ success: false, message: 'No matching company listing was found for that company and email.' });
  }

  if (!partner.companyAccessKey) {
    return res.status(403).json({ success: false, message: 'Company access is not configured yet for this listing. Contact platform support.' });
  }

  if (!secureEquals(companyKey, partner.companyAccessKey)) {
    return res.status(401).json({ success: false, message: 'Invalid company access key.' });
  }

  if (!partner.paid || !partner.activeListing || !partner.paymentConfirmed) {
    return res.status(403).json({ success: false, message: 'Your company listing is not active yet. Complete one-click setup to unlock inventory access.' });
  }

  return res.json({ success: true, company: true });
});

app.get('/api/company/store-sync', adminLimiter, (req, res) => {
  const { data, partner, message } = resolveCompanyPartnerContext(req, { requireActiveListing: true });
  if (!partner) {
    return res.status(401).json({ success: false, message });
  }

  const sync = getPartnerStoreSyncConfig(partner);
  const totalAutoProducts = data.products.filter((entry) =>
    normalizeName(entry.companyName) === normalizeName(partner.companyName)
    && normalizeName(entry.ownerEmail) === normalizeName(partner.ownerEmail)
    && entry.sourceType === 'store-sync'
  ).length;

  return res.json({
    success: true,
    sync: {
      enabled: sync.enabled,
      format: sync.format,
      sourceUrl: sync.sourceUrl,
      lastSyncAt: sync.lastSyncAt,
      lastSuccessAt: sync.lastSuccessAt,
      lastError: sync.lastError,
      lastImportedCount: sync.lastImportedCount,
      lastChangedCount: sync.lastChangedCount
    },
    totalAutoProducts
  });
});

app.post('/api/company/store-sync', adminLimiter, async (req, res) => {
  const { data, partner, message } = resolveCompanyPartnerContext(req, { requireActiveListing: true });
  if (!partner) {
    return res.status(401).json({ success: false, message });
  }

  const sourceUrlRaw = sanitizePlainText(req.body.sourceUrl, 2048);
  const normalizedSourceUrl = normalizeWebsite(sourceUrlRaw || partner.storeCatalogUrl || partner.websiteUrl || '');
  const enabled = req.body.enabled === true || req.body.enabled === 'true';
  const format = normalizeFeedFormat(req.body.format);
  if (enabled && !isSafeHttpUrl(normalizedSourceUrl)) {
    return res.status(400).json({ success: false, message: 'Enter a valid store URL or product feed URL.' });
  }

  partner.storeSync = {
    ...getPartnerStoreSyncConfig(partner),
    enabled,
    format,
    sourceUrl: enabled ? normalizedSourceUrl : '',
    lastError: enabled ? '' : 'Auto-sync is disabled.',
    lastImportedCount: enabled ? partner.storeSync?.lastImportedCount || 0 : 0,
    lastChangedCount: enabled ? partner.storeSync?.lastChangedCount || 0 : 0
  };
  partner.storeCatalogUrl = partner.storeSync.sourceUrl;

  let syncResult = null;
  if (partner.storeSync.enabled && partner.storeSync.sourceUrl) {
    syncResult = await runPartnerStoreSync(partner, data, { reason: 'manual' });
    if (!syncResult.success) {
      saveData(data);
      return res.status(400).json({
        success: false,
        message: syncResult.message,
        sync: getPartnerStoreSyncConfig(partner)
      });
    }
  }

  saveData(data);
  return res.json({
    success: true,
    message: syncResult?.message || 'Store sync settings saved.',
    sync: getPartnerStoreSyncConfig(partner),
    importedCount: syncResult?.importedCount || 0,
    changedCount: syncResult?.changedCount || 0
  });
});

app.post('/api/company/store-sync/run', adminLimiter, async (req, res) => {
  const { data, partner, message } = resolveCompanyPartnerContext(req, { requireActiveListing: true });
  if (!partner) {
    return res.status(401).json({ success: false, message });
  }

  const sync = getPartnerStoreSyncConfig(partner);
  if (!sync.enabled || !sync.sourceUrl) {
    return res.status(400).json({ success: false, message: 'Enable auto-sync and set a valid source URL first.' });
  }

  const result = await runPartnerStoreSync(partner, data, { reason: 'manual' });
  saveData(data);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message,
      sync: getPartnerStoreSyncConfig(partner)
    });
  }

  return res.json({
    success: true,
    message: result.message,
    importedCount: result.importedCount,
    changedCount: result.changedCount,
    sync: getPartnerStoreSyncConfig(partner)
  });
});

app.post('/api/partners/seed', requireAdmin, (req, res) => {
  const companyName = sanitizePlainText(req.body.companyName, 120);
  const websiteUrl = sanitizePlainText(req.body.websiteUrl, 2048);
  const storeNiche = sanitizePlainText(req.body.storeNiche, 120);
  const details = sanitizePlainText(req.body.details, 4000);
  const normalizedWebsite = normalizeWebsite(websiteUrl);

  if (!companyName || !normalizedWebsite || !isBusinessOwnerSubmission(companyName, normalizedWebsite)) {
    return res.status(400).json({ success: false, message: 'Enter a real business name and valid business website before creating a claimable profile.' });
  }

  const data = loadData();
  const existingClaimable = findClaimablePartner(data, companyName, normalizedWebsite);
  if (existingClaimable) {
    existingClaimable.companyName = companyName;
    existingClaimable.websiteUrl = normalizedWebsite;
    existingClaimable.storeNiche = storeNiche || existingClaimable.storeNiche || '';
    existingClaimable.details = details || existingClaimable.details || '';
    saveData(data);
    return res.json({ success: true, message: `${companyName} is already live as a claimable business profile.`, partner: existingClaimable });
  }

  const activeMatch = findLatestPartner(data, companyName);
  if (activeMatch && !isClaimablePartner(activeMatch)) {
    return res.status(409).json({ success: false, message: 'A claimed or active listing already exists for this business.' });
  }

  const entry = {
    id: Date.now(),
    companyName,
    ownerEmail: '',
    websiteUrl: normalizedWebsite,
    storeCatalogUrl: '',
    details: details || '',
    storeNiche: storeNiche || '',
    hasPhysicalStore: false,
    storeLocation: '',
    paymentConfirmed: false,
    paid: false,
    activeListing: false,
    requestStatus: 'pending',
    claimStatus: 'unclaimed',
    storeSync: createDefaultStoreSyncConfig(''),
    companyAccessKey: generateCompanyAccessKey(),
    createdAt: new Date().toISOString()
  };

  data.partners.push(entry);
  saveData(data);
  return res.json({ success: true, message: `${companyName} is now live as a claimable business profile.`, partner: entry });
});

app.get('/api/partners/analytics', requireAdmin, (req, res) => {
  const data = loadData();
  return res.json({ success: true, analytics: buildPartnerAnalyticsSummary(data) });
});

app.post('/api/partners/analytics/send-reminders', requireAdmin, async (req, res) => {
  const data = loadData();
  const requestedPartnerId = String(req.body?.partnerId || '').trim();
  const analytics = buildPartnerAnalyticsSummary(data);
  const reminders = analytics.reminders.filter((entry) => {
    if (!requestedPartnerId) {
      return true;
    }
    return String(entry.partnerId) === requestedPartnerId;
  });

  if (!reminders.length) {
    return res.json({ success: true, deliveredCount: 0, reminders: [], analytics: buildPartnerAnalyticsSummary(data) });
  }

  const results = [];
  for (const reminder of reminders) {
    const partner = data.partners.find((entry) => String(entry.id) === String(reminder.partnerId));
    if (!partner) {
      continue;
    }

    const alreadyDelivered = data.partnerReminderLog.some((entry) => {
      return String(entry.partnerId) === String(partner.id)
        && String(entry.reminderId || '') === String(reminder.id || '')
        && String(entry.status || '').toLowerCase() === 'sent';
    });

    const outcome = alreadyDelivered
      ? { delivered: true, status: 'sent', recipient: sanitizeEmail(partner.ownerEmail || ''), reason: 'Already sent recently.' }
      : await deliverPartnerReminderEmail(partner, reminder);

    data.partnerReminderLog.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      partnerId: partner.id,
      reminderId: reminder.id,
      companyName: partner.companyName || reminder.companyName || '',
      ownerEmail: sanitizeEmail(partner.ownerEmail || ''),
      status: outcome.status || 'queued',
      sentAt: new Date().toISOString(),
      reason: outcome.reason || ''
    });

    results.push({
      partnerId: partner.id,
      companyName: partner.companyName || reminder.companyName || '',
      recipient: outcome.recipient || '',
      status: outcome.status || 'queued',
      reason: outcome.reason || ''
    });
  }

  saveData(data);
  return res.json({ success: true, deliveredCount: results.filter((entry) => entry.status === 'sent').length, reminders: results, analytics: buildPartnerAnalyticsSummary(data) });
});

app.post('/api/partners/:id/interaction', (req, res) => {
  const partnerId = sanitizePlainText(req.params.id, 80);
  const eventType = sanitizePlainText(req.body?.eventType || 'profile-view', 40);
  const source = sanitizePlainText(req.body?.source || 'profile', 60);

  if (!partnerId) {
    return res.status(400).json({ success: false, message: 'A partner profile id is required.' });
  }

  if (!['profile-view', 'claim-click'].includes(eventType)) {
    return res.status(400).json({ success: false, message: 'Unsupported partner interaction.' });
  }

  const data = loadData();
  const partner = data.partners.find((entry) => String(entry.id) === partnerId);
  if (!partner) {
    return res.status(404).json({ success: false, message: 'Partner profile not found.' });
  }

  const entry = {
    id: `${eventType}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    partnerId: partner.id,
    companyName: partner.companyName,
    eventType,
    source,
    createdAt: new Date().toISOString()
  };

  data.partnerAnalytics.push(entry);
  if (data.partnerAnalytics.length > 3000) {
    data.partnerAnalytics = data.partnerAnalytics.slice(-3000);
  }
  saveData(data);

  return res.json({ success: true, analytics: buildPartnerAnalyticsSummary(data), event: entry });
});

app.post('/api/partner', async (req, res) => {
  const companyName = sanitizePlainText(req.body.companyName, 120);
  const ownerEmail = sanitizeEmail(req.body.ownerEmail);
  const websiteUrl = sanitizePlainText(req.body.websiteUrl, 2048);
  const storeCatalogUrl = sanitizePlainText(req.body.storeCatalogUrl, 2048);
  const details = sanitizePlainText(req.body.details, 4000);
  const storeNiche = sanitizePlainText(req.body.storeNiche, 120);
  const hasPhysicalStore = normalizePhysicalStoreFlag(req.body.hasPhysicalStore);
  const storeLocation = sanitizePlainText(req.body.storeLocation, 220);
  const ownerKey = String(req.body.ownerKey || '').trim();
  const normalizedWebsite = normalizeWebsite(websiteUrl);
  const normalizedStoreCatalogUrl = normalizeWebsite(storeCatalogUrl || normalizedWebsite);

  if (!companyName || !ownerEmail || !normalizedWebsite || !isBusinessOwnerSubmission(companyName, normalizedWebsite)) {
    return res.status(400).json({
      success: false,
      message: 'Only real company or business owners with a valid company website can request placement on Teyo.ca.'
    });
  }

  const data = loadData();
  const claimableMatch = findClaimablePartner(data, companyName, normalizedWebsite);
  const nowIso = new Date().toISOString();
  const entry = claimableMatch || {
    id: Date.now(),
    companyAccessKey: generateCompanyAccessKey(),
    createdAt: nowIso
  };

  entry.companyName = companyName;
  entry.ownerEmail = ownerEmail;
  entry.websiteUrl = normalizedWebsite;
  entry.storeCatalogUrl = isSafeHttpUrl(normalizedStoreCatalogUrl) ? normalizedStoreCatalogUrl : '';
  entry.details = details || entry.details || '';
  entry.storeNiche = storeNiche || entry.storeNiche || '';
  entry.hasPhysicalStore = hasPhysicalStore;
  entry.storeLocation = hasPhysicalStore ? storeLocation : '';
  entry.paymentConfirmed = true;
  entry.paid = true;
  entry.activeListing = true;
  entry.requestStatus = 'approved';
  entry.claimStatus = 'claimed';
  entry.storeSync = createDefaultStoreSyncConfig(isSafeHttpUrl(normalizedStoreCatalogUrl) ? normalizedStoreCatalogUrl : '');
  entry.approvedAt = nowIso;
  entry.claimedAt = nowIso;

  if (!claimableMatch) {
    data.partners.push(entry);
  }

  let syncResult = null;
  if (entry.storeSync?.enabled && entry.storeSync?.sourceUrl) {
    syncResult = await runPartnerStoreSync(entry, data, { reason: hasOwnerKeyAccess(ownerEmail, ownerKey) ? 'owner-override' : 'auto-setup' });
  }
  saveData(data);

  res.json({
    success: true,
    message: syncResult?.success
      ? `${claimableMatch ? 'Profile claimed and store setup complete.' : 'Store setup complete.'} Imported ${syncResult.importedCount} products and updated ${syncResult.changedCount}.`
      : (claimableMatch
        ? 'Profile claimed. Your listing is live and automatic product sync is enabled.'
        : 'Store setup complete. Your listing is live and automatic product sync is enabled.'),
    companyAccessKey: entry.companyAccessKey,
    importedCount: syncResult?.importedCount || 0,
    changedCount: syncResult?.changedCount || 0,
    syncWarning: syncResult && !syncResult.success ? syncResult.message : ''
  });
});

app.get('/api/partners', (req, res) => {
  const data = loadData();
  if (hasOwnerHeader(req)) {
    return res.json(data.partners);
  }
  res.json(data.partners.map(serializePublicPartner));
});

app.post('/api/partners/:id/approve', requireAdmin, async (req, res) => {
  const data = loadData();
  const partner = data.partners.find((entry) => String(entry.id) === String(req.params.id));

  if (!partner) {
    return res.status(404).json({ success: false, message: 'Partner not found.' });
  }

  partner.paid = true;
  partner.activeListing = true;
  partner.paymentConfirmed = true;
  partner.requestStatus = 'approved';
  partner.approvedAt = new Date().toISOString();
  partner.storeSync = getPartnerStoreSyncConfig(partner);
  if (partner.storeSync.enabled && partner.storeSync.sourceUrl) {
    await runPartnerStoreSync(partner, data, { reason: 'partner-approve' });
  }
  delete partner.deniedAt;
  saveData(data);

  res.json({ success: true, partner });
});

app.post('/api/partners/:id/deny', requireAdmin, (req, res) => {
  const data = loadData();
  const partner = data.partners.find((entry) => String(entry.id) === String(req.params.id));

  if (!partner) {
    return res.status(404).json({ success: false, message: 'Partner not found.' });
  }

  partner.paid = false;
  partner.activeListing = false;
  partner.paymentConfirmed = false;
  partner.requestStatus = 'denied';
  partner.deniedAt = new Date().toISOString();
  saveData(data);

  res.json({ success: true, partner });
});

app.post('/api/partners/:id/ban', requireAdmin, (req, res) => {
  const data = loadData();
  const partner = data.partners.find((entry) => String(entry.id) === String(req.params.id));

  if (!partner) {
    return res.status(404).json({ success: false, message: 'Partner not found.' });
  }

  const companyKey = normalizeName(partner.companyName || '');
  const ownerKey = normalizeName(partner.ownerEmail || '');

  partner.paid = false;
  partner.activeListing = false;
  partner.paymentConfirmed = false;
  partner.requestStatus = 'banned';
  partner.bannedAt = new Date().toISOString();

  data.partners.forEach((entry) => {
    if (normalizeName(entry.companyName) !== companyKey || normalizeName(entry.ownerEmail) !== ownerKey) {
      return;
    }
    entry.paid = false;
    entry.activeListing = false;
    entry.paymentConfirmed = false;
    entry.requestStatus = 'banned';
    entry.bannedAt = new Date().toISOString();
  });

  data.products.forEach((entry) => {
    if (normalizeName(entry.companyName) !== companyKey || normalizeName(entry.ownerEmail) !== ownerKey) {
      return;
    }
    entry.visible = false;
    entry.approved = false;
    entry.updatedAt = new Date().toISOString();
  });

  data.ads.forEach((entry) => {
    if (normalizeName(entry.companyName) !== companyKey || normalizeName(entry.ownerEmail) !== ownerKey) {
      return;
    }
    entry.active = false;
    entry.paid = false;
    entry.subscriptionStatus = 'inactive';
    entry.updatedAt = new Date().toISOString();
  });

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
  const partnerMatch = findLatestPartner(data, companyName, ownerEmail);
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
      message: 'Your company must first receive listing approval before adding products. After that, you can add unlimited products.'
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
  const companyAuth = getCompanyHeaderAuth(req, { requireActiveListing: true });
  if (companyAuth) {
    const scoped = data.products.filter((entry) =>
      normalizeName(entry.companyName) === normalizeName(companyAuth.companyName)
      && normalizeName(entry.ownerEmail) === normalizeName(companyAuth.ownerEmail)
    );
    return res.json(scoped);
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

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const data = loadData();
  const index = data.products.findIndex((entry) => String(entry.id) === String(req.params.id));
  if (index < 0) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const [deletedProduct] = data.products.splice(index, 1);
  saveData(data);
  return res.json({ success: true, product: deletedProduct });
});

app.post('/api/products/:id/inventory', (req, res) => {
  const hasPrivileged = hasPrivilegedAccess(req);
  const companyAuth = getCompanyHeaderAuth(req, { requireActiveListing: true });
  if (!hasPrivileged && !companyAuth) {
    return res.status(401).json({ success: false, message: 'Unauthorized inventory update request.' });
  }

  const data = loadData();
  const product = data.products.find((entry) => String(entry.id) === String(req.params.id));

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  if (!hasPrivileged && companyAuth) {
    const sameCompany = normalizeName(product.companyName) === normalizeName(companyAuth.companyName);
    const sameOwner = normalizeName(product.ownerEmail) === normalizeName(companyAuth.ownerEmail);
    if (!sameCompany || !sameOwner) {
      return res.status(403).json({ success: false, message: 'You can only edit inventory for your own company products.' });
    }
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
      if (!safeCompanyName || !safeOwnerEmail) {
        return res.status(400).json({ success: false, message: 'Company name and owner email are required for one-time setup checkout.' });
      }
      return res.json({
        success: true,
        message: 'Your one-time setup fee is $0. You can now run Teyo\'s Superpower.',
        url: null,
        sessionId: null
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


/* ???????????????????????????????????????????????????????????????
   SEO PRODUCT PAGES  /products/:slug
   Each approved product gets its own crawlable URL with full
   Open Graph + Twitter Card meta so Google/social can index it.
??????????????????????????????????????????????????????????????? */

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function prettifySlug(value) {
  return String(value || '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function buildProductSlug(product) {
  return slugify(`${product.productName}-${product.companyName}-${product.id}`);
}

function buildLocalSeoLandingPageHtml(citySlug, serviceSlug, baseUrl, data) {
  const cityLabel = prettifySlug(citySlug);
  const serviceLabel = prettifySlug(serviceSlug);
  const title = `${serviceLabel} in ${cityLabel} | Teyo`;
  const description = `Discover ${serviceLabel.toLowerCase()} in ${cityLabel} on Teyo. Find nearby stores, compare availability, and browse live products that match what shoppers are searching for.`;
  const canonical = `${baseUrl}/city/${citySlug}/${serviceSlug}`;
  const relatedPartners = (data.partners || [])
    .filter((entry) => entry && (entry.companyName || entry.storeNiche || entry.details))
    .filter((entry) => {
      const haystack = `${entry.companyName || ''} ${entry.storeNiche || ''} ${entry.details || ''}`.toLowerCase();
      const haystackSlug = slugify(haystack);
      return haystack.includes(serviceSlug.toLowerCase())
        || haystack.includes(serviceLabel.toLowerCase())
        || haystackSlug.includes(serviceSlug.toLowerCase())
        || haystack.includes(cityLabel.toLowerCase())
        || haystack.includes(citySlug.toLowerCase());
    })
    .slice(0, 6);
  const relatedProducts = (data.products || [])
    .filter((entry) => entry && entry.approved && entry.visible)
    .filter((entry) => {
      const haystack = `${entry.productName || ''} ${entry.category || ''} ${entry.description || ''}`.toLowerCase();
      return haystack.includes(serviceSlug.toLowerCase()) || haystack.includes(serviceLabel.toLowerCase()) || haystack.includes(cityLabel.toLowerCase()) || haystack.includes(citySlug.toLowerCase());
    })
    .slice(0, 6);
  const partnerMarkup = relatedPartners.length
    ? `<ul class="seo-card-list">${relatedPartners.map((partner) => `<li><strong>${escapeHtml(partner.companyName || 'Local brand')}</strong><br /><span>${escapeHtml(partner.storeNiche || 'Growing partner')}</span></li>`).join('')}</ul>`
    : `<p class="seo-card-copy">New partner profiles are seeded live so this page can convert search demand into profile claims.</p>`;
  const productMarkup = relatedProducts.length
    ? `<ul class="seo-card-list">${relatedProducts.map((product) => `<li><strong>${escapeHtml(product.productName || 'Featured product')}</strong><br /><span>${escapeHtml(product.price || '')} • ${escapeHtml(product.stockStatus || 'Live availability')}</span></li>`).join('')}</ul>`
    : `<p class="seo-card-copy">As more companies join Teyo, this page will automatically surface more matching products and local inventory.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="Teyo" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/styles.css" />
  <style>
    .seo-hero{max-width:960px;margin:0 auto;padding:48px 20px 20px;}
    .seo-shell{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));margin-top:24px;}
    .seo-card{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,.12);}
    .seo-card h2{font-size:1.1rem;margin:0 0 8px;}
    .seo-card p{color:var(--muted);line-height:1.7;margin:0 0 10px;}
    .seo-card-list{list-style:none;padding:0;margin:0;display:grid;gap:10px;}
    .seo-card-list li{padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--line);}
    .seo-card-list li strong{display:block;margin-bottom:2px;}
    .seo-card-list li span{font-size:0.92rem;color:var(--muted);}
    .seo-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}
    .seo-actions a{display:inline-flex;align-items:center;justify-content:center;padding:11px 16px;border-radius:999px;background:var(--accent);color:#000;text-decoration:none;font-weight:700;}
    .seo-actions a.secondary{background:transparent;border:1px solid var(--line);color:var(--text);} 
  </style>
</head>
<body>
  <div class="page-shell">
    <header class="topbar">
      <a href="/" class="brand" aria-label="Teyo home">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" role="img" aria-label="Teyo logo">
            <path class="hex-outline" d="M60 8 L108 36 L108 84 L60 112 L12 84 L12 36 Z"></path>
            <path class="hex-core" d="M60 24 L90 40 L90 80 L60 96 L30 80 L30 40 Z"></path>
            <path class="brand-t" d="M60 36 V84 M40 36 H80"></path>
          </svg>
        </span>
        <span class="brand-text">Teyo</span>
      </a>
    </header>
    <main class="seo-hero">
      <p class="eyebrow">Teyo local discovery</p>
      <h1>${escapeHtml(`Find ${serviceLabel.toLowerCase()} in ${cityLabel}`)}</h1>
      <p class="section-heading">${escapeHtml(`Search for ${serviceLabel.toLowerCase()} in ${cityLabel} and discover stores that are already building live product listings, stock visibility, and size-based availability on Teyo.`)}</p>
      <div class="seo-actions">
        <a href="/marketplace.html">Open marketplace</a>
        <a class="secondary" href="/partners.html">Claim your business profile</a>
      </div>
      <div class="seo-shell">
        <article class="seo-card">
          <h2>Why this page exists</h2>
          <p>These high-intent city + service pages give Teyo a scalable way to attract shoppers who are already searching for specific products in specific places.</p>
          <p>Each page can surface matching partner profiles, nearby inventory visibility, and live products so businesses discover Teyo through search rather than outreach.</p>
        </article>
        <article class="seo-card">
          <h2>Featured partners</h2>
          ${partnerMarkup}
        </article>
        <article class="seo-card">
          <h2>Featured products</h2>
          ${productMarkup}
        </article>
      </div>
    </main>
  </div>
</body>
</html>`;
}

function findProductBySlug(slug) {
  const data = loadData();
  return data.products.find((p) => {
    if (!p.approved || !p.visible) return false;
    return buildProductSlug(p) === slug;
  }) || null;
}

function buildProductPageHtml(product, baseUrl) {
  const title = escapeHtml(`${product.productName} ? ${product.companyName} | Teyo`);
  const desc  = escapeHtml(
    product.description
      ? String(product.description).slice(0, 160)
      : `Buy ${product.productName} by ${product.companyName} on Teyo ? Canada\'s product discovery marketplace.`
  );
  const imageUrl     = escapeHtml(product.imageUrl || '');
  const productName  = escapeHtml(product.productName);
  const companyName  = escapeHtml(product.companyName);
  const category     = escapeHtml(product.category || '');
  const price        = escapeHtml(product.price || '');
  const stockStatus  = escapeHtml(product.stockStatus || 'In Stock');
  const websiteUrl   = escapeHtml(product.websiteUrl || '');
  const slug         = buildProductSlug(product);
  const canonical    = `${baseUrl}/products/${slug}`;
  const sizeList     = Array.isArray(product.sizeOptions) && product.sizeOptions.length
    ? `<p class="psp-sizes"><strong>Available sizes:</strong> ${product.sizeOptions.map(s => `<span class="psp-size-tag">${escapeHtml(String(s))}</span>`).join(' ')}</p>`
    : '';
  const storeList    = Array.isArray(product.stores) && product.stores.length
    ? `<ul class="psp-stores">${product.stores.map(s => `<li>${escapeHtml(String(s))}</li>`).join('')}</ul>`
    : '';
  const imgHtml      = imageUrl
    ? `<div class="psp-img-wrap"><img src="${imageUrl}" alt="${productName}" loading="lazy" /></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${canonical}" />

  <!-- Open Graph -->
  <meta property="og:type"        content="product" />
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url"         content="${canonical}" />
  ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
  <meta property="og:site_name"   content="Teyo" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="${imageUrl ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title"       content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}" />` : ''}

  <!-- Schema.org Product -->
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.productName,
    description: product.description || '',
    image: product.imageUrl || undefined,
    brand: { '@type': 'Brand', name: product.companyName },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CAD',
      price: String(product.price || '').replace(/[^0-9.]/g, '') || '0',
      availability: product.stockStatus === 'Out of Stock'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      url: product.websiteUrl || canonical,
      seller: { '@type': 'Organization', name: product.companyName }
    }
  })}</script>

  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
  <style>
    .psp-wrap{max-width:820px;margin:0 auto;padding:32px 20px 72px;}
    .psp-breadcrumb{font-size:0.82rem;color:var(--muted);margin-bottom:20px;}
    .psp-breadcrumb a{color:var(--muted);text-decoration:none;}
    .psp-breadcrumb a:hover{color:var(--text);}
    .psp-img-wrap{margin-bottom:24px;border-radius:12px;overflow:hidden;background:var(--surface);}
    .psp-img-wrap img{width:100%;max-height:460px;object-fit:contain;display:block;}
    .psp-company{font-size:0.82rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
    .psp-name{font-size:clamp(1.6rem,4vw,2.4rem);font-weight:800;margin:0 0 8px;}
    .psp-price{font-size:1.45rem;font-weight:700;color:var(--accent);margin:0 0 10px;}
    .psp-stock{display:inline-block;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:99px;border:1px solid;margin-bottom:16px;}
    .psp-stock.in-stock{color:#4ade80;border-color:#4ade80;}
    .psp-stock.out-stock{color:#f87171;border-color:#f87171;}
    .psp-desc{color:var(--muted);line-height:1.7;margin-bottom:20px;}
    .psp-sizes{margin-bottom:16px;}
    .psp-size-tag{display:inline-block;border:1px solid var(--line);border-radius:6px;padding:2px 9px;font-size:0.8rem;margin:2px;}
    .psp-stores{padding-left:18px;color:var(--muted);font-size:0.88rem;margin-bottom:20px;}
    .psp-cta{display:inline-block;margin-top:8px;padding:12px 32px;background:var(--accent);color:#000;font-weight:700;border-radius:8px;text-decoration:none;font-size:0.97rem;letter-spacing:0.04em;}
    .psp-cta:hover{opacity:0.88;}
    .psp-back{display:inline-block;margin-top:32px;font-size:0.85rem;color:var(--muted);text-decoration:none;}
    .psp-back:hover{color:var(--text);}
  </style>
</head>
<body>
  <div class="page-shell">
    <header class="topbar">
      <a href="/" class="brand" aria-label="Teyo home">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" role="img" aria-label="Teyo logo">
            <path class="hex-outline" d="M60 8 L108 36 L108 84 L60 112 L12 84 L12 36 Z"></path>
            <path class="hex-core" d="M60 24 L90 40 L90 80 L60 96 L30 80 L30 40 Z"></path>
            <path class="brand-t" d="M60 36 V84 M40 36 H80"></path>
          </svg>
        </span>
        <span class="brand-text">Teyo</span>
      </a>
    </header>
    <div class="psp-wrap">
      <p class="psp-breadcrumb">
        <a href="/">Home</a> / <a href="/marketplace.html">Marketplace</a> / ${productName}
      </p>
      ${imgHtml}
      <p class="psp-company">${companyName}</p>
      <h1 class="psp-name">${productName}</h1>
      ${price ? `<p class="psp-price">${price}</p>` : ''}
      <span class="psp-stock ${product.stockStatus === 'Out of Stock' ? 'out-stock' : 'in-stock'}">${stockStatus}</span>
      ${category ? `<p class="psp-breadcrumb" style="margin-top:4px">Category: ${category}</p>` : ''}
      ${product.description ? `<p class="psp-desc">${escapeHtml(product.description)}</p>` : ''}
      ${sizeList}
      ${storeList.length ? `<p><strong>Available at:</strong></p>${storeList}` : ''}
      ${websiteUrl ? `<a class="psp-cta" href="${websiteUrl}" target="_blank" rel="noopener">View on ${companyName}'s site &rarr;</a>` : ''}
      <br/>
      <a class="psp-back" href="/marketplace.html">&larr; Back to Marketplace</a>
    </div>
  </div>
</body>
</html>`;
}

/* Individual product SEO page */
app.get('/products/:slug', (req, res) => {
  const slug = String(req.params.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const product = findProductBySlug(slug);
  if (!product) {
    return res.status(404).sendFile(path.join(__dirname, 'index.html'));
  }
  const baseUrl = appBaseUrl || `${req.protocol}://${req.get('host')}`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.send(buildProductPageHtml(product, baseUrl));
});

app.get('/:city/:service', (req, res, next) => {
  const city = slugify(String(req.params.city || ''));
  const service = slugify(String(req.params.service || ''));
  const reservedPaths = new Set(['api', 'products', 'city', 'partners', 'marketplace', 'inventory', 'contact', 'admin', 'index', 'sitemap.xml', 'robots.txt']);

  if (!city || !service || reservedPaths.has(city) || PUBLIC_FILE_ALLOWLIST.has(city) || PUBLIC_FILE_ALLOWLIST.has(service)) {
    return next();
  }

  const data = loadData();
  const baseUrl = appBaseUrl || `${req.protocol}://${req.get('host')}`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(buildLocalSeoLandingPageHtml(city, service, baseUrl, data));
});

app.get('/city/:city/:service', (req, res, next) => {
  const city = slugify(String(req.params.city || ''));
  const service = slugify(String(req.params.service || ''));
  const reservedPaths = new Set(['api', 'products', 'city', 'partners', 'marketplace', 'inventory', 'contact', 'admin', 'index', 'sitemap.xml', 'robots.txt']);

  if (!city || !service || reservedPaths.has(city) || PUBLIC_FILE_ALLOWLIST.has(city) || PUBLIC_FILE_ALLOWLIST.has(service)) {
    return next();
  }

  const data = loadData();
  const baseUrl = appBaseUrl || `${req.protocol}://${req.get('host')}`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(buildLocalSeoLandingPageHtml(city, service, baseUrl, data));
});

/* Sitemap ? lists all approved visible products */
app.get('/sitemap.xml', (req, res) => {
  const data = loadData();
  const baseUrl = appBaseUrl || `${req.protocol}://${req.get('host')}`;
  const staticPages = [
    { loc: `${baseUrl}/`,                changefreq: 'weekly',  priority: '1.0' },
    { loc: `${baseUrl}/marketplace.html`,changefreq: 'daily',   priority: '0.9' },
    { loc: `${baseUrl}/partners.html`,   changefreq: 'weekly',  priority: '0.7' },
    { loc: `${baseUrl}/contact.html`,    changefreq: 'monthly', priority: '0.5' }
  ];
  const productUrls = data.products
    .filter(p => p.approved && p.visible)
    .map(p => ({
      loc: `${baseUrl}/products/${buildProductSlug(p)}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : undefined
    }));
  const seoLandingUrls = [
    { loc: `${baseUrl}/city/toronto/clothes`, changefreq: 'weekly', priority: '0.75' },
    { loc: `${baseUrl}/city/vancouver/tech`, changefreq: 'weekly', priority: '0.75' },
    { loc: `${baseUrl}/city/calgary/beauty`, changefreq: 'weekly', priority: '0.72' },
    { loc: `${baseUrl}/city/montreal/fashion`, changefreq: 'weekly', priority: '0.72' },
    { loc: `${baseUrl}/city/halifax/home-decor`, changefreq: 'weekly', priority: '0.7' }
  ];
  const all = [...staticPages, ...productUrls, ...seoLandingUrls];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    all.map(u =>
      `  <url>\n    <loc>${escapeHtml(u.loc)}</loc>\n` +
      (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
      `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ).join('\n')
  }\n</urlset>`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(xml);
});

/* robots.txt ? allow crawling and point to sitemap */
app.get('/robots.txt', (req, res) => {
  const baseUrl = appBaseUrl || `${req.protocol}://${req.get('host')}`;
  const txt = `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${baseUrl}/sitemap.xml\n`;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(txt);
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
    scheduleStoreSyncWorker();
  } catch (error) {
    console.error('Failed to initialize storage. Server aborted.', error.message);
    process.exit(1);
  }
}

startServer();

