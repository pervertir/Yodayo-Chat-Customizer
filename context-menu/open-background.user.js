// ==UserScript==
// @name         Yodayo: Open background in new tab
// @namespace    MOESCAPE
// @version      1.1.0
// @description  Right-click > Tampermonkey > open the chat background (yours or the site's) in a new tab
// @author       Pervertir
// @match        https://yodayo.com/*
// @match        https://moescape.ai/*
// @icon         https://yodayo.com/favicon.ico
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @updateURL    https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/context-menu/open-background.user.js
// @downloadURL  https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/context-menu/open-background.user.js
// ==/UserScript==

(function () {
    'use strict';

    function notify(text) {
        const note = document.createElement('div');
        note.textContent = text;
        note.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;' +
            'background:#1f1f23;color:#fff;padding:10px 16px;border-radius:8px;font:14px sans-serif;' +
            'box-shadow:0 4px 12px rgba(0,0,0,.4)';
        document.body.appendChild(note);
        setTimeout(() => note.remove(), 3000);
    }

    /**
     * Opens an image URL or data: URL in a new tab. Chrome refuses to open data: URLs
     * directly, so those become a blob: URL first.
     * @param {string} src
     */
    async function openImage(src) {
        let url = src;
        if (src.startsWith('data:')) {
            // Decode by hand: the site's security policy blocks fetch() of data: URLs
            const [meta, data] = src.split(',', 2);
            const type = (meta.match(/^data:([^;,]+)/) || [])[1] || 'image/png';
            const bytes = meta.includes(';base64') ? Uint8Array.from(atob(data), c => c.charCodeAt(0))
                : new TextEncoder().encode(decodeURIComponent(data));
            url = URL.createObjectURL(new Blob([bytes], { type }));
            setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
        }
        // window.open keeps the blob's origin; fall back to Tampermonkey if a popup blocker interferes
        if (!window.open(url, '_blank')) GM_openInTab(url, { active: true });
    }

    /** @param {Element|null} el @returns {string|null} */
    function cssImageUrl(el) {
        if (!el) return null;
        const bg = el.style.backgroundImage || getComputedStyle(el).backgroundImage;
        const m = bg && bg.match(/url\(\s*(['"]?)(.*?)\1\s*\)/);
        return m ? m[2] : null;
    }

    // A registered command (rather than @run-at context-menu) stays in the menu after each use.
    // The site navigates without reloading, so it is registered on every page and checks the URL when used.
    GM_registerMenuCommand('Open background in new tab', () => {
        if (!location.pathname.startsWith('/tavern/chat/')) return notify('Open a chat first.');
        // The sharp background layer (the bg-cover one is a blurred copy behind it)
        const layer = [...document.querySelectorAll('div.bg-no-repeat, div.bg-cover')]
            .sort((a, b) => b.classList.contains('bg-no-repeat') - a.classList.contains('bg-no-repeat'))
            .find(el => cssImageUrl(el));
        const src = cssImageUrl(layer);
        if (src) openImage(src).catch(e => notify('Could not open the background: ' + e.message));
        else notify('No background image on this page.');
    });
})();
