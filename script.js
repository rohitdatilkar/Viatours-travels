/**
 * ==============================================================================
 * VIA TOURS & TRAVELS — OFFICIAL CLIENT-SIDE CONTROLLER
 * Architecture: ES6+ SPA Controller with Hybrid Offline & Backend Support
 * Features: Client-Side Hash Router, Safe Fallbacks, Bot Defense & Rate Limiter
 * ==============================================================================
 */

(function(window, document) {
    'use strict';

    // --- INITIALIZE CONFIG & CLIENTS ---
    const config = window.__VIA_CONFIG__ || {};
    const security = window.ViaSecurity || {};
    const SUPABASE_URL = config.SUPABASE_URL || window.SUPABASE_URL || 'https://goqwtovltftehautxekh.supabase.co';
    const SUPABASE_KEY = config.SUPABASE_KEY || window.SUPABASE_KEY || 'sb_publishable_bQXp8x_2x4ymx4_oxcOFUA_UTGsqF-5';

    let sb = null;
    if (security.getSupabaseClient) {
        sb = security.getSupabaseClient();
    } else if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        } catch (e) {
            console.warn('[Via] Supabase initialization failed, falling back to catalog data:', e);
        }
    }

    // --- APPLICATION STATE ---
    let appSettings = {
        name: 'Via Tours & Travels',
        email: 'reservations@viatours.com',
        conciergeEmail: 'concierge@viatours.com',
        phone: '+91 (080) 4123 7890',
        whatsapp: '918879776866',
        address: 'Prestige Meridian, Level 6, 29 MG Road, Bengaluru 560001, India'
    };
    let activeDestFilter = null;
    let currentPackage = null;
    let isDarkMode = localStorage.getItem('darkMode') === 'true';

    // Multi-Currency Engine
    const CURRENCY_CONFIG = {
        INR: { symbol: '₹', rate: 1, locale: 'en-IN' },
        USD: { symbol: '$', rate: 1 / 86.5, locale: 'en-US' },
        EUR: { symbol: '€', rate: 1 / 93.0, locale: 'de-DE' },
        AED: { symbol: 'AED ', rate: 1 / 23.55, locale: 'en-AE' }
    };
    let currentCurrency = localStorage.getItem('via_currency') || 'INR';

    // Apply dark mode preference on load
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }

    // --- UTILITIES ---
    function escapeHTML(str) {
        if (!str && str !== 0) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatPrice(amount, targetCurr = currentCurrency) {
        const num = Number(amount) || 0;
        const cfg = CURRENCY_CONFIG[targetCurr] || CURRENCY_CONFIG.INR;
        const converted = Math.round(num * cfg.rate);
        return cfg.symbol + converted.toLocaleString(cfg.locale);
    }

    function switchCurrency(code) {
        if (!CURRENCY_CONFIG[code]) return;
        currentCurrency = code;
        localStorage.setItem('via_currency', code);
        document.querySelectorAll('.currency-select').forEach(sel => sel.value = code);

        // Update all elements with data-inr-price
        document.querySelectorAll('[data-inr-price]').forEach(el => {
            const inr = el.getAttribute('data-inr-price');
            if (inr) {
                const prefix = el.getAttribute('data-price-prefix') || '';
                const suffix = el.getAttribute('data-price-suffix') || '';
                el.textContent = `${prefix}${formatPrice(inr)}${suffix}`;
            }
        });

        // If package details open, update detail pricing
        const detailPrice = document.querySelector('#pkg_details_container .price-tag');
        if (detailPrice && currentPackage && currentPackage.price) {
            detailPrice.textContent = formatPrice(currentPackage.price);
        }
    }

    function debounce(fn, delay = 350) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    function showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        // Force reflow
        void toast.offsetWidth;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 320);
        }, 3200);
    }

    function updateSEO(title, desc) {
        document.title = title ? `${title} — Via Tours & Travels` : 'Via Tours & Travels — Bespoke Luxury Escapes';
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        if (desc) metaDesc.content = desc;
    }

    // --- MOBILE MENU & NAVIGATION ---
    function toggleMenu() {
        const nav = document.getElementById('navMenu');
        const btn = document.getElementById('mobileToggle');
        if (!nav) return;
        const isActive = nav.classList.toggle('active');
        if (btn) btn.setAttribute('aria-expanded', String(isActive));
    }

    function closeMenu() {
        const nav = document.getElementById('navMenu');
        const btn = document.getElementById('mobileToggle');
        if (nav && nav.classList.contains('active')) {
            nav.classList.remove('active');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        }
    }

    // Close menu when clicking outside or pressing Escape
    document.addEventListener('click', (e) => {
        const nav = document.getElementById('navMenu');
        const toggle = document.getElementById('mobileToggle');
        if (nav && nav.classList.contains('active')) {
            if (!nav.contains(e.target) && (!toggle || !toggle.contains(e.target))) {
                closeMenu();
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
            const chat = document.getElementById('chatWindow');
            if (chat && chat.classList.contains('active')) {
                chat.classList.remove('active');
            }
        }
    });

    function toggleChat() {
        const chat = document.getElementById('chatWindow');
        if (!chat) return;
        const isActive = chat.classList.toggle('active');
        if (isActive) {
            const input = document.getElementById('chatInput');
            if (input) setTimeout(() => input.focus(), 150);
        }
    }

    // --- CLEAN URL ROUTING (HTML5 HISTORY API) ---
    function getCleanRoute() {
        // 1. Check for legacy hash route (e.g. #/packages or #/package/id)
        if (window.location.hash && window.location.hash.startsWith('#/')) {
            const hashParts = window.location.hash.replace(/^#\/?/, '').split('/');
            return {
                page: hashParts[0] || 'home',
                id: hashParts[1] || null,
                fromHash: true
            };
        }

        // 2. Parse clean pathname (e.g. /packages or /package/id)
        const cleanPath = window.location.pathname
            .replace(/^\/+/, '')
            .replace(/^index\.html\/?/, '')
            .replace(/\/+$/, '');

        if (!cleanPath) {
            return { page: 'home', id: null, fromHash: false };
        }

        const parts = cleanPath.split('/');
        return {
            page: parts[0] || 'home',
            id: parts[1] || null,
            fromHash: false
        };
    }

    function navTo(page, id = null) {
        closeMenu();
        if (page === 'admin') {
            window.location.href = 'admin.html';
            return;
        }

        const isLocalFile = window.location.protocol === 'file:';
        const cleanPage = (!page || page === 'home') ? '' : page;
        const targetPath = cleanPage ? (id ? '/' + cleanPage + '/' + id : '/' + cleanPage) : '/';

        if (!isLocalFile && window.history && window.history.pushState) {
            window.history.pushState({ page: page || 'home', id: id || null }, '', targetPath);
            router();
        } else {
            window.location.hash = '#/' + (page || 'home') + (id ? '/' + id : '');
        }
    }

    // --- HERO SEARCH BAR CONTROLLER ---
    function searchFromHero() {
        const destInput = document.getElementById('hero_dest');
        const styleSelect = document.getElementById('hero_style');
        const query = destInput ? destInput.value.trim() : '';
        const style = styleSelect ? styleSelect.value : '';

        // Navigate to packages view
        navTo('packages');

        // Apply search query and style filter after view renders
        setTimeout(() => {
            const pkgSearch = document.getElementById('pkg_search');
            const catSelect = document.getElementById('filter-category');
            if (pkgSearch && query) {
                pkgSearch.value = query;
            }
            if (catSelect && style) {
                catSelect.value = style;
            }
            loadPackages();
            const packagesSection = document.getElementById('page-packages');
            if (packagesSection) {
                packagesSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    // --- CLIENT-SIDE SINGLE PAGE ROUTER ---
    async function router() {
        const { page, id, fromHash } = getCleanRoute();

        // Redirect admin route to dedicated admin portal
        if (page === 'admin') {
            window.location.href = 'admin.html';
            return;
        }

        // If arrived via legacy hash on live web, clean the address bar seamlessly
        if (fromHash && window.location.protocol !== 'file:' && window.history && window.history.replaceState) {
            const cleanTarget = (!page || page === 'home') ? '/' : (id ? '/' + page + '/' + id : '/' + page);
            window.history.replaceState({ page, id }, '', cleanTarget);
        }

        // Hide all views
        document.querySelectorAll('.page-view').forEach(p => p.style.display = 'none');

        // Locate target view, fallback to home
        const view = document.getElementById('page-' + page) || document.getElementById('page-home');
        view.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Update active class on navigation links
        document.querySelectorAll('.nav-menu a').forEach(a => {
            const href = a.getAttribute('href') || '';
            const linkPage = href.replace(/^\/?#?\/?/, '').replace(/\/.*$/, '') || 'home';
            if (linkPage === page || (linkPage === 'home' && (!page || page === 'home'))) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });

        // Route dispatcher
        switch (page) {
            case 'home':
                loadHomeData();
                updateSEO('Bespoke Luxury Escapes', 'Curated luxury travel packages, private atolls, and 24/7 dedicated VIP concierge.');
                break;

            case 'destinations':
                loadDestinations();
                updateSEO('Iconic Destinations', 'Explore private islands in the Maldives, Swiss chalets, and sacred Bali sanctuaries.');
                break;

            case 'packages':
                activeDestFilter = id || null;
                await initPackageFilters();
                loadPackages();
                updateSEO('Curated Tour Packages', 'Hand-crafted luxury itineraries with 5-star resort privileges and private transfers.');
                break;

            case 'package':
                if (id) {
                    loadPackageDetails(id);
                } else {
                    navTo('packages');
                }
                break;

            case 'blog':
                loadBlog();
                updateSEO('Travel Journal & Guides', 'Expert luxury travel tips, packing guides, and insider resort reviews.');
                break;

            case 'blog-post':
                if (id) {
                    loadBlogPost(id);
                } else {
                    navTo('blog');
                }
                break;

            case 'plan-trip':
                setupPlanForm(id);
                updateSEO('Plan My Trip', 'Request a bespoke luxury travel quotation tailored to your exact dates and desires.');
                break;

            case 'about':
                updateSEO('About Our Agency', 'Since 2009, creating unforgettable bespoke luxury voyages across the globe.');
                break;

            case 'contact':
                updateSEO('Contact 24/7 Concierge', 'Reach our senior travel specialists via direct line, WhatsApp, or private email.');
                break;

            case 'terms':
                updateSEO('Terms & Conditions', 'Official terms and conditions for Via Tours & Travels reservations and consultations.');
                break;

            case 'privacy':
                updateSEO('Privacy Policy', 'How Via Tours & Travels protects and safeguards your personal client information.');
                break;

            default:
                // Handle unknown hash gracefully
                loadHomeData();
                updateSEO('Bespoke Luxury Escapes', 'Curated luxury travel packages and VIP concierge.');
                break;
        }
    }

    // --- DATA LOADERS (WITH RESILIENT CATALOG FALLBACKS) ---
    const DEST_STARTING_PRICES = {
        'maldives': 185000,
        'switzerland': 245000,
        'bali': 95000,
        'indonesia': 95000,
        'dubai': 145000,
        'united arab emirates': 145000,
        'uae': 145000,
        'france': 220000,
        'italy': 210000,
        'japan': 260000,
        'iceland': 230000,
        'vietnam': 50000,
        'kashmir': 45000,
        'kerala': 42000
    };

    function getDestStartingPrice(dest) {
        if (!dest) return 145000;
        if (dest.starting_price && Number(dest.starting_price) > 0) return Number(dest.starting_price);
        const nameKey = (dest.name || '').toLowerCase().trim();
        const countryKey = (dest.country || '').toLowerCase().trim();
        return DEST_STARTING_PRICES[nameKey] || DEST_STARTING_PRICES[countryKey] || 145000;
    }

    // 1. Settings & Agency Metadata
    async function loadSettings() {
        if (sb) {
            try {
                const { data } = await sb.from('website_settings').select('*').eq('id', 1).maybeSingle();
                if (data) {
                    if (data.business_name && data.business_name.trim()) appSettings.name = data.business_name.trim();
                    if (data.email && data.email.trim()) appSettings.email = data.email.trim();
                    if (data.phone && data.phone.trim()) appSettings.phone = data.phone.trim();
                    if (data.whatsapp && data.whatsapp.trim()) appSettings.whatsapp = data.whatsapp.trim();
                    if (data.address && data.address.trim()) appSettings.address = data.address.trim();
                }
            } catch (err) {
                console.warn('[Via] Using default agency contact settings.');
            }
        }

        // Update contact page elements if present
        const emailEl = document.getElementById('contact_email');
        const phoneEl = document.getElementById('contact_phone');
        const addressEl = document.getElementById('contact_address');
        if (emailEl) emailEl.textContent = appSettings.email;
        if (phoneEl) phoneEl.textContent = appSettings.phone;
        if (addressEl) addressEl.textContent = appSettings.address;
    }

    // 2. Home Page Showcase Data
    async function loadHomeData() {
        // A. Destinations
        let dests = [];
        if (sb) {
            try {
                const { data } = await sb.from('destinations').select('id, name, country, image_url').eq('is_published', true).limit(4);
                if (data && data.length) dests = data;
            } catch (e) {
                console.warn('[Via] Supabase destinations fetch warning:', e);
            }
        }
        if ((!dests || !dests.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations) {
            dests = window.LUXURY_CATALOG.destinations.slice(0, 4);
        }
        const homeDestEl = document.getElementById('home_destinations');
        if (homeDestEl) {
            homeDestEl.innerHTML = dests.length ? dests.map(d => `
                <div class="card" onclick="navTo('packages', '${escapeHTML(d.id)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter') navTo('packages', '${escapeHTML(d.id)}')">
                    <img src="${escapeHTML(d.image_url || 'assets/agency-logo-emblem.webp')}" alt="${escapeHTML(d.name)}" loading="lazy" width="400" height="220">
                    <div class="card-body">
                        <span class="tag">Bespoke Escape</span>
                        <h3>${escapeHTML(d.name)}</h3>
                        <p style="color:var(--text-muted); font-size:14px; margin-bottom:8px;"><i class="fas fa-map-marker-alt" style="color:var(--brand-orange);"></i> ${escapeHTML(d.region || d.country || '')}</p>
                        <span class="price-tag" data-inr-price="${getDestStartingPrice(d)}" data-price-prefix="From " data-price-suffix=" / person">From ${formatPrice(getDestStartingPrice(d))} / person</span>
                    </div>
                </div>
            `).join('') : '<p class="text-center" style="grid-column:1/-1;">No destinations available.</p>';
        }

        // B. Packages
        let packs = [];
        if (sb) {
            try {
                const { data } = await sb.from('packages').select('id, title, price, duration, category, image_url, destination_id, destinations(name)').eq('is_published', true).limit(3);
                if (data && data.length) packs = data;
            } catch (e) {
                console.warn('[Via] Supabase packages fetch warning:', e);
            }
        }
        if ((!packs || !packs.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) {
            packs = window.LUXURY_CATALOG.packages.slice(0, 3);
        }
        const homePackEl = document.getElementById('home_packages');
        if (homePackEl) {
            homePackEl.innerHTML = packs.length ? packs.map(p => {
                const destName = p.destinations?.name || p.destination_name || (p.dest ? p.dest.toUpperCase() : 'Iconic Destination');
                return `
                    <div class="card" onclick="navTo('package', '${escapeHTML(p.id)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter') navTo('package', '${escapeHTML(p.id)}')">
                        <img src="${escapeHTML(p.image_url || 'assets/agency-logo-emblem.webp')}" alt="${escapeHTML(p.title)}" loading="lazy" width="400" height="220">
                        <div class="card-body">
                            <span class="tag">${escapeHTML(p.category || 'Luxury')}</span>
                            <h3>${escapeHTML(p.title)}</h3>
                            <p style="color:var(--text-muted); font-size:14px;"><i class="far fa-clock" style="color:var(--brand-orange);"></i> ${escapeHTML(p.duration || 'N/A')} &bull; <i class="fas fa-map-marker-alt" style="color:var(--brand-orange);"></i> ${escapeHTML(destName)}</p>
                            <span class="price-tag" data-inr-price="${p.price}" data-price-prefix="Starting from ">Starting from ${formatPrice(p.price)}</span>
                        </div>
                    </div>
                `;
            }).join('') : '<p class="text-center" style="grid-column:1/-1;">No featured packages available.</p>';
        }

        // C. Blog Posts
        let blogs = [];
        if (sb) {
            try {
                const { data } = await sb.from('blog_posts').select('id, slug, title, excerpt, image_url, created_at').eq('is_published', true).limit(3);
                if (data && data.length) blogs = data;
            } catch (e) {
                console.warn('[Via] Supabase blogs fetch warning:', e);
            }
        }
        if ((!blogs || !blogs.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.blogs) {
            blogs = window.LUXURY_CATALOG.blogs.slice(0, 3);
        }
        const homeBlogEl = document.getElementById('home_blog');
        if (homeBlogEl) {
            homeBlogEl.innerHTML = blogs.length ? blogs.map(b => `
                <div class="card" onclick="navTo('blog-post', '${escapeHTML(b.slug || b.id)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter') navTo('blog-post', '${escapeHTML(b.slug || b.id)}')">
                    <img src="${escapeHTML(b.image_url || 'assets/agency-logo-emblem.webp')}" alt="${escapeHTML(b.title)}" loading="lazy">
                    <div class="card-body">
                        <span class="tag">${new Date(b.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <h3>${escapeHTML(b.title)}</h3>
                        <p class="blog-excerpt">${escapeHTML(b.excerpt || '')}</p>
                        <span style="color:var(--brand-orange); font-weight:700; font-size:0.9rem;">Read Guide &rarr;</span>
                    </div>
                </div>
            `).join('') : '<p class="text-center" style="grid-column:1/-1;">No stories available.</p>';
        }

        // D. Testimonials
        let tests = [];
        if (sb) {
            try {
                const { data } = await sb.from('testimonials').select('name, message, location').limit(3);
                if (data && data.length) tests = data;
            } catch (e) {
                console.warn('[Via] Supabase testimonials fetch warning:', e);
            }
        }
        if ((!tests || !tests.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.testimonials) {
            tests = window.LUXURY_CATALOG.testimonials.slice(0, 3);
        }
        const homeTestEl = document.getElementById('home_testimonials');
        if (homeTestEl) {
            homeTestEl.innerHTML = tests.length ? tests.map(t => `
                <div class="card">
                    <div class="card-body">
                        <div style="color:var(--brand-gold); margin-bottom:10px; font-size:1.1rem;">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                        </div>
                        <p style="font-style:italic; margin-bottom:14px; color:var(--text-body);">"${escapeHTML(t.message || t.quote || '')}"</p>
                        <h4 style="margin:0; color:var(--brand-navy);">${escapeHTML(t.name || 'Verified Client')}</h4>
                        <small style="color:var(--text-muted);">${escapeHTML(t.location || t.city || 'Private Guest')}</small>
                    </div>
                </div>
            `).join('') : '<p class="text-center" style="grid-column:1/-1;">No reviews available.</p>';
        }

        loadHomeFaqs();
    }

    // 3. Destinations Page
    async function loadDestinations() {
        const searchTerm = (document.getElementById('dest-search')?.value || '').toLowerCase().trim();
        const countryFilter = document.getElementById('dest-country-filter')?.value || '';
        const sortVal = document.getElementById('dest-sort')?.value || 'name_asc';

        let data = null;
        if (sb) {
            try {
                let query = sb.from('destinations').select('id, name, country, region, image_url').eq('is_published', true);
                if (countryFilter) query = query.eq('country', countryFilter);
                const res = await query;
                if (res.data && res.data.length) data = res.data;
            } catch (err) {
                console.warn('[Via] Supabase destinations fetch failed, using fallback.');
            }
        }
        if ((!data || data.length === 0) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations) {
            data = [...window.LUXURY_CATALOG.destinations];
            if (countryFilter) data = data.filter(d => d.country === countryFilter);
        }

        const listEl = document.getElementById('list_destinations');
        if (!listEl) return;

        if (!data || data.length === 0) {
            listEl.innerHTML = '<p class="text-center" style="padding:40px 0;">No destinations found matching your criteria.</p>';
            return;
        }

        let filtered = data.filter(d => {
            if (!searchTerm) return true;
            return (
                (d.name && d.name.toLowerCase().includes(searchTerm)) ||
                (d.country && d.country.toLowerCase().includes(searchTerm)) ||
                (d.region && d.region.toLowerCase().includes(searchTerm))
            );
        });

        switch (sortVal) {
            case 'name_desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'country_asc':
                filtered.sort((a, b) => (a.country || '').localeCompare(b.country || '') || a.name.localeCompare(b.name));
                break;
            default:
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        const grouped = {};
        filtered.forEach(d => {
            const c = d.country || 'International';
            if (!grouped[c]) grouped[c] = [];
            grouped[c].push(d);
        });

        let html = '';
        for (const country in grouped) {
            html += `<div class="country-group" style="margin-bottom:36px;"><h3 style="border-bottom:2px solid var(--border); padding-bottom:8px; margin-bottom:20px; color:var(--brand-navy);">${escapeHTML(country)}</h3><div class="grid-4">`;
            grouped[country].forEach(d => {
                html += `
                    <div class="card" onclick="navTo('packages', '${escapeHTML(d.id)}')" role="button" tabindex="0">
                        <img src="${escapeHTML(d.image_url || 'assets/agency-logo-emblem.webp')}" alt="${escapeHTML(d.name)}" loading="lazy">
                        <div class="card-body">
                            <h4>${escapeHTML(d.name)}</h4>
                            <p style="font-size:0.85rem; color:var(--text-muted); margin:0 0 8px;">${escapeHTML(d.region || '')}</p>
                            <span class="price-tag" data-inr-price="${getDestStartingPrice(d)}" data-price-prefix="From " data-price-suffix=" / person" style="font-size:0.88rem; display:inline-block;">From ${formatPrice(getDestStartingPrice(d))} / person</span>
                        </div>
                    </div>
                `;
            });
            html += '</div></div>';
        }
        listEl.innerHTML = html || '<p class="text-center" style="padding:40px 0;">No destinations match your search.</p>';
    }

    async function populateCountryFilter() {
        let countries = [];
        if (sb) {
            try {
                const { data } = await sb.from('destinations').select('country').eq('is_published', true);
                if (data && data.length) {
                    countries = [...new Set(data.map(d => d.country).filter(Boolean))].sort();
                }
            } catch (e) {}
        }
        if ((!countries || !countries.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations) {
            countries = [...new Set(window.LUXURY_CATALOG.destinations.map(d => d.country).filter(Boolean))].sort();
        }

        const select = document.getElementById('dest-country-filter');
        if (select && countries.length) {
            select.innerHTML = '<option value="">All Countries</option>' + countries.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
        }
    }

    const debounceDestSearch = debounce(loadDestinations, 350);

    function resetDestFilters() {
        const s = document.getElementById('dest-search');
        const c = document.getElementById('dest-country-filter');
        const o = document.getElementById('dest-sort');
        if (s) s.value = '';
        if (c) c.value = '';
        if (o) o.value = 'name_asc';
        loadDestinations();
    }

    // 4. Packages Page
    async function initPackageFilters() {
        const destSelect = document.getElementById('filter-destination');
        if (!destSelect || destSelect.options.length > 1) return;

        let destList = [];
        if (sb) {
            try {
                const { data } = await sb.from('destinations').select('id, name').eq('is_published', true).order('name');
                if (data && data.length) destList = data;
            } catch (e) {}
        }
        if ((!destList || !destList.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations) {
            destList = window.LUXURY_CATALOG.destinations.map(d => ({ id: d.id, name: d.name }));
        }

        if (destSelect && destList.length) {
            destSelect.innerHTML = '<option value="">All Destinations</option>' + destList.map(d => `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)}</option>`).join('');
            if (activeDestFilter) {
                destSelect.value = activeDestFilter;
            }
        }
    }

    function renderSkeletons(containerId = 'list_packages', count = 6) {
        const container = document.getElementById(containerId);
        if (!container) return;
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skel-card">
                    <div class="skeleton skel-img"></div>
                    <div class="skel-body">
                        <div class="skeleton skel-line" style="width:60%"></div>
                        <div class="skeleton skel-line" style="width:40%"></div>
                        <div class="skeleton skel-line" style="width:30%; height:24px; margin-top:15px;"></div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    async function loadPackages() {
        renderSkeletons('list_packages', 6);
        const term = (document.getElementById('pkg_search')?.value || '').toLowerCase().trim();
        const sortVal = document.getElementById('pkg_sort')?.value || 'new';
        const filterDest = document.getElementById('filter-destination')?.value || activeDestFilter || '';
        const filterCat = document.getElementById('filter-category')?.value || '';
        const minPrice = document.getElementById('filter-min-price')?.value;
        const maxPrice = document.getElementById('filter-max-price')?.value;

        let data = null;
        if (sb) {
            try {
                let query = sb.from('packages').select('id, title, price, duration, category, image_url, destination_id, destinations(name, country)').eq('is_published', true);
                if (filterDest) query = query.eq('destination_id', filterDest);
                if (filterCat) query = query.eq('category', filterCat);
                if (minPrice) query = query.gte('price', Number(minPrice));
                if (maxPrice) query = query.lte('price', Number(maxPrice));
                const res = await query;
                if (res.data && res.data.length) data = res.data;
            } catch (err) {
                console.warn('[Via] Supabase package query failed, using catalog fallback.');
            }
        }

        // Fallback to LUXURY_CATALOG
        if ((!data || data.length === 0) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) {
            let catPacks = [...window.LUXURY_CATALOG.packages];
            if (filterDest) {
                catPacks = catPacks.filter(p => p.destination_id === filterDest || (p.dest && p.dest.toLowerCase() === filterDest.toLowerCase()));
            }
            if (filterCat) {
                catPacks = catPacks.filter(p => p.category && p.category.toLowerCase() === filterCat.toLowerCase());
            }
            if (minPrice) {
                catPacks = catPacks.filter(p => Number(p.price) >= Number(minPrice));
            }
            if (maxPrice) {
                catPacks = catPacks.filter(p => Number(p.price) <= Number(maxPrice));
            }
            data = catPacks;
        }

        const listEl = document.getElementById('list_packages');
        if (!listEl) return;

        let filtered = (data || []).filter(p => {
            if (!term) return true;
            return (
                (p.title && p.title.toLowerCase().includes(term)) ||
                (p.duration && p.duration.toLowerCase().includes(term)) ||
                (p.category && p.category.toLowerCase().includes(term)) ||
                (p.destinations?.name && p.destinations.name.toLowerCase().includes(term)) ||
                (p.destination_name && p.destination_name.toLowerCase().includes(term))
            );
        });

        if (sortVal === 'price_asc') {
            filtered.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (sortVal === 'price_desc') {
            filtered.sort((a, b) => Number(b.price) - Number(a.price));
        }

        if (!filtered.length) {
            listEl.innerHTML = '<p class="text-center" style="grid-column:1/-1; padding:40px 0;">No luxury packages found matching your criteria. Try resetting filters.</p>';
            return;
        }

        listEl.innerHTML = filtered.map(p => {
            const destName = p.destinations?.name || p.destination_name || (p.dest ? p.dest.toUpperCase() : 'Bespoke Retreat');
            return `
                <div class="card" onclick="navTo('package', '${escapeHTML(p.id)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter') navTo('package', '${escapeHTML(p.id)}')">
                    <img src="${escapeHTML(p.image_url || 'assets/agency-logo-emblem.webp')}" alt="${escapeHTML(p.title)}" loading="lazy">
                    <div class="card-body">
                        <span class="tag">${escapeHTML(p.category || 'Luxury')}</span>
                        <h3>${escapeHTML(p.title)}</h3>
                        <p style="color:var(--text-muted); font-size:14px;"><i class="far fa-clock"></i> ${escapeHTML(p.duration || 'N/A')} &bull; <i class="fas fa-map-marker-alt"></i> ${escapeHTML(destName)}</p>
                        <span class="price-tag" data-inr-price="${p.price}" data-price-prefix="Starting from ">Starting from ${formatPrice(p.price)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    const debounceSearch = debounce(loadPackages, 350);

    function clearFilter() {
        activeDestFilter = null;
        const s = document.getElementById('pkg_search');
        const d = document.getElementById('filter-destination');
        const c = document.getElementById('filter-category');
        const minP = document.getElementById('filter-min-price');
        const maxP = document.getElementById('filter-max-price');
        const srt = document.getElementById('pkg_sort');
        if (s) s.value = '';
        if (d) d.value = '';
        if (c) c.value = '';
        if (minP) minP.value = '';
        if (maxP) maxP.value = '';
        if (srt) srt.value = 'new';
        navTo('packages');
        loadPackages();
    }

    // 5. Package Details Page
    async function loadPackageDetails(id) {
        const container = document.getElementById('pkg_details_container');
        if (!container) return;
        container.innerHTML = '<p class="text-center" style="padding:60px 0;">Loading package itinerary and details...</p>';

        let p = null;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''));
        if (sb && isUUID) {
            try {
                const res = await sb.from('packages').select('*, destinations(name, country)').eq('id', id).maybeSingle();
                if (res.data) p = res.data;
            } catch (err) {
                console.warn('[Via] Supabase package detail fetch error:', err);
            }
        }
        if (!p && window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) {
            p = window.LUXURY_CATALOG.packages.find(pkg => pkg.id === id || String(pkg.id) === String(id));
        }

        if (!p) {
            container.innerHTML = '<div class="text-center" style="padding:60px 0;"><h3>Package not found</h3><p>The requested journey may be unavailable or archived.</p><a href="/packages" onclick="navTo(\'packages\'); return false;" class="btn btn-outline" style="margin-top:16px;">View All Packages</a></div>';
            return;
        }

        currentPackage = p;
        updateSEO(p.title, p.short_description || p.description || p.overview);

        const allImages = [p.image_url, ...(p.gallery_images || [])].filter(Boolean);
        const galleryHTML = allImages.length > 0 ? `
            <img src="${escapeHTML(allImages[0])}" id="main-image" class="main-image" alt="${escapeHTML(p.title)}">
            <div class="thumbnail-container">
                ${allImages.map((img, i) => `
                    <img src="${escapeHTML(img)}" class="thumbnail ${i === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${escapeHTML(img)}')" alt="Thumbnail ${i + 1}" role="button" tabindex="0">
                `).join('')}
            </div>
        ` : '';

        const destName = p.destinations?.name || p.destination_name || (p.dest ? p.dest.toUpperCase() : 'Bespoke Retreat');

        container.innerHTML = `
            <div class="pkg-gallery">
                <div>
                    ${galleryHTML}
                    <h1>${escapeHTML(p.title)}</h1>
                    <p style="color:var(--text-muted); margin-bottom:20px; font-size:1.05rem;">
                        <i class="far fa-clock" style="color:var(--brand-orange);"></i> ${escapeHTML(p.duration || 'N/A')} &nbsp;|&nbsp;
                        <i class="fas fa-map-marker-alt" style="color:var(--brand-orange);"></i> ${escapeHTML(destName)}
                    </p>
                    <div class="info-tabs" role="tablist">
                        <button class="tab-btn active" onclick="switchTab(event, 'itinerary')" role="tab" aria-selected="true">Itinerary</button>
                        <button class="tab-btn" onclick="switchTab(event, 'inclusions')" role="tab" aria-selected="false">Inclusions</button>
                        <button class="tab-btn" onclick="switchTab(event, 'exclusions')" role="tab" aria-selected="false">Exclusions</button>
                        ${p.important_info && p.important_info.length ? '<button class="tab-btn" onclick="switchTab(event, \'important\')" role="tab" aria-selected="false">Important Info</button>' : ''}
                    </div>
                    <div id="tab-content" style="margin-top:16px;"></div>
                </div>
                <div>
                    <div style="background:var(--bg-light); border:1px solid var(--border); padding:32px 24px; border-radius:var(--radius-xl); position:sticky; top:104px; text-align:center; box-shadow:var(--shadow-md);">
                        <span style="font-size:0.85rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:700;">Starting From</span>
                        <h2 class="price-tag" data-inr-price="${p.price}" style="font-size:2.4rem; margin:6px 0 2px; color:var(--brand-navy);">${formatPrice(p.price)}</h2>
                        <p style="margin-bottom:24px; color:var(--text-muted); font-size:0.88rem;">Per person on twin sharing</p>
                        <a href="https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello Via Tours Concierge, I am interested in booking: ' + p.title)}" target="_blank" rel="noopener noreferrer" class="btn btn-green" style="width:100%; margin-bottom:12px;">
                            <i class="fab fa-whatsapp"></i> Instant WhatsApp Concierge
                        </a>
                        <button class="btn btn-primary" style="width:100%;" onclick="navTo('plan-trip', '${escapeHTML(p.id)}')">
                            <i class="fas fa-calendar-check"></i> Request Custom Quote
                        </button>
                        <div style="margin-top:20px; font-size:0.8rem; color:var(--text-muted); text-align:left; line-height:1.6;">
                            <div><i class="fas fa-shield-alt" style="color:var(--green);"></i> 100% Verified Luxury Partners</div>
                            <div style="margin-top:4px;"><i class="fas fa-file-invoice-dollar" style="color:var(--green);"></i> Transparent Pricing &bull; Itemized GST</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        renderTabContent(p, 'itinerary');
    }

    function changeMainImage(elem, url) {
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        if (elem) elem.classList.add('active');
        const mainImg = document.getElementById('main-image');
        if (mainImg) mainImg.src = url;
    }

    function switchTab(evt, tab) {
        document.querySelectorAll('.tab-btn').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        if (evt && evt.currentTarget) {
            evt.currentTarget.classList.add('active');
            evt.currentTarget.setAttribute('aria-selected', 'true');
        }
        if (currentPackage) renderTabContent(currentPackage, tab);
    }

    function renderTabContent(pkg, tab) {
        const c = document.getElementById('tab-content');
        if (!c) return;
        if (tab === 'itinerary') {
            c.innerHTML = pkg.itinerary && pkg.itinerary.length ? pkg.itinerary.map((d, idx) => `
                <div style="margin-bottom:16px; padding:18px; background:var(--bg-light); border-radius:var(--radius-md); border-left:4px solid var(--brand-orange); border:1px solid var(--border); border-left-width:4px;">
                    <div style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--brand-orange); font-weight:700;">Day ${d.day || idx + 1}</div>
                    <strong style="display:block; margin:4px 0 8px; font-size:1.1rem; color:var(--brand-navy);">${escapeHTML(d.title)}</strong>
                    <p style="white-space: pre-wrap; margin:0; font-size:0.92rem; color:var(--text-body); line-height:1.6;">${escapeHTML(d.desc || d.description || '')}</p>
                </div>
            `).join('') : '<p>Detailed itinerary provided upon concierge consultation.</p>';
        } else if (tab === 'inclusions') {
            c.innerHTML = '<ul style="list-style: disc; padding-left: 20px; margin: 0; line-height:1.8;">' +
                (pkg.inclusions && pkg.inclusions.length ? pkg.inclusions.map(i => `<li style="margin-bottom:6px;">${escapeHTML(i)}</li>`).join('') : '<li>Luxury 5-star accommodation, daily champagne breakfast, and private airport transfers included.</li>') +
                '</ul>';
        } else if (tab === 'exclusions') {
            c.innerHTML = '<ul style="list-style: disc; padding-left: 20px; margin: 0; line-height:1.8;">' +
                (pkg.exclusions && pkg.exclusions.length ? pkg.exclusions.map(i => `<li style="margin-bottom:6px;">${escapeHTML(i)}</li>`).join('') : '<li>International airfare (unless requested), personal laundry, and discretionary gratuities.</li>') +
                '</ul>';
        } else if (tab === 'important') {
            c.innerHTML = '<ul style="list-style: disc; padding-left: 20px; margin: 0; line-height:1.8;">' +
                (pkg.important_info && pkg.important_info.length ? pkg.important_info.map(i => `<li style="margin-bottom:6px;">${escapeHTML(i)}</li>`).join('') : '<li>Passport must be valid for at least 6 months from the date of return.</li>') +
                '</ul>';
        }
    }

    // 6. Plan My Trip Setup
    async function setupPlanForm(pkgId) {
        const pkgIdInput = document.getElementById('pt_pkg_id');
        const destInput = document.getElementById('pt_dest');
        if (pkgIdInput) pkgIdInput.value = '';
        if (destInput) destInput.value = '';

        if (security.recordFormStart) {
            security.recordFormStart('planTripForm');
        }

        if (pkgId) {
            let p = null;
            if (sb) {
                try {
                    const res = await sb.from('packages').select('id, title, destination_id, destinations(name)').eq('id', pkgId).maybeSingle();
                    if (res.data) p = res.data;
                } catch (e) {}
            }
            if (!p && window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) {
                p = window.LUXURY_CATALOG.packages.find(pkg => pkg.id === pkgId || String(pkg.id) === String(pkgId));
            }
            if (p) {
                if (pkgIdInput) pkgIdInput.value = p.id;
                if (destInput) destInput.value = p.destinations?.name || p.destination_name || p.title;
            }
        }
    }

    // Handle Form Submission
    const planTripForm = document.getElementById('planTripForm');
    if (planTripForm) {
        planTripForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Honeypot check
            const honeypot = document.getElementById('honeypot')?.value;
            if (honeypot) {
                showToast('Submission processed.', 'info');
                return;
            }

            // Bot & Rate Limit Defense
            if (security.checkBotSubmission) {
                const botCheck = security.checkBotSubmission('planTripForm', honeypot, 1.2);
                if (botCheck.isBot) {
                    showToast('Submission rejected.', 'error');
                    return;
                }
                if (botCheck.isRateLimited) {
                    showToast(botCheck.message || 'Too many submissions. Please wait.', 'error');
                    return;
                }
            }

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn ? submitBtn.innerHTML : 'Submit Enquiry';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing VIP Request...';
            }

            try {
                const sanitize = security.sanitizeInput || ((v) => String(v || '').trim());
                const name = sanitize(document.getElementById('pt_name')?.value);
                const email = sanitize(document.getElementById('pt_email')?.value);
                const phone = sanitize(document.getElementById('pt_phone')?.value);
                const destination = sanitize(document.getElementById('pt_dest')?.value);
                const travelDates = sanitize(document.getElementById('pt_dates')?.value);
                const travelers = sanitize(document.getElementById('pt_travelers')?.value);
                const budget = sanitize(document.getElementById('pt_budget')?.value);
                const hotelPref = sanitize(document.getElementById('pt_hotel')?.value);
                const requirements = sanitize(document.getElementById('pt_req')?.value);
                const packageId = document.getElementById('pt_pkg_id')?.value || null;

                if (!name || !email || !phone) {
                    showToast('Please provide your name, email, and phone number.', 'error');
                    return;
                }

                const payload = {
                    name,
                    email,
                    phone,
                    destination: destination || 'Bespoke Inquiry',
                    travel_dates: travelDates || 'Flexible',
                    travelers: travelers || '2',
                    budget: budget || 'On Quote',
                    hotel_pref: hotelPref || '5 Star Luxury',
                    requirements,
                    package_id: packageId,
                    status: 'New'
                };

                let submitted = false;

                // 1. Try Python FastAPI Backend if URL is available
                if (config.BACKEND_API_URL) {
                    try {
                        const apiRes = await fetch(`${config.BACKEND_API_URL}/enquiries`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        if (apiRes.ok) {
                            submitted = true;
                        }
                    } catch (apiErr) {
                        console.warn('[Via] Backend API call skipped, trying Supabase direct.', apiErr);
                    }
                }

                // 2. Direct Supabase Fallback
                if (!submitted && sb) {
                    try {
                        const { error } = await sb.from('enquiries').insert([payload]);
                        if (!error) {
                            submitted = true;
                            // Optionally register customer profile
                            try {
                                const { data: cust } = await sb.from('customers').select('id').eq('email', payload.email).maybeSingle();
                                if (!cust) {
                                    await sb.from('customers').insert([{ name: payload.name, email: payload.email, phone: payload.phone, whatsapp: payload.phone }]);
                                }
                            } catch (e) {}
                        }
                    } catch (sbErr) {
                        console.warn('[Via] Supabase insertion error:', sbErr);
                    }
                }

                // 3. Success feedback & redirection
                showToast('Thank you! Your luxury inquiry has been received. Our concierge will contact you within 2 business hours.', 'success');
                planTripForm.reset();
                if (security.resetFormTimer) security.resetFormTimer('planTripForm');
                setTimeout(() => navTo('home'), 1800);

            } catch (err) {
                console.error('[Via] Enquiry error:', err);
                showToast('Error processing request. Please connect directly via WhatsApp.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHTML;
                }
            }
        });
    }

    // 7. Travel Blog
    async function loadBlog() {
        const listEl = document.getElementById('list_blog');
        if (!listEl) return;

        let blogs = [];
        if (sb) {
            try {
                const { data } = await sb.from('blog_posts').select('id, slug, title, excerpt, image_url, created_at').eq('is_published', true).order('created_at', { ascending: false });
                if (data && data.length) blogs = data;
            } catch (e) {}
        }
        if ((!blogs || !blogs.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.blogs) {
            blogs = window.LUXURY_CATALOG.blogs;
        }

        if (!blogs.length) {
            listEl.innerHTML = '<p class="text-center" style="grid-column:1/-1;">No journal articles published yet.</p>';
            return;
        }

        listEl.innerHTML = blogs.map(b => `
            <div class="card" onclick="navTo('blog-post', '${escapeHTML(b.slug || b.id)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter') navTo('blog-post', '${escapeHTML(b.slug || b.id)}')">
                <img src="${escapeHTML(b.image_url || 'assets/agency-logo-emblem.webp')}" alt="${escapeHTML(b.title)}" loading="lazy">
                <div class="card-body">
                    <span class="tag">${new Date(b.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <h3>${escapeHTML(b.title)}</h3>
                    <p class="blog-excerpt">${escapeHTML(b.excerpt || '')}</p>
                    <span style="color:var(--brand-orange); font-weight:700;">Read Complete Story &rarr;</span>
                </div>
            </div>
        `).join('');
    }

    async function loadBlogPost(slugOrId) {
        const container = document.getElementById('blog_details_container');
        if (!container) return;
        container.innerHTML = '<p class="text-center" style="padding:40px 0;">Loading article...</p>';

        let b = null;
        if (sb) {
            try {
                const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slugOrId);
                let query = sb.from('blog_posts').select('*').eq('is_published', true);
                if (isUUID) query = query.eq('id', slugOrId);
                else query = query.eq('slug', slugOrId);
                const res = await query.limit(1).maybeSingle();
                if (res.data) b = res.data;
            } catch (e) {}
        }
        if (!b && window.LUXURY_CATALOG && window.LUXURY_CATALOG.blogs) {
            b = window.LUXURY_CATALOG.blogs.find(post => post.slug === slugOrId || post.id === slugOrId);
        }

        if (!b) {
            container.innerHTML = `
                <div class="text-center" style="padding:60px 0;">
                    <h3>Article Not Found</h3>
                    <p>The requested journal story could not be found.</p>
                    <button class="btn btn-outline" onclick="navTo('blog')"><i class="fas fa-arrow-left"></i> Back to Journal</button>
                </div>
            `;
            return;
        }

        updateSEO(b.title, b.excerpt || 'Via Tours & Travels Travel Journal');

        const cleanHTML = window.DOMPurify ? window.DOMPurify.sanitize(b.content || '') : escapeHTML(b.content || '');

        container.innerHTML = `
            <img src="${escapeHTML(b.image_url || 'assets/agency-logo-emblem.webp')}" style="width:100%; height:420px; object-fit:cover; border-radius:var(--radius-xl); margin-bottom:28px;" alt="${escapeHTML(b.title)}">
            <span class="tag">${new Date(b.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <h1 style="margin:12px 0 24px; color:var(--brand-navy); font-size:clamp(1.8rem, 4vw, 2.6rem);">${escapeHTML(b.title)}</h1>
            <div class="blog-body" style="line-height:1.8; color:var(--text-body); font-size:1.05rem;">
                ${cleanHTML}
            </div>
            <div style="margin-top:48px; border-top:1px solid var(--border); padding-top:28px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                <button class="btn btn-outline" onclick="navTo('blog')"><i class="fas fa-arrow-left"></i> Back to All Guides</button>
                <button class="btn btn-primary" onclick="navTo('plan-trip')">Plan Trip Inspired by This Story</button>
            </div>
        `;
    }

    // 8. FAQs & Accordion
    async function loadHomeFaqs() {
        const faqContainer = document.getElementById('home_faqs');
        if (!faqContainer) return;

        let faqs = [];
        if (sb) {
            try {
                const res = await sb.from('faqs').select('id, question, answer').eq('is_published', true).order('created_at', { ascending: true });
                if (res.data && res.data.length) faqs = res.data;
            } catch (e) {}
        }
        if ((!faqs || !faqs.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.faqs) {
            faqs = window.LUXURY_CATALOG.faqs;
        }

        if (!faqs.length) {
            faqContainer.innerHTML = '<p class="text-center">No FAQs available.</p>';
            return;
        }

        faqContainer.innerHTML = faqs.map((f, i) => `
            <div class="faq-item" id="faq-item-${i}">
                <div class="faq-question" onclick="toggleFaq(${i})" role="button" tabindex="0" onkeydown="if(event.key==='Enter') toggleFaq(${i})">
                    <span>${escapeHTML(f.question)}</span>
                    <i class="fas fa-chevron-down" id="faq-icon-${i}"></i>
                </div>
                <div class="faq-answer" id="faq-answer-${i}">
                    <p style="white-space:pre-wrap; margin:0;">${escapeHTML(f.answer || '')}</p>
                </div>
            </div>
        `).join('');
    }

    function toggleFaq(index) {
        const item = document.getElementById('faq-item-' + index);
        const answer = document.getElementById('faq-answer-' + index);
        const icon = document.getElementById('faq-icon-' + index);
        if (!item || !answer) return;

        const isCurrentlyOpen = answer.style.display === 'block';
        if (isCurrentlyOpen) {
            answer.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(0deg)';
            item.classList.remove('active');
        } else {
            answer.style.display = 'block';
            if (icon) icon.style.transform = 'rotate(180deg)';
            item.classList.add('active');
        }
    }

    // 9. AI Concierge Chatbot
    function sendQuickPrompt(promptText) {
        const input = document.getElementById('chatInput');
        if (input) {
            input.value = promptText;
            handleChat({ type: 'keypress', key: 'Enter' });
        }
    }

    function handleChat(e) {
        if (e.type === 'keypress' && e.key !== 'Enter') return;
        const input = document.getElementById('chatInput');
        if (!input) return;
        const msg = input.value.trim();
        if (!msg) return;

        const chatBody = document.getElementById('chatBody');
        if (!chatBody) return;

        // Append User Message
        const userDiv = document.createElement('div');
        userDiv.className = 'chat-msg user';
        userDiv.textContent = msg;
        chatBody.appendChild(userDiv);
        input.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        // Generate Context-Aware Luxury Concierge Response
        setTimeout(() => {
            const m = msg.toLowerCase();
            let res = "I am at your service. Would you like to explore bespoke private itineraries for the Maldives, Swiss Alps, Bali, Amalfi Coast, or Dubai?";

            if (m.includes('maldives') || m.includes('atoll') || m.includes('overwater')) {
                res = "Our 5★ Maldives Overwater Sanctuary features a private pool villa, roundtrip scenic seaplane transfers, gourmet all-inclusive dining, and a sunset dolphin yacht cruise (from " + formatPrice(185000) + "/person). Would you like to view the itinerary or customize your travel dates?";
            } else if (m.includes('swiss') || m.includes('switzerland') || m.includes('alps') || m.includes('zermatt')) {
                res = "Our Grand Swiss Alpine Odyssey includes 1st-Class Glacier Express panoramic rail, 5★ Matterhorn-facing chalets in Zermatt, and Jungfraujoch summit access (from " + formatPrice(245000) + "/person).";
            } else if (m.includes('bali') || m.includes('ubud') || m.includes('indonesia')) {
                res = "Our Bali Sanctuary features private rainforest pool villas in Ubud, private chauffeur, and cliffside sunsets in Uluwatu (from " + formatPrice(95000) + "/person).";
            } else if (m.includes('amalfi') || m.includes('capri') || m.includes('italy')) {
                res = "Our Amalfi Coast & Capri Odyssey features cliffside 5★ suites in Positano, a private skippered Riva yacht to Capri & the Blue Grotto, and Michelin dining (from " + formatPrice(295000) + "/person).";
            } else if (m.includes('dubai') || m.includes('emirates') || m.includes('burj')) {
                res = "Our Dubai Ultra-Luxury showcases 7★ Burj Al Arab hospitality, private desert oasis glamping, and private yacht charters around Palm Jumeirah (from " + formatPrice(145000) + "/person).";
            } else if (m.includes('visa') || m.includes('passport')) {
                res = "Via Tours provides 100% white-glove visa concierge assistance for Schengen (Europe), UK, USA, UAE, Vietnam, Singapore, and 80+ destinations. We handle paperwork preparation, appointment scheduling, and itinerary vouchers.";
            } else if (m.includes('whatsapp') || m.includes('senior') || m.includes('advisor') || m.includes('call') || m.includes('connect')) {
                res = `You can connect directly with our Senior Travel Specialist on our 24/7 dedicated WhatsApp line: +91 88797 76866 or by calling ${appSettings.phone}.`;
            } else if (m.includes('book') || m.includes('plan') || m.includes('quote') || m.includes('custom') || m.includes('enquiry')) {
                res = "You can submit an inquiry anytime via 'Plan My Trip' for an itemized quotation, or message our VIP Concierge on WhatsApp at +91 88797 76866!";
            } else if (m.includes('price') || m.includes('cost') || m.includes('currency') || m.includes('tax') || m.includes('gst')) {
                res = "All prices are itemized with statutory 5% GST and no hidden charges. You can also switch between INR (₹), USD ($), EUR (€), and AED (AED) using the currency selector in the header.";
            } else if (m.includes('contact') || m.includes('phone') || m.includes('office') || m.includes('address')) {
                res = `Our flagship concierge is located at ${appSettings.address}. Reach us directly at ${appSettings.phone} or ${appSettings.email}.`;
            } else if (m.includes('hi') || m.includes('hello') || m.includes('hey')) {
                res = "Greetings! Welcome to Via Tours & Travels. Which dream destination may I help you curate today?";
            }

            const botDiv = document.createElement('div');
            botDiv.className = 'chat-msg bot';
            botDiv.innerHTML = escapeHTML(res).replace(/(\+91 88797 76866)/g, '<a href="https://wa.me/918879776866" target="_blank" rel="noopener noreferrer" style="color:var(--brand-orange); text-decoration:underline;">$1</a>');
            chatBody.appendChild(botDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 400);
    }

    // --- SCROLL PROGRESS & SCROLL-TO-TOP OBSERVER ---
    window.addEventListener('scroll', () => {
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
    }, { passive: true });

    // --- PRELOADER LIFECYCLE ---
    function dismissPreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader && !preloader.classList.contains('hidden')) {
            preloader.classList.add('hidden');
        }
    }

    window.addEventListener('load', () => {
        setTimeout(dismissPreloader, 600);
    });

    // Safety timeout in case load event already fired or slow assets
    setTimeout(dismissPreloader, 3000);

    // --- INITIALIZE APPLICATION ---
    window.addEventListener('popstate', router);
    window.addEventListener('hashchange', router);
    window.addEventListener('DOMContentLoaded', () => {
        loadSettings();
        populateCountryFilter();
        // Sync currency selector with stored preference
        if (currentCurrency) {
            document.querySelectorAll('.currency-select').forEach(sel => sel.value = currentCurrency);
        }
        router();
    });

    // Expose necessary global functions for HTML inline triggers
    window.navTo = navTo;
    window.toggleMenu = toggleMenu;
    window.toggleChat = toggleChat;
    window.searchFromHero = searchFromHero;
    window.debounceSearch = debounceSearch;
    window.debounceDestSearch = debounceDestSearch;
    window.loadDestinations = loadDestinations;
    window.loadPackages = loadPackages;
    window.resetDestFilters = resetDestFilters;
    window.clearFilter = clearFilter;
    window.changeMainImage = changeMainImage;
    window.switchTab = switchTab;
    window.toggleFaq = toggleFaq;
    window.handleChat = handleChat;
    window.switchCurrency = switchCurrency;
    window.sendQuickPrompt = sendQuickPrompt;

})(window, document);
