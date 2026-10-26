// background removal
//
// Cuts the character out of the current chat background with the ImageTools
// background-removal API (submit > poll status > download a transparent PNG).
// The API key is never stored in the repo: it is asked for on first use and kept
// in Tampermonkey storage. A rejected key (401) is cleared so the next run asks again.
//
// Tampermonkey keeps each script's storage separate, so the Customizer and the right-click
// "Remove background" script share the ImageTools key through page events: a script without a key
// asks, and one that has it answers (events are dispatched synchronously, so the answer arrives
// before dispatchEvent returns). A key rejected by the API is announced so both drop it.

const BG_REMOVAL_API = 'https://imagetools.top/api/v1/background-removal';
const BG_REMOVAL_KEY_NAME = 'ycc_imagetools_api_key';
const BG_REMOVAL_POLL_MS = 1000;
const BG_REMOVAL_MAX_POLLS = 120;
const BG_REMOVAL_MAX_BYTES = 10 * 1024 * 1024;
const API_KEY_REQUEST_EVENT = 'ycc:imagetools-key-request';
const API_KEY_RESPONSE_EVENT = 'ycc:imagetools-key';
const API_KEY_REJECTED_EVENT = 'ycc:imagetools-key-rejected';

// Answer the other script's requests, and drop a key it found to be rejected
document.addEventListener(API_KEY_REQUEST_EVENT, () => {
    const key = GM_getValue(BG_REMOVAL_KEY_NAME, '');
    if (key) document.dispatchEvent(new CustomEvent(API_KEY_RESPONSE_EVENT, { detail: key }));
});
document.addEventListener(API_KEY_REJECTED_EVENT, (e) => {
    if (e.detail && e.detail === GM_getValue(BG_REMOVAL_KEY_NAME, '')) GM_deleteValue(BG_REMOVAL_KEY_NAME);
});

/**
 * The key the other script has, if it is installed and has one.
 * @returns {string}
 */
function requestSharedApiKey() {
    let shared = '';
    const onResponse = (e) => { if (typeof e.detail === 'string' && e.detail) shared = e.detail; };
    document.addEventListener(API_KEY_RESPONSE_EVENT, onResponse);
    document.dispatchEvent(new CustomEvent(API_KEY_REQUEST_EVENT));
    document.removeEventListener(API_KEY_RESPONSE_EVENT, onResponse);
    return shared;
}

/** @returns {string|null} */
function getBackgroundRemovalApiKey() {
    let key = GM_getValue(BG_REMOVAL_KEY_NAME, '') || requestSharedApiKey();
    if (!key) {
        key = (prompt('ImageTools API key (stored in Tampermonkey, only sent to imagetools.top):') || '').trim();
    }
    if (key && key !== GM_getValue(BG_REMOVAL_KEY_NAME, '')) GM_setValue(BG_REMOVAL_KEY_NAME, key);
    return key || null;
}

/**
 * GM_xmlhttpRequest as a promise; it ignores CORS, so it can reach the API and any image host.
 * @param {Object} opts
 * @returns {Promise<{status:number, response:any, responseText:string, headers:string}>}
 */
function bgRemovalRequest(opts) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            ...opts,
            onload: r => resolve({ status: r.status, response: r.response, responseText: r.responseText, headers: r.responseHeaders || '' }),
            onerror: () => reject(new Error('Network error')),
            ontimeout: () => reject(new Error('Request timed out')),
        });
    });
}

/** @param {{status:number, response:any, responseText:string}} r @returns {string} */
function bgRemovalErrorDetail(r) {
    try {
        const body = typeof r.response === 'object' && !(r.response instanceof Blob) ? r.response : JSON.parse(r.responseText);
        if (body && body.detail) return body.detail;
    } catch (_) { /* not JSON */ }
    return `HTTP ${r.status}`;
}

/**
 * Calls the API with the key, waiting and retrying when rate limited.
 * @param {string} key
 * @param {Object} opts
 * @param {(text: string) => void} onProgress
 */
async function bgRemovalApi(key, opts, onProgress) {
    for (let attempt = 0; attempt < 5; attempt++) {
        const r = await bgRemovalRequest({ ...opts, headers: { ...(opts.headers || {}), 'X-API-Key': key } });
        if (r.status === 429) {
            const m = r.headers.match(/^retry-after:\s*(\d+)/im);
            const wait = m ? Number(m[1]) : 5;
            onProgress(`Rate limited, retrying in ${wait}s…`);
            await new Promise(res => setTimeout(res, wait * 1000));
            continue;
        }
        if (r.status === 401) {
            GM_deleteValue(BG_REMOVAL_KEY_NAME);
            document.dispatchEvent(new CustomEvent(API_KEY_REJECTED_EVENT, { detail: key }));
            throw new Error('API key was rejected. Try again to enter a new one.');
        }
        return r;
    }
    throw new Error('Still rate limited, try again in a minute.');
}

/**
 * URL of the chat background currently shown (the customizer's or the site's).
 * @returns {string|null}
 */
function getCurrentBackgroundSrc() {
    const urlOf = (el) => {
        const bg = el.style.backgroundImage || getComputedStyle(el).backgroundImage;
        const m = bg && bg.match(/url\(\s*(['"]?)(.*?)\1\s*\)/);
        return m ? m[2] : null;
    };
    // The sharp background layer first (the bg-cover one is a blurred copy behind it)
    const layer = [...document.querySelectorAll('div.bg-no-repeat, div.bg-cover')]
        .sort((a, b) => b.classList.contains('bg-no-repeat') - a.classList.contains('bg-no-repeat'))
        .find(el => urlOf(el));
    return layer ? urlOf(layer) : null;
}

/**
 * Loads an image URL or data: URL as a Blob with an image/* type (the API rejects anything else).
 * @param {string} src
 * @returns {Promise<Blob>}
 */
async function loadImageBlob(src) {
    if (src.startsWith('data:')) {
        // Decode by hand: the site's security policy blocks fetch() of data: URLs
        const [meta, data] = src.split(',', 2);
        const type = (meta.match(/^data:([^;,]+)/) || [])[1] || 'image/png';
        const bytes = meta.includes(';base64') ? Uint8Array.from(atob(data), c => c.charCodeAt(0))
            : new TextEncoder().encode(decodeURIComponent(data));
        return new Blob([bytes], { type: type.startsWith('image/') ? type : 'image/png' });
    }
    const r = await bgRemovalRequest({ method: 'GET', url: new URL(src, location.href).href, responseType: 'blob', timeout: 30000 });
    if (r.status !== 200) throw new Error(`Could not download the background (HTTP ${r.status})`);
    const ext = (src.match(/\.(png|webp|gif)(\?|$)/i) || [])[1];
    const type = r.response.type && r.response.type.startsWith('image/') ? r.response.type
        : (ext ? 'image/' + ext.toLowerCase() : 'image/jpeg');
    return new Blob([r.response], { type });
}

/**
 * Removes the background of an image.
 * @param {Blob} image
 * @param {(text: string) => void} [onProgress]
 * @returns {Promise<Blob>} transparent PNG at the original size
 */
async function removeImageBackground(image, onProgress = () => {}) {
    if (image.size > BG_REMOVAL_MAX_BYTES) throw new Error('Image is over the 10 MB limit.');
    const key = getBackgroundRemovalApiKey();
    if (!key) throw new Error('No API key entered.');

    const ext = (image.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
    const form = new FormData();
    form.append('file', image, `background.${ext}`);

    onProgress('Uploading…');
    const submit = await bgRemovalApi(key, { method: 'POST', url: `${BG_REMOVAL_API}/process`, data: form, responseType: 'json' }, onProgress);
    if (submit.status !== 200) throw new Error('Submit failed: ' + bgRemovalErrorDetail(submit));
    const jobId = (submit.response || JSON.parse(submit.responseText)).job_id;

    for (let i = 0; i < BG_REMOVAL_MAX_POLLS; i++) {
        await new Promise(res => setTimeout(res, BG_REMOVAL_POLL_MS));
        const res = await bgRemovalApi(key, { method: 'GET', url: `${BG_REMOVAL_API}/status/${jobId}`, responseType: 'json' }, onProgress);
        if (res.status !== 200) throw new Error('Status check failed: ' + bgRemovalErrorDetail(res));
        const { status, error_message } = res.response || JSON.parse(res.responseText);
        if (status === 'failed') throw new Error(error_message || 'Background removal failed');
        if (status === 'completed') {
            const out = await bgRemovalApi(key, { method: 'GET', url: `${BG_REMOVAL_API}/result/${jobId}`, responseType: 'blob' }, onProgress);
            if (out.status !== 200) throw new Error('Download failed: ' + bgRemovalErrorDetail(out));
            return new Blob([out.response], { type: 'image/png' });
        }
        onProgress(status === 'processing' ? 'Removing background…' : 'Waiting in queue…');
    }
    throw new Error('Timed out waiting for background removal.');
}

// --- NEW CHATS ---

/**
 * First visit to a chat (nothing saved for it yet) whose character has no full-body image, only a
 * background showing it: the character is cut out of that background and saved as the character's
 * image (its theme, so later chats with it reuse the cut-out), and the chat gets a random background
 * from the collection, saved for the chat. Nothing changes if the cut-out isn't possible, since a
 * new background would otherwise hide the character.
 * @param {string} characterId
 * @returns {Promise<void>}
 */
async function setUpNewChat(characterId) {
    const chatId = CHAT_ID;
    if (!characterId || characterId === chatId) return;
    const [chatRecord, characterRecord] = await Promise.all([getCharacterRecord(chatId), getCharacterRecord(characterId)]);
    if (chatRecord) return; // set up or customized before
    const hasImage = !!characterRecord?.character_image;
    if (hasImage && characterRecord?.background_image) return;

    let character;
    try {
        const characters = await fetchChatCharacters(chatId);
        character = characters.find(c => c.uuid === characterId) || characters[0];
    } catch (e) {
        console.warn('New chat setup: could not load the character:', e);
        return;
    }
    // A full-body image is already shown; a background-only character needs its background
    if (!character || character.image || !character.background || getChatIdFromUrl() !== chatId) return;

    let backgroundUrl = null;
    if (!hasImage) {
        if (!getBackgroundRemovalApiKey()) return;
        showInjectionNotification(notification_resource_name, null, `Cutting ${character.nickname} out of the background…`);
        // The random background is picked while the cut-out is made
        backgroundUrl = pickRandomCollectionBackground().catch(() => null);
        try {
            const png = await removeImageBackground(await loadImageBlob(character.background));
            const imageBase64 = await fileToBase64(new File([png], 'character.png', { type: 'image/png' }));
            await saveCharacterFieldsBatch(characterId, { character_image: imageBase64, record_type: 'character' });
            if (getChatIdFromUrl() !== chatId) return;
            setCharacterImage(imageBase64);
            temp_form_data.character_image = imageBase64;
        } catch (e) {
            console.error('New chat setup: cutting out the character failed:', e);
            showInjectionNotification(notification_resource_name, null, `Could not cut out ${character.nickname}: ${e.message}`);
            return;
        }
    }
    // Only a chat without a background of its own gets one
    if (!characterRecord?.background_image) await applyRandomChatBackground(await backgroundUrl);
}

// Remember the right-clicked element for the 'Remove background' context-menu script
// (context-menu scripts only start after the menu item is clicked, so they can't see it).
const CONTEXT_TARGET_ATTR = 'data-ycc-context-target';
const CONTEXT_TRACKING_ATTR = 'data-ycc-context-tracking';
if (!document.documentElement.hasAttribute(CONTEXT_TRACKING_ATTR)) {
    document.documentElement.setAttribute(CONTEXT_TRACKING_ATTR, '');
    window.addEventListener('contextmenu', (e) => {
        document.querySelectorAll(`[${CONTEXT_TARGET_ATTR}]`).forEach(el => el.removeAttribute(CONTEXT_TARGET_ATTR));
        if (e.target instanceof Element) e.target.setAttribute(CONTEXT_TARGET_ATTR, '');
    }, true);
}

// The 'Remove background' right-click script sends its result here, so it is kept for the
// Save button even though right-clicking outside Customize Chat closes the popup.
const SET_CHARACTER_IMAGE_EVENT = 'ycc:set-character-image';
document.addEventListener(SET_CHARACTER_IMAGE_EVENT, (e) => {
    const dataUrl = e.detail;
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return;
    e.preventDefault(); // tells the sender the Customizer took it
    (async () => {
        const blob = dataUrlToBlob(dataUrl); // the site's security policy blocks fetch() of data: URLs
        const imageBase64 = await fileToBase64(new File([blob], 'character.png', { type: 'image/png' }));
        if (isGroupChat()) {
            setActiveGroupCharacterImage(imageBase64);
            return;
        }
        setCharacterImage(imageBase64);
        temp_form_data.character_image = imageBase64;
        const urlInput = document.querySelector('#character-image-url-input');
        if (urlInput) urlInput.value = '';
    })().catch(err => console.error('Setting the character image failed:', err));
});

/** @param {string} dataUrl @returns {Blob} */
function dataUrlToBlob(dataUrl) {
    const [meta, data] = dataUrl.split(',', 2);
    const type = (meta.match(/^data:([^;,]+)/) || [])[1] || 'image/png';
    return new Blob([Uint8Array.from(atob(data), c => c.charCodeAt(0))], { type });
}
