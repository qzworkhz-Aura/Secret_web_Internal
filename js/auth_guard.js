/**
 * Auth Guard — taruh di halaman yang perlu diproteksi.
 * Kalau belum login, redirect ke password_pages.html
 * 
 * Cara pakai: tambahkan <script src="/js/auth_guard.js"></script> 
 * di halaman yang mau diproteksi (sebelum </body>)
 */
(async function() {
    const CREDENTIALS_PATH = '/credentials.json';
    const PASSWORD_PAGE = '/password_pages.html';

    try {
        const res = await fetch(CREDENTIALS_PATH);
        if (!res.ok) return; // Gagal load = skip guard

        const creds = await res.json();
        const raw = localStorage.getItem(creds.session_key);

        if (!raw) {
            window.location.href = PASSWORD_PAGE;
            return;
        }

        const session = JSON.parse(raw);
        if (!session.authenticated) {
            window.location.href = PASSWORD_PAGE;
            return;
        }

        // Cek expiry
        const elapsed = Date.now() - session.timestamp;
        if (elapsed > session.expiresIn) {
            localStorage.removeItem(creds.session_key);
            window.location.href = PASSWORD_PAGE;
            return;
        }

        // Session valid — lanjut tampilkan halaman
    } catch (err) {
        console.error('[AuthGuard] Error:', err);
    }
})();
