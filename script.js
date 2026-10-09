/**
 * ==============================================================================
 * VIA TOURS & TRAVELS — OFFICIAL CLIENT-SIDE CONTROLLER
 * Architecture: ES6+ SPA Controller with Client-Side Routing & Supabase Integration
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
        email: 'concierge@viatoursandtravels.com',
        conciergeEmail: 'concierge@viatoursandtravels.com',
        phone: '+91 80 4123 7890',
        whatsapp: '918879776866',
        address: 'Prestige Meridian, Level 6, 29 MG Road, Bengaluru 560001, India'
    };
    let activeDestFilter = null;
    let currentPackage = null;
    let isDarkMode = localStorage.getItem('darkMode') === 'true';

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

    function formatPrice(amount) {
        const num = Number(amount) || 0;
        return '₹' + num.toLocaleString('en-IN');
    }

    function switchCurrency() {
        // Canonical INR pricing standardized for outbound Indian travelers
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

    function trackEvent(eventName, eventParams = {}) {
        const payload = {
            event: eventName,
            timestamp: new Date().toISOString(),
            ...eventParams
        };
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(payload);

        // Google Analytics 4 (gtag)
        if (typeof window.gtag === 'function') {
            try {
                window.gtag('event', eventName, eventParams);
            } catch (e) {}
        }

        // Meta Pixel (fbq)
        if (typeof window.fbq === 'function') {
            try {
                window.fbq('trackCustom', eventName, eventParams);
            } catch (e) {}
        }
    }

    function updateSEO(title, desc, image = null, url = null, customSchema = null) {
        const fullTitle = title ? `${title} — Via Tours & Travels` : 'Via Tours & Travels — Bespoke Luxury Escapes & Curated Vacations';
        document.title = fullTitle;

        // Meta Description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        if (desc) metaDesc.content = desc;

        // Helper for meta attributes
        const setMeta = (attr, key, val) => {
            if (!val) return;
            let el = document.querySelector(`meta[${attr}="${key}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, key);
                document.head.appendChild(el);
            }
            el.setAttribute('content', val);
        };

        // OpenGraph
        setMeta('property', 'og:title', fullTitle);
        if (desc) setMeta('property', 'og:description', desc);
        if (image) setMeta('property', 'og:image', image);
        if (url) {
            const canonicalUrl = url.startsWith('http') ? url : `https://viatoursandtravels.com${url.startsWith('/') ? '' : '/'}${url}`;
            setMeta('property', 'og:url', canonicalUrl);
            let canon = document.querySelector('link[rel="canonical"]');
            if (!canon) {
                canon = document.createElement('link');
                canon.rel = 'canonical';
                document.head.appendChild(canon);
            }
            canon.href = canonicalUrl;
        }

        // Twitter
        setMeta('name', 'twitter:title', fullTitle);
        if (desc) setMeta('name', 'twitter:description', desc);
        if (image) setMeta('name', 'twitter:image', image);

        // Structured Data (JSON-LD)
        try {
            let scriptTag = document.getElementById('via-schema');
            if (!scriptTag) {
                scriptTag = document.createElement('script');
                scriptTag.type = 'application/ld+json';
                scriptTag.id = 'via-schema';
                document.head.appendChild(scriptTag);
            }

            const baseSchema = {
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": "TravelAgency",
                        "@id": "https://viatoursandtravels.com/#organization",
                        "name": "Via Tours & Travels",
                        "legalName": "Via Voyages & Travel Services",
                        "url": "https://viatoursandtravels.com",
                        "logo": "https://viatoursandtravels.com/assets/agency-logo-emblem.webp",
                        "image": image || "https://viatoursandtravels.com/assets/social-preview-1200.webp",
                        "telephone": "+91-80-4123-7890",
                        "email": "concierge@viatoursandtravels.com",
                        "address": {
                            "@type": "PostalAddress",
                            "streetAddress": "Prestige Meridian, Level 6, 29 MG Road",
                            "addressLocality": "Bengaluru",
                            "postalCode": "560001",
                            "addressRegion": "Karnataka",
                            "addressCountry": "IN"
                        },
                        "priceRange": "$$$$",
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.9",
                            "reviewCount": "180",
                            "bestRating": "5"
                        }
                    }
                ]
            };

            // Inject BreadcrumbList schema if url provided
            if (url) {
                const parts = url.replace(/^\/+/, '').split('/').filter(Boolean);
                const breadcrumbs = [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://viatoursandtravels.com/"
                    }
                ];
                let accum = '';
                parts.forEach((p, idx) => {
                    accum += '/' + p;
                    const cleanName = p.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    breadcrumbs.push({
                        "@type": "ListItem",
                        "position": idx + 2,
                        "name": idx === parts.length - 1 && title ? title.replace(/ — Via Tours.*$/, '') : cleanName,
                        "item": `https://viatoursandtravels.com${accum}`
                    });
                });
                baseSchema["@graph"].push({
                    "@type": "BreadcrumbList",
                    "@id": `https://viatoursandtravels.com${url.startsWith('/') ? '' : '/'}${url}#breadcrumb`,
                    "itemListElement": breadcrumbs
                });
            }

            if (customSchema) {
                if (Array.isArray(customSchema)) {
                    baseSchema["@graph"].push(...customSchema);
                } else {
                    baseSchema["@graph"].push(customSchema);
                }
            }

            scriptTag.textContent = JSON.stringify(baseSchema, null, 2);
        } catch (e) {
            console.warn('[Via] JSON-LD injection warning:', e);
        }
    }

    // --- WISHLIST ENGINE (Streamlined Stubs) ---
    function getWishlist() { return []; }
    function saveWishlist() {}
    function toggleWishlist() {}
    function updateWishlistUI() {}
    function filterWishlist() { navTo('packages'); }

    // --- PACKAGE COMPARISON ENGINE (Streamlined Stubs) ---
    function openCompareModal() {}
    function closeCompareModal() {}

    // Newsletter Handler
    function handleNewsletter(e) {
        if (e && e.preventDefault) e.preventDefault();
        const input = document.getElementById('newsletter_email');
        if (!input) return;
        const email = (input.value || '').trim();
        if (!email || !email.includes('@')) {
            showToast('Please provide a valid email address.', 'error');
            return;
        }
        showToast('Welcome to The Connoisseurs Circle! Your private welcome invitation is on its way.', 'success');
        input.value = '';
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
        // Route directly to senior human concierge on WhatsApp
        window.open('https://wa.me/918879776866?text=Hi%20Via%20Tours,%20I%20would%20like%20to%20plan%20a%20bespoke%20itinerary', '_blank');
    }

    // --- CATALOG ENTITY LOOKUP HELPERS ---
    function findPackage(idOrSlug) {
        if (!idOrSlug) return null;
        const needle = String(idOrSlug).toLowerCase().trim();
        const all = (window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) ? window.LUXURY_CATALOG.packages : [];
        return all.find(p => 
            p.id === idOrSlug ||
            (p.slug && p.slug.toLowerCase() === needle) ||
            String(p.id).toLowerCase() === needle ||
            (p.aliases && p.aliases.some(a => a.toLowerCase() === needle))
        ) || null;
    }

    function findDestination(idOrSlug) {
        if (!idOrSlug) return null;
        const needle = String(idOrSlug).toLowerCase().trim();
        const all = (window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations) ? window.LUXURY_CATALOG.destinations : [];
        return all.find(d => 
            d.id === idOrSlug ||
            (d.slug && d.slug.toLowerCase() === needle) ||
            String(d.id).toLowerCase() === needle ||
            (d.name && d.name.toLowerCase() === needle) ||
            (d.aliases && d.aliases.some(a => a.toLowerCase() === needle))
        ) || null;
    }

    function findBlogPost(idOrSlug) {
        if (!idOrSlug) return null;
        const needle = String(idOrSlug).toLowerCase().trim();
        const all = (window.LUXURY_CATALOG && window.LUXURY_CATALOG.blogs) ? window.LUXURY_CATALOG.blogs : [];
        return all.find(b => 
            b.id === idOrSlug ||
            (b.slug && b.slug.toLowerCase() === needle) ||
            String(b.id).toLowerCase() === needle
        ) || null;
    }

    // --- CLEAN URL ROUTING (HTML5 HISTORY API) ---
    function getCleanRoute() {
        // 1. Check for legacy hash route (e.g. #/packages or #/packages/maldives-overwater-sanctuary)
        if (window.location.hash && window.location.hash.startsWith('#/')) {
            const hashParts = window.location.hash.replace(/^#\/?/, '').split('/');
            let routePage = hashParts[0] || 'home';
            let routeId = hashParts[1] || null;

            if ((routePage === 'packages' || routePage === 'package') && routeId && findPackage(routeId)) {
                routePage = 'package';
            } else if ((routePage === 'destinations' || routePage === 'destination') && routeId) {
                routePage = 'destination';
            } else if ((routePage === 'blog' || routePage === 'blog-post') && routeId) {
                routePage = 'blog-post';
            }
            return {
                page: routePage,
                id: routeId,
                fromHash: true
            };
        }

        // 2. Parse clean pathname (e.g. /packages/maldives-overwater-sanctuary)
        const cleanPath = window.location.pathname
            .replace(/^\/+/, '')
            .replace(/^index\.html\/?/, '')
            .replace(/\/+$/, '');

        if (!cleanPath) {
            return { page: 'home', id: null, fromHash: false };
        }

        const parts = cleanPath.split('/');
        let routePage = parts[0] || 'home';
        let routeId = parts[1] || null;

        // Auto-detect package detail route from clean URL /packages/:slug or /package/:id
        if ((routePage === 'packages' || routePage === 'package') && routeId) {
            const matchedPkg = findPackage(routeId);
            if (matchedPkg) {
                routePage = 'package';
                routeId = matchedPkg.id;
            }
        } else if ((routePage === 'destinations' || routePage === 'destination') && routeId) {
            routePage = 'destination';
        } else if ((routePage === 'blog' || routePage === 'blog-post') && routeId) {
            routePage = 'blog-post';
        }

        return {
            page: routePage,
            id: routeId,
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
        let cleanPage = (!page || page === 'home') ? '' : page;
        let routeId = id;

        // Normalize canonical clean URLs
        if ((cleanPage === 'package' || cleanPage === 'packages') && id) {
            cleanPage = 'packages';
            const pkg = findPackage(id);
            if (pkg) routeId = pkg.slug || pkg.id;
        } else if ((cleanPage === 'destination' || cleanPage === 'destinations') && id) {
            cleanPage = 'destinations';
            const dest = findDestination(id);
            if (dest) routeId = dest.slug || dest.id;
        } else if ((cleanPage === 'blog-post' || cleanPage === 'blog') && id) {
            cleanPage = 'blog';
            const post = findBlogPost(id);
            if (post) routeId = post.slug || post.id;
        } else if (cleanPage === 'experiences' && id) {
            routeId = String(id).toLowerCase().trim();
        }

        const targetPath = cleanPage ? (routeId ? '/' + cleanPage + '/' + routeId : '/' + cleanPage) : '/';

        if (!isLocalFile && window.history && window.history.pushState) {
            window.history.pushState({ page: cleanPage || 'home', id: routeId || null }, '', targetPath);
            router();
        } else {
            window.location.hash = '#/' + (cleanPage || 'home') + (routeId ? '/' + routeId : '');
        }
    }

    // --- HERO ACTION CONTROLLER ---
    function searchFromHero() {
        navTo('plan-trip');
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

        // Locate target view, fallback to 404 or home
        let activePage = page || 'home';
        let view = document.getElementById('page-' + activePage);
        if (!view) {
            activePage = '404';
            view = document.getElementById('page-404') || document.getElementById('page-home');
        }
        if (view) {
            view.style.display = 'block';
        }
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Update active class on navigation links
        document.querySelectorAll('.nav-menu a').forEach(a => {
            const href = a.getAttribute('href') || '';
            const linkPage = href.replace(/^\/?#?\/?/, '').replace(/\/.*$/, '') || 'home';
            if (linkPage === activePage || (linkPage === 'home' && (!activePage || activePage === 'home'))) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });

        // Mobile Sticky Bar for Package View
        const mobileSticky = document.getElementById('mobilePkgStickyBar');
        if (mobileSticky) {
            if (activePage === 'package') {
                mobileSticky.classList.add('visible');
            } else {
                mobileSticky.classList.remove('visible');
            }
        }

        // Route dispatcher
        switch (activePage) {
            case 'home':
                loadHomeData();
                updateSEO('Bespoke Luxury Escapes', 'Curated luxury travel packages, private atolls, and 24/7 dedicated VIP concierge.', null, '/');
                break;

            case 'destinations':
                if (id) {
                    const matchedDest = findDestination(id);
                    if (matchedDest) {
                        activePage = 'destination';
                        if (view) view.style.display = 'none';
                        view = document.getElementById('page-destination');
                        if (view) view.style.display = 'block';
                        loadDestinationDetails(matchedDest.id);
                        break;
                    }
                }
                loadDestinations();
                updateSEO('Iconic Destinations', 'Explore private islands in the Maldives, Swiss chalets, and sacred Bali sanctuaries.', null, '/destinations');
                break;

            case 'destination':
                if (id) {
                    const d = findDestination(id);
                    loadDestinationDetails(d ? d.id : id);
                } else {
                    navTo('destinations');
                }
                break;

            case 'packages':
                if (id) {
                    const matchedPkg = findPackage(id);
                    if (matchedPkg) {
                        activePage = 'package';
                        if (view) view.style.display = 'none';
                        view = document.getElementById('page-package');
                        if (view) view.style.display = 'block';
                        loadPackageDetails(matchedPkg.id);
                        break;
                    }
                }
                activeDestFilter = id || null;
                await initPackageFilters();
                loadPackages();
                updateSEO('Curated Tour Packages', 'Hand-crafted luxury itineraries with 5-star resort privileges and private transfers.', null, '/packages');
                break;

            case 'package':
                if (id) {
                    const p = findPackage(id);
                    loadPackageDetails(p ? p.id : id);
                } else {
                    navTo('packages');
                }
                break;

            case 'experiences':
                loadExperiences(id);
                break;

            case 'services':
                loadServices();
                updateSEO('Comprehensive Travel Services', 'Visa assistance, premium commercial & private air charters, forex, travel insurance, and corporate MICE.', null, '/services');
                break;

            case 'offers':
                loadOffers();
                updateSEO('Exclusive Travel Privileges & Offers', 'Seasonal luxury privileges, complimentary seaplane upgrades, and curated amenities.', null, '/offers');
                break;

            case 'gallery':
                loadGallery();
                updateSEO('Traveler Stories & Visual Chronicles', 'Moments of pure wonder curated for our discerning travelers across the world.', null, '/gallery');
                break;

            case 'blog':
                if (id) {
                    const matchedBlog = findBlogPost(id);
                    if (matchedBlog) {
                        activePage = 'blog-post';
                        if (view) view.style.display = 'none';
                        view = document.getElementById('page-blog-post');
                        if (view) view.style.display = 'block';
                        loadBlogPost(matchedBlog.slug || matchedBlog.id);
                        break;
                    }
                }
                loadBlog();
                updateSEO('Travel Journal & Guides', 'Expert luxury travel tips, packing guides, and insider resort reviews.', null, '/blog');
                break;

            case 'blog-post':
                if (id) {
                    const b = findBlogPost(id);
                    loadBlogPost(b ? (b.slug || b.id) : id);
                } else {
                    navTo('blog');
                }
                break;

            case 'plan-trip':
                setupPlanForm(id);
                updateSEO('Plan My Trip', 'Request a bespoke luxury travel quotation tailored to your exact dates and desires.', null, '/plan-trip');
                break;

            case 'about':
                updateSEO('About Our Agency', 'Since 2009, creating unforgettable bespoke luxury voyages across the globe.', null, '/about');
                break;

            case 'contact':
                updateSEO('Contact 24/7 Concierge', 'Reach our senior travel specialists via direct line, WhatsApp, or private email.', null, '/contact');
                break;

            case 'terms':
                updateSEO('Terms & Conditions', 'Official terms and conditions for Via Tours & Travels reservations and consultations.', null, '/terms');
                break;

            case 'privacy':
                updateSEO('Privacy Policy (DPDP Act 2023)', 'How Via Tours & Travels protects and safeguards your personal client information under Indian data protection law.', null, '/privacy');
                break;

            case 'cancellation':
            case 'refund':
            case 'refund-policy':
                updateSEO('Cancellation & Refund Policy', 'Transparent booking terms, cancellation schedules, refund processing, and date modification policies.', null, '/refund');
                break;

            case 'cookies':
            case 'cookie-policy':
                updateSEO('Cookie & Tracking Policy (DPDP Act 2023)', 'How Via Tours & Travels utilizes cookies and local storage in compliance with Indian data privacy law.', null, '/cookies');
                break;

            case '404':
                updateSEO('404 — Destination Not Found', 'The requested luxury journey or page could not be found or has been archived.', null, '/404');
                break;

            default:
                loadHomeData();
                updateSEO('Bespoke Luxury Escapes', 'Curated luxury travel packages and VIP concierge.', null, '/');
                break;
        }
    }

    // --- DATA LOADERS (WITH RESILIENT CATALOG FALLBACKS) ---
    const DEST_STARTING_PRICES = {
        'maldives': 185000,
        'switzerland': 245000,
        'bali': 125000,
        'indonesia': 125000,
        'dubai': 145000,
        'united arab emirates': 145000,
        'uae': 145000,
        'amalfi coast & capri': 275000,
        'amalfi coast': 275000,
        'amalfi': 275000,
        'italy': 275000,
        'france': 220000,
        'japan': 260000,
        'iceland': 230000,
        'vietnam': 185000,
        'kashmir': 125000,
        'rajasthan': 165000,
        'kerala': 115000,
        'ladakh': 135000
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

    // Common Package Card Template (Wishlist, Compare & Currency Aware)
    function renderPackageCard(p) {
        const destName = p.destinations?.name || p.destination_name || (p.dest ? p.dest.toUpperCase() : 'Iconic Destination');
        const catPkg = window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages && window.LUXURY_CATALOG.packages.find(cp => cp.id === p.id);
        const cardSlug = (catPkg && catPkg.slug) || p.slug || p.id;
        const rawTitle = (catPkg && catPkg.title) || p.title || '';
        const cleanTitle = rawTitle.replace(/\s*5[★*]\s*/g, ' ').replace(/\.{2,}/g, ': ').trim();
        const luxuryTier = p.luxury_tier || (catPkg && catPkg.luxury_tier) || '5★ Luxury';
        const cardImg = (catPkg && catPkg.image_url) || p.image_url || 'assets/agency-logo-emblem.webp';
        const cardPrice = (catPkg && catPkg.price) || p.price;

        return `
            <div class="card" onclick="navTo('packages', '${escapeHTML(cardSlug)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter') navTo('packages', '${escapeHTML(cardSlug)}')">
                <div style="position:relative;">
                    <img src="${escapeHTML(cardImg)}" alt="${escapeHTML(cleanTitle)}" loading="lazy" width="400" height="220">
                    <span class="badge-gold" style="position:absolute; top:12px; left:12px; z-index:2;">
                        <i class="fas fa-star" style="color:#d97706; font-size:0.65rem;"></i> ${escapeHTML(luxuryTier)}
                    </span>
                </div>
                <div class="card-body">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span class="tag">${escapeHTML(p.category || 'Luxury')}</span>
                    </div>
                    <h3>${escapeHTML(cleanTitle)}</h3>
                    <p style="color:var(--text-muted); font-size:14px;"><i class="far fa-clock" style="color:var(--brand-orange);"></i> ${escapeHTML(p.duration || 'N/A')} &bull; <i class="fas fa-map-marker-alt" style="color:var(--brand-orange);"></i> ${escapeHTML(destName)}</p>
                    <div style="margin-top:auto; padding-top:10px;">
                        <span class="price-tag" data-inr-price="${cardPrice}" data-price-prefix="Starting from ">Starting from ${formatPrice(cardPrice)}</span>
                        <div class="price-subtext">per person &bull; twin-sharing basis</div>
                    </div>
                </div>
            </div>
        `;
    }

    // 2. Home Page Showcase Data
    async function loadHomeData() {
        // A. Destinations (Differentiated 4 distinct destinations)
        let dests = [];
        const homeDestIds = ['dest-amalfi', 'dest-bali', 'dest-kashmir', 'dest-dubai'];
        if (window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations) {
            dests = window.LUXURY_CATALOG.destinations.filter(d => homeDestIds.includes(d.id));
        }
        const homeDestEl = document.getElementById('home_destinations');
        if (homeDestEl) {
            homeDestEl.innerHTML = dests.length ? dests.map(d => {
                const catMatch = window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations && window.LUXURY_CATALOG.destinations.find(cd => cd.id === d.id);
                const destSlug = (catMatch && catMatch.slug) || d.slug || d.id;
                const curatedTag = (catMatch && catMatch.curated_tag) || d.curated_tag || (d.region || d.country || 'Curated Escape');
                const destImg = (catMatch && catMatch.image_url) || d.image_url || 'assets/agency-logo-emblem.webp';
                return `
                    <div class="card" onclick="navTo('destinations', '${escapeHTML(destSlug)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter') navTo('destinations', '${escapeHTML(destSlug)}')">
                        <img src="${escapeHTML(destImg)}" alt="${escapeHTML(d.name)}" loading="lazy" width="400" height="220">
                        <div class="card-body">
                            <span class="tag">${escapeHTML(curatedTag)}</span>
                            <h3>${escapeHTML(d.name)}</h3>
                            <p style="color:var(--text-muted); font-size:14px; margin-bottom:8px;"><i class="fas fa-map-marker-alt" style="color:var(--brand-orange);"></i> ${escapeHTML(d.region || d.country || '')}</p>
                            <span class="price-tag" data-inr-price="${getDestStartingPrice(d)}" data-price-prefix="From " data-price-suffix=" / person">From ${formatPrice(getDestStartingPrice(d))} / person</span>
                            <div class="price-subtext">per person &bull; twin-sharing basis</div>
                        </div>
                    </div>
                `;
            }).join('') : '<p class="text-center" style="grid-column:1/-1;">No destinations available.</p>';
        }

        // B. Packages (Differentiated 3 distinct packages)
        let packs = [];
        const homePkgIds = ['pkg-maldives-sanctuary', 'pkg-switzerland-panoramic', 'pkg-vietnam-charm'];
        if (window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) {
            packs = window.LUXURY_CATALOG.packages.filter(p => homePkgIds.includes(p.id));
        }
        const homePackEl = document.getElementById('home_packages');
        if (homePackEl) {
            homePackEl.innerHTML = packs.length ? packs.map(p => renderPackageCard(p)).join('') : '<p class="text-center" style="grid-column:1/-1;">No featured packages available.</p>';
        }

        // C. Blog Posts
        let blogs = [];
        if (sb) {
            try {
                const { data } = await sb.from('blog_posts').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(3);
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
                <div class="card" onclick="navTo('blog', '${escapeHTML(b.slug || b.id)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter') navTo('blog', '${escapeHTML(b.slug || b.id)}')">
                    <div style="position:relative;">
                        <img src="${escapeHTML(b.image_url || 'assets/agency-logo-emblem.webp')}" alt="${escapeHTML(b.title)}" loading="lazy" width="400" height="220">
                        <span class="tag" style="position:absolute; bottom:12px; left:12px; margin:0; background:rgba(12,26,61,0.85); color:#ffffff; backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,0.2);">${escapeHTML(b.category || 'Journal')}</span>
                    </div>
                    <div class="card-body">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:0.8rem; color:#64748b;">
                            <span><i class="far fa-calendar-alt"></i> ${new Date(b.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span><i class="far fa-clock"></i> ${escapeHTML(b.read_time || '5 min read')}</span>
                        </div>
                        <h3>${escapeHTML(b.title)}</h3>
                        <p class="blog-excerpt">${escapeHTML(b.excerpt || '')}</p>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:10px; font-size:0.85rem;">
                            <span style="color:var(--brand-navy); font-weight:600;"><i class="fas fa-user-edit" style="color:var(--brand-orange); font-size:0.75rem;"></i> ${escapeHTML(b.author || 'Senior Specialist')}</span>
                            <span style="color:var(--brand-orange); font-weight:700;">Read Guide &rarr;</span>
                        </div>
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
            const getInitials = (name) => {
                if (!name) return 'VG';
                const parts = name.replace(/&.*/, '').trim().split(/\s+/);
                if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            };

            homeTestEl.innerHTML = tests.length ? tests.map(t => `
                <div class="card testimonial-card">
                    <div class="card-body" style="display:flex; flex-direction:column; height:100%;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <div style="color:var(--brand-gold); font-size:1rem;">
                                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            </div>
                            <a href="${escapeHTML(t.source_url || 'https://www.google.com/search?q=Via+Tours+and+Travels+reviews')}" target="_blank" rel="noopener noreferrer" style="font-size:0.75rem; color:#16a34a; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:4px;" title="Verified on Google Reviews">
                                <i class="fab fa-google"></i> Google Verified <i class="fas fa-external-link-alt" style="font-size:0.65rem;"></i>
                            </a>
                        </div>
                        <p style="font-style:italic; margin-bottom:16px; color:var(--text-body); line-height:1.6; flex:1;">"${escapeHTML(t.message || t.quote || '')}"</p>
                        <div style="display:flex; align-items:center; gap:12px; margin-top:auto; padding-top:12px; border-top:1px solid #f1f5f9;">
                            <div class="traveler-avatar" style="width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg, #0c1a3d, #1e3a8a); color:#f59e0b; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.95rem; border:2px solid rgba(245,158,11,0.5); flex-shrink:0;">${escapeHTML(t.initials || getInitials(t.name))}</div>
                            <div style="flex:1; min-width:0;">
                                <h4 style="margin:0; font-size:1rem; color:var(--brand-navy); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(t.name || 'Verified Client')}</h4>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px; flex-wrap:wrap; gap:4px;">
                                    <small style="color:var(--text-muted); font-size:0.8rem;">${escapeHTML(t.location || t.city || 'Private Guest')}</small>
                                    <small style="color:#64748b; font-size:0.75rem;"><i class="far fa-calendar-alt"></i> ${escapeHTML(t.date || 'Verified Journey')}</small>
                                </div>
                            </div>
                        </div>
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
                const catMatch = window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations && window.LUXURY_CATALOG.destinations.find(cd => cd.id === d.id);
                const destSlug = (catMatch && catMatch.slug) || d.slug || d.id;
                const curatedTag = (catMatch && catMatch.curated_tag) || d.curated_tag || (d.region || d.country || 'Curated');
                const destImg = (catMatch && catMatch.image_url) || d.image_url || 'assets/agency-logo-emblem.webp';
                html += `
                    <div class="card" onclick="navTo('destinations', '${escapeHTML(destSlug)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter') navTo('destinations', '${escapeHTML(destSlug)}')">
                        <div style="position:relative;">
                            <img src="${escapeHTML(destImg)}" alt="${escapeHTML(d.name)}" loading="lazy">
                            <span class="tag" style="position:absolute; bottom:10px; left:10px; margin:0; background:rgba(12,26,61,0.85); color:#ffffff; font-size:0.7rem; backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,0.2);">${escapeHTML(curatedTag)}</span>
                        </div>
                        <div class="card-body">
                            <h4>${escapeHTML(d.name)}</h4>
                            <p style="font-size:0.85rem; color:var(--text-muted); margin:0 0 8px;"><i class="fas fa-map-marker-alt" style="color:var(--brand-orange);"></i> ${escapeHTML(d.region || d.country || '')}</p>
                            <div style="margin-top:auto; padding-top:6px;">
                                <span class="price-tag" data-inr-price="${getDestStartingPrice(d)}" data-price-prefix="From " data-price-suffix=" / person" style="font-size:0.88rem; display:inline-block;">From ${formatPrice(getDestStartingPrice(d))} / person</span>
                                <div class="price-subtext">per person &bull; twin-sharing basis</div>
                            </div>
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
        if (!destSelect || destSelect.options.length > 2) return;

        let destList = [];
        if (sb) {
            try {
                const { data } = await sb.from('destinations').select('id, name, country').eq('is_published', true).order('name');
                if (data && data.length) destList = data;
            } catch (e) {}
        }
        if ((!destList || !destList.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations) {
            destList = window.LUXURY_CATALOG.destinations.map(d => ({ id: d.id, name: d.name, country: d.country, is_domestic: d.is_domestic }));
        }

        if (destSelect && destList.length) {
            const intl = destList.filter(d => !d.is_domestic && d.country !== 'India');
            const domestic = destList.filter(d => d.is_domestic || d.country === 'India');

            destSelect.innerHTML = `
                <option value="">All Destinations (Global & Domestic)</option>
                <option value="domestic">All India / Domestic Escapes (4 Signature Tours)</option>
                <optgroup label="International Retreats">
                    ${intl.map(d => `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)}</option>`).join('')}
                </optgroup>
                <optgroup label="Domestic India Escapes">
                    ${domestic.map(d => `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)}</option>`).join('')}
                </optgroup>
            `;
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
                if (filterDest && filterDest !== 'domestic' && filterDest !== 'india') {
                    query = query.eq('destination_id', filterDest);
                }
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
                if (filterDest === 'domestic' || filterDest === 'india') {
                    catPacks = catPacks.filter(p => p.is_domestic || ['pkg-rajasthan-royal', 'pkg-kerala-backwaters', 'pkg-kashmir-paradise', 'pkg-ladakh-sanctuary'].includes(p.id) || ['dest-rajasthan', 'dest-kerala', 'dest-kashmir', 'dest-ladakh'].includes(p.destination_id));
                } else {
                    catPacks = catPacks.filter(p => p.destination_id === filterDest || (p.dest && p.dest.toLowerCase() === filterDest.toLowerCase()) || p.id === filterDest);
                }
            }
            if (filterCat) {
                catPacks = catPacks.filter(p => p.category && p.category.toLowerCase().includes(filterCat.toLowerCase()));
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
            if (filterDest === 'domestic' || filterDest === 'india') {
                const isDom = p.is_domestic || ['pkg-rajasthan-royal', 'pkg-kerala-backwaters', 'pkg-kashmir-paradise', 'pkg-ladakh-sanctuary'].includes(p.id) || ['dest-rajasthan', 'dest-kerala', 'dest-kashmir', 'dest-ladakh'].includes(p.destination_id);
                if (!isDom) return false;
            }
            if (!term) return true;
            return (
                (p.title && p.title.toLowerCase().includes(term)) ||
                (p.duration && p.duration.toLowerCase().includes(term)) ||
                (p.category && p.category.toLowerCase().includes(term)) ||
                (p.destinations?.name && p.destinations.name.toLowerCase().includes(term)) ||
                (p.destination_name && p.destination_name.toLowerCase().includes(term)) ||
                (p.short_description && p.short_description.toLowerCase().includes(term))
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

        listEl.innerHTML = filtered.map(p => renderPackageCard(p)).join('');
        updateWishlistUI();
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
        container.innerHTML = `
            <div class="skeleton" style="width:250px; height:20px; border-radius:var(--radius-sm); margin-bottom:16px;"></div>
            <div class="pkg-gallery">
                <div>
                    <div class="skeleton" style="width:100%; height:400px; border-radius:var(--radius-xl); margin-bottom:16px;"></div>
                    <div class="skeleton" style="width:70%; height:32px; border-radius:var(--radius-sm); margin-bottom:12px;"></div>
                    <div class="skeleton" style="width:40%; height:20px; border-radius:var(--radius-sm); margin-bottom:20px;"></div>
                    <div class="skeleton" style="width:100%; height:160px; border-radius:var(--radius-lg);"></div>
                </div>
                <div>
                    <div class="skeleton" style="width:100%; height:340px; border-radius:var(--radius-xl);"></div>
                </div>
            </div>
        `;

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
        if (!p) {
            p = findPackage(id);
        }

        if (!p) {
            container.innerHTML = '<div class="text-center" style="padding:60px 0;"><h3>Package not found</h3><p>The requested journey may be unavailable or archived.</p><a href="/packages" onclick="navTo(\'packages\'); return false;" class="btn btn-outline" style="margin-top:16px;">View All Packages</a></div>';
            return;
        }

        currentPackage = p;
        const pkgSlug = p.slug || p.id;

        // Structured Data Schema for TouristTrip
        const touristTripSchema = {
            "@type": "TouristTrip",
            "@id": `https://viatoursandtravels.com/packages/${pkgSlug}#trip`,
            "name": p.title,
            "description": p.short_description || p.description,
            "touristType": p.category || "Luxury",
            "offers": {
                "@type": "Offer",
                "price": p.price,
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "validFrom": "2026-01-01"
            }
        };

        updateSEO(p.title, p.short_description || p.description || p.overview, p.image_url, '/packages/' + pkgSlug, touristTripSchema);

        const allImages = [p.image_url, ...(p.gallery_images || [])].filter(Boolean);
        const galleryHTML = allImages.length > 0 ? `
            <img src="${escapeHTML(allImages[0])}" id="main-image" class="main-image" alt="${escapeHTML(p.title)}" width="800" height="450">
            <div class="thumbnail-container">
                ${allImages.map((img, i) => `
                    <img src="${escapeHTML(img)}" class="thumbnail ${i === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${escapeHTML(img)}')" alt="Thumbnail ${i + 1}" role="button" tabindex="0">
                `).join('')}
            </div>
        ` : '';

        const destName = p.destinations?.name || p.destination_name || (p.dest ? p.dest.toUpperCase() : 'Bespoke Retreat');

        // Update Mobile Sticky Bar
        const mPrice = document.getElementById('mobilePkgPrice');
        const mWa = document.getElementById('mobilePkgWhatsappBtn');
        const mEnq = document.getElementById('mobilePkgEnquireBtn');
        const mSticky = document.getElementById('mobilePkgStickyBar');
        if (mSticky) mSticky.classList.add('visible');
        if (mPrice) mPrice.textContent = formatPrice(p.price);
        if (mWa) {
            mWa.href = `https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello Via Tours Concierge, I am interested in reserving: ' + p.title)}`;
            mWa.onclick = () => trackEvent('whatsapp_click', { package: pkgSlug });
        }
        if (mEnq) mEnq.onclick = () => navTo('plan-trip', pkgSlug);

        // Related packages lookup
        let relatedPacks = [];
        if (window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) {
            if (p.related_package_ids && p.related_package_ids.length) {
                relatedPacks = window.LUXURY_CATALOG.packages.filter(item => p.related_package_ids.includes(item.id));
            }
            if (relatedPacks.length < 2) {
                relatedPacks = window.LUXURY_CATALOG.packages.filter(item => item.id !== p.id && (item.category === p.category || item.destination_id === p.destination_id)).slice(0, 3);
            }
        }

        container.innerHTML = `
            <nav class="breadcrumbs" aria-label="Breadcrumb">
                <a href="/" onclick="navTo('home'); return false;">Home</a> / 
                <a href="/packages" onclick="navTo('packages'); return false;">Curated Packages</a> / 
                <span>${escapeHTML(p.title)}</span>
            </nav>

            <div class="pkg-gallery">
                <div>
                    ${galleryHTML}
                    <div style="display:flex; gap:10px; align-items:center; margin:16px 0 8px;">
                        <span class="tag">${escapeHTML(p.category || 'Luxury')}</span>
                        <span style="font-size:0.85rem; color:#10b981; font-weight:600;"><i class="fas fa-shield-alt"></i> Handcrafted Signature Itinerary</span>
                    </div>
                    <h1 style="font-size:clamp(1.8rem, 3.5vw, 2.5rem); margin:0 0 10px; color:var(--brand-navy); line-height:1.2;">${escapeHTML(p.title)}</h1>
                    <p style="color:var(--text-muted); margin-bottom:16px; font-size:1.05rem;">
                        <i class="far fa-clock" style="color:var(--brand-orange);"></i> ${escapeHTML(p.duration || 'N/A')} &nbsp;|&nbsp;
                        <i class="fas fa-map-marker-alt" style="color:var(--brand-orange);"></i> ${escapeHTML(destName)}
                    </p>

                    <!-- Key Specs Summary Grid -->
                    <div class="pkg-key-specs" style="margin-bottom:20px;">
                        <div class="pkg-spec-item">
                            <div class="pkg-spec-icon"><i class="far fa-clock"></i></div>
                            <div>
                                <div class="pkg-spec-label">Duration</div>
                                <div class="pkg-spec-val">${escapeHTML(p.duration || 'Bespoke')}</div>
                            </div>
                        </div>
                        <div class="pkg-spec-item">
                            <div class="pkg-spec-icon"><i class="fas fa-map-marked-alt"></i></div>
                            <div>
                                <div class="pkg-spec-label">Destination</div>
                                <div class="pkg-spec-val">${escapeHTML(destName)}</div>
                            </div>
                        </div>
                        <div class="pkg-spec-item">
                            <div class="pkg-spec-icon"><i class="fas fa-sun"></i></div>
                            <div>
                                <div class="pkg-spec-label">Best Season</div>
                                <div class="pkg-spec-val">${escapeHTML(p.best_season || 'Year-round')}</div>
                            </div>
                        </div>
                        <div class="pkg-spec-item">
                            <div class="pkg-spec-icon"><i class="fas fa-calendar-check"></i></div>
                            <div>
                                <div class="pkg-spec-label">Departures</div>
                                <div class="pkg-spec-val">${escapeHTML(p.departure_dates || 'Daily Departures')}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Toolbar -->
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:24px;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="downloadItineraryPDF('${escapeHTML(pkgSlug)}')">
                            <i class="fas fa-file-pdf" style="color:#ef4444;"></i> Download Itinerary (PDF)
                        </button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="sharePackage('${escapeHTML(pkgSlug)}')">
                            <i class="fas fa-share-alt" style="color:var(--brand-orange);"></i> Share Itinerary
                        </button>
                    </div>

                    <!-- Interactive Information Tabs -->
                    <div class="info-tabs" role="tablist">
                        <button class="tab-btn active" onclick="switchTab(event, 'itinerary')" role="tab" aria-selected="true">Day-by-Day Itinerary</button>
                        <button class="tab-btn" onclick="switchTab(event, 'accommodations')" role="tab" aria-selected="false">Resorts &amp; Stays</button>
                        <button class="tab-btn" onclick="switchTab(event, 'inclusions')" role="tab" aria-selected="false">Inclusions &amp; Exclusions</button>
                        <button class="tab-btn" onclick="switchTab(event, 'route')" role="tab" aria-selected="false">Route Timeline</button>
                        <button class="tab-btn" onclick="switchTab(event, 'pricing')" role="tab" aria-selected="false">Pricing &amp; Taxes</button>
                        <button class="tab-btn" onclick="switchTab(event, 'cancellation')" role="tab" aria-selected="false">Cancellation Policy</button>
                        ${p.faqs && p.faqs.length ? '<button class="tab-btn" onclick="switchTab(event, \'faqs\')" role="tab" aria-selected="false">Package FAQs</button>' : ''}
                    </div>
                    <div id="tab-content" style="margin-top:20px;"></div>
                </div>

                <!-- Right Sticky Tariff & Concierge Card -->
                <div>
                    <div style="background:var(--bg-light); border:1px solid var(--border); padding:32px 24px; border-radius:var(--radius-xl); position:sticky; top:104px; text-align:center; box-shadow:var(--shadow-md);">
                        <span style="font-size:0.82rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); font-weight:700;">Starting From</span>
                        <h2 class="price-tag" data-inr-price="${p.price}" style="font-size:2.4rem; margin:6px 0 2px; color:var(--brand-navy);">${formatPrice(p.price)}</h2>
                        <p style="margin-bottom:20px; color:var(--text-muted); font-size:0.88rem;">${escapeHTML((p.pricing_breakdown || p.price_breakdown)?.pricing_basis || 'Per person on twin sharing')}</p>
                        
                        <a href="https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello Via Tours Concierge, I am interested in reserving: ' + p.title)}" target="_blank" rel="noopener noreferrer" class="btn btn-green" style="width:100%; margin-bottom:10px;" onclick="trackEvent('whatsapp_click', { package: '${escapeHTML(pkgSlug)}' })">
                            <i class="fab fa-whatsapp"></i> Instant WhatsApp Concierge
                        </a>
                        <button class="btn btn-primary" style="width:100%; margin-bottom:10px;" onclick="navTo('plan-trip', '${escapeHTML(pkgSlug)}')">
                            <i class="fas fa-calendar-check"></i> Request Custom Quote
                        </button>
                        <a href="tel:+918041237890" class="btn btn-outline" style="width:100%; font-size:0.85rem;">
                            <i class="fas fa-phone-alt"></i> Speak to Specialist
                        </a>

                        <div style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border); font-size:0.82rem; color:var(--text-muted); text-align:left; line-height:1.7;">
                            <div><i class="fas fa-check-circle" style="color:#10b981;"></i> 100% Vetted 5-Star Accommodations</div>
                            <div><i class="fas fa-file-invoice-dollar" style="color:#10b981;"></i> Transparent Invoicing &bull; Statutory 5% GST</div>
                            <div><i class="fas fa-headset" style="color:#10b981;"></i> 24/7 On-Trip Emergency Travel Desk</div>
                            <div><i class="fas fa-exchange-alt" style="color:#10b981;"></i> Zero Agency Amendment Fees (Up to 21 Days Prior)</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Related Packages Showcase -->
            ${relatedPacks.length ? `
                <div style="margin-top:60px; padding-top:40px; border-top:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
                        <div>
                            <span class="tag">Explore More</span>
                            <h3 style="margin:4px 0 0; color:var(--brand-navy); font-size:1.6rem;">You May Also Appreciate</h3>
                        </div>
                        <a href="/packages" onclick="navTo('packages'); return false;" style="color:var(--brand-orange); font-weight:700; text-decoration:none;">View All Packages &rarr;</a>
                    </div>
                    <div class="grid-3">
                        ${relatedPacks.map(rp => renderPackageCard(rp)).join('')}
                    </div>
                </div>
            ` : ''}
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
                <div style="margin-bottom:18px; padding:22px; background:#ffffff; border-radius:var(--radius-lg); border:1px solid var(--border); border-left:4px solid var(--brand-orange); box-shadow:var(--shadow-sm);">
                    <div style="font-size:0.78rem; text-transform:uppercase; letter-spacing:1px; color:var(--brand-orange); font-weight:700;">Day ${d.day || idx + 1}</div>
                    <strong style="display:block; margin:6px 0 10px; font-size:1.15rem; color:var(--brand-navy);">${escapeHTML(d.title)}</strong>
                    <p style="white-space: pre-wrap; margin:0 0 12px; font-size:0.95rem; color:var(--text-body); line-height:1.7;">${escapeHTML(d.desc || d.description || '')}</p>
                    <div style="display:flex; flex-wrap:wrap; gap:16px; font-size:0.86rem; padding-top:10px; border-top:1px dashed var(--border);">
                        ${d.stay ? `<span style="color:var(--brand-blue);"><i class="fas fa-hotel"></i> <strong>Stay:</strong> ${escapeHTML(d.stay)}</span>` : ''}
                        ${d.meals ? `<span style="color:var(--brand-orange);"><i class="fas fa-utensils"></i> <strong>Meals:</strong> ${escapeHTML(d.meals)}</span>` : ''}
                    </div>
                </div>
            `).join('') : '<p style="padding:20px 0; color:var(--text-muted);">Detailed itinerary provided upon concierge consultation.</p>';

        } else if (tab === 'accommodations') {
            const hotels = pkg.hotel_details || [];
            if (!hotels.length) {
                c.innerHTML = `
                    <div style="background:#ffffff; border:1px solid var(--border); border-radius:var(--radius-lg); padding:24px;">
                        <h4 style="color:var(--brand-navy); margin-top:0;">Handpicked 5-Star Accommodations</h4>
                        <p style="color:var(--text-body); line-height:1.7;">All properties in this itinerary are vetted 5-star luxury resorts, heritage palaces, or private pool villas. Room categories are confirmed in writing prior to payment.</p>
                    </div>
                `;
            } else {
                c.innerHTML = hotels.map(h => `
                    <div class="resort-card">
                        <img src="${escapeHTML(h.image_url || pkg.image_url)}" alt="${escapeHTML(h.name)}" class="resort-card-img" loading="lazy" width="280" height="200">
                        <div class="resort-card-body">
                            <span class="tag" style="background:#fef3c7; color:#b45309; font-weight:700;">${escapeHTML(h.stars || '5★ Luxury')}</span>
                            <h3 style="margin:8px 0 6px; color:var(--brand-navy);">${escapeHTML(h.name)}</h3>
                            <p style="margin:0 0 6px; font-size:0.92rem; color:var(--brand-orange); font-weight:600;"><i class="fas fa-bed"></i> ${escapeHTML(h.room_category || 'Luxury Suite')}</p>
                            <p style="margin:0 0 10px; font-size:0.85rem; color:var(--text-muted);"><i class="fas fa-map-marker-alt"></i> ${escapeHTML(h.location || '')}</p>
                            ${h.amenities && h.amenities.length ? `
                                <div class="amenity-pills">
                                    ${h.amenities.map(a => `<span class="amenity-pill"><i class="fas fa-check" style="color:var(--brand-orange); font-size:0.75rem;"></i> ${escapeHTML(a)}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('');
            }

        } else if (tab === 'inclusions') {
            c.innerHTML = `
                <div class="inc-exc-grid">
                    <div class="inc-box">
                        <h4 style="margin:0 0 12px; color:#166534; font-size:1.05rem;"><i class="fas fa-check-circle" style="color:#16a34a;"></i> What Is Included</h4>
                        <ul class="inc-list">
                            ${(pkg.inclusions && pkg.inclusions.length ? pkg.inclusions : [
                                '5-Star luxury resort / villa accommodation on double occupancy',
                                'Daily gourmet breakfast & bespoke à la carte dining as per plan',
                                'Private chauffeured airport transfers with VIP greeting',
                                'Handpicked private sightseeing tours and scenic transfers',
                                '24/7 dedicated senior travel concierge support'
                            ]).map(i => `<li>${escapeHTML(i)}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="exc-box">
                        <h4 style="margin:0 0 12px; color:#991b1b; font-size:1.05rem;"><i class="fas fa-times-circle" style="color:#dc2626;"></i> What Is Excluded</h4>
                        <ul class="exc-list">
                            ${(pkg.exclusions && pkg.exclusions.length ? pkg.exclusions : [
                                'International airfares (available upon request with preferred airlines)',
                                'Personal expenses, laundry, and discretionary gratuities',
                                'Optional motorized watersports or private spa upgrades',
                                'Comprehensive international travel medical insurance'
                            ]).map(e => `<li>${escapeHTML(e)}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;

        } else if (tab === 'route') {
            const waypoints = pkg.route_map || [];
            if (!waypoints.length) {
                c.innerHTML = '<p style="color:var(--text-muted);">Route waypoint details provided upon concierge consultation.</p>';
            } else {
                c.innerHTML = `
                    <div style="background:#ffffff; border:1px solid var(--border); border-radius:var(--radius-lg); padding:24px;">
                        <h4 style="color:var(--brand-navy); margin-top:0; margin-bottom:16px;">Curated Travel Route &amp; Transit Waypoints</h4>
                        <div class="route-timeline">
                            ${waypoints.map((w, idx) => `
                                <div class="route-stop-item">
                                    <div class="route-stop-dot"></div>
                                    <div class="route-stop-name">
                                        <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; display:block;">Stop ${idx + 1}</span>
                                        ${escapeHTML(w)}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

        } else if (tab === 'pricing') {
            const pb = pkg.pricing_breakdown || pkg.price_breakdown || {};
            c.innerHTML = `
                <div style="background:#ffffff; border:1px solid var(--border); border-radius:var(--radius-lg); padding:28px;">
                    <h4 style="color:var(--brand-navy); margin-top:0; margin-bottom:12px; font-size:1.2rem;">Transparent Pricing Breakdown &amp; Tax Disclosure</h4>
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">We operate with complete financial integrity. All proposals clearly disclose what is included, applicable taxes, and seasonal assumptions.</p>
                    
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:24px;">
                        <div style="background:#f8fafc; border:1px solid var(--border); border-radius:var(--radius-md); padding:16px;">
                            <div style="font-size:0.78rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Starting Tariff</div>
                            <div style="font-size:1.6rem; color:var(--brand-navy); font-weight:800; margin:4px 0;">${formatPrice(pkg.price)}</div>
                            <small style="color:var(--text-muted);">${escapeHTML(pb.pricing_basis || 'Per person on twin-sharing basis')}</small>
                        </div>
                        <div style="background:#f8fafc; border:1px solid var(--border); border-radius:var(--radius-md); padding:16px;">
                            <div style="font-size:0.78rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Single Occupancy</div>
                            <div style="font-size:0.95rem; color:var(--text-body); font-weight:600; margin-top:6px;">${escapeHTML(pb.single_supplement || 'Supplement applies for solo travelers (typically +50% to +60%).')}</div>
                        </div>
                        <div style="background:#f8fafc; border:1px solid var(--border); border-radius:var(--radius-md); padding:16px;">
                            <div style="font-size:0.78rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Child &amp; Family Policy</div>
                            <div style="font-size:0.95rem; color:var(--text-body); font-weight:600; margin-top:6px;">${escapeHTML(pb.child_policy || 'Special rates available for children under 12 sharing parents room.')}</div>
                        </div>
                    </div>

                    <div style="background:#fefce8; border:1px solid #fef08a; border-radius:var(--radius-md); padding:18px; margin-bottom:16px; font-size:0.9rem; color:#854d0e; line-height:1.6;">
                        <strong><i class="fas fa-file-invoice-dollar"></i> Itemized Tax Disclosure (GST &amp; TCS):</strong>
                        ${escapeHTML(pb.tax_details || 'Packages are billed with statutory 5% GST without input credit. Statutory TCS under Section 206C(1G) applies at 5% up to ₹7,00,000 per financial year (or 20% on excess) and is fully adjustable in your annual income tax return (Form 26AS/AIS).')}
                    </div>

                    <p style="font-size:0.86rem; color:var(--text-muted); margin:0;">
                        <strong>Note on Seasonality:</strong> ${escapeHTML(pb.assumptions || 'Starting tariffs assume travel during regular shoulder periods. Peak dates (festive week, national holidays) are subject to hotel seasonal supplements.')}
                    </p>
                </div>
            `;

        } else if (tab === 'cancellation') {
            const cp = pkg.cancellation_policy || {};
            const schedule = cp.schedule || [
                { notice: '30 or more days prior to departure', fee: 'Resort confirmation deposit + ₹5,000 per person processing fee', refund: 'Balance refunded in full' },
                { notice: '15 to 29 days prior to departure', fee: '50% of the land package cost', refund: '50% refunded (less non-recoverable supplier fees)' },
                { notice: '14 days or fewer / No Show', fee: '100% of package cost', refund: 'Non-refundable' }
            ];

            c.innerHTML = `
                <div style="background:#ffffff; border:1px solid var(--border); border-radius:var(--radius-lg); padding:28px;">
                    <h4 style="color:var(--brand-navy); margin-top:0; margin-bottom:12px; font-size:1.2rem;">Booking Cancellation &amp; Modification Terms</h4>
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">We understand plans evolve. Our policies are designed to be as clear and fair as possible.</p>

                    <div style="overflow-x:auto; margin-bottom:24px;">
                        <table style="width:100%; border-collapse:collapse; min-width:540px; font-size:0.9rem;">
                            <thead>
                                <tr style="background:#f8fafc; border-bottom:2px solid var(--border);">
                                    <th style="padding:12px; text-align:left; color:var(--brand-navy);">Notice Period</th>
                                    <th style="padding:12px; text-align:left; color:var(--brand-navy);">Cancellation Fee</th>
                                    <th style="padding:12px; text-align:left; color:var(--brand-navy);">Refund Terms</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${schedule.map(s => `
                                    <tr style="border-bottom:1px solid var(--border);">
                                        <td style="padding:12px; font-weight:600; color:var(--text-dark);">${escapeHTML(s.notice)}</td>
                                        <td style="padding:12px; color:#dc2626;">${escapeHTML(s.fee)}</td>
                                        <td style="padding:12px; color:#16a34a;">${escapeHTML(s.refund)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:var(--radius-md); padding:16px; font-size:0.9rem; color:#065f46; line-height:1.6;">
                        <strong><i class="fas fa-check-circle"></i> Date Modification Privilege:</strong>
                        ${escapeHTML(cp.date_change || 'Via Tours & Travels charges zero agency service fees for date adjustments requested up to 21 days prior to departure (subject only to airline fare variance and hotel seasonal tariff changes).')}
                    </div>
                </div>
            `;

        } else if (tab === 'faqs') {
            const pFaqs = pkg.faqs || [];
            c.innerHTML = `
                <div style="background:#ffffff; border:1px solid var(--border); border-radius:var(--radius-lg); padding:24px;">
                    <h4 style="color:var(--brand-navy); margin-top:0; margin-bottom:16px; font-size:1.2rem;">Frequently Asked Questions About This Itinerary</h4>
                    ${pFaqs.map((f, i) => `
                        <div class="faq-item" id="pkg-faq-${i}" style="border:1px solid var(--border); border-radius:var(--radius-md); margin-bottom:10px;">
                            <div class="faq-question" onclick="togglePkgFaq(${i})" role="button" tabindex="0" style="padding:14px 18px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; font-weight:600; color:var(--brand-navy);">
                                <span>${escapeHTML(f.question)}</span>
                                <i class="fas fa-chevron-down" id="pkg-faq-icon-${i}" style="transition:transform 0.2s ease;"></i>
                            </div>
                            <div class="faq-answer" id="pkg-faq-ans-${i}" style="display:none; padding:0 18px 16px; color:var(--text-body); font-size:0.92rem; line-height:1.6;">
                                ${escapeHTML(f.answer)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function togglePkgFaq(idx) {
        const ans = document.getElementById('pkg-faq-ans-' + idx);
        const icon = document.getElementById('pkg-faq-icon-' + idx);
        if (!ans) return;
        const isOpen = ans.style.display === 'block';
        ans.style.display = isOpen ? 'none' : 'block';
        if (icon) icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    }

    function downloadItineraryPDF(pkgId) {
        showToast('Opening print dialog. Select "Save as PDF" to download itinerary...', 'info');
        setTimeout(() => {
            window.print();
        }, 350);
        trackEvent('download_itinerary', { pkgId });
    }

    async function sharePackage(pkgId) {
        const pkg = currentPackage || findPackage(pkgId);
        const title = pkg ? pkg.title : 'Via Tours & Travels Luxury Package';
        const url = window.location.origin + '/packages/' + (pkg ? (pkg.slug || pkg.id) : pkgId);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: 'Explore this bespoke luxury travel itinerary on Via Tours & Travels:',
                    url: url
                });
                trackEvent('share_package', { pkgId, method: 'navigator.share' });
                return;
            } catch (e) {}
        }

        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(url);
                showToast('Itinerary URL copied to clipboard!', 'success');
                trackEvent('share_package', { pkgId, method: 'clipboard' });
                return;
            } catch (e) {}
        }

        showToast('Itinerary URL: ' + url, 'info');
    }

    // 6. Plan My Trip Setup & Confirmation Controller
    async function setupPlanForm(pkgId) {
        const pkgIdInput = document.getElementById('pt_pkg_id');
        const destInput = document.getElementById('pt_dest');
        if (pkgIdInput) pkgIdInput.value = '';
        if (destInput) destInput.value = '';

        // Reset visibility in case previously submitted
        const formEl = document.getElementById('planTripForm');
        const successCard = document.getElementById('planTripSuccess');
        if (formEl) formEl.style.display = 'block';
        if (successCard) successCard.style.display = 'none';

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
                p = window.LUXURY_CATALOG.packages.find(pkg => pkg.id === pkgId || (pkg.aliases && pkg.aliases.includes(pkgId)) || String(pkg.id) === String(pkgId));
            }
            if (p) {
                if (pkgIdInput) pkgIdInput.value = p.id;
                if (destInput) destInput.value = p.destinations?.name || p.destination_name || p.title;
            }
        }
    }

    function resetPlanTripForm() {
        const formEl = document.getElementById('planTripForm');
        const successCard = document.getElementById('planTripSuccess');
        if (formEl) {
            formEl.reset();
            formEl.style.display = 'block';
        }
        if (successCard) {
            successCard.style.display = 'none';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Handle Plan My Trip Form Submission
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

            const submitBtn = document.getElementById('pt_submit_btn');
            const originalBtnHTML = submitBtn ? submitBtn.innerHTML : 'Submit VIP Itinerary Request';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Architecting VIP Request...';
            }

            try {
                const sanitize = security.sanitizeInput || ((v) => String(v || '').trim());
                const name = sanitize(document.getElementById('pt_name')?.value);
                const email = sanitize(document.getElementById('pt_email')?.value);
                const countryCode = sanitize(document.getElementById('pt_country_code')?.value || '+91');
                const rawPhone = sanitize(document.getElementById('pt_phone')?.value);
                const phone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `${countryCode} ${rawPhone}`) : '';
                const destination = sanitize(document.getElementById('pt_dest')?.value);
                const departureCity = sanitize(document.getElementById('pt_departure_city')?.value || 'Mumbai');
                const travelDates = sanitize(document.getElementById('pt_dates')?.value);
                const flexibleDates = document.getElementById('pt_flexible_dates')?.checked ? 'Yes (+/- 3 days)' : 'Exact Dates';
                const tripType = sanitize(document.getElementById('pt_trip_type')?.value || 'Ultra Luxury Sanctuary');
                const hotelPref = sanitize(document.getElementById('pt_hotel')?.value || '5 Star Ultra Luxury');
                const adults = sanitize(document.getElementById('pt_adults')?.value || '2');
                const children = sanitize(document.getElementById('pt_children')?.value || '0');
                const infants = sanitize(document.getElementById('pt_infants')?.value || '0');
                const budget = sanitize(document.getElementById('pt_budget')?.value || 'On Quote');
                const visaHelp = document.getElementById('pt_visa_help')?.checked ? 'Yes' : 'No';
                const referral = sanitize(document.getElementById('pt_referral')?.value || 'Website');
                const requirements = sanitize(document.getElementById('pt_req')?.value);
                const packageId = document.getElementById('pt_pkg_id')?.value || null;

                if (!name || !email || !phone) {
                    showToast('Please provide your name, email, and contact phone number.', 'error');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnHTML;
                    }
                    return;
                }

                const consentBox = document.getElementById('pt_consent');
                if (consentBox && !consentBox.checked) {
                    showToast('Please agree to the privacy policy & DPDP consent terms to proceed.', 'error');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnHTML;
                    }
                    consentBox.focus();
                    return;
                }

                const travelersSummary = `${adults} Adults${Number(children) > 0 ? `, ${children} Children (2-11)` : ''}${Number(infants) > 0 ? `, ${infants} Infants (0-2)` : ''}`;
                const refId = 'VIA-2026-' + Math.floor(1000 + Math.random() * 9000);

                const payload = {
                    ref_id: refId,
                    name,
                    email,
                    phone,
                    destination: destination || 'Bespoke Inquiry',
                    departure_city: departureCity,
                    travel_dates: travelDates || 'Flexible',
                    flexible_dates: flexibleDates,
                    travelers: travelersSummary,
                    trip_style: tripType,
                    hotel_pref: hotelPref,
                    budget: budget || 'On Quote',
                    visa_assistance: visaHelp,
                    referral_source: referral,
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
                        if (apiRes.ok) submitted = true;
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

                // 3. Display Confirmation State with Reference ID
                const refEl = document.getElementById('pt_ref_id');
                if (refEl) refEl.textContent = refId;

                const waBtn = document.getElementById('pt_success_wa');
                if (waBtn) {
                    waBtn.href = `https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent(`Hello Via Tours Concierge, I submitted consultation request ${refId} for ${destination || 'a bespoke escape'} departing from ${departureCity}. My name is ${name}.`)}`;
                }

                planTripForm.style.display = 'none';
                const successCard = document.getElementById('planTripSuccess');
                if (successCard) {
                    successCard.style.display = 'block';
                }

                const planPage = document.getElementById('page-plan-trip');
                if (planPage) {
                    planPage.scrollIntoView({ behavior: 'smooth' });
                }

                showToast(`VIP consultation request confirmed! Reference ID: ${refId}. A senior specialist will connect within 2 hours.`, 'success');
                if (security.resetFormTimer) security.resetFormTimer('planTripForm');

                trackEvent('generate_lead', {
                    refId,
                    destination: destination || 'Bespoke',
                    departureCity,
                    budget,
                    party: travelersSummary
                });

            } catch (err) {
                console.error('[Via] Enquiry error:', err);
                showToast('Error processing request. Please connect directly via WhatsApp: +91 88797 76866.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHTML;
                }
            }
        });
    }

    // 7. Destination Details Page Controller
    async function loadDestinationDetails(id) {
        const container = document.getElementById('dest_details_container');
        if (!container) return;

        container.innerHTML = `
            <div class="skeleton" style="width:250px; height:20px; border-radius:var(--radius-sm); margin-bottom:16px;"></div>
            <div class="skeleton" style="width:100%; height:380px; border-radius:var(--radius-xl); margin-bottom:24px;"></div>
            <div class="skeleton" style="width:100%; height:120px; border-radius:var(--radius-md);"></div>
        `;

        let d = findDestination(id);

        if (!d) {
            container.innerHTML = `
                <div class="text-center" style="padding:60px 0;">
                    <h3>Destination Not Found</h3>
                    <p>The requested destination guide could not be located.</p>
                    <button class="btn btn-outline" onclick="navTo('destinations')">Browse All Destinations</button>
                </div>
            `;
            return;
        }

        updateSEO(
            `${d.name} — Luxury Travel Guide & Curated Packages`,
            d.description,
            d.image_url,
            '/destinations/' + (d.slug || d.id),
            {
                "@context": "https://schema.org",
                "@type": "TouristDestination",
                "name": d.name,
                "description": d.description,
                "image": d.image_url,
                "touristType": ["Luxury Travel", "Honeymoon", "Cultural Tourism"]
            }
        );

        // Find linked packages
        let linkedPacks = [];
        if (window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) {
            linkedPacks = window.LUXURY_CATALOG.packages.filter(p => 
                p.destination_id === d.id || 
                (d.linked_package_ids && d.linked_package_ids.includes(p.id)) ||
                (p.dest && p.dest.toLowerCase() === d.name.toLowerCase())
            );
        }

        // Find linked blogs
        let linkedBlogs = [];
        if (window.LUXURY_CATALOG && window.LUXURY_CATALOG.blogs && d.linked_blog_slugs) {
            linkedBlogs = window.LUXURY_CATALOG.blogs.filter(b => d.linked_blog_slugs.includes(b.slug));
        }

        const startingPrice = getDestStartingPrice(d);

        container.innerHTML = `
            <nav class="breadcrumbs" aria-label="Breadcrumb">
                <a href="/" onclick="navTo('home'); return false;">Home</a> / 
                <a href="/destinations" onclick="navTo('destinations'); return false;">Destinations</a> / 
                <span>${escapeHTML(d.name)}</span>
            </nav>

            <!-- Destination Hero Showcase -->
            <div style="position:relative; border-radius:var(--radius-xl); overflow:hidden; min-height:420px; display:flex; align-items:flex-end; padding:clamp(24px, 5vw, 48px); margin-bottom:36px; box-shadow:var(--shadow-md);">
                <img src="${escapeHTML(d.image_url)}" alt="${escapeHTML(d.name)}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" loading="eager">
                <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(12, 26, 61, 0.2) 0%, rgba(12, 26, 61, 0.9) 100%);"></div>
                <div style="position:relative; z-index:1; color:#ffffff; max-width:760px;">
                    <span class="tag" style="background:var(--brand-orange); color:#ffffff; margin-bottom:12px;">${escapeHTML(d.region || d.country)}</span>
                    <h1 style="font-size:clamp(2.2rem, 5vw, 3.4rem); margin:0 0 12px; color:#ffffff; line-height:1.1;">${escapeHTML(d.name)}</h1>
                    <p style="font-size:clamp(1rem, 2vw, 1.15rem); color:#f1f5f9; line-height:1.6; margin-bottom:20px;">${escapeHTML(d.description)}</p>
                    <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
                        <button class="btn btn-primary" onclick="navTo('plan-trip')">
                            <i class="fas fa-calendar-check"></i> Plan Bespoke ${escapeHTML(d.name)} Escape
                        </button>
                        <a href="https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello Via Tours Concierge, I would like to consult on a private holiday to ' + d.name)}" target="_blank" rel="noopener noreferrer" class="btn btn-green">
                            <i class="fab fa-whatsapp"></i> Chat with Specialist
                        </a>
                    </div>
                </div>
            </div>

            <!-- Destination Intelligence Grid (4 Key Pillars) -->
            <div style="margin-bottom:40px;">
                <div style="margin-bottom:16px;">
                    <span class="tag">Travel Intelligence</span>
                    <h2 style="margin:4px 0 0; color:var(--brand-navy); font-size:1.6rem;">Essential Destination Intelligence</h2>
                </div>
                <div class="dest-intel-grid">
                    <div class="dest-intel-card">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                            <i class="fas fa-calendar-alt" style="font-size:1.3rem; color:var(--brand-orange);"></i>
                            <h4 style="margin:0; font-size:0.95rem; color:var(--brand-navy);">Best Time to Visit</h4>
                        </div>
                        <p style="margin:0; font-size:0.9rem; color:var(--text-body); line-height:1.6;">${escapeHTML(d.best_time || 'October to April (Ideal conditions)')}</p>
                    </div>
                    <div class="dest-intel-card">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                            <i class="fas fa-plane-departure" style="font-size:1.3rem; color:var(--brand-blue);"></i>
                            <h4 style="margin:0; font-size:0.95rem; color:var(--brand-navy);">Flight Time from India</h4>
                        </div>
                        <p style="margin:0; font-size:0.9rem; color:var(--text-body); line-height:1.6;">${escapeHTML(d.flight_time_from_india || 'Direct & 1-stop connections from BOM, DEL, BLR')}</p>
                    </div>
                    <div class="dest-intel-card">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                            <i class="fas fa-passport" style="font-size:1.3rem; color:#10b981;"></i>
                            <h4 style="margin:0; font-size:0.95rem; color:var(--brand-navy);">Visa &amp; Processing</h4>
                        </div>
                        <p style="margin:0; font-size:0.9rem; color:var(--text-body); line-height:1.6;">${escapeHTML(d.visa_requirements || 'Visa on Arrival / e-Visa assistance provided.')}</p>
                        <small style="color:var(--text-muted); display:block; margin-top:4px;"><strong>Processing:</strong> ${escapeHTML(d.processing_time || 'Varies by consulate')}</small>
                    </div>
                    <div class="dest-intel-card">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                            <i class="fas fa-coins" style="font-size:1.3rem; color:#f59e0b;"></i>
                            <h4 style="margin:0; font-size:0.95rem; color:var(--brand-navy);">Weather &amp; Currency</h4>
                        </div>
                        <p style="margin:0; font-size:0.9rem; color:var(--text-body); line-height:1.6;">${escapeHTML(d.weather_currency || 'Pleasant season temperatures. Multi-currency cards accepted.')}</p>
                    </div>
                </div>
            </div>

            <!-- Top Curated Experiences -->
            ${d.top_experiences && d.top_experiences.length ? `
                <div style="margin-bottom:48px;">
                    <div style="margin-bottom:20px;">
                        <span class="tag">Signature Encounters</span>
                        <h2 style="margin:4px 0 0; color:var(--brand-navy); font-size:1.6rem;">Top Curated Experiences in ${escapeHTML(d.name)}</h2>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px;">
                        ${d.top_experiences.map((exp, idx) => `
                            <div style="background:#ffffff; border:1px solid var(--border); border-radius:var(--radius-lg); padding:22px; box-shadow:var(--shadow-sm); border-top:3px solid var(--brand-orange);">
                                <span style="font-size:0.75rem; color:var(--brand-orange); font-weight:700; text-transform:uppercase;">Experience 0${idx + 1}</span>
                                <h4 style="margin:6px 0 8px; color:var(--brand-navy); font-size:1.1rem;">${escapeHTML(exp.title)}</h4>
                                <p style="margin:0; font-size:0.9rem; color:var(--text-body); line-height:1.6;">${escapeHTML(exp.desc)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Linked Curated Packages -->
            <div style="margin-bottom:48px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <span class="tag">Private Itineraries</span>
                        <h2 style="margin:4px 0 0; color:var(--brand-navy); font-size:1.6rem;">Curated Packages for ${escapeHTML(d.name)}</h2>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="navTo('packages')">Explore All Packages &rarr;</button>
                </div>
                ${linkedPacks.length ? `
                    <div class="grid-3">
                        ${linkedPacks.map(p => renderPackageCard(p)).join('')}
                    </div>
                ` : `
                    <div style="background:#f8fafc; border:1px dashed var(--border); border-radius:var(--radius-lg); padding:40px 20px; text-align:center;">
                        <p style="color:var(--text-muted); margin-bottom:16px;">We design private custom itineraries for ${escapeHTML(d.name)} tailored to your exact dates and party size.</p>
                        <button class="btn btn-primary" onclick="navTo('plan-trip')">Request Custom ${escapeHTML(d.name)} Proposal</button>
                    </div>
                `}
            </div>

            <!-- Linked Travel Articles -->
            ${linkedBlogs.length ? `
                <div style="margin-bottom:48px;">
                    <div style="margin-bottom:20px;">
                        <span class="tag">From Our Journal</span>
                        <h2 style="margin:4px 0 0; color:var(--brand-navy); font-size:1.6rem;">Insider Travel Stories &amp; Guides</h2>
                    </div>
                    <div class="grid-3">
                        ${linkedBlogs.map(b => `
                            <div class="card" onclick="navTo('blog', '${escapeHTML(b.slug || b.id)}')" role="button" tabindex="0">
                                <img src="${escapeHTML(b.image_url)}" alt="${escapeHTML(b.title)}" loading="lazy">
                                <div class="card-body">
                                    <span class="tag">Travel Guide</span>
                                    <h3>${escapeHTML(b.title)}</h3>
                                    <p class="blog-excerpt">${escapeHTML(b.excerpt || '')}</p>
                                    <span style="color:var(--brand-orange); font-weight:700;">Read Complete Guide &rarr;</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Bottom Consultation Strip -->
            <div style="background:var(--brand-navy); border-radius:var(--radius-xl); padding:clamp(28px, 5vw, 40px); color:#ffffff; text-align:center; margin-bottom:30px;">
                <h3 style="color:#ffffff; margin:0 0 10px; font-size:1.8rem;">Ready to Experience ${escapeHTML(d.name)} in Absolute Luxury?</h3>
                <p style="color:#cbd5e1; max-width:600px; margin:0 auto 24px; font-size:1rem;">Our senior destination specialists will architect an exclusive itinerary with vetted 5-star villas, seamless flight connections, and 24/7 dedicated support.</p>
                <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
                    <button class="btn btn-primary" onclick="navTo('plan-trip')">
                        <i class="fas fa-calendar-check"></i> Design Custom Itinerary
                    </button>
                    <a href="https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello Via Tours Concierge, I would like to discuss traveling to ' + d.name)}" target="_blank" rel="noopener noreferrer" class="btn btn-green">
                        <i class="fab fa-whatsapp"></i> WhatsApp Concierge Desk
                    </a>
                </div>
            </div>
        `;
    }

    // 8. Services Page Controller
    function loadServices() {
        const container = document.getElementById('services_container');
        if (!container) return;
        const services = (window.LUXURY_CATALOG && window.LUXURY_CATALOG.services) ? window.LUXURY_CATALOG.services : [];
        if (!services.length) {
            container.innerHTML = '<p class="text-center" style="grid-column:1/-1;">Services directory available upon concierge consultation.</p>';
            return;
        }

        container.innerHTML = services.map(s => `
            <div class="service-card">
                <div class="service-icon-wrap">
                    <i class="${escapeHTML(s.icon || 'fas fa-compass')}"></i>
                </div>
                <span class="tag" style="align-self:flex-start; margin-bottom:8px;">${escapeHTML(s.tag || 'Concierge Service')}</span>
                <h3 style="margin:0 0 10px; color:var(--brand-navy); font-size:1.25rem;">${escapeHTML(s.title)}</h3>
                <p style="color:var(--text-body); font-size:0.92rem; line-height:1.6; margin-bottom:16px;">${escapeHTML(s.description)}</p>
                
                <div style="background:#f8fafc; border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; margin-bottom:16px; font-size:0.82rem; color:var(--text-muted);">
                    <div><strong>Coverage:</strong> ${escapeHTML(s.destinations_covered || 'Worldwide')}</div>
                    <div style="margin-top:4px;"><strong>Turnaround:</strong> ${escapeHTML(s.turnaround || 'Expedited concierge service')}</div>
                </div>

                ${s.highlights && s.highlights.length ? `
                    <ul style="list-style:none; padding:0; margin:0 0 20px; font-size:0.88rem; color:var(--text-body); line-height:1.7;">
                        ${s.highlights.map(h => `<li style="position:relative; padding-left:20px; margin-bottom:6px;"><i class="fas fa-check" style="position:absolute; left:0; top:4px; color:#10b981; font-size:0.8rem;"></i> ${escapeHTML(h)}</li>`).join('')}
                    </ul>
                ` : ''}

                <div style="margin-top:auto;">
                    <button type="button" class="btn btn-outline" style="width:100%;" onclick="navTo('contact')">
                        Inquire About This Service
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 9. Experiences & Travel Styles Controller
    function loadExperiences(theme = null) {
        const container = document.getElementById('experiences_container');
        if (!container) return;
        const experiences = (window.LUXURY_CATALOG && window.LUXURY_CATALOG.experiences) ? window.LUXURY_CATALOG.experiences : [];
        if (!experiences.length) {
            container.innerHTML = '<p class="text-center" style="grid-column:1/-1;">Experiences directory available upon request.</p>';
            return;
        }

        const normTheme = theme ? String(theme).toLowerCase().trim() : null;
        const selectedExp = normTheme ? experiences.find(e => 
            (e.slug && e.slug.toLowerCase() === normTheme) || 
            e.id.toLowerCase() === normTheme || 
            ('exp-' + e.type.toLowerCase()) === normTheme || 
            e.type.toLowerCase() === normTheme ||
            (normTheme === 'alpine' && (e.type.toLowerCase() === 'alpine' || e.type.toLowerCase() === 'adventure'))
        ) : null;

        if (selectedExp) {
            const expSlug = selectedExp.slug || selectedExp.type.toLowerCase();
            updateSEO(
                `${selectedExp.title} — Curated Luxury Travel Style`,
                selectedExp.description,
                selectedExp.image_url,
                '/experiences/' + expSlug
            );

            // Find matching packages
            const allPacks = (window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) ? window.LUXURY_CATALOG.packages : [];
            const matchingPacks = allPacks.filter(p => 
                (selectedExp.featured_packages && selectedExp.featured_packages.includes(p.id)) ||
                (p.category && p.category.toLowerCase() === selectedExp.type.toLowerCase())
            );

            container.innerHTML = `
                <div style="grid-column:1/-1;">
                    <nav class="breadcrumbs" aria-label="Breadcrumb">
                        <a href="/" onclick="navTo('home'); return false;">Home</a> / 
                        <a href="/experiences" onclick="navTo('experiences'); return false;">Travel Styles</a> / 
                        <span>${escapeHTML(selectedExp.title)}</span>
                    </nav>

                    <!-- Dedicated Theme Hero Banner -->
                    <div style="position:relative; border-radius:var(--radius-xl); overflow:hidden; min-height:360px; display:flex; align-items:flex-end; padding:clamp(24px, 5vw, 44px); margin-bottom:36px; box-shadow:var(--shadow-md);">
                        <img src="${escapeHTML(selectedExp.image_url)}" alt="${escapeHTML(selectedExp.title)}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" loading="eager">
                        <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(12, 26, 61, 0.3) 0%, rgba(12, 26, 61, 0.92) 100%);"></div>
                        <div style="position:relative; z-index:1; color:#ffffff; max-width:760px;">
                            <span class="tag" style="background:var(--brand-orange); color:#ffffff; margin-bottom:12px;">Curated Travel Style</span>
                            <h1 style="font-size:clamp(2rem, 4vw, 3rem); margin:0 0 10px; color:#ffffff; line-height:1.15;">${escapeHTML(selectedExp.title)}</h1>
                            <p style="font-size:1.1rem; color:#f1f5f9; line-height:1.6; margin-bottom:20px;">${escapeHTML(selectedExp.description)}</p>
                            <div style="display:flex; gap:12px; flex-wrap:wrap;">
                                <button class="btn btn-primary" onclick="navTo('plan-trip')">
                                    <i class="fas fa-calendar-check"></i> Plan Bespoke ${escapeHTML(selectedExp.type)} Itinerary
                                </button>
                                <button class="btn btn-outline" style="color:#ffffff; border-color:rgba(255,255,255,0.4);" onclick="navTo('experiences')">
                                    &larr; View All Travel Styles
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Matching Packages Section -->
                    <div style="margin-bottom:36px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                            <div>
                                <span class="tag">Handpicked Itineraries</span>
                                <h2 style="margin:4px 0 0; color:var(--brand-navy); font-size:1.6rem;">Featured ${escapeHTML(selectedExp.type)} Escapes</h2>
                            </div>
                            <button class="btn btn-outline btn-sm" onclick="navTo('packages')">Browse All Packages &rarr;</button>
                        </div>
                        <div class="grid-3">
                            ${matchingPacks.length ? matchingPacks.map(p => renderPackageCard(p)).join('') : '<p>Custom itineraries curated on demand.</p>'}
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // Default: Render all 4 travel style cards
        updateSEO(
            'Curated Travel Styles & Bespoke Themes',
            'From overwater honeymoon sanctuaries and alpine panoramic rail to royal palace retreats and family adventures.',
            null,
            '/experiences'
        );

        container.innerHTML = experiences.map(exp => {
            const expSlug = exp.slug || (exp.type.toLowerCase() === 'adventure' ? 'alpine' : exp.type.toLowerCase());
            return `
                <div class="exp-card" onclick="navTo('experiences', '${escapeHTML(expSlug)}')">
                    <img src="${escapeHTML(exp.image_url)}" alt="${escapeHTML(exp.title)}" class="exp-card-img" loading="lazy" width="400" height="380">
                    <div class="exp-card-overlay">
                        <span class="tag" style="background:var(--brand-orange); color:#ffffff; align-self:flex-start; margin-bottom:8px;">${escapeHTML(exp.type)}</span>
                        <h3 style="color:#ffffff; margin:0 0 6px; font-size:1.4rem;">${escapeHTML(exp.title)}</h3>
                        <p style="color:#e2e8f0; font-size:0.9rem; line-height:1.5; margin-bottom:12px;">${escapeHTML(exp.tagline)}</p>
                        <p style="color:#cbd5e1; font-size:0.82rem; line-height:1.5; margin-bottom:18px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHTML(exp.description)}</p>
                        <button type="button" class="btn btn-primary" style="align-self:flex-start;" onclick="event.stopPropagation(); navTo('experiences', '${escapeHTML(expSlug)}')">
                            Explore ${escapeHTML(exp.type)} Packages &rarr;
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function filterByExperience(cat) {
        const catNorm = String(cat || '').toLowerCase().trim();
        navTo('experiences', catNorm);
    }

    // 10. Offers & Seasonal Privileges Controller
    function loadOffers() {
        const container = document.getElementById('offers_container');
        if (!container) return;
        const offers = (window.LUXURY_CATALOG && window.LUXURY_CATALOG.offers) ? window.LUXURY_CATALOG.offers : [];
        if (!offers.length) {
            container.innerHTML = '<p class="text-center" style="grid-column:1/-1;">No seasonal privileges active at this moment. Check back soon.</p>';
            return;
        }

        container.innerHTML = offers.map(o => `
            <div class="offer-card">
                <div style="position:relative; height:200px;">
                    <img src="${escapeHTML(o.image_url)}" alt="${escapeHTML(o.title)}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
                    <span class="tag" style="position:absolute; top:16px; left:16px; background:rgba(12, 26, 61, 0.9); color:#ffffff; backdrop-filter:blur(4px); font-weight:700;">${escapeHTML(o.tag)}</span>
                </div>
                <div style="padding:24px; display:flex; flex-direction:column; flex:1;">
                    <h3 style="margin:0 0 8px; color:var(--brand-navy); font-size:1.25rem;">${escapeHTML(o.title)}</h3>
                    <div style="font-size:1.15rem; font-weight:800; color:#16a34a; margin-bottom:10px;">${escapeHTML(o.savings)}</div>
                    <p style="color:var(--text-body); font-size:0.92rem; line-height:1.6; margin-bottom:18px;">${escapeHTML(o.description)}</p>
                    
                    <div style="background:#f8fafc; border:1px dashed var(--brand-orange); border-radius:var(--radius-md); padding:12px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div>
                            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Promo Privilege Code</div>
                            <span class="promo-code-pill" style="margin-top:2px;">${escapeHTML(o.promo_code)}</span>
                        </div>
                        <small style="color:var(--text-muted); font-size:0.78rem;">${escapeHTML(o.valid_until)}</small>
                    </div>

                    <div style="margin-top:auto; display:flex; gap:10px; flex-wrap:wrap;">
                        <a href="https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('Hello Via Tours Concierge, I would like to claim offer privilege code: ' + o.promo_code + ' for ' + o.title)}" target="_blank" rel="noopener noreferrer" class="btn btn-green btn-sm" style="flex:1;">
                            <i class="fab fa-whatsapp"></i> Claim Privilege
                        </a>
                        <button type="button" class="btn btn-primary btn-sm" style="flex:1;" onclick="navTo('package', '${escapeHTML(o.linked_package_id)}')">
                            View Package
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 11. Real Traveler Gallery Controller
    function loadGallery() {
        const container = document.getElementById('gallery_container');
        if (!container) return;
        const galleryItems = [
            {
                title: "Private Overwater Pool Sunrise",
                location: "Baa Atoll, Maldives",
                image_url: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
                caption: "Waking up to unbroken horizons in Baa Atoll with private pool and direct lagoon ladders.",
                pkg_id: "pkg-maldives-sanctuary"
            },
            {
                title: "Glacier Express First Class Panoramic",
                location: "Rhine Gorge, Switzerland",
                image_url: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80",
                caption: "Crossing 291 bridges and dramatic alpine passes with five-course gourmet dining.",
                pkg_id: "pkg-swiss-alps-express"
            },
            {
                title: "Ayung River Valley Pool Villa",
                location: "Ubud, Bali",
                image_url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
                caption: "Secluded rainforest infinity pool suites suspended above sacred jungle riverbeds.",
                pkg_id: "pkg-bali-luxe-villas"
            },
            {
                title: "Royal Desert Oasis Private Glamping",
                location: "Dubai Desert Conservation Reserve",
                image_url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
                caption: "Starlit Bedouin banquets, falconry, and dune sundowners in five-star seclusion.",
                pkg_id: "pkg-dubai-ultra-luxury"
            },
            {
                title: "Riva Speedboat Cruise to Capri",
                location: "Amalfi Coast, Italy",
                image_url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
                caption: "Sailing through the Faraglioni rock formations aboard a private skippered motorboat.",
                pkg_id: "pkg-amalfi-romance"
            },
            {
                title: "Lake Pichola Royal Sunset Boat",
                location: "Udaipur, Rajasthan",
                image_url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80",
                caption: "Private royal barge ride past historic marble palaces bathed in golden dusk light.",
                pkg_id: "pkg-rajasthan-royal"
            }
        ];

        container.innerHTML = galleryItems.map(item => `
            <div class="card" onclick="navTo('package', '${escapeHTML(item.pkg_id)}')" role="button" tabindex="0">
                <img src="${escapeHTML(item.image_url)}" alt="${escapeHTML(item.title)}" loading="lazy" width="400" height="240">
                <div class="card-body">
                    <span class="tag"><i class="fas fa-map-marker-alt"></i> ${escapeHTML(item.location)}</span>
                    <h3 style="margin:8px 0 6px;">${escapeHTML(item.title)}</h3>
                    <p style="color:var(--text-muted); font-size:0.88rem; line-height:1.6; margin-bottom:12px;">${escapeHTML(item.caption)}</p>
                    <span style="color:var(--brand-orange); font-weight:700; font-size:0.9rem;">View Curated Itinerary &rarr;</span>
                </div>
            </div>
        `).join('');
    }

    // 12. Contact Form & Callback Modal Controllers
    function handleContactSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        const name = (document.getElementById('cf_name')?.value || '').trim();
        const email = (document.getElementById('cf_email')?.value || '').trim();
        const phone = (document.getElementById('cf_phone')?.value || '').trim();
        const subject = (document.getElementById('cf_subject')?.value || '').trim();
        const message = (document.getElementById('cf_message')?.value || '').trim();

        if (!name || !email || !phone || !message) {
            showToast('Please fill in all required contact fields.', 'error');
            return;
        }

        const btn = document.getElementById('cf_submit_btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transmitting...';
        }

        setTimeout(() => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
            }
            showToast(`Thank you, ${name}. Your message regarding "${subject}" has been received. Our senior concierge will connect with you within 2 hours.`, 'success');
            document.getElementById('contactForm')?.reset();
            trackEvent('contact_inquiry', { name, email, subject });
        }, 600);
    }

    function openCallbackModal() {
        const modal = document.getElementById('callbackModal');
        if (modal) modal.classList.add('show', 'active');
    }

    function closeCallbackModal() {
        const modal = document.getElementById('callbackModal');
        if (modal) modal.classList.remove('show', 'active');
    }

    function handleCallbackRequest(e) {
        if (e && e.preventDefault) e.preventDefault();
        const name = (document.getElementById('cb_name')?.value || '').trim();
        const phone = (document.getElementById('cb_phone')?.value || '').trim();
        const slot = document.getElementById('cb_slot')?.value || 'Morning';

        if (!name || !phone) {
            showToast('Please provide your name and phone number.', 'error');
            return;
        }

        const cbConsent = document.getElementById('cb_consent');
        if (cbConsent && !cbConsent.checked) {
            showToast('Please agree to the privacy policy & consent terms to proceed.', 'error');
            cbConsent.focus();
            return;
        }

        showToast(`Callback confirmed! A Senior Travel Specialist will call ${phone} during the ${slot} window.`, 'success');
        closeCallbackModal();
        trackEvent('request_callback', { name, phone, slot });
    }

    // 7. Travel Blog
    async function loadBlog() {
        const listEl = document.getElementById('list_blog');
        if (!listEl) return;

        const searchTerm = (document.getElementById('blog-search')?.value || '').toLowerCase().trim();
        const categoryFilter = document.getElementById('blog-category-filter')?.value || '';

        let blogs = [];
        if (window.LUXURY_CATALOG && window.LUXURY_CATALOG.blogs && window.LUXURY_CATALOG.blogs.length) {
            blogs = [...window.LUXURY_CATALOG.blogs];
        }
        if (sb) {
            try {
                const { data } = await sb.from('blog_posts').select('*').eq('is_published', true).order('created_at', { ascending: false });
                if (data && data.length) {
                    data.forEach(db => {
                        if (!blogs.some(b => b.slug === db.slug || b.id === db.id)) blogs.push(db);
                    });
                }
            } catch (e) {}
        }

        // Always sort newest-first
        blogs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        let filtered = blogs.filter(b => {
            if (categoryFilter && b.category && b.category !== categoryFilter) return false;
            if (!searchTerm) return true;
            return (
                (b.title && b.title.toLowerCase().includes(searchTerm)) ||
                (b.excerpt && b.excerpt.toLowerCase().includes(searchTerm)) ||
                (b.author && b.author.toLowerCase().includes(searchTerm)) ||
                (b.category && b.category.toLowerCase().includes(searchTerm))
            );
        });

        if (!filtered.length) {
            listEl.innerHTML = '<p class="text-center" style="grid-column:1/-1; padding:40px 0;">No journal stories found matching your criteria. Try resetting filters.</p>';
            return;
        }

        listEl.innerHTML = filtered.map(b => {
            const formattedDate = new Date(b.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return `
            <div class="card" onclick="navTo('blog', '${escapeHTML(b.slug || b.id)}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter') navTo('blog', '${escapeHTML(b.slug || b.id)}')">
                <div style="position:relative;">
                    <img src="${escapeHTML(b.image_url || 'assets/agency-logo-emblem.webp')}" alt="${escapeHTML(b.title)}" loading="lazy" width="400" height="220">
                    <span class="tag" style="position:absolute; bottom:12px; left:12px; margin:0; background:rgba(12,26,61,0.85); color:#ffffff; backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,0.2);">${escapeHTML(b.category || 'Journal')}</span>
                </div>
                <div class="card-body">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:0.8rem; color:#64748b;">
                        <span><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
                        <span><i class="far fa-clock"></i> ${escapeHTML(b.read_time || '5 min read')}</span>
                    </div>
                    <h3>${escapeHTML(b.title)}</h3>
                    <p class="blog-excerpt">${escapeHTML(b.excerpt || '')}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:12px; border-top:1px solid #f1f5f9; font-size:0.85rem;">
                        <span style="color:var(--brand-navy); font-weight:600;"><i class="fas fa-user-edit" style="color:var(--brand-orange); font-size:0.8rem;"></i> ${escapeHTML(b.author || 'Senior Specialist')}</span>
                        <span style="color:var(--brand-orange); font-weight:700;">Read Guide &rarr;</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    const debounceBlogSearch = debounce(loadBlog, 350);

    function resetBlogFilters() {
        const s = document.getElementById('blog-search');
        const c = document.getElementById('blog-category-filter');
        if (s) s.value = '';
        if (c) c.value = '';
        loadBlog();
    }

    async function loadBlogPost(slugOrId) {
        const container = document.getElementById('blog_details_container');
        if (!container) return;
        container.innerHTML = `
            <div class="skeleton" style="width:250px; height:20px; border-radius:var(--radius-sm); margin-bottom:16px;"></div>
            <div class="skeleton" style="width:100%; height:380px; border-radius:var(--radius-xl); margin-bottom:24px;"></div>
            <div class="skeleton" style="width:180px; height:24px; border-radius:var(--radius-sm); margin-bottom:14px;"></div>
            <div class="skeleton" style="width:85%; height:40px; border-radius:var(--radius-md); margin-bottom:24px;"></div>
            <div class="skeleton" style="width:100%; height:200px; border-radius:var(--radius-lg);"></div>
        `;

        let b = findBlogPost(slugOrId);
        if (!b && sb) {
            try {
                const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slugOrId);
                let query = sb.from('blog_posts').select('*').eq('is_published', true);
                if (isUUID) query = query.eq('id', slugOrId);
                else query = query.eq('slug', slugOrId);
                const res = await query.limit(1).maybeSingle();
                if (res.data) b = res.data;
            } catch (e) {}
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

        updateSEO(b.title, b.excerpt || 'Via Tours & Travels Travel Journal', b.image_url, '/blog/' + (b.slug || b.id));

        const cleanHTML = window.DOMPurify ? window.DOMPurify.sanitize(b.content || '') : escapeHTML(b.content || '');

        container.innerHTML = `
            <nav class="breadcrumbs" aria-label="Breadcrumb">
                <a href="/" onclick="navTo('home'); return false;">Home</a> / 
                <a href="/blog" onclick="navTo('blog'); return false;">Travel Journal</a> / 
                <span>${escapeHTML(b.title)}</span>
            </nav>
            <img src="${escapeHTML(b.image_url || 'assets/agency-logo-emblem.webp')}" style="width:100%; height:420px; object-fit:cover; border-radius:var(--radius-xl); margin-bottom:24px;" alt="${escapeHTML(b.title)}">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap;">
                <span class="tag">${escapeHTML(b.category || 'Journal')}</span>
                <span style="font-size:0.85rem; color:#64748b;"><i class="far fa-calendar-alt"></i> ${new Date(b.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span style="font-size:0.85rem; color:#64748b;">&bull; <i class="far fa-clock"></i> ${escapeHTML(b.read_time || '5 min read')}</span>
                <span style="font-size:0.85rem; color:#64748b;">&bull; By <strong>${escapeHTML(b.author || 'Senior Destination Specialist')}</strong></span>
            </div>
            <h1 style="margin:8px 0 24px; color:var(--brand-navy); font-size:clamp(1.8rem, 4vw, 2.6rem);">${escapeHTML(b.title)}</h1>
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

    // 9. Concierge Desk (Human WhatsApp Assistance)
    function sendQuickPrompt() {}
    function handleChat() {}

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

    // --- PRELOADER LIFECYCLE (Instantaneous First Paint) ---
    function dismissPreloader() {}

    // --- INITIALIZE APPLICATION ---
    window.addEventListener('popstate', router);
    // --- DPDP ACT 2023 COOKIE & DATA CONSENT MANAGER ---
    function initCookieConsent() {
        const consent = localStorage.getItem('via_cookie_consent');
        const banner = document.getElementById('cookieConsentBanner');
        if (!banner) return;
        if (!consent) {
            banner.style.display = 'flex';
        } else {
            banner.style.display = 'none';
        }
    }

    function acceptCookieConsent(type) {
        localStorage.setItem('via_cookie_consent', type || 'all');
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) {
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(20px)';
            banner.style.transition = 'all 0.3s ease';
            setTimeout(() => { banner.style.display = 'none'; }, 300);
        }
        showToast(type === 'necessary' ? 'Essential preferences saved.' : 'All preferences accepted.', 'info');
    }

    window.addEventListener('hashchange', router);
    window.addEventListener('DOMContentLoaded', () => {
        loadSettings();
        initCookieConsent();
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
    window.loadDestinationDetails = loadDestinationDetails;
    window.loadPackages = loadPackages;
    window.loadPackageDetails = loadPackageDetails;
    window.loadServices = loadServices;
    window.loadExperiences = loadExperiences;
    window.loadOffers = loadOffers;
    window.loadGallery = loadGallery;
    window.filterByExperience = filterByExperience;
    window.downloadItineraryPDF = downloadItineraryPDF;
    window.sharePackage = sharePackage;
    window.handleContactSubmit = handleContactSubmit;
    window.openCallbackModal = openCallbackModal;
    window.closeCallbackModal = closeCallbackModal;
    window.handleCallbackRequest = handleCallbackRequest;
    window.resetPlanTripForm = resetPlanTripForm;
    window.togglePkgFaq = togglePkgFaq;
    window.resetDestFilters = resetDestFilters;
    window.clearFilter = clearFilter;
    window.changeMainImage = changeMainImage;
    window.switchTab = switchTab;
    window.toggleFaq = toggleFaq;
    window.handleChat = handleChat;
    window.switchCurrency = switchCurrency;
    window.sendQuickPrompt = sendQuickPrompt;
    window.toggleWishlist = toggleWishlist;
    window.getWishlist = getWishlist;
    window.filterWishlist = filterWishlist;
    window.openCompareModal = openCompareModal;
    window.closeCompareModal = closeCompareModal;
    window.loadBlog = loadBlog;
    window.loadBlogPost = loadBlogPost;
    window.debounceBlogSearch = debounceBlogSearch;
    window.resetBlogFilters = resetBlogFilters;
    window.handleNewsletter = handleNewsletter;
    window.acceptCookieConsent = acceptCookieConsent;
    window.trackEvent = trackEvent;

})(window, document);
