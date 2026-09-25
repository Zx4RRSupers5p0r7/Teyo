/* ==========================================================
   Teyo Frontend Logic
   CUSTOMIZE THIS FILE FOR:
   - search labels and filter names
   - category names and option text
   - default popular searches
   - product card content
   - search behavior and result display
   ========================================================== */
(function () {
  // =========================================
  // DOM ELEMENTS / PAGE STRUCTURE
  // These are the HTML parts this script reads and updates.
  // =========================================
  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar');
    const blankStage = document.querySelector('.blank-stage');
    const popularSearches = document.querySelector('.popular-searches');
    const popularList = document.querySelector('.popular-searches-list');
    const filterGroups = document.getElementById('filterGroups');
    const productGrid = document.getElementById('productGrid');
    const resultsQuery = document.getElementById('resultsQuery');
    const searchResults = document.querySelector('.search-results');
    const preferenceSearch = document.getElementById('preferenceSearch');
    const morePreferences = document.getElementById('morePreferences');
    const moreFilterGroups = document.getElementById('moreFilterGroups');
    const clearPreferences = document.getElementById('clearPreferences');
    const selectedPreferencesPanel = document.getElementById('selectedPreferences');
    const searchHistoryKey = 'teyoSearchHistory';
    const apiBaseUrl = window.location.port === '5500' ? 'http://localhost:3000' : '';

    if (!searchInput || !blankStage || !popularSearches || !popularList || !productGrid || !searchResults) {
      return;
    }

    let searchHistory = {};
    try {
      searchHistory = JSON.parse(window.localStorage.getItem(searchHistoryKey) || '{}');
    } catch (error) {
      searchHistory = {};
    }

    // =========================================
    // SEARCH CATEGORIES + FILTER LABELS
    // Edit here to change category names, visible filter groups,
    // and the option names users can choose from.
    // =========================================
    const baseFilters = {
      shoe: {
        groups: [
          { label: 'Size', options: ['6', '7', '8', '9', '10', '11'] },
          { label: 'Color', options: ['Black', 'White', 'Red', 'Blue', 'Gray'] },
          { label: 'Brand', options: ['Nike', 'Adidas', 'New Balance', 'Puma', 'ASICS'] },
          { label: 'Price', options: ['$50–100', '$100–180', '$180–250', '$250+'] }
        ]
      },
      'gaming pc': {
        groups: [
          { label: 'CPU', options: ['Intel i5', 'Intel i7', 'Ryzen 5', 'Ryzen 7'] },
          { label: 'GPU', options: ['RTX 4060', 'RTX 4070', 'RTX 4080', 'RTX 4090'] },
          { label: 'RAM', options: ['16GB', '32GB', '64GB', '128GB'] },
        ]
      },
      phone: {
        groups: [
          { label: 'Operating system', options: ['iOS', 'Android'] },
          { label: 'Storage', options: ['128GB', '256GB', '512GB', '1TB'] },
          { label: 'Screen size', options: ['Under 6 in', '6-6.5 in', '6.6+ in'] },
          { label: 'Connection', options: ['Unlocked', '5G', 'Dual SIM'] }
        ]
      },
      laptop: {
        groups: [
          { label: 'Use case', options: ['Everyday', 'Work', 'Creative', 'Gaming'] },
          { label: 'Processor', options: ['Intel Core', 'Apple Silicon', 'Ryzen', 'Snapdragon'] },
          { label: 'Memory', options: ['8GB', '16GB', '32GB', '64GB+'] },
          { label: 'Screen size', options: ['13 in', '14 in', '15 in', '16 in'] }
        ]
      },
      camera: {
        groups: [
          { label: 'Camera type', options: ['Mirrorless', 'DSLR', 'Point and shoot', 'Action'] },
          { label: 'Use case', options: ['Photo', 'Video', 'Travel', 'Wildlife'] },
          { label: 'Resolution', options: ['Under 24MP', '24-35MP', '36MP+'] },
          { label: 'Lens mount', options: ['Sony E', 'Canon RF', 'Nikon Z', 'Micro Four Thirds'] }
        ]
      },
      headphones: {
        groups: [
          { label: 'Style', options: ['Over-ear', 'On-ear', 'Earbuds', 'Sports'] },
          { label: 'Noise control', options: ['Noise cancelling', 'Passive isolation', 'Open back'] },
          { label: 'Connection', options: ['Bluetooth', 'Wired', 'USB-C'] },
          { label: 'Use case', options: ['Travel', 'Work', 'Gaming', 'Fitness'] }
        ]
      },
      book: {
        groups: [
          { label: 'Format', options: ['Hardcover', 'Paperback', 'Ebook', 'Audiobook'] },
          { label: 'Genre', options: ['Fiction', 'Nonfiction', 'Business', 'Self-help'] },
          { label: 'Audience', options: ['Adult', 'Young adult', 'Children', 'Professional'] },
          { label: 'Condition', options: ['New', 'Like new', 'Used', 'Collectible'] }
        ]
      },
      clothing: {
        groups: [
          { label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
          { label: 'Fit', options: ['Slim', 'Regular', 'Relaxed', 'Oversized'] },
          { label: 'Material', options: ['Cotton', 'Wool', 'Linen', 'Performance'] },
          { label: 'Color', options: ['Black', 'White', 'Blue', 'Gray', 'Red'] }
        ]
      },
      furniture: {
        groups: [
          { label: 'Room', options: ['Living room', 'Bedroom', 'Dining', 'Office'] },
          { label: 'Material', options: ['Wood', 'Metal', 'Fabric', 'Leather'] },
          { label: 'Style', options: ['Modern', 'Mid-century', 'Industrial', 'Traditional'] },
          { label: 'Size', options: ['Compact', 'Standard', 'Large', 'Extra large'] }
        ]
      },
      curtain: {
        groups: [
          { label: 'Width', options: ['Under 36 in', '36-54 in', '55-84 in', '85+ in'] },
          { label: 'Length', options: ['63 in', '84 in', '96 in', '108 in'] },
          { label: 'Light control', options: ['Sheer', 'Light filtering', 'Blackout', 'Thermal'] },
          { label: 'Hanging style', options: ['Rod pocket', 'Grommet', 'Back tab', 'Pleated'] }
        ]
      },
      kitchen: {
        groups: [
          { label: 'Appliance type', options: ['Small appliance', 'Cookware', 'Bakeware', 'Storage'] },
          { label: 'Material', options: ['Stainless steel', 'Cast iron', 'Glass', 'Ceramic'] },
          { label: 'Capacity', options: ['Compact', '2-4 servings', '5-8 servings', 'Family size'] },
          { label: 'Features', options: ['Dishwasher safe', 'Nonstick', 'Induction ready', 'Smart'] }
        ]
      },
      beauty: {
        groups: [
          { label: 'Product type', options: ['Skincare', 'Makeup', 'Haircare', 'Fragrance'] },
          { label: 'Skin or hair need', options: ['Sensitive', 'Dry', 'Oily', 'All types'] },
          { label: 'Formula', options: ['Clean', 'Vegan', 'Fragrance free', 'Dermatologist tested'] },
          { label: 'Finish', options: ['Matte', 'Natural', 'Dewy', 'Long wear'] }
        ]
      },
      jewelry: {
        groups: [
          { label: 'Item type', options: ['Ring', 'Necklace', 'Bracelet', 'Earrings'] },
          { label: 'Purity', options: ['10K', '14K', '18K', '24K'] },
          { label: 'Metal color', options: ['Yellow gold', 'White gold', 'Rose gold', 'Silver'] },
          { label: 'Stone', options: ['None', 'Diamond', 'Gemstone', 'Pearl'] }
        ]
      },
      outdoor: {
        groups: [
          { label: 'Activity', options: ['Hiking', 'Camping', 'Cycling', 'Travel'] },
          { label: 'Weather', options: ['Warm weather', 'Rainproof', 'Cold weather', 'All weather'] },
          { label: 'Capacity', options: ['Lightweight', 'Day trip', 'Overnight', 'Expedition'] },
          { label: 'Material', options: ['Nylon', 'Canvas', 'Leather', 'Technical fabric'] }
        ]
      },
      car: {
        groups: [
          { label: 'Vehicle type', options: ['Sedan', 'SUV', 'Truck', 'Electric'] },
          { label: 'Part category', options: ['Interior', 'Exterior', 'Performance', 'Maintenance'] },
          { label: 'Fitment', options: ['Universal', 'Make and model', 'Year specific'] },
          { label: 'Condition', options: ['New', 'Refurbished', 'Used', 'OEM'] }
        ]
      },
      watch: {
        groups: [
          { label: 'Brand', options: ['Apple', 'Rolex', 'Casio', 'Garmin', 'Seiko'] },
          { label: 'Size', options: ['38mm', '40mm', '42mm', '44mm'] },
          { label: 'Band', options: ['Leather', 'Steel', 'Rubber', 'Mesh'] },
          { label: 'Price', options: ['$100–300', '$300–700', '$700–1,200', '$1,200+'] }
        ]
      },
      default: {
        groups: [
          { label: 'Brand', options: ['Nike', 'Apple', 'Samsung', 'Sony', 'LG'] },
          { label: 'Color', options: ['Black', 'White', 'Silver', 'Blue', 'Red'] },
          { label: 'Price', options: ['$50–100', '$100–250', '$250–500', '$500+'] },
          { label: 'Size', options: ['S', 'M', 'L', 'XL'] }
        ]
      }
    };

    // =========================================
    // CATEGORY FILTERS
    // These define filter groups by item type.
    // =========================================
    const filterKeywords = {
      shoe: ['shoe', 'sneaker', 'boot', 'loafer', 'heel', 'sandal'],
      'gaming pc': ['gaming pc', 'gaming computer', 'desktop', 'gpu', 'graphics card'],
      phone: ['phone', 'iphone', 'android', 'smartphone', 'mobile'],
      laptop: ['laptop', 'macbook', 'chromebook', 'notebook'],
      camera: ['camera', 'dslr', 'mirrorless', 'lens', 'photography'],
      headphones: ['headphone', 'earbud', 'earphone', 'airpod', 'headset'],
      book: ['book', 'novel', 'textbook', 'journal', 'comic', 'reading'],
      clothing: ['shirt', 'dress', 'jacket', 'pants', 'jeans', 'coat', 'hoodie', 'clothing', 'apparel', 'sock', 'socks'],
      curtain: ['curtain', 'drape', 'window treatment', 'blinds', 'shade'],
      furniture: ['furniture', 'sofa', 'couch', 'chair', 'table', 'desk', 'dresser', 'shelf', 'bed'],
      kitchen: ['kitchen', 'cookware', 'pan', 'pot', 'blender', 'toaster', 'mixer', 'dish'],
      beauty: ['beauty', 'makeup', 'skincare', 'shampoo', 'conditioner', 'cosmetic', 'fragrance', 'perfume'],
      jewelry: ['jewelry', 'jewellery', 'gold', 'silver', 'diamond', 'ring', 'necklace', 'bracelet', 'earring'],
      outdoor: ['outdoor', 'camping', 'hiking', 'tent', 'backpack', 'cycling', 'kayak'],
      car: ['car', 'auto', 'vehicle', 'truck', 'tire', 'car part'],
      watch: ['watch', 'smartwatch', 'chrono', 'rolex', 'casio']
    };

    // =========================================
    // PREFERENCE SCHEMAS
    // These define all the option fields shown in the search filters.
    // =========================================
    // =========================================
    // PREFERENCE CHECKBOXES / SEARCH FIELDS
    // Change these values to edit visible text labels, price ranges,
    // and the default filter options shown in the sidebar.
    // =========================================
    const commonPreferences = [
      { id: 'price', name: 'Price', type: 'range', min: 0, max: 5000, step: 25, unit: '$', priority: 3, recommended: true },
      { id: 'brand', name: 'Brand', type: 'searchable-multi-select', options: ['Nike', 'Adidas', 'Apple', 'Samsung', 'Sony', 'ASUS', 'Garmin', 'Rolex', 'Canon', 'Dell'], searchable: true, multiSelect: true, priority: 2, recommended: true },
      { id: 'condition', name: 'Condition', type: 'multi-select', options: ['New', 'Like new', 'Used', 'Refurbished', 'Collectible'], multiSelect: true, priority: 8 },
      { id: 'availability', name: 'Availability', type: 'multi-select', options: ['In stock', 'Ships today', 'Local pickup', 'Preorder'], multiSelect: true, priority: 9 },
      { id: 'rating', name: 'Rating', type: 'rating', min: 1, max: 5, step: 1, priority: 10 },
      { id: 'seller', name: 'Seller', type: 'searchable-select', options: ['Verified store', 'Official brand', 'Independent seller'], searchable: true, priority: 11 },
      { id: 'warranty', name: 'Warranty', type: 'single-select', options: ['Any', '1 year+', '2 years+', 'Lifetime'], priority: 12 }
    ];

    const preferenceSchemas = {
      'gaming pc': [
        { id: 'pcType', name: 'PC Type', type: 'single-select', options: ['Gaming PC', 'Desktop', 'Workstation', 'Mini PC'], priority: 1, recommended: true },
        { id: 'cpu', name: 'CPU', type: 'searchable-select', options: ['Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9'], searchable: true, priority: 4, recommended: true },
        { id: 'gpu', name: 'GPU', type: 'searchable-select', options: ['RTX 4060', 'RTX 4070', 'RTX 4080', 'RTX 4090', 'RTX 5090', 'Radeon RX 7900'], searchable: true, priority: 2, recommended: true },
        { id: 'ram', name: 'RAM', type: 'range', min: 8, max: 128, step: 8, unit: 'GB', priority: 3, recommended: true },
        { id: 'storage', name: 'Storage', type: 'range', min: 256, max: 8000, step: 256, unit: 'GB', priority: 5 },
        { id: 'storageType', name: 'Storage Type', type: 'multi-select', options: ['NVMe SSD', 'SATA SSD', 'HDD', 'Hybrid'], multiSelect: true, priority: 6 },
        { id: 'operatingSystem', name: 'Operating System', type: 'multi-select', options: ['Windows 11', 'Windows 10', 'Linux', 'No OS'], multiSelect: true, priority: 7 },
        { id: 'display', name: 'Display', type: 'multi-select', options: ['1080p', '1440p', '4K', 'Ultrawide'], multiSelect: true, priority: 8 },
        { id: 'refreshRate', name: 'Refresh Rate', type: 'single-select', options: ['60Hz', '120Hz', '144Hz', '240Hz+'], priority: 9 },
        { id: 'cooling', name: 'Cooling', type: 'multi-select', options: ['Air', 'Liquid', 'AIO', 'Custom loop'], multiSelect: true, priority: 10 },
        { id: 'connectivity', name: 'Connectivity', type: 'multi-select', options: ['Wi-Fi', 'Bluetooth', 'Ethernet', 'USB-C'], multiSelect: true, priority: 11 },
        { id: 'ports', name: 'Ports', type: 'multi-select', options: ['USB-A', 'USB-C', 'HDMI', 'DisplayPort', 'Thunderbolt'], multiSelect: true, priority: 12, dependency: { id: 'pcType', values: ['Gaming PC', 'Workstation'] } },
        { id: 'powerSupply', name: 'Power Supply', type: 'single-select', options: ['500W+', '650W+', '850W+', '1000W+'], priority: 13, dependency: { id: 'pcType', values: ['Gaming PC', 'Workstation'] } },
        ...commonPreferences
      ],
      shoe: [
        { id: 'size', name: 'Size', type: 'multi-select', options: ['6', '7', '8', '9', '10', '11', '12', '13'], multiSelect: true, priority: 1, recommended: true },
        { id: 'gender', name: 'Gender', type: 'single-select', options: ['Women', 'Men', 'Unisex', 'Kids'], priority: 2, recommended: true },
        { id: 'shoeType', name: 'Shoe Type', type: 'multi-select', options: ['Running', 'Training', 'Casual', 'Hiking', 'Boots', 'Sandals'], multiSelect: true, priority: 3, recommended: true },
        { id: 'color', name: 'Color', type: 'searchable-multi-select', options: ['Black', 'White', 'Red', 'Blue', 'Green', 'Gray', 'Brown'], searchable: true, multiSelect: true, priority: 4, recommended: true },
        { id: 'material', name: 'Material', type: 'multi-select', options: ['Leather', 'Mesh', 'Canvas', 'Synthetic', 'Knit'], multiSelect: true, priority: 5 },
        { id: 'waterproof', name: 'Waterproof', type: 'boolean', priority: 6 },
        { id: 'activity', name: 'Activity', type: 'multi-select', options: ['Running', 'Walking', 'Gym', 'Trail', 'Work'], multiSelect: true, priority: 7 },
        { id: 'runningSurface', name: 'Running Surface', type: 'multi-select', options: ['Road', 'Trail', 'Track', 'Treadmill'], multiSelect: true, priority: 8, dependency: { id: 'shoeType', values: ['Running'] } },
        { id: 'cushioning', name: 'Cushioning', type: 'multi-select', options: ['Minimal', 'Balanced', 'Maximum'], multiSelect: true, priority: 9, dependency: { id: 'shoeType', values: ['Running'] } },
        { id: 'stability', name: 'Stability', type: 'single-select', options: ['Neutral', 'Guidance', 'Motion control'], priority: 10, dependency: { id: 'shoeType', values: ['Running'] } },
        { id: 'drop', name: 'Heel-to-Toe Drop', type: 'range', min: 0, max: 14, step: 1, unit: 'mm', priority: 11, dependency: { id: 'shoeType', values: ['Running'] } },
        ...commonPreferences
      ],
      book: [
        { id: 'author', name: 'Author', type: 'searchable-multi-select', options: ['Stephen King', 'Stephen Covey', 'J.K. Rowling', 'James Clear', 'Morgan Housel', 'Yuval Noah Harari'], searchable: true, multiSelect: true, priority: 1, recommended: true },
        { id: 'genre', name: 'Genre', type: 'multi-select', options: ['Fiction', 'Nonfiction', 'Business', 'Self-help', 'Fantasy', 'Mystery', 'Biography'], multiSelect: true, priority: 2, recommended: true },
        { id: 'format', name: 'Format', type: 'multi-select', options: ['Hardcover', 'Paperback', 'Ebook', 'Audiobook'], multiSelect: true, priority: 3, recommended: true },
        { id: 'language', name: 'Language', type: 'searchable-select', options: ['English', 'French', 'Spanish', 'German', 'Japanese'], searchable: true, priority: 4 },
        { id: 'publisher', name: 'Publisher', type: 'searchable-select', options: ['Penguin Random House', 'HarperCollins', 'Simon & Schuster', 'Macmillan'], searchable: true, priority: 5 },
        { id: 'publicationDate', name: 'Publication Date', type: 'date-range', priority: 6 },
        { id: 'edition', name: 'Edition', type: 'text-input', allowCustomValue: true, priority: 7 },
        { id: 'series', name: 'Series', type: 'searchable-select', options: ['Standalone', 'Harry Potter', 'The Lord of the Rings', 'Dune'], searchable: true, priority: 8 },
        { id: 'pageCount', name: 'Page Count', type: 'range', min: 0, max: 2000, step: 50, unit: 'pages', priority: 9 },
        ...commonPreferences
      ],
      jewelry: [
        { id: 'itemType', name: 'Item Type', type: 'multi-select', options: ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Watch'], multiSelect: true, priority: 1, recommended: true },
        { id: 'purity', name: 'Purity', type: 'multi-select', options: ['10K', '14K', '18K', '22K', '24K'], multiSelect: true, priority: 2, recommended: true },
        { id: 'metalColor', name: 'Metal Color', type: 'multi-select', options: ['Yellow gold', 'White gold', 'Rose gold', 'Silver', 'Platinum'], multiSelect: true, priority: 3, recommended: true },
        { id: 'stone', name: 'Stone', type: 'searchable-multi-select', options: ['None', 'Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Pearl'], searchable: true, multiSelect: true, priority: 4, recommended: true },
        { id: 'carat', name: 'Carat', type: 'range', min: 0, max: 10, step: 0.1, unit: 'ct', priority: 5 },
        ...commonPreferences
      ],
      curtain: [
        { id: 'width', name: 'Width', type: 'range', min: 12, max: 200, step: 1, unit: 'in', priority: 1, recommended: true },
        { id: 'length', name: 'Length', type: 'multi-select', options: ['63 in', '84 in', '96 in', '108 in', 'Custom'], multiSelect: true, priority: 2, recommended: true },
        { id: 'lightControl', name: 'Light Control', type: 'multi-select', options: ['Sheer', 'Light filtering', 'Blackout', 'Thermal'], multiSelect: true, priority: 3, recommended: true },
        { id: 'hangingStyle', name: 'Hanging Style', type: 'multi-select', options: ['Rod pocket', 'Grommet', 'Back tab', 'Pleated'], multiSelect: true, priority: 4, recommended: true },
        { id: 'panelCount', name: 'Panel Count', type: 'single-select', options: ['1 panel', '2 panels', '3 panels', '4 panels'], priority: 5 },
        { id: 'pattern', name: 'Pattern', type: 'multi-select', options: ['Solid', 'Striped', 'Floral', 'Geometric', 'Textured'], multiSelect: true, priority: 6 },
        ...commonPreferences
      ],
      phone: [
        { id: 'operatingSystem', name: 'Operating System', type: 'single-select', options: ['iOS', 'Android'], priority: 1, recommended: true },
        { id: 'storage', name: 'Storage', type: 'multi-select', options: ['128GB', '256GB', '512GB', '1TB'], multiSelect: true, priority: 2, recommended: true },
        { id: 'screenSize', name: 'Screen Size', type: 'multi-select', options: ['Under 6 in', '6-6.5 in', '6.6+ in'], multiSelect: true, priority: 3, recommended: true },
        { id: 'connection', name: 'Connection', type: 'multi-select', options: ['Unlocked', '5G', 'Dual SIM'], multiSelect: true, priority: 4, recommended: true },
        { id: 'camera', name: 'Camera', type: 'multi-select', options: ['Standard', 'Telephoto', 'Ultrawide', 'Pro video'], multiSelect: true, priority: 5 },
        ...commonPreferences
      ],
      clothing: [
        { id: 'clothingType', name: 'Clothing Type', type: 'multi-select', options: ['Socks', 'Shirt', 'Pants', 'Jacket', 'Dress'], multiSelect: true, priority: 1, recommended: true },
        { id: 'size', name: 'Size', type: 'multi-select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], multiSelect: true, priority: 2, recommended: true },
        { id: 'gender', name: 'Gender', type: 'single-select', options: ['Women', 'Men', 'Unisex', 'Kids'], priority: 3, recommended: true },
        { id: 'material', name: 'Material', type: 'searchable-multi-select', options: ['Cotton', 'Wool', 'Bamboo', 'Nylon', 'Polyester', 'Merino wool'], searchable: true, multiSelect: true, priority: 4, recommended: true },
        { id: 'length', name: 'Length', type: 'multi-select', options: ['No-show', 'Ankle', 'Crew', 'Knee-high', 'Over-the-knee'], multiSelect: true, priority: 5 },
        { id: 'cushioning', name: 'Cushioning', type: 'multi-select', options: ['Light', 'Medium', 'Heavy', 'Compression'], multiSelect: true, priority: 6 },
        { id: 'activity', name: 'Activity', type: 'multi-select', options: ['Everyday', 'Running', 'Hiking', 'Dress', 'Athletic'], multiSelect: true, priority: 7 },
        { id: 'color', name: 'Color', type: 'searchable-multi-select', options: ['Black', 'White', 'Gray', 'Blue', 'Red', 'Purple'], searchable: true, multiSelect: true, priority: 8 },
        ...commonPreferences
      ],
      default: commonPreferences.concat([
        { id: 'color', name: 'Color', type: 'searchable-multi-select', options: ['Black', 'White', 'Silver', 'Blue', 'Red', 'Green'], searchable: true, multiSelect: true, priority: 1, recommended: true },
        { id: 'size', name: 'Size', type: 'text-input', allowCustomValue: true, priority: 2, recommended: true },
        { id: 'useCase', name: 'Use Case', type: 'text-input', allowCustomValue: true, priority: 3, recommended: true }
      ])
    };

    const discoveryTemplates = [
      {
        category: 'collectibles',
        keywords: ['transformer', 'collectible', 'action figure', 'figurine'],
        attributes: [
          { id: 'character', name: 'Character', type: 'searchable-multi-select', options: ['Optimus Prime', 'Bumblebee', 'Megatron', 'Starscream'], searchable: true, multiSelect: true, priority: 1, recommended: true },
          { id: 'series', name: 'Series', type: 'searchable-select', options: ['G1', 'Beast Wars', 'Animated', 'Studio Series'], searchable: true, priority: 2, recommended: true },
          { id: 'figureType', name: 'Figure Type', type: 'multi-select', options: ['Action figure', 'Vehicle', 'Statue', 'Model kit', 'Poster', 'Art print'], multiSelect: true, priority: 3, recommended: true },
          { id: 'generation', name: 'Generation', type: 'searchable-select', options: ['G1', 'G2', 'Beast Wars', 'Animated', 'Prime'], searchable: true, priority: 4 },
          { id: 'edition', name: 'Edition', type: 'searchable-select', options: ['Standard', 'Limited', 'Exclusive', 'Anniversary'], searchable: true, priority: 5 },
          { id: 'scale', name: 'Scale', type: 'single-select', options: ['1:64', '1:32', '1:24', '1:12'], priority: 6 },
          { id: 'manufacturer', name: 'Manufacturer', type: 'searchable-select', options: ['Hasbro', 'Takara Tomy', 'Threezero', 'Flame Toys'], searchable: true, priority: 7, recommended: true },
          { id: 'releaseYear', name: 'Release Year', type: 'range', min: 1980, max: 2026, step: 1, priority: 8 },
          { id: 'authenticity', name: 'Authenticity', type: 'single-select', options: ['Verified', 'Licensed', 'Unlicensed', 'Reproduction'], priority: 9 },
          { id: 'posterDimensions', name: 'Poster Dimensions', type: 'text-input', allowCustomValue: true, priority: 10, dependency: { id: 'figureType', values: ['Poster', 'Art print'] } },
          { id: 'paperFinish', name: 'Paper Finish', type: 'multi-select', options: ['Matte', 'Glossy', 'Satin', 'Laminated'], multiSelect: true, priority: 11, dependency: { id: 'figureType', values: ['Poster', 'Art print'] } },
          { id: 'framing', name: 'Framing', type: 'single-select', options: ['Unframed', 'Framed', 'Mounted', 'Canvas'], priority: 12, dependency: { id: 'figureType', values: ['Poster', 'Art print'] } },
          ...commonPreferences.filter((field) => field.id !== 'brand')
        ]
      },
      {
        category: 'piano',
        keywords: ['piano', 'keyboard'],
        attributes: [
          { id: 'pianoType', name: 'Piano Type', type: 'single-select', options: ['Acoustic', 'Digital', 'Stage', 'Hybrid'], priority: 1, recommended: true },
          { id: 'keyCount', name: 'Key Count', type: 'single-select', options: ['61', '76', '88'], priority: 2, recommended: true },
          { id: 'keyAction', name: 'Key Action', type: 'multi-select', options: ['Weighted', 'Hammer action', 'Semi-weighted', 'Synth action'], multiSelect: true, priority: 3, recommended: true },
          { id: 'polyphony', name: 'Polyphony', type: 'range', min: 32, max: 512, step: 32, unit: 'voices', priority: 4 },
          { id: 'connectivity', name: 'Connectivity', type: 'multi-select', options: ['USB', 'MIDI', 'Bluetooth', 'Audio out'], multiSelect: true, priority: 5 },
          { id: 'finish', name: 'Finish', type: 'multi-select', options: ['Black', 'White', 'Wood', 'Polished'], multiSelect: true, priority: 6 },
          { id: 'dimensions', name: 'Dimensions', type: 'text-input', allowCustomValue: true, priority: 7 },
          ...commonPreferences
        ]
      },
      {
        category: 'real-estate',
        keywords: ['house', 'home', 'property', 'real estate', 'condo'],
        attributes: [
          { id: 'location', name: 'Location', type: 'searchable-text', searchable: true, allowCustomValue: true, priority: 1, recommended: true },
          { id: 'propertyType', name: 'Property Type', type: 'multi-select', options: ['House', 'Condo', 'Townhouse', 'Land'], multiSelect: true, priority: 2, recommended: true },
          { id: 'bedrooms', name: 'Bedrooms', type: 'range', min: 0, max: 10, step: 1, priority: 3, recommended: true },
          { id: 'bathrooms', name: 'Bathrooms', type: 'range', min: 0, max: 10, step: 0.5, priority: 4, recommended: true },
          { id: 'squareFootage', name: 'Square Footage', type: 'range', min: 200, max: 10000, step: 100, unit: 'sq ft', priority: 5 },
          { id: 'lotSize', name: 'Lot Size', type: 'text-input', allowCustomValue: true, priority: 6 },
          { id: 'amenities', name: 'Amenities', type: 'multi-select', options: ['Garage', 'Basement', 'Waterfront', 'Pool', 'Central air'], multiSelect: true, priority: 7 },
          ...commonPreferences
        ]
      },
      {
        category: 'motorcycle',
        keywords: ['motorcycle', 'motorbike', 'yamaha r1', 'sport bike'],
        attributes: [
          { id: 'generation', name: 'Generation', type: 'searchable-select', options: ['First generation', 'Second generation', 'Third generation', 'Current generation'], searchable: true, priority: 1, recommended: true },
          { id: 'modelYear', name: 'Model Year', type: 'range', min: 1980, max: 2026, step: 1, priority: 2, recommended: true },
          { id: 'mileage', name: 'Mileage', type: 'range', min: 0, max: 100000, step: 1000, unit: 'mi', priority: 3, recommended: true },
          { id: 'electronics', name: 'Electronics', type: 'multi-select', options: ['ABS', 'Traction control', 'Quick shifter', 'Ride modes'], multiSelect: true, priority: 4 },
          { id: 'modifications', name: 'Modifications', type: 'multi-select', options: ['Stock', 'Exhaust', 'Suspension', 'Track setup'], multiSelect: true, priority: 5 },
          { id: 'location', name: 'Location', type: 'text-input', allowCustomValue: true, priority: 6 },
          ...commonPreferences
        ]
      },
      {
        category: 'electric-guitar',
        keywords: ['electric guitar', 'guitar'],
        attributes: [
          { id: 'bodyType', name: 'Body Type', type: 'multi-select', options: ['Solid body', 'Semi-hollow', 'Hollow body'], multiSelect: true, priority: 1, recommended: true },
          { id: 'pickupConfiguration', name: 'Pickup Configuration', type: 'multi-select', options: ['S-S-S', 'H-S-S', 'H-H', 'P-90'], multiSelect: true, priority: 2, recommended: true },
          { id: 'bodyWood', name: 'Body Wood', type: 'searchable-multi-select', options: ['Alder', 'Ash', 'Mahogany', 'Basswood', 'Maple'], searchable: true, multiSelect: true, priority: 3 },
          { id: 'scaleLength', name: 'Scale Length', type: 'single-select', options: ['24.75 in', '25.5 in', '27 in'], priority: 4 },
          { id: 'handedness', name: 'Handedness', type: 'single-select', options: ['Right-handed', 'Left-handed'], priority: 5 },
          { id: 'fretCount', name: 'Number of Frets', type: 'single-select', options: ['21', '22', '24'], priority: 6 },
          ...commonPreferences
        ]
      },
      {
        category: 'watch',
        keywords: ['rolex', 'watch', 'smartwatch', 'chronograph'],
        attributes: [
          { id: 'model', name: 'Model', type: 'searchable-select', options: ['Submariner', 'Datejust', 'Daytona', 'Seiko 5', 'Apple Watch'], searchable: true, priority: 1, recommended: true },
          { id: 'collection', name: 'Collection', type: 'searchable-select', options: ['Professional', 'Classic', 'Sport', 'Heritage'], searchable: true, priority: 2, recommended: true },
          { id: 'caseSize', name: 'Case Size', type: 'multi-select', options: ['36mm', '39mm', '41mm', '44mm'], multiSelect: true, priority: 3, recommended: true },
          { id: 'movement', name: 'Movement', type: 'multi-select', options: ['Automatic', 'Manual', 'Quartz', 'Solar'], multiSelect: true, priority: 4, recommended: true },
          { id: 'material', name: 'Material', type: 'multi-select', options: ['Steel', 'Gold', 'Titanium', 'Ceramic'], multiSelect: true, priority: 5 },
          { id: 'dial', name: 'Dial', type: 'searchable-multi-select', options: ['Black', 'White', 'Blue', 'Green', 'Silver'], searchable: true, multiSelect: true, priority: 6 },
          { id: 'boxAndPapers', name: 'Box and Papers', type: 'boolean', priority: 7 },
          { id: 'authenticity', name: 'Authenticity', type: 'single-select', options: ['Verified', 'Brand authenticated', 'Unverified'], priority: 8 },
          ...commonPreferences
        ]
      }
    ];

    let attributeDiscoveryProvider = null;

    function registerAttributeSchema({ category, keywords, attributes }) {
      if (!category || !Array.isArray(keywords) || !Array.isArray(attributes)) return false;
      discoveryTemplates.push({ category, keywords, attributes });
      return true;
    }

    const productPalettes = [
      'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04))',
      'linear-gradient(135deg, rgba(161,167,255,0.32), rgba(255,255,255,0.06))',
      'linear-gradient(135deg, rgba(143,227,193,0.28), rgba(255,255,255,0.05))',
      'linear-gradient(135deg, rgba(255,174,133,0.28), rgba(255,255,255,0.05))',
      'linear-gradient(135deg, rgba(255,122,122,0.28), rgba(255,255,255,0.06))'
    ];

    function normalizeKey(query) {
      return query.toLowerCase().trim();
    }

    function escapeHTML(value) {
      return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
      }[character]));
    }

    let currentSchema = [];
    let selectedPreferences = {};
    let showMorePreferences = false;
    let preferenceSearchTerm = '';
    let currentSearchContext = null;
    let catalogProducts = [];
    let catalogLoadPromise = null;

    function analyzeSearch(rawQuery) {
      const query = normalizeKey(rawQuery);
      const extractedRequirements = {};
      const color = ['black', 'white', 'red', 'blue', 'green', 'purple', 'brown', 'silver', 'gold'].find((value) => query.includes(value));
      const ageMatch = query.match(/\b(?:age|year[- ]old)\s*(\d{1,2})\b/);
      const yearMatch = query.match(/\b(?:19|20)\d{2}\b/);
      if (color) extractedRequirements.color = color;
      if (ageMatch) extractedRequirements.age = Number(ageMatch[1]);
      if (yearMatch) extractedRequirements.year = Number(yearMatch[0]);
      const keywordMatches = Object.entries(filterKeywords)
        .map(([category, keywords]) => ({
          category,
          score: keywords.reduce((total, keyword) => total + (query.includes(keyword) ? keyword.length : 0), 0)
        }))
        .filter((match) => match.score > 0)
        .sort((first, second) => second.score - first.score);
      const templateMatches = discoveryTemplates
        .map((template) => ({
          template,
          score: template.keywords.reduce((total, keyword) => total + (query.includes(keyword) ? keyword.length : 0), 0)
        }))
        .filter((match) => match.score > 0)
        .sort((first, second) => second.score - first.score);
      const taxonomyMatches = (window.TeyoTaxonomy?.categories || [])
        .map((category) => ({ category, score: category.terms.reduce((total, term) => total + (query.includes(term) ? term.length : 0), 0) }))
        .filter((match) => match.score > 0)
        .sort((first, second) => second.score - first.score);
      const keywordMatch = keywordMatches[0];
      const templateMatch = templateMatches[0];
      const taxonomyMatch = taxonomyMatches[0];
      const category = templateMatch && templateMatch.score >= (keywordMatch?.score || 0)
        ? templateMatch.template.category
        : keywordMatch?.category || taxonomyMatch?.category.id || 'unknown';
      const confidence = templateMatch && templateMatch.score >= (keywordMatch?.score || 0)
        ? Math.min(0.98, 0.72 + (templateMatch.score / 100))
        : keywordMatch
          ? Math.min(0.9, 0.58 + (keywordMatch.score / 100))
          : taxonomyMatch
            ? Math.min(0.7, 0.42 + (taxonomyMatch.score / 100))
            : 0.25;

      return {
        rawQuery,
        entity: { name: rawQuery.trim(), type: category, confidence },
        category,
        subcategory: category,
        context: {},
        extractedRequirements,
        intent: 'product-discovery',
        matchedTemplate: templateMatch?.template || null,
        taxonomyMatch: taxonomyMatch?.category || null,
        discoveredAttributes: []
      };
    }

    function discoverAttributes(searchContext, category, subcategory) {
      const context = typeof searchContext === 'string'
        ? analyzeSearch(searchContext)
        : searchContext;
      if (typeof attributeDiscoveryProvider === 'function') {
        const providedAttributes = attributeDiscoveryProvider(context);
        if (Array.isArray(providedAttributes) && providedAttributes.length) {
          return providedAttributes.map((field) => ({
            ...field,
            category: field.category || context.category,
            subcategory: field.subcategory || context.subcategory,
            confidence: field.confidence ?? context.entity.confidence,
            source: field.source || 'discovery-provider'
          }));
        }
      }
      const resolvedCategory = category || context.category;
      const template = context.matchedTemplate || discoveryTemplates.find((item) => item.category === resolvedCategory);
      const knownSchema = resolvedCategory !== 'unknown' && resolvedCategory !== 'default' ? preferenceSchemas[resolvedCategory] : null;
      const fields = template?.attributes || knownSchema || [
        { id: 'specificRequirements', name: 'Specific Requirements', type: 'text-input', description: `Describe the details that matter for ${context.entity.name}.`, allowCustomValue: true, priority: 1, recommended: true }
      ];

      return fields.map((field) => ({
        ...field,
        category: resolvedCategory,
        subcategory: subcategory || context.subcategory || resolvedCategory,
        description: field.description || `Useful for narrowing ${context.entity.name} by ${field.name.toLowerCase()}.`,
        relevance: field.relevance || field.priority || 1,
        confidence: field.confidence || (template || knownSchema ? 0.92 : 0.7),
        source: field.source || (template || knownSchema ? 'trusted-category-schema' : 'open-world-fallback')
      }));
    }

    function getPreferenceSchema(query) {
      currentSearchContext = analyzeSearch(query);
      currentSearchContext.discoveredAttributes = discoverAttributes(currentSearchContext);
      return currentSearchContext.discoveredAttributes;
    }

    async function loadPreferenceSchema(query) {
      const localSchema = getPreferenceSchema(query);
      try {
        const response = await fetch('/api/preferences/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        if (!response.ok) return localSchema;
        const payload = await response.json();
        if (!payload.success || !Array.isArray(payload.attributes) || !payload.attributes.length) return localSchema;
        currentSearchContext = { ...currentSearchContext, ...payload.context, rawQuery: query, discoveredAttributes: payload.attributes };
        return payload.attributes;
      } catch (error) {
        return localSchema;
      }
    }

    function detectSearchPreferences(query, schema) {
      const key = normalizeKey(query);
      return schema.reduce((detected, field) => {
        const value = field.options?.find((option) => key.includes(option.toLowerCase()));
        if (value) detected[field.id] = field.multiSelect ? [value] : value;
        const extractedColor = currentSearchContext?.extractedRequirements?.color;
        if (field.id === 'color' && extractedColor && field.options?.some((option) => option.toLowerCase() === extractedColor)) {
          detected[field.id] = field.multiSelect ? [extractedColor] : extractedColor;
        }
        return detected;
      }, {});
    }

    function preferenceValueMarkup(field) {
      const selected = selectedPreferences[field.id];
      const selectedValues = Array.isArray(selected) ? selected : selected ? [selected] : [];
      const options = [...new Set([...(field.options || []), ...selectedValues])];
      const optionMarkup = options.map((option) => `
        <button class="filter-chip ${selectedValues.includes(option) ? 'active' : ''}" type="button" data-preference-id="${escapeHTML(field.id)}" data-preference-value="${escapeHTML(option)}">${escapeHTML(option)}</button>
      `).join('');

      if (field.type === 'range' || field.type === 'numeric-input' || field.type === 'rating') {
        const value = selected ?? field.min ?? 0;
        const suffix = field.type === 'rating' ? '+ stars' : field.unit ? ` ${field.unit}` : '';
        return `<input class="preference-range" type="range" min="${field.min}" max="${field.max}" step="${field.step || 1}" value="${value}" data-preference-id="${field.id}" aria-label="${field.name}"><span class="preference-range-value" data-range-value="${field.id}">${value}${suffix}</span>`;
      }

      if (field.type === 'text-input' || field.type === 'searchable-text' || field.type === 'custom-value') {
        return `<input class="preference-text" type="text" value="${escapeHTML(selected || '')}" data-preference-id="${escapeHTML(field.id)}" placeholder="Enter ${escapeHTML(field.name.toLowerCase())}">`;
      }

      if (field.type === 'date-range') {
        return `<div class="preference-date-range"><input class="preference-text" type="date" data-preference-id="${field.id}-min" aria-label="${field.name} from"><input class="preference-text" type="date" data-preference-id="${field.id}-max" aria-label="${field.name} to"></div>`;
      }

      if (field.type === 'toggle' || field.type === 'boolean' || field.type === 'checkbox') {
        return `<label class="preference-toggle"><input type="checkbox" ${selected ? 'checked' : ''} data-preference-id="${field.id}"> Include ${field.name.toLowerCase()}</label>`;
      }

      return `${field.searchable ? `<input class="preference-value-search" type="search" placeholder="Search or add ${escapeHTML(field.name.toLowerCase())}..." data-value-search="${escapeHTML(field.id)}" aria-label="Search or add ${escapeHTML(field.name)}">` : ''}<div class="filter-options" data-options-for="${escapeHTML(field.id)}">${optionMarkup}</div>`;
    }

    function preferenceFieldMarkup(field) {
      return `<div class="preference-field" data-preference-name="${escapeHTML(field.name.toLowerCase())} ${escapeHTML(field.id.toLowerCase())}">
        <div class="filter-label">${escapeHTML(field.name)}</div>
        ${field.description ? `<div class="preference-description">${escapeHTML(field.description)}</div>` : ''}
        ${preferenceValueMarkup(field)}
      </div>`;
    }

    function dependencyIsSatisfied(field) {
      if (!field.dependency) return true;
      const selected = selectedPreferences[field.dependency.id];
      const values = Array.isArray(selected) ? selected : [selected];
      return values.some((value) => field.dependency.values.includes(value));
    }

    function renderSelectedSummary() {
      const entries = Object.entries(selectedPreferences).filter(([, value]) => value !== false && value !== '' && (!Array.isArray(value) || value.length));
      selectedPreferencesPanel.classList.toggle('hidden', !entries.length);
      selectedPreferencesPanel.innerHTML = entries.length ? `<div class="selected-preferences-title">Selected</div>${entries.map(([id, value]) => {
        const field = currentSchema.find((item) => item.id === id);
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        return `<div class="selected-preference"><span>${field?.name || id}: ${displayValue}</span><button class="selected-preference-remove" type="button" data-remove-preference="${id}" aria-label="Remove ${field?.name || id}">x</button></div>`;
      }).join('')}` : '';
      selectedPreferencesPanel.querySelectorAll('[data-remove-preference]').forEach((button) => {
        button.addEventListener('click', () => {
          delete selectedPreferences[button.dataset.removePreference];
          renderPreferenceGroups();
          renderProducts(resultsQuery.textContent);
        });
      });
    }

    function renderPreferenceGroups() {
      const term = preferenceSearchTerm.toLowerCase().trim();
      const visibleFields = currentSchema.filter((field) => dependencyIsSatisfied(field) && (!term || `${field.name} ${field.id}`.toLowerCase().includes(term)));
      const recommended = term ? visibleFields : visibleFields.filter((field) => field.recommended || field.priority <= 5).sort((a, b) => a.priority - b.priority);
      const additional = visibleFields.filter((field) => !recommended.includes(field)).sort((a, b) => a.priority - b.priority);

      filterGroups.innerHTML = recommended.length ? recommended.map(preferenceFieldMarkup).join('') : '<div class="preference-description">No matching preferences.</div>';
      morePreferences.classList.toggle('hidden', !additional.length);
      morePreferences.textContent = showMorePreferences ? 'Hide all preferences' : `All preferences (${additional.length})`;
      moreFilterGroups.classList.toggle('hidden', !showMorePreferences || !additional.length);
      moreFilterGroups.innerHTML = showMorePreferences ? additional.map(preferenceFieldMarkup).join('') : '';
      renderSelectedSummary();
      bindPreferenceControls();
    }

    function setPreferenceValue(id, value, multiSelect) {
      if (multiSelect) {
        const values = Array.isArray(selectedPreferences[id]) ? selectedPreferences[id] : [];
        selectedPreferences[id] = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
        if (!selectedPreferences[id].length) delete selectedPreferences[id];
      } else if (selectedPreferences[id] === value) {
        delete selectedPreferences[id];
      } else {
        selectedPreferences[id] = value;
      }
      renderPreferenceGroups();
      renderProducts(resultsQuery.textContent);
    }

    function bindPreferenceControls() {
      filterGroups.querySelectorAll('.filter-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const field = currentSchema.find((item) => item.id === chip.dataset.preferenceId);
          setPreferenceValue(chip.dataset.preferenceId, chip.dataset.preferenceValue, field?.multiSelect);
        });
      });

      moreFilterGroups.querySelectorAll('.filter-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const field = currentSchema.find((item) => item.id === chip.dataset.preferenceId);
          setPreferenceValue(chip.dataset.preferenceId, chip.dataset.preferenceValue, field?.multiSelect);
        });
      });

      document.querySelectorAll('[data-value-search]').forEach((input) => {
        input.addEventListener('input', () => {
          const options = document.querySelector(`[data-options-for="${input.dataset.valueSearch}"]`);
          const query = input.value.toLowerCase().trim();
          options?.querySelectorAll('.filter-chip').forEach((chip) => {
            const selected = chip.classList.contains('active');
            chip.classList.toggle('hidden', query && !selected && !chip.textContent.toLowerCase().includes(query));
          });
        });
        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' || !input.value.trim()) return;
          event.preventDefault();
          const field = currentSchema.find((item) => item.id === input.dataset.valueSearch);
          if (!field) return;
          setPreferenceValue(field.id, input.value.trim(), field.multiSelect);
        });
      });

      document.querySelectorAll('.preference-range, .preference-text, .preference-toggle input').forEach((control) => {
        control.addEventListener('input', () => {
          if (!control.value && control.type !== 'checkbox') return;
          selectedPreferences[control.dataset.preferenceId] = control.type === 'checkbox' ? control.checked : control.value;
          const field = currentSchema.find((item) => item.id === control.dataset.preferenceId);
          const rangeValue = document.querySelector(`[data-range-value="${control.dataset.preferenceId}"]`);
          if (rangeValue) rangeValue.textContent = field?.type === 'rating' ? `${control.value}+ stars` : `${control.value}${field?.unit ? ` ${field.unit}` : ''}`;
          renderSelectedSummary();
          renderProducts(resultsQuery.textContent);
        });
      });
    }

    async function buildFilters(query) {
      currentSchema = await loadPreferenceSchema(query);
      selectedPreferences = detectSearchPreferences(query, currentSchema);
      showMorePreferences = false;
      preferenceSearchTerm = '';
      preferenceSearch.value = '';
      renderPreferenceGroups();
    }

    function normalizeCatalogProduct(product) {
      const size = product.sizeOptions?.[0] || product.sizeInventory?.[0]?.size || 'All sizes';
      return {
        ...product,
        category: product.category || 'general',
        brand: product.companyName || 'Store product',
        name: product.productName || 'Unnamed product',
        color: product.category || 'Product',
        size,
        stock: product.stockStatus || 'Check availability',
        price: product.price || 'Price pending',
        thumb: productPalettes[Number(product.id || 0) % productPalettes.length]
      };
    }

    function loadCatalogProducts() {
      if (catalogLoadPromise) return catalogLoadPromise;

      catalogLoadPromise = fetch(`${apiBaseUrl}/api/products`)
        .then((response) => response.ok ? response.json() : [])
        .then((products) => {
          catalogProducts = Array.isArray(products) ? products.map(normalizeCatalogProduct) : [];
        })
        .catch(() => {
          catalogProducts = [];
        });

      return catalogLoadPromise;
    }

    function renderProducts(query) {
      const normalizedQuery = normalizeKey(query);
      const products = catalogProducts
        .filter((product) => {
          const searchableText = `${product.name} ${product.brand} ${product.category} ${product.description || ''} ${product.size}`.toLowerCase();
          return searchableText.includes(normalizedQuery);
        })
        .sort((first, second) => calculateMatchScore(second) - calculateMatchScore(first));

      if (!products.length) {
        productGrid.innerHTML = '<p class="results-empty">No imported products matched this search.</p>';
        return;
      }

      productGrid.innerHTML = products.map((product) => `
        <article class="product-card">
          <div class="product-thumb" style="--thumb-gradient: ${product.thumb};">
            <span class="stock-badge">${escapeHTML(product.stock)}</span>
          </div>
          <div class="product-meta">
            <div class="meta-top">
              <span>${escapeHTML(product.brand)}</span>
              <span>${escapeHTML(product.color)}</span>
            </div>
            <h3 class="product-name">${escapeHTML(product.name)}</h3>
            <div class="product-meta-row">
              <span>${escapeHTML(product.size)}</span>
              <span>Verified</span>
            </div>
            <div class="product-price">
              <strong>${escapeHTML(product.price)}</strong>
              <button type="button">View</button>
            </div>
          </div>
        </article>
      `).join('');
    }

    function calculateMatchScore(product) {
      const requirements = Object.entries(selectedPreferences);
      if (!requirements.length) return 100;
      const productText = `${product.category} ${product.brand} ${product.name} ${product.color} ${product.size} ${product.price}`.toLowerCase();
      let totalWeight = 0;
      let matchedWeight = 0;

      requirements.forEach(([id, value]) => {
        const field = currentSchema.find((item) => item.id === id);
        const weight = field?.recommended ? 3 : 1;
        totalWeight += weight;
        if (Array.isArray(value) ? value.some((item) => productText.includes(String(item).toLowerCase())) : value === true || productText.includes(String(value).toLowerCase())) matchedWeight += weight;
      });

      return Math.round((matchedWeight / totalWeight) * 100);
    }

    function updatePopularSearches(query) {
      const items = Object.entries(searchHistory)
        .sort((first, second) => second[1] - first[1])
        .map(([item]) => item)
        .slice(0, 5);

      if (!items.length) {
        popularSearches.classList.add('hidden');
        popularList.innerHTML = '';
        return;
      }

      popularList.innerHTML = items.map((item, index) => `
        <li><span></span><span>${item}</span></li>
      `).join('');

      popularSearches.classList.remove('hidden');
    }

    let searchRequest = 0;

    function triggerSearchAnimation(query) {
      const value = query.trim();
      const requestId = ++searchRequest;

      if (!value) {
        blankStage.classList.remove('searching');
        searchResults.classList.add('hidden');
        return;
      }

      blankStage.classList.add('searching');
      searchResults.classList.add('hidden');

      window.setTimeout(() => {
        if (requestId !== searchRequest) return;
        resultsQuery.textContent = value;
        Promise.all([buildFilters(value), loadCatalogProducts()]).then(() => {
          if (requestId !== searchRequest) return;
          renderProducts(value);
          searchResults.classList.remove('hidden');
        });
      }, 850);
    }

    searchInput.addEventListener('input', (event) => {
      updatePopularSearches(event.target.value);
    });

    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const value = event.target.value.trim();
        if (!value) return;
        const normalized = value.toLowerCase();
        searchHistory[normalized] = (searchHistory[normalized] || 0) + 1;
        window.localStorage.setItem(searchHistoryKey, JSON.stringify(searchHistory));
        updatePopularSearches(value);
        triggerSearchAnimation(value);
      }
    });

    preferenceSearch.addEventListener('input', (event) => {
      preferenceSearchTerm = event.target.value;
      renderPreferenceGroups();
    });

    morePreferences.addEventListener('click', () => {
      showMorePreferences = !showMorePreferences;
      renderPreferenceGroups();
    });

    clearPreferences.addEventListener('click', () => {
      selectedPreferences = {};
      renderPreferenceGroups();
      renderProducts(resultsQuery.textContent);
    });

    // OWNER CATALOG IMPORT
    // The button stays invisible until Google Sign-In confirms the owner's account, verified server-side.
    const ownerToolsButton = document.getElementById('ownerToolsButton');
    const ownerToolsPanel = document.getElementById('ownerToolsPanel');
    const ownerCatalogSyncForm = document.getElementById('ownerCatalogSyncForm');
    const ownerCatalogMessage = document.getElementById('ownerCatalogMessage');

    if (ownerToolsButton && ownerToolsPanel && ownerCatalogSyncForm && ownerCatalogMessage) {
      let verifiedOwnerEmail = '';

      async function verifyGoogleCredential(credentialResponse) {
        try {
          const response = await fetch(`${apiBaseUrl}/api/admin/google-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: credentialResponse.credential })
          });
          const result = await response.json();
          if (response.ok && result.success) {
            const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
            verifiedOwnerEmail = String(payload.email || '').toLowerCase();
            ownerToolsButton.classList.add('owner-tools-visible');
            document.getElementById('ownerCatalogEmail').value = verifiedOwnerEmail;
          } else {
            ownerToolsButton.classList.remove('owner-tools-visible');
          }
        } catch (error) {
          ownerToolsButton.classList.remove('owner-tools-visible');
        }
      }

      if (window.google?.accounts?.id && window.TEYO_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: window.TEYO_GOOGLE_CLIENT_ID,
          auto_select: true,
          callback: verifyGoogleCredential
        });
        window.google.accounts.id.prompt();
      }

      ownerToolsButton.addEventListener('click', () => {
        if (!verifiedOwnerEmail) return;
        ownerToolsPanel.hidden = !ownerToolsPanel.hidden;
        ownerToolsButton.setAttribute('aria-expanded', String(!ownerToolsPanel.hidden));
      });

      ownerCatalogSyncForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const ownerEmail = document.getElementById('ownerCatalogEmail').value.trim();
        const ownerKey = document.getElementById('ownerCatalogKey').value;
        ownerCatalogMessage.textContent = 'Importing products...';

        try {
          const response = await fetch(`${apiBaseUrl}/api/admin/store-sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-owner-email': ownerEmail,
              'x-owner-key': ownerKey
            },
            body: JSON.stringify({
              companyName: document.getElementById('ownerCatalogCompanyName').value.trim(),
              ownerEmail,
              sourceUrl: document.getElementById('ownerCatalogSourceUrl').value.trim()
            })
          });
          const result = await response.json();
          ownerCatalogMessage.textContent = response.ok
            ? `${result.message} Imported ${result.importedCount} products.`
            : (result.message || 'Import failed.');

          if (response.ok) {
            catalogLoadPromise = null;
            await loadCatalogProducts();
            if (resultsQuery.textContent) renderProducts(resultsQuery.textContent);
          }
        } catch (error) {
          ownerCatalogMessage.textContent = 'Import failed. Check the server and store link.';
        }
      });
    }

    window.TeyoPreferenceEngine = {
      getPreferencesForSearch: (query) => getPreferenceSchema(query),
      analyzeSearch,
      discoverAttributes,
      generatePreferenceSchema: (searchContext) => discoverAttributes(searchContext),
      registerAttributeSchema,
      setAttributeDiscoveryProvider: (provider) => {
        attributeDiscoveryProvider = typeof provider === 'function' ? provider : null;
      },
      getSearchContext: () => currentSearchContext ? { ...currentSearchContext, discoveredAttributes: [...currentSchema] } : null,
      getSelectedPreferences: () => ({ ...selectedPreferences }),
      getMatchScore: (product) => calculateMatchScore(product)
    };

    updatePopularSearches('');
  });
})();
