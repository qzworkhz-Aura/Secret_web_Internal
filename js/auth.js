/**
 * Auth Module — SHA-256 hash comparison + localStorage session
 * Untuk static site password protection.
 * 
 * Cara ganti password:
 * 1. Buka browser console di password_pages.html
 * 2. Ketik: generateHash('passwordBaruLu')
 * 3. Copy hash-nya, paste ke credentials.json
 */

const AUTH = {
    credentialsPath: '/credentials.json',
    credentials: null,

    /**
     * Load credentials.json
     */
    async loadCredentials() {
        if (this.credentials) return this.credentials;
        try {
            const res = await fetch(this.credentialsPath);
            if (!res.ok) throw new Error('Gagal load credentials');
            this.credentials = await res.json();
            return this.credentials;
        } catch (err) {
            console.error('[Auth] Error loading credentials:', err);
            return null;
        }
    },

    /**
     * Hash string pakai SHA-256 (Web Crypto API)
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Verifikasi password terhadap hash di credentials.json
     * @param {string} password - Password yang diinput user
     * @param {string} pageKey - Key halaman di credentials.json (default: 'home')
     * @returns {object} { success: boolean, redirect: string|null }
     */
    async verify(password, pageKey = 'home') {
        const creds = await this.loadCredentials();
        if (!creds || !creds.pages[pageKey]) {
            return { success: false, redirect: null, message: 'Credentials tidak ditemukan' };
        }

        const page = creds.pages[pageKey];
        const inputHash = await this.hashPassword(password);

        if (inputHash === page.hash) {
            // Simpan session di localStorage
            const session = {
                authenticated: true,
                pageKey: pageKey,
                timestamp: Date.now(),
                expiresIn: (creds.session_duration_hours || 24) * 60 * 60 * 1000
            };
            localStorage.setItem(creds.session_key, JSON.stringify(session));

            return { success: true, redirect: page.redirect, message: 'Selamat datang!' };
        }

        return { success: false, redirect: null, message: 'Password salah, coba lagi.' };
    },

    /**
     * Cek apakah user sudah authenticated (session masih valid)
     */
    async isAuthenticated() {
        const creds = await this.loadCredentials();
        if (!creds) return false;

        const raw = localStorage.getItem(creds.session_key);
        if (!raw) return false;

        try {
            const session = JSON.parse(raw);
            if (!session.authenticated) return false;

            // Cek expiry
            const elapsed = Date.now() - session.timestamp;
            if (elapsed > session.expiresIn) {
                localStorage.removeItem(creds.session_key);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Logout — hapus session
     */
    async logout() {
        const creds = await this.loadCredentials();
        if (creds) {
            localStorage.removeItem(creds.session_key);
        }
    }
};

/**
 * Utility: generate hash dari console browser
 * Pemakaian: buka console, ketik generateHash('passwordBaru')
 */
window.generateHash = async function(password) {
    const hash = await AUTH.hashPassword(password);
    console.log(`Password: "${password}"`);
    console.log(`SHA-256 : ${hash}`);
    console.log('Copy hash di atas, paste ke credentials.json');
    return hash;
};

/**
 * Init password form (dipanggil dari password_pages.html)
 */
function initPasswordForm() {
    const form = document.getElementById('password-form');
    const input = document.getElementById('password-input');
    const feedback = document.getElementById('password-feedback');
    const submitBtn = document.getElementById('password-submit');

    if (!form || !input) return;

    // Cek kalau sudah login, langsung redirect
    AUTH.isAuthenticated().then(isAuth => {
        if (isAuth) {
            AUTH.loadCredentials().then(creds => {
                if (creds && creds.pages.home) {
                    window.location.href = creds.pages.home.redirect;
                }
            });
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = input.value.trim();
        if (!password) {
            showFeedback(feedback, 'Masukkan password dulu.', 'error');
            shakeInput(input);
            return;
        }

        // Loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span>';

        const result = await AUTH.verify(password);

        if (result.success) {
            showFeedback(feedback, result.message, 'success');
            submitBtn.innerHTML = '✓';
            submitBtn.classList.add('success');

            // Redirect setelah animasi
            setTimeout(() => {
                window.location.href = result.redirect;
            }, 600);
        } else {
            showFeedback(feedback, result.message, 'error');
            shakeInput(input);
            input.value = '';
            input.focus();
            submitBtn.disabled = false;
            submitBtn.innerHTML = '→';
        }
    });

    // Toggle password visibility
    const toggleBtn = document.getElementById('password-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggleBtn.innerHTML = isPassword ? '🙈' : '👁';
            toggleBtn.setAttribute('aria-label', isPassword ? 'Sembunyikan password' : 'Tampilkan password');
        });
    }
}

function showFeedback(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.className = 'password-feedback ' + type;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
}

function shakeInput(el) {
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
}

// Auto init ketika DOM ready
document.addEventListener('DOMContentLoaded', initPasswordForm);
