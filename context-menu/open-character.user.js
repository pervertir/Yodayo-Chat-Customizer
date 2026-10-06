// ==UserScript==
// @name         Yodayo: Open character in new tab
// @namespace    MOESCAPE
// @version      1.0.0
// @description  Right-click > Tampermonkey > open the character image (yours or the site's) in a new tab
// @author       Pervertir
// @match        https://yodayo.com/tavern/chat/*
// @match        https://moescape.ai/tavern/chat/*
// @icon         https://yodayo.com/favicon.ico
// @run-at       context-menu
// @grant        GM_openInTab
// @updateURL    https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/context-menu/open-character.user.js
// @downloadURL  https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/context-menu/open-character.user.js
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

    // Customizer's image first, then the site's own character image
    const img = document.querySelector('#character-image-container img[src]') ||
        document.querySelector('img.mx-auto.h-full.w-auto.object-contain.object-bottom[src]');
    const src = img && (img.currentSrc || img.src);
    if (src) openImage(src).catch(e => notify('Could not open the character image: ' + e.message));
    else notify('No character image on this page.');
})();
