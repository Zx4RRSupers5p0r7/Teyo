const products = [];

const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
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
const adminSetKeyBtn = document.getElementById('adminSetKeyBtn');
const adminClearKeyBtn = document.getElementById('adminClearKeyBtn');
const adminAccessMessage = document.getElementById('adminAccessMessage');
const ownerEmailInput = document.getElementById('ownerEmailInput');
const ownerKeyInput = document.getElementById('ownerKeyInput');
const ownerSetKeyBtn = document.getElementById('ownerSetKeyBtn');
const ownerClearKeyBtn = document.getElementById('ownerClearKeyBtn');
const ownerAccessMessage = document.getElementById('ownerAccessMessage');
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
const customerLeftStickerSelect = document.getElementById('customerLeftStickerSelect');
const customerRightStickerSelect = document.getElementById('customerRightStickerSelect');
const customerPlushieSelect = document.getElementById('customerPlushieSelect');
const customerPreviewLeft = document.getElementById('customerPreviewLeft');
const customerPreviewRight = document.getElementById('customerPreviewRight');
const customerPlushiePreview = document.getElementById('customerPlushiePreview');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

const customerThemeStorageKey = 'teyoCustomerThemeV1';
const customerThemeUnlockedKey = 'teyoCustomerThemeUnlockedV1';
const ownerEmailStorageKey = 'teyoOwnerEmailV1';
const ownerKeyStorageKey = 'teyoOwnerKeyV1';
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
  'theme-style-night'
];
const customerPresetClasses = [
  'theme-preset-kawaii',
  'theme-preset-strawberry',
  'theme-preset-cloud',
  'theme-preset-lavender',
  'theme-preset-mint',
  'theme-preset-cotton',
  'theme-preset-berry',
  'theme-preset-night'
];
const cuteStickerSymbols = {
  bow: '🎀',
  heart: '♡',
  star: '✦',
  cloud: '☁',
  flower: '✿',
  bunny: '🐰',
  sparkle: '✧',
  moon: '☾',
  pearl: '◌'
};
const plushieSymbols = {
  bunny: '🐰',
  bear: '🧸',
  cat: '🐱',
  frog: '🐸',
  star: '⭐'
};
const customerCuteThemes = {
  kawaii: { accent: '#ff9ad5', style: 'kawaii', leftSticker: 'bow', rightSticker: 'sparkle', plushie: 'bear' },
  strawberry: { accent: '#ff6f8f', style: 'strawberry', leftSticker: 'heart', rightSticker: 'flower', plushie: 'bunny' },
  cloud: { accent: '#9edcff', style: 'cloud', leftSticker: 'cloud', rightSticker: 'sparkle', plushie: 'star' },
  lavender: { accent: '#c7a8ff', style: 'lavender', leftSticker: 'flower', rightSticker: 'moon', plushie: 'cat' },
  mint: { accent: '#8be6c4', style: 'mint', leftSticker: 'sparkle', rightSticker: 'flower', plushie: 'frog' },
  cotton: { accent: '#ffb2f0', style: 'cotton', leftSticker: 'bow', rightSticker: 'heart', plushie: 'bear' },
  berry: { accent: '#ff7b93', style: 'berry', leftSticker: 'star', rightSticker: 'sparkle', plushie: 'cat' },
  night: { accent: '#d8c6ff', style: 'night', leftSticker: 'moon', rightSticker: 'star', plushie: 'star' }
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

function getAdminHeaders() {
  if (hasOwnerSession()) {
    return {
      'x-owner-email': getOwnerEmail(),
      'x-owner-key': getOwnerKey()
    };
  }

  const key = getAdminKey();
  return key ? { 'x-admin-key': key } : {};
}

function getOwnerHeaders() {
  if (!hasOwnerSession()) {
    return {};
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

function getCuteSymbol(name) {
  return cuteStickerSymbols[name] || cuteStickerSymbols.star;
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
    leftSticker: preset.leftSticker,
    rightSticker: preset.rightSticker,
    plushie: preset.plushie
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
    leftSticker: 'bow',
    rightSticker: 'star',
    plushie: 'bear'
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
    return {
      accent: normalizeHexColor(parsed.accent, presetTheme.accent),
      style,
      preset,
      leftSticker: normalizeThemeField(parsed.leftSticker, Object.keys(cuteStickerSymbols), presetTheme.leftSticker),
      rightSticker: normalizeThemeField(parsed.rightSticker, Object.keys(cuteStickerSymbols), presetTheme.rightSticker),
      plushie: normalizeThemeField(parsed.plushie, Object.keys(plushieSymbols), presetTheme.plushie)
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
    leftSticker: normalizeThemeField(theme.leftSticker, Object.keys(cuteStickerSymbols), presetTheme.leftSticker),
    rightSticker: normalizeThemeField(theme.rightSticker, Object.keys(cuteStickerSymbols), presetTheme.rightSticker),
    plushie: normalizeThemeField(theme.plushie, Object.keys(plushieSymbols), presetTheme.plushie)
  };

  document.documentElement.style.setProperty('--accent', safeTheme.accent);
  document.documentElement.style.setProperty('--accent-soft', lightenHex(safeTheme.accent, 20));

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
  if (customerLeftStickerSelect) {
    customerLeftStickerSelect.value = safeTheme.leftSticker;
  }
  if (customerRightStickerSelect) {
    customerRightStickerSelect.value = safeTheme.rightSticker;
  }
  if (customerPlushieSelect) {
    customerPlushieSelect.value = safeTheme.plushie;
  }
  if (customerPreviewLeft) {
    customerPreviewLeft.textContent = getCuteSymbol(safeTheme.leftSticker);
  }
  if (customerPreviewRight) {
    customerPreviewRight.textContent = getCuteSymbol(safeTheme.rightSticker);
  }
  if (customerPlushiePreview) {
    customerPlushiePreview.textContent = getPlushieSymbol(safeTheme.plushie);
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
  if (layer) {
    return layer;
  }

  layer = document.createElement('div');
  layer.id = 'customerCuteDecorLayer';
  layer.className = 'customer-cute-layer';
  layer.innerHTML = `
    <div class="customer-cute-badge customer-cute-badge-left" data-slot="left"></div>
    <div class="customer-cute-badge customer-cute-badge-right" data-slot="right"></div>
    <div class="customer-cute-badge customer-cute-plushie" data-slot="plushie"></div>
  `;
  document.body.appendChild(layer);
  return layer;
}

function updateCuteDecorLayer(theme) {
  const layer = ensureCuteDecorLayer();
  const unlocked = isCustomerThemeUnlocked();
  layer.hidden = !unlocked;
  const safeTheme = {
    leftSticker: normalizeThemeField(theme.leftSticker, Object.keys(cuteStickerSymbols), 'bow'),
    rightSticker: normalizeThemeField(theme.rightSticker, Object.keys(cuteStickerSymbols), 'star'),
    plushie: normalizeThemeField(theme.plushie, Object.keys(plushieSymbols), 'bear'),
    preset: normalizeThemeField(theme.preset, Object.keys(customerCuteThemes), 'kawaii')
  };

  const left = layer.querySelector('[data-slot="left"]');
  const right = layer.querySelector('[data-slot="right"]');
  const plushie = layer.querySelector('[data-slot="plushie"]');
  if (left) {
    left.innerHTML = `<span>${getCuteSymbol(safeTheme.leftSticker)}</span><small>Corner charm</small>`;
    left.style.setProperty('--decor-color', getPresetTheme(safeTheme.preset).accent);
  }
  if (right) {
    right.innerHTML = `<span>${getCuteSymbol(safeTheme.rightSticker)}</span><small>Happy glow</small>`;
    right.style.setProperty('--decor-color', getPresetTheme(safeTheme.preset).accent);
  }
  if (plushie) {
    plushie.innerHTML = `<span>${getPlushieSymbol(safeTheme.plushie)}</span><small>Plushie pal</small>`;
    plushie.style.setProperty('--decor-color', getPresetTheme(safeTheme.preset).accent);
  }
}

function initializeCustomerTheme() {
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

  const unlocked = isCustomerThemeUnlocked();
  const savedTheme = readCustomerTheme();

  if (hasOwnerSession()) {
    setCustomerThemeUnlocked(true);
  }

  applyCustomerTheme(savedTheme);
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
          leftSticker: presetTheme.leftSticker,
          rightSticker: presetTheme.rightSticker,
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

  if (customerLeftStickerSelect) {
    customerLeftStickerSelect.addEventListener('change', () => {
      if (!isCustomerThemeUnlocked()) {
        return;
      }
      const nextTheme = {
        ...readCustomerTheme(),
        leftSticker: normalizeThemeField(customerLeftStickerSelect.value, Object.keys(cuteStickerSymbols), 'bow')
      };
      saveCustomerTheme(nextTheme);
      applyCustomerTheme(nextTheme);
    });
  }

  if (customerRightStickerSelect) {
    customerRightStickerSelect.addEventListener('change', () => {
      if (!isCustomerThemeUnlocked()) {
        return;
      }
      const nextTheme = {
        ...readCustomerTheme(),
        rightSticker: normalizeThemeField(customerRightStickerSelect.value, Object.keys(cuteStickerSymbols), 'star')
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
  const visibleProducts = marketplaceState.products.filter((product) => isVisibleProduct(product));
  return visibleProducts.filter((product) => {
    const categoryMatch = category === 'all' || product.category === category;
    const searchMatch = !query || `${product.productName || product.name} ${product.companyName || product.company} ${product.description || ''} ${product.category || ''}`.toLowerCase().includes(query);
    return categoryMatch && searchMatch;
  });
}

function renderResults() {
  if (!resultsList) return;

  const items = filteredProducts();
  resultsList.innerHTML = '';

  if (!items.length) {
    resultsList.innerHTML = '<p>No approved brand listings are live yet. New company listings stay hidden until the $2,500 placement fee is approved and the product is reviewed.</p>';
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

function renderProduct(product) {
  if (!selectedProduct) return;

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
  const stores = Array.isArray(product.stores) && product.stores.length ? product.stores : ['Store availability is confirmed by the brand after approval.'];
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
    <p><strong>Safety guidance:</strong> ${getSafetySummary(product)}</p>
    <p><strong>Evidence source:</strong> Brand submission and admin review.</p>
    <div class="detail-actions">
      <a class="btn btn-primary" href="${safeWebsiteUrl}" target="_blank" rel="noreferrer">Visit brand site</a>
      <a class="btn btn-secondary" href="#map">Find nearby pickup</a>
    </div>
  `;

  renderStores(stores);
}

function renderStores(stores) {
  if (!storeList) return;

  storeList.innerHTML = '';
  const heading = document.createElement('p');
  heading.textContent = 'Nearby availability';
  heading.style.fontWeight = '700';
  storeList.appendChild(heading);
  stores.forEach((store) => {
    const entry = document.createElement('div');
    entry.innerHTML = `<strong>${escapeHtml(store)}</strong><p>Pickup and in-store availability near your selected area.</p>`;
    storeList.appendChild(entry);
  });
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
    renderTarget(adminAdsList, marketplaceState.ads, adminAccessGranted);
  }
}

async function loadMarketplaceData() {
  try {
    const sharedHeaders = hasOwnerSession() || isAdminPage() ? getAdminHeaders() : {};
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

  renderAds();
  renderResults();
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
      formMessage.textContent = result.message || 'Thanks — your request was submitted.';
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
    if (marketplaceLoadError) {
      adminPartnerList.insertAdjacentHTML('beforeend', `<p>${escapeHtml(marketplaceLoadError)}</p>`);
      return;
    }
    if (!adminAccessGranted) {
      adminPartnerList.insertAdjacentHTML('beforeend', '<p>View-only mode: enter admin access key to approve requests.</p>');
    }
    if (!marketplaceState.partners.length) {
      adminPartnerList.innerHTML = '<p>No partner requests yet.</p>';
      return;
    }

    const sortedPartners = [...marketplaceState.partners].sort((a, b) => {
      const left = new Date(b.createdAt || 0).getTime();
      const right = new Date(a.createdAt || 0).getTime();
      return left - right;
    });

    sortedPartners.forEach((partner) => {
      const card = document.createElement('div');
      card.className = 'ad-card';
      const safeCompanyName = escapeHtml(partner.companyName || '');
      const safeWebsiteUrl = escapeHtml(partner.websiteUrl || '');
      card.innerHTML = `
        <h4>${safeCompanyName}</h4>
        <p><strong>Status:</strong> ${partner.activeListing && partner.paid ? 'Live listing' : 'Awaiting payment approval'}</p>
        <p>${safeWebsiteUrl}</p>
        ${adminAccessGranted ? `<button class="btn btn-primary" type="button" data-approve-partner="${partner.id}">Approve placement</button>` : ''}
      `;
      if (adminAccessGranted) {
        card.querySelector('[data-approve-partner]')?.addEventListener('click', () => approvePartner(partner.id));
      }
      adminPartnerList.appendChild(card);
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
      adminProductList.insertAdjacentHTML('beforeend', '<p>View-only mode: enter admin access key to approve products.</p>');
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
    adminAdsList.innerHTML = '<p>View-only mode: enter admin access key to approve ads.</p>';
  }

  await loadMarketplaceData();
}

initializeMarketplace();
initializeCustomerTheme();
syncOwnerOnlyVisibility();