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
    let characterContainer = document.querySelector('.pointer-events-none.absolute.inset-0.mt-16.overflow-hidden.landscape\\:inset-y-0.landscape\\:left-0.landscape\\:right-auto.landscape\\:w-1\\/2');
    if (characterContainer) {
        /** @type {HTMLImageElement|null} */
        let existingImage = characterContainer.querySelector('div > div > img');
        let imageHeight = "90vh";

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
 * Writes the current alias (or the original names) into every name element.
 * @returns {void}
 */
function applyCharacterAlias() {
    characterAliasQueued = false;
    getCharacterNameElements().forEach(el => {
        if (currentCharacterAlias) {
            if (el.dataset.yccOriginalName === undefined) el.dataset.yccOriginalName = el.textContent.trim();
            if (el.textContent !== currentCharacterAlias) el.textContent = currentCharacterAlias;
        } else if (el.dataset.yccOriginalName !== undefined) {
            el.textContent = el.dataset.yccOriginalName;
            delete el.dataset.yccOriginalName;
        }
    });
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
    if (!characterAliasObserver) {
        // New and streamed messages, and React re-renders that put the original name back
        characterAliasObserver = new MutationObserver(() => {
            if (!currentCharacterAlias || characterAliasQueued) return;
            characterAliasQueued = true;
            requestAnimationFrame(applyCharacterAlias);
        });
        characterAliasObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
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
