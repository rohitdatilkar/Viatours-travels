/* ==========================================================================
   VIA TOURS & TRAVELS — CORE JAVASCRIPT ENGINE
   Features: Multi-Currency Engine, Luxury Fallback Catalog, Router Bug Fixes,
   Interactive Trip Wizard, Smart AI Concierge, Admin Management Portal
   ========================================================================== */

// --- INITIAL PRELOADER (LUXURY BRAND EXPERIENCE) ---
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader && !preloader.classList.contains('hidden')) {
        preloader.classList.add('hidden');
        setTimeout(() => {
            if (preloader && preloader.parentNode) {
                preloader.style.display = 'none';
            }
        }, 400);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(hidePreloader, 60);
    });
} else {
    setTimeout(hidePreloader, 60);
}
// Absolute safety failsafe timeout
setTimeout(hidePreloader, 800);

// --- LUXURY BRAND EMBLEM FALLBACK (When Remote Logo Fails to Load) ---
function handleLogoError(img) {
    if (!img) return;
    img.onerror = null;

    const remoteUrl = 'https://goqwtovltftehautxekh.supabase.co/storage/v1/object/public/package-images/Via%20tours%20&%20travels.png';
    const localPng = 'assets/agency-logo.png';

    // 1. Try remote CDN if not already on it
    if (!img.dataset.triedRemote && img.src !== remoteUrl) {
        img.dataset.triedRemote = 'true';
        img.removeAttribute('srcset');
        img.onerror = function() { handleLogoError(this); };
        img.src = remoteUrl;
        return;
    }

    // 2. Try local PNG asset if remote failed
    if (!img.dataset.triedLocal && !img.src.includes('agency-logo.png')) {
        img.dataset.triedLocal = 'true';
        img.removeAttribute('srcset');
        img.onerror = function() { handleLogoError(this); };
        img.src = localPng;
        return;
    }

    // 3. Fallback: Render vector SVG emblem so broken image icon is never shown
    const fallback = document.createElement('div');
    fallback.className = 'brand-emblem-fallback';
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', 'Via Tours & Travels Emblem');
    fallback.innerHTML = `
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
                <linearGradient id="viaBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fef08a"/>
                    <stop offset="50%" stop-color="#d97706"/>
                    <stop offset="100%" stop-color="#92400e"/>
                </linearGradient>
                <radialGradient id="viaBgGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="rgba(217,119,6,0.2)"/>
                    <stop offset="100%" stop-color="rgba(217,119,6,0.05)"/>
                </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="30" stroke="url(#viaBrandGrad)" stroke-width="2.5" fill="url(#viaBgGrad)"/>
            <polygon points="32,7 34,13 32,11 30,13" fill="url(#viaBrandGrad)"/>
            <polygon points="32,57 34,51 32,53 30,51" fill="url(#viaBrandGrad)"/>
            <polygon points="7,32 13,34 11,32 13,30" fill="url(#viaBrandGrad)"/>
            <polygon points="57,32 51,34 53,32 51,30" fill="url(#viaBrandGrad)"/>
            <path d="M20 21 L32 45 L44 21" stroke="url(#viaBrandGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M26 29 L38 29" stroke="url(#viaBrandGrad)" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
        </svg>
    `;

    const target = (img.parentNode && img.parentNode.tagName === 'PICTURE') ? img.parentNode : img;
    if (target && target.parentNode) {
        target.parentNode.replaceChild(fallback, target);
    }
}
window.handleLogoError = handleLogoError;

// --- SUPABASE CLIENT SETUP (GUARDED BY SECRETS-OFF-FRONTEND) ---
const SUPABASE_URL = window.__VIA_CONFIG__?.SUPABASE_URL || window.SUPABASE_URL || 'https://goqwtovltftehautxekh.supabase.co';
const SUPABASE_KEY = window.__VIA_CONFIG__?.SUPABASE_KEY || window.SUPABASE_KEY || 'sb_publishable_bQXp8x_2x4ymx4_oxcOFUA_UTGsqF-5';
const sb = (window.ViaSecurity && typeof window.ViaSecurity.getSupabaseClient === 'function')
    ? window.ViaSecurity.getSupabaseClient()
    : (window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null);

// --- STATE MANAGEMENT ---
let appSettings = {
    business_name: 'Via Tours & Travels',
    email: 'hello@viatours.com',
    phone: '+91 98765 43210',
    whatsapp: '919876543210',
    address: 'MG Road, Bengaluru, Karnataka 560001, India'
};

let currentCurrency = localStorage.getItem('via_currency') || 'INR';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
let activeDestFilter = null;
let activeCategoryFilter = null;
let currentPackage = null;
let currentItinerary = [];
let currentGallery = [];
let heroSearchQuery = null;

// Currency Conversion Rates (Base: INR)
const CURRENCY_RATES = {
    INR: { rate: 1, symbol: '₹', code: 'INR' },
    USD: { rate: 0.012, symbol: '$', code: 'USD' },
    EUR: { rate: 0.011, symbol: '€', code: 'EUR' },
    AED: { rate: 0.044, symbol: 'AED ', code: 'AED' }
};

// Initialize Theme
document.body.classList.toggle('dark-mode', isDarkMode);
updateThemeIcon();

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    updateThemeIcon();
}

// --- CURRENCY CONVERTER ---
function changeCurrency(curr) {
    if (!CURRENCY_RATES[curr]) curr = 'INR';
    currentCurrency = curr;
    localStorage.setItem('via_currency', curr);
    const selector = document.getElementById('currencySelector');
    if (selector) selector.value = curr;
    
    // Re-render active views that contain prices
    const hash = window.location.hash || '#/home';
    if (hash.includes('package/')) {
        const parts = hash.split('/');
        if (parts[2]) loadPackageDetails(parts[2]);
    } else if (hash.includes('packages')) {
        loadPackages();
    } else if (hash.includes('home') || !hash || hash === '#/') {
        loadHomePackages();
    }
}

function formatPrice(amountINR) {
    const num = Number(amountINR) || 0;
    const curr = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.INR;
    const converted = Math.round(num * curr.rate);
    if (currentCurrency === 'INR') {
        return curr.symbol + converted.toLocaleString('en-IN');
    }
    return curr.symbol + converted.toLocaleString('en-US');
}

// --- SANITIZATION & HELPERS ---
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function debounce(fn, delay = 350) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// --- ACCESSIBILITY LIVE ANNOUNCER HELPER ---
function announceA11y(msg) {
    const el = document.getElementById('a11y-live-announcer');
    if (el) {
        el.textContent = '';
        setTimeout(() => { el.textContent = msg; }, 40);
    }
}

// --- RESPONSIVE WEBP IMAGE HELPER ---
/**
 * Generates an optimized responsive image HTML string using modern <picture>
 * with WebP at 80% quality, responsive srcset candidates, and responsive sizes.
 */
function buildResponsiveImgHtml({
    src = '',
    alt = '',
    className = '',
    id = '',
    sizes = '100vw',
    widths = [400, 800, 1200],
    defaultWidth = 800,
    loading = 'lazy',
    fetchpriority = null,
    decoding = 'async',
    extraImgAttrs = ''
} = {}) {
    if (!src) src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80';

    const safeAlt = escapeHTML(alt);
    const safeClass = className ? ` class="${escapeHTML(className)}"` : '';
    const safeId = id ? ` id="${escapeHTML(id)}"` : '';
    const safeLoading = loading ? ` loading="${escapeHTML(loading)}"` : '';
    const safePriority = fetchpriority ? ` fetchpriority="${escapeHTML(fetchpriority)}"` : '';
    const safeDecoding = decoding ? ` decoding="${escapeHTML(decoding)}"` : '';
    const safeSizes = escapeHTML(sizes);
    const extra = extraImgAttrs ? ` ${extraImgAttrs}` : '';

    // Handle Unsplash images with dynamic format and quality params
    if (src.includes('images.unsplash.com')) {
        const baseUrl = src.split('?')[0];
        const webpSrcset = widths.map(w => `${baseUrl}?w=${w}&amp;q=80&amp;fm=webp ${w}w`).join(', ');
        const jpegSrcset = widths.map(w => `${baseUrl}?w=${w}&amp;q=80 ${w}w`).join(', ');
        const defaultSrc = `${baseUrl}?w=${defaultWidth || widths[1] || 800}&amp;q=80`;

        return `<picture>
            <source type="image/webp" srcset="${webpSrcset}" sizes="${safeSizes}">
            <source type="image/jpeg" srcset="${jpegSrcset}" sizes="${safeSizes}">
            <img src="${defaultSrc}" srcset="${jpegSrcset}" sizes="${safeSizes}" alt="${safeAlt}"${safeClass}${safeId}${safeLoading}${safePriority}${safeDecoding}${extra}>
        </picture>`.trim();
    }

    // Handle agency logo
    if (src.includes('agency-logo') || src.includes('Via%20tours')) {
        const logoUrl = 'https://goqwtovltftehautxekh.supabase.co/storage/v1/object/public/package-images/Via%20tours%20&%20travels.png';
        return `<img src="${logoUrl}" alt="${safeAlt}"${safeClass}${safeId}${safeLoading}${safePriority}${safeDecoding} onerror="handleLogoError(this)"${extra}>`;
    }

    // Handle local social-preview or og-background
    if (src.includes('social-preview')) {
        return `<picture>
            <source type="image/webp" srcset="assets/social-preview-600.webp 600w, assets/social-preview-1200.webp 1200w" sizes="${safeSizes}">
            <img src="assets/social-preview-1200.webp" alt="${safeAlt}"${safeClass}${safeId}${safeLoading}${safePriority}${safeDecoding} sizes="${safeSizes}"${extra}>
        </picture>`.trim();
    }

    if (src.includes('og-background')) {
        return `<picture>
            <source type="image/webp" srcset="assets/og-background-600.webp 600w, assets/og-background-1200.webp 1200w" sizes="${safeSizes}">
            <img src="assets/og-background-1200.webp" alt="${safeAlt}"${safeClass}${safeId}${safeLoading}${safePriority}${safeDecoding} sizes="${safeSizes}"${extra}>
        </picture>`.trim();
    }

    // Fallback for custom uploads / external URLs
    return `<img src="${escapeHTML(src)}" alt="${safeAlt}"${safeClass}${safeId}${safeLoading}${safePriority}${safeDecoding}${extra}>`;
}

function showToast(msg, type = 'success') {
    announceA11y(msg);
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = '<i class="fas fa-check-circle"></i> ';
    if (type === 'error') {
        icon = '<i class="fas fa-exclamation-circle"></i> ';
    } else if (type === 'info') {
        icon = '<i class="fas fa-compass"></i> ';
    }
    toast.innerHTML = icon + escapeHTML(msg);
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

async function withLoading(button, fn) {
    if (!button) return fn();
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    try {
        await fn();
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmMessage').textContent = message;
    modal.style.display = 'flex';
    document.getElementById('confirmYes').onclick = () => {
        modal.style.display = 'none';
        onConfirm();
    };
    document.getElementById('confirmNo').onclick = () => {
        modal.style.display = 'none';
    };
}

// --- VERIFIED LUXURY FALLBACK CATALOG (Unified via catalog-data.js) ---
const LUXURY_FALLBACK_DATA = window.LUXURY_CATALOG || {
    destinations: [],
    packages: [],
    blogs: [],
    testimonials: [],
    faqs: []
};

// --- HIGH-PERFORMANCE IN-MEMORY QUERY CACHE (60s TTL) ---
const _dataCache = {
    destinations: { data: null, time: 0 },
    packages: { data: null, time: 0 },
    blogs: { data: null, time: 0 },
    testimonials: { data: null, time: 0 },
    faqs: { data: null, time: 0 }
};
const CACHE_TTL_MS = 60000;

// --- DATA FETCHING WITH SEAMLESS FALLBACK & UNIFIED STORE ---
async function fetchDestinations() {
    const now = Date.now();
    if (_dataCache.destinations.data && (now - _dataCache.destinations.time < CACHE_TTL_MS)) {
        return _dataCache.destinations.data;
    }
    let sbData = [];
    try {
        if (sb) {
            const { data, error } = await sb.from('destinations').select('*').eq('is_published', true);
            if (!error && Array.isArray(data)) sbData = data;
        }
    } catch (e) {
        console.warn('Supabase destinations fallback:', e);
    }
    const result = window.CatalogStore ? window.CatalogStore.get('destinations', sbData) : (sbData.length > 0 ? sbData : LUXURY_FALLBACK_DATA.destinations);
    _dataCache.destinations = { data: result, time: now };
    return result;
}

async function fetchPackages() {
    const now = Date.now();
    if (_dataCache.packages.data && (now - _dataCache.packages.time < CACHE_TTL_MS)) {
        return _dataCache.packages.data;
    }
    let sbData = [];
    try {
        if (sb) {
            const { data, error } = await sb.from('packages').select('*, destinations(name, country)').eq('is_published', true);
            if (!error && Array.isArray(data)) sbData = data;
        }
    } catch (e) {
        console.warn('Supabase packages fallback:', e);
    }
    const result = window.CatalogStore ? window.CatalogStore.get('packages', sbData) : (sbData.length > 0 ? sbData : LUXURY_FALLBACK_DATA.packages);
    _dataCache.packages = { data: result, time: now };
    return result;
}

async function fetchBlogs() {
    const now = Date.now();
    if (_dataCache.blogs.data && (now - _dataCache.blogs.time < CACHE_TTL_MS)) {
        return _dataCache.blogs.data;
    }
    let sbData = [];
    try {
        if (sb) {
            const { data, error } = await sb.from('blog_posts').select('*').eq('is_published', true).order('created_at', { ascending: false });
            if (!error && Array.isArray(data)) sbData = data;
        }
    } catch (e) {
        console.warn('Supabase blogs fallback:', e);
    }
    const result = window.CatalogStore ? window.CatalogStore.get('blogs', sbData) : (sbData.length > 0 ? sbData : LUXURY_FALLBACK_DATA.blogs);
    _dataCache.blogs = { data: result, time: now };
    return result;
}

async function fetchTestimonials() {
    const now = Date.now();
    if (_dataCache.testimonials.data && (now - _dataCache.testimonials.time < CACHE_TTL_MS)) {
        return _dataCache.testimonials.data;
    }
    let sbData = [];
    try {
        if (sb) {
            const { data, error } = await sb.from('testimonials').select('*');
            if (!error && Array.isArray(data)) sbData = data;
        }
    } catch (e) {
        console.warn('Supabase testimonials fallback:', e);
    }
    const result = window.CatalogStore ? window.CatalogStore.get('testimonials', sbData) : (sbData.length > 0 ? sbData : LUXURY_FALLBACK_DATA.testimonials);
    _dataCache.testimonials = { data: result, time: now };
    return result;
}

async function fetchFaqs() {
    const now = Date.now();
    if (_dataCache.faqs.data && (now - _dataCache.faqs.time < CACHE_TTL_MS)) {
        return _dataCache.faqs.data;
    }
    let sbData = [];
    try {
        if (sb) {
            const { data, error } = await sb.from('faqs').select('*').eq('is_published', true);
            if (!error && Array.isArray(data)) sbData = data;
        }
    } catch (e) {
        console.warn('Supabase faqs fallback:', e);
    }
    const result = window.CatalogStore ? window.CatalogStore.get('faqs', sbData) : (sbData.length > 0 ? sbData : LUXURY_FALLBACK_DATA.faqs);
    _dataCache.faqs = { data: result, time: now };
    return result;
}

// --- SEO & SOCIAL META TAG HELPER ---
function updateSEO(title, desc, image = null, path = null) {
    const fullTitle = title.includes('Via Tours') ? title : `${title} — Via Tours & Travels`;
    document.title = fullTitle;

    const fullDesc = desc || 'Via Tours & Travels - World-class luxury travel agency offering bespoke holiday itineraries, private tours, and 24/7 dedicated concierge.';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = fullDesc;

    // Helper to safely set or create meta elements
    const setMetaTag = (selector, attrName, attrVal, content) => {
        let el = document.querySelector(selector);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attrName, attrVal);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    };

    const currentUrl = path ? `${window.location.origin}${window.location.pathname}${path}` : window.location.href;
    const defaultImg = `${window.location.origin}/assets/social-preview.jpg`;
    const activeImg = image || defaultImg;

    // Open Graph Social Sharing
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', fullDesc);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', activeImg);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);

    // Twitter Card Social Sharing
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', fullDesc);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', activeImg);

    // Canonical link tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;
}

// --- ROUTER (WITH CRITICAL BUG FIXES & FALLBACK) ---
function navTo(page, id = null) {
    // Close mobile menu if open
    toggleMenu(false);

    // Build standard hash route
    if (page === 'blog-post' && id) {
        window.location.hash = '#/blog-post/' + encodeURIComponent(id);
    } else if (page === 'package' && id) {
        window.location.hash = '#/package/' + encodeURIComponent(id);
    } else if (page === 'packages' && id) {
        window.location.hash = '#/packages/' + encodeURIComponent(id);
    } else if (page === 'plan-trip' && id) {
        window.location.hash = '#/plan-trip/' + encodeURIComponent(id);
    } else {
        window.location.hash = '#/' + page;
    }
}

async function router() {
    let hash = window.location.hash;

    // Check for clean query parameters (e.g. ?page=packages or ?page=package&id=123) for search crawler indexing
    if (!hash || hash === '#' || hash === '#/') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryPage = urlParams.get('page');
        const queryId = urlParams.get('id');
        if (queryPage) {
            hash = queryId ? `#/${queryPage}/${encodeURIComponent(queryId)}` : `#/${queryPage}`;
        }
    }
    hash = hash || '#/home';

    // Guard against in-page anchor jumps (e.g. #section-main, #section-tips)
    if (hash && !hash.startsWith('#/')) {
        const anchorId = hash.replace(/^#/, '');
        const anchorEl = document.getElementById(anchorId);
        if (anchorEl) {
            anchorEl.scrollIntoView({ behavior: 'smooth' });
            return;
        }
    }

    const parts = hash.replace(/^#\/?/, '').split('/');
    const page = parts[0] || 'home';
    const id = parts[1] ? decodeURIComponent(parts[1]) : null;

    const siteWrapper = document.getElementById('site-wrapper');
    const adminWrapper = document.getElementById('admin-wrapper');

    // Update active nav styling (Desktop menu)
    document.querySelectorAll('.nav-menu a, .nav-links-wrap a').forEach(a => a.classList.remove('active'));
    const activeNav = document.getElementById('nav-' + (page === 'blog-post' ? 'blog' : page));
    if (activeNav) activeNav.classList.add('active');

    // Update active mobile bottom bar styling
    document.querySelectorAll('.mob-nav-item').forEach(m => m.classList.remove('active'));
    const mobActiveNav = document.getElementById('mob-nav-' + (page === 'blog-post' ? 'packages' : (page === 'package' ? 'packages' : page)));
    if (mobActiveNav) mobActiveNav.classList.add('active');

    // Hide sticky booking bar if leaving package details
    const mobStickyBooking = document.getElementById('mobileStickyBooking');
    if (page !== 'package') {
        if (mobStickyBooking) mobStickyBooking.style.display = 'none';
        document.body.classList.remove('has-sticky-booking');
    }

    // Admin route redirection to dedicated standalone portal
    if (page === 'admin') {
        window.location.href = 'admin.html';
        return;
    }

    // Hide all views then show the target view
    document.querySelectorAll('.page-view').forEach(p => p.style.display = 'none');
    const view = document.getElementById('page-' + page) || document.getElementById('page-home');
    if (view) view.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'instant' });

    // FIXED SWITCH STATEMENT: Explicit break on every case including default
    switch (page) {
        case 'home':
            loadHomeData();
            updateSEO(
                'Via Tours & Travels — Bespoke Luxury Holidays & Curated Journeys',
                'Award-winning luxury travel agency crafting bespoke holiday itineraries, private villas, chauffeured transfers, and 24/7 dedicated concierge service worldwide.',
                'https://viatoursandtravels.com/assets/social-preview.jpg',
                '#/home'
            );
            break;

        case 'destinations':
            loadDestinations();
            updateSEO(
                'Handpicked Luxury Destinations Worldwide | Via Tours & Travels',
                'Discover extraordinary luxury destinations from Maldives private overwater villas and Swiss alpine retreats to Bali sanctuaries, Dubai desert oases, and Amalfi shores.',
                'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80',
                '#/destinations'
            );
            break;

        case 'packages':
            activeDestFilter = id || null;
            await initPackageFilters();
            await loadPackages();
            updateSEO(
                'Curated Luxury Tour Packages & Itineraries | Via Tours & Travels',
                'Explore signature luxury tour packages featuring handpicked 5-star accommodations, private chauffeur fleets, certified guides, and transparent locked-in pricing.',
                'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
                '#/packages'
            );
            break;

        case 'package':
            if (id) loadPackageDetails(id);
            break;

        case 'blog':
            loadBlog();
            updateSEO(
                'The Luxury Travel Journal & Destination Guides | Via Tours & Travels',
                'Curated travel wisdom, seasonal destination advice, packing strategies, and insider luxury hotel reviews from our senior travel specialists.',
                'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
                '#/blog'
            );
            break;

        case 'blog-post':
            if (id) loadBlogPost(id);
            break;

        case 'plan-trip':
            await setupPlanForm(id);
            updateSEO(
                'Plan Your Bespoke Luxury Journey | Custom Itinerary Concierge',
                'Request a personalized luxury travel quotation. Share your dream destinations and preferences to receive a tailored day-by-day itinerary within 24 hours.',
                'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80',
                '#/plan-trip'
            );
            break;

        case 'about':
            updateSEO(
                'Our 15-Year Heritage & Craftsmanship | Via Tours & Travels',
                'Architecting extraordinary travel memories since 2009. Learn about our founding heritage, ASTA/IATA standards, and dedication to bespoke luxury tourism.',
                'https://viatoursandtravels.com/assets/social-preview.jpg',
                '#/about'
            );
            break;

        case 'contact':
            updateSEO(
                'Contact Luxury Travel Concierge 24/7 | Via Tours & Travels',
                'Connect directly with our senior luxury travel architects. Available 24/7 via WhatsApp, phone, or private appointment for custom bookings and VIP visas.',
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
                '#/contact'
            );
            break;

        case 'terms':
            updateSEO(
                'Terms & Conditions of Service & Booking Charter | Via Tours & Travels',
                'Official booking conditions, transparent deposit milestones, cancellation schedules, and client financial protections for Via Tours & Travels.',
                'https://viatoursandtravels.com/assets/social-preview.jpg',
                '#/terms'
            );
            break;

        case 'privacy':
            updateSEO(
                'Privacy Policy & Data Protection Charter | Via Tours & Travels',
                'Official privacy charter detailing 256-bit SSL encryption, our zero-spam guarantee, DPDP Act 2023 & GDPR compliance, and client data rights.',
                'https://viatoursandtravels.com/assets/social-preview.jpg',
                '#/privacy'
            );
            break;

        default:
            loadHomeData();
            updateSEO(
                'Via Tours & Travels — Bespoke Luxury Holidays & Curated Journeys',
                'Award-winning luxury travel agency crafting bespoke holiday itineraries, private villas, chauffeured transfers, and 24/7 dedicated concierge service worldwide.',
                'https://viatoursandtravels.com/assets/social-preview.jpg',
                '#/home'
            );
            break;
    }
}

// --- DATE PICKER CONSTRAINTS (PREVENT PAST BOOKINGS) ---
function initDatePickers() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputIds = ['hero_date', 'pt_dates', 'modal_pt_dates', 'm_book_date'];
    dateInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.min = today;
        }
    });
}

// --- APPLICATION BOOT ENGINE ---
function initApp() {
    // Sync currency selector
    const currSelect = document.getElementById('currencySelector');
    if (currSelect) currSelect.value = currentCurrency;
    initDatePickers();
    router();
    maybeShowTripModal();
    initCookieConsent();
}

window.addEventListener('hashchange', router);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// --- MOBILE MENU TOGGLE ---
function toggleMenu(forceState) {
    const menu = document.getElementById('navMenu');
    const overlay = document.getElementById('navOverlay');
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const icon = document.getElementById('menuToggleIcon');
    const header = document.getElementById('mainHeader');
    if (!menu) return;

    const isOpen = forceState !== undefined ? forceState : !menu.classList.contains('active');
    menu.classList.toggle('active', isOpen);
    if (overlay) overlay.classList.toggle('active', isOpen);
    if (header) header.classList.toggle('menu-open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', isOpen);
    if (icon) icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
        const menu = document.getElementById('navMenu');
        if (menu && menu.classList.contains('active')) {
            toggleMenu(false);
        }
        document.body.classList.remove('has-sticky-booking');
    } else if (window.location.hash.startsWith('#/package/')) {
        const mobSticky = document.getElementById('mobileStickyBooking');
        if (mobSticky && mobSticky.style.display !== 'none') {
            document.body.classList.add('has-sticky-booking');
        }
    }
}, { passive: true });

// --- POPUP TRIP MODAL ---
function showTripModal() {
    initDatePickers();
    const modal = document.getElementById('tripModal');
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const formWrap = modal.querySelector('.trip-modal-form-wrap');
    if (formWrap) formWrap.scrollTop = 0;
    if (window.innerWidth > 768) {
        const firstInput = modal.querySelector('input:not([type="hidden"])');
        if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }
}

function hideTripModal() {
    const modal = document.getElementById('tripModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    sessionStorage.setItem('viaTripModalDismissed', 'true');
}

// --- SAMPLE ITINERARY DOWNLOAD MODAL LOGIC ---
function openSampleItineraryModal(pkgTitle) {
    const modal = document.getElementById('sampleItineraryModal');
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const formWrap = modal.querySelector('.trip-modal-form-wrap');
    if (formWrap) formWrap.scrollTop = 0;
    if (pkgTitle) {
        const select = document.getElementById('sample_dest');
        if (select) {
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value.toLowerCase().includes(pkgTitle.toLowerCase()) || pkgTitle.toLowerCase().includes(select.options[i].value.toLowerCase())) {
                    select.selectedIndex = i;
                    break;
                }
            }
        }
    }
    if (window.innerWidth > 768) {
        const firstInput = document.getElementById('sample_name');
        if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }
}

function closeSampleItineraryModal() {
    const modal = document.getElementById('sampleItineraryModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function handleModalBackdropClick(e, modalId) {
    if (e.target.id === modalId) {
        if (modalId === 'tripModal') hideTripModal();
        if (modalId === 'sampleItineraryModal') closeSampleItineraryModal();
    }
}

// --- DYNAMIC ON-DEMAND jsPDF LOADER (~350KB) ---
function ensureJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) {
        return Promise.resolve(window.jspdf);
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.async = true;
        script.onload = () => {
            if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf);
            else reject(new Error('jsPDF loaded but window.jspdf missing'));
        };
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
}

async function handleSampleItineraryDownload(e) {
    e.preventDefault();
    const btn = document.getElementById('btn_sample_download');
    const name = document.getElementById('sample_name')?.value.trim();
    const email = document.getElementById('sample_email')?.value.trim();
    const dest = document.getElementById('sample_dest')?.value || 'Signature Luxury Journeys';

    if (!name || !email) {
        showToast('Please enter your full name and email address.', 'error');
        return;
    }

    await withLoading(btn, async () => {
        // Save lead to Supabase if connected
        if (sb) {
            try {
                await sb.from('enquiries').insert([{
                    name: name,
                    email: email,
                    phone: 'Lead Capture (PDF Download)',
                    destination: dest,
                    requirements: 'Downloaded Sample Itinerary PDF Guide for ' + dest,
                    status: 'New'
                }]);
            } catch(err) {
                console.warn('Enquiry capture info:', err);
            }
        }

        // Dynamically load jsPDF on-demand if not already loaded
        try {
            await ensureJsPdf();
        } catch (e) {
            console.warn('Dynamic jsPDF load warning:', e);
        }

        // Generate and trigger download of luxury itinerary PDF summary document
        const cleanDest = dest.replace(/[^a-zA-Z0-9]/g, '_');
        const issueDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        const fallbackTextDownload = () => {
            const content = `=================================================================\nVIA TOURS & TRAVELS — CURATED SAMPLE ITINERARY GUIDE\n=================================================================\n\nPrepared Exclusively For: ${name}\nEmail: ${email}\nSelected Itinerary: ${dest}\nDate of Issue: ${issueDate}\nAccreditation: IATA #08392110 | ASTA Verified Luxury Tour Operator\n\n-----------------------------------------------------------------\nSIGNATURE ITINERARY HIGHLIGHTS & INCLUSIONS\n-----------------------------------------------------------------\n✓ Handpicked 5-Star Accommodations & Private Overwater/Pool Villas\n✓ Private Mercedes Chauffeur Transfers & Speedboat/Seaplane Connections\n✓ Gourmet Breakfasts, Multi-Course Fine Dining & Curated Excursions\n✓ 24/7 Dedicated Senior Concierge Specialist on WhatsApp\n✓ 100% Free Date Changes up to 21 Days Prior to Departure\n\n-----------------------------------------------------------------\nHOW TO PERSONALIZE YOUR DATES & EXPERIENCE\n-----------------------------------------------------------------\nTo adjust resort choices, add helicopter excursions, or receive formal flight quotations:\n\nWhatsApp Concierge: +91 98765 43210\nDirect Email: hello@viatours.com\nWebsite: https://www.viatours.com\n\nThank you for choosing Via Tours & Travels — Crafting Extraordinary Journeys.`;
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Via_Tours_Sample_Itinerary_${cleanDest}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        if (window.jspdf && window.jspdf.jsPDF) {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

                // Header Banner (Royal Navy #061029)
                doc.setFillColor(6, 16, 41);
                doc.rect(0, 0, 210, 38, 'F');

                // Gold Accent Line
                doc.setFillColor(232, 119, 34);
                doc.rect(0, 38, 210, 2, 'F');

                // Brand Title & Tagline
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(20);
                doc.text('VIA TOURS & TRAVELS', 14, 16);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(232, 119, 34);
                doc.text('CURATED LUXURY & BESPOKE BESPOKE JOURNEYS', 14, 23);

                doc.setTextColor(148, 163, 184);
                doc.setFontSize(7.5);
                doc.text('IATA Accredited Tour Operator  |  ASTA Verified Luxury Partner', 14, 30);

                // Prepared For Info Card
                doc.setFillColor(245, 247, 251);
                doc.roundedRect(14, 46, 182, 32, 2, 2, 'F');
                doc.setDrawColor(223, 229, 239);
                doc.roundedRect(14, 46, 182, 32, 2, 2, 'S');

                doc.setTextColor(15, 23, 42);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10.5);
                doc.text('COMPLIMENTARY CURATED SAMPLE ITINERARY', 20, 54);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(51, 65, 85);
                doc.text(`Guest Name: ${name}`, 20, 61);
                doc.text(`Email Address: ${email}`, 20, 66);
                doc.text(`Selected Itinerary: ${dest}`, 20, 71);
                doc.text(`Date of Issue: ${issueDate}`, 120, 61);
                doc.text('Status: VIP Requested Preview', 120, 66);

                // Section 1: Signature Inclusions
                doc.setTextColor(6, 16, 41);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('Signature Highlights & Inclusions', 14, 88);

                doc.setDrawColor(232, 119, 34);
                doc.setLineWidth(0.5);
                doc.line(14, 91, 196, 91);

                const inclusions = [
                    'Handpicked 5-Star Accommodations & Private Overwater / Pool Villa Stays',
                    'Private Mercedes Chauffeur Transfers & Speedboat / Seaplane VIP Connections',
                    'Daily Gourmet Breakfasts, Multi-Course Fine Dining & Chef-Curated Experiences',
                    '24/7 Dedicated Senior Concierge Specialist on WhatsApp & Direct Priority Call',
                    '100% Free Date Changes up to 21 Days Prior to Departure & Full Visa Assistance'
                ];

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                let yPos = 99;
                inclusions.forEach(item => {
                    doc.setTextColor(232, 119, 34);
                    doc.text('✓', 16, yPos);
                    doc.setTextColor(51, 65, 85);
                    const splitText = doc.splitTextToSize(item, 170);
                    doc.text(splitText, 22, yPos);
                    yPos += splitText.length * 5.5 + 2;
                });

                // Section 2: Sample Day-by-Day Flow
                yPos += 4;
                doc.setTextColor(6, 16, 41);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('Curated Day-by-Day Journey Framework', 14, yPos);
                doc.setDrawColor(232, 119, 34);
                doc.line(14, yPos + 3, 196, yPos + 3);
                yPos += 10;

                const days = [
                    { day: 'Day 1: VIP Arrival & Private Chauffeur Welcome', desc: 'VIP meet & assist upon landing. Private luxury transfer to your 5-star suite with sunset champagne reception.' },
                    { day: 'Day 2: Immersive Private Cultural & Scenic Excursion', desc: 'Guided cultural exploration with private local specialist. Gourmet dining at signature partner restaurant.' },
                    { day: 'Day 3: Signature Leisure, Wellness & Scenic Views', desc: 'Dedicated spa wellness treatments, private yacht charter or scenic mountain pass, and personal leisure.' },
                    { day: 'Day 4: Bespoke Adventure & Celebration Dinner', desc: 'Curated excursion tailored to your party, followed by a romantic or family candlelit celebration under the stars.' },
                    { day: 'Day 5+: Farewell & Departure Transfer', desc: 'Gourmet breakfast overlooking vistas, private chauffeur connection to airport with VIP lounge access.' }
                ];

                days.forEach(d => {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.5);
                    doc.setTextColor(232, 119, 34);
                    doc.text(d.day, 16, yPos);
                    yPos += 4.5;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.setTextColor(71, 85, 105);
                    const descLines = doc.splitTextToSize(d.desc, 175);
                    doc.text(descLines, 16, yPos);
                    yPos += descLines.length * 4.2 + 2.5;
                });

                // Section 3: Concierge Contact Box
                doc.setFillColor(6, 16, 41);
                doc.roundedRect(14, 238, 182, 34, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('Personalize Your Bespoke Quotation', 20, 246);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(226, 232, 240);
                doc.text('WhatsApp Concierge: +91 98765 43210  |  Email: hello@viatours.com', 20, 253);
                doc.text('Official Website: https://www.viatours.com', 20, 258);

                doc.setTextColor(232, 119, 34);
                doc.setFontSize(8);
                doc.text('Connect directly with our senior destination architects to lock in VIP perks and room upgrades.', 20, 265);

                // Footer Bar
                doc.setFillColor(232, 119, 34);
                doc.rect(0, 286, 210, 1.2, 'F');
                doc.setTextColor(148, 163, 184);
                doc.setFontSize(7.5);
                doc.text('© 2026 Via Tours & Travels. All Rights Reserved. Confidential & Prepared Exclusively for Client.', 14, 292);

                doc.save(`Via_Tours_Sample_Itinerary_${cleanDest}.pdf`);
            } catch (err) {
                console.warn('jsPDF generation error, falling back to text:', err);
                fallbackTextDownload();
            }
        } else {
            fallbackTextDownload();
        }

        if (window.confetti) {
            window.confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }

        closeSampleItineraryModal();
        showToast(`Sample itinerary for ${dest} (PDF) downloaded successfully!`, 'success');
    });
}

function maybeShowTripModal() {
    if (sessionStorage.getItem('viaTripModalDismissed') === 'true') return;

    let hasTriggered = false;
    const trigger = () => {
        if (hasTriggered || sessionStorage.getItem('viaTripModalDismissed') === 'true') return;
        hasTriggered = true;
        showTripModal();
    };

    // 1. Desktop Exit-Intent Trigger: user moves cursor toward top of browser to leave
    const handleExitIntent = (e) => {
        if (e.clientY <= 12 && !hasTriggered) {
            trigger();
            document.removeEventListener('mouseleave', handleExitIntent);
        }
    };
    setTimeout(() => {
        document.addEventListener('mouseleave', handleExitIntent);
    }, 8000);

    // 2. Engaged Scroll-Depth Trigger: when user has scrolled > 55% after 20s
    const handleScroll = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0 && (scrollTop / docHeight) >= 0.55) {
            window.removeEventListener('scroll', handleScroll);
            trigger();
        }
    };
    setTimeout(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
    }, 20000);

    // 3. Fallback gentle timer (45 seconds instead of aggressive 2.8s)
    setTimeout(() => {
        trigger();
    }, 45000);
}

const tripModalBackdrop = document.getElementById('tripModal');
if (tripModalBackdrop) {
    tripModalBackdrop.addEventListener('click', (e) => {
        if (e.target === tripModalBackdrop) hideTripModal();
    });
}

const sampleModalBackdrop = document.getElementById('sampleItineraryModal');
if (sampleModalBackdrop) {
    sampleModalBackdrop.addEventListener('click', (e) => {
        if (e.target === sampleModalBackdrop) closeSampleItineraryModal();
    });
}

document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('imageLightboxModal');
    const isLightboxActive = lightbox && lightbox.classList.contains('active');

    if (e.key === 'Escape') {
        if (isLightboxActive) { closeLightbox(); return; }
        const menu = document.getElementById('navMenu');
        if (menu && menu.classList.contains('active')) toggleMenu(false);
        const tripModal = document.getElementById('tripModal');
        if (tripModal && tripModal.classList.contains('active')) hideTripModal();
        const sampleModal = document.getElementById('sampleItineraryModal');
        if (sampleModal && sampleModal.classList.contains('active')) closeSampleItineraryModal();
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal && confirmModal.style.display === 'flex') confirmModal.style.display = 'none';
        const chatWin = document.getElementById('chatWindow');
        if (chatWin && chatWin.classList.contains('active')) toggleChat();
    } else if (isLightboxActive) {
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        else if (e.key === 'ArrowRight') navigateLightbox(1);
    }
});

// --- HOME PAGE LOADER ---
async function loadHomeData() {
    loadHomeDestinations();
    loadHomePackages();
    loadHomeBlogs();
    loadHomeTestimonials();
    loadHomeFaqs();
}

async function loadHomeDestinations() {
    const container = document.getElementById('home_destinations');
    if (!container) return;
    const dests = await fetchDestinations();
    const displayList = dests.slice(0, 4);

    container.innerHTML = displayList.map(d => `
        <div class="dest-card" onclick="navTo('packages', '${escapeHTML(d.id)}')">
            <div class="dest-img-wrap">
                ${buildResponsiveImgHtml({
                    src: d.image_url,
                    alt: `Luxury travel experiences in ${d.name}`,
                    widths: [400, 800, 1200],
                    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
                    loading: 'lazy'
                })}
                <span class="dest-tag"><i class="fas fa-sun"></i> ${escapeHTML(d.best_time || 'Best Season')}</span>
            </div>
            <div class="dest-body">
                <h3>${escapeHTML(d.name)}</h3>
                <p class="dest-country"><i class="fas fa-map-marker-alt" style="color:var(--gold-500);"></i> ${escapeHTML(d.country || d.region || 'Worldwide')}</p>
                <div class="dest-footer">
                    <span>Explore More Itineraries</span>
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadHomePackages() {
    const container = document.getElementById('home_packages');
    if (!container) return;
    const packages = await fetchPackages();
    const displayList = packages.slice(0, 3);

    container.innerHTML = displayList.map(p => renderPackageCard(p)).join('');
}

async function loadHomeBlogs() {
    const container = document.getElementById('home_blog');
    if (!container) return;
    const blogs = await fetchBlogs();
    const displayList = blogs.slice(0, 3);

    container.innerHTML = displayList.map(b => `
        <article class="blog-card" onclick="navTo('blog-post', '${escapeHTML(b.slug || b.id)}')">
            ${buildResponsiveImgHtml({
                src: b.image_url,
                alt: `${b.title} — Luxury Travel Journal Guide`,
                widths: [400, 800],
                sizes: '(max-width: 768px) 100vw, 33vw',
                loading: 'lazy'
            })}
            <div class="blog-body">
                <div class="blog-meta-tag">
                    <span><i class="fas fa-bookmark"></i> Curated Guide</span>
                    <span>${new Date(b.created_at || Date.now()).toLocaleDateString('en-IN', { month:'short', day:'numeric', year:'numeric' })}</span>
                </div>
                <h3 class="blog-title">${escapeHTML(b.title)}</h3>
                <p class="blog-excerpt">${escapeHTML(b.excerpt || '')}</p>
                <span class="read-story">Read Article <i class="fas fa-arrow-right"></i></span>
            </div>
        </article>
    `).join('');
}

async function loadHomeTestimonials() {
    const container = document.getElementById('home_testimonials');
    if (!container) return;
    const testimonials = await fetchTestimonials();
    const displayList = testimonials.slice(0, 4);

    container.innerHTML = displayList.map(t => `
        <div class="testimonial-card">
            <div class="testimonial-stars">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
            </div>
            <p class="testimonial-text">"${escapeHTML(t.message)}"</p>
            <div class="testimonial-author">
                ${buildResponsiveImgHtml({
                    src: t.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
                    alt: `Verified Guest ${t.name} testimonial portrait`,
                    className: 'testimonial-avatar',
                    widths: [48, 96],
                    sizes: '48px',
                    defaultWidth: 96,
                    loading: 'lazy'
                })}
                <div class="testimonial-author-info">
                    <h4>${escapeHTML(t.name)}</h4>
                    <span style="color:var(--gold-500); font-weight:600; font-size:0.8rem;"><i class="fas fa-map-marker-alt"></i> ${escapeHTML(t.location || 'Verified Traveler')}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadHomeFaqs() {
    const container = document.getElementById('home_faqs');
    if (!container) return;
    const faqs = await fetchFaqs();

    container.innerHTML = faqs.map((f, i) => `
        <div class="faq-item">
            <button type="button" class="faq-question" id="faq-btn-${i}" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="faq-answer-${i}" onclick="toggleFaq(${i})">
                <span>${escapeHTML(f.question)}</span>
                <i class="fas fa-chevron-down faq-icon" id="faq-icon-${i}"></i>
            </button>
            <div class="faq-answer" id="faq-answer-${i}" role="region" aria-labelledby="faq-btn-${i}" style="display:${i === 0 ? 'block' : 'none'};">
                <p>${escapeHTML(f.answer)}</p>
            </div>
        </div>
    `).join('');

    // Rotate first FAQ icon open
    const firstIcon = document.getElementById('faq-icon-0');
    if (firstIcon) firstIcon.style.transform = 'rotate(180deg)';
}

function toggleFaq(index) {
    const ans = document.getElementById('faq-answer-' + index);
    const icon = document.getElementById('faq-icon-' + index);
    const btn = document.getElementById('faq-btn-' + index);
    if (!ans || !icon) return;
    const isOpen = ans.style.display === 'block';
    ans.style.display = isOpen ? 'none' : 'block';
    icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    if (btn) btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
}

// --- HERO SEARCH ENGINE ---
function setSearchTab(category, btn) {
    document.querySelectorAll('.search-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategoryFilter = category === 'all' ? null : category;
}

function searchFromHero() {
    const dest = document.getElementById('hero_dest')?.value.trim();
    const date = document.getElementById('hero_date')?.value;
    const travelers = document.getElementById('hero_travellers')?.value;

    heroSearchQuery = {
        destination: dest || null,
        date: date || null,
        travelers: travelers || null,
        category: activeCategoryFilter || null
    };

    navTo('packages');
}

function quickSearchDest(destName) {
    heroSearchQuery = { destination: destName };
    showToast(`Curating bespoke journeys for ${destName}...`, 'info');
    navTo('packages');
}

function filterByCollection(category) {
    heroSearchQuery = { category: category };
    showToast(`Filtering ${category} luxury collection...`, 'info');
    navTo('packages');
}

// --- DESTINATIONS PAGE VIEW ---
async function loadDestinations() {
    const container = document.getElementById('list_destinations');
    if (!container) return;

    const searchTerm = (document.getElementById('dest-search')?.value || '').toLowerCase();
    const countryFilter = document.getElementById('dest-country-filter')?.value || '';
    const sortVal = document.getElementById('dest-sort')?.value || 'name_asc';

    const allDests = await fetchDestinations();

    // Populate country filter dropdown if not yet populated
    const countrySelect = document.getElementById('dest-country-filter');
    if (countrySelect && countrySelect.options.length <= 1) {
        const uniqueCountries = [...new Set(allDests.map(d => d.country).filter(Boolean))].sort();
        uniqueCountries.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            countrySelect.appendChild(opt);
        });
    }

    let filtered = allDests.filter(d => {
        const matchesSearch = !searchTerm || 
            (d.name && d.name.toLowerCase().includes(searchTerm)) || 
            (d.country && d.country.toLowerCase().includes(searchTerm)) || 
            (d.region && d.region.toLowerCase().includes(searchTerm));
        const matchesCountry = !countryFilter || d.country === countryFilter;
        return matchesSearch && matchesCountry;
    });

    // Sorting
    switch (sortVal) {
        case 'name_desc': filtered.sort((a,b) => b.name.localeCompare(a.name)); break;
        case 'country_asc': filtered.sort((a,b) => (a.country||'').localeCompare(b.country||'') || a.name.localeCompare(b.name)); break;
        default: filtered.sort((a,b) => a.name.localeCompare(b.name)); break;
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:60px 0;"><i class="fas fa-search" style="font-size:3rem; color:var(--gold-500); margin-bottom:15px;"></i><h3>No destinations match your search</h3><p style="color:var(--text-muted);">Try resetting filters to view our full collection.</p></div>';
        return;
    }

    // Group by Country
    const grouped = {};
    filtered.forEach(d => {
        const c = d.country || d.region || 'Featured Worlds';
        if (!grouped[c]) grouped[c] = [];
        grouped[c].push(d);
    });

    let html = '';
    for (const country in grouped) {
        html += `
            <div style="margin-bottom:45px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--border-light); padding-bottom:10px;">
                    <i class="fas fa-map-pin" style="color:var(--gold-500);"></i>
                    <h2 style="font-size:1.5rem; margin:0;">${escapeHTML(country)}</h2>
                    <span class="luxury-badge" style="font-size:0.7rem; padding:2px 8px;">${grouped[country].length} ${grouped[country].length === 1 ? 'Location' : 'Locations'}</span>
                </div>
                <div class="grid-4">
                    ${grouped[country].map(d => `
                        <div class="dest-card" onclick="navTo('packages', '${escapeHTML(d.id)}')">
                            <div class="dest-img-wrap">
                                ${buildResponsiveImgHtml({
                                    src: d.image_url,
                                    alt: `Luxury vacation and bespoke tours in ${d.name}`,
                                    widths: [400, 800, 1200],
                                    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
                                    loading: 'lazy'
                                })}
                                <span class="dest-tag"><i class="fas fa-sun"></i> ${escapeHTML(d.best_time || 'All Seasons')}</span>
                            </div>
                            <div class="dest-body">
                                <h3>${escapeHTML(d.name)}</h3>
                                <p class="dest-country">${escapeHTML(d.description ? d.description.substring(0, 75) + '...' : '')}</p>
                                <div class="dest-footer">
                                    <span>View Curated Tours</span>
                                    <i class="fas fa-arrow-right"></i>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
    announceA11y(`Showing ${filtered.length} luxury destinations`);
}

const debounceDestSearch = debounce(loadDestinations, 350);

function resetDestFilters() {
    const s = document.getElementById('dest-search'); if (s) s.value = '';
    const c = document.getElementById('dest-country-filter'); if (c) c.value = '';
    const sort = document.getElementById('dest-sort'); if (sort) sort.value = 'name_asc';
    loadDestinations();
}

// --- PACKAGES CATALOG VIEW ---
function renderSkeletons(containerId = 'list_packages', count = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skel-card">
                <div class="skeleton skel-img"></div>
                <div class="skel-body">
                    <div class="skeleton skel-line" style="width:40%;"></div>
                    <div class="skeleton skel-line" style="width:85%; height:20px; margin:10px 0;"></div>
                    <div class="skeleton skel-line" style="width:60%;"></div>
                    <div class="skeleton skel-line" style="width:35%; height:24px; margin-top:20px;"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function initPackageFilters() {
    const destSelect = document.getElementById('filter-destination');
    if (destSelect && destSelect.options.length <= 1) {
        const dests = await fetchDestinations();
        dests.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.name + (d.country ? ` (${d.country})` : '');
            destSelect.appendChild(opt);
        });
    }

    // Set destination select if activeDestFilter is set
    if (activeDestFilter && destSelect) {
        for (let i = 0; i < destSelect.options.length; i++) {
            const opt = destSelect.options[i];
            if (opt.value === activeDestFilter || opt.text.toLowerCase().includes(activeDestFilter.toLowerCase())) {
                destSelect.selectedIndex = i;
                break;
            }
        }
    }

    // Carry over heroSearchQuery parameters
    if (heroSearchQuery) {
        if (heroSearchQuery.destination) {
            const searchInput = document.getElementById('pkg_search');
            if (searchInput) searchInput.value = heroSearchQuery.destination;
            if (destSelect) {
                for (let i = 0; i < destSelect.options.length; i++) {
                    const opt = destSelect.options[i];
                    if (opt.text.toLowerCase().includes(heroSearchQuery.destination.toLowerCase()) || opt.value.toLowerCase() === heroSearchQuery.destination.toLowerCase()) {
                        destSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
        if (heroSearchQuery.category) {
            const catSelect = document.getElementById('filter-category');
            if (catSelect) catSelect.value = heroSearchQuery.category;
        }
        heroSearchQuery = null; // Clear so subsequent visits aren't stuck on previous search
    }
}

function renderPackageCard(p) {
    const destName = p.destinations?.name || (LUXURY_FALLBACK_DATA.destinations.find(d => d.id === p.destination_id)?.name) || 'World Class';
    const formattedPrice = formatPrice(p.price);
    const category = p.category || 'Luxury';
    
    return `
        <div class="pkg-card" onclick="navTo('package', '${escapeHTML(p.id)}')">
            <div class="pkg-img-box">
                ${buildResponsiveImgHtml({
                    src: p.image_url,
                    alt: `${p.title} — Luxury Itinerary in ${destName}`,
                    widths: [400, 800, 1200],
                    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
                    loading: 'lazy'
                })}
                <span class="pkg-ribbon">${escapeHTML(category)}</span>
                <span class="pkg-rating"><i class="fas fa-star"></i> 4.9 (120+)</span>
            </div>
            <div class="pkg-body">
                <div class="pkg-meta-row">
                    <span><i class="fas fa-clock"></i> ${escapeHTML(p.duration || 'Flexible Days')}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHTML(destName)}</span>
                </div>
                <h3 class="pkg-title">${escapeHTML(p.title)}</h3>
                <p class="pkg-desc">${escapeHTML(p.short_description || p.description || 'Curated luxury journey with handpicked 5-star accommodations and private excursions.')}</p>
                
                <div class="pkg-highlights">
                    <span class="pkg-chip"><i class="fas fa-hotel"></i> 5★ Stays</span>
                    <span class="pkg-chip"><i class="fas fa-car"></i> Private Chauffeur</span>
                    <span class="pkg-chip"><i class="fas fa-utensils"></i> Gourmet Meals</span>
                </div>

                <div class="pkg-footer">
                    <div class="pkg-price-wrap">
                        <span class="price-lead">From / Per Person</span>
                        <div class="price-amount"><span class="currency">${formattedPrice}</span></div>
                    </div>
                    <div class="pkg-action-btns">
                        <button class="btn btn-gold btn-sm" onclick="event.stopPropagation(); navTo('package', '${escapeHTML(p.id)}')">View Tour</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadPackages() {
    renderSkeletons('list_packages', 6);
    const container = document.getElementById('list_packages');
    if (!container) return;

    const searchTerm = (document.getElementById('pkg_search')?.value || '').toLowerCase();
    const filterDest = document.getElementById('filter-destination')?.value || activeDestFilter || '';
    const filterCat = document.getElementById('filter-category')?.value || '';
    const minPrice = document.getElementById('filter-min-price')?.value;
    const maxPrice = document.getElementById('filter-max-price')?.value;
    const sortVal = document.getElementById('pkg_sort')?.value || 'new';

    const allPackages = await fetchPackages();

    let filtered = allPackages.filter(p => {
        const destName = p.destinations?.name || (LUXURY_FALLBACK_DATA.destinations.find(d => d.id === p.destination_id)?.name) || '';
        const matchesSearch = !searchTerm || 
            (p.title && p.title.toLowerCase().includes(searchTerm)) || 
            (p.duration && p.duration.toLowerCase().includes(searchTerm)) ||
            (destName && destName.toLowerCase().includes(searchTerm));
        
        const matchesDest = !filterDest || p.destination_id === filterDest || destName.toLowerCase() === filterDest.toLowerCase();
        const matchesCat = !filterCat || (p.category && p.category.toLowerCase() === filterCat.toLowerCase());
        const matchesMin = !minPrice || p.price >= Number(minPrice);
        const matchesMax = !maxPrice || p.price <= Number(maxPrice);

        return matchesSearch && matchesDest && matchesCat && matchesMin && matchesMax;
    });

    // Sorting
    if (sortVal === 'price_asc') filtered.sort((a,b) => a.price - b.price);
    else if (sortVal === 'price_desc') filtered.sort((a,b) => b.price - a.price);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:70px 20px;">
                <i class="fas fa-compass" style="font-size:3.5rem; color:var(--gold-500); margin-bottom:16px;"></i>
                <h2>No Luxury Packages Found</h2>
                <p style="color:var(--text-muted); max-width:500px; margin:0 auto 24px;">We couldn't find packages matching your exact criteria. Customize a trip with our senior travel concierge!</p>
                <button class="btn btn-gold" onclick="clearFilter()"><i class="fas fa-undo"></i> Reset Filters</button>
            </div>
        `;
        announceA11y('No luxury packages found for the selected filters.');
        return;
    }

    container.innerHTML = filtered.map(p => renderPackageCard(p)).join('');
    announceA11y(`Showing ${filtered.length} curated luxury packages`);
}

const debounceSearch = debounce(loadPackages, 350);

function clearFilter() {
    activeDestFilter = null;
    heroSearchQuery = null;
    const search = document.getElementById('pkg_search'); if (search) search.value = '';
    const dest = document.getElementById('filter-destination'); if (dest) dest.value = '';
    const cat = document.getElementById('filter-category'); if (cat) cat.value = '';
    const min = document.getElementById('filter-min-price'); if (min) min.value = '';
    const max = document.getElementById('filter-max-price'); if (max) max.value = '';
    const sort = document.getElementById('pkg_sort'); if (sort) sort.value = 'new';
    loadPackages();
}

// --- PACKAGE DETAILS VIEW (EDITORIAL LUXURY) ---
async function loadPackageDetails(id) {
    const container = document.getElementById('pkg_details_container');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:100px 0;"><div class="loader-spinner"></div><p style="margin-top:15px;">Loading bespoke itinerary...</p></div>';

    let pkg = null;
    if (sb) {
        try {
            const { data, error } = await sb.from('packages').select('*, destinations(name, country)').eq('id', id).maybeSingle();
            if (!error && data) pkg = data;
        } catch(e) {}
    }

    if (!pkg) {
        pkg = LUXURY_FALLBACK_DATA.packages.find(p => p.id === id || p.title.toLowerCase().includes(id.toLowerCase()));
    }

    if (!pkg) {
        container.innerHTML = `
            <div style="text-align:center; padding:80px 20px;">
                <h2>Package Not Found</h2>
                <p style="color:var(--text-muted); margin-bottom:20px;">The requested itinerary may have been updated or moved.</p>
                <button class="btn btn-gold" onclick="navTo('packages')"><i class="fas fa-arrow-left"></i> Return to Packages</button>
            </div>
        `;
        return;
    }

    currentPackage = pkg;
    const destName = pkg.destinations?.name || (LUXURY_FALLBACK_DATA.destinations.find(d => d.id === pkg.destination_id)?.name) || 'Global Destination';
    const uniqueImages = Array.from(new Set([pkg.image_url, ...(pkg.gallery_images || [])].filter(Boolean)));
    if (uniqueImages.length === 0) {
        uniqueImages.push('https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80');
    }
    const cleanPkgDesc = (pkg.short_description || pkg.description || `Experience ${pkg.title} with Via Tours & Travels. Handpicked 5-star accommodations, private guided tours, and 24/7 dedicated concierge.`)
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const metaPkgDesc = cleanPkgDesc.length > 155 ? cleanPkgDesc.substring(0, 152) + '...' : cleanPkgDesc;
    updateSEO(`${pkg.title} — Luxury Tour Package | Via Tours & Travels`, metaPkgDesc, uniqueImages[0], `#/package/${pkg.id}`);

    // Dynamic Schema.org TouristTrip JSON-LD for rich snippets
    let pkgSchema = document.getElementById('schema-package-tour');
    if (!pkgSchema) {
        pkgSchema = document.createElement('script');
        pkgSchema.id = 'schema-package-tour';
        pkgSchema.type = 'application/ld+json';
        document.head.appendChild(pkgSchema);
    }
    pkgSchema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        "name": pkg.title,
        "description": pkg.description || pkg.short_description || pkg.title,
        "touristType": "Luxury Travelers",
        "image": uniqueImages[0],
        "offers": {
            "@type": "Offer",
            "price": pkg.price,
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock"
        },
        "provider": {
            "@type": "TravelAgency",
            "name": "Via Tours & Travels"
        }
    });

    // Build adaptive mosaic gallery markup without duplicate repeats
    let galleryClass = 'mosaic-gallery';
    let galleryHTML = '';
    const imagesAttr = escapeHTML(JSON.stringify(uniqueImages));

    if (uniqueImages.length === 1) {
        galleryClass += ' single-img';
        galleryHTML = `
            <div class="mosaic-main" onclick="openLightbox('${escapeHTML(uniqueImages[0])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                ${buildResponsiveImgHtml({
                    src: uniqueImages[0],
                    id: 'detail_main_image',
                    alt: `${pkg.title} — Primary Showcase Photo`,
                    widths: [800, 1200, 1600],
                    sizes: '(max-width: 768px) 100vw, 1200px',
                    loading: 'eager',
                    fetchpriority: 'high'
                })}
                <span class="mosaic-zoom-badge"><i class="fas fa-expand"></i> View High-Res Photo</span>
            </div>
        `;
    } else if (uniqueImages.length === 2) {
        galleryClass += ' dual-img';
        galleryHTML = `
            <div class="mosaic-main" onclick="openLightbox('${escapeHTML(uniqueImages[0])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                ${buildResponsiveImgHtml({
                    src: uniqueImages[0],
                    id: 'detail_main_image',
                    alt: `${pkg.title} — Primary Showcase Photo (1 of 2)`,
                    widths: [800, 1200, 1600],
                    sizes: '(max-width: 768px) 100vw, 60vw',
                    loading: 'eager',
                    fetchpriority: 'high'
                })}
                <span class="mosaic-zoom-badge"><i class="fas fa-expand"></i> Photo 1 of 2</span>
            </div>
            <div class="mosaic-item" onclick="openLightbox('${escapeHTML(uniqueImages[1])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                ${buildResponsiveImgHtml({
                    src: uniqueImages[1],
                    alt: `${pkg.title} — Luxury Accommodation (Photo 2 of 2)`,
                    widths: [400, 800],
                    sizes: '(max-width: 768px) 100vw, 40vw',
                    loading: 'lazy'
                })}
                <span class="mosaic-zoom-badge"><i class="fas fa-expand"></i> Photo 2 of 2</span>
            </div>
        `;
    } else if (uniqueImages.length === 3) {
        galleryClass += ' triple-img';
        galleryHTML = `
            <div class="mosaic-main" onclick="openLightbox('${escapeHTML(uniqueImages[0])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                ${buildResponsiveImgHtml({
                    src: uniqueImages[0],
                    id: 'detail_main_image',
                    alt: `${pkg.title} — Primary Showcase Photo`,
                    widths: [800, 1200, 1600],
                    sizes: '(max-width: 768px) 100vw, 60vw',
                    loading: 'eager',
                    fetchpriority: 'high'
                })}
                <span class="mosaic-zoom-badge"><i class="fas fa-expand"></i> View Full Gallery</span>
            </div>
            <div class="mosaic-item" onclick="openLightbox('${escapeHTML(uniqueImages[1])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                ${buildResponsiveImgHtml({
                    src: uniqueImages[1],
                    alt: `${pkg.title} — Luxury Villa & Interior (Photo 2 of 3)`,
                    widths: [400, 800],
                    sizes: '(max-width: 768px) 50vw, 20vw',
                    loading: 'lazy'
                })}
            </div>
            <div class="mosaic-item" onclick="openLightbox('${escapeHTML(uniqueImages[2])}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                ${buildResponsiveImgHtml({
                    src: uniqueImages[2],
                    alt: `${pkg.title} — Destination Excursions (Photo 3 of 3)`,
                    widths: [400, 800],
                    sizes: '(max-width: 768px) 50vw, 20vw',
                    loading: 'lazy'
                })}
            </div>
        `;
    } else {
        const mainImg = uniqueImages[0];
        const extraItems = uniqueImages.slice(1, 5).map((imgUrl, i) => `
            <div class="mosaic-item" onclick="openLightbox('${escapeHTML(imgUrl)}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                ${buildResponsiveImgHtml({
                    src: imgUrl,
                    alt: `${pkg.title} — Itinerary Experience (Photo ${i + 2} of ${uniqueImages.length})`,
                    widths: [400, 800],
                    sizes: '(max-width: 768px) 50vw, 20vw',
                    loading: 'lazy'
                })}
            </div>
        `).join('');

        galleryHTML = `
            <div class="mosaic-main" onclick="openLightbox('${escapeHTML(mainImg)}', ${imagesAttr}, '${escapeHTML(pkg.title)}')">
                ${buildResponsiveImgHtml({
                    src: mainImg,
                    id: 'detail_main_image',
                    alt: `${pkg.title} — Primary Showcase Photo`,
                    widths: [800, 1200, 1600],
                    sizes: '(max-width: 768px) 100vw, 60vw',
                    loading: 'eager',
                    fetchpriority: 'high'
                })}
                <span class="mosaic-zoom-badge"><i class="fas fa-expand"></i> ${uniqueImages.length} Photos</span>
            </div>
            ${extraItems}
        `;
    }

    container.innerHTML = `
        <div class="pkg-detail-header">
            <div class="pkg-breadcrumbs">
                <a onclick="navTo('home')">Home</a>
                <i class="fas fa-chevron-right" style="font-size:0.7rem;"></i>
                <a onclick="navTo('packages')">Packages</a>
                <i class="fas fa-chevron-right" style="font-size:0.7rem;"></i>
                <span>${escapeHTML(pkg.title)}</span>
            </div>
            
            <h1 class="pkg-detail-title">${escapeHTML(pkg.title)}</h1>
            <div class="pkg-detail-meta">
                <span><i class="fas fa-clock"></i> ${escapeHTML(pkg.duration || 'Flexible')}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHTML(destName)}</span>
                <span><i class="fas fa-crown"></i> ${escapeHTML(pkg.category || 'Luxury')}</span>
                <span><i class="fas fa-star" style="color:#fbbf24;"></i> 4.9 (120+ Reviews)</span>
            </div>
        </div>

        <!-- Adaptive Mosaic Gallery -->
        <div class="${galleryClass}">
            ${galleryHTML}
        </div>

        <!-- Detail Main Layout -->
        <div class="detail-layout">
            <div class="detail-content">
                <div style="margin-bottom:30px;">
                    <h3>Journey Overview</h3>
                    <p style="font-size:1.05rem; line-height:1.75; color:var(--text-secondary); margin-top:8px;">${escapeHTML(pkg.description || pkg.short_description || '')}</p>
                </div>

                <div class="luxury-tabs">
                    <button class="luxury-tab-btn active" onclick="switchDetailTab(event, 'itinerary')"><i class="fas fa-stream"></i> Day-by-Day Itinerary</button>
                    <button class="luxury-tab-btn" onclick="switchDetailTab(event, 'inclusions')"><i class="fas fa-check-circle"></i> Inclusions & Exclusions</button>
                    <button class="luxury-tab-btn" onclick="switchDetailTab(event, 'notes')"><i class="fas fa-info-circle"></i> Important Advisory</button>
                </div>

                <div id="detail_tab_content">
                    <!-- Injected by renderDetailTabContent -->
                </div>
            </div>

            <!-- Sticky Luxury Booking & Price Calculator Sidebar -->
            <aside class="sticky-sidebar">
                <div class="sidebar-price-box">
                    <span class="sidebar-price-label">Starting From</span>
                    <div class="sidebar-price-val" id="sidebar_display_price">${baseFormattedPrice}</div>
                    <span class="sidebar-price-note"><i class="fas fa-check-circle"></i> Best Luxury Value Guaranteed</span>
                </div>

                <div class="calc-row">
                    <label for="calc_travelers"><i class="fas fa-user-friends"></i> Number of Travelers</label>
                    <select id="calc_travelers" onchange="calculateSidebarPrice()">
                        <option value="1">1 Solo Traveler</option>
                        <option value="2" selected>2 Adults (1 Couple Room)</option>
                        <option value="3">3 Adults (1 Triple Room)</option>
                        <option value="4">4 Adults (2 Luxury Rooms)</option>
                        <option value="6">6 Adults (3 Luxury Rooms / Villa)</option>
                    </select>
                </div>

                <div class="calc-row">
                    <label for="calc_tier"><i class="fas fa-hotel"></i> Accommodation Tier</label>
                    <select id="calc_tier" onchange="calculateSidebarPrice()">
                        <option value="1.0" selected>5★ Ultra Luxury Resort / Villa</option>
                        <option value="0.85">4★ Premium Boutique Suite (-15%)</option>
                        <option value="1.35">Presidential / Private Pool Villa (+35%)</option>
                    </select>
                </div>

                <div class="calc-summary">
                    <div class="calc-summary-row">
                        <span>Base Rate / Person</span>
                        <span id="calc_base_rate">${baseFormattedPrice}</span>
                    </div>
                    <div class="calc-summary-row">
                        <span>Travelers</span>
                        <span id="calc_pax_count">2</span>
                    </div>
                    <div class="calc-summary-row total">
                        <span>Estimated Total</span>
                        <span id="calc_total_val" style="color:var(--gold-500); font-weight:800;">${baseFormattedPrice}</span>
                    </div>
                </div>

                <a href="https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello Via Tours! I am interested in customizing the ' + pkg.title + ' itinerary.')}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="width:100%; margin-bottom:12px;">
                    <i class="fab fa-whatsapp"></i> Chat with Concierge
                </a>

                <button class="btn btn-gold" style="width:100%;" onclick="openCustomTripFromPkg('${escapeHTML(pkg.id)}')">
                    <i class="fas fa-file-invoice"></i> Request Formal Quotation
                </button>
            </aside>
        </div>
    `;

    // Initialize Mobile Sticky Booking Bar
    const mobSticky = document.getElementById('mobileStickyBooking');
    const mobPrice = document.getElementById('mobStickyPrice');
    const mobWa = document.getElementById('mobStickyWaBtn');
    if (mobSticky && mobPrice) {
        if (window.innerWidth < 992) {
            mobSticky.style.display = 'flex';
            document.body.classList.add('has-sticky-booking');
        } else {
            document.body.classList.remove('has-sticky-booking');
        }
        mobPrice.textContent = baseFormattedPrice;
        if (mobWa) {
            mobWa.href = `https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello Via Tours! I would like to customize or book the ' + pkg.title + ' tour.')}`;
        }
    }

    renderDetailTabContent('itinerary');
    calculateSidebarPrice();
}

function openCustomTripFromCurrentPkg() {
    if (currentPackage && currentPackage.id) {
        openCustomTripFromPkg(currentPackage.id);
    } else {
        navTo('plan-trip');
    }
}

function switchDetailTab(ev, tab) {
    document.querySelectorAll('.luxury-tab-btn').forEach(b => b.classList.remove('active'));
    ev.currentTarget.classList.add('active');
    renderDetailTabContent(tab);
}

function renderDetailTabContent(tab) {
    const c = document.getElementById('detail_tab_content');
    if (!c || !currentPackage) return;
    const pkg = currentPackage;

    if (tab === 'itinerary') {
        const itin = pkg.itinerary || [];
        c.innerHTML = `
            <div class="itinerary-timeline">
                ${itin.length ? itin.map((d, idx) => `
                    <div class="itinerary-day-card">
                        <div class="itinerary-dot">${idx + 1}</div>
                        <h4>${escapeHTML(d.title || `Day ${idx + 1}`)}</h4>
                        <p style="white-space:pre-line;">${escapeHTML(d.desc || d.description || '')}</p>
                    </div>
                `).join('') : '<p style="padding:20px; color:var(--text-muted);">Custom detailed day-by-day plan will be tailored upon booking.</p>'}
            </div>
        `;
    } else if (tab === 'inclusions') {
        const inc = pkg.inclusions || [];
        const exc = pkg.exclusions || [];
        c.innerHTML = `
            <div class="checklist-grid">
                <div class="check-box included">
                    <h4><i class="fas fa-check-circle"></i> What is Included</h4>
                    <ul class="check-list included">
                        ${inc.map(i => `<li><i class="fas fa-check"></i> <span>${escapeHTML(i)}</span></li>`).join('') || '<li>Standard 5★ Inclusions</li>'}
                    </ul>
                </div>
                <div class="check-box excluded">
                    <h4><i class="fas fa-times-circle"></i> Exclusions</h4>
                    <ul class="check-list excluded">
                        ${exc.map(e => `<li><i class="fas fa-times"></i> <span>${escapeHTML(e)}</span></li>`).join('') || '<li>Personal expenses & flights outside package</li>'}
                    </ul>
                </div>
            </div>
        `;
    } else if (tab === 'notes') {
        const notes = pkg.important_info || [];
        c.innerHTML = `
            <div class="check-box" style="background:var(--surface-card);">
                <h4><i class="fas fa-shield-alt" style="color:var(--gold-500);"></i> Essential Travel & Visa Advisory</h4>
                <ul class="check-list included" style="margin-top:14px;">
                    ${notes.map(n => `<li><i class="fas fa-info-circle" style="color:var(--gold-500);"></i> <span>${escapeHTML(n)}</span></li>`).join('') || '<li>Passport must have at least 6 months validity.</li>'}
                    <li><i class="fas fa-info-circle" style="color:var(--gold-500);"></i> <span>Our team provides full visa documentation, appointment filing, and fast-track clearance support.</span></li>
                </ul>
            </div>
        `;
    }
}

function calculateSidebarPrice() {
    if (!currentPackage) return;
    const travelers = Number(document.getElementById('calc_travelers')?.value) || 2;
    const tierMultiplier = Number(document.getElementById('calc_tier')?.value) || 1.0;
    const basePrice = currentPackage.price || 150000;

    const pricePerPerson = basePrice * tierMultiplier;
    const totalEstimate = pricePerPerson * travelers;

    const baseEl = document.getElementById('calc_base_rate');
    const paxEl = document.getElementById('calc_pax_count');
    const totalEl = document.getElementById('calc_total_val');
    const sidebarDisplay = document.getElementById('sidebar_display_price');

    if (baseEl) baseEl.textContent = formatPrice(pricePerPerson);
    if (paxEl) paxEl.textContent = travelers;
    if (totalEl) totalEl.textContent = formatPrice(totalEstimate);
    if (sidebarDisplay) sidebarDisplay.textContent = formatPrice(totalEstimate);

    const mobPrice = document.getElementById('mobStickyPrice');
    if (mobPrice) mobPrice.textContent = formatPrice(pricePerPerson);
}

function openCustomTripFromPkg(pkgId) {
    const travelers = document.getElementById('calc_travelers')?.value;
    const tier = document.getElementById('calc_tier')?.value;

    navTo('plan-trip', pkgId);

    // Transfer sidebar calculator preferences to the plan trip wizard inputs
    setTimeout(() => {
        if (travelers) {
            const ptPax = document.getElementById('pt_travelers');
            if (ptPax) ptPax.value = travelers;
        }
        if (tier) {
            const ptHotel = document.getElementById('pt_hotel');
            if (ptHotel) {
                if (tier === '1.3') ptHotel.value = '5-Star Luxury';
                else if (tier === '1.8') ptHotel.value = 'Private Villa / Palace';
                else ptHotel.value = '4-Star Premium';
            }
        }
    }, 100);
}

// --- HIGH-END LUXURY LIGHTBOX MODAL ---
let lightboxImages = [];
let currentLightboxIndex = 0;

function openLightbox(url, imagesList = [], caption = '') {
    const modal = document.getElementById('imageLightboxModal');
    const img = document.getElementById('lightboxActiveImage');
    const cap = document.getElementById('lightboxCaption');
    if (!modal || !img) return;

    if (imagesList && imagesList.length > 0) {
        lightboxImages = imagesList;
        currentLightboxIndex = imagesList.indexOf(url) >= 0 ? imagesList.indexOf(url) : 0;
    } else {
        lightboxImages = [url];
        currentLightboxIndex = 0;
    }

    img.src = lightboxImages[currentLightboxIndex] || url;
    const activeCaption = caption || (currentPackage ? currentPackage.title : 'Via Tours & Travels');
    img.alt = `${activeCaption} — Full Screen Photo View (${currentLightboxIndex + 1} of ${lightboxImages.length})`;
    if (cap) cap.textContent = activeCaption;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    updateLightboxNav();
}

function closeLightbox(e) {
    if (e && e.target && !e.target.classList.contains('lightbox-backdrop') && !e.target.classList.contains('lightbox-close')) return;
    const modal = document.getElementById('imageLightboxModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function navigateLightbox(dir) {
    if (lightboxImages.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    const img = document.getElementById('lightboxActiveImage');
    const cap = document.getElementById('lightboxCaption');
    if (img) {
        img.src = lightboxImages[currentLightboxIndex];
        const activeCaption = cap?.textContent || (currentPackage ? currentPackage.title : 'Via Tours & Travels');
        img.alt = `${activeCaption} — Full Screen Photo View (${currentLightboxIndex + 1} of ${lightboxImages.length})`;
    }
    updateLightboxNav();
}

function updateLightboxNav() {
    const prevBtn = document.getElementById('lightboxPrevBtn');
    const nextBtn = document.getElementById('lightboxNextBtn');
    const show = lightboxImages.length > 1;
    if (prevBtn) prevBtn.style.display = show ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = show ? 'flex' : 'none';
}

// --- INTERACTIVE MULTI-STEP TRIP BUILDER ---
let currentTripStep = 1;

function selectTripStyle(styleName, el) {
    document.querySelectorAll('.style-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    const hidden = document.getElementById('pt_style');
    if (hidden) hidden.value = styleName;
}

function nextTripStep(stepNum) {
    // Validate current step
    if (stepNum > currentTripStep) {
        if (currentTripStep === 1) {
            const dest = document.getElementById('pt_dest').value.trim();
            if (!dest) {
                showToast('Please enter your preferred destination.', 'error');
                return;
            }
        } else if (currentTripStep === 2) {
            const dates = document.getElementById('pt_dates').value;
            if (!dates) {
                showToast('Please select an estimated travel date.', 'error');
                return;
            }
        }
    }

    currentTripStep = stepNum;

    // Update progress nodes
    for (let i = 1; i <= 4; i++) {
        const node = document.getElementById('node-' + i);
        const content = document.getElementById('step-' + i);
        if (node) {
            node.classList.remove('active', 'completed');
            if (i === stepNum) node.classList.add('active');
            else if (i < stepNum) node.classList.add('completed');
        }
        if (content) {
            content.classList.remove('active');
            if (i === stepNum) content.classList.add('active');
        }
    }
}

async function setupPlanForm(pkgId) {
    initDatePickers();
    currentTripStep = 1;
    nextTripStep(1);

    const destInput = document.getElementById('pt_dest');
    const pkgHidden = document.getElementById('pt_pkg_id');
    if (destInput) destInput.value = '';
    if (pkgHidden) pkgHidden.value = '';

    if (pkgId) {
        const pkgs = await fetchPackages();
        const pkg = pkgs.find(p => String(p.id) === String(pkgId));
        if (pkg) {
            const destName = pkg.destinations?.name || (LUXURY_FALLBACK_DATA.destinations.find(d => d.id === pkg.destination_id)?.name) || '';
            if (destInput) destInput.value = `${pkg.title}${destName ? ' (' + destName + ')' : ''}`;
            if (pkgHidden) pkgHidden.value = pkg.id;
        }
    }
}

// Plan trip form submission
const planTripForm = document.getElementById('planTripForm');
if (planTripForm) {
    planTripForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // If user pressed Enter in steps 1-3, advance wizard smoothly instead of submitting
        if (currentTripStep < 4) {
            nextTripStep(currentTripStep + 1);
            return;
        }

        // Spam check
        if (document.getElementById('honeypot')?.value) {
            showToast('Spam detected.', 'error');
            return;
        }

        const btn = document.getElementById('btn_submit_plan');
        await withLoading(btn, async () => {
            const name = document.getElementById('pt_name')?.value.trim();
            const email = document.getElementById('pt_email')?.value.trim();
            const phone = document.getElementById('pt_phone')?.value.trim();
            const dest = document.getElementById('pt_dest')?.value.trim();
            const dates = document.getElementById('pt_dates')?.value;
            const travelers = document.getElementById('pt_travelers')?.value || '2';
            const duration = document.getElementById('pt_duration_pref')?.value;
            const hotel = document.getElementById('pt_hotel')?.value;
            const budget = document.getElementById('pt_budget')?.value.trim();
            const style = document.getElementById('pt_style')?.value || 'Ultra Luxury';
            const req = document.getElementById('pt_req')?.value.trim();
            const pkgId = document.getElementById('pt_pkg_id')?.value || null;

            if (!name || !email || !phone) {
                showToast('Please fill all required contact fields.', 'error');
                return;
            }

            // Guard against non-UUID package IDs (e.g. 'pkg-maldives-sanctuary') triggering PostgreSQL 22P02 error
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const validPackageId = (pkgId && uuidRegex.test(pkgId)) ? pkgId : null;

            // Preserve non-UUID package reference in destination string so the lead preserves exact tour intent
            let enrichedDest = dest;
            if (pkgId && !validPackageId && !enrichedDest.includes(pkgId)) {
                enrichedDest = enrichedDest ? `${enrichedDest} [Ref: ${pkgId}]` : `Package Ref: ${pkgId}`;
            }

            const payload = {
                name,
                email,
                phone,
                destination: enrichedDest,
                travel_dates: dates ? `${dates} (${duration})` : duration,
                travelers,
                hotel_pref: `${hotel} (${style})`,
                budget: budget || 'Flexible',
                requirements: req,
                package_id: validPackageId,
                status: 'New'
            };

            if (sb) {
                try {
                    await sb.from('enquiries').insert([payload]);
                    const { data: cust } = await sb.from('customers').select('id').eq('email', email).maybeSingle();
                    if (!cust) {
                        await sb.from('customers').insert([{ name, email, phone, whatsapp: phone }]);
                    }
                } catch (err) {
                    console.warn('Enquiry save to Supabase:', err);
                }
            }

            // Trigger celebratory confetti if library is available
            if (window.confetti) {
                window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }

            showToast('🎉 Your bespoke itinerary inquiry has been received! Our specialist will contact you shortly.', 'success');
            
            // Redirect to WhatsApp handover option or home
            setTimeout(() => {
                navTo('home');
            }, 2500);
        });
    });
}

// Modal Trip Form Submission
const tripModalForm = document.getElementById('tripModalForm');
if (tripModalForm) {
    tripModalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (document.getElementById('modal_honeypot')?.value) return;

        const name = document.getElementById('modal_pt_name')?.value.trim();
        const email = document.getElementById('modal_pt_email')?.value.trim();
        const phone = document.getElementById('modal_pt_phone')?.value.trim();
        const dest = document.getElementById('modal_pt_dest')?.value.trim();
        const dates = document.getElementById('modal_pt_dates')?.value;
        const travelers = document.getElementById('modal_pt_travelers')?.value || '2';
        const req = document.getElementById('modal_pt_req')?.value.trim();

        if (!name || !email || !phone) {
            showToast('Please fill all required fields.', 'error');
            return;
        }

        const payload = {
            name,
            email,
            phone,
            destination: dest || 'General Luxury Escapes',
            travel_dates: dates || 'Flexible',
            travelers,
            requirements: req,
            status: 'New'
        };

        if (sb) {
            try {
                await sb.from('enquiries').insert([payload]);
            } catch (err) {}
        }

        if (window.confetti) window.confetti({ particleCount: 100, spread: 70 });
        showToast('Thank you! Your travel quotation request has been received.', 'success');
        hideTripModal();
    });
}

// Quick Contact Form
async function handleQuickContact(e) {
    e.preventDefault();
    if (document.getElementById('c_honeypot')?.value) return; // Anti-spam bot trap
    const name = document.getElementById('c_name')?.value.trim() || '';
    const email = document.getElementById('c_email')?.value.trim() || '';
    const phone = document.getElementById('c_phone')?.value.trim() || '';
    const msg = document.getElementById('c_msg')?.value.trim() || '';

    if (!name || (!email && !phone)) {
        showToast('Please provide your name and at least an email or phone number.', 'error');
        return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    await withLoading(btn, async () => {
        if (sb) {
            try {
                await sb.from('enquiries').insert([{
                    name,
                    email: email || 'N/A',
                    phone: phone || 'N/A',
                    destination: 'Contact Page Inquiry',
                    requirements: msg,
                    status: 'New'
                }]);
            } catch (err) {
                console.warn('Contact inquiry save error:', err);
            }
        }
        showToast('Your message has been sent to our concierge desk!', 'success');
        e.target.reset();
    });
}

// Newsletter Subscription
async function handleNewsletter(e) {
    e.preventDefault();
    const emailInput = document.getElementById('nl_email');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email) return;

    if (sb) {
        try {
            await sb.from('enquiries').insert([{
                name: 'Newsletter Subscriber',
                email: email,
                phone: 'N/A',
                destination: 'Newsletter Subscription (The Luxury Bulletin)',
                requirements: 'Opted in for secret villa deals, seasonal travel guides, and VIP invitations.',
                status: 'Subscribed'
            }]);
        } catch (err) {
            console.warn('Newsletter subscription save error:', err);
        }
    }
    showToast(`Thank you! ${email} is now subscribed to The Luxury Bulletin.`, 'success');
    if (e.target && e.target.reset) e.target.reset();
}

// --- TRAVEL JOURNAL BLOG VIEW ---
async function loadBlog() {
    const container = document.getElementById('list_blog');
    if (!container) return;
    const blogs = await fetchBlogs();

    container.innerHTML = blogs.map(b => `
        <article class="blog-card" onclick="navTo('blog-post', '${escapeHTML(b.slug || b.id)}')">
            ${buildResponsiveImgHtml({
                src: b.image_url,
                alt: `${b.title} — Luxury Travel Journal Guide`,
                widths: [400, 800],
                sizes: '(max-width: 768px) 100vw, 33vw',
                loading: 'lazy'
            })}
            <div class="blog-body">
                <div class="blog-meta-tag">
                    <span><i class="fas fa-compass"></i> Via Journal</span>
                    <span>${new Date(b.created_at || Date.now()).toLocaleDateString('en-IN', { month:'short', day:'numeric', year:'numeric' })}</span>
                </div>
                <h2 class="blog-title">${escapeHTML(b.title)}</h2>
                <p class="blog-excerpt">${escapeHTML(b.excerpt || '')}</p>
                <span class="read-story">Read Article <i class="fas fa-arrow-right"></i></span>
            </div>
        </article>
    `).join('');
}

async function loadBlogPost(slugOrId) {
    const container = document.getElementById('blog_details_container');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:80px 0;"><div class="loader-spinner"></div><p>Loading article...</p></div>';

    let blog = null;
    if (sb) {
        try {
            const isUUID = /^[0-9a-fA-F-]{36}$/.test(slugOrId);
            let q = sb.from('blog_posts').select('*').eq('is_published', true);
            if (isUUID) q = q.eq('id', slugOrId);
            else q = q.eq('slug', slugOrId);
            const { data } = await q.maybeSingle();
            if (data) blog = data;
        } catch (e) {}
    }

    if (!blog) {
        blog = LUXURY_FALLBACK_DATA.blogs.find(b => b.slug === slugOrId || b.id === slugOrId);
    }

    if (!blog) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px 0;">
                <h2>Article Not Found</h2>
                <p style="color:var(--text-muted); margin-bottom:20px;">The requested travel story is no longer available.</p>
                <button class="btn btn-gold" onclick="navTo('blog')"><i class="fas fa-arrow-left"></i> Back to Travel Journal</button>
            </div>
        `;
        return;
    }

    const cleanBlogDesc = (blog.excerpt || blog.content || `Read our luxury travel guide: ${blog.title}. Curated insights, packing advice, and insider luxury hotel reviews from Via Tours & Travels specialists.`)
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const metaBlogDesc = cleanBlogDesc.length > 155 ? cleanBlogDesc.substring(0, 152) + '...' : cleanBlogDesc;
    updateSEO(`${blog.title} | Via Luxury Travel Journal`, metaBlogDesc, blog.image_url, `#/blog-post/${blog.slug || blog.id}`);

    // Dynamic Schema.org BlogPosting JSON-LD for rich snippets
    let blogSchema = document.getElementById('schema-blog-article');
    if (!blogSchema) {
        blogSchema = document.createElement('script');
        blogSchema.id = 'schema-blog-article';
        blogSchema.type = 'application/ld+json';
        document.head.appendChild(blogSchema);
    }
    blogSchema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blog.title,
        "description": blog.excerpt || blog.title,
        "image": blog.image_url,
        "datePublished": blog.created_at || new Date().toISOString(),
        "author": {
            "@type": "Organization",
            "name": "Via Tours & Travels Specialist"
        },
        "publisher": {
            "@type": "TravelAgency",
            "name": "Via Tours & Travels"
        }
    });

    const sanitizedContent = window.DOMPurify ? DOMPurify.sanitize(blog.content || '') : escapeHTML(blog.content || '');

    container.innerHTML = `
        <article class="article-shell">
            <span class="article-back" onclick="navTo('blog')"><i class="fas fa-arrow-left"></i> All Travel Stories</span>
            <div class="article-header">
                <span class="luxury-badge" style="margin-bottom:12px;"><i class="fas fa-feather"></i> Curated Guide</span>
                <h1 style="font-size:clamp(2.2rem, 4vw, 3rem); margin-bottom:14px;">${escapeHTML(blog.title)}</h1>
                <p style="font-size:1.15rem; color:var(--text-muted); margin-bottom:20px;">${escapeHTML(blog.excerpt || '')}</p>
                <div style="display:flex; align-items:center; gap:16px; font-size:0.88rem; color:var(--text-muted);">
                    <span><i class="fas fa-user-edit"></i> Via Editorial Desk</span>
                    <span>•</span>
                    <span>${new Date(blog.created_at || Date.now()).toLocaleDateString('en-IN', { month:'long', day:'numeric', year:'numeric' })}</span>
                    <span>•</span>
                    <span>5 Min Read</span>
                </div>
            </div>

            ${buildResponsiveImgHtml({
                src: blog.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
                alt: `${blog.title} — Featured Luxury Story Banner`,
                className: 'article-hero-image',
                widths: [800, 1200, 1600],
                sizes: '100vw',
                loading: 'eager',
                fetchpriority: 'high'
            })}

            <div class="article-reading-layout">
                <aside class="article-aside">
                    <div class="article-toc">
                        <p><i class="fas fa-list-ul"></i> Article Highlights</p>
                        <a href="javascript:void(0)" onclick="document.getElementById('section-main')?.scrollIntoView({ behavior: 'smooth' })">Overview & Insights</a>
                        <a href="javascript:void(0)" onclick="document.getElementById('section-tips')?.scrollIntoView({ behavior: 'smooth' })">Specialist Advice</a>
                    </div>

                    <div style="background:var(--surface-card); border:1px solid var(--border-gold); border-radius:var(--radius-md); padding:24px; text-align:center; box-shadow:var(--shadow-md);">
                        <i class="fas fa-crown" style="font-size:2rem; color:var(--gold-500); margin-bottom:10px;"></i>
                        <h4 style="margin-bottom:8px;">Ready to Explore?</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">Let us tailor this exact journey for you.</p>
                        <button class="btn btn-gold btn-sm" style="width:100%;" onclick="navTo('plan-trip')">Plan This Trip</button>
                    </div>
                </aside>

                <div class="article-body" id="section-main">
                    ${sanitizedContent}
                    
                    <div id="section-tips" class="article-specialist-tips" style="margin-top:36px; padding:24px; background:var(--surface-soft); border-left:4px solid var(--gold-500); border-radius:var(--radius-md);">
                        <h4 style="margin-bottom:8px; color:var(--gold-500); font-family:var(--font-heading);"><i class="fas fa-lightbulb"></i> Via Travel Specialist Advice</h4>
                        <p style="font-size:0.95rem; line-height:1.7; color:var(--text-secondary); margin-bottom:12px;">Every journey we curate is fully customized to your travel rhythm, accommodation style, and pace. For bespoke arrangements, room upgrade preferences, or private chauffeured transfers, connect directly with our senior travel concierge.</p>
                        <button class="btn btn-gold btn-sm" onclick="navTo('plan-trip')"><i class="fas fa-magic"></i> Custom Quote for This Trip</button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// --- AI CONCIERGE CHAT WIDGET ---
function toggleChat() {
    const win = document.getElementById('chatWindow');
    if (!win) return;
    const isActive = win.classList.toggle('active');
    win.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    const bubble = document.querySelector('.chat-bubble');
    if (bubble) bubble.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    if (isActive) {
        const input = document.getElementById('chatInput');
        if (input) setTimeout(() => input.focus(), 80);
        announceA11y('Via Luxury Concierge desk opened.');
    } else {
        announceA11y('Via Luxury Concierge desk closed.');
    }
}

function handleChatKey(e) {
    if (e.key === 'Enter') handleChatSend();
}

function handleChatSend() {
    const input = document.getElementById('chatInput');
    const msg = input?.value.trim();
    if (!msg) return;
    input.value = '';
    processAiMessage(msg);
}

function askAiPrompt(promptText) {
    processAiMessage(promptText);
}

function processAiMessage(msg) {
    const chatBody = document.getElementById('chatBody');
    if (!chatBody) return;

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.textContent = msg;
    chatBody.appendChild(userMsg);

    // Append Animated Typing Indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-msg bot typing';
    typingIndicator.id = 'chatTypingIndicator';
    typingIndicator.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Simulate Natural AI Response
    setTimeout(() => {
        // Remove typing indicator before appending response
        const ind = document.getElementById('chatTypingIndicator');
        if (ind) ind.remove();

        let replyHtml = "";
        const m = msg.toLowerCase();

        if (m.includes('vietnam') || m.includes('hanoi') || m.includes('halong')) {
            replyHtml = `
                <div>🇻🇳 <strong>10-Day Luxury Vietnam & Halong Bay Cruise</strong></div>
                <div style="font-size:0.85rem; margin:6px 0; color:var(--text-secondary);">
                    Explore Hanoi's French Quarter, take an overnight 5★ Lan Ha Bay cruise, and stroll ancient lantern-lit Hoi An. Starting from ${formatPrice(145000)} per person.
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                    <button class="prompt-chip" onclick="toggleChat(); quickSearchDest('Vietnam');"><i class="fas fa-eye"></i> View Vietnam Tour</button>
                    <button class="prompt-chip" onclick="toggleChat(); navTo('plan-trip');"><i class="fas fa-magic"></i> Plan Bespoke Trip</button>
                </div>
            `;
        } else if (m.includes('honeymoon') || m.includes('romantic') || m.includes('couple') || m.includes('bali')) {
            replyHtml = `
                <div>💍 <strong>Romantic Escapes & Honeymoons</strong></div>
                <div style="font-size:0.85rem; margin:6px 0; color:var(--text-secondary);">
                    We recommend our <strong>Maldives Overwater Pool Sanctuary</strong> or <strong>Bali Luxe Villa Retreat</strong>. Both feature private sunset yacht charters, floating breakfasts, and couple spa rituals!
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                    <button class="prompt-chip" onclick="toggleChat(); quickSearchDest('Maldives');"><i class="fas fa-water"></i> Maldives Tour</button>
                    <button class="prompt-chip" onclick="toggleChat(); navTo('plan-trip');"><i class="fas fa-magic"></i> Custom Quote</button>
                </div>
            `;
        } else if (m.includes('maldives') || m.includes('overwater')) {
            replyHtml = `
                <div>🏝️ <strong>5★ Maldives Overwater Pool Sanctuary</strong></div>
                <div style="font-size:0.85rem; margin:6px 0; color:var(--text-secondary);">
                    Includes scenic seaplane transfers, private infinity pool villas, house-reef snorkeling, and all gourmet dining. From ${formatPrice(185000)} per person.
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                    <button class="prompt-chip" onclick="toggleChat(); quickSearchDest('Maldives');"><i class="fas fa-eye"></i> View Maldives</button>
                    <button class="prompt-chip" onclick="toggleChat(); navTo('plan-trip');"><i class="fas fa-magic"></i> Tailor My Stay</button>
                </div>
            `;
        } else if (m.includes('swiss') || m.includes('switzerland') || m.includes('alps') || m.includes('europe')) {
            replyHtml = `
                <div>🏔️ <strong>Swiss Alps & Glacier Express Grand Tour</strong></div>
                <div style="font-size:0.85rem; margin:6px 0; color:var(--text-secondary);">
                    Features 1st-class scenic panoramic rail, 5★ chalets in Zermatt and Interlaken, and Jungfraujoch Top of Europe access!
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                    <button class="prompt-chip" onclick="toggleChat(); quickSearchDest('Switzerland');"><i class="fas fa-eye"></i> View Swiss Tour</button>
                    <button class="prompt-chip" onclick="toggleChat(); navTo('plan-trip');"><i class="fas fa-magic"></i> Custom Quote</button>
                </div>
            `;
        } else if (m.includes('dubai') || m.includes('desert') || m.includes('uae')) {
            replyHtml = `
                <div>✨ <strong>Dubai Ultra Luxury & Desert Oasis</strong></div>
                <div style="font-size:0.85rem; margin:6px 0; color:var(--text-secondary);">
                    Includes Burj Al Arab suites, private Palm Jumeirah superyacht charter, and private desert oasis glamping with starlit banquet.
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                    <button class="prompt-chip" onclick="toggleChat(); quickSearchDest('Dubai');"><i class="fas fa-eye"></i> View Dubai Tour</button>
                    <button class="prompt-chip" onclick="toggleChat(); navTo('plan-trip');"><i class="fas fa-magic"></i> Custom Quote</button>
                </div>
            `;
        } else if (m.includes('cancel') || m.includes('policy') || m.includes('refund') || m.includes('flexib') || m.includes('change')) {
            replyHtml = `
                <div>🛡️ <strong>100% Flexible Booking Guarantee</strong></div>
                <div style="font-size:0.85rem; margin:6px 0; color:var(--text-secondary);">
                    Enjoy complimentary itinerary adjustments up to 21 days before departure, zero rebooking fees, and fully bonded 5★ ground operators worldwide.
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                    <button class="prompt-chip" onclick="toggleChat(); navTo('plan-trip');"><i class="fas fa-plane"></i> Plan Risk-Free</button>
                    <a class="prompt-chip" href="https://wa.me/${escapeHTML(appSettings.whatsapp)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><i class="fab fa-whatsapp"></i> Chat on WhatsApp</a>
                </div>
            `;
        } else if (m.includes('visa') || m.includes('passport')) {
            replyHtml = `
                <div>🛂 <strong>VIP Visa Assistance Desk</strong></div>
                <div style="font-size:0.85rem; margin:6px 0; color:var(--text-secondary);">
                    Via Tours provides complete visa coordination for Schengen, UK, USA, UAE, and 80+ countries. We handle all appointment slots and documentation vouchers.
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                    <button class="prompt-chip" onclick="toggleChat(); navTo('contact');"><i class="fas fa-envelope"></i> Visa Help Desk</button>
                    <a class="prompt-chip" href="https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello! I need visa assistance for my upcoming trip.')}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><i class="fab fa-whatsapp"></i> WhatsApp Specialist</a>
                </div>
            `;
        } else if (m.includes('cost') || m.includes('price') || m.includes('budget')) {
            replyHtml = `
                <div>💎 <strong>Transparent Luxury Pricing</strong></div>
                <div style="font-size:0.85rem; margin:6px 0; color:var(--text-secondary);">
                    All itineraries include 5★ stays, private transfers, and taxes with zero hidden fees. You can switch display currencies at the top right (${currentCurrency}) or request a custom itinerary for any budget.
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                    <button class="prompt-chip" onclick="toggleChat(); navTo('plan-trip');"><i class="fas fa-sliders-h"></i> Custom Itinerary</button>
                    <button class="prompt-chip" onclick="toggleChat(); navTo('packages');"><i class="fas fa-th"></i> View All Packages</button>
                </div>
            `;
        } else if (m.includes('contact') || m.includes('phone') || m.includes('call') || m.includes('specialist') || m.includes('speak')) {
            replyHtml = `
                <div>📞 <strong>Direct Senior Concierge Desk</strong></div>
                <div style="font-size:0.85rem; margin:6px 0; color:var(--text-secondary);">
                    Reach our senior travel directors at <strong>${escapeHTML(appSettings.phone)}</strong> or connect instantly via WhatsApp for 24/7 dedicated VIP assistance.
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                    <a class="prompt-chip" href="tel:${escapeHTML(appSettings.phone)}" style="text-decoration:none;"><i class="fas fa-phone-alt"></i> Call Now</a>
                    <a class="prompt-chip" href="https://wa.me/${escapeHTML(appSettings.whatsapp)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                </div>
            `;
        } else {
            replyHtml = `
                <div>I would be delighted to assist you in architecting your bespoke journey!</div>
                <div style="font-size:0.85rem; margin:6px 0; color:var(--text-secondary);">
                    You can explore our handpicked itineraries, customize a tailor-made vacation, or speak directly with our concierge desk.
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                    <button class="prompt-chip" onclick="toggleChat(); navTo('packages');"><i class="fas fa-compass"></i> Explore Packages</button>
                    <button class="prompt-chip" onclick="toggleChat(); navTo('plan-trip');"><i class="fas fa-magic"></i> Plan Bespoke Trip</button>
                    <a class="prompt-chip" href="https://wa.me/${escapeHTML(appSettings.whatsapp)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                </div>
            `;
        }

        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg bot';
        botMsg.innerHTML = replyHtml;
        chatBody.appendChild(botMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 450);
}

// --- SUPABASE STORAGE FILE UPLOAD HELPER ---
async function uploadFileToSupabase(file, folder = 'package-images') {
    if (!sb || !file) return null;
    try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${safeName}`;
        const { data, error } = await sb.storage.from(folder).upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
        });
        if (error) {
            console.warn('Storage upload error:', error);
            showToast('Storage upload notice: ' + error.message, 'error');
            return null;
        }
        const { data: { publicUrl } } = sb.storage.from(folder).getPublicUrl(fileName);
        return publicUrl;
    } catch (err) {
        console.warn('Storage upload exception:', err);
        return null;
    }
}

// Scroll progress and top button indicator (throttled with rAF & passive for 60fps performance)
let scrollRafId = null;
window.addEventListener('scroll', () => {
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        const progressBar = document.getElementById('scrollProgress');
        if (progressBar) progressBar.style.width = progress + '%';

        const btn = document.getElementById('scrollTopBtn');
        if (btn) {
            if (scrollTop > 300) btn.classList.add('show');
            else btn.classList.remove('show');
        }

        const header = document.getElementById('mainHeader');
        if (header) {
            if (scrollTop > 40) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        }
    });
}, { passive: true });

// --- LUXURY COOKIE CONSENT CONTROLLER (GDPR / DPDP) ---
function initCookieConsent() {
    const consent = localStorage.getItem('via_cookie_consent');
    if (!consent) {
        setTimeout(() => {
            const banner = document.getElementById('cookieConsentBanner');
            if (banner) {
                banner.classList.remove('cookie-banner-hiding');
                banner.style.display = 'block';
            }
        }, 1200);
    }
}

function setCookieConsent(level) {
    const payload = {
        choice: level, // 'all' or 'essential'
        timestamp: new Date().toISOString(),
        version: '2026.1'
    };
    try {
        localStorage.setItem('via_cookie_consent', JSON.stringify(payload));
    } catch (e) {
        console.warn('Could not persist cookie consent to localStorage:', e);
    }

    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
        banner.classList.add('cookie-banner-hiding');
        setTimeout(() => {
            banner.style.display = 'none';
        }, 350);
    }

    window.dispatchEvent(new CustomEvent('via:cookie_consent', { detail: payload }));
}

function openCookiePreferences() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
        banner.classList.remove('cookie-banner-hiding');
        banner.style.display = 'block';
        banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

window.initCookieConsent = initCookieConsent;
window.setCookieConsent = setCookieConsent;
window.openCookiePreferences = openCookiePreferences;

