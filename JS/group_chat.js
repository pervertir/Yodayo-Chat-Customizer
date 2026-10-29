// group chats
//
// A group chat shows one avatar per character next to the header title. The site's own chat data
// (api.<site>/v1/chats/<id>) lists every member with its id, names and full-body photo, so it is
// used for the member list: characters that have not spoken yet have no link anywhere on the page.
//
// Settings: background and user colours are shared and saved like a normal chat. Each character's
// name, image and colours (name, narration, dialogue, bubble) are saved on the chat record under "<field>@<character id>" keys
// (flat, so the backup still leaves out large images), and with "Set as Character Theme" also on
// that character's own record, so they carry over to its other chats. Where each image was dragged
// to is saved on the chat record only ("character_position@<character id>"), as soon as it is dropped;
// the rest of each image's placement (size, rotation, opacity, flips; CHARACTER_ADJUST_FIELDS) is also
// kept for this chat only, on Save.
//
// Many characters have no full-body image, only a background showing them. For those the background
// is sent to the background-removal API (all characters at once) and the cut-out is used instead.
// It is saved on the chat record ("character_cutout@<character id>") so it is only made once.

/**
 * @typedef {Object} GroupCharacter
 * @property {string} uuid
 * @property {string} name - full site name, e.g. "Aisha Rizvi - Mysogynistic Muslim"
 * @property {string} nickname - name shown above messages, e.g. "Aisha Rizvi"
 * @property {string} image - URL of the site's full-body photo ('' when it only has a background)
 * @property {string} background - URL of the character's background photo ('' if none)
 */

/** Per-character fields in a group chat */
/** Each character's colours: field, colour input id in the customizer, DEFAULT_COLORS key */
const GROUP_CHARACTER_COLORS = [
    ['character_name_color', 'name-color-input', 'characterName'],
    ['character_narration_color', 'character-narration-color-input', 'characterNarration'],
    ['character_message_color', 'character-chat-color-input', 'characterChat'],
    ['character_message_box_color', 'character-chat-bg-color-input', 'characterChatBg'],
];
const GROUP_CHARACTER_FIELDS = ['character_alias', 'character_image', NO_AUTO_CUTOUT_FIELD,
    ...GROUP_CHARACTER_COLORS.map(([field]) => field)];
const GROUP_IMAGES_ID = 'group-character-images';
/** Dragged image offset, as fractions of the image area's width and height */
const GROUP_POSITION_FIELD = 'character_position';
/** Character cut out of its background, for characters without a full-body image */
const GROUP_CUTOUT_FIELD = 'character_cutout';
/** Chat record field: character ids from front to back */
const GROUP_LAYER_FIELD = 'group_layer_order';
/** @type {Set<string>} characters whose cut-out is being made */
const groupCutoutsInProgress = new Set();

/** @type {GroupCharacter[]} members of the current chat; empty unless it is a group chat */
let groupChatCharacters = [];
/** @type {Object<string, {character_alias?: string, character_name_color?: string, character_image?: string}>} */
let groupCharacterSettings = {};
/** @type {string|null} character whose tab is open in the customizer */
let activeGroupCharacterId = null;
/** @type {string[]} character ids from front to back, as saved; see getGroupLayerOrder */
let groupLayerOrder = [];
/** @type {MutationObserver|null} */
let groupImagesObserver = null;
let groupImagesQueued = false;

/**
 * @returns {boolean}
 */
function isGroupChat() {
    return groupChatCharacters.length > 1;
}

/**
 * Chat record key for a group character's field.
 * @param {string} field
 * @param {string} characterId
 * @returns {string}
 */
function groupFieldKey(field, characterId) {
    return `${field}@${characterId}`;
}

/**
 * Loads the chat's characters from the site's API (the browser's login cookies are sent along).
 * @param {string} chatId
 * @returns {Promise<GroupCharacter[]>}
 */
async function fetchChatCharacters(chatId) {
    const url = `https://api.${location.hostname.replace(/^www\./, '')}/v1/chats/${chatId}`;
    let data;
    try {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
    } catch (e) {
        console.warn('Chat details fetch failed, retrying through the userscript manager:', e);
        data = await new Promise((resolve, reject) => GM_xmlhttpRequest({
            method: 'GET',
            url,
            responseType: 'json',
            timeout: 15000,
            onload: r => (r.status >= 200 && r.status < 300 ? resolve(r.response) : reject(new Error(`HTTP ${r.status}`))),
            onerror: reject,
            ontimeout: () => reject(new Error('Timeout')),
        }));
    }
    return (data?.characters || []).filter(c => c && c.uuid && !c.deleted).map(c => ({
        uuid: c.uuid,
        name: c.name || c.nickname || '',
        nickname: c.nickname || c.name || '',
        image: c.photos?.[0]?.url || '',
        background: c.background_photos?.[0]?.url || '',
    }));
}

/**
 * Waits until the chat header shows its character avatars.
 * @param {number} timeoutMs
 * @returns {Promise<number>} number of avatars (0 if the header never appeared)
 */
function waitForHeaderAvatars(timeoutMs = 5000) {
    return new Promise(resolve => {
        const count = () => document.querySelectorAll(header_character_avatar).length;
        if (count()) return resolve(count());
        const observer = new MutationObserver(() => {
            if (count()) { observer.disconnect(); clearTimeout(timer); resolve(count()); }
        });
        const timer = setTimeout(() => { observer.disconnect(); resolve(count()); }, timeoutMs);
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

/**
 * Detects whether the current chat is a group chat and loads its members.
 * @param {string} chatId
 * @returns {Promise<boolean>}
 */
async function detectGroupChat(chatId) {
    resetGroupChatState();
    // Two or more avatars next to the header title means a group chat
    if (await waitForHeaderAvatars() < 2) return false;
    try {
        const characters = await fetchChatCharacters(chatId);
        if (getChatIdFromUrl() !== chatId) return false; // the user moved on meanwhile
        groupChatCharacters = characters.length > 1 ? characters : [];
    } catch (e) {
        console.error('Could not load the group chat characters:', e);
    }
    console.log('Group chat characters:', groupChatCharacters);
    return isGroupChat();
}

/**
 * Undoes everything group specific (leaving a group chat for another chat).
 * @returns {void}
 */
function resetGroupChatState() {
    groupChatCharacters.forEach(c => GROUP_CHARACTER_COLORS.forEach(([field]) => setGroupCharacterColor(c.uuid, field, '')));
    groupChatCharacters = [];
    groupCharacterSettings = {};
    groupCharacterAliases = {};
    activeGroupCharacterId = null;
    groupLayerOrder = [];
    if (groupImagesObserver) { groupImagesObserver.disconnect(); groupImagesObserver = null; }
    const row = document.getElementById(GROUP_IMAGES_ID);
    if (row) {
        [...row.parentElement.children].forEach(el => { if (el !== row) el.style.display = ''; });
        resetGroupImageArea(row.parentElement);
        row.remove();
    }
}

/**
 * Per-character settings: chat record first, then the character's own theme.
 * @param {CharacterRecord|null} chatRecord
 * @param {(CharacterRecord|null)[]} characterRecords - in groupChatCharacters order
 * @returns {typeof groupCharacterSettings}
 */
function mergeGroupCharacterSettings(chatRecord, characterRecords) {
    const settings = {};
    groupChatCharacters.forEach((c, i) => {
        settings[c.uuid] = {};
        GROUP_CHARACTER_FIELDS.forEach(field => {
            const value = chatRecord?.[groupFieldKey(field, c.uuid)] ?? characterRecords[i]?.[field];
            if (value !== undefined && value !== null) settings[c.uuid][field] = value;
        });
        [...CHARACTER_ADJUST_FIELDS, GROUP_CUTOUT_FIELD].forEach(field => {
            const value = chatRecord?.[groupFieldKey(field, c.uuid)];
            if (value) settings[c.uuid][field] = value;
        });
    });
    return settings;
}

/**
 * Loads and applies a group chat's settings: shared ones (Chat > Universal) and each character's.
 * @returns {Promise<void>}
 */
async function loadGroupCustomizedUI() {
    const [chatRecord, universalRecord, ...characterRecords] = await Promise.all([
        getCharacterRecord(CHAT_ID),
        getCharacterRecord('Universal'),
        ...groupChatCharacters.map(c => getCharacterRecord(c.uuid)),
    ]);
    const shared = mergeSettingsHierarchically(chatRecord, null, universalRecord);
    // Shared character colours stay as the defaults for characters without their own
    delete shared.character_alias;
    delete shared.character_image;
    await applySettingsToUI(shared);
    if (!shared.background_image) {
        // Without a custom background, prefer one from a character that also has a full-body image:
        // a background-only character's background usually shows that character itself
        const source = groupChatCharacters.find(c => c.image && c.background);
        if (source) await setBackgroundImage(source.background);
    }

    groupCharacterSettings = mergeGroupCharacterSettings(chatRecord, characterRecords);
    groupLayerOrder = Array.isArray(chatRecord?.[GROUP_LAYER_FIELD]) ? chatRecord[GROUP_LAYER_FIELD] : [];
    groupChatCharacters.forEach(c => {
        const settings = groupCharacterSettings[c.uuid];
        setGroupCharacterAlias(c.uuid, settings.character_alias);
        GROUP_CHARACTER_COLORS.forEach(([field]) => {
            if (settings[field]) setGroupCharacterColor(c.uuid, field, settings[field]);
        });
    });
    await renderGroupCharacterImages();
    const cutouts = makeGroupCharacterCutouts();
    // A new group chat where every character only has a background: once their cut-outs are
    // shown, give the chat a random background from the collection
    // (not awaited: the cut-outs take a few seconds)
    if (!chatRecord && !shared.background_image && !groupChatCharacters.some(c => c.image)) {
        const characters = groupChatCharacters;
        cutouts.then(() => {
            const shown = characters === groupChatCharacters && characters.some(c =>
                groupCharacterSettings[c.uuid]?.character_image || groupCharacterSettings[c.uuid]?.[GROUP_CUTOUT_FIELD]);
            if (shown) return applyRandomChatBackground();
        }).catch(e => console.error('Random background failed:', e));
    }
}

/**
 * For characters with only a background (no full-body or custom image), cuts the character out of
 * the background with the background-removal API, all in parallel, and saves the results for this chat.
 * @returns {Promise<void>}
 */
async function makeGroupCharacterCutouts() {
    const chatId = CHAT_ID;
    const characters = groupChatCharacters;
    const needed = characters.filter(c => {
        const settings = groupCharacterSettings[c.uuid] || {};
        return !c.image && c.background && !settings.character_image && !settings[GROUP_CUTOUT_FIELD] &&
            !settings[NO_AUTO_CUTOUT_FIELD] && !groupCutoutsInProgress.has(c.uuid);
    });
    if (!needed.length) return;
    // Ask for the API key once here, not once per character
    if (!getBackgroundRemovalApiKey()) {
        console.warn('No background-removal API key: characters without a full-body image are not shown.');
        return;
    }
    showInjectionNotification(notification_resource_name, null,
        `Cutting ${needed.map(c => c.nickname).join(', ')} out of their backgrounds…`);
    needed.forEach(c => groupCutoutsInProgress.add(c.uuid));
    const results = await Promise.allSettled(needed.map(async character => {
        try {
            const png = await removeImageBackground(await loadImageBlob(character.background));
            const cutout = await fileToBase64(new File([png], 'character.png', { type: 'image/png' }));
            if (characters !== groupChatCharacters) return; // left the chat meanwhile
            (groupCharacterSettings[character.uuid] ||= {})[GROUP_CUTOUT_FIELD] = cutout;
            await saveCharacterFieldsBatch(chatId, { [groupFieldKey(GROUP_CUTOUT_FIELD, character.uuid)]: cutout, record_type: 'chat' });
            await renderGroupCharacterImages();
        } finally {
            groupCutoutsInProgress.delete(character.uuid);
        }
    }));
    const failed = results.map((r, i) => r.status === 'rejected' ? [needed[i], r.reason] : null).filter(Boolean);
    failed.forEach(([character, error]) => console.error(`Cut-out of ${character.nickname} failed:`, error));
    if (failed.length) {
        showInjectionNotification(notification_resource_name, null,
            `Could not cut out ${failed.map(([c]) => c.nickname).join(', ')}: ${failed[0][1].message}`);
    }
}

/** @type {Map<string, string>} custom image URL -> base64, so re-renders don't download again */
const groupImageCache = new Map();

/**
 * Image src for a character: its custom image, else the site's photo, else the cut-out made from
 * its background ('' if none).
 * Custom URLs are converted to base64 like the single-character image (the site may block other hosts).
 * @param {GroupCharacter} character
 * @returns {Promise<string>}
 */
async function getGroupCharacterImageSrc(character) {
    const custom = groupCharacterSettings[character.uuid]?.character_image;
    if (!custom) {
        const cutout = groupCharacterSettings[character.uuid]?.[GROUP_CUTOUT_FIELD];
        return character.image || (cutout ? normalizeImageData(cutout) : '');
    }
    if (!isImageUrl(custom)) return normalizeImageData(custom);
    if (!groupImageCache.has(custom)) {
        try {
            groupImageCache.set(custom, normalizeImageData(await Promise.race([
                urlToBase64(custom),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000)),
            ])));
        } catch (e) {
            console.error('Failed to load character image from URL:', e);
            return custom;
        }
    }
    return groupImageCache.get(custom);
}

/**
 * Shows every character's full-body image side by side (slightly overlapping) in place of
 * the site's single image.
 * @returns {Promise<void>}
 */
async function renderGroupCharacterImages() {
    if (!isGroupChat()) return;
    const area = document.querySelector(character_image_area);
    if (!area) return;
    const members = groupChatCharacters;
    const allSources = await Promise.all(members.map(getGroupCharacterImageSrc));
    if (members !== groupChatCharacters) return; // chat changed while images loaded
    // Many characters only have a background and no full-body image: leave them out
    const characters = members.filter((_, i) => allSources[i]);
    const sources = allSources.filter(Boolean);

    let row = document.getElementById(GROUP_IMAGES_ID);
    if (!characters.length) {
        // Nothing to show: give the area back to the site
        if (row) {
            [...row.parentElement.children].forEach(el => { if (el !== row) el.style.display = ''; });
            resetGroupImageArea(row.parentElement);
            row.remove();
        }
        return;
    }

    if (!row || row.parentElement !== area) {
        row?.remove();
        row = document.createElement('div');
        row.id = GROUP_IMAGES_ID;
        row.style.cssText = 'position:absolute; inset:0; display:flex; align-items:flex-end; justify-content:center;';
        area.appendChild(row);
    }
    hideSiteCharacterImage(area, row);

    row.replaceChildren(...characters.map((character, i) => {
        const img = document.createElement('img');
        img.alt = character.nickname;
        img.dataset.characterId = character.uuid;
        img.draggable = false;
        img.style.cssText = `position:relative; flex:none; max-width:none; ` +
            `height:100%; width:auto; object-fit:contain; object-position:bottom;`;
        img.addEventListener('load', layoutGroupCharacterImages);
        enableGroupImageDrag(img, character.uuid);
        img.src = sources[i];
        return img;
    }));
    applyGroupLayers();
    if (!groupImagesResizeHandlerAdded) {
        groupImagesResizeHandlerAdded = true;
        window.addEventListener('resize', layoutGroupCharacterImages);
    }

    if (!groupImagesObserver) {
        // The site re-renders its image area (and its own image) as the chat changes
        groupImagesObserver = new MutationObserver(() => {
            if (groupImagesQueued) return;
            groupImagesQueued = true;
            requestAnimationFrame(() => {
                groupImagesQueued = false;
                const currentArea = document.querySelector(character_image_area);
                const currentRow = document.getElementById(GROUP_IMAGES_ID);
                if (!currentArea) return;
                if (!currentRow || currentRow.parentElement !== currentArea) renderGroupCharacterImages();
                else hideSiteCharacterImage(currentArea, currentRow);
            });
        });
        groupImagesObserver.observe(document.body, { childList: true, subtree: true });
    }
}

/**
 * Character ids from front to back: the saved order, with characters it doesn't list
 * after it in chat order (so by default the main character is in front).
 * @returns {string[]}
 */
function getGroupLayerOrder() {
    const ids = groupChatCharacters.map(c => c.uuid);
    const order = groupLayerOrder.filter(id => ids.includes(id));
    ids.forEach(id => { if (!order.includes(id)) order.push(id); });
    return order;
}

/**
 * Stacks the character images by the layer order.
 * @returns {void}
 */
function applyGroupLayers() {
    const order = getGroupLayerOrder();
    document.querySelectorAll(`#${GROUP_IMAGES_ID} img`).forEach(img => {
        img.style.zIndex = String(order.length - order.indexOf(img.dataset.characterId));
    });
}

/**
 * Moves a character one layer forward (-1) or backward (+1) and saves the order for this chat.
 * @param {string} characterId
 * @param {-1|1} step
 * @returns {Promise<void>}
 */
async function moveGroupCharacterLayer(characterId, step) {
    const order = getGroupLayerOrder();
    const from = order.indexOf(characterId);
    const to = from + step;
    if (from < 0 || to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    groupLayerOrder = order;
    applyGroupLayers();
    try {
        await saveCharacterFieldsBatch(CHAT_ID, { [GROUP_LAYER_FIELD]: order, record_type: 'chat' });
    } catch (e) {
        console.error('Saving the layer order failed:', e);
    }
}

/** Share of each image's width that its neighbour may cover */
const GROUP_IMAGE_OVERLAP = 0.15;
/** In landscape the site gives the image area the left half of the page column; a group extends it to the
 * window's left edge and may widen it (past that edge) by up to this share of the window */
const GROUP_IMAGE_AREA_MAX_WIDTH = 0.7;
let groupImagesResizeHandlerAdded = false;

/**
 * Sizes the character images to one common height that lets them all fit side by side
 * (at most the full height of the image area), overlapping slightly.
 * In landscape the image area reaches to the window's left edge and is widened past the site's half
 * width when the row needs it.
 * @returns {void}
 */
function layoutGroupCharacterImages() {
    const row = document.getElementById(GROUP_IMAGES_ID);
    if (!row) return;
    const images = [...row.querySelectorAll('img')];
    if (!images.length || !images.every(img => img.complete && img.naturalWidth)) return;
    const aspects = images.map(img => img.naturalWidth / img.naturalHeight);
    // Total width per pixel of height, minus what neighbours cover
    const widthPerHeight = aspects.reduce((sum, aspect, i) =>
        sum + aspect - (i ? GROUP_IMAGE_OVERLAP * Math.min(aspect, aspects[i - 1]) : 0), 0);
    const maxHeight = row.clientHeight || innerHeight;
    const area = row.parentElement;
    resetGroupImageArea(area);
    if (matchMedia('(orientation: landscape)').matches) {
        // The page column is centred, so there is usually free space left of it
        const leftGap = Math.max(0, area.parentElement.getBoundingClientRect().left);
        const wanted = Math.min(widthPerHeight * maxHeight, innerWidth * GROUP_IMAGE_AREA_MAX_WIDTH);
        if (leftGap) area.style.left = `-${Math.floor(leftGap)}px`;
        area.style.width = `${Math.ceil(leftGap + Math.max(area.clientWidth, wanted))}px`;
    }
    const height = Math.min(maxHeight, (row.clientWidth || innerWidth / 2) / widthPerHeight);
    images.forEach((img, i) => {
        img.style.height = `${Math.floor(height)}px`;
        img.style.marginLeft = i ? `-${Math.round(GROUP_IMAGE_OVERLAP * Math.min(aspects[i], aspects[i - 1]) * height)}px` : '';
        applyGroupImagePosition(img);
    });
}

/**
 * Places an image by its character's placement: offset (fractions of the image area, so it scales
 * with the window), size (growing from the feet up), rotation, flips and opacity.
 * @param {HTMLImageElement} img
 * @param {{x: number, y: number}|null} [position] - offset to show instead of the saved one (while dragging)
 * @returns {void}
 */
function applyGroupImagePosition(img, position) {
    const row = img.parentElement;
    if (!row) return;
    const settings = groupCharacterSettings[img.dataset.characterId] || {};
    const adjust = position === undefined ? settings : { ...settings, [GROUP_POSITION_FIELD]: position };
    const opacity = settings.character_opacity ?? 1;
    img.style.transformOrigin = 'bottom center';
    img.style.transform = characterImageTransform(adjust, row.clientWidth, row.clientHeight);
    img.style.opacity = opacity < 1 ? String(opacity) : '';
}

/**
 * Sets a character's image placement and shows it.
 * @param {string} characterId
 * @param {CharacterAdjustments} adjust
 * @returns {void}
 */
function setGroupCharacterAdjustments(characterId, adjust) {
    Object.assign((groupCharacterSettings[characterId] ||= {}), adjust);
    const img = document.querySelector(`#${GROUP_IMAGES_ID} img[data-character-id="${characterId}"]`);
    if (img) applyGroupImagePosition(img);
}

/**
 * Lets the user drag a character's image around; the position is saved when the drag ends.
 * Double-click puts it back in its place in the row.
 * @param {HTMLImageElement} img
 * @param {string} characterId
 * @returns {void}
 */
function enableGroupImageDrag(img, characterId) {
    // The image area ignores the mouse (pointer-events-none), so only the images take it
    Object.assign(img.style, { pointerEvents: 'auto', cursor: 'grab', touchAction: 'none', userSelect: 'none' });
    img.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        event.preventDefault();
        const row = img.parentElement;
        const settings = (groupCharacterSettings[characterId] ||= {});
        const start = { ...(settings[GROUP_POSITION_FIELD] || { x: 0, y: 0 }) };
        let position = start;
        img.setPointerCapture(event.pointerId);
        img.style.cursor = 'grabbing';
        const move = e => {
            position = {
                x: start.x + (e.clientX - event.clientX) / row.clientWidth,
                y: start.y + (e.clientY - event.clientY) / row.clientHeight,
            };
            applyGroupImagePosition(img, position);
        };
        const end = () => {
            img.removeEventListener('pointermove', move);
            img.removeEventListener('pointerup', end);
            img.removeEventListener('pointercancel', end);
            img.style.cursor = 'grab';
            if (position === start) return; // a click, not a drag
            saveGroupCharacterPosition(characterId, position);
        };
        img.addEventListener('pointermove', move);
        img.addEventListener('pointerup', end);
        img.addEventListener('pointercancel', end);
    });
    img.addEventListener('dblclick', () => {
        applyGroupImagePosition(img, null);
        saveGroupCharacterPosition(characterId, { x: 0, y: 0 });
    });
}

/**
 * Remembers where a character's image was dragged to, for this chat.
 * @param {string} characterId
 * @param {{x: number, y: number}} position
 * @returns {Promise<void>}
 */
async function saveGroupCharacterPosition(characterId, position) {
    const rounded = roundCharacterPosition(position);
    (groupCharacterSettings[characterId] ||= {})[GROUP_POSITION_FIELD] = rounded;
    document.dispatchEvent(new CustomEvent('ycc:group-position-changed', { detail: characterId }));
    try {
        await saveCharacterFieldsBatch(CHAT_ID, { [groupFieldKey(GROUP_POSITION_FIELD, characterId)]: rounded, record_type: 'chat' });
    } catch (e) {
        console.error('Saving the character position failed:', e);
    }
}

/**
 * Gives the image area back its site size and place.
 * @param {HTMLElement} area
 * @returns {void}
 */
function resetGroupImageArea(area) {
    area.style.width = '';
    area.style.left = '';
}

/**
 * Hides the site's own image (and the single-character custom image) next to our row.
 * @param {Element} area
 * @param {Element} row
 * @returns {void}
 */
function hideSiteCharacterImage(area, row) {
    [...area.children].forEach(el => {
        if (el !== row && el.style.display !== 'none') el.style.display = 'none';
    });
}

/**
 * Sets one character's image (URL or base64; '' for the site's photo) and shows it.
 * @param {string} characterId
 * @param {string} imageData
 * @returns {Promise<void>}
 */
async function setGroupCharacterImage(characterId, imageData) {
    (groupCharacterSettings[characterId] ||= {}).character_image = imageData || '';
    await renderGroupCharacterImages();
}

/**
 * Used by the right-click "Remove background" script: sets the image of the character whose
 * tab is open in the customizer, or else the main character.
 * @param {string} imageBase64
 * @returns {void}
 */
function setActiveGroupCharacterImage(imageBase64) {
    const characterId = activeGroupCharacterId || groupChatCharacters[0].uuid;
    setGroupCharacterImage(characterId, imageBase64);
    const index = groupChatCharacters.findIndex(c => c.uuid === characterId);
    const urlInput = document.querySelector(`#character-image-url-input-${index}`);
    if (urlInput) urlInput.value = '';
}

// --- CUSTOMIZER WINDOW ---

/**
 * Turns the customizer into the group chat window: a "Common" tab with the shared settings and
 * one tab per character with that character's name, image and chat colours (user colours stay in Common).
 * Must run before the shared event handlers are attached.
 * @param {HTMLElement} form - the customizer's portal root
 * @returns {void}
 */
function setupGroupCustomizerWindow(form) {
    const body = form.querySelector('#chat-customizer-ui-popup > .p-6');
    const title = body?.querySelector('h3');
    const characterSection = form.querySelector('#character-settings-reset-button')?.closest('.mt-8');
    if (!title || !characterSection) {
        console.error('Group customizer: form layout not recognised');
        return;
    }
    title.textContent = 'Group Chat Customization';
    const themeLabel = form.querySelector('#character-theme-checkbox')?.nextElementSibling;
    if (themeLabel) themeLabel.textContent = 'Also Save Characters as Their Theme';

    // The single-character section becomes the template for every character tab
    const divider = characterSection.nextElementSibling;
    characterSection.remove();
    if (divider && divider.tagName === 'HR') divider.remove();

    // Character colour pickers move from Common into each character's tab
    const colorGrid = document.createElement('div');
    colorGrid.className = 'mt-2 grid grid-cols-2 gap-4 pb-3';
    GROUP_CHARACTER_COLORS.forEach(([, inputId]) => {
        if (inputId === 'name-color-input') return; // already in the character section
        const row = form.querySelector(`#${inputId}`)?.closest('.flex.items-center.justify-between');
        if (row) colorGrid.appendChild(row);
    });
    const colorHeading = document.createElement('p');
    colorHeading.className = 'font-bold text-primaryText pt-3';
    colorHeading.textContent = 'Chat Colors';
    characterSection.append(colorHeading, colorGrid);

    const common = document.createElement('div');
    common.dataset.groupTab = 'common';
    common.className = 'mt-6';
    while (title.nextSibling) common.appendChild(title.nextSibling);

    const tabBar = document.createElement('div');
    tabBar.id = 'group-customizer-tabs';
    tabBar.className = 'mt-4 flex gap-2 overflow-x-auto pb-1';
    body.append(tabBar, common);

    const tabs = [{ id: 'common', label: 'Common' }, ...groupChatCharacters.map(c => ({ id: c.uuid, label: c.nickname }))];
    tabs.forEach(tab => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.groupTabButton = tab.id;
        button.textContent = tab.label;
        button.title = tab.label;
        button.className = 'shrink-0 max-w-[12rem] truncate rounded-lg px-3 py-1.5 text-sm font-medium';
        button.addEventListener('click', () => showGroupCustomizerTab(form, tab.id));
        tabBar.appendChild(button);
    });

    // Layer buttons under the Placement controls
    const sizeRow = characterSection.querySelector('#character-adjust-section');
    if (sizeRow) {
        const layerRow = document.createElement('div');
        layerRow.className = 'flex items-center gap-2 pb-3';
        const buttonClass = 'flex-1 rounded py-2 px-3 text-xs font-medium text-white bg-blue-400/40 hover:bg-blue-400/80 disabled:opacity-50';
        layerRow.innerHTML = `<button id="character-forward-button" type="button" class="${buttonClass}">Bring forward</button>` +
            `<button id="character-backward-button" type="button" class="${buttonClass}">Send backward</button>`;
        sizeRow.after(layerRow);
    }

    groupChatCharacters.forEach((character, i) => {
        const panel = characterSection.cloneNode(true);
        panel.dataset.groupTab = character.uuid;
        panel.className = 'mt-6 text-primaryText';
        panel.querySelectorAll('[id]').forEach(el => { el.id = `${el.id}-${i}`; });
        const heading = panel.querySelector('p.font-bold');
        if (heading) heading.textContent = character.nickname;
        const nameInput = panel.querySelector(`#name-input-${i}`);
        if (nameInput) nameInput.placeholder = `New name for ${character.nickname} (blank for default)`;
        body.appendChild(panel);
    });

    showGroupCustomizerTab(form, 'common');
}

/**
 * @param {HTMLElement} form
 * @param {string} tabId - 'common' or a character id
 * @returns {void}
 */
function showGroupCustomizerTab(form, tabId) {
    activeGroupCharacterId = tabId === 'common' ? null : tabId;
    form.querySelectorAll('[data-group-tab]').forEach(panel => {
        panel.style.display = panel.dataset.groupTab === tabId ? '' : 'none';
    });
    form.querySelectorAll('[data-group-tab-button]').forEach(button => {
        const active = button.dataset.groupTabButton === tabId;
        button.classList.toggle('bg-primaryBtn', active);
        button.classList.toggle('text-darkText', active);
        button.classList.toggle('bg-tertiaryBg', !active);
        button.classList.toggle('text-primaryText', !active);
    });
}

/**
 * Fills the character tabs and wires their inputs. Changes show immediately and are kept until Save.
 * @param {HTMLElement} form
 * @returns {void}
 */
function initializeGroupCharacterTabs(form) {
    groupChatCharacters.forEach((character, i) => {
        const settings = (groupCharacterSettings[character.uuid] ||= {});
        const get = id => form.querySelector(`#${id}-${i}`);
        const nameInput = get('name-input');
        const urlInput = get('character-image-url-input');
        const fileInput = get('character-image-file-input');
        const removeBgButton = get('character-remove-bg-button');
        const showAdjustments = bindCharacterAdjustControls(get,
            settings, adjust => setGroupCharacterAdjustments(character.uuid, adjust));
        // A drag on the page (or double-click) moves the image: keep the sliders in step
        document.addEventListener('ycc:group-position-changed', event => {
            if (event.detail === character.uuid && get('character-adjust-section')?.isConnected) showAdjustments(settings);
        });
        const forwardButton = get('character-forward-button');
        const backwardButton = get('character-backward-button');
        const updateLayerButtons = () => {
            const order = getGroupLayerOrder();
            const index = order.indexOf(character.uuid);
            if (forwardButton) forwardButton.disabled = index <= 0;
            if (backwardButton) backwardButton.disabled = index >= order.length - 1;
        };
        // Every tab's buttons depend on the order, so refresh them all after a move
        const moveLayer = async step => {
            await moveGroupCharacterLayer(character.uuid, step);
            form.dispatchEvent(new Event('ycc:group-layers-changed'));
        };
        forwardButton?.addEventListener('click', () => moveLayer(-1));
        backwardButton?.addEventListener('click', () => moveLayer(1));
        form.addEventListener('ycc:group-layers-changed', updateLayerButtons);
        updateLayerButtons();

        if (nameInput) {
            nameInput.value = settings.character_alias || '';
            nameInput.addEventListener('input', () => {
                settings.character_alias = nameInput.value;
                setGroupCharacterAlias(character.uuid, nameInput.value);
            });
        }

        // Each colour starts at the shared one until set for this character
        const sharedColor = (field, defaultKey) => temp_form_data[field] || DEFAULT_COLORS[defaultKey];
        GROUP_CHARACTER_COLORS.forEach(([field, inputId, defaultKey]) => {
            const pickr = createPickrInstance(`${inputId}-${i}`, settings[field] || sharedColor(field, defaultKey), value => {
                settings[field] = value;
                setGroupCharacterColor(character.uuid, field, value);
            });
            if (pickr) pickrInstances[`group_${field}_${i}`] = pickr;
        });

        if (urlInput) {
            urlInput.value = isImageUrl(settings.character_image) ? settings.character_image : '';
            urlInput.addEventListener('input', () => {
                if (isImageUrl(urlInput.value)) setGroupCharacterImage(character.uuid, urlInput.value);
            });
        }

        fileInput?.addEventListener('change', async () => {
            if (!fileInput.files[0]) return;
            await setGroupCharacterImage(character.uuid, await fileToBase64(fileInput.files[0]));
            if (urlInput) urlInput.value = '';
        });

        removeBgButton?.addEventListener('click', async () => {
            const label = removeBgButton.textContent;
            removeBgButton.disabled = true;
            try {
                const src = getCurrentBackgroundSrc();
                if (!src) throw new Error('No background image on this page.');
                removeBgButton.textContent = 'Loading background…';
                const png = await removeImageBackground(await loadImageBlob(src), text => { removeBgButton.textContent = text; });
                await setGroupCharacterImage(character.uuid, await fileToBase64(new File([png], 'character.png', { type: 'image/png' })));
                if (urlInput) urlInput.value = '';
                showInjectionNotification(notification_resource_name, null, `Image set for ${character.nickname}. Press Save to keep it.`);
            } catch (e) {
                console.error('Background removal failed:', e);
                alert('Remove background failed: ' + e.message);
            } finally {
                removeBgButton.textContent = label;
                removeBgButton.disabled = false;
            }
        });

        // Removes the custom image and the cut-out; once saved, no new cut-out is made automatically
        const resetImage = () => {
            if (urlInput) urlInput.value = '';
            if (fileInput) fileInput.value = '';
            settings[GROUP_CUTOUT_FIELD] = '';
            settings[NO_AUTO_CUTOUT_FIELD] = true;
            return setGroupCharacterImage(character.uuid, '');
        };
        get('character-image-reset-button')?.addEventListener('click', () => {
            resetImage();
            showInjectionNotification(notification_resource_name, null, `${character.nickname}'s image reset. Press Save to keep it.`);
        });

        get('character-settings-reset-button')?.addEventListener('click', () => {
            settings.character_alias = '';
            if (nameInput) nameInput.value = '';
            setGroupCharacterAlias(character.uuid, '');
            GROUP_CHARACTER_COLORS.forEach(([field, , defaultKey]) => {
                settings[field] = '';
                setGroupCharacterColor(character.uuid, field, '');
                setPickrColor(`group_${field}_${i}`, sharedColor(field, defaultKey));
            });
            resetImage();
            setGroupCharacterAdjustments(character.uuid, structuredClone(CHARACTER_ADJUST_DEFAULTS));
            showAdjustments(CHARACTER_ADJUST_DEFAULTS);
            saveGroupCharacterPosition(character.uuid, { x: 0, y: 0 });
            showInjectionNotification(notification_resource_name, null, `${character.nickname} reset to default. Press Save to keep it.`);
        });
    });
}

/**
 * Saves each character's settings on the chat record, and with saveAsCharacterTheme also on
 * each character's own record.
 * @param {boolean} saveAsCharacterTheme
 * @returns {Promise<void>}
 */
async function saveGroupCharacterSettings(saveAsCharacterTheme) {
    const chatFields = { record_type: 'chat' };
    const saves = [];
    groupChatCharacters.forEach(character => {
        const fields = {};
        GROUP_CHARACTER_FIELDS.forEach(field => {
            const value = groupCharacterSettings[character.uuid]?.[field];
            if (value !== undefined && value !== null) fields[field] = value;
        });
        Object.entries(fields).forEach(([field, value]) => { chatFields[groupFieldKey(field, character.uuid)] = value; });
        // Placement belongs to this chat's layout, so it isn't saved to the character's theme
        CHARACTER_ADJUST_FIELDS.forEach(field => {
            const value = groupCharacterSettings[character.uuid]?.[field];
            if (value !== undefined && value !== null) chatFields[groupFieldKey(field, character.uuid)] = value;
        });
        // A reset removes the saved cut-out (cut-outs themselves are saved as soon as they are made)
        if (groupCharacterSettings[character.uuid]?.[GROUP_CUTOUT_FIELD] === '') {
            chatFields[groupFieldKey(GROUP_CUTOUT_FIELD, character.uuid)] = '';
        }
        if (saveAsCharacterTheme && Object.keys(fields).length) {
            saves.push(saveCharacterFieldsBatch(character.uuid, { ...fields, record_type: 'character' }));
        }
    });
    saves.push(saveCharacterFieldsBatch(CHAT_ID, chatFields));
    await Promise.all(saves);
}
