/**
 * ==============================================================================
 * VIA TOURS & TRAVELS — APPLICATION & SECURITY CONFIGURATION
 * ==============================================================================
 * 
 * ARCHITECTURAL PRINCIPLE: "SECRETS OFF THE FRONTEND"
 * 
 * 1. NEVER include private API keys, service-role keys, database passwords,
 *    or master secrets in client-side code.
 * 2. Only strictly public / publishable identifiers (such as the Supabase URL
 *    and the public anon/publishable key) are permitted in the browser.
 * 3. All privileged database operations, payment processing, transactional emails,
 *    and administrative overrides MUST be routed through server-side backends
 *    or Supabase Edge Functions guarded by Row Level Security (RLS).
 * ==============================================================================
 */

(function(window) {
    'use strict';

    // --- FORCE HTTPS IN PRODUCTION ---
    if (window.location && window.location.protocol === 'http:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        !window.location.hostname.startsWith('192.168.') &&
        !window.location.hostname.startsWith('10.')) {
        window.location.replace('https://' + window.location.hostname + window.location.pathname + window.location.search + window.location.hash);
    }

    // --- KNOWN SECRET PATTERNS (STRICTLY PROHIBITED ON FRONTEND) ---
    const SECRET_PATTERNS = [
        /service_role/i,                  // Supabase service-role token/key
        /^sb_secret_/i,                   // Supabase new secret key format
        /^sk_live_/i,                     // Stripe / OpenAI live secret key
        /^sk_test_/i,                     // Stripe / OpenAI test secret key
        /^whsec_/i,                       // Webhook signing secret
        /-----BEGIN (RSA )?PRIVATE KEY-/, // Private cryptographic keys
        /AIza[0-9A-Za-z-_]{35}/,          // Unrestricted Google Cloud Master Service Account
        /ghp_[0-9a-zA-Z]{36}/             // GitHub Personal Access Token
    ];

    /**
     * Inspects a string or token to determine if it is a private secret.
     * Checks token prefix, keyword matches, and inspects JWT payload claims.
     * @param {string} key 
     * @returns {boolean} true if key is a detected secret
     */
    function isSecretKey(key) {
        if (!key || typeof key !== 'string') return false;

        // Check against known regex patterns
        for (let i = 0; i < SECRET_PATTERNS.length; i++) {
            if (SECRET_PATTERNS[i].test(key)) {
                return true;
            }
        }

        // Check if key is a JWT token containing service_role claim
        if (key.includes('.') && key.split('.').length === 3) {
            try {
                const base64Url = key.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                );
                const payload = JSON.parse(jsonPayload);
                if (payload && (payload.role === 'service_role' || payload.iss === 'supabase-admin')) {
                    return true;
                }
            } catch (e) {
                // Ignore parsing errors for non-JWT keys
            }
        }

        return false;
    }

    /**
     * Inspects and validates credentials before allowing frontend initialization.
     * Throws a fatal security error if a private secret key is supplied.
     */
    function assertNotSecret(key, keyName) {
        if (isSecretKey(key)) {
            const errorMsg = `[CRITICAL SECURITY ALERT] Private secret detected in ${keyName}! "Secrets off the frontend" violation. Service-role and master secret keys MUST NEVER be exposed to the browser. Initialization blocked to safeguard database integrity.`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    }

    // --- PUBLIC RUNTIME CONFIGURATION ---
    // Can be overridden via window.__ENV__ or environment-injected meta tags
    const metaUrl = document.querySelector('meta[name="supabase-url"]')?.getAttribute('content');
    const metaKey = document.querySelector('meta[name="supabase-publishable-key"]')?.getAttribute('content');
    const envOverrides = window.__ENV__ || {};

    const SUPABASE_URL = envOverrides.SUPABASE_URL || metaUrl || 'https://goqwtovltftehautxekh.supabase.co';
    const SUPABASE_KEY = envOverrides.SUPABASE_KEY || metaKey || 'sb_publishable_bQXp8x_2x4ymx4_oxcOFUA_UTGsqF-5';

    // Standalone Python FastAPI Backend endpoint (optional, with auto-fallback to client-side Supabase)
    const metaApiUrl = document.querySelector('meta[name="via-backend-api"]')?.getAttribute('content');
    const BACKEND_API_URL = envOverrides.BACKEND_API_URL || metaApiUrl || (
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://127.0.0.1:8000/api'
            : ''
    );

    // Verify publishable key is not a private secret
    assertNotSecret(SUPABASE_KEY, 'SUPABASE_KEY');

    // Create client safely
    let clientInstance = null;
    function getSupabaseClient() {
        if (!clientInstance && window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                clientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                });
            } catch (err) {
                console.warn('[ViaSecurity] Supabase client initialization warning:', err.message);
                clientInstance = null;
            }
        }
        return clientInstance;
    }

    // --- XSS INPUT SANITIZATION ---
    function sanitizeInput(val) {
        if (!val || typeof val !== 'string') return '';
        return val
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/data:text\/html/gi, '')
            .trim();
    }

    // --- FORM INTERACTION TIME-LOCK BOT DEFENSE ---
    const formInteractionTimers = {};

    function recordFormStart(formId) {
        if (!formId) return;
        if (!formInteractionTimers[formId]) {
            formInteractionTimers[formId] = Date.now();
        }
    }

    function getFormInteractionDuration(formId) {
        if (!formId || !formInteractionTimers[formId]) return -1;
        return (Date.now() - formInteractionTimers[formId]) / 1000;
    }

    function resetFormTimer(formId) {
        if (formId) delete formInteractionTimers[formId];
    }

    // --- CLIENT-SIDE SLIDING-WINDOW RATE LIMITER ---
    function checkRateLimit(action, maxAllowed = 4, windowSeconds = 300) {
        const storageKey = `via_rl_${action}`;
        const now = Date.now();
        let history = [];

        try {
            if (typeof sessionStorage !== 'undefined') {
                const raw = sessionStorage.getItem(storageKey);
                if (raw) history = JSON.parse(raw);
            }
        } catch (e) {}

        const cutoff = now - (windowSeconds * 1000);
        history = history.filter(ts => typeof ts === 'number' && ts > cutoff);

        if (history.length >= maxAllowed) {
            const oldestInWindow = history[0];
            const remainingSec = Math.ceil(((oldestInWindow + (windowSeconds * 1000)) - now) / 1000);
            return {
                allowed: false,
                remainingSeconds: Math.max(1, remainingSec),
                message: `Too many submissions. Please wait ${Math.max(1, remainingSec)}s before submitting again, or contact our 24/7 concierge on WhatsApp.`
            };
        }

        history.push(now);
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem(storageKey, JSON.stringify(history));
            }
        } catch (e) {}

        return { allowed: true, remainingSeconds: 0 };
    }

    // --- COMPREHENSIVE BOT & SPAM CHECK ---
    function checkBotSubmission(formId, honeypotValue, minSeconds = 1.5) {
        // 1. Honeypot check
        if (honeypotValue && String(honeypotValue).trim().length > 0) {
            return {
                isBot: true,
                reason: 'honeypot_triggered',
                silentlyDiscard: true
            };
        }

        // 2. Time-lock check (human needs at least minSeconds to fill form)
        const duration = getFormInteractionDuration(formId);
        if (duration >= 0 && duration < minSeconds) {
            return {
                isBot: true,
                reason: 'time_lock_violation',
                silentlyDiscard: true
            };
        }

        // 3. Rate limiting check
        const rateCheck = checkRateLimit(formId || 'general_form', 4, 300);
        if (!rateCheck.allowed) {
            return {
                isBot: false,
                isRateLimited: true,
                reason: 'rate_limited',
                message: rateCheck.message,
                remainingSeconds: rateCheck.remainingSeconds,
                silentlyDiscard: false
            };
        }

        return { isBot: false, isRateLimited: false };
    }

    // Export security suite and config to global window
    window.__VIA_CONFIG__ = Object.freeze({
        SUPABASE_URL,
        SUPABASE_KEY,
        BACKEND_API_URL,
        GA_MEASUREMENT_ID: envOverrides.GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
        IS_PRODUCTION: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
        SECRETS_OFF_FRONTEND: true
    });

    window.ViaSecurity = Object.freeze({
        isSecretKey,
        assertNotSecret,
        getSupabaseClient,
        sanitizeInput,
        recordFormStart,
        getFormInteractionDuration,
        resetFormTimer,
        checkRateLimit,
        checkBotSubmission
    });

    // Provide backward-compatible globals for legacy scripts
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_KEY = SUPABASE_KEY;

})(window);
