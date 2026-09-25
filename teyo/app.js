const products = [
  { id: 1, name: 'The Psychology of Money', brand: 'Penguin', category: 'books', price: 19, stock: 42, detail: 'Morgan Housel · Hardcover', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800' },
  { id: 2, name: 'Atomic Habits', brand: 'Random House', category: 'books', price: 17, stock: 31, detail: 'James Clear · Paperback', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800' },
  { id: 3, name: 'Nike Air Max', brand: 'Nike', category: 'shoes', price: 149, stock: 23, detail: 'Size 10 · Black', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800' },
  { id: 4, name: 'Adidas Ultraboost', brand: 'Adidas', category: 'shoes', price: 129, stock: 8, detail: 'Size 11 · White', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800' },
  { id: 5, name: 'New Balance 550', brand: 'New Balance', category: 'shoes', price: 119, stock: 34, detail: 'Size 9 · White', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800' },
  { id: 6, name: 'RTX 5070 Gaming PC', brand: 'Custom', category: 'pc', price: 1899, stock: 12, detail: 'RTX 5070 · Intel i7 · 32GB', image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800' },
  { id: 7, name: 'RTX 5080 Gaming PC', brand: 'Custom', category: 'pc', price: 2799, stock: 6, detail: 'RTX 5080 · Ryzen 9 · 64GB', image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800' },
  { id: 8, name: 'Gaming Laptop RTX', brand: 'ASUS', category: 'pc', price: 1999, stock: 15, detail: 'RTX 5070 · Intel i9 · 32GB', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800' },
  { id: 9, name: 'Yamaha Electric Guitar', brand: 'Yamaha', category: 'guitar', price: 499, stock: 9, detail: 'Electric · Black', image: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=800' },
  { id: 10, name: 'Fender Stratocaster', brand: 'Fender', category: 'guitar', price: 1299, stock: 7, detail: 'Stratocaster · Red', image: 'https://images.unsplash.com/photo-1529518969858-8baa65152fc8?w=800' },
  { id: 11, name: 'Optimus Prime Figure', brand: 'Hasbro', category: 'transformers', price: 49, stock: 30, detail: 'Action Figure · 7 inch', image: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=800' },
  { id: 12, name: 'Transformers LEGO Set', brand: 'LEGO', category: 'transformers', price: 179, stock: 12, detail: 'LEGO · 1,506 pieces', image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800' },
  { id: 13, name: 'Transformers Wall Poster', brand: 'Fan Art Studio', category: 'transformers', price: 24, stock: 64, detail: 'Poster · 24 x 36 inch', image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800' }
];

const input = document.getElementById('searchInput');
const button = document.getElementById('searchButton');
const experience = document.getElementById('searchExperience');
const resultsPage = document.getElementById('resultsPage');
const grid = document.getElementById('productGrid');
const title = document.getElementById('resultTitle');
const count = document.getElementById('resultCount');
const popular = document.getElementById('popularSearches');
const popularList = document.getElementById('popularSearchList');
const modal = document.getElementById('productModal');
const modalProduct = document.getElementById('modalProduct');
const preferencesPanel = document.getElementById('preferencesPanel');
const preferencesContent = document.getElementById('preferencesContent');
let searchHistory = {};
let searchRequest = 0;

try {
  searchHistory = JSON.parse(localStorage.getItem('teyoSearchHistory') || '{}');
} catch (error) {
  searchHistory = {};
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function renderPopular(query) {
  const value = query.trim();
  if (!value) {
    const defaults = ['Wireless Earbuds', 'Smartwatches', 'Electric Vehicles', 'Home Office Gear', 'New Laptop Models'];
    popular.classList.remove('hidden');
    popularList.innerHTML = defaults.map((item, index) => `<button type="button" class="popular-item" data-query="${item}"><span>${index + 1}</span><b>${item}</b></button>`).join('');
    popularList.querySelectorAll('.popular-item').forEach((item) => {
      item.addEventListener('click', () => search(item.dataset.query));
    });
    return;
  }
  popular.classList.remove('hidden');
  const searches = Object.entries(searchHistory).sort((a, b) => b[1] - a[1]).map(([item]) => item);
  const items = [...new Set([value, ...searches, `${value} deals`, `${value} top rated`])].slice(0, 5);
  popularList.innerHTML = items
    .map((item, index) => `<button type="button" class="popular-item" data-query="${escapeHTML(item)}"><span>${index + 1}</span><b>${escapeHTML(item)}</b></button>`).join('');
  popularList.querySelectorAll('.popular-item').forEach((item) => {
    item.addEventListener('click', () => search(item.dataset.query));
  });
}

function understandSearch(query) {
  const value = query.toLowerCase();
  if (value.includes('shoe') || value.includes('sneaker') || value.includes('boot')) return 'shoes';
  if (value.includes('book') || value.includes('novel')) return 'books';
  if (value.includes('pc') || value.includes('computer') || value.includes('laptop') || value.includes('gaming')) return 'pc';
  if (value.includes('guitar')) return 'guitar';
  if (value.includes('transformer')) return 'transformers';
  return 'general';
}

function renderPreferences(category, query) {
  const presets = {
    shoes: [['SIZE', ['7', '8', '9', '10', '11', '12']], ['COLOR', ['Black', 'White', 'Red']], ['TYPE', ['Running', 'Casual', 'Basketball']]],
    books: [['AUTHOR', ['James Clear', 'Morgan Housel', 'Stephen King']], ['FORMAT', ['Paperback', 'Hardcover', 'Kindle']], ['GENRE', ['Business', 'Fiction', 'Self Help']]],
    pc: [['GPU', ['RTX 5070', 'RTX 5080', 'RTX 5090']], ['RAM', ['16GB', '32GB', '64GB']], ['STORAGE', ['1TB', '2TB', '4TB']]],
    guitar: [['TYPE', ['Electric', 'Acoustic', 'Bass']], ['COLOR', ['Black', 'Red', 'Sunburst']], ['BRAND', ['Fender', 'Gibson', 'Yamaha']]],
    transformers: [['FORMAT', ['Poster', 'Action Figure', 'LEGO', 'Digital']], ['CHARACTER', ['Optimus Prime', 'Bumblebee', 'Megatron']], ['PRICE', ['Under $50', '$50–200', '$200+']]],
    general: [['FORMAT', ['Poster', 'Action Figure', 'LEGO', 'Digital']], ['PRICE', ['Under $50', '$50–200', '$200+']], ['CONDITION', ['New', 'Used', 'Refurbished']]]
  };
  preferencesPanel.classList.remove('hidden');
  preferencesContent.innerHTML = `<div class="preference-query">${escapeHTML(query)}</div>${(presets[category] || presets.general).map(([label, options]) => `
    <div class="preference">
      <label>${label}</label>
      <div class="preference-options">${options.map((option, index) => `<button class="preference-option${index === 0 ? ' active' : ''}" type="button">${option}</button>`).join('')}</div>
    </div>
  `).join('')}`;
  preferencesContent.querySelectorAll('.preference-option').forEach((option) => {
    option.addEventListener('click', () => {
      option.parentElement.querySelectorAll('.preference-option').forEach((item) => item.classList.remove('active'));
      option.classList.add('active');
    });
  });
}

function renderProducts(query, ai) {
  const value = query.toLowerCase();
  const category = (ai && ai.category) || understandSearch(value);
  const keywords = (ai && ai.keywords && ai.keywords.length) ? ai.keywords : [value];
  const matches = products.filter((product) => {
    if (!value) return true;
    if (product.category === category) return true;
    const haystack = `${product.name} ${product.brand} ${product.category} ${product.detail}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword.toLowerCase())) || haystack.includes(value);
  });
  title.textContent = query ? `“${query}”` : '—';
  count.textContent = ai && ai.summary ? `${matches.length} results · ${ai.summary}` : `${matches.length} results`;
  grid.innerHTML = matches.length ? matches.map((product) => `
    <article class="product-card" data-id="${product.id}">
      <div class="product-image" style="background-image:url('${product.image}')"><span class="stock">${product.stock} IN STOCK</span></div>
      <div class="product-info">
        <div class="store"><span>${product.brand}</span><span>VERIFIED</span></div>
        <div class="product-name">${product.name}</div>
        <div class="product-details"><span>${product.detail}</span></div>
        <div class="price-row"><span class="price">${money(product.price)}</span><button class="view-button" type="button">VIEW</button></div>
      </div>
    </article>
  `).join('') : '<p class="no-results">No matching products found.</p>';
  grid.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (!event.target.closest('.view-button')) openProduct(Number(card.dataset.id));
    });
  });
  grid.querySelectorAll('.view-button').forEach((view) => {
    view.addEventListener('click', () => openProduct(Number(view.closest('.product-card').dataset.id)));
  });
}

async function aiSearch(query) {
  try {
    const response = await fetch('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await response.json();
    return data.success ? data : null;
  } catch (error) {
    return null;
  }
}

async function aiDescribeProduct(product, query) {
  try {
    const response = await fetch('/api/ai/describe-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: product.name,
        brand: product.brand,
        category: product.category,
        detail: product.detail,
        query: query || ''
      })
    });
    const data = await response.json();
    return data.success ? data : null;
  } catch (error) {
    return null;
  }
}

function search(query) {
  const value = query.trim();
  if (!value) return;
  input.value = value;
  const normalized = value.toLowerCase();
  searchHistory[normalized] = (searchHistory[normalized] || 0) + 1;
  localStorage.setItem('teyoSearchHistory', JSON.stringify(searchHistory));
  renderPopular(value);
  const requestId = ++searchRequest;
  experience.classList.add('searching', 'search-complete');
  resultsPage.classList.remove('visible');

  // Ask the AI to interpret the search (works for ANY query, not just fixed topics).
  const aiPromise = aiSearch(value);

  window.setTimeout(async () => {
    if (requestId !== searchRequest) return;
    const ai = await aiPromise;
    if (requestId !== searchRequest) return;
    const category = (ai && ai.category) || understandSearch(value);
    renderPreferences(category, value);
    renderProducts(value, ai);
    resultsPage.classList.add('visible');
  }, 850);
}

function openProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const fallbackDescription = 'A carefully matched listing with verified availability, product details, and current marketplace pricing.';
  modalProduct.innerHTML = `
    <div class="detail-hero">
      <img src="${product.image}" alt="${escapeHTML(product.name)}">
      <div>
        <small>${escapeHTML(product.brand)} · VERIFIED STORE</small>
        <h2>${escapeHTML(product.name)}</h2>
        <p id="aiDescription" class="ai-description">${escapeHTML(fallbackDescription)} <span class="ai-loading">✦ Teyo AI is writing a custom description…</span></p>
        <ul id="aiHighlights" class="ai-highlights"></ul>
        <p><b>${product.stock}</b> currently in stock</p>
        <strong>${money(product.price)}</strong>
        <a class="buy-link" href="${product.image}" target="_blank" rel="noreferrer">VIEW ONLINE LISTING ↗</a>
      </div>
    </div>
    <div class="detail-lower">
      <div>
        <div class="detail-section-title">360° VIEW</div>
        <div class="spin-view" style="background-image:url('${product.image}')"><span>DRAG TO ROTATE</span></div>
      </div>
      <div>
        <div class="detail-section-title">OTHER STORES & PRICES</div>
        <div class="store-row"><b>Recommended</b><span>${money(product.price)}</span></div>
        <div class="store-row"><span>Amazon Marketplace</span><span>${money(product.price + 8)}</span></div>
        <div class="store-row"><span>Walmart</span><span>${money(product.price + 14)}</span></div>
        <div class="detail-section-title rating-title">RATINGS & REVIEWS</div>
        <div class="rating">★★★★★ <span>4.8 / 5</span></div>
        <p class="review">“Excellent quality and arrived quickly.”<br><small>Verified purchaser</small></p>
      </div>
    </div>`;
  modal.classList.remove('hidden');

  aiDescribeProduct(product, input.value).then((result) => {
    const descriptionEl = document.getElementById('aiDescription');
    const highlightsEl = document.getElementById('aiHighlights');
    if (!descriptionEl) return;
    if (result && result.description) {
      descriptionEl.textContent = result.description;
      if (highlightsEl && result.highlights && result.highlights.length) {
        highlightsEl.innerHTML = result.highlights.map((point) => `<li>${escapeHTML(point)}</li>`).join('');
      }
    } else {
      descriptionEl.textContent = fallbackDescription;
    }
  });
}

function closeProduct() {
  modal.classList.add('hidden');
}

button.addEventListener('click', () => search(input.value));
input.addEventListener('input', () => renderPopular(input.value));
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') search(input.value);
});
document.getElementById('closeModal').addEventListener('click', closeProduct);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeProduct();
});

renderPopular('');
