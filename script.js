const products = [];

const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const sizeFilterSelect = document.getElementById('sizeFilterSelect');
const sizeInStockOnly = document.getElementById('sizeInStockOnly');
const stockReminderMessage = document.getElementById('stockReminderMessage');
const resultsList = document.getElementById('resultsList');
const selectedProduct = document.getElementById('selectedProduct');
const storeList = document.getElementById('storeList');
const partnerForm = document.getElementById('partnerForm');
const formMessage = document.getElementById('formMessage');
const adForm = document.getElementById('adForm');
const adFormMessage = document.getElementById('adFormMessage');
const productForm = document.getElementById('productForm');
const productFormMessage = document.getElementById('productFormMessage');
const placementCheckoutBtn = document.getElementById('placementCheckoutBtn');
const monthlyCheckoutBtn = document.getElementById('monthlyCheckoutBtn');
const checkoutMessage = document.getElementById('checkoutMessage');
const activeAdsList = document.getElementById('activeAdsList');
const adminAdsList = document.getElementById('adminAdsList');
const adminPartnerList = document.getElementById('adminPartnerList');
const adminProcessedPartnerList = document.getElementById('adminProcessedPartnerList');
const inventoryProductList = document.getElementById('inventoryProductList');
const inventorySummaryPanel = document.getElementById('inventorySummaryPanel');
const inventoryRestockList = document.getElementById('inventoryRestockList');
const inventoryStatusMessage = document.getElementById('inventoryStatusMessage');
const adminSetKeyBtn = document.getElementById('adminSetKeyBtn');
const adminClearKeyBtn = document.getElementById('adminClearKeyBtn');
const adminAccessMessage = document.getElementById('adminAccessMessage');
const ownerEmailInput = document.getElementById('ownerEmailInput');
const ownerKeyInput = document.getElementById('ownerKeyInput');
const ownerSetKeyBtn = document.getElementById('ownerSetKeyBtn');
const ownerClearKeyBtn = document.getElementById('ownerClearKeyBtn');
const ownerAccessMessage = document.getElementById('ownerAccessMessage');
const companyNameInput = document.getElementById('companyNameInput');
const companyOwnerEmailInput = document.getElementById('companyOwnerEmailInput');
const companyAccessKeyInput = document.getElementById('companyAccessKeyInput');
const companySetAccessBtn = document.getElementById('companySetAccessBtn');
const companyClearAccessBtn = document.getElementById('companyClearAccessBtn');
const companyAccessMessage = document.getElementById('companyAccessMessage');
const customerThemePanel = document.getElementById('customerThemePanel');
const customerThemeControls = document.getElementById('customerThemeControls');
const customerVerifyAccessBtn = document.getElementById('customerVerifyAccessBtn');
const customerAccentColor = document.getElementById('customerAccentColor');
const customerStyleSelect = document.getElementById('customerStyleSelect');
const customerResetThemeBtn = document.getElementById('customerResetThemeBtn');
const customerPaymentMessage = document.getElementById('customerPaymentMessage');
const customerCheckoutMessage = document.getElementById('customerCheckoutMessage');
const customerEmailInput = document.getElementById('customerEmailInput');
const customerOneTimeCheckoutBtn = document.getElementById('customerOneTimeCheckoutBtn');
const customerMonthlyCheckoutBtn = document.getElementById('customerMonthlyCheckoutBtn');
const customerOneTimePlanBtn = document.getElementById('customerOneTimePlanBtn');
const customerPlusPlanBtn = document.getElementById('customerPlusPlanBtn');
const customerPresetButtons = document.querySelectorAll('.customer-preset-btn');
const customerPlushieSelect = document.getElementById('customerPlushieSelect');
const customerPetNameInput = document.getElementById('customerPetNameInput');
const customerPetColorInput  = document.getElementById('customerPetColorInput');
const customerPetColor2Input = document.getElementById('customerPetColor2Input');
const customerPetEarSelect   = document.getElementById('customerPetEarSelect');
const customerPetTailSelect  = document.getElementById('customerPetTailSelect');
const customerPetNoseSelect  = document.getElementById('customerPetNoseSelect');
const customerPetLegSelect   = document.getElementById('customerPetLegSelect');
const customerPlushiePreview = document.getElementById('customerPlushiePreview');
const customerPlushieCaption = document.getElementById('customerPlushieCaption');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

const customerThemeStorageKey = 'teyoCustomerThemeV1';
const customerThemeUnlockedKey = 'teyoCustomerThemeUnlockedV1';
const ownerEmailStorageKey = 'teyoOwnerEmailV1';
const ownerKeyStorageKey = 'teyoOwnerKeyV1';
const companyNameStorageKey = 'teyoCompanyNameV1';
const companyEmailStorageKey = 'teyoCompanyEmailV1';
const companyKeyStorageKey = 'teyoCompanyKeyV1';
const stockReminderStorageKey = 'teyoStockRemindersV1';
const customerStyleClasses = [
  'theme-style-midnight',
  'theme-style-graphite',
  'theme-style-carbon',
  'theme-style-kawaii',
  'theme-style-sakura',
  'theme-style-lavender',
  'theme-style-mint',
  'theme-style-strawberry',
  'theme-style-cloud',
  'theme-style-cotton',
  'theme-style-berry',
  'theme-style-night',
  'theme-style-rosegold',
  'theme-style-peach',
  'theme-style-boba',
  'theme-style-aurora',
  'theme-style-neon',
  'theme-style-matcha',
  'theme-style-bubblegum',
  'theme-style-lemon',
  'theme-style-ocean',
  'theme-style-sunset'
];
const customerPresetClasses = [
  'theme-preset-kawaii',
  'theme-preset-strawberry',
  'theme-preset-cloud',
  'theme-preset-lavender',
  'theme-preset-mint',
  'theme-preset-cotton',
  'theme-preset-berry',
  'theme-preset-night',
  'theme-preset-rosegold',
  'theme-preset-peach',
  'theme-preset-boba',
  'theme-preset-aurora',
  'theme-preset-neon',
  'theme-preset-matcha',
  'theme-preset-bubblegum',
  'theme-preset-lemon',
  'theme-preset-ocean',
  'theme-preset-sunset'
];
const plushieSymbols = {
  bunny: '🐰',
  bear: '🧸',
  cat: '🐱',
  frog: '🐸',
  star: '⭐',
  dog: '🐶',
  hamster: '🐹',
  panda: '🐼',
  fox: '🦊',
  duck: '🐥'
};
const customerCuteThemes = {
  kawaii: { accent: '#ff9ad5', style: 'kawaii', plushie: 'bear' },
  strawberry: { accent: '#ff6f8f', style: 'strawberry', plushie: 'bunny' },
  cloud: { accent: '#9edcff', style: 'cloud', plushie: 'star' },
  lavender: { accent: '#c7a8ff', style: 'lavender', plushie: 'cat' },
  mint: { accent: '#8be6c4', style: 'mint', plushie: 'frog' },
  cotton: { accent: '#ffb2f0', style: 'cotton', plushie: 'bear' },
  berry: { accent: '#ff7b93', style: 'berry', plushie: 'cat' },
  night: { accent: '#d8c6ff', style: 'night', plushie: 'star' },
  rosegold: { accent: '#d4956a', style: 'rosegold', plushie: 'bear' },
  peach: { accent: '#ff8c50', style: 'peach', plushie: 'bunny' },
  boba: { accent: '#c8956a', style: 'boba', plushie: 'bunny' },
  aurora: { accent: '#4fffd4', style: 'aurora', plushie: 'star' },
  neon: { accent: '#e040fb', style: 'neon', plushie: 'cat' },
  matcha: { accent: '#5aae44', style: 'matcha', plushie: 'frog' },
  bubblegum: { accent: '#ff2ec8', style: 'bubblegum', plushie: 'bunny' },
  lemon: { accent: '#d8b800', style: 'lemon', plushie: 'star' },
  ocean: { accent: '#40b8f8', style: 'ocean', plushie: 'frog' },
  sunset: { accent: '#ff5a1e', style: 'sunset', plushie: 'bear' }
};

let marketplaceState = {
  partners: [],
  ads: [],
  products: []
};

let lastSubmittedAdId = null;
let adminAccessGranted = false;
let marketplaceLoadError = '';

function isAdminPage() {
  return Boolean(adminPartnerList || adminAdsList || document.getElementById('adminProductList'));
}

function getAdminKey() {
  return sessionStorage.getItem('teyoAdminKey') || '';
}

function getOwnerEmail() {
  return sessionStorage.getItem(ownerEmailStorageKey) || '';
}

function getOwnerKey() {
  return sessionStorage.getItem(ownerKeyStorageKey) || '';
}

function hasOwnerSession() {
  return Boolean(getOwnerEmail() && getOwnerKey());
}

function getCompanySessionName() {
  return sessionStorage.getItem(companyNameStorageKey) || '';
}

function getCompanySessionEmail() {
  return sessionStorage.getItem(companyEmailStorageKey) || '';
}

function getCompanySessionKey() {
  return sessionStorage.getItem(companyKeyStorageKey) || '';
}

function hasCompanySession() {
  return Boolean(getCompanySessionName() && getCompanySessionEmail() && getCompanySessionKey());
}

function getAdminHeaders() {
  if (hasOwnerSession()) {
    return {
      'x-owner-email': getOwnerEmail(),
      'x-owner-key': getOwnerKey()
    };
  }

  return {};
}

function getOwnerHeaders() {
  if (!hasOwnerSession()) {
    return {};
  }

  function getCompanyHeaders() {
    if (!hasCompanySession()) {
      return {};
    }

    return {
      'x-company-name': getCompanySessionName(),
      'x-company-email': getCompanySessionEmail(),
      'x-company-key': getCompanySessionKey()
    };
  }

  return {
    'x-owner-email': getOwnerEmail(),
    'x-owner-key': getOwnerKey()
  };
}

function attachOwnerAuth(payload = {}) {
  return hasOwnerSession()
    ? { ...payload, ownerEmail: getOwnerEmail(), ownerKey: getOwnerKey() }
    : payload;
}

function requestAndStoreOwnerKey() {
  const email = String(ownerEmailInput?.value || '').trim();
  const key = String(ownerKeyInput?.value || '').trim();
  if (!email || !key) {
    return false;
  }

  sessionStorage.setItem(ownerEmailStorageKey, email);
  sessionStorage.setItem(ownerKeyStorageKey, key);
  return true;
}

function clearOwnerAccess() {
  sessionStorage.removeItem(ownerEmailStorageKey);
  sessionStorage.removeItem(ownerKeyStorageKey);
}

function clearCompanyAccess() {
  sessionStorage.removeItem(companyNameStorageKey);
  sessionStorage.removeItem(companyEmailStorageKey);
  sessionStorage.removeItem(companyKeyStorageKey);
}

function syncOwnerOnlyVisibility() {
  const ownerVisible = hasOwnerSession();
  document.querySelectorAll('[data-owner-only]').forEach((element) => {
    element.hidden = !ownerVisible;
  });
}

function requestAndStoreAdminKey() {
  let key = window.prompt('Enter admin access key to manage approvals:') || '';
  key = key.trim();
  if (!key) {
    return false;
  }
  sessionStorage.setItem('teyoAdminKey', key);
  return true;
}

function setAdminAccessMessage(text) {
  if (adminAccessMessage) {
    adminAccessMessage.textContent = text;
  }
}

async function ensureAdminAccess() {
  if (!isAdminPage()) {
    adminAccessGranted = false;
    return true;
  }

  if (hasOwnerSession()) {
    adminAccessGranted = true;
    setAdminAccessMessage('Owner access verified. All approval controls are enabled.');
    return true;
  }

  adminAccessGranted = false;
  setAdminAccessMessage('Owner access is required for this page.');
  return false;

}

async function verifyOwnerAccess() {
  const email = String(ownerEmailInput?.value || '').trim();
  const key = String(ownerKeyInput?.value || '').trim();

  if (!email || !key) {
    if (ownerAccessMessage) {
      ownerAccessMessage.textContent = 'Enter both your owner email and owner key.';
    }
    return false;
  }

  try {
    const response = await fetch('/api/owner/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerEmail: email, ownerKey: key })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      clearOwnerAccess();
      adminAccessGranted = false;
      if (ownerAccessMessage) {
        ownerAccessMessage.textContent = result.message || 'Owner access was rejected.';
      }
      return false;
    }

    requestAndStoreOwnerKey();
    adminAccessGranted = true;
    syncOwnerOnlyVisibility();
    initViewerBeacon();
    if (ownerAccessMessage) {
      ownerAccessMessage.textContent = 'Owner access unlocked. You now have the full privileged role.';
    }
    setAdminAccessMessage('Owner access verified. Approval controls are enabled.');
    return true;
  } catch (error) {
    if (ownerAccessMessage) {
      ownerAccessMessage.textContent = 'Unable to verify owner access right now.';
    }
    return false;
  }
}

async function verifyCompanyAccess() {
  const companyName = String(companyNameInput?.value || '').trim();
  const ownerEmail = String(companyOwnerEmailInput?.value || '').trim();
  const companyKey = String(companyAccessKeyInput?.value || '').trim();
  if (!companyName || !ownerEmail || !companyKey) {
    if (companyAccessMessage) {
      companyAccessMessage.textContent = 'Enter your company name, owner email, and company access key.';
    }
    return false;
  }

  try {
    const response = await fetch('/api/company/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, ownerEmail, companyKey })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      clearCompanyAccess();
      if (companyAccessMessage) {
        companyAccessMessage.textContent = result.message || 'Company access was rejected.';
      }
      return false;
    }

    sessionStorage.setItem(companyNameStorageKey, companyName);
    sessionStorage.setItem(companyEmailStorageKey, ownerEmail);
    sessionStorage.setItem(companyKeyStorageKey, companyKey);
    if (companyAccessMessage) {
      companyAccessMessage.textContent = `Company access unlocked for ${companyName}.`;
    }
    return true;
  } catch (error) {
    if (companyAccessMessage) {
      companyAccessMessage.textContent = 'Unable to verify company access right now.';
    }
    return false;
  }
}

function activateTab(tabName) {
  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === tabName);
  });
}

function normalize(text) {
  return String(text || '').trim().toLowerCase();
}

function normalizeSizeValue(value) {
  return String(value || '').trim().toUpperCase();
}

function getSelectedSizeFilter() {
  return sizeFilterSelect ? normalizeSizeValue(sizeFilterSelect.value) : 'ALL';
}

function isInStockStatus(status) {
  const raw = normalize(status);
  return (raw.includes('in') || raw.includes('available')) && !raw.includes('out');
}

function toMidnightTimestamp(isoDate) {
  const raw = String(isoDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return 0;
  }
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function formatDateLabel(isoDate) {
  const timestamp = toMidnightTimestamp(isoDate);
  if (!timestamp) {
    return '';
  }
  return new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getProductSizeInventory(product) {
  if (!Array.isArray(product?.sizeInventory)) {
    return [];
  }

  return product.sizeInventory
    .map((entry) => {
      const storeName = String(entry?.storeName || entry?.store || '').trim();
      const size = normalizeSizeValue(entry?.size);
      const stockStatus = String(entry?.stockStatus || entry?.status || '').trim();
      const restockDate = String(entry?.restockDate || '').trim();
      if (!storeName || !size) {
        return null;
      }
      return {
        storeName,
        size,
        stockStatus: stockStatus || 'Check availability',
        restockDate: /^\d{4}-\d{2}-\d{2}$/.test(restockDate) ? restockDate : ''
      };
    })
    .filter(Boolean);
}

function getProductSizes(product) {
  const fromOptions = Array.isArray(product?.sizeOptions) ? product.sizeOptions : [];
  const fromInventory = getProductSizeInventory(product).map((entry) => entry.size);
  return Array.from(new Set([...fromOptions, ...fromInventory].map((size) => normalizeSizeValue(size)).filter(Boolean)));
}

function getInventoryForSelectedSize(product, sizeFilter = 'ALL') {
  const inventory = getProductSizeInventory(product);
  if (sizeFilter === 'ALL') {
    return inventory;
  }
  return inventory.filter((entry) => normalizeSizeValue(entry.size) === sizeFilter);
}

function readStockReminders() {
  try {
    const raw = localStorage.getItem(stockReminderStorageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function writeStockReminders(reminders) {
  localStorage.setItem(stockReminderStorageKey, JSON.stringify(reminders));
}

function setStockReminderMessage(text) {
  if (stockReminderMessage) {
    stockReminderMessage.textContent = text;
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '#';
  }

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '#';
    }
    return parsed.toString();
  } catch (error) {
    return '#';
  }
}

function isValidBusinessWebsite(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return false;
  }

  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const hostname = new URL(normalized).hostname.toLowerCase();
    const blockedDomains = ['gmail.com','yahoo.com','outlook.com','hotmail.com','live.com','aol.com','mail.com','protonmail.com','icloud.com','zoho.com','gmx.com','msn.com','yandex.com','qq.com','163.com'];
    return hostname.includes('.') && hostname !== 'localhost' && !blockedDomains.includes(hostname) && !blockedDomains.some((domain) => hostname.endsWith(`.${domain}`));
  } catch (error) {
    return false;
  }
}

function isBusinessOwnerSubmission(companyName, websiteUrl) {
  return String(companyName || '').trim().length >= 2 && isValidBusinessWebsite(websiteUrl);
}

function validateSizeInventoryInput(value) {
  const lines = String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length < 3 || parts.length > 4) {
      return false;
    }

    const storeName = String(parts[0] || '').trim();
    const size = normalizeSizeValue(parts[1]);
    if (!storeName || !size) {
      return false;
    }

    if (parts[3]) {
      const date = String(parts[3]).trim();
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
      }
    }
  }
  return true;
}

function sizeInventoryToMultilineText(product) {
  const entries = Array.isArray(product?.sizeInventory) ? product.sizeInventory : [];
  return entries
    .map((entry) => {
      const storeName = String(entry?.storeName || entry?.store || '').trim();
      const size = normalizeSizeValue(entry?.size);
      const stockStatus = String(entry?.stockStatus || entry?.status || '').trim();
      const restockDate = String(entry?.restockDate || '').trim();
      if (!storeName || !size) {
        return '';
      }
      return [storeName, size, stockStatus || 'Check availability', restockDate].filter((part, index) => index < 3 || Boolean(part)).join('|');
    })
    .filter(Boolean)
    .join('\n');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

function normalizeHexColor(value, fallback = '#ffffff') {
  const input = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(input) ? input.toLowerCase() : fallback;
}

function normalizeThemeField(value, allowed, fallback) {
  const input = String(value || '').trim();
  return allowed.includes(input) ? input : fallback;
}

function getPlushieSymbol(name) {
  return plushieSymbols[name] || plushieSymbols.bear;
}

function getPresetTheme(presetName) {
  return customerCuteThemes[presetName] || customerCuteThemes.kawaii;
}

function getDefaultCustomerTheme() {
  const preset = customerCuteThemes.kawaii;
  return {
    accent: preset.accent,
    style: preset.style,
    preset: 'kawaii',
    plushie: preset.plushie,
    petName: '',
    petColor: preset.accent
  };
}

function lightenHex(hex, amount) {
  const color = normalizeHexColor(hex).replace('#', '');
  const clamp = (value) => Math.max(0, Math.min(255, value));
  const r = clamp(parseInt(color.slice(0, 2), 16) + amount);
  const g = clamp(parseInt(color.slice(2, 4), 16) + amount);
  const b = clamp(parseInt(color.slice(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getDefaultCustomerTheme() {
  return {
    accent: '#ffffff',
    style: 'midnight',
    preset: 'kawaii',
    plushie: 'bear',
    petName: '',
    petColor: '#ff9ad5',
    petColor2: '',
    petEarStyle: 'default',
    petTailStyle: 'default',
    petNoseStyle: 'default',
    petLegStyle: 'default'
  };
}

function readCustomerTheme() {
  try {
    const raw = localStorage.getItem(customerThemeStorageKey);
    if (!raw) {
      return getDefaultCustomerTheme();
    }

    const parsed = JSON.parse(raw);
    const preset = normalizeThemeField(parsed.preset, Object.keys(customerCuteThemes), getDefaultCustomerTheme().preset);
    const presetTheme = getPresetTheme(preset);
    const style = normalizeThemeField(parsed.style, customerStyleClasses.map((className) => className.replace('theme-style-', '')), presetTheme.style);
    const petPartStyleValues = ['default','perky','floppy','round','tall','none',
                                  'long','fluffy','wag','puff','curly','short',
                                  'button','heart','snout','wide','bill','stubby','waddle'];
    return {
      accent: normalizeHexColor(parsed.accent, presetTheme.accent),
      style,
      preset,
      plushie: normalizeThemeField(parsed.plushie, Object.keys(plushieSymbols), presetTheme.plushie),
      petName: String(parsed.petName || '').trim().slice(0, 16),
      petColor: normalizeHexColor(parsed.petColor, presetTheme.accent),
      petColor2: String(parsed.petColor2 || '').match(/^#[0-9a-fA-F]{6}$/i) ? parsed.petColor2.toLowerCase() : '',
      petEarStyle:  petPartStyleValues.includes(parsed.petEarStyle)  ? parsed.petEarStyle  : 'default',
      petTailStyle: petPartStyleValues.includes(parsed.petTailStyle) ? parsed.petTailStyle : 'default',
      petNoseStyle: petPartStyleValues.includes(parsed.petNoseStyle) ? parsed.petNoseStyle : 'default',
      petLegStyle:  petPartStyleValues.includes(parsed.petLegStyle)  ? parsed.petLegStyle  : 'default'
    };
  } catch (error) {
    return getDefaultCustomerTheme();
  }
}

function saveCustomerTheme(theme) {
  localStorage.setItem(customerThemeStorageKey, JSON.stringify(theme));
}

function isCustomerThemeUnlocked() {
  return localStorage.getItem(customerThemeUnlockedKey) === 'true';
}

function setCustomerThemeUnlocked(value) {
  localStorage.setItem(customerThemeUnlockedKey, value ? 'true' : 'false');
}

function applyCustomerTheme(theme) {
  const presetName = normalizeThemeField(theme.preset, Object.keys(customerCuteThemes), getDefaultCustomerTheme().preset);
  const presetTheme = getPresetTheme(presetName);
  const safeTheme = {
    accent: normalizeHexColor(theme.accent, presetTheme.accent),
    style: normalizeThemeField(theme.style, customerStyleClasses.map((className) => className.replace('theme-style-', '')), presetTheme.style),
    preset: presetName,
    plushie: normalizeThemeField(theme.plushie, Object.keys(plushieSymbols), presetTheme.plushie),
    petName: String(theme.petName || '').trim().slice(0, 16),
    petColor: normalizeHexColor(theme.petColor, presetTheme.accent),
    petColor2: String(theme.petColor2 || '').match(/^#[0-9a-fA-F]{6}$/i) ? theme.petColor2.toLowerCase() : '',
    petEarStyle:  String(theme.petEarStyle  || 'default'),
    petTailStyle: String(theme.petTailStyle || 'default'),
    petNoseStyle: String(theme.petNoseStyle || 'default'),
    petLegStyle:  String(theme.petLegStyle  || 'default')
  };

  document.body.style.setProperty('--accent', safeTheme.accent);
  document.body.style.setProperty('--accent-soft', lightenHex(safeTheme.accent, 20));

  document.body.classList.remove(...customerStyleClasses);
  document.body.classList.add(`theme-style-${safeTheme.style}`);
  document.body.classList.remove(...customerPresetClasses);
  document.body.classList.add(`theme-preset-${safeTheme.preset}`);

  if (customerAccentColor) {
    customerAccentColor.value = safeTheme.accent;
  }
  if (customerStyleSelect) {
    customerStyleSelect.value = safeTheme.style;
  }
  if (customerPlushieSelect) {
    customerPlushieSelect.value = safeTheme.plushie;
  }
  if (customerPetNameInput) {
    customerPetNameInput.value = safeTheme.petName;
  }
  if (customerPetColorInput) {
    customerPetColorInput.value = safeTheme.petColor;
  }
  if (customerPetColor2Input) {
    customerPetColor2Input.value = safeTheme.petColor2 || lightenHex(safeTheme.petColor, 50);
  }
  if (customerPetEarSelect)  { customerPetEarSelect.value  = safeTheme.petEarStyle; }
  if (customerPetTailSelect) { customerPetTailSelect.value = safeTheme.petTailStyle; }
  if (customerPetNoseSelect) { customerPetNoseSelect.value = safeTheme.petNoseStyle; }
  if (customerPetLegSelect)  { customerPetLegSelect.value  = safeTheme.petLegStyle; }
  if (customerPlushiePreview) {
    customerPlushiePreview.textContent = getPlushieSymbol(safeTheme.plushie);
  }
  if (customerPlushieCaption && safeTheme.petName) {
    customerPlushieCaption.textContent = `${escapeHtml(safeTheme.petName)} will float at the bottom of every page after you verify your paid access.`;
  }

  updateCuteDecorLayer(safeTheme);
}

function setCustomerThemePanelState(unlocked) {
  if (!customerThemePanel || !customerThemeControls) {
    return;
  }

  customerThemePanel.classList.toggle('is-locked', !unlocked);
  customerThemeControls.toggleAttribute('hidden', !unlocked);
  document.body.classList.toggle('customer-cute-active', unlocked);
  updateCuteDecorLayer(readCustomerTheme());
}

function ensureCuteDecorLayer() {
  let layer = document.getElementById('customerCuteDecorLayer');
  if (layer) return layer;
  layer = document.createElement('div');
  layer.id = 'customerCuteDecorLayer';
  layer.className = 'customer-cute-layer';
  layer.innerHTML = `
    <div class="pet-character pet-action-idle" data-slot="plushie">
      <div class="pet-svg-wrap"></div>
      <small class="pet-name-tag"></small>
    </div>
  `;
  document.body.appendChild(layer);
  return layer;
}

/* ── SVG Pet builder ───────────────────────────────────────────────── */

const petPartDefaults = {
  cat:     { ear: 'perky',  tail: 'long',   nose: 'button', leg: 'stubby' },
  dog:     { ear: 'floppy', tail: 'wag',    nose: 'snout',  leg: 'stubby' },
  bunny:   { ear: 'tall',   tail: 'puff',   nose: 'button', leg: 'stubby' },
  bear:    { ear: 'round',  tail: 'none',   nose: 'snout',  leg: 'stubby' },
  frog:    { ear: 'none',   tail: 'none',   nose: 'wide',   leg: 'stubby' },
  hamster: { ear: 'round',  tail: 'none',   nose: 'button', leg: 'stubby' },
  panda:   { ear: 'round',  tail: 'none',   nose: 'snout',  leg: 'stubby' },
  fox:     { ear: 'perky',  tail: 'fluffy', nose: 'button', leg: 'stubby' },
  duck:    { ear: 'none',   tail: 'none',   nose: 'bill',   leg: 'waddle' },
  star:    { ear: 'none',   tail: 'none',   nose: 'button', leg: 'none'   }
};

function _petEarSVG(style, c, c2) {
  switch (style) {
    case 'perky':
      return `<polygon class="pet-ear-l" points="24,42 33,11 46,38" fill="${c}"/><polygon points="27,40 34,15 43,36" fill="${c2}"/>`
           + `<polygon class="pet-ear-r" points="54,38 67,11 76,42" fill="${c}"/><polygon points="57,36 66,15 73,40" fill="${c2}"/>`;
    case 'floppy':
      return `<path class="pet-ear-l" d="M33,36 Q13,46 20,71 Q27,85 38,74 Q48,58 33,36Z" fill="${c}"/>`
           + `<path d="M33,44 Q17,52 23,68 Q29,78 37,69 Q44,56 33,44Z" fill="${c2}"/>`
           + `<path class="pet-ear-r" d="M67,36 Q87,46 80,71 Q73,85 62,74 Q52,58 67,36Z" fill="${c}"/>`
           + `<path d="M67,44 Q83,52 77,68 Q71,78 63,69 Q56,56 67,44Z" fill="${c2}"/>`;
    case 'round':
      return `<circle class="pet-ear-l" cx="27" cy="18" r="13" fill="${c}"/><circle cx="27" cy="18" r="8" fill="${c2}"/>`
           + `<circle class="pet-ear-r" cx="73" cy="18" r="13" fill="${c}"/><circle cx="73" cy="18" r="8" fill="${c2}"/>`;
    case 'tall':
      return `<ellipse class="pet-ear-l" cx="34" cy="11" rx="9" ry="22" fill="${c}"/><ellipse cx="34" cy="11" rx="5" ry="16" fill="${c2}"/>`
           + `<ellipse class="pet-ear-r" cx="66" cy="11" rx="9" ry="22" fill="${c}"/><ellipse cx="66" cy="11" rx="5" ry="16" fill="${c2}"/>`;
    default: return '';
  }
}

function _petTailSVG(style, c, c2) {
  switch (style) {
    case 'long':   return `<path class="pet-tail" d="M66,88 Q92,70 78,44 Q68,24 82,12" stroke="${c}" stroke-width="11" fill="none" stroke-linecap="round"/>`;
    case 'fluffy': return `<path class="pet-tail" d="M68,87 Q94,68 82,42 Q72,22 86,12" stroke="${c}" stroke-width="14" fill="none" stroke-linecap="round"/>`
                        + `<path d="M68,87 Q94,68 82,42 Q72,22 86,12" stroke="${c2}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    case 'wag':    return `<ellipse class="pet-tail" cx="74" cy="78" rx="8" ry="17" fill="${c}" transform="rotate(-22,74,78)"/>`;
    case 'puff':   return `<circle class="pet-tail" cx="73" cy="90" r="12" fill="${c2}"/>`;
    case 'curly':  return `<path class="pet-tail" d="M70,90 Q97,78 89,57 Q81,37 67,49 Q54,61 63,75" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    case 'short':  return `<ellipse class="pet-tail" cx="72" cy="90" rx="10" ry="9" fill="${c}"/>`;
    default: return '';
  }
}

function _petNoseSVG(style, c, c2) {
  const dk = '#1a1a1a';
  switch (style) {
    case 'button': return `<ellipse cx="50" cy="52" rx="4" ry="3" fill="${dk}"/>`;
    case 'heart':  return `<path d="M50,56 Q46,52 46,49 Q46,46 49,46 Q50,46 50,48 Q50,46 51,46 Q54,46 54,49 Q54,52 50,56Z" fill="#ff6b8a"/>`;
    case 'round':  return `<circle cx="50" cy="52" r="5.5" fill="${dk}"/>`;
    case 'snout':  return `<ellipse cx="50" cy="54" rx="10" ry="7" fill="${c2}"/><ellipse cx="50" cy="55" rx="5" ry="3.5" fill="${dk}"/>`;
    case 'wide':   return `<ellipse cx="50" cy="55" rx="7" ry="4.5" fill="${dk}"/>`;
    case 'bill':   return `<ellipse cx="62" cy="57" rx="14" ry="7" fill="#ffc04a" transform="rotate(-10,62,57)"/>`;
    default: return '';
  }
}

function _petLegSVG(style, c) {
  switch (style) {
    case 'stubby': return `<rect class="pet-leg-l" x="26" y="104" width="18" height="22" rx="9" fill="${c}"/>`
                        + `<rect class="pet-leg-r" x="56" y="104" width="18" height="22" rx="9" fill="${c}"/>`;
    case 'long':   return `<rect class="pet-leg-l" x="28" y="97" width="15" height="30" rx="7" fill="${c}"/>`
                        + `<rect class="pet-leg-r" x="57" y="97" width="15" height="30" rx="7" fill="${c}"/>`;
    case 'waddle': return `<ellipse class="pet-leg-l" cx="34" cy="116" rx="16" ry="8" fill="#ffc04a"/>`
                        + `<ellipse class="pet-leg-r" cx="66" cy="116" rx="16" ry="8" fill="#ffc04a"/>`;
    default: return '';
  }
}

function buildPetSVG(type, c, c2, opts = {}) {
  const defs = petPartDefaults[type] || petPartDefaults.bear;
  const ear  = (!opts.ear  || opts.ear  === 'default') ? defs.ear  : opts.ear;
  const tail = (!opts.tail || opts.tail === 'default') ? defs.tail : opts.tail;
  const nose = (!opts.nose || opts.nose === 'default') ? defs.nose : opts.nose;
  const leg  = (!opts.leg  || opts.leg  === 'default') ? defs.leg  : opts.leg;

  const dk = '#1a1a1a';
  const wh = '#ffffff';
  const ears  = _petEarSVG(ear, c, c2);
  const tails = _petTailSVG(tail, c, c2);
  const noses = _petNoseSVG(nose, c, c2);
  const legs  = _petLegSVG(leg, c);

  // Large cartoon eyes — head centred at cy=40
  const eyesSt = `<circle class="pet-eye-l" cx="38" cy="38" r="8" fill="${wh}"/><circle class="pet-eye-r" cx="62" cy="38" r="8" fill="${wh}"/>`
               + `<circle cx="39" cy="38" r="5" fill="${dk}"/><circle cx="63" cy="38" r="5" fill="${dk}"/>`
               + `<circle cx="41" cy="36" r="2" fill="${wh}"/><circle cx="65" cy="36" r="2" fill="${wh}"/>`;
  const mouth = `<path d="M43,58 Q50,64 57,58" stroke="${dk}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  const wrap = (inner) => `<svg class="pet-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 6px 14px rgba(0,0,0,0.38))">${inner}</svg>`;

  if (type === 'star') {
    return wrap(
      `<polygon class="pet-body" points="50,8 62,35 92,35 68,54 77,82 50,64 23,82 32,54 8,35 38,35" fill="${c}"/>`
    + `<polygon points="50,20 59,38 80,38 64,50 70,70 50,57 30,70 36,50 20,38 41,38" fill="${c2}"/>`
    + `<circle class="pet-eye-l" cx="40" cy="47" r="6" fill="${wh}"/><circle class="pet-eye-r" cx="60" cy="47" r="6" fill="${wh}"/>`
    + `<circle cx="40" cy="47" r="4" fill="${dk}"/><circle cx="60" cy="47" r="4" fill="${dk}"/>`
    + `<circle cx="41.5" cy="45.5" r="1.8" fill="${wh}"/><circle cx="61.5" cy="45.5" r="1.8" fill="${wh}"/>`
    + noses
    + `<path d="M44,55 Q50,60 56,55" stroke="${dk}" stroke-width="1.5" fill="none"/>`);
  }

  if (type === 'frog') {
    const fLegs = _petLegSVG(leg === 'none' ? 'none' : 'stubby', c);
    return wrap(
      tails + fLegs
    + `<ellipse class="pet-body" cx="50" cy="96" rx="30" ry="22" fill="${c}"/>`
    + `<ellipse cx="50" cy="100" rx="19" ry="15" fill="${c2}"/>`
    + `<ellipse class="pet-paw-l" cx="22" cy="90" rx="10" ry="8" fill="${c}"/><ellipse class="pet-paw-r" cx="78" cy="90" rx="10" ry="8" fill="${c}"/>`
    + ears
    + `<circle class="pet-head" cx="50" cy="58" r="25" fill="${c}"/>`
    + `<circle cx="33" cy="32" r="14" fill="${c}"/><circle cx="33" cy="32" r="11" fill="${wh}"/><circle cx="33" cy="32" r="7" fill="${dk}"/><circle cx="35" cy="30" r="3" fill="${wh}"/>`
    + `<circle cx="67" cy="32" r="14" fill="${c}"/><circle cx="67" cy="32" r="11" fill="${wh}"/><circle cx="67" cy="32" r="7" fill="${dk}"/><circle cx="69" cy="30" r="3" fill="${wh}"/>`
    + noses
    + `<path d="M38,68 Q50,76 62,68" stroke="${dk}" stroke-width="2" fill="none" stroke-linecap="round"/>`);
  }

  if (type === 'duck') {
    const dLegs = _petLegSVG('waddle', c);
    const dEyes = `<circle class="pet-eye-l" cx="38" cy="49" r="7" fill="${wh}"/><circle class="pet-eye-r" cx="60" cy="49" r="7" fill="${wh}"/>`
                + `<circle cx="38" cy="49" r="4.5" fill="${dk}"/><circle cx="60" cy="49" r="4.5" fill="${dk}"/>`
                + `<circle cx="39.5" cy="47.5" r="1.8" fill="${wh}"/><circle cx="61.5" cy="47.5" r="1.8" fill="${wh}"/>`;
    return wrap(
      dLegs
    + `<ellipse class="pet-wing-l" cx="21" cy="89" rx="10" ry="21" fill="${c}" transform="rotate(20,21,89)"/>`
    + `<ellipse class="pet-wing-r" cx="79" cy="89" rx="10" ry="21" fill="${c}" transform="rotate(-20,79,89)"/>`
    + `<ellipse class="pet-body" cx="50" cy="91" rx="28" ry="22" fill="${c}"/>`
    + `<ellipse cx="50" cy="96" rx="16" ry="12" fill="${c2}"/>`
    + ears
    + `<circle class="pet-head" cx="50" cy="52" r="22" fill="${c}"/>`
    + noses + dEyes);
  }

  if (type === 'hamster') {
    return wrap(
      tails + legs
    + `<ellipse class="pet-body" cx="50" cy="92" rx="24" ry="20" fill="${c}"/>`
    + `<ellipse cx="50" cy="96" rx="14" ry="13" fill="${c2}"/>`
    + `<ellipse class="pet-paw-l" cx="27" cy="87" rx="9" ry="7" fill="${c}"/><ellipse class="pet-paw-r" cx="73" cy="87" rx="9" ry="7" fill="${c}"/>`
    + ears
    + `<rect x="41" y="64" width="18" height="9" rx="4" fill="${c}"/>`
    + `<circle class="pet-head" cx="50" cy="40" r="26" fill="${c}"/>`
    + `<ellipse cx="24" cy="48" rx="15" ry="12" fill="${c2}"/><ellipse cx="76" cy="48" rx="15" ry="12" fill="${c2}"/>`
    + eyesSt + noses + mouth);
  }

  if (type === 'panda') {
    const pEars = _petEarSVG('round', dk, dk);
    const pLegs = _petLegSVG(leg, dk);
    const pTail = _petTailSVG(tail, dk, wh);
    return wrap(
      pTail + pLegs
    + `<ellipse class="pet-body" cx="50" cy="91" rx="24" ry="20" fill="${wh}"/>`
    + `<ellipse cx="50" cy="95" rx="14" ry="13" fill="${c2}"/>`
    + `<ellipse class="pet-paw-l" cx="27" cy="87" rx="9" ry="7" fill="${dk}"/><ellipse class="pet-paw-r" cx="73" cy="87" rx="9" ry="7" fill="${dk}"/>`
    + pEars
    + `<rect x="41" y="64" width="18" height="9" rx="4" fill="${wh}"/>`
    + `<circle class="pet-head" cx="50" cy="40" r="26" fill="${wh}"/>`
    + `<ellipse cx="37" cy="39" rx="10" ry="9" fill="${dk}"/><ellipse cx="63" cy="39" rx="10" ry="9" fill="${dk}"/>`
    + eyesSt + noses + mouth);
  }

  if (type === 'fox') {
    return wrap(
      tails + legs
    + `<ellipse class="pet-body" cx="50" cy="91" rx="24" ry="20" fill="${c}"/>`
    + `<ellipse cx="50" cy="95" rx="14" ry="13" fill="${c2}"/>`
    + `<ellipse class="pet-paw-l" cx="27" cy="87" rx="9" ry="7" fill="${c}"/><ellipse class="pet-paw-r" cx="73" cy="87" rx="9" ry="7" fill="${c}"/>`
    + ears
    + `<rect x="41" y="64" width="18" height="9" rx="4" fill="${c}"/>`
    + `<circle class="pet-head" cx="50" cy="40" r="26" fill="${c}"/>`
    + `<ellipse cx="38" cy="50" rx="11" ry="9" fill="${c2}"/><ellipse cx="62" cy="50" rx="11" ry="9" fill="${c2}"/>`
    + eyesSt + noses + mouth);
  }

  // cat / dog / bunny / bear
  const catWhiskers = type === 'cat'
    ? `<line x1="14" y1="53" x2="40" y2="55" stroke="#ccc" stroke-width="1.4"/><line x1="14" y1="59" x2="40" y2="60" stroke="#ccc" stroke-width="1.4"/>`
    + `<line x1="60" y1="55" x2="86" y2="53" stroke="#ccc" stroke-width="1.4"/><line x1="60" y1="60" x2="86" y2="59" stroke="#ccc" stroke-width="1.4"/>` : '';
  const dogTongue = type === 'dog'
    ? `<ellipse cx="50" cy="62" rx="6" ry="5" fill="#ff8080"/><ellipse cx="50" cy="64" rx="3.5" ry="2" fill="#ff6060"/>` : '';

  return wrap(
    tails + legs
  + `<ellipse class="pet-body" cx="50" cy="91" rx="24" ry="20" fill="${c}"/>`
  + `<ellipse cx="50" cy="95" rx="14" ry="13" fill="${c2}"/>`
  + `<ellipse class="pet-paw-l" cx="27" cy="87" rx="9" ry="7" fill="${c}"/><ellipse class="pet-paw-r" cx="73" cy="87" rx="9" ry="7" fill="${c}"/>`
  + ears
  + `<rect x="41" y="64" width="18" height="9" rx="4" fill="${c}"/>`
  + `<circle class="pet-head" cx="50" cy="40" r="26" fill="${c}"/>`
  + eyesSt + noses
  + catWhiskers + dogTongue
  + (type !== 'dog' ? mouth : ''));
}
/* ───────────────────────────────────────────────────────── */


/* ── Pet animation system ────────────────────────────────────────── */
const petActionSeq = {
  cat:     [{cls:'pet-action-idle',ms:3200},{cls:'pet-action-a',ms:1800},{cls:'pet-action-idle',ms:2400},{cls:'pet-action-b',ms:2200},{cls:'pet-action-idle',ms:4000},{cls:'pet-action-c',ms:900}],
  dog:     [{cls:'pet-action-idle',ms:2200},{cls:'pet-action-a',ms:1200},{cls:'pet-action-idle',ms:2800},{cls:'pet-action-b',ms:1000}],
  bunny:   [{cls:'pet-action-idle',ms:2000},{cls:'pet-action-a',ms:1100},{cls:'pet-action-idle',ms:2800},{cls:'pet-action-b',ms:800}],
  bear:    [{cls:'pet-action-idle',ms:3800},{cls:'pet-action-a',ms:2200},{cls:'pet-action-idle',ms:4200}],
  frog:    [{cls:'pet-action-idle',ms:2800},{cls:'pet-action-a',ms:900},{cls:'pet-action-idle',ms:3200},{cls:'pet-action-b',ms:700}],
  hamster: [{cls:'pet-action-idle',ms:1600},{cls:'pet-action-a',ms:900},{cls:'pet-action-idle',ms:2000},{cls:'pet-action-b',ms:700}],
  panda:   [{cls:'pet-action-idle',ms:3800},{cls:'pet-action-a',ms:2200},{cls:'pet-action-idle',ms:4200}],
  fox:     [{cls:'pet-action-idle',ms:2600},{cls:'pet-action-a',ms:1600},{cls:'pet-action-idle',ms:3000},{cls:'pet-action-b',ms:1200}],
  duck:    [{cls:'pet-action-idle',ms:2200},{cls:'pet-action-a',ms:1400},{cls:'pet-action-idle',ms:2600},{cls:'pet-action-b',ms:900}],
  star:    [{cls:'pet-action-idle',ms:1800},{cls:'pet-action-a',ms:1400},{cls:'pet-action-idle',ms:2200},{cls:'pet-action-b',ms:1100}]
};

let _petTimer = null;
let _petSeqIdx = 0;
let _petCurrentType = '';

function startPetAnimation(petType) {
  if (_petTimer) clearTimeout(_petTimer);
  if (_petCurrentType !== petType) { _petSeqIdx = 0; _petCurrentType = petType; }
  _runNextPetFrame();
}

function stopPetAnimation() {
  if (_petTimer) clearTimeout(_petTimer);
  _petTimer = null;
}

function _runNextPetFrame() {
  const seq = petActionSeq[_petCurrentType] || petActionSeq.bear;
  const frame = seq[_petSeqIdx % seq.length];
  _petSeqIdx++;

  const layer = document.getElementById('customerCuteDecorLayer');
  if (!layer || layer.hidden) return;
  const petChar = layer.querySelector('.pet-character');
  if (!petChar) return;

  petChar.className = petChar.className.replace(/\bpet-action-\S+/g, '').trim() + ' ' + frame.cls;
  _petTimer = setTimeout(_runNextPetFrame, frame.ms);
}
/* ────────────────────────────────────────────────────────────────── */

function updateCuteDecorLayer(theme) {
  const layer = ensureCuteDecorLayer();
  const active = isCustomerThemeUnlocked() || hasOwnerSession();
  layer.hidden = !active;
  if (!active) { stopPetAnimation(); return; }

  const safeType  = normalizeThemeField(theme.plushie, Object.keys(plushieSymbols), 'bear');
  const safeColor = normalizeHexColor(theme.petColor || theme.accent, '#ff9ad5');
  const resolvedC2 = String(theme.petColor2 || '').match(/^#[0-9a-fA-F]{6}$/i)
    ? theme.petColor2.toLowerCase()
    : lightenHex(safeColor, 50);
  const safeName  = String(theme.petName || '').trim().slice(0, 16);
  const partOpts  = {
    ear:  String(theme.petEarStyle  || 'default'),
    tail: String(theme.petTailStyle || 'default'),
    nose: String(theme.petNoseStyle || 'default'),
    leg:  String(theme.petLegStyle  || 'default')
  };

  const petChar = layer.querySelector('[data-slot="plushie"]');
  if (!petChar) return;

  const svgKey = `${safeType}|${safeColor}|${resolvedC2}|${partOpts.ear}|${partOpts.tail}|${partOpts.nose}|${partOpts.leg}`;
  if (petChar.dataset.svgKey !== svgKey) {
    const svgWrap = petChar.querySelector('.pet-svg-wrap');
    if (svgWrap) svgWrap.innerHTML = buildPetSVG(safeType, safeColor, resolvedC2, partOpts);
    petChar.dataset.svgKey   = svgKey;
    petChar.dataset.petType  = safeType;
    petChar.dataset.petColor = safeColor;
    const typeClasses = Object.keys(plushieSymbols).map(t => `pet-type-${t}`);
    petChar.classList.remove(...typeClasses);
    petChar.classList.add(`pet-type-${safeType}`);
    startPetAnimation(safeType);
  }

  const nameTag = petChar.querySelector('.pet-name-tag');
  if (nameTag) nameTag.textContent = safeName;
}

function initializeCustomerTheme() {
  const unlocked = isCustomerThemeUnlocked();
  const savedTheme = readCustomerTheme();

  if (hasOwnerSession()) {
    setCustomerThemeUnlocked(true);
  }

  // Apply saved theme on EVERY page when the user has active access
  if (unlocked || hasOwnerSession()) {
    applyCustomerTheme(savedTheme);
  }

  // Everything below is marketplace-panel-only setup
  if (!customerThemePanel) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get('customer_checkout');
  if (checkoutStatus === 'success' && customerCheckoutMessage) {
    customerCheckoutMessage.textContent = 'Payment received. Verify your email below to unlock private personalization.';
  } else if (checkoutStatus === 'cancelled' && customerCheckoutMessage) {
    customerCheckoutMessage.textContent = 'Checkout was cancelled. You can restart anytime.';
  }

  // Also apply for preview on the marketplace page even if not yet unlocked
  if (!(unlocked || hasOwnerSession())) {
    applyCustomerTheme(savedTheme);
  }

  setCustomerThemePanelState(unlocked || hasOwnerSession());

  if (customerPresetButtons) {
    customerPresetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!isCustomerThemeUnlocked()) {
          return;
        }
        const presetName = normalizeThemeField(button.dataset.preset, Object.keys(customerCuteThemes), 'kawaii');
        const presetTheme = getPresetTheme(presetName);
        const nextTheme = {
          ...readCustomerTheme(),
          preset: presetName,
          accent: presetTheme.accent,
          style: presetTheme.style,
          plushie: presetTheme.plushie
        };
        saveCustomerTheme(nextTheme);
        applyCustomerTheme(nextTheme);
      });
    });
  }

  if (customerVerifyAccessBtn) {
    customerVerifyAccessBtn.addEventListener('click', async () => {
      const customerEmail = String(customerEmailInput?.value || '').trim();
      if (!customerEmail) {
        if (customerPaymentMessage) {
          customerPaymentMessage.textContent = 'Enter the same email you used during checkout to verify access.';
        }
        return;
      }

      try {
        const response = await fetch('/api/customer/theme-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attachOwnerAuth({ customerEmail }))
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          if (customerPaymentMessage) {
            customerPaymentMessage.textContent = result.message || 'Access not active yet for this email.';
          }
          return;
        }

        setCustomerThemeUnlocked(true);
        setCustomerThemePanelState(true);
        applyCustomerTheme(readCustomerTheme());
        if (customerPaymentMessage) {
          customerPaymentMessage.textContent = 'Private style unlocked for this browser only. Other visitors will not see your changes.';
        }
      } catch (error) {
        if (customerPaymentMessage) {
          customerPaymentMessage.textContent = 'Unable to verify access right now. Please try again.';
        }
      }
    });
  }

  if (customerAccentColor) {
    customerAccentColor.addEventListener('input', () => {
      if (!isCustomerThemeUnlocked()) {
        return;
      }
      const nextTheme = {
        ...readCustomerTheme(),
        accent: normalizeHexColor(customerAccentColor.value, '#ffffff')
      };
      saveCustomerTheme(nextTheme);
      applyCustomerTheme(nextTheme);
    });
  }

  if (customerStyleSelect) {
    customerStyleSelect.addEventListener('change', () => {
      if (!isCustomerThemeUnlocked()) {
        return;
      }
      const nextTheme = {
        ...readCustomerTheme(),
        style: customerStyleSelect.value
      };
      saveCustomerTheme(nextTheme);
      applyCustomerTheme(nextTheme);
    });
  }

  if (customerPlushieSelect) {
    customerPlushieSelect.addEventListener('change', () => {
      if (!isCustomerThemeUnlocked()) {
        return;
      }
      const nextTheme = {
        ...readCustomerTheme(),
        plushie: normalizeThemeField(customerPlushieSelect.value, Object.keys(plushieSymbols), 'bear')
      };
      saveCustomerTheme(nextTheme);
      applyCustomerTheme(nextTheme);
    });
  }

  if (customerPetNameInput) {
    customerPetNameInput.addEventListener('input', () => {
      if (!isCustomerThemeUnlocked()) {
        return;
      }
      const nextTheme = {
        ...readCustomerTheme(),
        petName: customerPetNameInput.value.trim().slice(0, 16)
      };
      saveCustomerTheme(nextTheme);
      applyCustomerTheme(nextTheme);
    });
  }

  if (customerPetColorInput) {
    customerPetColorInput.addEventListener('input', () => {
      if (!isCustomerThemeUnlocked()) {
        return;
      }
      const nextTheme = {
        ...readCustomerTheme(),
        petColor: normalizeHexColor(customerPetColorInput.value, '#ff9ad5')
      };
      saveCustomerTheme(nextTheme);
      applyCustomerTheme(nextTheme);
    });
  }

  const _petPartListeners = [
    { el: customerPetColor2Input, field: 'petColor2',   norm: (v) => normalizeHexColor(v, '#ff9ad5') },
    { el: customerPetEarSelect,   field: 'petEarStyle',  norm: (v) => v },
    { el: customerPetTailSelect,  field: 'petTailStyle', norm: (v) => v },
    { el: customerPetNoseSelect,  field: 'petNoseStyle', norm: (v) => v },
    { el: customerPetLegSelect,   field: 'petLegStyle',  norm: (v) => v }
  ];
  _petPartListeners.forEach(({ el, field, norm }) => {
    if (!el) return;
    el.addEventListener('input', () => {
      if (!isCustomerThemeUnlocked()) return;
      const nextTheme = { ...readCustomerTheme(), [field]: norm(el.value) };
      saveCustomerTheme(nextTheme);
      applyCustomerTheme(nextTheme);
    });
  });

  if (customerResetThemeBtn) {
    customerResetThemeBtn.addEventListener('click', () => {
      const defaults = getDefaultCustomerTheme();
      saveCustomerTheme(defaults);
      applyCustomerTheme(defaults);
      document.body.classList.remove('customer-cute-active');
      if (customerPaymentMessage) {
        customerPaymentMessage.textContent = 'Your private style was reset for this browser.';
      }
    });
  }
}

function isVisibleProduct(product) {
  const partnerMatch = marketplaceState.partners.find((partner) => normalize(partner.companyName) === normalize(product.companyName || product.company));
  if (!partnerMatch) {
    return false;
  }

  return Boolean(partnerMatch.activeListing && partnerMatch.paid && product.approved && product.visible);
}

function filteredProducts() {
  const query = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();
  const category = categorySelect ? categorySelect.value : 'all';
  const sizeFilter = getSelectedSizeFilter();
  const inStockOnly = Boolean(sizeInStockOnly?.checked);
  const visibleProducts = marketplaceState.products.filter((product) => isVisibleProduct(product));
  return visibleProducts.filter((product) => {
    const categoryMatch = category === 'all' || product.category === category;
    const sizes = getProductSizes(product);
    const selectedInventory = getInventoryForSelectedSize(product, sizeFilter);
    const sizeMatch = sizeFilter === 'ALL' || sizes.includes(sizeFilter) || selectedInventory.length > 0;
    const stockMatch = !inStockOnly
      || (sizeFilter === 'ALL'
        ? (selectedInventory.length ? selectedInventory.some((entry) => isInStockStatus(entry.stockStatus)) : isInStockStatus(product.stockStatus))
        : selectedInventory.some((entry) => isInStockStatus(entry.stockStatus)));
    const searchBlob = `${product.productName || product.name} ${product.companyName || product.company} ${product.description || ''} ${product.category || ''} ${sizes.join(' ')}`.toLowerCase();
    const searchMatch = !query || searchBlob.includes(query);
    return categoryMatch && sizeMatch && stockMatch && searchMatch;
  });
}

function renderResults() {
  if (!resultsList) return;

  const items = filteredProducts();
  resultsList.innerHTML = '';

  if (!items.length) {
    const sizeText = getSelectedSizeFilter() === 'ALL' ? '' : ` for size ${escapeHtml(getSelectedSizeFilter())}`;
    resultsList.innerHTML = `<p>No approved brand listings match your current filters${sizeText}. New company listings stay hidden until the $249 placement fee is approved and the product is reviewed.</p>`;
    if (selectedProduct) {
      selectedProduct.innerHTML = '<p>Select a verified product to view pricing, store availability, and safety guidance.</p>';
    }
    return;
  }

  const firstItem = items[0];
  renderProduct(firstItem);

  items.forEach((product) => {
    const item = document.createElement('div');
    item.className = `result-item ${product.id === firstItem.id ? 'active' : ''}`;
    const safeProductName = escapeHtml(product.productName || product.name);
    const safeCompanyName = escapeHtml(product.companyName || product.company);
    const safeDescription = escapeHtml(product.description || 'Approved listing pending review details.');
    const safePrice = escapeHtml(product.price || '');
    const safeImageUrl = safeUrl(product.imageUrl || '');
    const thumbnailMarkup = product.imageUrl
      ? `<img src="${safeImageUrl}" alt="${safeProductName}" class="result-thumb" />`
      : '<div class="result-thumb result-thumb-placeholder" aria-hidden="true">No image</div>';
    item.innerHTML = `
      <div class="result-item-main">
        ${thumbnailMarkup}
        <div class="result-item-copy">
          <h4>${safeProductName}</h4>
          <p>${safeCompanyName} • ${safeDescription}</p>
        </div>
      </div>
      <div class="result-meta">
        <span class="badge">${safePrice}</span>
        ${product.verifiedSeller ? '<span class="badge success-badge">Verified seller</span>' : ''}
      </div>
    `;
    item.addEventListener('click', () => renderProduct(product));
    resultsList.appendChild(item);
  });
}

function getSafetySummary(product) {
  return product.safetyNote
    ? `Safety note: ${escapeHtml(product.safetyNote)}`
    : 'Safety information is provided by the brand and should be verified before purchase.';
}

let _storeLookupToken = 0;
const _autoStoreCache = new Map();

function classifyStockBadge(status, fallbackStatus = '', restockDate = '') {
  const raw = String(status || fallbackStatus || '').toLowerCase();
  const cls = raw.includes('out') ? 'stock-out'
    : (raw.includes('low') || raw.includes('limited')) ? 'stock-low'
    : (raw.includes('in') || raw.includes('available')) ? 'stock-in'
    : 'stock-unknown';
  const baseLabel = raw.includes('out') ? 'Out of stock'
    : (raw.includes('low') || raw.includes('limited')) ? 'Low stock'
    : (raw.includes('in') || raw.includes('available')) ? 'In stock'
    : (status || fallbackStatus || 'Check availability');
  const restockLabel = formatDateLabel(restockDate);
  const label = restockLabel && (raw.includes('out') || raw.includes('low'))
    ? `${baseLabel} • Restock ${restockLabel}`
    : baseLabel;
  return { cls, label };
}

function normalizeStoreEntries(stores, fallbackStockStatus = '') {
  if (!Array.isArray(stores)) {
    return [];
  }

  return stores
    .map((entry) => {
      const raw = String(entry || '').trim();
      if (!raw) {
        return null;
      }

      const [namePart, statusPart] = raw.split('|');
      const name = String(namePart || '').trim();
      const stockStatus = String(statusPart || '').trim();
      if (!name || name.toLowerCase().includes('confirmed by the brand')) {
        return null;
      }

      return {
        name,
        stockStatus: stockStatus || fallbackStockStatus || '',
        source: 'manual'
      };
    })
    .filter(Boolean);
}

function mergeStoreEntries(manualEntries, autoEntries) {
  const merged = [];
  const seen = new Set();

  const append = (entry) => {
    const name = String(entry?.name || '').trim();
    if (!name) {
      return;
    }

    const key = normalize(name);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(entry);
  };

  (manualEntries || []).forEach(append);
  (autoEntries || []).forEach(append);
  return merged.slice(0, 40);
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMapAnchorCoordinates() {
  if (_userMarker) {
    const point = _userMarker.getLatLng();
    return { lat: point.lat, lng: point.lng };
  }

  if (_leafletMap) {
    const center = _leafletMap.getCenter();
    return { lat: center.lat, lng: center.lng };
  }

  return { lat: 43.65, lng: -79.38 };
}

function getProductKeywords(productName) {
  return String(productName || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .slice(0, 4);
}

function toStoreEntryFromOverpass(element, fallbackStockStatus, productKeywords) {
  const tags = element?.tags || {};
  const name = String(tags.name || tags.brand || tags.operator || '').trim();
  const lat = Number(element?.lat ?? element?.center?.lat);
  const lng = Number(element?.lon ?? element?.center?.lon);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const searchable = `${tags.name || ''} ${tags.brand || ''} ${tags.operator || ''} ${tags.description || ''}`.toLowerCase();
  const likelyItemMatch = productKeywords.length > 0 && productKeywords.some((keyword) => searchable.includes(keyword));

  return {
    name,
    lat,
    lng,
    stockStatus: likelyItemMatch ? (fallbackStockStatus || 'Check availability') : 'Check in store',
    source: 'auto'
  };
}

async function fetchAutoStoresFromOverpass(brandName, productName, fallbackStockStatus = '') {
  const safeBrand = String(brandName || '').trim();
  if (!safeBrand) {
    return [];
  }

  const { lat, lng } = getMapAnchorCoordinates();
  const brandRegex = escapeRegex(safeBrand).slice(0, 80);
  const overpassQuery = `
[out:json][timeout:25];
(
  nwr(around:300000,${lat},${lng})["shop"]["brand"~"^${brandRegex}$",i];
  nwr(around:300000,${lat},${lng})["shop"]["name"~"${brandRegex}",i];
  nwr(around:300000,${lat},${lng})["shop"]["operator"~"${brandRegex}",i];
);
out center;
`;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: overpassQuery
    });
    if (!response.ok) {
      console.warn(`Auto store lookup failed (Overpass ${response.status}).`);
      return [];
    }

    const payload = await response.json();
    const keywords = getProductKeywords(productName);
    const entries = (Array.isArray(payload?.elements) ? payload.elements : [])
      .map((element) => toStoreEntryFromOverpass(element, fallbackStockStatus, keywords))
      .filter(Boolean)
      .slice(0, 25);
    return entries;
  } catch (error) {
    console.warn('Auto store lookup failed (Overpass request error).');
    return [];
  }
}

async function fetchAutoStoresFromNominatim(brandName, productName, fallbackStockStatus = '') {
  const safeBrand = String(brandName || '').trim();
  if (!safeBrand) {
    return [];
  }

  const query = `${safeBrand} ${String(productName || '').trim()} store`;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=20`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Teyo-marketplace/1.0' } }
    );
    if (!response.ok) {
      console.warn(`Auto store lookup failed (Nominatim ${response.status}).`);
      return [];
    }

    const payload = await response.json();
    return (Array.isArray(payload) ? payload : [])
      .map((entry) => {
        const name = String(entry.display_name || '').split(',')[0].trim();
        const lat = Number(entry.lat);
        const lng = Number(entry.lon);
        if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }

        return {
          name,
          lat,
          lng,
          stockStatus: fallbackStockStatus || 'Check availability',
          source: 'auto'
        };
      })
      .filter(Boolean)
      .slice(0, 20);
  } catch (error) {
    console.warn('Auto store lookup failed (Nominatim request error).');
    return [];
  }
}

async function resolveStoreEntriesForProduct(product, stores, sizeFilter = 'ALL') {
  const fallbackStockStatus = String(product?.stockStatus || '').trim();
  const manualEntries = normalizeStoreEntries(stores, fallbackStockStatus);
  const brandName = String(product?.companyName || product?.company || '').trim();
  const productName = String(product?.productName || product?.name || '').trim();
  const sizeInventory = getProductSizeInventory(product);
  const normalizedSizeFilter = normalizeSizeValue(sizeFilter || 'ALL');

  if (normalizedSizeFilter !== 'ALL') {
    const exactSizeEntries = sizeInventory
      .filter((entry) => normalizeSizeValue(entry.size) === normalizedSizeFilter)
      .map((entry) => ({
        name: entry.storeName,
        stockStatus: entry.stockStatus || fallbackStockStatus || 'Check availability',
        restockDate: entry.restockDate || '',
        size: entry.size,
        source: 'manual-size'
      }));
    return mergeStoreEntries(exactSizeEntries, []);
  }

  const inventoryByStore = new Map();
  sizeInventory.forEach((entry) => {
    const key = normalize(entry.storeName);
    if (!key) {
      return;
    }

    const previous = inventoryByStore.get(key);
    const currentTimestamp = toMidnightTimestamp(entry.restockDate);
    const previousTimestamp = toMidnightTimestamp(previous?.restockDate);

    if (!previous) {
      inventoryByStore.set(key, entry);
      return;
    }

    if (isInStockStatus(entry.stockStatus) && !isInStockStatus(previous.stockStatus)) {
      inventoryByStore.set(key, entry);
      return;
    }

    if (currentTimestamp && (!previousTimestamp || currentTimestamp < previousTimestamp)) {
      inventoryByStore.set(key, entry);
    }
  });

  const inventoryEntries = Array.from(inventoryByStore.values()).map((entry) => ({
    name: entry.storeName,
    stockStatus: entry.stockStatus || fallbackStockStatus || 'Check availability',
    restockDate: entry.restockDate || '',
    size: entry.size,
    source: 'manual-size'
  }));
  const manualMerged = mergeStoreEntries(inventoryEntries, manualEntries);

  if (!brandName) {
    return manualMerged;
  }

  const cacheKey = `${normalize(brandName)}|${normalize(productName)}`;
  if (_autoStoreCache.has(cacheKey)) {
    return mergeStoreEntries(manualMerged, _autoStoreCache.get(cacheKey));
  }

  const [overpassEntries, nominatimEntries] = await Promise.all([
    fetchAutoStoresFromOverpass(brandName, productName, fallbackStockStatus),
    fetchAutoStoresFromNominatim(brandName, productName, fallbackStockStatus)
  ]);

  const autoEntries = mergeStoreEntries(overpassEntries, nominatimEntries);
  _autoStoreCache.set(cacheKey, autoEntries);
  return mergeStoreEntries(manualMerged, autoEntries);
}

function upsertStockReminder(reminder) {
  const reminders = readStockReminders();
  const key = `${reminder.productId}|${normalizeSizeValue(reminder.size)}|${normalize(reminder.storeName)}`;
  const existing = reminders.find((entry) => `${entry.productId}|${normalizeSizeValue(entry.size)}|${normalize(entry.storeName)}` === key);
  if (existing) {
    existing.restockDate = reminder.restockDate || existing.restockDate || '';
    existing.createdAt = new Date().toISOString();
    existing.notified = false;
  } else {
    reminders.push({
      ...reminder,
      createdAt: new Date().toISOString(),
      notified: false
    });
  }
  writeStockReminders(reminders);
}

async function ensureNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  return Notification.requestPermission();
}

function renderStockReminderPanel(product, storeEntries, sizeFilter) {
  const panelHost = selectedProduct ? selectedProduct.querySelector('#stockReminderPanel') : null;
  if (!panelHost) {
    return;
  }

  if (sizeFilter === 'ALL') {
    panelHost.innerHTML = '<p class="form-message">Pick a size filter to set exact-size restock reminders.</p>';
    return;
  }

  const reminderCandidates = (Array.isArray(storeEntries) ? storeEntries : []).filter((entry) => {
    const status = String(entry?.stockStatus || '').trim();
    return !isInStockStatus(status) && (entry.restockDate || status);
  });

  if (!reminderCandidates.length) {
    panelHost.innerHTML = `<p class="form-message">No reminder candidates found for size ${escapeHtml(sizeFilter)} right now.</p>`;
    return;
  }

  const earliestDate = reminderCandidates
    .map((entry) => entry.restockDate)
    .filter((value) => Boolean(value))
    .sort()[0] || '';
  const earliestText = earliestDate ? `Earliest expected restock: ${escapeHtml(formatDateLabel(earliestDate))}.` : 'Restock dates vary by store.';

  panelHost.innerHTML = `
    <div class="reminder-panel">
      <p><strong>Size ${escapeHtml(sizeFilter)} reminders</strong></p>
      <p>${earliestText}</p>
      <button id="stockReminderBtn" class="btn btn-secondary" type="button">Remind me when these stores restock</button>
    </div>
  `;

  panelHost.querySelector('#stockReminderBtn')?.addEventListener('click', async () => {
    const permission = await ensureNotificationPermission();
    reminderCandidates.forEach((entry) => {
      upsertStockReminder({
        productId: String(product.id),
        productName: String(product.productName || product.name || ''),
        companyName: String(product.companyName || product.company || ''),
        size: sizeFilter,
        storeName: String(entry.name || ''),
        restockDate: String(entry.restockDate || '')
      });
    });

    if (permission === 'granted') {
      setStockReminderMessage(`Reminder saved for ${reminderCandidates.length} stores for size ${sizeFilter}.`);
    } else {
      setStockReminderMessage(`Reminder saved for size ${sizeFilter}. Enable browser notifications to receive alerts.`);
    }
  });
}

async function renderProduct(product) {
  if (!selectedProduct) return;

  const currentLookupToken = ++_storeLookupToken;
  const sizeFilter = getSelectedSizeFilter();
  const selectedInventory = getInventoryForSelectedSize(product, sizeFilter);
  const productSizes = getProductSizes(product);
  const sizeChips = productSizes.length > 0
    ? `<div class="size-chip-row">${productSizes.map((size) => `<span class="size-chip">${escapeHtml(size)}</span>`).join('')}</div>`
    : '<p class="form-message">No explicit size data provided for this product yet.</p>';
  const sizeStatusLine = sizeFilter === 'ALL'
    ? '<p><strong>Size filter:</strong> All sizes</p>'
    : `<p><strong>Size filter:</strong> ${escapeHtml(sizeFilter)} • ${selectedInventory.length} matching store entries.</p>`;
  const safeProductName = escapeHtml(product.productName || product.name);
  const safeCompanyName = escapeHtml(product.companyName || product.company);
  const safeCategory = escapeHtml((product.category || 'general').toUpperCase());
  const safeStock = escapeHtml(product.stockStatus || 'Pending verification');
  const safePrice = escapeHtml(product.price || '');
  const safeDescription = escapeHtml(product.description || 'This product listing is submitted by the brand and reviewed before appearing publicly.');
  const safeRating = escapeHtml(product.rating || '');
  const safeReviewCount = escapeHtml(product.reviewCount || '');
  const safeTrustSummary = escapeHtml(product.trustSummary || '');
  const safeImageUrl = safeUrl(product.imageUrl || '');
  const safeWebsiteUrl = safeUrl(product.websiteUrl || product.website || '');
  const imageMarkup = product.imageUrl ? `<img src="${safeImageUrl}" alt="${safeProductName}" class="product-image" />` : '';
  const stores = Array.isArray(product.stores) ? product.stores : [];
  const features = product.description ? [escapeHtml(product.description)] : [];
  const verifiedBadge = product.verifiedSeller ? '<span class="badge success-badge">Verified seller</span>' : '<span class="badge">Under review</span>';
  const ratingLine = product.rating ? `<p><strong>Customer rating:</strong> ${safeRating}</p>` : '<p><strong>Reviews:</strong> No public reviews yet. Buyer feedback will appear after verified purchases.</p>';
  const reviewLine = product.reviewCount ? `<p><strong>Review count:</strong> ${safeReviewCount}</p>` : '';
  const trustSummary = product.trustSummary ? `<p><strong>Seller promise:</strong> ${safeTrustSummary}</p>` : '';

  selectedProduct.innerHTML = `
    ${imageMarkup}
    <div class="detail-meta">
      <span>${safeCompanyName}</span>
      <span>${safeCategory}</span>
      <span>${safeStock}</span>
      ${verifiedBadge}
    </div>
    <h3>${safeProductName}</h3>
    <p class="price-highlight">${safePrice}</p>
    <p>${safeDescription}</p>
    <ul>
      ${features.map((feature) => `<li>${feature}</li>`).join('')}
    </ul>
    ${ratingLine}
    ${reviewLine}
    ${trustSummary}
    <p><strong>Stock status:</strong> ${safeStock}</p>
    ${sizeStatusLine}
    ${sizeChips}
    <p><strong>Safety guidance:</strong> ${getSafetySummary(product)}</p>
    <p><strong>Evidence source:</strong> Brand submission and admin review.</p>
    <div class="detail-actions">
      <a class="btn btn-primary" href="${safeWebsiteUrl}" target="_blank" rel="noreferrer">Visit brand site</a>
      <a class="btn btn-secondary" href="#map">Find nearby pickup</a>
    </div>
    <div id="stockReminderPanel"></div>
  `;

  renderStores(null, product.stockStatus, sizeFilter);
  const storeEntries = await resolveStoreEntriesForProduct(product, stores, sizeFilter);
  if (currentLookupToken !== _storeLookupToken) {
    return;
  }

  renderStores(storeEntries, product.stockStatus, sizeFilter);
  updateMapForProduct(storeEntries, product.stockStatus, sizeFilter);
  renderStockReminderPanel(product, storeEntries, sizeFilter);
}

function renderStores(storeEntries, stockStatus, sizeFilter = 'ALL') {
  if (!storeList) return;
  storeList.innerHTML = '';

  const heading = document.createElement('p');
  heading.textContent = 'Stores near you';
  heading.style.cssText = 'font-weight:700;margin:0 0 4px;font-size:0.9rem;';
  storeList.appendChild(heading);

  const isLoading = !Array.isArray(storeEntries);
  if (isLoading) {
    const loading = document.createElement('p');
    loading.textContent = 'Finding brand stores for this product...';
    loading.style.cssText = 'color:var(--muted);font-size:0.82rem;margin:6px 0 0;';
    storeList.appendChild(loading);
    return;
  }

  const entries = storeEntries;
  if (!entries.length) {
    const ph = document.createElement('p');
    ph.textContent = sizeFilter === 'ALL'
      ? 'No nearby store locations were found yet for this brand and product.'
      : `No stores reported availability for size ${sizeFilter} yet.`;
    ph.style.cssText = 'color:var(--muted);font-size:0.82rem;margin:6px 0 0;';
    storeList.appendChild(ph);
    return;
  }

  entries.forEach((storeEntry, i) => {
    const { cls, label } = classifyStockBadge(storeEntry.stockStatus, stockStatus, storeEntry.restockDate);
    const card = document.createElement('div');
    card.className = 'store-card';
    card.dataset.storeIdx = i;
    card.innerHTML =
      `<span class="store-card-name">${escapeHtml(storeEntry.name)}</span>`
      + `<span class="store-stock-badge ${cls}">${label}</span>`;
    card.addEventListener('click', () => {
      document.querySelectorAll('.store-card').forEach((c) => c.classList.remove('store-card-active'));
      card.classList.add('store-card-active');
      if (_storeMarkers[i] && _leafletMap) {
        if (_storeFlyTimer) { clearInterval(_storeFlyTimer); _storeFlyTimer = null; }
        _leafletMap.flyTo(_storeMarkers[i].getLatLng(), 15, { duration: 1.5 });
        _storeMarkers[i].openPopup();
      }
    });
    storeList.appendChild(card);
  });
}

// ── Leaflet map ──────────────────────────────────────────────────────
let _leafletMap = null;
let _userMarker = null;
let _storeMarkers = [];
let _storeFlyTimer = null;

function initMap() {
  const mapEl = document.getElementById('mapLeaflet');
  if (!mapEl || typeof L === 'undefined') return;
  if (_leafletMap) return;

  _leafletMap = L.map('mapLeaflet', { zoomControl: true }).setView([43.65, -79.38], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(_leafletMap);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        _leafletMap.setView([coords.latitude, coords.longitude], 13);
        if (_userMarker) _userMarker.remove();
        _userMarker = L.circleMarker([coords.latitude, coords.longitude], {
          radius: 10, fillColor: '#7c7cff', color: '#fff', weight: 2.5, fillOpacity: 0.9
        }).addTo(_leafletMap).bindPopup('📍 You are here').openPopup();
      },
      () => {}
    );
  }
}

async function _geocodeStore(name) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'Teyo-marketplace/1.0' } }
    );
    if (!res.ok) {
      console.warn(`Store geocoding failed (${res.status}) for "${name}".`);
      return null;
    }
    const data = await res.json();
    if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (error) {
    console.warn(`Store geocoding failed for "${name}".`);
  }
  return null;
}

async function updateMapForProduct(storeEntries, stockStatus, sizeFilter = 'ALL') {
  if (!_leafletMap) return;
  _storeMarkers.forEach((m) => m.remove());
  _storeMarkers = [];
  if (_storeFlyTimer) { clearInterval(_storeFlyTimer); _storeFlyTimer = null; }
  const mapStatus = document.getElementById('mapLeaflet');

  const real = (Array.isArray(storeEntries) ? storeEntries : []).filter((entry) => String(entry?.name || '').trim().length > 2);
  if (!real.length) {
    if (mapStatus) {
      mapStatus.title = sizeFilter === 'ALL'
        ? 'No nearby stores found for this product.'
        : `No stores found for size ${sizeFilter}.`;
    }
    return;
  }

  if (mapStatus) mapStatus.title = 'Finding stores on map…';

  const coords = [];
  for (const storeEntry of real.slice(0, 25)) {
    const hasCoordinates = Number.isFinite(Number(storeEntry.lat)) && Number.isFinite(Number(storeEntry.lng));
    const pos = hasCoordinates ? { lat: Number(storeEntry.lat), lng: Number(storeEntry.lng) } : await _geocodeStore(storeEntry.name);
    if (pos) {
      coords.push({
        ...storeEntry,
        ...pos
      });
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  coords.forEach(({ lat, lng, name, stockStatus: storeStockStatus, restockDate }) => {
    const { label } = classifyStockBadge(storeStockStatus, stockStatus, restockDate);
    const m = L.marker([lat, lng])
      .addTo(_leafletMap)
      .bindPopup(`<strong>${escapeHtml(name)}</strong><br>${escapeHtml(label)}`);
    _storeMarkers.push(m);
  });

  const allPts = coords.map((c) => [c.lat, c.lng]);
  if (_userMarker) allPts.push([_userMarker.getLatLng().lat, _userMarker.getLatLng().lng]);

  if (allPts.length > 1) {
    _leafletMap.fitBounds(allPts, { padding: [50, 50], maxZoom: 14 });
  } else if (coords.length) {
    _leafletMap.flyTo([coords[0].lat, coords[0].lng], 14);
  }

  if (coords.length > 1) {
    let idx = 0;
    _storeFlyTimer = setInterval(() => {
      idx = (idx + 1) % coords.length;
      _leafletMap.flyTo([coords[idx].lat, coords[idx].lng], 15, { duration: 1.8 });
      _storeMarkers[idx].openPopup();
      document.querySelectorAll('.store-card').forEach((c) => c.classList.remove('store-card-active'));
      const activeCard = storeList && storeList.querySelector(`[data-store-idx="${idx}"]`);
      if (activeCard) {
        activeCard.classList.add('store-card-active');
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 4500);
  } else if (_storeMarkers.length === 1) {
    _storeMarkers[0].openPopup();
  }
  if (mapStatus) mapStatus.title = 'Store map';
}

function renderAds() {
  const liveAds = marketplaceState.ads.filter((ad) => ad.active && ad.paid);

  const renderTarget = (target, ads, isAdmin = false) => {
    if (!target) return;
    target.innerHTML = '';

    if (!ads.length) {
      target.innerHTML = '<p>No sponsor ads yet. Paid monthly campaigns appear here once approved.</p>';
      return;
    }

    ads.forEach((ad) => {
      const card = document.createElement('div');
      card.className = 'ad-card';
      const creative = ad.creative || {};
      const safeBackgroundColor = /^#[0-9a-fA-F]{6}$/.test(String(creative.backgroundColor || '')) ? creative.backgroundColor : '#121212';
      const safeTextColor = /^#[0-9a-fA-F]{6}$/.test(String(creative.textColor || '')) ? creative.textColor : '#ffffff';
      const safeAccentColor = /^#[0-9a-fA-F]{6}$/.test(String(creative.accentColor || '')) ? creative.accentColor : '#ffffff';
      const previewStyle = `background:${safeBackgroundColor}; color:${safeTextColor}; border:1px solid ${safeAccentColor};`;
      const sticker = creative.sticker ? `<span class="sticker-pill">${escapeHtml(creative.sticker)}</span>` : '';
      const safeImageUrl = safeUrl(creative.imageUrl || '');
      const safeHeadline = escapeHtml(ad.headline || 'Sponsored promotion');
      const safeDescription = escapeHtml(ad.description || '');
      const safeCompanyName = escapeHtml(ad.companyName || 'Brand');
      const safeLink = safeUrl(ad.link || '');
      const safeCta = escapeHtml(creative.ctaLabel || 'View offer');
      const imageMarkup = creative.imageUrl ? `<img src="${safeImageUrl}" alt="${safeHeadline}" class="ad-image" />` : '';
      const customMarkup = creative.htmlSnippet ? `<pre class="creative-snippet">${escapeHtml(creative.htmlSnippet)}</pre>` : '';
      card.innerHTML = `
        <div class="ad-creative" style="${previewStyle}">
          <div class="ad-creative-head">
            <strong>${safeCompanyName}</strong>
            ${sticker}
          </div>
          <h4>${safeHeadline}</h4>
          <p>${safeDescription}</p>
          ${imageMarkup}
          <a class="btn btn-secondary" href="${safeLink}" target="_blank" rel="noreferrer">${safeCta}</a>
          ${customMarkup}
        </div>
        <div class="ad-meta">
          <p>${ad.active && ad.paid ? 'Live sponsor placement' : 'Pending approval'}</p>
          ${isAdmin ? `<button class="btn btn-primary" type="button" data-approve-ad="${ad.id}">Approve ad</button>` : ''}
        </div>
      `;

      if (isAdmin) {
        card.querySelector('[data-approve-ad]')?.addEventListener('click', () => approveAd(ad.id));
      }
      target.appendChild(card);
    });
  };

  if (activeAdsList) {
    renderTarget(activeAdsList, liveAds);
  }
  if (adminAdsList) {
    if (!adminAccessGranted) {
      adminAdsList.innerHTML = '<p>Owner access required to view ad requests.</p>';
      return;
    }
    renderTarget(adminAdsList, marketplaceState.ads, adminAccessGranted);
  }
}

function setInventoryStatusMessage(text) {
  if (inventoryStatusMessage) {
    inventoryStatusMessage.textContent = text;
  }
}

function setInventorySummaryMessage(text) {
  if (inventorySummaryPanel) {
    inventorySummaryPanel.innerHTML = `<p>${escapeHtml(text)}</p>`;
  }
}

function setInventoryRestockMessage(text) {
  if (inventoryRestockList) {
    inventoryRestockList.innerHTML = `<p>${escapeHtml(text)}</p>`;
  }
}

function getInventoryScopedProducts() {
  const hasGlobalOwner = hasOwnerSession();
  const companySessionName = normalize(String(getCompanySessionName() || ''));
  const companySessionEmail = normalize(String(getCompanySessionEmail() || ''));

  if (!hasGlobalOwner && !hasCompanySession()) {
    return { products: [], accessMessage: 'Company access is required to edit inventory.' };
  }

  if (!hasGlobalOwner && (!companySessionName || !companySessionEmail)) {
    return { products: [], accessMessage: 'Company access is required to edit inventory.' };
  }

  const scopedProducts = marketplaceState.products
    .filter((product) => hasGlobalOwner || (
      normalize(product.companyName || product.company || '') === companySessionName
      && normalize(product.ownerEmail || '') === companySessionEmail
    ))
    .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());

  return { products: scopedProducts, accessMessage: '' };
}

function renderInventorySummary(products) {
  if (!inventorySummaryPanel) {
    return;
  }

  if (!Array.isArray(products) || !products.length) {
    inventorySummaryPanel.innerHTML = '<p>No products are available for summary metrics yet.</p>';
    return;
  }

  const totalProducts = products.length;
  const liveProducts = products.filter((product) => Boolean(product.approved && product.visible)).length;
  const pendingProducts = totalProducts - liveProducts;
  const sizeInventoryEntries = products.reduce((sum, product) => sum + getProductSizeInventory(product).length, 0);
  const lowOrOutEntries = products.reduce((sum, product) => (
    sum + getProductSizeInventory(product).filter((entry) => !isInStockStatus(entry.stockStatus)).length
  ), 0);

  inventorySummaryPanel.innerHTML = `
    <div class="inventory-summary-grid">
      <article class="inventory-stat-card">
        <strong>${totalProducts}</strong>
        <span>Total products</span>
      </article>
      <article class="inventory-stat-card">
        <strong>${liveProducts}</strong>
        <span>Live products</span>
      </article>
      <article class="inventory-stat-card">
        <strong>${pendingProducts}</strong>
        <span>Pending approval</span>
      </article>
      <article class="inventory-stat-card">
        <strong>${sizeInventoryEntries}</strong>
        <span>Size inventory lines</span>
      </article>
      <article class="inventory-stat-card">
        <strong>${lowOrOutEntries}</strong>
        <span>Low / out-of-stock lines</span>
      </article>
    </div>
  `;
}

function renderRestockSoonDashboard(products) {
  if (!inventoryRestockList) {
    return;
  }

  if (!Array.isArray(products) || !products.length) {
    inventoryRestockList.innerHTML = '<p>No restock targets available yet.</p>';
    return;
  }

  const now = Date.now();
  const maxWindow = now + (14 * 24 * 60 * 60 * 1000);
  const rows = [];

  products.forEach((product) => {
    const productName = String(product.productName || product.name || '').trim();
    const companyName = String(product.companyName || product.company || '').trim();
    getProductSizeInventory(product).forEach((entry) => {
      const restockTimestamp = toMidnightTimestamp(entry.restockDate);
      if (!restockTimestamp || restockTimestamp < now || restockTimestamp > maxWindow) {
        return;
      }
      if (isInStockStatus(entry.stockStatus)) {
        return;
      }

      rows.push({
        productName,
        companyName,
        storeName: entry.storeName,
        size: entry.size,
        stockStatus: entry.stockStatus,
        restockDate: entry.restockDate,
        timestamp: restockTimestamp
      });
    });
  });

  rows.sort((left, right) => left.timestamp - right.timestamp);

  if (!rows.length) {
    inventoryRestockList.innerHTML = '<p>No low/out-of-stock size lines are scheduled to restock in the next 14 days.</p>';
    return;
  }

  inventoryRestockList.innerHTML = rows.slice(0, 30).map((row) => `
    <article class="inventory-restock-card">
      <h4>${escapeHtml(row.productName)}</h4>
      <p><strong>Company:</strong> ${escapeHtml(row.companyName)}</p>
      <p><strong>Store:</strong> ${escapeHtml(row.storeName)} • <strong>Size:</strong> ${escapeHtml(row.size)}</p>
      <p><strong>Status:</strong> ${escapeHtml(row.stockStatus || 'Check availability')}</p>
      <p><strong>Restock date:</strong> ${escapeHtml(formatDateLabel(row.restockDate) || row.restockDate)}</p>
    </article>
  `).join('');
}

async function saveProductInventory(productId, payload) {
  const authHeaders = hasOwnerSession() ? getOwnerHeaders() : getCompanyHeaders();
  const response = await fetch(`/api/products/${productId}/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Inventory update failed.');
  }
  return result;
}

function renderInventoryManager() {
  if (!inventoryProductList) {
    return;
  }

  inventoryProductList.innerHTML = '';
  setInventorySummaryMessage('Loading your company summary...');
  setInventoryRestockMessage('Loading restock dashboard...');
  if (marketplaceLoadError) {
    inventoryProductList.insertAdjacentHTML('beforeend', `<p>${escapeHtml(marketplaceLoadError)}</p>`);
    setInventorySummaryMessage(marketplaceLoadError);
    setInventoryRestockMessage(marketplaceLoadError);
    return;
  }

  const { products, accessMessage } = getInventoryScopedProducts();
  if (accessMessage) {
    inventoryProductList.insertAdjacentHTML('beforeend', `<p>${escapeHtml(accessMessage)}</p>`);
    setInventorySummaryMessage(accessMessage);
    setInventoryRestockMessage(accessMessage);
    return;
  }
  renderInventorySummary(products);
  renderRestockSoonDashboard(products);

  if (!products.length) {
    inventoryProductList.innerHTML = '<p>No products are available for inventory updates yet.</p>';
    return;
  }

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'ad-card';
    const safeProductName = escapeHtml(product.productName || product.name || '');
    const safeCompanyName = escapeHtml(product.companyName || product.company || '');
    const sizesText = getProductSizes(product).join(', ');
    const storesText = Array.isArray(product.stores) ? product.stores.join(', ') : '';
    const sizeInventoryText = sizeInventoryToMultilineText(product);
    card.innerHTML = `
      <h4>${safeProductName}</h4>
      <p><strong>Company:</strong> ${safeCompanyName}</p>
      <p><strong>Listing status:</strong> ${product.approved && product.visible ? 'Live' : 'Pending approval'}</p>
      <label>General stock status
        <input type="text" data-inventory-field="stockStatus" value="${escapeHtml(product.stockStatus || '')}" />
      </label>
      <label>Size options (comma-separated)
        <input type="text" data-inventory-field="sizeOptions" value="${escapeHtml(sizesText)}" />
      </label>
      <label>Manual stores (comma-separated)
        <textarea rows="2" data-inventory-field="stores">${escapeHtml(storesText)}</textarea>
      </label>
      <label>Size inventory lines (Store|Size|Stock|YYYY-MM-DD)
        <textarea rows="6" data-inventory-field="sizeInventory">${escapeHtml(sizeInventoryText)}</textarea>
      </label>
      <button class="btn btn-primary" type="button" data-save-inventory="${product.id}">Save inventory</button>
    `;

    card.querySelector('[data-save-inventory]')?.addEventListener('click', async () => {
      const stockStatus = String(card.querySelector('[data-inventory-field="stockStatus"]')?.value || '').trim();
      const sizeOptions = String(card.querySelector('[data-inventory-field="sizeOptions"]')?.value || '').trim();
      const stores = String(card.querySelector('[data-inventory-field="stores"]')?.value || '').trim();
      const sizeInventory = String(card.querySelector('[data-inventory-field="sizeInventory"]')?.value || '').trim();

      if (!validateSizeInventoryInput(sizeInventory)) {
        setInventoryStatusMessage(`Invalid size inventory format for "${safeProductName}". Use Store|Size|Stock|YYYY-MM-DD.`);
        return;
      }

      try {
        await saveProductInventory(product.id, { stockStatus, sizeOptions, stores, sizeInventory });
        setInventoryStatusMessage(`Saved inventory updates for "${safeProductName}".`);
        await loadMarketplaceData();
      } catch (error) {
        setInventoryStatusMessage(error.message || `Unable to save inventory for "${safeProductName}".`);
      }
    });

    inventoryProductList.appendChild(card);
  });
}

function refreshSizeFilterOptions() {
  if (!sizeFilterSelect) {
    return;
  }

  const current = normalizeSizeValue(sizeFilterSelect.value || 'ALL');
  const allSizes = Array.from(new Set(
    marketplaceState.products
      .map((product) => getProductSizes(product))
      .flat()
      .map((size) => normalizeSizeValue(size))
      .filter(Boolean)
  )).sort((left, right) => left.localeCompare(right));

  sizeFilterSelect.innerHTML = '<option value="ALL">All sizes</option>'
    + allSizes.map((size) => `<option value="${escapeHtml(size)}">${escapeHtml(size)}</option>`).join('');
  sizeFilterSelect.value = allSizes.includes(current) ? current : 'ALL';
}

function evaluateReminder(product, reminder) {
  const inventory = getProductSizeInventory(product);
  const matchingEntry = inventory.find((entry) => normalizeSizeValue(entry.size) === normalizeSizeValue(reminder.size)
    && normalize(entry.storeName) === normalize(reminder.storeName));

  if (!matchingEntry) {
    return null;
  }

  const inStock = isInStockStatus(matchingEntry.stockStatus);
  const restockReached = Boolean(matchingEntry.restockDate) && toMidnightTimestamp(matchingEntry.restockDate) <= Date.now();
  if (!inStock && !restockReached) {
    return null;
  }

  const reason = inStock
    ? `${matchingEntry.storeName} now lists ${matchingEntry.size} as in stock.`
    : `${matchingEntry.storeName} reached the expected restock date (${formatDateLabel(matchingEntry.restockDate)}).`;
  return { reason };
}

async function checkStockReminders() {
  const reminders = readStockReminders().filter((entry) => !entry.notified);
  if (!reminders.length) {
    return;
  }

  try {
    const response = await fetch('/api/products');
    if (!response.ok) {
      return;
    }

    const products = await response.json();
    let triggeredCount = 0;
    const updatedReminders = readStockReminders().map((reminder) => {
      if (reminder.notified) {
        return reminder;
      }

      const product = (Array.isArray(products) ? products : []).find((entry) => String(entry.id) === String(reminder.productId));
      if (!product) {
        return reminder;
      }

      const result = evaluateReminder(product, reminder);
      if (!result) {
        return reminder;
      }

      triggeredCount += 1;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Teyo stock reminder', {
          body: `${reminder.productName} (${reminder.size}) — ${result.reason}`
        });
      }

      return {
        ...reminder,
        notified: true,
        notifiedAt: new Date().toISOString()
      };
    });

    writeStockReminders(updatedReminders);
    if (triggeredCount > 0) {
      setStockReminderMessage(`${triggeredCount} stock reminder${triggeredCount === 1 ? '' : 's'} triggered.`);
    }
  } catch (error) {
    setStockReminderMessage('Unable to check stock reminders right now.');
  }
}

async function loadMarketplaceData() {
  try {
    const useCompanyScope = Boolean(inventoryProductList && hasCompanySession() && !hasOwnerSession());
    const sharedHeaders = hasOwnerSession() ? getAdminHeaders() : (useCompanyScope ? getCompanyHeaders() : {});
    const [partnersResponse, adsResponse, productsResponse] = await Promise.all([
      fetch('/api/partners', { headers: sharedHeaders }),
      fetch('/api/ads', { headers: sharedHeaders }),
      fetch('/api/products', { headers: sharedHeaders })
    ]);

    const partners = await partnersResponse.json();
    const ads = await adsResponse.json();
    const products = await productsResponse.json();
    marketplaceState = { partners, ads, products };
    marketplaceLoadError = '';
  } catch (error) {
    marketplaceState = { partners: [], ads: [], products: [] };
    marketplaceLoadError = 'Unable to load marketplace data. Open this site from your running server URL (not as a local file) and verify the backend is running.';
  }

  refreshSizeFilterOptions();
  renderAds();
  renderInventoryManager();
  renderResults();
  await checkStockReminders();
}

async function approvePartner(id) {
  try {
    const response = await fetch(`/api/partners/${id}/approve`, {
      method: 'POST',
      headers: {
        ...getAdminHeaders()
      }
    });
    if (!response.ok) {
      setAdminAccessMessage('Approval failed. Check your admin key and try again.');
      return;
    }
    await loadMarketplaceData();
  } catch (error) {
    setAdminAccessMessage('Approval failed due to a network error.');
  }
}

async function denyPartner(id) {
  try {
    const response = await fetch(`/api/partners/${id}/deny`, {
      method: 'POST',
      headers: {
        ...getAdminHeaders()
      }
    });
    if (!response.ok) {
      setAdminAccessMessage('Partner denial failed. Check your owner access and try again.');
      return;
    }
    await loadMarketplaceData();
  } catch (error) {
    setAdminAccessMessage('Partner denial failed due to a network error.');
  }
}

async function banPartner(id) {
  try {
    const response = await fetch(`/api/partners/${id}/ban`, {
      method: 'POST',
      headers: {
        ...getAdminHeaders()
      }
    });
    if (!response.ok) {
      setAdminAccessMessage('Company ban failed. Check your owner access and try again.');
      return;
    }
    await loadMarketplaceData();
  } catch (error) {
    setAdminAccessMessage('Company ban failed due to a network error.');
  }
}
async function approveAd(id) {
  try {
    const response = await fetch(`/api/ads/${id}/approve`, {
      method: 'POST',
      headers: {
        ...getAdminHeaders()
      }
    });
    if (!response.ok) {
      setAdminAccessMessage('Ad approval failed. Check your admin key and try again.');
      return;
    }
    await loadMarketplaceData();
  } catch (error) {
    setAdminAccessMessage('Ad approval failed due to a network error.');
  }
}

async function approveProduct(id) {
  try {
    const response = await fetch(`/api/products/${id}/approve`, {
      method: 'POST',
      headers: {
        ...getAdminHeaders()
      }
    });
    if (!response.ok) {
      setAdminAccessMessage('Product approval failed. Check your admin key and try again.');
      return;
    }
    await loadMarketplaceData();
  } catch (error) {
    setAdminAccessMessage('Product approval failed due to a network error.');
  }
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => activateTab(button.dataset.tab));
});

if (searchInput) {
  searchInput.addEventListener('input', renderResults);
}
if (categorySelect) {
  categorySelect.addEventListener('change', renderResults);
}
if (sizeFilterSelect) {
  sizeFilterSelect.addEventListener('change', () => {
    setStockReminderMessage('');
    renderResults();
  });
}
if (sizeInStockOnly) {
  sizeInStockOnly.addEventListener('change', renderResults);
}
if (partnerForm) {
  partnerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(partnerForm);
    const payload = Object.fromEntries(formData.entries());
    const companyName = String(payload.companyName || '').trim();
    const websiteUrl = String(payload.websiteUrl || '').trim();
    payload.paymentConfirmed = Boolean(payload.paymentConfirmed);

    if (!isBusinessOwnerSubmission(companyName, websiteUrl)) {
      formMessage.textContent = 'Only real company or business owners with a valid business website can request placement.';
      return;
    }

    try {
      const response = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attachOwnerAuth(payload))
      });

      const result = await response.json();
      const accessKeyNotice = result.companyAccessKey
        ? ` Save this company access key: ${result.companyAccessKey}`
        : '';
      formMessage.textContent = `${result.message || 'Thanks — your request was submitted.'}${accessKeyNotice}`;
      if (result.success) {
        partnerForm.reset();
        await loadMarketplaceData();
      }
    } catch (error) {
      formMessage.textContent = 'Unable to submit right now. Please try again shortly.';
    }
  });
}

if (productForm) {
  productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(productForm);
    const payload = Object.fromEntries(formData.entries());
    const companyName = String(payload.companyName || '').trim();
    const websiteUrl = String(payload.websiteUrl || '').trim();

    if (!isBusinessOwnerSubmission(companyName, websiteUrl)) {
      productFormMessage.textContent = 'Only real companies with a valid business website can submit products.';
      return;
    }
    if (!validateSizeInventoryInput(payload.sizeInventory)) {
      productFormMessage.textContent = 'Size inventory lines must use: Store Name|Size|Stock Status|YYYY-MM-DD';
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attachOwnerAuth(payload))
      });
      const result = await response.json();
      productFormMessage.textContent = result.message || 'Your product submission is pending review.';
      if (result.success) {
        productForm.reset();
        await loadMarketplaceData();
      }
    } catch (error) {
      productFormMessage.textContent = 'Unable to submit your product right now.';
    }
  });
}

if (adForm) {
  adForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(adForm);
    const payload = Object.fromEntries(formData.entries());
    const companyName = String(payload.companyName || '').trim();
    const websiteUrl = String(payload.link || '').trim();
    const creativeFile = formData.get('creativeFile');

    if (!isBusinessOwnerSubmission(companyName, websiteUrl)) {
      adFormMessage.textContent = 'Only real companies with a valid business website can submit ads.';
      return;
    }

    let uploadedImageData = '';
    if (creativeFile && typeof creativeFile === 'object' && creativeFile.size > 0) {
      const maxSize = 7 * 1024 * 1024;
      if (creativeFile.size > maxSize) {
        adFormMessage.textContent = 'Uploaded ad file is too large. Please use an image or GIF under 7MB.';
        return;
      }

      try {
        uploadedImageData = await fileToDataUrl(creativeFile);
      } catch (error) {
        adFormMessage.textContent = 'We could not read the uploaded ad file. Please try a different file.';
        return;
      }
    }

    const creative = {
      accentColor: payload.accentColor || '#ffffff',
      backgroundColor: payload.backgroundColor || '#121212',
      textColor: payload.textColor || '#ffffff',
      sticker: payload.sticker || '',
      ctaLabel: payload.ctaLabel || 'View offer',
      htmlSnippet: payload.htmlSnippet || '',
      imageUrl: uploadedImageData || payload.imageUrl || ''
    };

    const adPayload = {
      companyName,
      ownerEmail: payload.ownerEmail || '',
      headline: payload.headline || '',
      description: payload.description || '',
      link: payload.link || '',
      creative
    };

    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attachOwnerAuth(adPayload))
      });
      const result = await response.json();
      adFormMessage.textContent = result.message || 'Your sponsor ad is pending review.';
      if (result.success) {
        lastSubmittedAdId = result.adId || null;
        adForm.reset();
        await loadMarketplaceData();
      }
    } catch (error) {
      adFormMessage.textContent = 'Unable to submit your ad right now.';
    }
  });
}

function getCustomerCheckoutEmail() {
  const email = String(customerEmailInput?.value || '').trim();
  if (!email.includes('@') || !email.includes('.')) {
    if (customerCheckoutMessage) {
      customerCheckoutMessage.textContent = 'Enter a valid email before starting customer checkout.';
    }
    return '';
  }
  return email;
}

async function startCustomerCheckout(plan) {
  const customerEmail = getCustomerCheckoutEmail();
  if (!customerEmail) {
    return;
  }

  try {
    const response = await fetch('/api/create-customer-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attachOwnerAuth({ plan, customerEmail }))
    });
    const result = await response.json();
    if (result.success && result.url) {
      window.location.href = result.url;
    } else if (customerCheckoutMessage) {
      customerCheckoutMessage.textContent = result.message || 'Customer checkout could not be started.';
    }
  } catch (error) {
    if (customerCheckoutMessage) {
      customerCheckoutMessage.textContent = 'Unable to start customer checkout right now.';
    }
  }
}

async function startStripeCheckout(plan) {
  const placementCompanyName = document.querySelector('#partnerForm input[name="companyName"]')?.value || '';
  const placementOwnerEmail = document.querySelector('#partnerForm input[name="ownerEmail"]')?.value || '';
  const adCompanyName = document.querySelector('#adForm input[name="companyName"]')?.value || '';
  const adOwnerEmail = document.querySelector('#adForm input[name="ownerEmail"]')?.value || '';

  if (plan === 'monthly-ad' && !lastSubmittedAdId) {
    checkoutMessage.textContent = 'Submit your ad first so checkout can safely attach payment to the correct campaign.';
    return;
  }

  const payload = plan === 'placement'
    ? attachOwnerAuth({ plan, companyName: placementCompanyName, ownerEmail: placementOwnerEmail })
    : attachOwnerAuth({ plan, companyName: adCompanyName, ownerEmail: adOwnerEmail, adId: lastSubmittedAdId });

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      checkoutMessage.textContent = result.message || 'Stripe checkout could not be started.';
    }
  } catch (error) {
    checkoutMessage.textContent = 'Unable to start checkout right now.';
  }
}

if (placementCheckoutBtn) {
  placementCheckoutBtn.addEventListener('click', () => startStripeCheckout('placement'));
}
if (monthlyCheckoutBtn) {
  monthlyCheckoutBtn.addEventListener('click', () => startStripeCheckout('monthly-ad'));
}
if (customerOneTimeCheckoutBtn) {
  customerOneTimeCheckoutBtn.addEventListener('click', () => startCustomerCheckout('customer-one-time'));
}
if (customerMonthlyCheckoutBtn) {
  customerMonthlyCheckoutBtn.addEventListener('click', () => startCustomerCheckout('customer-plus'));
}
if (customerOneTimePlanBtn) {
  customerOneTimePlanBtn.addEventListener('click', () => startCustomerCheckout('customer-one-time'));
}
if (customerPlusPlanBtn) {
  customerPlusPlanBtn.addEventListener('click', () => startCustomerCheckout('customer-plus'));
}

if (adminSetKeyBtn) {
  adminSetKeyBtn.addEventListener('click', async () => {
    const captured = requestAndStoreAdminKey();
    if (!captured) {
      setAdminAccessMessage('Admin key entry was cancelled.');
      return;
    }
    await initializeMarketplace();
  });
}

if (ownerSetKeyBtn) {
  ownerSetKeyBtn.addEventListener('click', async () => {
    const verified = await verifyOwnerAccess();
    if (verified) {
      await initializeMarketplace();
      initializeCustomerTheme();
    }
  });
}

if (companySetAccessBtn) {
  companySetAccessBtn.addEventListener('click', async () => {
    const verified = await verifyCompanyAccess();
    if (verified) {
      await initializeMarketplace();
    }
  });
}

if (companyClearAccessBtn) {
  companyClearAccessBtn.addEventListener('click', async () => {
    clearCompanyAccess();
    if (companyAccessMessage) {
      companyAccessMessage.textContent = 'Company access cleared for this browser.';
    }
    await initializeMarketplace();
  });
}

if (ownerClearKeyBtn) {
  ownerClearKeyBtn.addEventListener('click', async () => {
    clearOwnerAccess();
    adminAccessGranted = false;
    syncOwnerOnlyVisibility();
    if (ownerAccessMessage) {
      ownerAccessMessage.textContent = 'Owner access cleared. The site is back to the default public role.';
    }
    setAdminAccessMessage('View-only mode enabled. Enter admin key to approve requests.');
    await initializeMarketplace();
    initializeCustomerTheme();
  });
}

if (adminClearKeyBtn) {
  adminClearKeyBtn.addEventListener('click', async () => {
    sessionStorage.removeItem('teyoAdminKey');
    adminAccessGranted = false;
    setAdminAccessMessage('Saved admin key cleared. View-only mode is active.');
    await initializeMarketplace();
  });
}

if (adminPartnerList) {
  const renderAdminPartners = () => {
    adminPartnerList.innerHTML = '';
    if (adminProcessedPartnerList) {
      adminProcessedPartnerList.innerHTML = '';
    }
    if (marketplaceLoadError) {
      adminPartnerList.insertAdjacentHTML('beforeend', `<p>${escapeHtml(marketplaceLoadError)}</p>`);
      if (adminProcessedPartnerList) {
        adminProcessedPartnerList.insertAdjacentHTML('beforeend', `<p>${escapeHtml(marketplaceLoadError)}</p>`);
      }
      return;
    }
    if (!adminAccessGranted) {
      adminPartnerList.insertAdjacentHTML('beforeend', '<p>Owner access required to view company requests.</p>');
      if (adminProcessedPartnerList) {
        adminProcessedPartnerList.insertAdjacentHTML('beforeend', '<p>Owner access required to view processed company requests.</p>');
      }
      return;
    }

    const sortedPartners = [...marketplaceState.partners].sort((a, b) => {
      const left = new Date(b.createdAt || 0).getTime();
      const right = new Date(a.createdAt || 0).getTime();
      return left - right;
    });

    const pendingPartners = sortedPartners.filter((partner) => {
      const status = String(partner.requestStatus || '').toLowerCase();
      if (status) {
        return status === 'pending';
      }
      return !(partner.activeListing && partner.paid && partner.paymentConfirmed);
    });

    const processedPartners = sortedPartners.filter((partner) => {
      const status = String(partner.requestStatus || '').toLowerCase();
      if (status) {
        return status !== 'pending';
      }
      return Boolean(partner.activeListing && partner.paid && partner.paymentConfirmed);
    });

    if (!pendingPartners.length) {
      adminPartnerList.innerHTML = '<p>No pending partner requests right now.</p>';
    }

    pendingPartners.forEach((partner) => {
      const card = document.createElement('div');
      card.className = 'ad-card';
      const safeCompanyName = escapeHtml(partner.companyName || '');
      const safeWebsiteUrl = escapeHtml(partner.websiteUrl || '');
      card.innerHTML = `
        <h4>${safeCompanyName}</h4>
        <p><strong>Status:</strong> Pending review</p>
        <p>${safeWebsiteUrl}</p>
        <div class="hero-actions">
          <button class="btn btn-primary" type="button" data-approve-partner="${partner.id}">Approve placement</button>
          <button class="btn btn-secondary" type="button" data-deny-partner="${partner.id}">Deny request</button>
        </div>
      `;
      card.querySelector('[data-approve-partner]')?.addEventListener('click', () => approvePartner(partner.id));
      card.querySelector('[data-deny-partner]')?.addEventListener('click', () => denyPartner(partner.id));
      adminPartnerList.appendChild(card);
    });

    if (!adminProcessedPartnerList) {
      return;
    }

    if (!processedPartners.length) {
      adminProcessedPartnerList.innerHTML = '<p>No processed partner requests yet.</p>';
      return;
    }

    processedPartners.forEach((partner) => {
      const card = document.createElement('div');
      card.className = 'ad-card';
      const safeCompanyName = escapeHtml(partner.companyName || '');
      const safeWebsiteUrl = escapeHtml(partner.websiteUrl || '');
      const status = String(partner.requestStatus || '').toLowerCase();
      const statusLabel = status === 'approved'
        ? 'Approved'
        : status === 'denied'
          ? 'Denied'
          : status === 'banned'
            ? 'Banned'
            : (partner.activeListing && partner.paid && partner.paymentConfirmed ? 'Approved' : 'Processed');

      card.innerHTML = `
        <h4>${safeCompanyName}</h4>
        <p><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
        <p>${safeWebsiteUrl}</p>
        <div class="hero-actions">
          ${status !== 'banned' ? `<button class="btn btn-secondary" type="button" data-ban-partner="${partner.id}">Ban company</button>` : ''}
        </div>
      `;
      card.querySelector('[data-ban-partner]')?.addEventListener('click', () => banPartner(partner.id));
      adminProcessedPartnerList.appendChild(card);
    });
  };
  const renderAdminProducts = () => {
    if (!document.getElementById('adminProductList')) return;
    const adminProductList = document.getElementById('adminProductList');
    adminProductList.innerHTML = '';
    if (marketplaceLoadError) {
      adminProductList.insertAdjacentHTML('beforeend', `<p>${escapeHtml(marketplaceLoadError)}</p>`);
      return;
    }
    if (!adminAccessGranted) {
      adminProductList.insertAdjacentHTML('beforeend', '<p>Owner access required to view product requests.</p>');
      return;
    }
    if (!marketplaceState.products.length) {
      adminProductList.innerHTML = '<p>No product submissions yet.</p>';
      return;
    }

    marketplaceState.products.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'ad-card';
      const safeProductName = escapeHtml(product.productName || product.name || '');
      const safeCompanyName = escapeHtml(product.companyName || product.company || '');
      const safeWebsiteUrl = escapeHtml(product.websiteUrl || product.website || '');
      card.innerHTML = `
        <h4>${safeProductName}</h4>
        <p><strong>Company:</strong> ${safeCompanyName}</p>
        <p><strong>Status:</strong> ${product.approved && product.visible ? 'Live product' : 'Awaiting approval'}</p>
        <p><strong>Verification:</strong> ${product.verifiedSeller ? 'Verified seller' : 'Manual review needed'}</p>
        <p>${safeWebsiteUrl}</p>
        ${adminAccessGranted ? `<button class="btn btn-primary" type="button" data-approve-product="${product.id}">Approve product</button>` : ''}
      `;
      if (adminAccessGranted) {
        card.querySelector('[data-approve-product]')?.addEventListener('click', () => approveProduct(product.id));
      }
      adminProductList.appendChild(card);
    });
  };

  const originalRenderAds = renderAds;
  renderAds = () => {
    originalRenderAds();
    renderAdminPartners();
    renderAdminProducts();
  };
}

async function initializeMarketplace() {
  syncOwnerOnlyVisibility();
  renderAds();
  renderResults();

  const accessGranted = await ensureAdminAccess();
  if (!accessGranted && isAdminPage() && adminAdsList) {
    adminAdsList.innerHTML = '<p>Owner access required to view ad requests.</p>';
  }

  await loadMarketplaceData();
}

initializeMarketplace();
initializeCustomerTheme();
syncOwnerOnlyVisibility();
if (companyNameInput) {
  companyNameInput.value = getCompanySessionName();
}
if (companyOwnerEmailInput) {
  companyOwnerEmailInput.value = getCompanySessionEmail();
}
if (companyAccessKeyInput) {
  companyAccessKeyInput.value = getCompanySessionKey();
}
if (companyAccessMessage && hasCompanySession()) {
  companyAccessMessage.textContent = `Company access loaded for ${getCompanySessionName()}.`;
}
if (document.getElementById('mapLeaflet')) initMap();
if (document.getElementById('mapLeaflet')) {
  setInterval(() => {
    checkStockReminders().catch(() => {});
  }, 60000);
}

// ── Live viewer beacon (runs on every page) ───────────────────────
function initViewerBeacon() {
  if (document.getElementById('ownerViewerBadge')) return;

  let sid = sessionStorage.getItem('_teyoSid');
  if (!sid) {
    sid = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('_teyoSid', sid);
  }

  function ping() {
    fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s: sid }),
      keepalive: true
    }).catch(() => {});
  }

  ping();
  setInterval(ping, 15000);

  if (!hasOwnerSession()) return;

  // — Badge —
  const badge = document.createElement('div');
  badge.id = 'ownerViewerBadge';
  badge.title = 'Click to open Teyo dashboard';
  badge.style.cssText = [
    'position:fixed', 'bottom:22px', 'left:22px',
    'background:rgba(8,8,16,0.92)', 'color:#7c7cff',
    'border:1.5px solid #7c7cff', 'border-radius:22px',
    'padding:5px 15px', 'font-size:0.76rem', 'font-weight:700',
    'z-index:99999', 'backdrop-filter:blur(10px)',
    'letter-spacing:0.05em', 'cursor:pointer', 'user-select:none',
    'box-shadow:0 2px 12px rgba(124,124,255,0.25)'
  ].join(';');
  badge.textContent = '\u{1F441} \u2014 live';
  document.body.appendChild(badge);

  // — Stats panel —
  const panel = document.createElement('div');
  panel.id = 'ownerStatsPanel';
  panel.style.cssText = [
    'position:fixed', 'bottom:62px', 'left:22px',
    'background:rgba(8,8,22,0.97)', 'color:#e8e8ff',
    'border:1.5px solid #7c7cff', 'border-radius:16px',
    'padding:16px 20px', 'font-size:0.82rem', 'line-height:1.8',
    'z-index:99998', 'backdrop-filter:blur(12px)',
    'box-shadow:0 4px 24px rgba(124,124,255,0.3)',
    'min-width:250px', 'display:none'
  ].join(';');
  panel.innerHTML = '<p style="margin:0;opacity:0.5;font-size:0.72rem">Loading…</p>';
  document.body.appendChild(panel);

  let panelOpen = false;

  function renderPanel(d) {
    const raise = d.recommendedPriceCents > d.currentPriceCents;
    panel.innerHTML =
      `<div style="font-weight:800;font-size:0.9rem;margin-bottom:10px;color:#7c7cff">📊 Teyo Dashboard</div>`
      + `<div>👁 Live viewers: <strong>${d.liveViewers}</strong></div>`
      + `<div>📈 Total visitors: <strong>${(d.totalVisitors || 0).toLocaleString()}</strong></div>`
      + `<hr style="border:0;border-top:1px solid rgba(124,124,255,0.25);margin:10px 0"/>`
      + `<div>💰 Listing price: <strong>$${Math.round(d.currentPriceCents / 100)}</strong></div>`
      + `<div style="font-size:0.78rem;color:#aaa;margin-top:2px">${escapeHtml(d.priceAdvice)}</div>`
      + (raise
        ? `<div style="margin-top:10px;padding:8px 10px;background:rgba(50,200,100,0.12);border:1px solid rgba(50,200,100,0.3);border-radius:10px;color:#32c864;font-size:0.78rem">`
          + `💡 Suggested raise → <strong>${escapeHtml(d.recommendedPrice)}</strong></div>`
        : '');
  }

  function fetchStats() {
    fetch('/api/owner/stats', { headers: getAdminHeaders() })
      .then((r) => r.json())
      .then((d) => {
        badge.textContent = `\u{1F441} ${d.liveViewers} live`;
        if (panelOpen) renderPanel(d);
      })
      .catch(() => {});
  }

  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    panelOpen = !panelOpen;
    panel.style.display = panelOpen ? 'block' : 'none';
    if (panelOpen) fetchStats();
  });
  document.addEventListener('click', () => {
    if (panelOpen) { panelOpen = false; panel.style.display = 'none'; }
  });
  panel.addEventListener('click', (e) => e.stopPropagation());

  fetchStats();
  setInterval(fetchStats, 15000);
}
initViewerBeacon();
