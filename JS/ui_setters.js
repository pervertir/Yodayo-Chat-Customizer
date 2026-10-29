// UI setter functions for chat customization

/**
 * Sets the background image for target divs.
 * @param {string} imageData - The image data (base64-encoded string or URL).
 * @returns {Promise<void>}
 */
async function setBackgroundImage(imageData) {
    // Validate input
    if (!imageData || typeof imageData !== 'string') {
        console.error('setBackgroundImage: Invalid imageData provided');
        return;
    }

    /** @type {NodeListOf<HTMLDivElement>} */
    let targetDivs = document.querySelectorAll(bg_img);
    if (!targetDivs.length) {
        console.error('Background divs not found.');
        return;
    }
    /** @type {HTMLDivElement[]} */
    let divElements = Array.from(targetDivs).filter((element) => element.tagName === 'DIV');

    console.log('Setting new background image');
    console.log(targetDivs);

    // Use standardized image data handling (same as image viewer)
    const backgroundImageUrl = `url('${normalizeImageData(imageData)}')`;

    divElements.forEach((targetDiv) => {
        targetDiv.style.backgroundImage = backgroundImageUrl;
        targetDiv.style.backgroundSize = 'cover';
        targetDiv.classList.remove('container');
    });
}

/**
 * Measures how far from the window's top and left edges the character image area's page column
 * starts, for the CSS that extends the area to those edges (--ycc-image-area-top and -left).
 * @returns {void}
 */
function updateCharacterAreaTop() {
    const area = document.querySelector(character_image_area);
    if (!area || !area.parentElement) return;
    const rect = area.parentElement.getBoundingClientRect();
    document.documentElement.style.setProperty('--ycc-image-area-top', `${Math.max(0, Math.round(rect.top))}px`);
    document.documentElement.style.setProperty('--ycc-image-area-left', `${Math.max(0, Math.floor(rect.left))}px`);
}

/**
 * Size the single-character image's offsets refer to: the image's own box, which stays the site's
 * half of the page column when the area is widened to the window's left edge.
 * @param {Element|null} area
 * @returns {{width: number, height: number}}
 */
function characterOffsetSize(area) {
    const box = area?.querySelector(':scope > div:not(#group-character-images)') || area;
    return { width: box?.clientWidth || innerWidth / 2, height: box?.clientHeight || innerHeight };
}

// --- CHARACTER IMAGE PLACEMENT ---
// Size, rotation, flips, opacity and offset of a character image. Single chats keep them as plain
// fields; group chats keep them per character as "<field>@<character id>" on the chat record.

/**
 * @typedef {Object} CharacterAdjustments
 * @property {number} [character_scale] - size multiplier, 1 = default
 * @property {number} [character_rotation] - degrees, clockwise
 * @property {number} [character_opacity] - 0.1 to 1
 * @property {boolean} [character_flip_x]
 * @property {boolean} [character_flip_y]
 * @property {{x: number, y: number}} [character_position] - offset as fractions of the image area
 */

/** @type {Required<CharacterAdjustments>} */
const CHARACTER_ADJUST_DEFAULTS = {
    character_scale: 1,
    character_rotation: 0,
    character_opacity: 1,
    character_flip_x: false,
    character_flip_y: false,
    character_position: { x: 0, y: 0 },
};
const CHARACTER_ADJUST_FIELDS = Object.keys(CHARACTER_ADJUST_DEFAULTS);
/** Single-character chat image: the site's own and a custom one alike (group chats have their own row) */
const SINGLE_CHARACTER_IMAGE = `${character_image_area} > div:not(#group-character-images) img`;

/** @type {CharacterAdjustments} what the single-character image currently shows */
let currentCharacterAdjustments = {};
let characterDragListenersAdded = false;

/**
 * CSS transform for a character image. Size grows from the feet up (transform-origin bottom center),
 * while rotation and flips turn the image around its middle.
 * @param {CharacterAdjustments} adjust
 * @param {number} areaWidth - px the offset fractions refer to
 * @param {number} areaHeight
 * @returns {string} '' when nothing is changed
 */
function characterImageTransform(adjust, areaWidth, areaHeight) {
    const { x = 0, y = 0 } = adjust.character_position || {};
    const scale = adjust.character_scale || 1;
    const rotation = adjust.character_rotation || 0;
    const flipX = adjust.character_flip_x ? -1 : 1;
    const flipY = adjust.character_flip_y ? -1 : 1;
    const transforms = [];
    if (x || y) transforms.push(`translate(${Math.round(x * areaWidth)}px, ${Math.round(y * areaHeight)}px)`);
    if (scale !== 1) transforms.push(`scale(${scale})`);
    if (rotation || flipX < 0 || flipY < 0) {
        // Percent translates refer to the image's own height: move the origin to its middle and back
        transforms.push('translateY(-50%)');
        if (rotation) transforms.push(`rotate(${rotation}deg)`);
        if (flipX < 0 || flipY < 0) transforms.push(`scale(${flipX}, ${flipY})`);
        transforms.push('translateY(50%)');
    }
    return transforms.join(' ');
}

/**
 * Applies a character image's placement to the single-character chat image.
 * @param {CharacterAdjustments} adjust
 * @returns {void}
 */
function setCharacterAdjustments(adjust) {
    currentCharacterAdjustments = { ...adjust };
    const { width, height } = characterOffsetSize(document.querySelector(character_image_area));
    const transform = characterImageTransform(adjust, width, height);
    const opacity = adjust.character_opacity ?? 1;
    applyDynamicStyle(SINGLE_CHARACTER_IMAGE, {
        transform,
        'transform-origin': transform ? 'bottom center' : '',
        opacity: opacity < 1 ? String(opacity) : '',
        // The image area ignores the mouse (pointer-events-none), so the image takes it to be dragged
        'pointer-events': 'auto',
        cursor: 'grab',
        'touch-action': 'none',
        'user-select': 'none',
    });
    enableCharacterImageDrag();
}

/**
 * Sizes the character image (single-character chats; 1 = default), growing from the feet up.
 * @param {number} scale
 * @returns {void}
 */
function setCharacterScale(scale) {
    setCharacterAdjustments({ ...currentCharacterAdjustments, character_scale: scale || 1 });
}

/**
 * Lets the user drag the single-character image around; the offset is saved for this chat when
 * the drag ends. Double-click puts it back. Listens on the document, as the site replaces its image.
 * @returns {void}
 */
function enableCharacterImageDrag() {
    if (characterDragListenersAdded) return;
    characterDragListenersAdded = true;
    window.addEventListener('resize', () => setCharacterAdjustments(currentCharacterAdjustments));
    document.addEventListener('pointerdown', event => {
        const img = event.target;
        if (event.button !== 0 || !(img instanceof HTMLImageElement) || !img.matches(SINGLE_CHARACTER_IMAGE)) return;
        if (typeof isGroupChat === 'function' && isGroupChat()) return;
        event.preventDefault();
        const area = characterOffsetSize(document.querySelector(character_image_area));
        const start = { ...(currentCharacterAdjustments.character_position || { x: 0, y: 0 }) };
        let position = start;
        img.setPointerCapture(event.pointerId);
        img.style.cursor = 'grabbing';
        const move = e => {
            position = {
                x: start.x + (e.clientX - event.clientX) / area.width,
                y: start.y + (e.clientY - event.clientY) / area.height,
            };
            setCharacterAdjustments({ ...currentCharacterAdjustments, character_position: position });
        };
        const end = () => {
            img.removeEventListener('pointermove', move);
            img.removeEventListener('pointerup', end);
            img.removeEventListener('pointercancel', end);
            img.style.cursor = '';
            if (position === start) return; // a click, not a drag
            saveCharacterPosition(position);
        };
        img.addEventListener('pointermove', move);
        img.addEventListener('pointerup', end);
        img.addEventListener('pointercancel', end);
    });
    document.addEventListener('dblclick', event => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement) || !img.matches(SINGLE_CHARACTER_IMAGE)) return;
        if (typeof isGroupChat === 'function' && isGroupChat()) return;
        const position = { x: 0, y: 0 };
        setCharacterAdjustments({ ...currentCharacterAdjustments, character_position: position });
        saveCharacterPosition(position);
    });
}

/**
 * Rounds an offset for storage.
 * @param {{x: number, y: number}} position
 * @returns {{x: number, y: number}}
 */
function roundCharacterPosition(position) {
    return { x: Math.round(position.x * 10000) / 10000, y: Math.round(position.y * 10000) / 10000 };
}

/**
 * Remembers where the single-character image was dragged to, for this chat, and keeps it in the
 * customizer's unsaved changes so the sliders and a later Save match it.
 * @param {{x: number, y: number}} position
 * @returns {Promise<void>}
 */
async function saveCharacterPosition(position) {
    const rounded = roundCharacterPosition(position);
    currentCharacterAdjustments.character_position = rounded;
    if (typeof temp_form_data === 'object' && temp_form_data) temp_form_data.character_position = rounded;
    document.dispatchEvent(new CustomEvent('ycc:character-position-changed', { detail: rounded }));
    try {
        await saveCharacterFieldsBatch(CHAT_ID, { character_position: rounded, record_type: 'chat' });
    } catch (e) {
        console.error('Saving the character position failed:', e);
    }
}

/**
 * Wires the customizer's Placement controls (size, rotation, opacity, offsets, flips, Reset placement).
 * @param {(id: string) => HTMLElement|null} get - finds a control by its id in the template
 * @param {CharacterAdjustments} initial
 * @param {(adjust: CharacterAdjustments) => void} onChange - called with the whole placement on every change
 * @returns {(adjust: CharacterAdjustments) => void} shows a placement in the controls without calling onChange
 */
function bindCharacterAdjustControls(get, initial, onChange) {
    let adjust = { ...CHARACTER_ADJUST_DEFAULTS, ...initial };
    const sliders = [
        // [control id, read from placement, write to placement, label]
        ['character-scale', a => Math.round((a.character_scale || 1) * 100), (a, v) => { a.character_scale = v / 100; }, v => `${v}%`],
        ['character-rotation', a => Math.round(a.character_rotation || 0), (a, v) => { a.character_rotation = v; }, v => `${v}°`],
        ['character-opacity', a => Math.round((a.character_opacity ?? 1) * 100), (a, v) => { a.character_opacity = v / 100; }, v => `${v}%`],
        ['character-offset-x', a => Math.round((a.character_position?.x || 0) * 100),
            (a, v) => { a.character_position = { ...a.character_position, x: v / 100 }; }, v => `${v}%`],
        ['character-offset-y', a => Math.round((a.character_position?.y || 0) * 100),
            (a, v) => { a.character_position = { ...a.character_position, y: v / 100 }; }, v => `${v}%`],
    ];
    const flips = [['character-flip-x-button', 'character_flip_x'], ['character-flip-y-button', 'character_flip_y']];

    const show = next => {
        adjust = { ...CHARACTER_ADJUST_DEFAULTS, ...next };
        sliders.forEach(([id, read, , label]) => {
            const input = get(`${id}-input`);
            const value = get(`${id}-value`);
            if (input) input.value = read(adjust);
            if (value) value.textContent = label(read(adjust));
        });
        flips.forEach(([id, field]) => {
            const button = get(id);
            if (!button) return;
            button.setAttribute('aria-pressed', String(!!adjust[field]));
            button.classList.toggle('bg-primaryBtn', !!adjust[field]);
            button.classList.toggle('text-darkText', !!adjust[field]);
            button.classList.toggle('bg-blue-400/40', !adjust[field]);
            button.classList.toggle('text-white', !adjust[field]);
        });
    };
    const change = () => {
        show(adjust);
        onChange({ ...adjust });
    };

    sliders.forEach(([id, , write]) => {
        get(`${id}-input`)?.addEventListener('input', event => {
            write(adjust, Number(event.target.value));
            change();
        });
    });
    flips.forEach(([id, field]) => {
        get(id)?.addEventListener('click', () => {
            adjust[field] = !adjust[field];
            change();
        });
    });
    get('character-adjust-reset-button')?.addEventListener('click', () => {
        adjust = { ...CHARACTER_ADJUST_DEFAULTS };
        change();
    });
    show(adjust);
    return show;
}

/**
 * Sets the character image in the character container.
 * @param {string} imageData - The image data (base64-encoded string or URL).
 * @returns {Promise<void>}
 */
async function setCharacterImage(imageData) {
    // Validate input
    if (!imageData || typeof imageData !== 'string') {
        console.error('setCharacterImage: Invalid imageData provided');
        return;
    }

    /** @type {HTMLElement|null} */
    let characterContainer = document.querySelector(character_image_area);
    if (characterContainer) {
        /** @type {HTMLImageElement|null} */
        let existingImage = characterContainer.querySelector('div > div > img');
        let imageHeight = "100%"; // the image area spans the full window height

        // Use standardized image data handling (same as image viewer)
        const imageSrc = normalizeImageData(imageData);

        if (existingImage) {
            // Remember the site's own image so a reset can bring it back
            if (!existingImage.closest('#character-image-container') && !existingImage.dataset.yccOriginalSrc) {
                existingImage.dataset.yccOriginalSrc = existingImage.src;
            }
            existingImage.src = imageSrc;
            existingImage.style.height = imageHeight;
            console.log('Changed Character Image.');
        } else {
            let innerDiv = characterContainer.querySelector('div > div');
            if (!innerDiv) {
                renderHTMLFromFile(character_image_container_resource_name).then(character_image_container => {
                    /** @type {HTMLImageElement} */
                    let image = character_image_container.querySelector('img');
                    image.src = imageSrc;
                    image.style.height = imageHeight;
                    characterContainer.appendChild(character_image_container);
                });
            }
        }
    } else {
        console.error('Character container not found');
    }
}

/**
 * Takes the custom character image away: the site's own image comes back, or none is shown.
 * @returns {void}
 */
function clearCharacterImage() {
    document.querySelector('#character-image-container')?.remove();
    const siteImage = document.querySelector(`${character_image_area} img[data-ycc-original-src]`);
    if (siteImage) {
        siteImage.src = siteImage.dataset.yccOriginalSrc;
        delete siteImage.dataset.yccOriginalSrc;
    }
}

/** @type {string} alias currently shown; '' means the site's own names */
let currentCharacterAlias = '';
/** @type {string} chat name shown in the header instead of the site's title; '' means none */
let currentChatName = '';
/** @type {Object<string, string>} group chats: alias per character id ('' or missing = site name) */
let groupCharacterAliases = {};
/** @type {MutationObserver|null} */
let characterAliasObserver = null;
let characterAliasQueued = false;

/**
 * Elements showing the character's name: the chat header title and the name above each message.
 * @returns {HTMLElement[]}
 */
function getCharacterNameElements() {
    const title = document.querySelector(character_name_title);
    return [...document.querySelectorAll(character_name_selector), ...(title ? [title] : [])];
}

/**
 * Original (site) character name, even while an alias is shown.
 * @returns {string}
 */
function getOriginalCharacterName() {
    const el = getCharacterNameElements()[0];
    if (!el) return '';
    return el.dataset.yccOriginalName ?? el.textContent.trim();
}

/**
 * @returns {boolean} true while any alias is set
 */
function hasCharacterAlias() {
    return !!currentCharacterAlias || !!currentChatName || Object.values(groupCharacterAliases).some(Boolean);
}

/**
 * Alias to show in a name element. In group chats each character has its own: message names
 * are matched by their character link, the header title by the character's site name.
 * @param {HTMLElement} el
 * @param {string} originalName
 * @returns {string} '' for the site's own name
 */
function getAliasForNameElement(el, originalName) {
    // The header title shows the chat name when there is one
    if (currentChatName && el.matches(character_name_title)) return currentChatName;
    if (!groupChatCharacters.length) return currentCharacterAlias;
    const href = el.getAttribute('href');
    const member = href
        ? groupChatCharacters.find(c => href.split('?')[0].endsWith('/' + c.uuid))
        : groupChatCharacters.find(c => c.name === originalName || c.nickname === originalName);
    return member ? (groupCharacterAliases[member.uuid] || '') : '';
}

/**
 * Writes the current aliases (or the original names) into every name element.
 * @returns {void}
 */
function applyCharacterAlias() {
    characterAliasQueued = false;
    getCharacterNameElements().forEach(el => {
        const alias = getAliasForNameElement(el, el.dataset.yccOriginalName ?? el.textContent.trim());
        if (alias) {
            if (el.dataset.yccOriginalName === undefined) el.dataset.yccOriginalName = el.textContent.trim();
            if (el.textContent !== alias) el.textContent = alias;
        } else if (el.dataset.yccOriginalName !== undefined) {
            el.textContent = el.dataset.yccOriginalName;
            delete el.dataset.yccOriginalName;
        }
    });
}

/**
 * Keeps aliases on messages added or re-rendered later.
 * @returns {void}
 */
function observeCharacterAliases() {
    if (characterAliasObserver) return;
    // New and streamed messages, and React re-renders that put the original name back
    characterAliasObserver = new MutationObserver(() => {
        if (!hasCharacterAlias() || characterAliasQueued) return;
        characterAliasQueued = true;
        requestAnimationFrame(applyCharacterAlias);
    });
    characterAliasObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

/**
 * Sets the alias (character name) in the UI, including messages added or re-rendered later.
 * An empty alias restores the site's own names.
 * @param {string} alias
 * @returns {void}
 */
function setCharacterAlias(alias) {
    currentCharacterAlias = (alias || '').trim();
    applyCharacterAlias();
    observeCharacterAliases();
}

/**
 * Sets the chat name shown at the top of the chat (separate from the character's name).
 * An empty name restores the default title.
 * @param {string} name
 * @returns {void}
 */
function setChatName(name) {
    currentChatName = (name || '').trim();
    applyCharacterAlias();
    observeCharacterAliases();
}

/**
 * Sets the alias of one character in a group chat. An empty alias restores its site name.
 * @param {string} characterId
 * @param {string} alias
 * @returns {void}
 */
function setGroupCharacterAlias(characterId, alias) {
    groupCharacterAliases[characterId] = (alias || '').trim();
    applyCharacterAlias();
    observeCharacterAliases();
}

/**
 * Sets one of a group chat character's colours, only on that character's name and messages
 * ('' restores the shared colour).
 * @param {string} characterId
 * @param {'character_name_color'|'character_narration_color'|'character_message_color'|'character_message_box_color'} field
 * @param {string} color
 * @returns {void}
 */
function setGroupCharacterColor(characterId, field, color) {
    const link = `a[href^="/tavern/characters/${characterId}"]`;
    // The message row starts with the character's avatar link
    const message = `${character_message_row}:has(> ${link})`;
    const rules = {
        character_name_color: [link, 'color'],
        character_narration_color: [`${message} ${character_narration}`, 'color'],
        character_message_color: [`${message} [class*="text-primaryText/90"]`, 'color'],
        character_message_box_color: [`${message} [class*="bg-black/[85%]"], ${message} [class*="bg-black/[.85]"]`, 'background-color'],
    };
    const [selector, property] = rules[field];
    applyDynamicStyle(selector, { [property]: color || '' });
}

/**
 * Sets the alias color in the UI.
 * @param {string} color
 * @returns {void}
 */
function setCharacterAliasColor(color) {
    for (let i = 0; i < document.styleSheets.length; i++) {
        const styleSheet = document.styleSheets[i];
        if (styleSheet.href && styleSheet.href.includes('fonts.googleapis.com')) {
            continue;
        }
        try {
            for (let j = 0; j < styleSheet.cssRules.length; j++) {
                const rule = styleSheet.cssRules[j];
                if (rule.selectorText === 'a') {
                    rule.style.color = color;
                }
            }
        } catch (e) {
            console.warn('Cannot access stylesheet: ', styleSheet.href);
            continue;
        }
    }
}

/**
 * Sets the character narration color in the UI.
 * @param {string} color
 * @returns {void}
 */
function setCharacterNarrationColor(color) {
    for (let i = 0; i < document.styleSheets.length; i++) {
        const styleSheet = document.styleSheets[i];
        if (styleSheet.href && styleSheet.href.includes('fonts.googleapis.com')) {
            continue;
        }
        try {
            for (let j = 0; j < styleSheet.cssRules.length; j++) {
                const rule = styleSheet.cssRules[j];
                if (rule.selectorText === '.text-chipText') {
                    rule.style.color = color;
                }
            }
        } catch (e) {
            console.warn('Cannot access stylesheet: ', styleSheet.href);
            continue;
        }
    }
}

/**
 * Sets the character chat color in the UI using optimized CSS injection.
 * @param {string} color
 * @param {RegExp} regex
 * @returns {void}
 */
function setCharacterDialogueColor(color, regex) {
    // Use dynamic stylesheet for better performance
    // Only the dialogue text (text-primaryText/90), not every primary-coloured element on the site
    applyDynamicStyle('[class*="text-primaryText/90"]', { color });

    // Fallback: iterate through cached stylesheets only if needed
    const styleSheets = getCachedStyleSheets();
    styleSheets.forEach((styleSheet) => {
        if (!styleSheet.href) return;
        try {
            Array.from(styleSheet.cssRules).forEach((rule) => {
                if (rule.selectorText && regex.test(rule.selectorText)) {
                    rule.style.color = color;
                }
            });
        } catch (e) {
            console.warn('Cannot access stylesheet:', styleSheet.href);
        }
    });
}

/**
 * Sets the user chat color in the UI using optimized CSS injection.
 * @param {string} color
 * @param {RegExp} regex
 * @returns {void}
 */
function setUserChatColor(color, regex) {
    // Use dynamic stylesheet for better performance
    applyDynamicStyle('*[class*="text-black"]', { color });

    // Fallback: iterate through cached stylesheets only if needed
    const styleSheets = getCachedStyleSheets();
    styleSheets.forEach((styleSheet) => {
        if (!styleSheet.href) return;
        try {
            Array.from(styleSheet.cssRules).forEach((rule) => {
                if (rule.selectorText && regex.test(rule.selectorText)) {
                    rule.style.color = color;
                }
            });
        } catch (e) {
            console.warn('Cannot access stylesheet:', styleSheet.href);
        }
    });
}

/**
 * Sets the character chat background color in the UI.
 * @param {string} color
 * @param {RegExp} regex
 * @returns {void}
 */
function setCharacterChatBgColor(color, regex) {
    Array.from(document.styleSheets).forEach((styleSheet) => {
        if (styleSheet.href && styleSheet.href.includes('fonts.googleapis.com')) {
            return;
        }
        if (!styleSheet.href) {
            return;
        }
        try {
            Array.from(styleSheet.cssRules).forEach((rule) => {
                if (rule.selectorText && regex.test(rule.selectorText)) {
                    rule.style.backgroundColor = color;
                    rule.style.opacity = '85%';
                }
            });
        } catch (e) {
            console.warn('Cannot access stylesheet:', styleSheet.href);
            console.warn(e);
        }
    });
}

/**
 * Sets the user chat background color in the UI.
 * @param {string} color
 * @param {RegExp} regex
 * @returns {void}
 */
function setUserChatBgColor(color, regex) {
    setCharacterChatBgColor(color, regex);
}

/**
 * Sets the user name color in the UI.
 * @param {string} color
 * @returns {void}
 */
function setUserNameColor(color) {
    let styleSheet = document.getElementById('dynamic-styles');
    if (!styleSheet) {
        styleSheet = document.createElement('style');
        styleSheet.id = 'dynamic-styles';
        document.head.appendChild(styleSheet);
    }
    styleSheet.innerHTML = `.username { color: ${color} !important; }`;
}
