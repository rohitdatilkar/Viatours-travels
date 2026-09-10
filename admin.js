/* ==========================================================================
   VIA TOURS & TRAVELS — EXECUTIVE STAFF & ADMIN CONTROLLER
   Standalone, secure administration engine with Supabase session validation,
   full direct CRUD, storage asset uploads, CSV export, and rate limiting.
   ========================================================================== */

// --- SUPABASE CLIENT SETUP (GUARDED BY SECRETS-OFF-FRONTEND) ---
const SUPABASE_URL = window.__VIA_CONFIG__?.SUPABASE_URL || window.SUPABASE_URL || 'https://goqwtovltftehautxekh.supabase.co';
const SUPABASE_KEY = window.__VIA_CONFIG__?.SUPABASE_KEY || window.SUPABASE_KEY || 'sb_publishable_bQXp8x_2x4ymx4_oxcOFUA_UTGsqF-5';
const sb = (window.ViaSecurity && typeof window.ViaSecurity.getSupabaseClient === 'function')
    ? window.ViaSecurity.getSupabaseClient()
    : (window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null);

// --- SHARED UTILITIES & HELPERS ---
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function formatPrice(amount) {
    if (isNaN(amount) || amount === null) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
}

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = (type === 'success' ? '<i class="fas fa-check-circle"></i> ' : '<i class="fas fa-exclamation-circle"></i> ') + escapeHTML(msg);
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

async function withLoading(button, asyncFn) {
    if (!button) return asyncFn();
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    try {
        await asyncFn();
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

function showConfirm(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    if (!modal) {
        if (window.confirm(message)) onConfirm();
        return;
    }
    const msgEl = document.getElementById('confirmMessage');
    if (msgEl) msgEl.textContent = message;
    modal.style.display = 'flex';
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');
    if (yesBtn) {
        yesBtn.onclick = () => {
            modal.style.display = 'none';
            onConfirm();
        };
    }
    if (noBtn) {
        noBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
}

let isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) document.body.classList.add('dark-mode');
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
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

// --- ADMIN MANAGEMENT PORTAL ---
let loginAttempts = 0;
let lockoutUntil = 0;

async function adminLogin() {
    const now = Date.now();
    if (now < lockoutUntil) {
        showToast(`Account locked for ${Math.ceil((lockoutUntil - now) / 1000)}s due to multiple attempts.`, 'error');
        return;
    }

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPass')?.value;
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        showToast('Please enter both admin email and password.', 'error');
        return;
    }

    if (!sb) {
        showToast('Database connection unavailable.', 'error');
        return;
    }

    await withLoading(btn, async () => {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
            loginAttempts++;
            if (loginAttempts >= 5) {
                lockoutUntil = Date.now() + 60000;
                loginAttempts = 0;
                showToast('Too many failed attempts. Locked for 60 seconds.', 'error');
            } else {
                showToast(`Login failed (${loginAttempts}/5): ${error.message}`, 'error');
            }
            return;
        }

        loginAttempts = 0;
        showToast('Welcome back, Admin!', 'success');
        initAdminDashboard();
    });
}

async function forgotPassword() {
    const email = document.getElementById('loginEmail')?.value.trim();
    if (!email) {
        showToast('Please enter your admin email above first.', 'error');
        return;
    }
    if (sb) {
        const { error } = await sb.auth.resetPasswordForEmail(email);
        if (error) showToast(error.message, 'error');
        else showToast('Password reset link sent to your email.', 'success');
    }
}

async function logout() {
    if (sb) await sb.auth.signOut();
    const loginBox = document.getElementById('admin-login');
    const dashBox = document.getElementById('admin-dashboard');
    if (loginBox) loginBox.style.display = 'block';
    if (dashBox) dashBox.style.display = 'none';
    navTo('home');
    showToast('Signed out of staff portal successfully.');
}

function toggleSidebar() {
    const side = document.getElementById('adminSide');
    if (side) {
        side.classList.toggle('collapsed');
        isSidebarCollapsed = side.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
    }
}

async function initAdminDashboard() {
    if (sb) {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) {
            const loginBox = document.getElementById('admin-login');
            const dashBox = document.getElementById('admin-dashboard');
            if (loginBox) loginBox.style.display = 'block';
            if (dashBox) dashBox.style.display = 'none';
            return;
        }
    }

    const loginBox = document.getElementById('admin-login');
    const dashBox = document.getElementById('admin-dashboard');
    if (loginBox) loginBox.style.display = 'none';
    if (dashBox) dashBox.style.display = 'block';

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
}

function showAdminTab(tabName, ev) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    const target = document.getElementById('tab-' + tabName);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.admin-menu li').forEach(li => li.classList.remove('active'));
    if (ev && ev.currentTarget) ev.currentTarget.classList.add('active');

    const titles = {
        dashboard: 'Dashboard Overview',
        packages: 'Tour Packages Management',
        destinations: 'Destinations Catalog',
        enquiries: 'Guest Inquiries & Leads',
        customers: 'VIP Client Database',
        bookings: 'Reservation Bookings',
        blog: 'Travel Journal & Articles',
        testimonials: 'Guest Testimonials',
        faqs: 'Frequently Asked Questions',
        settings: 'Agency Settings & Configuration'
    };
    const titleEl = document.getElementById('adminCurrentTabTitle');
    if (titleEl && titles[tabName]) titleEl.textContent = titles[tabName];

    if (window.innerWidth <= 768) {
        const side = document.getElementById('adminSide');
        if (side && !side.classList.contains('collapsed')) {
            side.classList.add('collapsed');
        }
    }
}

async function loadAdminStats() {
    if (!sb) return;
    try {
        const [enqRes, newEnqRes, pkgRes, custRes, bookRes] = await Promise.all([
            sb.from('enquiries').select('id', { count: 'exact', head: true }),
            sb.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'New'),
            sb.from('packages').select('id', { count: 'exact', head: true }).eq('is_published', true),
            sb.from('customers').select('id', { count: 'exact', head: true }),
            sb.from('bookings').select('*')
        ]);

        document.getElementById('stat_enq').textContent = enqRes.count || 0;
        document.getElementById('stat_new_enq').textContent = newEnqRes.count || 0;
        document.getElementById('stat_pkg').textContent = pkgRes.count || 0;
        document.getElementById('stat_cust').textContent = custRes.count || 0;

        const bookings = bookRes.data || [];
        const rev = bookings.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0);
        const bal = bookings.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);

        document.getElementById('stat_revenue').textContent = '₹' + rev.toLocaleString('en-IN');
        document.getElementById('stat_balance').textContent = '₹' + bal.toLocaleString('en-IN');

        // Recent Enquiries Table
        const { data: recentEnq } = await sb.from('enquiries').select('*').order('created_at', { ascending: false }).limit(5);
        document.getElementById('table_recent_enq').innerHTML = (recentEnq || []).map(e => `
            <tr>
                <td><strong>${escapeHTML(e.name || e.customer_name || 'Guest')}</strong><br><small style="color:#94a3b8;">${escapeHTML(e.email)}</small></td>
                <td>${escapeHTML(e.destination || 'Custom')}</td>
                <td><span class="luxury-badge" style="font-size:0.75rem;">${escapeHTML(e.status || 'New')}</span></td>
            </tr>
        `).join('');
    } catch (e) {
        console.warn('Admin stats error:', e);
    }
}

// Package Admin CRUD
async function loadAdminPackages() {
    const table = document.getElementById('table_packages');
    if (!table) return;

    let packages = [];
    if (window.CatalogStore) {
        packages = await window.CatalogStore.getAll('packages', sb);
    } else if (sb) {
        const { data, error } = await sb.from('packages').select('*').order('created_at', { ascending: false });
        if (!error && data) packages = data;
    }

    if (packages.length === 0) {
        table.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:#94a3b8;"><i class="fas fa-box-open" style="font-size:1.8rem; margin-bottom:8px; display:block; color:var(--gold-400);"></i>No packages in database yet.<br><small>Click <strong>"+ Add Luxury Package"</strong> to create your first package.</small></td></tr>`;
        return;
    }

    table.innerHTML = packages.map(p => `
        <tr>
            <td><input type="checkbox" class="package-checkbox" value="${escapeHTML(p.id)}"></td>
            <td><img src="${escapeHTML(p.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&q=80')}" alt="${escapeHTML(p.title || 'Tour Package Thumbnail')}" style="width:48px; height:48px; border-radius:6px; object-fit:cover;"></td>
            <td><strong>${escapeHTML(p.title)}</strong><br><small style="color:#94a3b8;">${escapeHTML(p.duration || '')}</small></td>
            <td>₹${Number(p.price || 0).toLocaleString('en-IN')}</td>
            <td><span class="luxury-badge" style="font-size:0.75rem;">${p.is_published ? 'Live' : 'Draft'}</span></td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editPackage('${escapeHTML(p.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="delItem('packages', '${escapeHTML(p.id)}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openPkgModal() {
    document.getElementById('pkgFormModal').style.display = 'block';
    document.getElementById('m_pkg_id').value = '';
    document.getElementById('pkg_modal_title').textContent = 'Add Luxury Package';
    document.querySelectorAll('#pkgFormModal input, #pkgFormModal textarea').forEach(i => {
        if (i.type !== 'hidden' && i.type !== 'file') i.value = '';
    });
    const fileImg = document.getElementById('m_pkg_img');
    if (fileImg) fileImg.value = '';
    const fileGal = document.getElementById('m_pkg_gallery');
    if (fileGal) fileGal.value = '';
    currentItinerary = [];
    currentGallery = [];
    renderItinEditor();
    renderGalleryPreview();
    loadDestDropdown();
}

function addItinDay(day = null) {
    currentItinerary.push(day || { title: `Day ${currentItinerary.length + 1}`, desc: '' });
    renderItinEditor();
}

function renderItinEditor() {
    const editor = document.getElementById('itin_editor');
    if (!editor) return;
    editor.innerHTML = currentItinerary.map((d, i) => `
        <div style="background:#081535; border:1px solid #1c3060; padding:12px; border-radius:8px; margin-bottom:10px;">
            <input type="text" value="${escapeHTML(d.title)}" placeholder="Day Title" oninput="currentItinerary[${i}].title = this.value" style="margin-bottom:6px; background:#0c1a3d; color:#fff;">
            <textarea placeholder="Day Description" rows="2" oninput="currentItinerary[${i}].desc = this.value" style="background:#0c1a3d; color:#fff;">${escapeHTML(d.desc || d.description || '')}</textarea>
            <button type="button" class="btn btn-danger btn-sm" onclick="currentItinerary.splice(${i}, 1); renderItinEditor();" style="margin-top:6px;"><i class="fas fa-trash"></i> Remove Day</button>
        </div>
    `).join('');
}

function renderGalleryPreview() {
    const preview = document.getElementById('gallery_preview');
    if (!preview) return;
    preview.innerHTML = currentGallery.map((url, i) => `
        <div style="position:relative;">
            <img src="${escapeHTML(url)}" alt="Package Gallery Image ${i + 1}" style="width:80px; height:80px; object-fit:cover; border-radius:6px;">
            <button type="button" onclick="currentGallery.splice(${i},1); renderGalleryPreview();" style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.9); color:#fff; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

async function loadDestDropdown() {
    const select = document.getElementById('m_pkg_dest');
    if (!select) return;
    let dests = [];
    if (window.CatalogStore) {
        dests = await window.CatalogStore.getAll('destinations', sb);
    } else {
        dests = await fetchDestinations();
    }
    select.innerHTML = '<option value="">None / Custom Destination</option>' + dests.map(d => `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)} (${escapeHTML(d.country || '')})</option>`).join('');
}

async function savePackage() {
    const title = document.getElementById('m_pkg_title').value.trim();
    if (!title) {
        showToast('Please enter package title.', 'error');
        return;
    }
    const id = document.getElementById('m_pkg_id').value;
    const payload = {
        title,
        price: parseFloat(document.getElementById('m_pkg_price').value || 0),
        duration: document.getElementById('m_pkg_duration').value.trim(),
        category: document.getElementById('m_pkg_cat').value.trim(),
        destination_id: document.getElementById('m_pkg_dest').value || null,
        short_description: document.getElementById('m_pkg_short_desc').value.trim(),
        description: document.getElementById('m_pkg_desc').value.trim(),
        itinerary: currentItinerary,
        inclusions: document.getElementById('m_pkg_inc').value.split('\n').map(s => s.trim()).filter(Boolean),
        exclusions: document.getElementById('m_pkg_exc').value.split('\n').map(s => s.trim()).filter(Boolean),
        important_info: document.getElementById('m_pkg_imp').value.split('\n').map(s => s.trim()).filter(Boolean),
        is_published: document.getElementById('m_pkg_pub').value === 'true'
    };
    if (id) payload.id = id;

    // Upload featured image if selected
    const featuredFile = document.getElementById('m_pkg_img')?.files?.[0];
    if (featuredFile) {
        const uploadedUrl = await uploadFileToSupabase(featuredFile, 'package-images');
        if (uploadedUrl) payload.image_url = uploadedUrl;
    }

    // Upload gallery images if selected
    const galleryFiles = document.getElementById('m_pkg_gallery')?.files;
    if (galleryFiles && galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
            const gUrl = await uploadFileToSupabase(galleryFiles[i], 'package-images');
            if (gUrl) currentGallery.push(gUrl);
        }
    }
    payload.gallery_images = currentGallery;

    if (window.CatalogStore) {
        await window.CatalogStore.save('packages', payload, sb);
    } else if (sb) {
        const { error } = id ? await sb.from('packages').update(payload).eq('id', id) : await sb.from('packages').insert([payload]);
        if (error) {
            showToast('Error saving package: ' + error.message, 'error');
            return;
        }
    }
    document.getElementById('pkgFormModal').style.display = 'none';
    showToast('Package saved successfully!');
    loadAdminPackages();
}

async function editPackage(id) {
    let p = null;
    if (window.CatalogStore) {
        const packages = await window.CatalogStore.getAll('packages', sb);
        p = packages.find(x => x.id === id);
    } else {
        if (sb) {
            const { data } = await sb.from('packages').select('*').eq('id', id).single();
            p = data;
        }
        if (!p) {
            const packages = await fetchPackages();
            p = packages.find(x => x.id === id);
        }
    }
    if (!p) return;
    await loadDestDropdown();
    document.getElementById('pkgFormModal').style.display = 'block';
    document.getElementById('pkg_modal_title').textContent = 'Edit Package';
    document.getElementById('m_pkg_id').value = p.id;
    document.getElementById('m_pkg_title').value = p.title || '';
    document.getElementById('m_pkg_price').value = p.price || '';
    document.getElementById('m_pkg_cat').value = p.category || '';
    document.getElementById('m_pkg_duration').value = p.duration || '';
    document.getElementById('m_pkg_dest').value = p.destination_id || '';
    document.getElementById('m_pkg_short_desc').value = p.short_description || '';
    document.getElementById('m_pkg_desc').value = p.description || '';
    document.getElementById('m_pkg_inc').value = (p.inclusions || []).join('\n');
    document.getElementById('m_pkg_exc').value = (p.exclusions || []).join('\n');
    document.getElementById('m_pkg_imp').value = (p.important_info || []).join('\n');
    document.getElementById('m_pkg_pub').value = p.is_published ? 'true' : 'false';
    currentItinerary = (p.itinerary || []).map(d => ({ title: d.title || (`Day ${d.day || ''}`), desc: d.desc || d.description || '' }));
    renderItinEditor();
    currentGallery = [...(p.gallery_images || [])];
    renderGalleryPreview();
}

// Destination Admin CRUD
async function loadAdminDestinations() {
    const table = document.getElementById('table_destinations');
    if (!table) return;

    let dests = [];
    if (window.CatalogStore) {
        dests = await window.CatalogStore.getAll('destinations', sb);
    } else if (sb) {
        const { data, error } = await sb.from('destinations').select('*').order('name');
        if (!error && data) dests = data;
    }

    if (dests.length === 0) {
        table.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:32px; color:#94a3b8;"><i class="fas fa-map-marked-alt" style="font-size:1.8rem; margin-bottom:8px; display:block; color:var(--gold-400);"></i>No destinations in database yet.<br><small>Click <strong>"+ Add Destination"</strong> to create one.</small></td></tr>`;
        return;
    }

    table.innerHTML = dests.map(d => `
        <tr>
            <td><input type="checkbox" class="dest-checkbox" value="${escapeHTML(d.id)}"></td>
            <td><strong>${escapeHTML(d.name)}</strong></td>
            <td>${escapeHTML(d.country || '')}</td>
            <td><span class="luxury-badge" style="font-size:0.75rem;">${d.is_published ? 'Live' : 'Hidden'}</span></td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editDestination('${escapeHTML(d.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="delItem('destinations', '${escapeHTML(d.id)}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openDestModal() {
    document.getElementById('destFormModal').style.display = 'block';
    document.getElementById('m_dest_id').value = '';
    document.querySelectorAll('#destFormModal input, #destFormModal textarea').forEach(i => {
        if (i.type !== 'hidden' && i.type !== 'file') i.value = '';
    });
}

async function editDestination(id) {
    let d = null;
    if (window.CatalogStore) {
        const dests = await window.CatalogStore.getAll('destinations', sb);
        d = dests.find(x => x.id === id);
    } else {
        if (sb) {
            const { data } = await sb.from('destinations').select('*').eq('id', id).single();
            d = data;
        }
        if (!d) {
            const dests = await fetchDestinations();
            d = dests.find(x => x.id === id);
        }
    }
    if (!d) return;
    document.getElementById('destFormModal').style.display = 'block';
    document.getElementById('m_dest_id').value = d.id;
    document.getElementById('m_dest_name').value = d.name || '';
    document.getElementById('m_dest_country').value = d.country || '';
    document.getElementById('m_dest_region').value = d.region || '';
    document.getElementById('m_dest_desc').value = d.description || '';
    document.getElementById('m_dest_time').value = d.best_time || '';
    document.getElementById('m_dest_pub').value = d.is_published ? 'true' : 'false';
}

async function saveDestination() {
    const name = document.getElementById('m_dest_name').value.trim();
    if (!name) { showToast('Please enter destination name.', 'error'); return; }
    const id = document.getElementById('m_dest_id')?.value;
    const payload = {
        name,
        country: document.getElementById('m_dest_country').value.trim(),
        region: document.getElementById('m_dest_region').value.trim(),
        description: document.getElementById('m_dest_desc').value.trim(),
        best_time: document.getElementById('m_dest_time').value.trim(),
        is_published: document.getElementById('m_dest_pub').value === 'true'
    };
    if (id) payload.id = id;
    const destFile = document.getElementById('m_dest_img')?.files?.[0];
    if (destFile) {
        const destImgUrl = await uploadFileToSupabase(destFile, 'package-images');
        if (destImgUrl) payload.image_url = destImgUrl;
    }
    if (window.CatalogStore) {
        await window.CatalogStore.save('destinations', payload, sb);
    } else if (sb) {
        const { error } = id ? await sb.from('destinations').update(payload).eq('id', id) : await sb.from('destinations').insert([payload]);
        if (error) {
            showToast('Error saving destination: ' + error.message, 'error');
            return;
        }
    }
    document.getElementById('destFormModal').style.display = 'none';
    showToast('Destination saved successfully!');
    loadAdminDestinations();
}

// Enquiries Admin & RFC-4180 CSV Export
async function loadAdminEnquiries() {
    const table = document.getElementById('table_enquiries');
    if (!table || !sb) return;
    const { data } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
    table.innerHTML = (data || []).map(e => `
        <tr>
            <td><strong>${escapeHTML(e.name || e.customer_name || 'Guest')}</strong><br>${escapeHTML(e.email || '')}<br>${escapeHTML(e.phone || '')}</td>
            <td>Dest: ${escapeHTML(e.destination || 'N/A')}<br>Dates: ${escapeHTML(e.travel_dates || 'N/A')}<br>Budget: ${escapeHTML(e.budget || 'N/A')}</td>
            <td>
                <select class="status-dropdown" onchange="changeStatus('enquiries', '${escapeHTML(e.id)}', this.value)" style="background:#081535; color:#fff; padding:4px 8px; border-radius:4px;">
                    <option ${e.status === 'New' ? 'selected' : ''}>New</option>
                    <option ${e.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                    <option ${e.status === 'Quotation Sent' ? 'selected' : ''}>Quotation Sent</option>
                    <option ${e.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option ${e.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
                <textarea placeholder="VIP internal notes" onchange="saveNote('${escapeHTML(e.id)}', this.value)" style="width:100%; margin-top:6px; font-size:12px; background:#081535; color:#fff;">${escapeHTML(e.internal_notes || '')}</textarea>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="delItem('enquiries', '${escapeHTML(e.id)}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function changeStatus(table, id, status) {
    if (sb) await sb.from(table).update({ status }).eq('id', id);
    showToast('Status updated to ' + status);
}

async function saveNote(id, text) {
    if (sb) await sb.from('enquiries').update({ internal_notes: text }).eq('id', id);
    showToast('Note saved.');
}

function csvEscape(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
}

async function exportEnquiries() {
    let rows = [];
    if (sb) {
        const { data } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
        rows = data || [];
    }
    const headers = ['Full Name', 'Email', 'Phone', 'Destination', 'Travel Dates', 'Travelers', 'Budget', 'Status', 'Internal Notes'];
    const csvContent = [
        headers.join(','),
        ...rows.map(r => [
            csvEscape(r.name),
            csvEscape(r.email),
            csvEscape(r.phone),
            csvEscape(r.destination),
            csvEscape(r.travel_dates),
            csvEscape(r.travelers),
            csvEscape(r.budget),
            csvEscape(r.status),
            csvEscape(r.internal_notes)
        ].join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `via_tours_enquiries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Enquiries exported to CSV.');
}

// Customers & Bookings Admin
async function loadAdminCustomers() {
    const table = document.getElementById('table_customers');
    if (!table || !sb) return;
    const { data } = await sb.from('customers').select('*').order('created_at', { ascending: false });
    table.innerHTML = (data || []).map(c => `
        <tr>
            <td><strong>${escapeHTML(c.name)}</strong></td>
            <td>${escapeHTML(c.email)}<br>${escapeHTML(c.phone)}</td>
            <td><textarea style="background:#081535; color:#fff; width:100%; font-size:12px;">${escapeHTML(c.notes || '')}</textarea></td>
        </tr>
    `).join('');
}

async function loadAdminBookings() {
    const table = document.getElementById('table_bookings');
    if (!table || !sb) return;
    const { data } = await sb.from('bookings').select('*').order('travel_date', { ascending: false });
    table.innerHTML = (data || []).map(b => `
        <tr>
            <td><strong>${escapeHTML(b.customer_name || 'VIP Client')}</strong></td>
            <td>${escapeHTML(b.package_name || 'Custom')}</td>
            <td>${b.travel_date ? new Date(b.travel_date).toLocaleDateString() : 'N/A'}</td>
            <td>₹${Number(b.total_amount).toLocaleString('en-IN')} (Paid: ₹${Number(b.amount_paid).toLocaleString('en-IN')})</td>
            <td><span class="luxury-badge">${escapeHTML(b.booking_status || 'Confirmed')}</span></td>
        </tr>
    `).join('');
}

function openBookModal() {
    initDatePickers();
    document.getElementById('bookFormModal').style.display = 'block';
}

async function saveBooking() {
    const total = parseFloat(document.getElementById('m_book_total').value || 0);
    const paid = parseFloat(document.getElementById('m_book_paid').value || 0);
    const payload = {
        customer_name: document.getElementById('m_book_customer_name').value.trim(),
        package_name: document.getElementById('m_book_package_name').value.trim(),
        travel_date: document.getElementById('m_book_date').value,
        travelers: parseInt(document.getElementById('m_book_travelers').value) || 2,
        total_amount: total,
        amount_paid: paid,
        balance: total - paid,
        booking_status: document.getElementById('m_book_status').value
    };
    if (sb) await sb.from('bookings').insert([payload]);
    document.getElementById('bookFormModal').style.display = 'none';
    showToast('Booking saved.');
    loadAdminBookings();
}

// Blog Admin
async function loadAdminBlog() {
    const table = document.getElementById('table_blog');
    if (!table) return;

    let blogs = [];
    if (window.CatalogStore) {
        blogs = await window.CatalogStore.getAll('blogs', sb);
    } else if (sb) {
        const { data, error } = await sb.from('blog_posts').select('*').order('created_at', { ascending: false });
        if (!error && data) blogs = data;
    }

    if (blogs.length === 0) {
        table.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:32px; color:#94a3b8;"><i class="fas fa-feather-alt" style="font-size:1.8rem; margin-bottom:8px; display:block; color:var(--gold-400);"></i>No stories in database yet.<br><small>Click <strong>"+ Add Story"</strong> to publish one.</small></td></tr>`;
        return;
    }

    table.innerHTML = blogs.map(b => `
        <tr>
            <td><strong>${escapeHTML(b.title)}</strong></td>
            <td><span class="luxury-badge">${b.is_published ? 'Live' : 'Hidden'}</span></td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editBlog('${escapeHTML(b.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="delItem('blog_posts', '${escapeHTML(b.id)}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openBlogModal() {
    document.getElementById('blogFormModal').style.display = 'block';
    document.getElementById('m_blog_id').value = '';
    document.querySelectorAll('#blogFormModal input, #blogFormModal textarea').forEach(i => {
        if (i.type !== 'hidden') i.value = '';
    });
}

async function editBlog(id) {
    let b = null;
    if (window.CatalogStore) {
        const blogs = await window.CatalogStore.getAll('blogs', sb);
        b = blogs.find(x => x.id === id);
    } else {
        if (sb) {
            const { data } = await sb.from('blog_posts').select('*').eq('id', id).single();
            b = data;
        }
        if (!b) {
            const blogs = await fetchBlogs();
            b = blogs.find(x => x.id === id);
        }
    }
    if (!b) return;
    document.getElementById('blogFormModal').style.display = 'block';
    document.getElementById('m_blog_id').value = b.id;
    document.getElementById('m_blog_title').value = b.title || '';
    document.getElementById('m_blog_slug').value = b.slug || '';
    document.getElementById('m_blog_img').value = b.image_url || '';
    document.getElementById('m_blog_excerpt').value = b.excerpt || '';
    document.getElementById('m_blog_content').value = b.content || '';
    document.getElementById('m_blog_pub').value = b.is_published ? 'true' : 'false';
}

async function saveBlogPost() {
    const title = document.getElementById('m_blog_title').value.trim();
    if (!title) { showToast('Please enter title.', 'error'); return; }
    const id = document.getElementById('m_blog_id')?.value;
    const payload = {
        title,
        slug: document.getElementById('m_blog_slug').value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image_url: document.getElementById('m_blog_img').value.trim(),
        excerpt: document.getElementById('m_blog_excerpt').value.trim(),
        content: document.getElementById('m_blog_content').value.trim(),
        is_published: document.getElementById('m_blog_pub').value === 'true'
    };
    if (id) payload.id = id;

    if (window.CatalogStore) {
        await window.CatalogStore.save('blogs', payload, sb);
    } else if (sb) {
        const { error } = id ? await sb.from('blog_posts').update(payload).eq('id', id) : await sb.from('blog_posts').insert([payload]);
        if (error) {
            showToast('Error saving story: ' + error.message, 'error');
            return;
        }
    }
    document.getElementById('blogFormModal').style.display = 'none';
    showToast('Blog post saved.');
    loadAdminBlog();
}

// Testimonials & FAQs Admin
async function loadAdminTestimonials() {
    const table = document.getElementById('table_testimonials');
    if (!table) return;

    let tests = [];
    if (window.CatalogStore) {
        tests = await window.CatalogStore.getAll('testimonials', sb);
    } else if (sb) {
        const { data, error } = await sb.from('testimonials').select('*');
        if (!error && data) tests = data;
    }

    if (tests.length === 0) {
        table.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:32px; color:#94a3b8;">No client testimonials in database yet.<br><small>Click <strong>"+ Add Testimonial"</strong> to create one.</small></td></tr>`;
        return;
    }

    table.innerHTML = tests.map(t => `
        <tr>
            <td><strong>${escapeHTML(t.name)}</strong></td>
            <td>${escapeHTML((t.message || '').substring(0, 70))}...</td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editTestimonial('${escapeHTML(t.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="delItem('testimonials', '${escapeHTML(t.id)}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openTestModal() {
    document.getElementById('testFormModal').style.display = 'block';
    document.getElementById('test_modal_title').textContent = 'Add Testimonial';
    document.getElementById('m_test_id').value = '';
    document.querySelectorAll('#testFormModal input, #testFormModal textarea').forEach(i => i.value = '');
    document.getElementById('m_test_rating').value = '5';
}

async function editTestimonial(id) {
    let t = null;
    if (window.CatalogStore) {
        const tests = await window.CatalogStore.getAll('testimonials', sb);
        t = tests.find(x => x.id === id);
    } else if (sb) {
        const { data } = await sb.from('testimonials').select('*').eq('id', id).single();
        t = data;
    }
    if (!t) return;
    document.getElementById('testFormModal').style.display = 'block';
    document.getElementById('test_modal_title').textContent = 'Edit Testimonial';
    document.getElementById('m_test_id').value = t.id;
    document.getElementById('m_test_name').value = t.name || '';
    document.getElementById('m_test_loc').value = t.location || '';
    document.getElementById('m_test_rating').value = t.rating || 5;
    document.getElementById('m_test_img').value = t.image_url || '';
    document.getElementById('m_test_msg').value = t.message || '';
}

async function saveTestimonial() {
    const name = document.getElementById('m_test_name').value.trim();
    if (!name) { showToast('Please enter guest name.', 'error'); return; }
    const id = document.getElementById('m_test_id').value;
    const payload = {
        name,
        location: document.getElementById('m_test_loc').value.trim(),
        rating: parseInt(document.getElementById('m_test_rating').value) || 5,
        image_url: document.getElementById('m_test_img').value.trim(),
        message: document.getElementById('m_test_msg').value.trim()
    };
    if (id) payload.id = id;

    if (window.CatalogStore) {
        await window.CatalogStore.save('testimonials', payload, sb);
    } else if (sb) {
        const { error } = id ? await sb.from('testimonials').update(payload).eq('id', id) : await sb.from('testimonials').insert([payload]);
        if (error) {
            showToast('Error saving testimonial: ' + error.message, 'error');
            return;
        }
    }
    document.getElementById('testFormModal').style.display = 'none';
    showToast('Testimonial saved.');
    loadAdminTestimonials();
}

async function loadAdminFaqs() {
    const table = document.getElementById('table_faqs');
    if (!table) return;

    let faqs = [];
    if (window.CatalogStore) {
        faqs = await window.CatalogStore.getAll('faqs', sb);
    } else if (sb) {
        const { data, error } = await sb.from('faqs').select('*');
        if (!error && data) faqs = data;
    }

    if (faqs.length === 0) {
        table.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:32px; color:#94a3b8;">No FAQs in database yet.<br><small>Click <strong>"+ Add FAQ"</strong> to create one.</small></td></tr>`;
        return;
    }

    table.innerHTML = faqs.map(f => `
        <tr>
            <td><strong>${escapeHTML(f.question)}</strong></td>
            <td><span class="luxury-badge">${f.is_published ? 'Live' : 'Hidden'}</span></td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editFaq('${escapeHTML(f.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm" onclick="delItem('faqs', '${escapeHTML(f.id)}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openFaqModal() {
    document.getElementById('faqFormModal').style.display = 'block';
    document.getElementById('faq_modal_title').textContent = 'Add FAQ';
    document.getElementById('m_faq_id').value = '';
    document.querySelectorAll('#faqFormModal input, #faqFormModal textarea').forEach(i => i.value = '');
    document.getElementById('m_faq_pub').value = 'true';
}

async function editFaq(id) {
    let f = null;
    if (window.CatalogStore) {
        const faqs = await window.CatalogStore.getAll('faqs', sb);
        f = faqs.find(x => x.id === id);
    } else if (sb) {
        const { data } = await sb.from('faqs').select('*').eq('id', id).single();
        f = data;
    }
    if (!f) return;
    document.getElementById('faqFormModal').style.display = 'block';
    document.getElementById('faq_modal_title').textContent = 'Edit FAQ';
    document.getElementById('m_faq_id').value = f.id;
    document.getElementById('m_faq_question').value = f.question || '';
    document.getElementById('m_faq_answer').value = f.answer || '';
    document.getElementById('m_faq_pub').value = f.is_published ? 'true' : 'false';
}

async function saveFaq() {
    const question = document.getElementById('m_faq_question').value.trim();
    if (!question) { showToast('Please enter question.', 'error'); return; }
    const id = document.getElementById('m_faq_id').value;
    const payload = {
        question,
        answer: document.getElementById('m_faq_answer').value.trim(),
        is_published: document.getElementById('m_faq_pub').value === 'true'
    };
    if (id) payload.id = id;

    if (window.CatalogStore) {
        await window.CatalogStore.save('faqs', payload, sb);
    } else if (sb) {
        const { error } = id ? await sb.from('faqs').update(payload).eq('id', id) : await sb.from('faqs').insert([payload]);
        if (error) {
            showToast('Error saving FAQ: ' + error.message, 'error');
            return;
        }
    }
    document.getElementById('faqFormModal').style.display = 'none';
    showToast('FAQ saved.');
    loadAdminFaqs();
    if (typeof loadHomeFaqs === 'function') loadHomeFaqs();
}

// Settings Admin
async function loadAdminSettings() {
    if (sb) {
        try {
            const { data } = await sb.from('website_settings').select('*').eq('id', 1).maybeSingle();
            if (data) appSettings = { ...appSettings, ...data };
        } catch(e) {}
    }
    document.getElementById('set_name').value = appSettings.business_name || '';
    document.getElementById('set_email').value = appSettings.email || '';
    document.getElementById('set_phone').value = appSettings.phone || '';
    document.getElementById('set_whatsapp').value = appSettings.whatsapp || '';
    document.getElementById('set_address').value = appSettings.address || '';
}

async function saveSettings() {
    appSettings = {
        business_name: document.getElementById('set_name').value.trim(),
        email: document.getElementById('set_email').value.trim(),
        phone: document.getElementById('set_phone').value.trim(),
        whatsapp: document.getElementById('set_whatsapp').value.trim(),
        address: document.getElementById('set_address').value.trim()
    };
    if (sb) await sb.from('website_settings').update(appSettings).eq('id', 1);
    showToast('Settings saved.');
}

async function delItem(table, id) {
    if (!id) {
        showToast('Cannot delete record: Missing valid ID.', 'error');
        return;
    }
    showConfirm('Are you sure you want to permanently delete this record?', async () => {
        const entityMap = {
            packages: 'packages',
            destinations: 'destinations',
            blog_posts: 'blogs',
            blogs: 'blogs',
            testimonials: 'testimonials',
            faqs: 'faqs'
        };
        const entity = entityMap[table] || table;

        if (window.CatalogStore && ['packages', 'destinations', 'blogs', 'testimonials', 'faqs'].includes(entity)) {
            await window.CatalogStore.delete(entity, id, sb);
        } else if (sb) {
            const { error } = await sb.from(table).delete().eq('id', id);
            if (error) {
                showToast('Failed to delete: ' + error.message, 'error');
                return;
            }
        }
        showToast('Record deleted successfully.');
        if (table === 'packages') loadAdminPackages();
        else if (table === 'destinations') loadAdminDestinations();
        else if (table === 'enquiries') loadAdminEnquiries();
        else if (table === 'blog_posts' || table === 'blogs') loadAdminBlog();
        else if (table === 'faqs') loadAdminFaqs();
        else if (table === 'testimonials') loadAdminTestimonials();
    });
}

// Push All Catalog Data to Supabase & Reset Actions
async function triggerPushCatalogToSupabase() {
    const btn = document.getElementById('btn_push_supabase');
    const logBox = document.getElementById('push_supabase_log');
    if (!sb) {
        showToast('Database connection is not available.', 'error');
        return;
    }
    if (logBox) {
        logBox.style.display = 'block';
        logBox.innerHTML = '<div style="color:var(--gold-400);"><i class="fas fa-spinner fa-spin"></i> Initializing catalog push to Supabase...</div>';
    }
    await withLoading(btn, async () => {
        try {
            const report = await window.CatalogStore.seedToSupabase(sb, msg => {
                if (logBox) {
                    logBox.innerHTML += `<div style="font-size:12px; color:#94a3b8; margin-top:4px;">✔ ${escapeHTML(msg)}</div>`;
                    logBox.scrollTop = logBox.scrollHeight;
                }
            });
            if (logBox) {
                logBox.innerHTML += `
                    <div style="margin-top:12px; padding:10px; background:#0c1a3d; border-radius:6px; border:1px solid var(--border-gold);">
                        <strong style="color:var(--gold-400);">Sync Complete!</strong><br>
                        Inserted: ${report.inserted} | Updated: ${report.updated} | Errors: ${report.errors.length}
                        ${report.errors.length > 0 ? '<br><small style="color:#ef4444;">' + report.errors.map(escapeHTML).join('<br>') + '</small>' : ''}
                    </div>
                `;
            }
            showToast(`Catalog synced! Inserted: ${report.inserted}, Updated: ${report.updated}`);
            loadAdminPackages();
            loadAdminDestinations();
            loadAdminBlog();
            loadAdminTestimonials();
            loadAdminFaqs();
        } catch (err) {
            if (logBox) {
                logBox.innerHTML += `<div style="color:#ef4444; margin-top:8px;">Error: ${escapeHTML(err.message)}</div>`;
            }
            showToast('Sync failed: ' + err.message, 'error');
        }
    });
}

function triggerResetCatalog() {
    showConfirm('Are you sure you want to reset all custom edits and deletions back to factory defaults?', () => {
        if (window.CatalogStore) {
            window.CatalogStore.resetToDefaults();
            showToast('All catalog data reset to luxury defaults.');
            loadAdminPackages();
            loadAdminDestinations();
            loadAdminBlog();
            loadAdminTestimonials();
            loadAdminFaqs();
        }
    });
}

function toggleAllCheckboxes(type, master) {
    document.querySelectorAll(`.${type}-checkbox`).forEach(cb => cb.checked = master.checked);
}


// --- AUTOMATIC SESSION VERIFICATION & BOOT ---
window.addEventListener('DOMContentLoaded', async () => {
    // Check dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    const loginBox = document.getElementById('admin-login');
    const dashBox = document.getElementById('admin-dashboard');

    if (sb) {
        try {
            const { data: { session } } = await sb.auth.getSession();
            if (session) {
                if (loginBox) loginBox.style.display = 'none';
                if (dashBox) dashBox.style.display = 'block';
                await initAdminDashboard();
            } else {
                if (loginBox) loginBox.style.display = 'block';
                if (dashBox) dashBox.style.display = 'none';
            }
        } catch (e) {
            if (loginBox) loginBox.style.display = 'block';
            if (dashBox) dashBox.style.display = 'none';
        }
    } else {
        if (loginBox) loginBox.style.display = 'block';
        if (dashBox) dashBox.style.display = 'none';
    }
});
