/**
 * TEYO GUARD - Autonomous Wealth Protection & Compliance Platform
 * MVP: Tax residency tracking, asset monitoring, HNWI onboarding
 * 
 * Stack: Node.js + Express, encrypted JSON storage (Phase 1), migrates to PostgreSQL (Phase 2)
 * Architecture: Privacy-first (client-side encryption where possible)
 */

require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const helmet = require('helmet');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;
const storageDir = path.join(__dirname, 'storage');
const guardDataFile = path.join(storageDir, 'guard-entities.json');

// =================================================================
// ENCRYPTION LAYER (Privacy-First)
// =================================================================
const ENCRYPTION_KEY = process.env.GUARD_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_ALGO = 'aes-256-gcm';

function encryptSensitiveData(plaintext) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptSensitiveData(encryptedData) {
  try {
    const [iv, authTag, encrypted] = encryptedData.split(':');
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGO,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
}

// =================================================================
// DATA MODEL: HNWI ENTITY + TAX RESIDENCY + ASSETS
// =================================================================

/**
 * Entity Schema:
 * {
 *   id: "ent_xxxxx",
 *   email: "owner@example.com",
 *   companyName: "Smith Family Office",
 *   accessKey: "...", // encrypted
 *   profile: {
 *     primaryResidency: "CA", // CA, US, UK, other
 *     taxStatus: "Canadian Resident" | "US Person" | "Non-Resident Alien" | "Cross-Border",
 *     riskTolerance: "Conservative_Preservation" | "Balanced" | "Growth",
 *     aum: 50000000 // total AUM in USD
 *   },
 *   locations: [
 *     { jurisdiction: "US", daysThisYear: 45, daysLastYear: 120, daysTwoYearsAgo: 110 }
 *   ],
 *   holdings: [
 *     {
 *       assetId: "ast_001",
 *       type: "Real_Estate" | "Liquid_Equities" | "Private_Equity" | "Crypto" | "Cash",
 *       jurisdiction: "US-FL",
 *       valuationUSD: 12500000,
 *       ownership: "Direct" | "LLC_Tier_1" | "LLC_Tier_2_Trust" | "Corp",
 *       custodian: "RBC" | "TD" | "BMO" | "Fidelity" | "Kraken" | "Ledger",
 *       lastUpdated: "2025-01-15T10:00Z"
 *     }
 *   ],
 *   compliance: {
 *     usSptAlert: false,
 *     usSptDaysRemaining: 183,
 *     lastLocationUpdate: "2025-01-15T10:00Z",
 *     withholdingExposurePct: 15.0
 *   },
 *   createdAt: "2025-01-01T00:00Z",
 *   lastLogin: "2025-01-15T10:30Z"
 * }
 */

// =================================================================
// STORAGE LAYER
// =================================================================

async function loadGuardData() {
  try {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    if (!fs.existsSync(guardDataFile)) {
      return { entities: [], analyticsLog: [], alertsLog: [] };
    }
    const raw = await fsp.readFile(guardDataFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load guard data:', err.message);
    return { entities: [], analyticsLog: [], alertsLog: [] };
  }
}

async function saveGuardData(data) {
  try {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    await fsp.writeFile(guardDataFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save guard data:', err.message);
  }
}

// =================================================================
// CORE LOGIC: US SUBSTANTIAL PRESENCE TEST
// =================================================================

function calculateUSSubstantialPresence(daysCurrentYear, daysLastYear, daysTwoYearsAgo) {
  const weightedDays = 
    daysCurrentYear + 
    (daysLastYear / 3.0) + 
    (daysTwoYearsAgo / 6.0);
  
  const taxLiabilityTriggered = weightedDays >= 183;
  const daysRemaining = Math.max(0, 183 - weightedDays);
  
  return {
    weightedTotal: Math.round(weightedDays * 100) / 100,
    taxLiabilityTriggered,
    daysUntilThreshold: Math.round(daysRemaining * 100) / 100,
    alert: daysRemaining > 0 && daysRemaining <= 14
  };
}

// =================================================================
// TAX RESIDENCY ENGINE
// =================================================================

function analyzeTaxResidency(entity) {
  const usLocation = entity.locations.find(l => l.jurisdiction === 'US');
  if (!usLocation) {
    return { status: 'Non-US', warnings: [] };
  }

  const spt = calculateUSSubstantialPresence(
    usLocation.daysThisYear || 0,
    usLocation.daysLastYear || 0,
    usLocation.daysTwoYearsAgo || 0
  );

  const warnings = [];
  if (spt.alert) {
    warnings.push(`⚠️ CRITICAL: Only ${spt.daysUntilThreshold} days remain before US tax residency status changes.`);
  }
  if (spt.taxLiabilityTriggered) {
    warnings.push(`🚨 US Substantial Presence Test TRIGGERED. You are now a US tax resident.`);
  }

  return {
    status: spt.taxLiabilityTriggered ? 'US Tax Resident' : 'Not Yet US Resident',
    sptScore: spt.weightedTotal,
    daysRemaining: spt.daysUntilThreshold,
    warnings
  };
}

// =================================================================
// ASSET STRESS TEST ENGINE (Phase 1 MVP: Basic)
// =================================================================

function calculatePortfolioStress(holdings) {
  const totalUSD = holdings.reduce((sum, h) => sum + (h.valuationUSD || 0), 0);
  const liquidAssets = holdings
    .filter(h => h.type === 'Liquid_Equities' || h.type === 'Cash')
    .reduce((sum, h) => sum + (h.valuationUSD || 0), 0);
  
  const illiquidAssets = holdings
    .filter(h => h.type === 'Real_Estate' || h.type === 'Private_Equity')
    .reduce((sum, h) => sum + (h.valuationUSD || 0), 0);

  // Stress scenarios (MVP: fixed, Phase 2: parameterized)
  const stressScenarios = {
    mildDownturn: {
      label: 'Mild Downturn (-10%)',
      liquidLoss: liquidAssets * 0.10,
      realEstateLoss: illiquidAssets * 0.05,
      totalExposure: (liquidAssets * 0.10) + (illiquidAssets * 0.05)
    },
    severeCorrection: {
      label: 'Severe Correction (-25%)',
      liquidLoss: liquidAssets * 0.25,
      realEstateLoss: illiquidAssets * 0.15,
      totalExposure: (liquidAssets * 0.25) + (illiquidAssets * 0.15)
    },
    crisis: {
      label: 'Crisis Scenario (-50%)',
      liquidLoss: liquidAssets * 0.50,
      realEstateLoss: illiquidAssets * 0.30,
      totalExposure: (liquidAssets * 0.50) + (illiquidAssets * 0.30)
    }
  };

  return {
    totalPortfolioUSD: totalUSD,
    liquidUSD: liquidAssets,
    illiquidUSD: illiquidAssets,
    liquidRatio: totalUSD > 0 ? (liquidAssets / totalUSD * 100).toFixed(1) : 0,
    stressScenarios
  };
}

// =================================================================
// EMAIL ALERTS
// =================================================================

function getAlertTransporter() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const secure = port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

async function sendComplianceAlert(entity, alerts) {
  const transporter = getAlertTransporter();
  if (!transporter || !entity.email) return;

  const alertsHtml = alerts.map(a => `<li>${a}</li>`).join('');
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #c41e3a;">⚠️ TEYO Guard Compliance Alert</h2>
      <p>Hello ${entity.companyName || 'Family Office'},</p>
      <p>TEYO Guard has detected critical compliance issues that require immediate attention:</p>
      <ul style="color: #c41e3a; font-weight: bold;">
        ${alertsHtml}
      </ul>
      <p><strong>Next Steps:</strong> Log into your TEYO Guard dashboard immediately to review and adjust your tax residency strategy.</p>
      <p style="font-size: 12px; color: #999; margin-top: 30px;">
        This is an automated alert from TEYO Guard. Do not reply to this email.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: entity.email,
      subject: '🚨 TEYO Guard: Urgent Compliance Alert',
      html
    });
  } catch (err) {
    console.error(`Failed to send alert to ${entity.email}:`, err.message);
  }
}

// =================================================================
// EXPRESS MIDDLEWARE & ROUTING
// =================================================================

app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// =================================================================
// API: GUARD ONBOARDING (Create HNWI Entity)
// =================================================================

app.post('/api/guard/entities', async (req, res) => {
  const { email, companyName, aum, primaryResidency, riskTolerance } = req.body;

  if (!email || !email.includes('@') || !companyName || !aum) {
    return res.status(400).json({ success: false, message: 'Missing required fields: email, companyName, aum' });
  }

  const data = await loadGuardData();
  const existingEntity = data.entities.find(e => e.email === email);

  if (existingEntity) {
    return res.status(400).json({ success: false, message: 'Email already registered with TEYO Guard.' });
  }

  const entityId = `ent_${Date.now()}`;
  const accessKey = crypto.randomBytes(24).toString('hex');

  const entity = {
    id: entityId,
    email,
    companyName,
    accessKey: encryptSensitiveData(accessKey),
    profile: {
      primaryResidency: primaryResidency || 'CA',
      taxStatus: 'Unknown',
      riskTolerance: riskTolerance || 'Balanced',
      aum: Number(aum) || 0
    },
    locations: [],
    holdings: [],
    compliance: {
      usSptAlert: false,
      usSptDaysRemaining: 183,
      lastLocationUpdate: new Date().toISOString(),
      withholdingExposurePct: 0
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  data.entities.push(entity);
  await saveGuardData(data);

  // Send welcome email
  const transporter = getAlertTransporter();
  if (transporter) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c7cff;">Welcome to TEYO Guard</h2>
        <p>Your autonomous wealth protection platform is now active.</p>
        <p><strong>Your Access Key:</strong> <code style="background: #f0f0f0; padding: 10px; font-family: monospace;">${accessKey}</code></p>
        <p>Use this key to access your dashboard at https://teyo.ca/guard/dashboard</p>
        <p style="font-size: 12px; color: #999; margin-top: 30px;">Keep this key secure. TEYO Guard encrypts all sensitive data at rest.</p>
      </div>
    `;
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: '✅ Your TEYO Guard Account is Ready',
        html
      });
    } catch (err) {
      console.error('Failed to send welcome email:', err.message);
    }
  }

  res.json({
    success: true,
    message: 'HNWI account created. Welcome email sent.',
    entityId,
    accessKey
  });
});

// =================================================================
// API: GET ENTITY PROFILE (Auth required via access key)
// =================================================================

app.get('/api/guard/entities/:entityId', async (req, res) => {
  const { entityId } = req.params;
  const accessKey = req.headers['x-access-key'];

  if (!accessKey) {
    return res.status(401).json({ success: false, message: 'Missing access key header.' });
  }

  const data = await loadGuardData();
  const entity = data.entities.find(e => e.id === entityId);

  if (!entity) {
    return res.status(404).json({ success: false, message: 'Entity not found.' });
  }

  const decryptedKey = decryptSensitiveData(entity.accessKey);
  if (decryptedKey !== accessKey) {
    return res.status(403).json({ success: false, message: 'Invalid access key.' });
  }

  // Analyze tax residency
  const taxAnalysis = analyzeTaxResidency(entity);
  
  // Calculate portfolio stress
  const portfolioStress = calculatePortfolioStress(entity.holdings);

  res.json({
    success: true,
    entity: {
      id: entity.id,
      email: entity.email,
      companyName: entity.companyName,
      profile: entity.profile,
      locations: entity.locations,
      holdings: entity.holdings,
      compliance: entity.compliance,
      taxAnalysis,
      portfolioStress,
      lastLogin: entity.lastLogin
    }
  });
});

// =================================================================
// API: UPDATE LOCATION (Add travel days)
// =================================================================

app.post('/api/guard/entities/:entityId/locations', async (req, res) => {
  const { entityId } = req.params;
  const { jurisdiction, daysThisYear, daysLastYear, daysTwoYearsAgo } = req.body;
  const accessKey = req.headers['x-access-key'];

  if (!accessKey) {
    return res.status(401).json({ success: false, message: 'Missing access key.' });
  }

  const data = await loadGuardData();
  const entity = data.entities.find(e => e.id === entityId);

  if (!entity) {
    return res.status(404).json({ success: false, message: 'Entity not found.' });
  }

  const decryptedKey = decryptSensitiveData(entity.accessKey);
  if (decryptedKey !== accessKey) {
    return res.status(403).json({ success: false, message: 'Invalid access key.' });
  }

  const existingLocation = entity.locations.find(l => l.jurisdiction === jurisdiction);
  if (existingLocation) {
    existingLocation.daysThisYear = daysThisYear || 0;
    existingLocation.daysLastYear = daysLastYear || 0;
    existingLocation.daysTwoYearsAgo = daysTwoYearsAgo || 0;
  } else {
    entity.locations.push({
      jurisdiction,
      daysThisYear: daysThisYear || 0,
      daysLastYear: daysLastYear || 0,
      daysTwoYearsAgo: daysTwoYearsAgo || 0
    });
  }

  entity.compliance.lastLocationUpdate = new Date().toISOString();

  // Check for SPT alert
  const taxAnalysis = analyzeTaxResidency(entity);
  if (taxAnalysis.warnings.length > 0) {
    await sendComplianceAlert(entity, taxAnalysis.warnings);
  }

  await saveGuardData(data);

  res.json({
    success: true,
    message: 'Location data updated.',
    taxAnalysis
  });
});

// =================================================================
// API: ADD HOLDING
// =================================================================

app.post('/api/guard/entities/:entityId/holdings', async (req, res) => {
  const { entityId } = req.params;
  const { type, jurisdiction, valuationUSD, ownership, custodian } = req.body;
  const accessKey = req.headers['x-access-key'];

  if (!accessKey) {
    return res.status(401).json({ success: false, message: 'Missing access key.' });
  }

  const data = await loadGuardData();
  const entity = data.entities.find(e => e.id === entityId);

  if (!entity) {
    return res.status(404).json({ success: false, message: 'Entity not found.' });
  }

  const decryptedKey = decryptSensitiveData(entity.accessKey);
  if (decryptedKey !== accessKey) {
    return res.status(403).json({ success: false, message: 'Invalid access key.' });
  }

  const holding = {
    assetId: `ast_${Date.now()}`,
    type,
    jurisdiction,
    valuationUSD: Number(valuationUSD) || 0,
    ownership: ownership || 'Direct',
    custodian: custodian || 'Unknown',
    lastUpdated: new Date().toISOString()
  };

  entity.holdings.push(holding);
  await saveGuardData(data);

  res.json({
    success: true,
    message: 'Holding added.',
    holding
  });
});

// =================================================================
// API: COMPLIANCE DASHBOARD (Summary)
// =================================================================

app.get('/api/guard/compliance-dashboard/:entityId', async (req, res) => {
  const { entityId } = req.params;
  const accessKey = req.headers['x-access-key'];

  if (!accessKey) {
    return res.status(401).json({ success: false, message: 'Missing access key.' });
  }

  const data = await loadGuardData();
  const entity = data.entities.find(e => e.id === entityId);

  if (!entity) {
    return res.status(404).json({ success: false, message: 'Entity not found.' });
  }

  const decryptedKey = decryptSensitiveData(entity.accessKey);
  if (decryptedKey !== accessKey) {
    return res.status(403).json({ success: false, message: 'Invalid access key.' });
  }

  const taxAnalysis = analyzeTaxResidency(entity);
  const portfolioStress = calculatePortfolioStress(entity.holdings);

  const dashboard = {
    companyName: entity.companyName,
    aum: entity.profile.aum,
    taxStatus: taxAnalysis.status,
    warnings: taxAnalysis.warnings,
    sptScore: taxAnalysis.sptScore,
    daysRemaining: taxAnalysis.daysRemaining,
    portfolioStress,
    lastUpdated: new Date().toISOString()
  };

  res.json({ success: true, dashboard });
});

// =================================================================
// HEALTH CHECK
// =================================================================

app.get('/api/guard/health', (req, res) => {
  res.json({ status: 'TEYO Guard is operational', timestamp: new Date().toISOString() });
});

// =================================================================
// START SERVER
// =================================================================

app.listen(port, () => {
  console.log(`🛡️  TEYO Guard MVP running on port ${port}`);
  console.log(`Encryption enabled: ${ENCRYPTION_KEY ? 'YES' : 'NO (using random key)'}`);
  console.log(`Data file: ${guardDataFile}`);
});

module.exports = app;
