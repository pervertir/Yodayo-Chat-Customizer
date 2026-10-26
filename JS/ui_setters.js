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
 * Measures how far below the top of the window the character image area starts, for the CSS
 * that extends it to the top (the --ycc-image-area-top variable).
 * @returns {void}
 */
function updateCharacterAreaTop() {
    const area = document.querySelector(character_image_area);
    if (!area || !area.parentElement) return;
    const top = Math.max(0, Math.round(area.parentElement.getBoundingClientRect().top));
    document.documentElement.style.setProperty('--ycc-image-area-top', `${top}px`);
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
