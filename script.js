const SUPABASE_URL = window.SUPABASE_URL || 'https://goqwtovltftehautxekh.supabase.co';
const SUPABASE_KEY = window.SUPABASE_KEY || 'sb_publishable_bQXp8x_2x4ymx4_oxcOFUA_UTGsqF-5';
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
if (!sb) console.warn('Supabase client initialized in offline/catalog-fallback mode.');

let appSettings = { whatsapp: '919876543210' };
let currentItinerary = [];
let activeDestFilter = null;
let currentGallery = [];
let currentPackage = null;
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function debounce(fn, delay = 400) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

async function withLoading(button, fn) {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Saving...';
    try {
        await fn();
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmMessage').textContent = message;
    modal.style.display = 'flex';
    document.getElementById('confirmYes').onclick = () => { modal.style.display = 'none'; onConfirm(); };
    document.getElementById('confirmNo').onclick = () => { modal.style.display = 'none'; };
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
}

function toggleSidebar() {
    const side = document.getElementById('adminSide');
    const main = document.getElementById('adminMain');
    side.classList.toggle('collapsed');
    main.classList.toggle('expanded');
    isSidebarCollapsed = side.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
}

if (isSidebarCollapsed) {
    document.getElementById('adminSide')?.classList.add('collapsed');
    document.getElementById('adminMain')?.classList.add('expanded');
}

function toggleMenu() { document.getElementById('navMenu').classList.toggle('active'); }
function toggleChat() { document.getElementById('chatWindow').classList.toggle('active'); }

function updateSEO(title, desc) {
    document.title = title;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
    metaDesc.content = desc;
}

function navTo(page, id = null) {
    document.getElementById('navMenu').classList.remove('active');
    if (id) window.location.hash = '#/' + page + '/' + id;
    else window.location.hash = '#/' + page;
}

async function router() {
    const hash = window.location.hash || '#/home';
    const parts = hash.split('/');
    const page = parts[1] || 'home';
    const id = parts[2];

    if (page === 'admin') {
        window.location.href = 'admin.html';
        return;
    }
    const siteWrapper = document.getElementById('site-wrapper');
    const adminWrapper = document.getElementById('admin-wrapper');

    if (page === 'admin') {
        siteWrapper.style.display = 'none';
        adminWrapper.style.display = 'block';
        const { data: { session } } = await sb.auth.getSession();
        if (session) initAdminDashboard();
        return;
    }

    siteWrapper.style.display = 'block';
    adminWrapper.style.display = 'none';
    document.querySelectorAll('.page-view').forEach(p => p.style.display = 'none');
        const view = document.getElementById('page-' + page) || document.getElementById('page-home');
    view.style.display = 'block';
    window.scrollTo(0, 0);

    switch(page) {
        case 'home': loadHomeData(); updateSEO('Via Tours & Travels', 'Premium travel agency.'); break;
        default:
            if (view.id === 'page-home') loadHomeData();
            updateSEO('Via Tours & Travels', 'Premium travel agency.');
        case 'destinations': loadDestinations(); break;
        case 'packages': activeDestFilter = id || null; initPackageFilters(); loadPackages(); break;
        case 'blog': loadBlog(); break;
        case 'plan-trip': setupPlanForm(id); break;
        case 'package': if (id) loadPackageDetails(id); break;
        case 'blog-post': if (id) loadBlogPost(id); break;
        case 'about': updateSEO('About Via Tours & Travels | Trusted Tour Operator', 'Learn about Via Tours & Travels, a premium travel agency with 15+ years of experience.'); break;
        case 'contact': updateSEO('Contact Via Tours & Travels | Get in Touch', 'Reach our travel experts for custom packages, visa assistance, and 24/7 support.'); break;
        case 'terms': updateSEO('Terms & Conditions - Via Tours & Travels', 'Read the terms and conditions for using Via Tours & Travels services.'); break;
        case 'privacy': updateSEO('Privacy Policy - Via Tours & Travels', 'How Via Tours & Travels collects, uses, and protects your personal information.'); break;
    }
}
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

async function loadSettings() {
    const { data } = await sb.from('website_settings').select('*').eq('id', 1).single();
    if (data) {
        appSettings = data;
        const contactDiv = document.getElementById('contact_info');
        contactDiv.textContent = '';
        contactDiv.appendChild(document.createTextNode('Email: ' + data.email + ' | Phone: ' + data.phone));
        contactDiv.appendChild(document.createElement('br'));
        contactDiv.appendChild(document.createTextNode('Address: ' + (data.address || 'MG Road, Bengaluru, India')));
    }
}

async function loadHomeData() {
    // 1. Destinations
    let dests = [];
    if (sb) {
        try {
            const { data } = await sb.from('destinations').select('id, name, country, image_url').eq('is_published', true).limit(4);
            if (data && data.length) dests = data;
        } catch (e) { console.warn('Supabase dests fetch error:', e); }
    }
    if ((!dests || !dests.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations) {
        dests = window.LUXURY_CATALOG.destinations.slice(0, 4);
    }
    const homeDestEl = document.getElementById('home_destinations');
    if (homeDestEl) {
        homeDestEl.innerHTML = (dests||[]).length ? dests.map(d => `<div class="card" onclick="navTo('packages', '${escapeHTML(d.id)}')"><img src="${escapeHTML(d.image_url || '')}" alt="${escapeHTML(d.name)}" loading="lazy"><div class="card-body"><h3>${escapeHTML(d.name)}</h3><p>${escapeHTML(d.country || '')}</p></div></div>`).join('') : '<p>No destinations yet.</p>';
    }

    // 2. Packages
    let packs = [];
    if (sb) {
        try {
            const { data } = await sb.from('packages').select('id, title, price, duration, category, image_url, destination_id, destinations(name)').eq('is_published', true).limit(3);
            if (data && data.length) packs = data;
        } catch (e) { console.warn('Supabase packages fetch error:', e); }
    }
    if ((!packs || !packs.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) {
        packs = window.LUXURY_CATALOG.packages.slice(0, 3);
    }
    const homePackEl = document.getElementById('home_packages');
    if (homePackEl) {
        homePackEl.innerHTML = (packs||[]).length ? packs.map(p => `<div class="card" onclick="navTo('package', '${escapeHTML(p.id)}')"><img src="${escapeHTML(p.image_url || '')}" alt="${escapeHTML(p.title)}" loading="lazy"><div class="card-body"><span class="tag">${escapeHTML(p.category || 'Travel')}</span><h3>${escapeHTML(p.title)}</h3><p style="color:var(--text-muted); font-size:14px;">${escapeHTML(p.duration || '')} | ${escapeHTML(p.destinations?.name || p.destination_name || '')}</p><span class="price-tag">₹${Number(p.price).toLocaleString('en-IN')}</span></div></div>`).join('') : '<p>No packages yet.</p>';
    }

    // 3. Blog Posts
    let blogs = [];
    if (sb) {
        try {
            const { data } = await sb.from('blog_posts').select('id, slug, title, excerpt, image_url, created_at').eq('is_published', true).limit(3);
            if (data && data.length) blogs = data;
        } catch (e) { console.warn('Supabase blogs fetch error:', e); }
    }
    if ((!blogs || !blogs.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.blogs) {
        blogs = window.LUXURY_CATALOG.blogs.slice(0, 3);
    }
    const homeBlogEl = document.getElementById('home_blog');
    if (homeBlogEl) {
        homeBlogEl.innerHTML = (blogs||[]).length ? blogs.map(b => `<div class="card" onclick="navTo('blog-post', '${escapeHTML(b.slug || b.id)}')"><img src="${escapeHTML(b.image_url || '')}" alt="${escapeHTML(b.title)}" loading="lazy"><div class="card-body"><h3>${escapeHTML(b.title)}</h3><p>${escapeHTML(b.excerpt || '')}</p></div></div>`).join('') : '<p>No stories yet.</p>';
    }

    // 4. Testimonials
    let tests = [];
    if (sb) {
        try {
            const { data } = await sb.from('testimonials').select('name, message, image_url, location').limit(3);
            if (data && data.length) tests = data;
        } catch (e) { console.warn('Supabase testimonials fetch error:', e); }
    }
    if ((!tests || !tests.length) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.testimonials) {
        tests = window.LUXURY_CATALOG.testimonials.slice(0, 3);
    }
    const homeTestEl = document.getElementById('home_testimonials');
    if (homeTestEl) {
        homeTestEl.innerHTML = (tests||[]).length ? tests.map(t => `<div class="card"><div class="card-body"><p style="font-style:italic; margin-bottom:12px;">"${escapeHTML(t.message || t.quote || '')}"</p><h4 style="margin:0; color:var(--text-dark);">${escapeHTML(t.name || 'VIP Client')}</h4><small style="color:var(--text-muted);">${escapeHTML(t.location || t.city || 'Verified Guest')}</small></div></div>`).join('') : '<p>No testimonials yet.</p>';
    }

    loadHomeFaqs();
}

async function loadDestinations() {
    const searchTerm = (document.getElementById('dest-search')?.value || '').toLowerCase();
    const countryFilter = document.getElementById('dest-country-filter')?.value || '';
    const sortVal = document.getElementById('dest-sort')?.value || 'name_asc';

    let data = null;
    let error = null;
    if (sb) {
        try {
            let query = sb.from('destinations').select('id, name, country, region, image_url').eq('is_published', true);
            if (countryFilter) query = query.eq('country', countryFilter);
            const res = await query;
            data = res.data;
            error = res.error;
        } catch (err) { error = err; }
    }
    if ((error || !data || data.length === 0) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.destinations) {
        data = window.LUXURY_CATALOG.destinations;
        if (countryFilter) data = data.filter(d => d.country === countryFilter);
        error = null;
    }

    if (error || !data || data.length === 0) {
        document.getElementById('list_destinations').innerHTML = '<p class="text-center">No destinations available right now.</p>';
        return;
    }

    let filtered = data.filter(d => {
        if (!searchTerm) return true;
        return (d.name?.toLowerCase().includes(searchTerm) || d.country?.toLowerCase().includes(searchTerm) || d.region?.toLowerCase().includes(searchTerm));
    });

    switch(sortVal) {
        case 'name_desc': filtered.sort((a,b) => b.name.localeCompare(a.name)); break;
        case 'country_asc': filtered.sort((a,b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name)); break;
        default: filtered.sort((a,b) => a.name.localeCompare(b.name));
    }

    const grouped = {};
    filtered.forEach(d => { const c = d.country || 'Other'; if (!grouped[c]) grouped[c] = []; grouped[c].push(d); });

    let html = '';
    for (const country in grouped) {
        html += `<div class="country-group"><h3>${escapeHTML(country)}</h3><div class="grid-4">`;
        grouped[country].forEach(d => { html += `<div class="card" onclick="navTo('packages', '${escapeHTML(d.id)}')"><img src="${escapeHTML(d.image_url || 'https://via.placeholder.com/400x300')}" alt="${escapeHTML(d.name)}"><div class="card-body"><h4>${escapeHTML(d.name)}</h4></div></div>`; });
        html += '</div></div>';
    }
    document.getElementById('list_destinations').innerHTML = html || '<p class="text-center">No destinations found.</p>';
}

async function populateCountryFilter() {
    const { data, error } = await sb.from('destinations').select('country').eq('is_published', true);
    if (error) return;
    const countries = [...new Set(data.map(d => d.country).filter(Boolean))].sort();
    const select = document.getElementById('dest-country-filter');
    if (select) select.innerHTML = '<option value="">All Countries</option>' + countries.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
}

const debounceDestSearch = debounce(loadDestinations, 400);

function resetDestFilters() {
    document.getElementById('dest-search').value = '';
    document.getElementById('dest-country-filter').value = '';
    document.getElementById('dest-sort').value = 'name_asc';
    loadDestinations();
}

function clearFilter() {
    activeDestFilter = null;
    document.getElementById('pkg_search').value = '';
    document.getElementById('filter-destination').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-min-price').value = '';
    document.getElementById('filter-max-price').value = '';
    document.getElementById('pkg_sort').value = 'new';
    window.location.hash = '#/packages';
    loadPackages(); // Force reload because hash may not change
}

const debounceSearch = debounce(loadPackages, 400);

async function initPackageFilters() {
    const destSelect = document.getElementById('filter-destination');
    if (destSelect && destSelect.options.length <= 1) {
        const { data } = await sb.from('destinations').select('id, name').eq('is_published', true).order('name');
        destSelect.innerHTML = '<option value="">All Destinations</option>' + (data||[]).map(d => `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)}</option>`).join('');
    }
}

function renderSkeletons(containerId = 'list_packages', count = 6) {
    const container = document.getElementById(containerId);
    let html = '';
    for (let i = 0; i < count; i++) { html += `<div class="skel-card"><div class="skeleton skel-img"></div><div class="skel-body"><div class="skeleton skel-line" style="width:60%"></div><div class="skeleton skel-line" style="width:40%"></div><div class="skeleton skel-line" style="width:30%; height:24px; margin-top:15px;"></div></div></div>`; }
    container.innerHTML = html;
}

async function loadPackages() {
    renderSkeletons('list_packages', 6);
    const term = (document.getElementById('pkg_search')?.value || '').toLowerCase();
    const sortVal = document.getElementById('pkg_sort')?.value || 'new';
    const filterDest = document.getElementById('filter-destination')?.value || activeDestFilter || '';
    const filterCat = document.getElementById('filter-category')?.value || '';
    const minPrice = document.getElementById('filter-min-price')?.value;
    const maxPrice = document.getElementById('filter-max-price')?.value;

    let query = sb.from('packages').select('id, title, price, duration, category, image_url, destination_id, destinations(name, country)').eq('is_published', true);
    if (filterDest) query = query.eq('destination_id', filterDest);
    if (filterCat) query = query.eq('category', filterCat);
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));

    let data = null;
    let error = null;
    if (sb) {
        try {
            const res = await query;
            data = res.data;
            error = res.error;
        } catch (err) {
            error = err;
        }
    }
    if ((error || !data || data.length === 0) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) {
        data = window.LUXURY_CATALOG.packages;
        error = null;
    }
    if (error && (!data || data.length === 0)) { document.getElementById('list_packages').innerHTML = '<p class="text-center">Error loading packages.</p>'; return; }

    let filtered = (data || []).filter(p => p.title?.toLowerCase().includes(term) || (p.duration || '').toLowerCase().includes(term));
    if (sortVal === 'price_asc') filtered.sort((a,b) => a.price - b.price);
    else if (sortVal === 'price_desc') filtered.sort((a,b) => b.price - a.price);

    let emptyText = filterDest ? 'No packages found for this destination.' : 'No packages match your filters.';
    document.getElementById('list_packages').innerHTML = filtered.length ? filtered.map(p => `<div class="card" onclick="navTo('package', '${escapeHTML(p.id)}')"><img src="${escapeHTML(p.image_url || '')}" alt="${escapeHTML(p.title)}"><div class="card-body"><span class="tag">${escapeHTML(p.category || 'Travel')}</span><h3>${escapeHTML(p.title)}</h3><p style="color:var(--text-muted); font-size:14px;">${escapeHTML(p.duration || '')} | ${escapeHTML(p.destinations?.name || '')}</p><span class="price-tag">₹${Number(p.price).toLocaleString('en-IN')}</span></div></div>`).join('') : `<p class="text-center" style="grid-column:1/-1;">${escapeHTML(emptyText)}</p>`;
}

async function loadPackageDetails(id) {
    document.getElementById('pkg_details_container').innerHTML = '<p>Loading...</p>';
    let p = null;
    let error = null;
    if (sb) {
        try {
            const res = await sb.from('packages').select('*, destinations(name)').eq('id', id).maybeSingle();
            p = res.data;
            error = res.error;
        } catch (err) { error = err; }
    }
    if (!p && window.LUXURY_CATALOG && window.LUXURY_CATALOG.packages) {
        p = window.LUXURY_CATALOG.packages.find(pkg => pkg.id === id || String(pkg.id) === String(id));
        if (p) error = null;
    }
    if (error || !p) { document.getElementById('pkg_details_container').innerHTML = '<p>Package not found.</p>'; return; }
    currentPackage = p;
    updateSEO(p.title + ' - Via Tours', p.short_description || p.description);

    const allImages = [p.image_url, ...(p.gallery_images || [])].filter(Boolean);
    const galleryHTML = allImages.length > 0 ? `<img src="${escapeHTML(allImages[0])}" id="main-image" class="main-image" alt="${escapeHTML(p.title)}"><div class="thumbnail-container">${allImages.map((img, i) => `<img src="${escapeHTML(img)}" class="thumbnail ${i===0?'active':''}" onclick="changeMainImage(this, '${escapeHTML(img)}')" alt="Thumbnail">`).join('')}</div>` : '';

    document.getElementById('pkg_details_container').innerHTML = `<div class="pkg-gallery"><div>${galleryHTML}<h1>${escapeHTML(p.title)}</h1><p style="color:var(--text-muted); margin-bottom:20px;"><i class="fas fa-clock"></i> ${escapeHTML(p.duration || 'N/A')} | <i class="fas fa-map-marker-alt"></i> ${escapeHTML(p.destinations?.name || 'Various')}</p><div class="info-tabs"><button class="tab-btn active" onclick="switchTab(event, 'itinerary')">Itinerary</button><button class="tab-btn" onclick="switchTab(event, 'inclusions')">Inclusions</button><button class="tab-btn" onclick="switchTab(event, 'exclusions')">Exclusions</button>${p.important_info && p.important_info.length ? '<button class="tab-btn" onclick="switchTab(event, \'important\')">Important Info</button>' : ''}</div><div id="tab-content"></div></div><div><div style="background:var(--bg-light); padding:30px; border-radius:12px; position:sticky; top:100px; text-align:center;"><h2 class="price-tag" style="font-size:2.5rem; margin-bottom:0;">₹${Number(p.price).toLocaleString('en-IN')}</h2><p style="margin-bottom:20px; color:var(--text-muted);">Per person</p><a href="https://wa.me/${escapeHTML(appSettings.whatsapp)}?text=${encodeURIComponent('I am interested in ' + p.title)}" target="_blank" class="btn btn-green" style="width:100%; margin-bottom:10px;">WhatsApp</a><button class="btn btn-primary" style="width:100%;" onclick="navTo('plan-trip', '${escapeHTML(p.id)}')">Enquire Now</button></div></div></div>`;
    renderTabContent(p, 'itinerary');
}

function changeMainImage(elem, url) {
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    elem.classList.add('active');
    document.getElementById('main-image').src = url;
}

function switchTab(evt, tab) {
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    evt.currentTarget.classList.add('active');
    if (currentPackage) renderTabContent(currentPackage, tab);
}

function renderTabContent(pkg, tab) {
    const c = document.getElementById('tab-content');
    if (tab === 'itinerary') {
        c.innerHTML = pkg.itinerary && pkg.itinerary.length ? pkg.itinerary.map(d => `<div style="margin-bottom:15px; padding:15px; background:var(--bg-light); border-radius:8px; border-left:4px solid var(--brand-blue);"><strong>${escapeHTML(d.title)}</strong><p style="white-space: pre-wrap; margin-top:5px; margin-bottom:0;">${escapeHTML(d.desc || d.description || '')}</p></div>`).join('') : '<p>No itinerary available.</p>';
    } else if (tab === 'inclusions') {
        c.innerHTML = '<ul style="list-style: disc; padding-left: 20px; margin: 0;">' + (pkg.inclusions && pkg.inclusions.length ? pkg.inclusions.map(i => `<li style="margin-bottom:5px;">${escapeHTML(i)}</li>`).join('') : '<li>N/A</li>') + '</ul>';
    } else if (tab === 'exclusions') {
        c.innerHTML = '<ul style="list-style: disc; padding-left: 20px; margin: 0;">' + (pkg.exclusions && pkg.exclusions.length ? pkg.exclusions.map(i => `<li style="margin-bottom:5px;">${escapeHTML(i)}</li>`).join('') : '<li>N/A</li>') + '</ul>';
    } else if (tab === 'important') {
        c.innerHTML = '<ul style="list-style: disc; padding-left: 20px; margin: 0;">' + (pkg.important_info && pkg.important_info.length ? pkg.important_info.map(i => `<li style="margin-bottom:5px;">${escapeHTML(i)}</li>`).join('') : '<li>N/A</li>') + '</ul>';
    }
}

async function setupPlanForm(pkgId) {
    document.getElementById('pt_pkg_id').value = '';
    document.getElementById('pt_dest').value = '';
    if (pkgId) {
        const { data: p } = await sb.from('packages').select('id, title, destination_id, destinations(name)').eq('id', pkgId).maybeSingle();
        if (p) { document.getElementById('pt_pkg_id').value = p.id; document.getElementById('pt_dest').value = p.destinations?.name || p.title; }
    }
}

document.getElementById('planTripForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check honeypot
    if (document.getElementById('honeypot').value) {
        showToast('Spam detected.', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        // Trim all text inputs to reject whitespace
        const name = document.getElementById('pt_name').value.trim();
        const email = document.getElementById('pt_email').value.trim();
        const phone = document.getElementById('pt_phone').value.trim();
        const destination = document.getElementById('pt_dest').value.trim();
        const travelDates = document.getElementById('pt_dates').value.trim();
        const travelers = document.getElementById('pt_travelers').value.trim();
        const budget = document.getElementById('pt_budget').value.trim();
        const requirements = document.getElementById('pt_req').value.trim();

        if (!name || !email || !phone) {
            showToast('Please fill all required fields.', 'error');
            return;
        }

        const payload = {
            name,
            email,
            phone,
            destination,
            travel_dates: travelDates,
            travelers,
            budget,
            hotel_pref: document.getElementById('pt_hotel').value,
            requirements,
            package_id: document.getElementById('pt_pkg_id').value || null,
            status: 'New'
        };

        const { error } = await sb.from('enquiries').insert([payload]);
        if (error) {
            showToast('Error submitting request. Please try again.', 'error');
        } else {
            const { data: cust } = await sb.from('customers').select('id').eq('email', payload.email).maybeSingle();
            if (!cust) {
                await sb.from('customers').insert([{ name: payload.name, email: payload.email, phone: payload.phone, whatsapp: payload.phone }]);
            }
            showToast('Trip request submitted! We will contact you soon.', 'success');
            navTo('home');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Enquiry';
    }
});

async function loadBlog() {
    const { data, error } = await sb.from('blog_posts').select('id, slug, title, excerpt, image_url, created_at').eq('is_published', true).order('created_at', { ascending: false });
    if (error) { document.getElementById('list_blog').innerHTML = '<p class="text-center" style="grid-column:1/-1;">Error loading blogs.</p>'; return; }
    document.getElementById('list_blog').innerHTML = (data||[]).length ? data.map(b => `<div class="card" onclick="navTo('blog-post', '${escapeHTML(b.slug || b.id)}')"><img src="${escapeHTML(b.image_url || 'https://via.placeholder.com/400x300')}" alt="${escapeHTML(b.title)}"><div class="card-body"><span class="tag">${new Date(b.created_at).toLocaleDateString()}</span><h3>${escapeHTML(b.title)}</h3><p class="blog-excerpt">${escapeHTML(b.excerpt || '')}</p><span style="color:var(--brand-blue); font-weight:600;">Read More <i class="fas fa-arrow-right"></i></span></div></div>`).join('') : '<p class="text-center" style="grid-column:1/-1;">No blog posts yet.</p>';
}

async function loadBlogPost(slugOrId) {
    document.getElementById('blog_details_container').innerHTML = '<p>Loading...</p>';
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slugOrId);
    let query = sb.from('blog_posts').select('*').eq('is_published', true);
    if (isUUID) query = query.eq('id', slugOrId); else query = query.eq('slug', slugOrId);
    const { data: b, error } = await query.limit(1).maybeSingle();

    if (error || !b) { document.getElementById('blog_details_container').innerHTML = '<p>Blog post not found. <a onclick="navTo(\'blog\')" style="color:var(--brand-blue); cursor:pointer;">Back to Blog</a></p>'; return; }

    if (b.meta_title) updateSEO(b.meta_title, b.meta_description || b.excerpt);
    else updateSEO(b.title + ' - Via Tours Blog', b.excerpt || 'Read our latest blog post.');

    const contentDiv = document.createElement('div');
    contentDiv.className = 'blog-content';
    contentDiv.style.marginTop = '20px';
    contentDiv.innerHTML = DOMPurify.sanitize(b.content || '');  // Render HTML because admin provides formatted content

    document.getElementById('blog_details_container').innerHTML = `<img src="${escapeHTML(b.image_url || 'https://via.placeholder.com/800x400')}" style="width:100%; height:400px; object-fit:cover; border-radius:12px; margin-bottom:30px;"><span class="tag">${new Date(b.created_at).toLocaleDateString()}</span><h1>${escapeHTML(b.title)}</h1>`;
    document.getElementById('blog_details_container').appendChild(contentDiv);
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-outline';
    backBtn.style.marginTop = '40px';
    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Blog';
    backBtn.onclick = () => navTo('blog');
    document.getElementById('blog_details_container').appendChild(backBtn);
}

async function loadHomeFaqs() {
    let data = null;
    let error = null;
    if (sb) {
        try {
            const res = await sb.from('faqs').select('id, question, answer').eq('is_published', true).order('created_at', { ascending: true });
            data = res.data;
            error = res.error;
        } catch (err) { error = err; }
    }
    if ((error || !data || data.length === 0) && window.LUXURY_CATALOG && window.LUXURY_CATALOG.faqs) {
        data = window.LUXURY_CATALOG.faqs;
        error = null;
    }
    const faqContainer = document.getElementById('home_faqs');
    if (error || !data || data.length === 0) { if (faqContainer) faqContainer.innerHTML = '<p class="text-center">No FAQs available right now.</p>'; return; }
    faqContainer.innerHTML = data.map((f, i) => `<div style="margin-bottom:15px; border:1px solid var(--border); border-radius:12px; overflow:hidden; background:#fff;"><div onclick="toggleFaq(${i})" style="padding:20px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; font-weight:600; color:var(--text-dark);">${escapeHTML(f.question)}<i class="fas fa-chevron-down" id="faq-icon-${i}" style="transition:transform 0.3s ease;"></i></div><div id="faq-answer-${i}" style="display:none; padding:0 20px 20px; color:var(--text-body); border-top:1px solid var(--border);"><p style="margin-top:15px; white-space:pre-wrap;">${escapeHTML(f.answer || '')}</p></div></div>`).join('');
}

function toggleFaq(index) {
    const answer = document.getElementById('faq-answer-' + index);
    const icon = document.getElementById('faq-icon-' + index);
    if (answer.style.display === 'none' || answer.style.display === '') { answer.style.display = 'block'; icon.style.transform = 'rotate(180deg)'; }
    else { answer.style.display = 'none'; icon.style.transform = 'rotate(0deg)'; }
}

function handleChat(e) {
    if (e.type === 'keypress' && e.key !== 'Enter') return;
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    const chatBody = document.getElementById('chatBody');
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.textContent = msg;
    chatBody.appendChild(userDiv);
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
        let res = "I can help with packages, destinations, and bookings!";
        const m = msg.toLowerCase();
        if (m.includes('book') || m.includes('plan') || m.includes('enquiry')) res = "You can plan your trip by clicking 'Plan My Trip' in the menu!";
        else if (m.includes('package') || m.includes('tour')) res = "Check our 'Packages' page for detailed itineraries and pricing!";
        else if (m.includes('destination') || m.includes('place')) res = "Click 'Destinations' to see featured spots!";
        else if (m.includes('contact') || m.includes('phone') || m.includes('email')) res = "Reach us at " + (appSettings.phone || 'our contact number') + " or email " + (appSettings.email || 'us') + ".";
        else if (m.includes('visa') || m.includes('passport')) res = "We provide visa assistance for 80+ countries!";
        else if (m.includes('price') || m.includes('cost') || m.includes('budget')) res = "Prices vary by destination. Check 'Packages' or fill 'Plan My Trip' for a custom quote!";
        else if (m.includes('hi') || m.includes('hello')) res = "Hello! How can I assist you today?";
        const botDiv = document.createElement('div');
        botDiv.className = 'chat-msg bot';
        botDiv.textContent = res;
        chatBody.appendChild(botDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 600);
}

// ===== ADMIN FUNCTIONS =====
let loginAttempts = 0;
let lockoutUntil = 0;

async function adminLogin() {
    const now = Date.now();
    if (now < lockoutUntil) {
        showToast(`Too many attempts. Try again in ${Math.ceil((lockoutUntil - now) / 1000)}s`, 'error');
        return;
    }

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;

    if (!email || !password) {
        showToast('Please enter email and password.', 'error');
        return;
    }

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
        loginAttempts++;
        if (loginAttempts >= 5) {
            lockoutUntil = Date.now() + 60000; // 1 minute lockout
            loginAttempts = 0;
            showToast('Too many failed attempts. Locked for 1 minute.', 'error');
        } else {
            showToast(`Login failed (${loginAttempts}/5): ${error.message}`, 'error');
        }
        return;
    }
    loginAttempts = 0;
    initAdminDashboard();
}

async function forgotPassword() {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) {
        showToast('Please enter your admin email address.', 'error');
        return;
    }
    const { error } = await sb.auth.resetPasswordForEmail(email);
    if (error) {
        showToast('Error sending reset email: ' + error.message, 'error');
    } else {
        showToast('Password reset link sent to your email.', 'success');
    }
}

async function logout() { await sb.auth.signOut(); window.location.hash = '#/home'; router(); }

async function initAdminDashboard() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    loadAdminStats();
    loadAdminPackages();
    loadAdminDestinations();
    loadAdminEnquiries();
    loadAdminCustomers();
    loadAdminBookings();
    loadAdminBlog();
    loadAdminFaqs();
    loadAdminTestimonials();
    loadAdminSettings();
    loadDestDropdown();
    populateCountryFilter();
}

function showAdminTab(tab, ev) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    const target = document.getElementById('tab-' + tab);
    if (target) target.style.display = 'block';
    document.querySelectorAll('.admin-menu li').forEach(li => li.classList.remove('active'));
    if (ev && ev.currentTarget) ev.currentTarget.classList.add('active');
    switch(tab) {
        case 'packages': loadAdminPackages(); break;
        case 'destinations': loadAdminDestinations(); break;
        case 'enquiries': loadAdminEnquiries(); break;
        case 'customers': loadAdminCustomers(); break;
        case 'bookings': loadAdminBookings(); break;
        case 'blog': loadAdminBlog(); break;
        case 'faqs': loadAdminFaqs(); break;
        case 'testimonials': loadAdminTestimonials(); break;
        case 'settings': loadAdminSettings(); break;
    }
}

async function loadAdminStats() {
    const [enqTotalRes, newEnqRes, p, b, c] = await Promise.all([
        sb.from('enquiries').select('id', { count: 'exact', head: true }),
        sb.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'New'),
        sb.from('packages').select('id', { count: 'exact', head: true }).eq('is_published', true),
        sb.from('bookings').select('amount_paid, balance, booking_status, travel_date, customer_name'),
        sb.from('customers').select('id', { count: 'exact', head: true })
    ]);

    const totalEnq = enqTotalRes.count || 0;
    const newEnq = newEnqRes.count || 0;
    const totalPkg = p.count || 0;
    const totalCust = c.count || 0;
    const rev = (b.data || []).reduce((sum, x) => sum + (x.amount_paid || 0), 0);
    const bal = (b.data || []).reduce((sum, x) => sum + (x.balance || 0), 0);

    document.getElementById('stat_enq').textContent = totalEnq;
    document.getElementById('stat_new_enq').textContent = newEnq;
    document.getElementById('stat_pkg').textContent = totalPkg;
    document.getElementById('stat_cust').textContent = totalCust;
    document.getElementById('stat_revenue').textContent = '₹' + rev.toLocaleString('en-IN');
    document.getElementById('stat_balance').textContent = '₹' + bal.toLocaleString('en-IN'); 

    // Recent enquiries (still need a separate fetch for display)
    const { data: recentEnqData } = await sb.from('enquiries')
        .select('name, destination, status')
        .order('created_at', { ascending: false })
        .limit(5);
    document.getElementById('table_recent_enq').innerHTML = (recentEnqData || []).map(x => `<tr><td>${escapeHTML(x.name)}</td><td>${escapeHTML(x.destination || 'N/A')}</td><td>${escapeHTML(x.status || 'New')}</td></tr>`).join('');

    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 30);
    const upcoming = (b.data || []).filter(x => { const d = new Date(x.travel_date); return d >= now && d <= future && x.booking_status !== 'Cancelled'; }).slice(0, 5);
    document.getElementById('table_upcoming_book').innerHTML = upcoming.map(x => `<tr><td>${escapeHTML(x.customer_name || 'N/A')}</td><td>${new Date(x.travel_date).toLocaleDateString()}</td></tr>`).join('');

    const statuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    const counts = statuses.map(s => (b.data || []).filter(x => x.booking_status === s).length);
    const max = Math.max(...counts, 1);
    let chartContainer = document.getElementById('bookings-chart-container');
    if (!chartContainer) {
        chartContainer = document.createElement('div');
        chartContainer.id = 'bookings-chart-container';
        chartContainer.style.marginTop = '40px';
        chartContainer.style.background = '#fff';
        chartContainer.style.padding = '20px';
        chartContainer.style.borderRadius = '12px';
        chartContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        document.querySelector('#tab-dashboard').appendChild(chartContainer);
    }
    chartContainer.innerHTML = `<h3>Bookings by Status</h3><div style="display:flex; align-items:flex-end; gap:15px; height:200px; padding-top:20px; padding-bottom:30px;">${statuses.map((s, i) => `<div style="flex:1; background:var(--brand-blue); text-align:center; color:#fff; border-radius:8px 8px 0 0; position:relative; min-height:5px; height:${(counts[i] / max) * 100}%">${counts[i]}<span style="position:absolute; bottom:-25px; left:0; right:0; font-size:12px; color:var(--text-muted);">${s}</span></div>`).join('')}</div>`;
}

async function uploadImage(file) {
    const fileName = Date.now() + '_' + Math.floor(Math.random() * 1000) + '_' + file.name;
    const { data, error } = await sb.storage.from('package-images').upload(fileName, file);
    if (error) { showToast('Image upload failed: ' + error.message, 'error'); return null; }
    return SUPABASE_URL + '/storage/v1/object/public/package-images/' + fileName;
}

function addItinDay(day = null) {
    currentItinerary.push(day || { title: 'Day ' + (currentItinerary.length + 1), desc: '' });
    renderItinEditor();
}
function renderItinEditor() {
    const editor = document.getElementById('itin_editor');
    editor.innerHTML = currentItinerary.map((d, i) => `<div class="itin-day"><input value="${escapeHTML(d.title)}" oninput="currentItinerary[${i}].title = this.value" placeholder="Day title"><textarea placeholder="Day description" oninput="currentItinerary[${i}].desc = this.value">${escapeHTML(d.desc)}</textarea><button type="button" onclick="currentItinerary.splice(${i},1); renderItinEditor();" style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-top:5px;">Remove</button></div>`).join('');
}

function renderGalleryPreview() {
    const previewDiv = document.getElementById('gallery_preview');
    if (!previewDiv) return;
    if (!currentGallery || currentGallery.length === 0) { previewDiv.style.display = 'none'; previewDiv.innerHTML = ''; return; }
    previewDiv.style.display = 'grid';
    previewDiv.innerHTML = currentGallery.map((url, index) => `<div style="position:relative; border:1px solid var(--border); border-radius:8px; overflow:hidden;"><img src="${escapeHTML(url)}" style="width:100%; height:80px; object-fit:cover;"><button type="button" onclick="removeGalleryImage(${index})" style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.9); color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1;">&times;</button></div>`).join('');
}
function removeGalleryImage(index) { currentGallery.splice(index, 1); renderGalleryPreview(); }

async function loadAdminPackages() {
    const { data } = await sb.from('packages').select('id, title, price, is_published, image_url, destinations(name)').order('created_at', { ascending: false });
    document.getElementById('table_packages').innerHTML = (data||[]).map(p => `<tr><td><input type="checkbox" class="package-checkbox" value="${escapeHTML(p.id)}" onchange="updateBulkBar('packages')"></td><td><img src="${escapeHTML(p.image_url || '')}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td><td>${escapeHTML(p.title)}<br><small>${escapeHTML(p.destinations?.name || '')}</small></td><td>₹${Number(p.price).toLocaleString('en-IN')}</td><td>${p.is_published ? 'Live' : 'Hidden'}</td><td><button class="btn-blue" style="background:var(--brand-blue); color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right:5px;" onclick="editPackage('${escapeHTML(p.id)}')">Edit</button><button style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="delItem('packages', '${escapeHTML(p.id)}')">Delete</button></td></tr>`).join('');
    document.getElementById('pkg-bulk-actions').style.display = 'none';
    document.getElementById('select-all-packages').checked = false;
}

function openPkgModal() {
    document.getElementById('pkgFormModal').style.display = 'block';
    document.getElementById('m_pkg_id').value = '';
    document.getElementById('pkg_modal_title').innerText = 'Add Package';
    document.querySelectorAll('#pkgFormModal input, #pkgFormModal textarea').forEach(i => { if(i.type !== 'hidden') i.value = ''; });
    document.getElementById('m_pkg_img').value = '';
    document.getElementById('m_pkg_gallery').value = '';
    document.getElementById('m_pkg_img').dataset.existing = '';
    currentGallery = []; renderGalleryPreview(); currentItinerary = []; renderItinEditor(); loadDestDropdown();
}

async function editPackage(id) {
    const { data: p } = await sb.from('packages').select('*').eq('id', id).single();
    if (!p) return;
    document.getElementById('pkgFormModal').style.display = 'block';
    document.getElementById('pkg_modal_title').innerText = 'Edit Package';
    document.getElementById('m_pkg_id').value = p.id;
    document.getElementById('m_pkg_title').value = p.title;
    document.getElementById('m_pkg_price').value = p.price;
    document.getElementById('m_pkg_cat').value = p.category || '';
    document.getElementById('m_pkg_duration').value = p.duration || '';
    document.getElementById('m_pkg_dest').value = p.destination_id || '';
    document.getElementById('m_pkg_short_desc').value = p.short_description || '';
    document.getElementById('m_pkg_desc').value = p.description || '';
    document.getElementById('m_pkg_inc').value = p.inclusions ? p.inclusions.join('\n') : '';
    document.getElementById('m_pkg_exc').value = p.exclusions ? p.exclusions.join('\n') : '';
    document.getElementById('m_pkg_imp').value = p.important_info ? p.important_info.join('\n') : '';
    document.getElementById('m_pkg_pub').value = p.is_published ? 'true' : 'false';
    currentItinerary = p.itinerary || []; renderItinEditor();
    document.getElementById('m_pkg_img').dataset.existing = p.image_url || '';
    currentGallery = p.gallery_images || []; renderGalleryPreview();
    loadDestDropdown();
}

async function savePackage() {
    const btn = document.querySelector('#pkgFormModal .btn-blue');
    await withLoading(btn, async () => {
        const id = document.getElementById('m_pkg_id').value;
        let imageUrl = document.getElementById('m_pkg_img').dataset.existing || '';
        let galleryUrls = [...currentGallery];
        const imgFile = document.getElementById('m_pkg_img').files[0];
        if (imgFile) { imageUrl = await uploadImage(imgFile); if (!imageUrl) return; }
        const galleryFiles = document.getElementById('m_pkg_gallery').files;
        if (galleryFiles.length > 0) { for (let i = 0; i < galleryFiles.length; i++) { const url = await uploadImage(galleryFiles[i]); if (url) galleryUrls.push(url); } }
        const payload = {
            title: document.getElementById('m_pkg_title').value.trim(),
            price: parseFloat(document.getElementById('m_pkg_price').value || 0),
            duration: document.getElementById('m_pkg_duration').value.trim(),
            category: document.getElementById('m_pkg_cat').value.trim(),
            destination_id: document.getElementById('m_pkg_dest').value || null,
            short_description: document.getElementById('m_pkg_short_desc').value.trim(),
            description: document.getElementById('m_pkg_desc').value.trim(),
            itinerary: currentItinerary,
            inclusions: document.getElementById('m_pkg_inc').value.split('\n').map(s=>s.trim()).filter(Boolean),
            exclusions: document.getElementById('m_pkg_exc').value.split('\n').map(s=>s.trim()).filter(Boolean),
            important_info: document.getElementById('m_pkg_imp').value.split('\n').map(s=>s.trim()).filter(Boolean),
            image_url: imageUrl,
            gallery_images: galleryUrls,
            is_published: document.getElementById('m_pkg_pub').value === 'true',
        };
        const { error } = id ? await sb.from('packages').update(payload).eq('id', id) : await sb.from('packages').insert([payload]);
        if (error) { showToast('Error saving package: ' + error.message, 'error'); return; }
        document.getElementById('pkgFormModal').style.display = 'none';
        showToast('Package saved successfully!');
        loadAdminPackages(); loadAdminStats();
    });
}

function updateBulkBar(type) {
    let selector = '.package-checkbox:checked';
    if (type === 'destinations') selector = '.destination-checkbox:checked';
    const checkboxes = document.querySelectorAll(selector);
    const bar = document.getElementById(type === 'packages' ? 'pkg-bulk-actions' : 'dest-bulk-actions');
    if (bar) bar.style.display = checkboxes.length > 0 ? 'flex' : 'none';
}

function toggleAllCheckboxes(type, master) {
    document.querySelectorAll(`.${type}-checkbox`).forEach(cb => cb.checked = master.checked);
    updateBulkBar(type);
}

async function applyBulkAction(type) {
    const checkboxes = document.querySelectorAll(`.${type}-checkbox:checked`);
    const action = document.getElementById(type === 'packages' ? 'pkg-bulk-action' : 'dest-bulk-action').value;
    if (!action || checkboxes.length === 0) { showToast('Select items and an action.', 'error'); return; }
    const ids = Array.from(checkboxes).map(cb => cb.value);
    showConfirm(`Are you sure you want to ${action} ${ids.length} item(s)?`, async () => {
        if (action === 'delete') await sb.from(type).delete().in('id', ids);
        else if (action === 'publish') await sb.from(type).update({ is_published: true }).in('id', ids);
        else if (action === 'unpublish') await sb.from(type).update({ is_published: false }).in('id', ids);
        loadAdminPackages(); loadAdminDestinations(); loadAdminStats();
        showToast('Bulk action completed.');
    });
}

async function loadAdminDestinations() {
    const { data } = await sb.from('destinations').select('id, name, country, is_published').order('created_at', { ascending: false });
    document.getElementById('table_destinations').innerHTML = (data||[]).map(d => `<tr><td><input type="checkbox" class="destination-checkbox" value="${escapeHTML(d.id)}" onchange="updateBulkBar('destinations')"></td><td>${escapeHTML(d.name)}</td><td>${escapeHTML(d.country || '')}</td><td>${d.is_published ? 'Live' : 'Hidden'}</td><td><button class="btn-blue" style="background:var(--brand-blue); color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right:5px;" onclick="editDest('${escapeHTML(d.id)}')">Edit</button><button style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="delItem('destinations', '${escapeHTML(d.id)}')">Delete</button></td></tr>`).join('');
    document.getElementById('dest-bulk-actions').style.display = 'none';
    document.getElementById('select-all-destinations').checked = false;
}

function openDestModal() {
    document.getElementById('destFormModal').style.display = 'block';
    document.getElementById('m_dest_id').value = '';
    document.querySelectorAll('#destFormModal input, #destFormModal textarea').forEach(i => { if(i.type !== 'hidden' && i.type !== 'file') i.value = ''; });
    document.getElementById('m_dest_img').dataset.existing = '';
}

async function editDest(id) {
    const { data: d } = await sb.from('destinations').select('*').eq('id', id).single();
    if (!d) return;
    document.getElementById('destFormModal').style.display = 'block';
    document.getElementById('m_dest_id').value = d.id;
    document.getElementById('m_dest_name').value = d.name;
    document.getElementById('m_dest_country').value = d.country || '';
    document.getElementById('m_dest_region').value = d.region || '';
    document.getElementById('m_dest_desc').value = d.description || '';
    document.getElementById('m_dest_time').value = d.best_time || '';
    document.getElementById('m_dest_attr').value = d.attractions ? d.attractions.join(', ') : '';
    document.getElementById('m_dest_tips').value = d.travel_tips ? d.travel_tips.join(', ') : '';
    document.getElementById('m_dest_pub').value = d.is_published ? 'true' : 'false';
    document.getElementById('m_dest_img').dataset.existing = d.image_url || '';
}

async function saveDestination() {
    const btn = document.querySelector('#destFormModal .btn-blue');
    await withLoading(btn, async () => {
        const id = document.getElementById('m_dest_id').value;
        let imageUrl = document.getElementById('m_dest_img').dataset.existing || '';
        const imgFile = document.getElementById('m_dest_img').files[0];
        if (imgFile) {
            imageUrl = await uploadImage(imgFile);
            if (!imageUrl) return;
        }
        const payload = {
            name: document.getElementById('m_dest_name').value.trim(),
            country: document.getElementById('m_dest_country').value.trim(),
            region: document.getElementById('m_dest_region').value.trim(),
            description: document.getElementById('m_dest_desc').value.trim(),
            best_time: document.getElementById('m_dest_time').value.trim(),
            attractions: document.getElementById('m_dest_attr').value.split(',').map(s => s.trim()).filter(Boolean),
            travel_tips: document.getElementById('m_dest_tips').value.split(',').map(s => s.trim()).filter(Boolean),
            image_url: imageUrl,
            is_published: document.getElementById('m_dest_pub').value === 'true',
        };
        const { error } = id ? await sb.from('destinations').update(payload).eq('id', id) : await sb.from('destinations').insert([payload]);
        if (error) {
            showToast('Error saving destination: ' + error.message, 'error');
            return;
        }
        document.getElementById('destFormModal').style.display = 'none';
        showToast('Destination saved successfully!');
        loadAdminDestinations();
        loadAdminStats();
        loadDestDropdown();
        populateCountryFilter();
    });
}

async function loadAdminEnquiries() {
    const { data } = await sb.from('enquiries').select('id, name, email, phone, destination, travel_dates, budget, status, internal_notes, package_id, packages(title)').order('created_at', { ascending: false });
    document.getElementById('table_enquiries').innerHTML = (data||[]).map(e => `<tr><td>${escapeHTML(e.name)}<br>${escapeHTML(e.email)}<br>${escapeHTML(e.phone)}</td><td>Dest: ${escapeHTML(e.destination || 'N/A')}<br>Pkg: ${escapeHTML(e.packages?.title || 'N/A')}<br>Dates: ${escapeHTML(e.travel_dates || 'N/A')}<br>Budget: ₹${escapeHTML(e.budget || 'N/A')}</td><td><select class="status-dropdown" onchange="changeStatus('enquiries', '${escapeHTML(e.id)}', this.value)"><option ${e.status === 'New' ? 'selected' : ''}>New</option><option ${e.status === 'Contacted' ? 'selected' : ''}>Contacted</option><option ${e.status === 'Quotation Sent' ? 'selected' : ''}>Quotation Sent</option><option ${e.status === 'Follow-up' ? 'selected' : ''}>Follow-up</option><option ${e.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option><option ${e.status === 'Completed' ? 'selected' : ''}>Completed</option><option ${e.status === 'Lost' ? 'selected' : ''}>Lost</option></select><br><textarea placeholder="Internal Notes" onchange="saveNote('${escapeHTML(e.id)}', this.value)" style="margin-top:5px; width:100%; font-size:12px;">${escapeHTML(e.internal_notes || '')}</textarea></td><td><button class="btn btn-green" style="background:var(--green); color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-bottom:5px;" onclick="createBookingFromEnquiry('${escapeHTML(e.id)}')">Create Booking</button><br><button style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="delItem('enquiries', '${escapeHTML(e.id)}')">Delete</button></td></tr>`).join('');
}

function csvCell(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function exportEnquiries() {
    const rows = [['Name', 'Email', 'Phone', 'Destination', 'Travel Dates', 'Budget', 'Status']];
    document.querySelectorAll('#table_enquiries tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length < 3) return;
        const info = tds[0].innerText.split('\n');
        const details = tds[1].innerText.split('\n');
        rows.push([
            info[0], info[1], info[2],
            details[0].replace('Dest: ', ''),
            details[2].replace('Dates: ', ''),
            details[3].replace('Budget: ₹', ''),
            tds[2].innerText.split('\n')[0]
        ]);
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(row => row.map(csvCell).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "via_tours_enquiries.csv";
    link.click();
}

async function saveNote(id, text) { await sb.from('enquiries').update({ internal_notes: text }).eq('id', id); }
async function changeStatus(table, id, status) { await sb.from(table).update({ status }).eq('id', id); loadAdminStats(); if (table === 'enquiries') loadAdminEnquiries(); }

async function createBookingFromEnquiry(enqId) {
    const { data: enq, error } = await sb.from('enquiries')
        .select('id, name, email, phone, destination, package_id, travel_dates, travelers')
        .eq('id', enqId)
        .single();
    if (error || !enq) { showToast('Enquiry not found.', 'error'); return; }
    document.getElementById('bookFormModal').style.display = 'block';
    document.getElementById('m_book_date').value = enq.travel_dates || '';
    document.getElementById('m_book_customer_name').value = enq.name || '';
    const travelers = parseInt(enq.travelers);
    document.getElementById('m_book_travelers').value = (travelers > 0) ? travelers : 1;
    if (enq.package_id) {
        const { data: pkg } = await sb.from('packages').select('id, title').eq('id', enq.package_id).maybeSingle();
        if (pkg) document.getElementById('m_book_package_name').value = pkg.title;
    }
}

async function loadAdminCustomers() {
    const { data } = await sb.from('customers').select('id, name, email, phone, whatsapp, notes').order('created_at', { ascending: false });
    document.getElementById('table_customers').innerHTML = (data||[]).map(c => `<tr><td>${escapeHTML(c.name)}</td><td>${escapeHTML(c.email)}<br>${escapeHTML(c.phone)}<br>WhatsApp: ${escapeHTML(c.whatsapp || 'N/A')}</td><td><textarea placeholder="Notes" onchange="saveCustNote('${escapeHTML(c.id)}', this.value)" style="width:100%; font-size:12px;">${escapeHTML(c.notes || '')}</textarea></td></tr>`).join('');
}

async function saveCustNote(id, text) { await sb.from('customers').update({ notes: text }).eq('id', id); }

async function loadAdminBookings() {
    const { data } = await sb.from('bookings').select('id, travel_date, total_amount, amount_paid, balance, booking_status, customer_name, package_name').order('travel_date', { ascending: false });
    document.getElementById('table_bookings').innerHTML = (data||[]).map(b => `<tr><td>${escapeHTML(b.customer_name || 'N/A')}</td><td>${escapeHTML(b.package_name || 'N/A')}</td><td>${b.travel_date ? new Date(b.travel_date).toLocaleDateString() : 'N/A'}</td><td>₹${Number(b.total_amount).toLocaleString('en-IN')}<br>(Paid: ₹${Number(b.amount_paid).toLocaleString('en-IN')})</td><td>${escapeHTML(b.booking_status)}</td></tr>`).join('');
}

function openBookModal() {
    document.getElementById('bookFormModal').style.display = 'block';
    document.querySelectorAll('#bookFormModal input').forEach(i => i.value = '');
    document.getElementById('m_book_travelers').value = 1;
    document.getElementById('m_book_status').value = 'Pending';
}

async function saveBooking() {
    const btn = document.querySelector('#bookFormModal .btn-blue');
    await withLoading(btn, async () => {
        const total = parseFloat(document.getElementById('m_book_total').value || 0);
        const paid = parseFloat(document.getElementById('m_book_paid').value || 0);
        const payload = {
            customer_name: document.getElementById('m_book_customer_name').value.trim(),
            package_name: document.getElementById('m_book_package_name').value.trim(),
            travel_date: document.getElementById('m_book_date').value,
            travelers: parseInt(document.getElementById('m_book_travelers').value) || 1,
            total_amount: total,
            amount_paid: paid,
            balance: total - paid,
            booking_status: document.getElementById('m_book_status').value,
        };
        const { error } = await sb.from('bookings').insert([payload]);
        if (error) {
            showToast('Error saving booking: ' + error.message, 'error');
            return;
        }
        document.getElementById('bookFormModal').style.display = 'none';
        showToast('Booking saved successfully!');
        loadAdminBookings();
        loadAdminStats();
    });
}

async function loadAdminBlog() {
    const { data } = await sb.from('blog_posts').select('id, title, is_published').order('created_at', { ascending: false });
    document.getElementById('table_blog').innerHTML = (data||[]).map(b => `<tr><td>${escapeHTML(b.title)}</td><td>${b.is_published ? 'Live' : 'Hidden'}</td><td><button class="btn-blue" style="background:var(--brand-blue); color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right:5px;" onclick="editBlog('${escapeHTML(b.id)}')">Edit</button><button style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="delItem('blog_posts', '${escapeHTML(b.id)}')">Delete</button></td></tr>`).join('');
}

function openBlogModal() {
    document.getElementById('blogFormModal').style.display = 'block';
    document.getElementById('m_blog_id').value = '';
    document.querySelectorAll('#blogFormModal input, #blogFormModal textarea').forEach(i => { if(i.type !== 'hidden') i.value = ''; });
}

async function editBlog(id) {
    const { data: b } = await sb.from('blog_posts').select('*').eq('id', id).single();
    if (!b) return;
    document.getElementById('blogFormModal').style.display = 'block';
    document.getElementById('m_blog_id').value = b.id;
    document.getElementById('m_blog_title').value = b.title;
    document.getElementById('m_blog_slug').value = b.slug;
    document.getElementById('m_blog_img').value = b.image_url;
    document.getElementById('m_blog_excerpt').value = b.excerpt;
    document.getElementById('m_blog_content').value = b.content;
    document.getElementById('m_blog_meta_title').value = b.meta_title;
    document.getElementById('m_blog_meta_desc').value = b.meta_description;
    document.getElementById('m_blog_pub').value = b.is_published ? 'true' : 'false';
}

async function saveBlogPost() {
    const btn = document.querySelector('#blogFormModal .btn-blue');
    await withLoading(btn, async () => {
        const payload = {
            title: document.getElementById('m_blog_title').value.trim(),
            slug: document.getElementById('m_blog_slug').value.trim(),
            image_url: document.getElementById('m_blog_img').value.trim(),
            excerpt: document.getElementById('m_blog_excerpt').value.trim(),
            content: document.getElementById('m_blog_content').value.trim(),
            meta_title: document.getElementById('m_blog_meta_title').value.trim(),
            meta_description: document.getElementById('m_blog_meta_desc').value.trim(),
            is_published: document.getElementById('m_blog_pub').value === 'true',
        };
        const id = document.getElementById('m_blog_id').value;
        const { error } = id ? await sb.from('blog_posts').update(payload).eq('id', id) : await sb.from('blog_posts').insert([payload]);
        if (error) {
            showToast('Error saving blog post: ' + error.message, 'error');
            return;
        }
        document.getElementById('blogFormModal').style.display = 'none';
        showToast('Blog post saved!');
        loadAdminBlog();
    });
}

async function loadAdminTestimonials() {
    const { data } = await sb.from('testimonials').select('id, name, message').order('created_at', { ascending: false });
    document.getElementById('table_testimonials').innerHTML = (data||[]).map(t => `<tr><td>${escapeHTML(t.name)}</td><td>${escapeHTML(t.message ? t.message.substring(0, 50) + '...' : '')}</td><td><button style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="delItem('testimonials', '${escapeHTML(t.id)}')">Delete</button></td></tr>`).join('');
}

function openTestModal() {
    document.getElementById('testFormModal').style.display = 'block';
    document.querySelectorAll('#testFormModal input, #testFormModal textarea').forEach(i => { if(i.type !== 'hidden') i.value = ''; });
    document.getElementById('m_test_rating').value = 5;
}

async function saveTestimonial() {
    const btn = document.querySelector('#testFormModal .btn-blue');
    await withLoading(btn, async () => {
        const payload = {
            name: document.getElementById('m_test_name').value.trim(),
            location: document.getElementById('m_test_loc').value.trim(),
            rating: parseInt(document.getElementById('m_test_rating').value) || 5,
            image_url: document.getElementById('m_test_img').value.trim(),
            message: document.getElementById('m_test_msg').value.trim(),
        };
        const { error } = await sb.from('testimonials').insert([payload]);
        if (error) {
            showToast('Error saving testimonial: ' + error.message, 'error');
            return;
        }
        document.getElementById('testFormModal').style.display = 'none';
        showToast('Testimonial saved!');
        loadAdminTestimonials();
    });
}

async function loadAdminFaqs() {
    const { data } = await sb.from('faqs').select('id, question, answer, is_published').order('created_at', { ascending: false });
    document.getElementById('table_faqs').innerHTML = (data||[]).map(f => `<tr><td>${escapeHTML(f.question)}</td><td>${f.is_published ? 'Live' : 'Hidden'}</td><td><button class="btn-blue" style="background:var(--brand-blue); color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right:5px;" onclick="editFaq('${escapeHTML(f.id)}')">Edit</button><button style="background:#ef4444; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="delItem('faqs', '${escapeHTML(f.id)}')">Delete</button></td></tr>`).join('');
}

function openFaqModal() {
    document.getElementById('faqFormModal').style.display = 'block';
    document.getElementById('m_faq_id').value = '';
    document.getElementById('faq_modal_title').innerText = 'Add FAQ';
    document.querySelectorAll('#faqFormModal input, #faqFormModal textarea').forEach(i => { if(i.type !== 'hidden') i.value = ''; });
}

async function editFaq(id) {
    const { data: f } = await sb.from('faqs').select('*').eq('id', id).single();
    if (!f) return;
    document.getElementById('faqFormModal').style.display = 'block';
    document.getElementById('faq_modal_title').innerText = 'Edit FAQ';
    document.getElementById('m_faq_id').value = f.id;
    document.getElementById('m_faq_question').value = f.question;
    document.getElementById('m_faq_answer').value = f.answer;
    document.getElementById('m_faq_pub').value = f.is_published ? 'true' : 'false';
}

async function saveFaq() {
    const btn = document.querySelector('#faqFormModal .btn-blue');
    await withLoading(btn, async () => {
        const payload = {
            question: document.getElementById('m_faq_question').value.trim(),
            answer: document.getElementById('m_faq_answer').value.trim(),
            is_published: document.getElementById('m_faq_pub').value === 'true',
        };
        const id = document.getElementById('m_faq_id').value;
        const { error } = id ? await sb.from('faqs').update(payload).eq('id', id) : await sb.from('faqs').insert([payload]);
        if (error) {
            showToast('Error saving FAQ: ' + error.message, 'error');
            return;
        }
        document.getElementById('faqFormModal').style.display = 'none';
        showToast('FAQ saved!');
        loadAdminFaqs();
        loadHomeFaqs();
    });
}

async function loadAdminSettings() {
    const { data } = await sb.from('website_settings').select('*').eq('id', 1).single();
    if (data) {
        document.getElementById('set_name').value = data.business_name || '';
        document.getElementById('set_email').value = data.email || '';
        document.getElementById('set_phone').value = data.phone || '';
        document.getElementById('set_whatsapp').value = data.whatsapp || '';
        document.getElementById('set_address').value = data.address || '';
    }
}

async function saveSettings() {
    const btn = document.querySelector('#tab-settings .btn-blue');
    await withLoading(btn, async () => {
        const payload = {
            business_name: document.getElementById('set_name').value.trim(),
            email: document.getElementById('set_email').value.trim(),
            phone: document.getElementById('set_phone').value.trim(),
            whatsapp: document.getElementById('set_whatsapp').value.trim(),
            address: document.getElementById('set_address').value.trim(),
        };
        const { error } = await sb.from('website_settings').update(payload).eq('id', 1);
        if (error) {
            showToast('Error saving settings: ' + error.message, 'error');
            return;
        }
        showToast('Settings saved successfully!');
        loadSettings();
    });
}

async function delItem(table, id) {
    showConfirm('Delete this item? This action cannot be undone.', async () => {
        const { error } = await sb.from(table).delete().eq('id', id);
        if (error) { showToast('Error deleting: ' + error.message, 'error'); return; }
        switch(table) {
            case 'packages': loadAdminPackages(); break;
            case 'destinations': loadAdminDestinations(); loadDestDropdown(); populateCountryFilter(); break;
            case 'blog_posts': loadAdminBlog(); break;
            case 'faqs': loadAdminFaqs(); loadHomeFaqs(); break;
            case 'testimonials': loadAdminTestimonials(); break;
            case 'enquiries': loadAdminEnquiries(); break;
        }
        loadAdminStats();
        showToast('Item deleted.');
    });
}

async function loadDestDropdown() {
    const { data } = await sb.from('destinations').select('id, name, country').order('country', { ascending: true });
    let html = '<option value="">None</option>';
    const grouped = {};
    (data||[]).forEach(d => { const c = d.country || 'Other'; if (!grouped[c]) grouped[c] = []; grouped[c].push(d); });
    for (const country in grouped) {
        html += `<optgroup label="${escapeHTML(country)}">`;
        grouped[country].forEach(d => { html += `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)}</option>`; });
        html += '</optgroup>';
    }
    const select = document.getElementById('m_pkg_dest');
    if (select) select.innerHTML = html;
}

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    document.getElementById('scrollProgress').style.width = progress + '%';
    const btn = document.getElementById('scrollTopBtn');
    if (scrollTop > 300) btn.classList.add('show');
    else btn.classList.remove('show');
});

window.addEventListener('load', () => {
    setTimeout(() => { document.getElementById('preloader').classList.add('hidden'); }, 800);
});

loadSettings();
populateCountryFilter();
loadHomeFaqs();
