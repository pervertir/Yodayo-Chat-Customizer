// ==UserScript==
// @name         Yodayo: Remove background
// @namespace    MOESCAPE
// @version      1.2.0
// @description  Right-click an image (or the chat) > Tampermonkey > Remove background: shows the cut-out as the character image
// @author       Pervertir
// @match        https://yodayo.com/*
// @match        https://moescape.ai/*
// @icon         https://yodayo.com/favicon.ico
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @connect      imagetools.top
// @connect      *
// @updateURL    https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/context-menu/remove-background.user.js
// @downloadURL  https://github.com/pervertir/Yodayo-Chat-Customizer/raw/refs/heads/main/context-menu/remove-background.user.js
// ==/UserScript==

// The API key is never stored in this file. On first use the script asks for it and keeps it in
// Tampermonkey's storage for this script (Dashboard > this script > Storage). A rejected key (401)
// is cleared, so the next run asks again.

(function () {
    'use strict';

    const API = 'https://imagetools.top/api/v1/background-removal';
    const KEY_NAME = 'imagetools_api_key';
    const POLL_MS = 1000;
    const MAX_POLLS = 120;
    const CONTEXT_TARGET_ATTR = 'data-ycc-context-target';
    const CONTEXT_TRACKING_ATTR = 'data-ycc-context-tracking';
    const MAX_IMAGE_DEPTH = 3;
    const CHARACTER_CONTAINER = '.pointer-events-none.absolute.inset-0.mt-16.overflow-hidden.landscape\\:inset-y-0.landscape\\:left-0.landscape\\:right-auto.landscape\\:w-1\\/2';

    let note = null;
    let noteTimer = null;
    /**
     * Shows a toast. Sticky toasts stay until the next message.
     * @param {string} text
     * @param {boolean} [sticky]
     */
    function notify(text, sticky = false) {
        if (!note) {
            note = document.createElement('div');
            note.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;' +
                'background:#1f1f23;color:#fff;padding:10px 16px;border-radius:8px;font:14px sans-serif;' +
                'box-shadow:0 4px 12px rgba(0,0,0,.4);max-width:90vw';
            document.body.appendChild(note);
        }
        note.textContent = text;
        clearTimeout(noteTimer);
        if (!sticky) noteTimer = setTimeout(() => { note.remove(); note = null; }, 4000);
    }

    /** @returns {string|null} */
    function getApiKey() {
        let key = GM_getValue(KEY_NAME, '');
        if (!key) {
            key = (prompt('ImageTools API key (stored in Tampermonkey, only sent to imagetools.top):') || '').trim();
            if (key) GM_setValue(KEY_NAME, key);
        }
        return key || null;
    }

    /**
     * GM_xmlhttpRequest as a promise; it ignores CORS, so it can reach the API and any image host.
     * @param {Object} opts
     * @returns {Promise<{status:number, response:any, responseText:string, headers:string}>}
     */
    function request(opts) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                ...opts,
                onload: r => resolve({ status: r.status, response: r.response, responseText: r.responseText, headers: r.responseHeaders || '' }),
                onerror: () => reject(new Error('Network error')),
                ontimeout: () => reject(new Error('Request timed out')),
            });
        });
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    /** @param {string} headers @returns {number} seconds to wait after a 429 */
    function retryAfter(headers) {
        const m = headers.match(/^retry-after:\s*(\d+)/im);
        return m ? Number(m[1]) : 5;
    }

    /** @param {{status:number, response:any, responseText:string}} r @returns {string} */
    function errorDetail(r) {
        try {
            const body = typeof r.response === 'object' && !(r.response instanceof Blob) ? r.response : JSON.parse(r.responseText);
            if (body && body.detail) return body.detail;
        } catch (_) { /* not JSON */ }
        return `HTTP ${r.status}`;
    }

    /**
     * Calls the API, waiting and retrying when rate limited.
     * @param {string} key
     * @param {Object} opts
     */
    async function api(key, opts) {
        for (let attempt = 0; attempt < 5; attempt++) {
            const r = await request({ ...opts, headers: { ...(opts.headers || {}), 'X-API-Key': key } });
            if (r.status === 429) {
                const wait = retryAfter(r.headers);
                notify(`Rate limited, retrying in ${wait}s…`, true);
                await sleep(wait * 1000);
                continue;
            }
            if (r.status === 401) {
                GM_deleteValue(KEY_NAME);
                throw new Error('API key was rejected. Run it again to enter a new one.');
            }
            return r;
        }
        throw new Error('Still rate limited, try again in a minute.');
    }

    /** @param {Element|null} el @returns {string|null} */
    function cssImageUrl(el) {
        if (!el) return null;
        const bg = el.style.backgroundImage || getComputedStyle(el).backgroundImage;
        const m = bg && bg.match(/url\(\s*(['"]?)(.*?)\1\s*\)/);
        return m ? m[2] : null;
    }

    /**
     * Loads an image URL or data: URL as a Blob with an image/* type (the API rejects anything else).
     * @param {string} src
     * @returns {Promise<Blob>}
     */
    async function loadImage(src) {
        if (src.startsWith('data:')) {
            // Decode by hand: the site's security policy blocks fetch() of data: URLs
            const [meta, data] = src.split(',', 2);
            const type = (meta.match(/^data:([^;,]+)/) || [])[1] || 'image/png';
            const bytes = meta.includes(';base64') ? Uint8Array.from(atob(data), c => c.charCodeAt(0))
                : new TextEncoder().encode(decodeURIComponent(data));
            return new Blob([bytes], { type: type.startsWith('image/') ? type : 'image/png' });
        }
        const r = await request({ method: 'GET', url: new URL(src, location.href).href, responseType: 'blob' });
        if (r.status !== 200) throw new Error(`Could not download the image (HTTP ${r.status})`);
        const ext = (src.match(/\.(png|webp|gif)(\?|$)/i) || [])[1];
        const type = r.response.type && r.response.type.startsWith('image/') ? r.response.type
            : (ext ? 'image/' + ext.toLowerCase() : 'image/jpeg');
        return new Blob([r.response], { type });
    }

    /**
     * Sends the image through submit > poll status > download result.
     * @param {string} key
     * @param {Blob} image
     * @returns {Promise<Blob>} transparent PNG
     */
    async function removeBackground(key, image) {
        if (image.size > 10 * 1024 * 1024) throw new Error('Image is over the 10 MB limit.');
        const ext = (image.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
        const form = new FormData();
        form.append('file', image, `image.${ext}`);

        const submit = await api(key, { method: 'POST', url: `${API}/process`, data: form, responseType: 'json' });
        if (submit.status !== 200) throw new Error('Submit failed: ' + errorDetail(submit));
        const jobId = (submit.response || JSON.parse(submit.responseText)).job_id;

        for (let i = 0; i < MAX_POLLS; i++) {
            await sleep(POLL_MS);
            const res = await api(key, { method: 'GET', url: `${API}/status/${jobId}`, responseType: 'json' });
            if (res.status !== 200) throw new Error('Status check failed: ' + errorDetail(res));
            const { status, error_message } = res.response || JSON.parse(res.responseText);
            if (status === 'failed') throw new Error(error_message || 'Background removal failed');
            if (status === 'completed') {
                const out = await api(key, { method: 'GET', url: `${API}/result/${jobId}`, responseType: 'blob' });
                if (out.status !== 200) throw new Error('Download failed: ' + errorDetail(out));
                return new Blob([out.response], { type: 'image/png' });
            }
            notify(status === 'processing' ? 'Removing background…' : 'Waiting in queue…', true);
        }
        throw new Error('Timed out waiting for background removal.');
    }

    /** @param {Blob} blob @returns {Promise<string>} */
    function toDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Shows the PNG as the character image, the same way the customizer does.
     * @param {string} dataUrl
     */
    function showCharacterImage(dataUrl) {
        const container = document.querySelector(CHARACTER_CONTAINER);
        if (!container) throw new Error('Character container not found on this page.');
        let img = container.querySelector('div > div > img');
        if (!img) {
            const wrapper = document.createElement('div');
            wrapper.id = 'character-image-container';
            wrapper.className = 'absolute inset-0 flex h-full w-full justify-center';
            wrapper.innerHTML = '<div class="flex-none"><img alt="" class="mx-auto h-full w-auto object-contain object-bottom"></div>';
            container.appendChild(wrapper);
            img = wrapper.querySelector('img');
        }
        img.src = dataUrl;
        img.style.height = '90vh';
    }

    /**
     * If the Customize Chat popup is open, hands it the PNG as if it had been picked in its
     * character image field, so its Save button stores it.
     * @param {Blob} png
     * @returns {boolean}
     */
    function giveToCustomizer(png) {
        const input = document.querySelector('#character-image-file-input');
        if (!input) return false;
        const dt = new DataTransfer();
        dt.items.add(new File([png], 'character.png', { type: 'image/png' }));
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    /**
     * First <img> at or inside `root`, searching at most `maxDepth` levels down (shallowest first).
     * @param {Element} root
     * @param {number} maxDepth
     * @returns {HTMLImageElement|null}
     */
    function findImage(root, maxDepth) {
        let level = [root];
        for (let depth = 0; depth <= maxDepth && level.length; depth++) {
            const img = level.find(el => el.tagName === 'IMG' && (el.currentSrc || el.src));
            if (img) return img;
            level = level.flatMap(el => [...el.children]);
        }
        return null;
    }

    /** @returns {string|null} the image that was right-clicked, if any */
    function clickedImageSrc() {
        const target = document.querySelector(`[${CONTEXT_TARGET_ATTR}]`);
        const img = target && findImage(target, MAX_IMAGE_DEPTH);
        return img ? (img.currentSrc || img.src) : null;
    }

    /** @returns {string|null} */
    function chatBackgroundSrc() {
        // The sharp background layer (the bg-cover one is a blurred copy behind it)
        const layer = [...document.querySelectorAll('div.bg-no-repeat, div.bg-cover')]
            .sort((a, b) => b.classList.contains('bg-no-repeat') - a.classList.contains('bg-no-repeat'))
            .find(el => cssImageUrl(el));
        return cssImageUrl(layer);
    }

    async function run() {
        if (!location.pathname.startsWith('/tavern/chat/')) return notify('Open a chat to set its character image.');
        // The right-clicked image (or one up to 3 levels inside the clicked element), else the chat background
        const src = clickedImageSrc() || chatBackgroundSrc();
        if (!src) return notify('No image found to remove the background from.');

        const key = getApiKey();
        if (!key) return notify('No API key entered.');

        notify('Uploading image…', true);
        const png = await removeBackground(key, await loadImage(src));
        showCharacterImage(await toDataUrl(png));
        notify(giveToCustomizer(png)
            ? 'Character image set. Press Save in Customize Chat to keep it.'
            : 'Character image set for now. Run this with Customize Chat open to be able to save it.');
    }

    // The menu command can't see what was right-clicked, so the element is remembered on right-click.
    // (The Customizer records it the same way; whichever loads first adds the listener.)
    if (!document.documentElement.hasAttribute(CONTEXT_TRACKING_ATTR)) {
        document.documentElement.setAttribute(CONTEXT_TRACKING_ATTR, '');
        window.addEventListener('contextmenu', (e) => {
            document.querySelectorAll(`[${CONTEXT_TARGET_ATTR}]`).forEach(el => el.removeAttribute(CONTEXT_TARGET_ATTR));
            if (e.target instanceof Element) e.target.setAttribute(CONTEXT_TARGET_ATTR, '');
        }, true);
    }

    // A registered command (rather than @run-at context-menu) stays in the menu after each use.
    // The site navigates without reloading, so it is registered on every page and checks the URL when used.
    GM_registerMenuCommand('Remove background', () => {
        run().catch(e => notify('Remove background failed: ' + e.message));
    });
})();
