/**
 * PWA Registration & Sleek Install Banner Engine
 */
class PWAEngine {
    static init() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('PWA ServiceWorker registered:', reg.scope))
                    .catch(err => console.warn('ServiceWorker registration failed:', err));
            });
        }

        let deferredPrompt = null;

        // Create PWA Bottom Install Banner Popup DOM Node dynamically if not present
        let banner = document.getElementById('pwa-install-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'pwa-install-banner';
            banner.className = 'pwa-banner-popup';
            banner.innerHTML = `
                <div class="pwa-banner-content">
                    <img src="assets/logo.png" alt="Razel Tech Icon" class="pwa-banner-icon">
                    <div class="pwa-banner-text">
                        <h4>Install Photo Booth Pro</h4>
                        <p>Add to home screen for full-screen camera studio experience</p>
                    </div>
                </div>
                <div class="pwa-banner-actions">
                    <button class="btn-pwa-install-action" id="pwa-banner-install-btn">📲 Install</button>
                    <button class="btn-pwa-close-action" id="pwa-banner-close-btn" aria-label="Dismiss banner">✕</button>
                </div>
            `;
            document.body.appendChild(banner);
        }

        const bannerInstallBtn = document.getElementById('pwa-banner-install-btn');
        const bannerCloseBtn = document.getElementById('pwa-banner-close-btn');

        if (bannerCloseBtn) {
            bannerCloseBtn.addEventListener('click', () => {
                if (banner) banner.classList.remove('show');
            });
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (banner) banner.classList.add('show');
        });

        if (bannerInstallBtn) {
            bannerInstallBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('PWA installed successfully');
                }
                deferredPrompt = null;
                if (banner) banner.classList.remove('show');
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    PWAEngine.init();
});

window.PWAEngine = PWAEngine;
