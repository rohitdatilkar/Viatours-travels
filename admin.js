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

// --- UNIFIED FORM VALIDATION ENGINE FOR ADMIN ---
const ViaValidator = window.ViaValidator || {
    emailRegex: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
    phoneRegex: /^(?:\+?\d{1,4}[\s\-]?)?(?:\(?\d{2,5}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{3,5}$/,

    isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const trimmed = email.trim();
        return trimmed.length <= 254 && this.emailRegex.test(trimmed);
    },

    isValidPhone(phone) {
        if (!phone || typeof phone !== 'string') return false;
        const trimmed = phone.trim();
        const digitsOnly = trimmed.replace(/\D/g, '');
        return digitsOnly.length >= 7 && digitsOnly.length <= 15 && this.phoneRegex.test(trimmed);
    },

    isValidName(name, minLength = 2) {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        return trimmed.length >= minLength && /[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/.test(trimmed);
    },

    isValidDate(dateStr, allowPast = false) {
        if (!dateStr || typeof dateStr !== 'string') return false;
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) return false;
        if (!allowPast) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const selected = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                return selected >= today;
            }
            return parsed >= today;
        }
        return true;
    },

    isValidNumber(val, min = 0, max = Infinity) {
        const num = Number(val);
        return !isNaN(num) && num >= min && num <= max;
    },

    isValidText(text, minLength = 1, maxLength = 20000) {
        if (!text || typeof text !== 'string') return false;
        const trimmed = text.trim();
        return trimmed.length >= minLength && trimmed.length <= maxLength;
    },

    setFieldError(inputEl, message) {
        if (!inputEl) return;
        inputEl.classList.add('is-invalid');
        inputEl.classList.remove('is-valid');
        let errEl = inputEl.parentNode?.querySelector('.field-error-msg');
        if (!errEl) {
            errEl = document.createElement('div');
            errEl.className = 'field-error-msg';
            errEl.style.color = '#ef4444';
            errEl.style.fontSize = '0.8rem';
            errEl.style.marginTop = '4px';
            inputEl.parentNode?.appendChild(errEl);
        }
        errEl.textContent = message;
    },

    clearFieldError(inputEl) {
        if (!inputEl) return;
        inputEl.classList.remove('is-invalid');
        inputEl.classList.remove('is-valid');
        const errEl = inputEl.parentNode?.querySelector('.field-error-msg');
        if (errEl) errEl.remove();
    },

    markFieldValid(inputEl) {
        if (!inputEl) return;
        inputEl.classList.remove('is-invalid');
        inputEl.classList.add('is-valid');
        const errEl = inputEl.parentNode?.querySelector('.field-error-msg');
        if (errEl) errEl.remove();
    },

    clearFormErrors(formEl) {
        if (!formEl) return;
        formEl.querySelectorAll('.is-invalid, .is-valid').forEach(el => {
            el.classList.remove('is-invalid', 'is-valid');
        });
        formEl.querySelectorAll('.field-error-msg').forEach(el => el.remove());
    },

    focusFirstError(formEl) {
        if (!formEl) return;
        const firstInvalid = formEl.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.focus();
            if (typeof firstInvalid.scrollIntoView === 'function') {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
};
window.ViaValidator = ViaValidator;

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

    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPass');
    const email = emailInput?.value.trim() || '';
    const password = passInput?.value || '';
    const btn = document.getElementById('loginBtn');
    const form = document.getElementById('adminLoginForm');

    let valid = true;

    if (!email) {
        ViaValidator.setFieldError(emailInput, 'Please enter your admin email address.');
        valid = false;
    } else if (!ViaValidator.isValidEmail(email)) {
        ViaValidator.setFieldError(emailInput, 'Please enter a valid email address.');
        valid = false;
    } else {
        ViaValidator.markFieldValid(emailInput);
    }

    if (!password) {
        ViaValidator.setFieldError(passInput, 'Please enter your account password.');
        valid = false;
    } else if (password.length < 6) {
        ViaValidator.setFieldError(passInput, 'Password must be at least 6 characters.');
        valid = false;
    } else {
        ViaValidator.markFieldValid(passInput);
    }

    if (!valid) {
        ViaValidator.focusFirstError(form);
        showToast('Please check the highlighted login fields.', 'error');
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
                ViaValidator.setFieldError(passInput, 'Invalid email or password credentials.');
                showToast(`Login failed (${loginAttempts}/5): ${error.message}`, 'error');
            }
            return;
        }

        ViaValidator.clearFormErrors(form);
        loginAttempts = 0;
        showToast('Welcome back, Executive Administrator.', 'success');
        initAdminDashboard();
    });
}

async function forgotPassword() {
    const emailInput = document.getElementById('loginEmail');
    const email = emailInput?.value.trim() || '';
    if (!ViaValidator.isValidEmail(email)) {
        ViaValidator.setFieldError(emailInput, 'Please enter a valid admin email address to receive password reset link.');
        showToast('Please enter a valid admin email address.', 'error');
        return;
    }
    ViaValidator.clearFieldError(emailInput);
    if (sb) {
        const { error } = await sb.auth.resetPasswordForEmail(email);
        if (error) showToast(error.message, 'error');
        else showToast('Password reset link sent to your email.', 'success');
    }
}

async function logout() {
    if (sb) {
        try { await sb.auth.signOut(); } catch (e) {}
    }
    const loginBox = document.getElementById('admin-login');
    const dashBox = document.getElementById('admin-dashboard');
    if (loginBox) loginBox.style.display = 'block';
    if (dashBox) dashBox.style.display = 'none';
    showToast('Signed out of staff portal successfully.');
    setTimeout(() => {
        window.location.href = 'index.html#/home';
    }, 700);
}

function toggleSidebar() {
    const side = document.getElementById('adminSide');
    const main = document.getElementById('adminMain');
    if (!side) return;
    if (window.innerWidth <= 992) {
        side.classList.toggle('mobile-open');
    } else {
        side.classList.toggle('collapsed');
        if (main) main.classList.toggle('expanded');
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
    if (ev && ev.currentTarget) {
        ev.currentTarget.classList.add('active');
    }

    const titles = {
        dashboard: 'Executive Overview',
        packages: 'Package Management',
        destinations: 'Destination Portfolio',
        enquiries: 'Client Inquiries',
        customers: 'Client Database',
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
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${escapeHTML(p.image_url || p.image || 'assets/agency-logo.webp')}" alt="" style="width:48px; height:48px; border-radius:8px; object-fit:cover;" onerror="this.src='assets/agency-logo.png'">
                    <div>
                        <strong style="color:#0c1a3d;">${escapeHTML(p.title)}</strong>
                        <div style="font-size:0.75rem; color:#64748b;">${escapeHTML(p.destination_id || p.dest || '')}</div>
                    </div>
                </div>
            </td>
            <td>${escapeHTML(p.duration || '')}</td>
            <td><strong>₹${formatPrice(p.price)}</strong></td>
            <td><span class="luxury-badge">${p.is_active !== false ? 'Live' : 'Hidden'}</span></td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editPackage('${escapeHTML(p.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-outline btn-sm" onclick="delItem('packages', '${escapeHTML(p.id)}')"><i class="fas fa-trash"></i></button>
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
    } else if (sb) {
        const { data } = await sb.from('destinations').select('*').order('name', { ascending: true });
        if (data) dests = data;
    }
    select.innerHTML = '<option value="">None / Custom Destination</option>' + dests.map(d => `<option value="${escapeHTML(d.id)}">${escapeHTML(d.name)} (${escapeHTML(d.country || '')})</option>`).join('');
}

async function savePackage() {
    const titleInput = document.getElementById('m_pkg_title');
    const priceInput = document.getElementById('m_pkg_price');
    const durationInput = document.getElementById('m_pkg_duration');
    const modal = document.getElementById('pkgFormModal');

    const title = titleInput ? titleInput.value.trim() : '';
    const price = parseFloat(priceInput?.value || 0);
    const duration = durationInput ? durationInput.value.trim() : '';

    let valid = true;

    if (!title || title.length < 3) {
        ViaValidator.setFieldError(titleInput, 'Please enter package title (at least 3 characters).');
        valid = false;
    } else {
        ViaValidator.markFieldValid(titleInput);
    }

    if (isNaN(price) || price <= 0) {
        ViaValidator.setFieldError(priceInput, 'Please enter a valid price greater than 0.');
        valid = false;
    } else {
        ViaValidator.markFieldValid(priceInput);
    }

    if (!duration) {
        ViaValidator.setFieldError(durationInput, 'Please enter package duration (e.g. 5 Days / 4 Nights).');
        valid = false;
    } else {
        ViaValidator.markFieldValid(durationInput);
    }

    if (!valid) {
        ViaValidator.focusFirstError(modal);
        showToast('Please fix the package form errors.', 'error');
        return;
    }

    const id = document.getElementById('m_pkg_id').value;
    const payload = {
        title,
        price,
        duration,
        category: document.getElementById('m_pkg_cat').value.trim(),
        destination_id: document.getElementById('m_pkg_dest').value || null,
        short_description: document.getElementById('m_pkg_short_desc').value.trim(),
        description: document.getElementById('m_pkg_desc').value.trim(),
        itinerary: currentItinerary,
        inclusions: document.getElementById('m_pkg_inc').value.split('\n').map(s => s.trim()).filter(Boolean),
        exclusions: document.getElementById('m_pkg_exc').value.split('\n').map(s => s.trim()).filter(Boolean)
    };
    const imgFile = document.getElementById('m_pkg_img_file')?.files[0];
    if (imgFile) {
        const uploadedUrl = await uploadFileToSupabase(imgFile, 'package-images');
        if (uploadedUrl) payload.image_url = uploadedUrl;
    }
    const galleryFiles = document.getElementById('m_pkg_gallery_files')?.files;
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
    const pkg = currentPackages.find(p => p.id === id);
    if (!pkg) return;
    document.getElementById('m_pkg_id').value = pkg.id;
    document.getElementById('m_pkg_title').value = pkg.title || '';
    document.getElementById('m_pkg_dest').value = pkg.destination_id || pkg.dest || '';
    document.getElementById('m_pkg_price').value = pkg.price || '';
    document.getElementById('m_pkg_duration').value = pkg.duration || '';
    document.getElementById('m_pkg_rating').value = pkg.rating || '4.9';
    document.getElementById('m_pkg_short_desc').value = pkg.short_description || '';
    document.getElementById('m_pkg_desc').value = pkg.description || '';
    document.getElementById('m_pkg_inc').value = (pkg.inclusions || []).join('\n');
    document.getElementById('m_pkg_exc').value = (pkg.exclusions || []).join('\n');
    currentItinerary = pkg.itinerary || [];
    renderItinEditor();
    currentGallery = pkg.gallery || [];
    renderGalleryPreview();
    document.getElementById('pkgFormModal').style.display = 'block';
}
async function loadAdminDestinations() {
    const table = document.getElementById('table_destinations');
    if (!table) return;
    let destinations = [];
    if (window.CatalogStore) {
        destinations = await window.CatalogStore.getAll('destinations', sb);
    } else if (sb) {
        const { data } = await sb.from('destinations').select('*').order('name', { ascending: true });
        if (data) destinations = data;
    }
    currentDestinations = destinations;
    if (!destinations || destinations.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:24px; color:#94a3b8;">No destinations recorded.</td></tr>';
        return;
    }
    table.innerHTML = destinations.map(d => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${escapeHTML(d.image_url || 'assets/agency-logo.webp')}" alt="" style="width:48px; height:48px; border-radius:8px; object-fit:cover;" onerror="this.src='assets/agency-logo.png'">
                    <div>
                        <strong style="color:#0c1a3d;">${escapeHTML(d.name)}</strong>
                        <div style="font-size:0.75rem; color:#64748b;">${escapeHTML(d.region || '')}</div>
                    </div>
                </div>
            </td>
            <td><strong>${escapeHTML(d.country || '')}</strong></td>
            <td>${escapeHTML(d.best_time || 'All Year')}</td>
            <td><span class="luxury-badge">${d.is_published !== false ? 'Live' : 'Hidden'}</span></td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editDestination('${escapeHTML(d.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-outline btn-sm" onclick="delItem('destinations', '${escapeHTML(d.id)}')"><i class="fas fa-trash"></i></button>
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
    const nameInput = document.getElementById('m_dest_name');
    const countryInput = document.getElementById('m_dest_country');
    const modal = document.getElementById('destFormModal');

    const name = nameInput ? nameInput.value.trim() : '';
    const country = countryInput ? countryInput.value.trim() : '';

    let valid = true;

    if (!name || name.length < 2) {
        ViaValidator.setFieldError(nameInput, 'Please enter destination name (at least 2 letters).');
        valid = false;
    } else {
        ViaValidator.markFieldValid(nameInput);
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

// RFC-4180 CSV Export
async function exportEnquiriesCSV() {
    if (!sb) return;
    const { data } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
    if (!data || data.length === 0) {
        showToast('No enquiries to export.', 'info');
        return;
    }
    const headers = ['id', 'name', 'email', 'phone', 'destination', 'travelers', 'status', 'created_at', 'notes'];
    const csvRows = [headers.join(',')];
    data.forEach(r => {
        const values = headers.map(h => {
            const val = r[h] === null || r[h] === undefined ? '' : String(r[h]).replace(/"/g, '""');
            return `"${val}"`;
        });
        csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enquiries_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
// Enquiries Admin & RFC-4180 CSV Export
async function loadAdminEnquiries() {
    const table = document.getElementById('table_enquiries');
    if (!table || !sb) return;
    const { data } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
    table.innerHTML = (data || []).map(e => `
        <tr>
            <td>
                <strong>${escapeHTML(e.name || e.customer_name || 'Guest')}</strong><br>
                <small style="color:#64748b;">${escapeHTML(e.email || '')}<br>${escapeHTML(e.phone || '')}</small>
            </td>
            <td>
                <strong>${escapeHTML(e.destination || 'N/A')}</strong><br>
                <small style="color:#64748b;">Dates: ${escapeHTML(e.travel_dates || 'Flexible')}<br>Budget: ${escapeHTML(e.budget || 'On Quote')}</small>
            </td>
            <td>
                <select class="status-dropdown" onchange="changeStatus('enquiries', '${escapeHTML(e.id)}', this.value)" style="background:#f8fafc; color:#0c1a3d; border:1px solid #cbd5e1; border-radius:6px; padding:6px 10px; font-size:13px; font-weight:600; cursor:pointer;">
                    <option ${e.status === 'New' ? 'selected' : ''}>New</option>
                    <option ${e.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                    <option ${e.status === 'Quotation Sent' ? 'selected' : ''}>Quotation Sent</option>
                    <option ${e.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option ${e.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
                <textarea placeholder="VIP internal notes" onchange="saveNote('${escapeHTML(e.id)}', this.value)" style="width:100%; margin-top:6px; font-size:12px; background:#f8fafc; color:#0c1a3d; border:1px solid #cbd5e1; border-radius:6px; padding:6px; font-family:inherit;">${escapeHTML(e.internal_notes || '')}</textarea>
            </td>
            <td>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button class="btn btn-outline btn-sm" onclick="createBookingFromEnquiry('${escapeHTML(e.id)}')" title="Convert to Booking"><i class="fas fa-calendar-plus"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="delItem('enquiries', '${escapeHTML(e.id)}')" title="Delete Enquiry"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function changeStatus(table, id, status) {
    if (!sb) return;
    try {
        const { error } = await sb.from(table).update({ status: status }).eq('id', id);
        if (error) {
            showToast('Failed to update status.', 'error');
        } else {
            showToast(`Status updated to ${status}.`, 'success');
            loadAdminStats();
            if (table === 'enquiries') loadAdminEnquiries();
            if (table === 'bookings') loadAdminBookings();
        }
    } catch (e) {
        showToast('Error updating status.', 'error');
    }
}

async function saveNote(id, text) {
    if (!sb) return;
    try {
        const { error } = await sb.from('enquiries').update({ internal_notes: text }).eq('id', id);
        if (error) {
            showToast('Failed to save notes.', 'error');
        } else {
            showToast('Internal notes saved.', 'success');
        }
    } catch (e) {
        showToast('Error saving note.', 'error');
    }
}

async function createBookingFromEnquiry(enqId) {
    if (!sb) return;
    try {
        const { data: enq, error } = await sb.from('enquiries')
            .select('id, name, customer_name, email, phone, destination, package_id, travel_dates, travelers, budget')
            .eq('id', enqId)
            .single();
        if (error || !enq) {
            showToast('Enquiry not found.', 'error');
            return;
        }
        openBookModal();
        const dateInput = document.getElementById('m_book_date');
        const nameInput = document.getElementById('m_book_customer_name');
        const travInput = document.getElementById('m_book_travelers');
        const pkgInput = document.getElementById('m_book_package_name');
        if (dateInput) dateInput.value = enq.travel_dates || '';
        if (nameInput) nameInput.value = enq.name || enq.customer_name || '';
        if (travInput) travInput.value = parseInt(enq.travelers) > 0 ? parseInt(enq.travelers) : 2;
        if (enq.package_id) {
            const { data: pkg } = await sb.from('packages').select('id, title').eq('id', enq.package_id).maybeSingle();
            if (pkg && pkgInput) pkgInput.value = pkg.title;
        } else if (enq.destination && pkgInput) {
            pkgInput.value = 'Custom Journey — ' + enq.destination;
        }
    } catch (e) {
        showToast('Error loading enquiry details.', 'error');
    }
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
            <td><textarea placeholder="Customer VIP notes" onchange="saveCustNote('${escapeHTML(c.id)}', this.value)" style="background:#f8fafc; color:#0c1a3d; border:1px solid #cbd5e1; border-radius:6px; padding:6px; width:100%; font-size:12px; font-family:inherit;">${escapeHTML(c.notes || '')}</textarea></td>
        </tr>
    `).join('');
}

async function saveCustNote(id, text) {
    if (!sb) return;
    try {
        const { error } = await sb.from('customers').update({ notes: text }).eq('id', id);
        if (error) {
            showToast('Failed to save customer notes.', 'error');
        } else {
            showToast('Customer notes saved.', 'success');
        }
    } catch (e) {
        showToast('Error saving customer note.', 'error');
    }
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
    document.getElementById('bookFormModal').style.display = 'block';
    document.querySelectorAll('#bookFormModal input, #bookFormModal select').forEach(i => {
        if (i.type !== 'hidden') i.value = '';
    });
}

async function saveBooking() {
    const custInput = document.getElementById('m_book_customer_name');
    const pkgInput = document.getElementById('m_book_package_name');
    const dateInput = document.getElementById('m_book_date');
    const totalInput = document.getElementById('m_book_total');
    const paidInput = document.getElementById('m_book_paid');
    const travelersInput = document.getElementById('m_book_travelers');
    const statusInput = document.getElementById('m_book_status');

    const total = parseFloat(totalInput?.value || 0);
    const paid = parseFloat(paidInput?.value || 0);
    const payload = {
        customer_name: custInput?.value.trim() || 'VIP Client',
        package_name: pkgInput?.value.trim() || 'Custom Escapes',
        travel_date: dateInput?.value || null,
        travelers: parseInt(travelersInput?.value || 2),
        total_amount: total,
        amount_paid: paid,
        balance: total - paid,
        booking_status: statusInput?.value || 'Confirmed'
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
                <button class="btn btn-outline btn-sm" onclick="delItem('blog', '${escapeHTML(b.id)}')"><i class="fas fa-trash"></i></button>
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
    } else if (sb) {
        const { data } = await sb.from('blog_posts').select('*').eq('id', id).single();
        b = data;
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
    const titleInput = document.getElementById('m_blog_title');
    const contentInput = document.getElementById('m_blog_content');
    const modal = document.getElementById('blogFormModal');

    const title = titleInput ? titleInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';

    let valid = true;

    if (!title || title.length < 3) {
        ViaValidator.setFieldError(titleInput, 'Please enter article title (at least 3 characters).');
        valid = false;
    } else {
        ViaValidator.markFieldValid(titleInput);
    }

    if (!content || content.length < 20) {
        ViaValidator.setFieldError(contentInput, 'Please provide article content (at least 20 characters).');
        valid = false;
    } else {
        ViaValidator.markFieldValid(contentInput);
    }

    if (!valid) {
        ViaValidator.focusFirstError(modal);
        showToast('Please check the blog post fields.', 'error');
        return;
    }

    const id = document.getElementById('m_blog_id')?.value;
    const payload = {
        title,
        slug: document.getElementById('m_blog_slug').value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image_url: document.getElementById('m_blog_img').value.trim(),
        excerpt: document.getElementById('m_blog_excerpt').value.trim(),
        content: content,
        is_published: document.getElementById('m_blog_pub').value === 'true'
    };
    if (id) payload.id = id;
    if (sb) {
        if (id) {
            await sb.from('blog').update(payload).eq('id', id);
        } else {
            await sb.from('blog').insert([payload]);
        }
    }
    document.getElementById('blogFormModal').style.display = 'none';
    showToast('Journal post saved!');
    loadAdminBlog();
}

async function loadAdminTestimonials() {
    const table = document.getElementById('table_testimonials');
    if (!table || !sb) return;
    const { data } = await sb.from('testimonials').select('*').order('created_at', { ascending: false });
    if (!data || data.length === 0) {
        table.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#94a3b8;">No testimonials recorded yet.</td></tr>`;
        return;
    }
    table.innerHTML = data.map(t => `
        <tr>
            <td><strong>${escapeHTML(t.name)}</strong><br><small style="color:#64748b;">${escapeHTML(t.location || '')}</small></td>
            <td>${escapeHTML(t.destination || '')}</td>
            <td>⭐ ${t.rating || 5}</td>
            <td><p style="margin:0; font-size:0.85rem; color:#475569;">${escapeHTML(t.quote || '')}</p></td>
            <td>
                <button class="btn btn-gold btn-sm" onclick="editTestimonial('${escapeHTML(t.id)}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-outline btn-sm" onclick="delItem('testimonials', '${escapeHTML(t.id)}')"><i class="fas fa-trash"></i></button>
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

async function delItem(tableName, id) {
    if (!id) {
        showToast('Cannot delete record: Missing valid ID.', 'error');
        return;
    }
    showConfirm('Are you sure you want to permanently delete this record?', async () => {
        const entityMap = {
            packages: 'packages',
            destinations: 'destinations',
            enquiries: 'enquiries',
            bookings: 'bookings',
            testimonials: 'testimonials',
            faqs: 'faqs',
            blog: 'blog'
        };
        const table = entityMap[tableName] || tableName;
        try {
            if (sb) {
                const { error } = await sb.from(table).delete().eq('id', id);
                if (error) throw error;
            } else if (window.CatalogStore) {
                window.CatalogStore.deleteItem(table, id);
            }
            showToast('Item deleted successfully.');
            // Reload corresponding tab
            if (tableName === 'packages') loadAdminPackages();
            else if (tableName === 'destinations') loadAdminDestinations();
            else if (tableName === 'enquiries') loadAdminEnquiries();
            else if (tableName === 'bookings') loadAdminBookings();
            else if (tableName === 'testimonials') loadAdminTestimonials();
            else if (tableName === 'faqs') loadAdminFaqs();
            else if (tableName === 'blog') loadAdminBlog();
            loadAdminStats();
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Failed to delete item: ' + (err.message || err), 'error');
        }
    });
}

async function triggerPushToSupabase(btn) {
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
            showToast('Catalog reset to factory defaults.');
            loadAdminPackages();
            loadAdminStats();
        }
    });
}

// --- AUTOMATIC SESSION VERIFICATION & BOOT ---
window.addEventListener('DOMContentLoaded', async () => {
    // Clear any residual dark-mode state to enforce executive light theme
    try {
        localStorage.removeItem('darkMode');
        localStorage.removeItem('via_theme');
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
    } catch (e) {}

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

function toggleAllCheckboxes(type, masterCheckbox) {
    const isChecked = masterCheckbox ? masterCheckbox.checked : false;
    const cls = type === 'package' ? '.package-checkbox' : (type === 'destination' ? '.destination-checkbox' : `.${type}-checkbox`);
    document.querySelectorAll(cls).forEach(cb => {
        cb.checked = isChecked;
    });
}

function triggerPushCatalogToSupabase(btn) {
    const targetBtn = btn || document.getElementById('btn_push_supabase');
    return triggerPushToSupabase(targetBtn);
}

// Window global bindings for inline HTML handlers
window.exportEnquiries = typeof exportEnquiriesCSV === 'function' ? exportEnquiriesCSV : exportEnquiries;
window.exportEnquiriesCSV = typeof exportEnquiriesCSV === 'function' ? exportEnquiriesCSV : exportEnquiries;
window.triggerPushCatalogToSupabase = triggerPushCatalogToSupabase;
window.triggerPushToSupabase = triggerPushToSupabase;
window.toggleAllCheckboxes = toggleAllCheckboxes;
window.openPkgModal = openPkgModal;
window.openDestModal = openDestModal;
window.openBookModal = openBookModal;
window.openBlogModal = openBlogModal;
window.openTestModal = openTestModal;
window.openFaqModal = openFaqModal;
window.savePackage = savePackage;
window.saveDestination = saveDestination;
window.saveBooking = saveBooking;
window.saveBlogPost = saveBlogPost;
window.saveTestimonial = saveTestimonial;
window.saveFaq = saveFaq;
window.saveSettings = saveSettings;
window.delItem = delItem;
window.changeStatus = changeStatus;
window.saveNote = saveNote;
window.saveCustNote = saveCustNote;
window.createBookingFromEnquiry = createBookingFromEnquiry;
window.adminLogin = adminLogin;
window.forgotPassword = forgotPassword;
window.logout = logout;
window.showAdminTab = showAdminTab;
window.toggleSidebar = toggleSidebar;

