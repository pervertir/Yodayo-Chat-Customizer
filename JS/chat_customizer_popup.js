// chat customizer popup
let default_background_image = null;
let temp_form_data = {};
/**
 * Captures the original background image from the page before any modifications.
 * Should be called when the customizer is first initialized.
 * @returns {void}
 */
function captureOriginalBackgroundImage() {
    if (default_background_image !== null) return; // Already captured

    /** @type {NodeListOf<HTMLDivElement>} */
    let targetDivs = document.querySelectorAll(bg_img);
    if (targetDivs.length > 0) {
        /** @type {HTMLDivElement[]} */
        let divElements = Array.from(targetDivs).filter((element) => element.tagName === 'DIV');
        if (divElements.length > 0) {
            default_background_image = divElements[0].style.backgroundImage || '';
            console.log('Captured original background image:', default_background_image);
            const urlMatch = default_background_image.match(/url\(['"]?([^'"]+)['"]?\)/);
            temp_form_data.default_background_image = urlMatch[1]; // Store in temp_form_data
        }
    }
}

// --- UI SETTERS ---
/**
 * Sets the background image for target divs.
 * @param {string} imageData - The image data (base64-encoded string or URL).
 * @returns {Promise<void>}
 */
async function setBackgroundImage(imageData) {
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

    // Check if the data is a URL or base64
    const isUrl = imageData.startsWith('http://') || imageData.startsWith('https://') || imageData.startsWith('data:image');
    const backgroundImageUrl = isUrl ? `url('${imageData}')` : `url('data:image;base64,${imageData}')`;

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
    /** @type {HTMLElement|null} */
    let characterContainer = document.querySelector('.pointer-events-none.absolute.inset-0.mt-16.overflow-hidden.landscape\\:inset-y-0.landscape\\:left-0.landscape\\:right-auto.landscape\\:w-1\\/2');
    if (characterContainer) {
        /** @type {HTMLImageElement|null} */
        let existingImage = characterContainer.querySelector('div > div > img');
        let imageHeight = "90vh";
        
        // Check if the data is a URL or base64
        const isUrl = imageData.startsWith('http://') || imageData.startsWith('https://') || imageData.startsWith('data:image');
        const imageSrc = isUrl ? imageData : `data:image;base64,${imageData}`;
        
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

/**
 * Sets the alias (character name) in the UI.
 * @param {string} alias
 * @returns {void}
 */
function setCharacterAlias(alias) {
    const character_names = document.querySelectorAll(character_name_selector);
    character_names.forEach((name) => {
        name.textContent = alias;
    });
    const name_title = document.querySelector(character_name_title);
    if (name_title) name_title.textContent = alias;
}

/**
 * Sets the alias color in the UI.
 * @param {string} color
 * @returns {void}
 */
function setCharacterAliasColor(color) {
    for (let i = 0; i < document.styleSheets.length; i++) {
        const styleSheet = document.styleSheets[i];
        if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
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
        if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
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
    applyDynamicStyle('*[class*="text-primaryText"]', { color });

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
        if (styleSheet.href && styleSheet.href.includes('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')) {
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

// --- DOM HELPERS ---
/**
 * Adds the 'username' class to all username elements.
 * @returns {void}
 */
function addUserNameClass() {
    /** @type {NodeListOf<HTMLElement>} */
    let usernameElements = document.querySelectorAll(user_name);
    usernameElements.forEach((element) => {
        element.classList.add('username');
    });
}

/**
 * Handles DOM mutations to add the 'username' class to new username elements.
 * @param {MutationRecord[]} mutationsList
 * @returns {void}
 */
function handleMutations(mutationsList) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches('p.text-xs.font-medium.opacity-50')) {
                        console.log(node);
                        node.classList.add('username');
                    }
                }
                node.querySelectorAll && node.querySelectorAll('p.text-xs.font-medium.opacity-50, p.space-x-1 > span').forEach((child) => {
                    if (child.matches('p.text-xs.font-medium.opacity-50')) {
                        console.log(node);
                        child.classList.add('username');
                    }
                });
            });
        }
    }
}

// --- EVENT HANDLERS ---
/**
 * Initializes the close button event handler for the popup form.
 * @param {HTMLElement} form
 * @param {HTMLElement} formBody
 * @returns {void}
 */
function initializeCloseButtonEventHandler(form, formBody) {
    console.log(formBody);
    const closeModal = () => {
        // Reset document styles
        document.documentElement.style.overflow = '';
        document.documentElement.style.paddingRight = '';

        let main = document.querySelector('body > main');
        if (main) {
            main.setAttribute('aria-hidden', 'false');
            main.removeAttribute('inert');
        }

        // Remove the modal by removing the portal root element
        /** @type {HTMLElement|null} */
        const portalRoot = document.getElementById('headlessui-portal-root');
        if (portalRoot) {
            portalRoot.remove();
        }
        
        document.removeEventListener('click', handleClickOutside);

    };

    const handleClickOutside = (event) => {
        if (!formBody.contains(event.target)) {
            closeModal();
        }
    };

    let closeButton = form.querySelector('#close-button');
    closeButton.addEventListener('click', closeModal);

    // Add event listener to close modal on click outside
    document.addEventListener('click', handleClickOutside);
}

/**
 * Initializes event handlers for character settings form using optimized approach.
 * @param {HTMLElement} form
 * @returns {void}
 */
function initializeCharacterSettingsEventHandlers(form) {
    // Helper to update temp_form_data
    function updateTemp(key, value) {
        temp_form_data[key] = value;
    }
    function resetTempFormData() {
        temp_form_data = {};
    }

    // Cache all form elements at once
    const formElements = {
        char_name_input: form.querySelector('#name-input'),
        char_name_color_input: form.querySelector('#name-color-input'),
        char_image_url_input: form.querySelector('#character-image-url-input'),
        char_image_file_input: form.querySelector('#character-image-file-input'),
        bg_url_input: form.querySelector('#bg-url-input'),
        bg_file_input: form.querySelector('#bg-file-input'),
        char_narr_input: form.querySelector('#character-narration-color-input'),
        char_chat_input: form.querySelector('#character-chat-color-input'),
        user_chat_input: form.querySelector('#user-chat-color-input'),
        char_chat_bg_input: form.querySelector('#character-chat-bg-color-input'),
        user_chat_bg_input: form.querySelector('#user-chat-bg-color-input'),
        user_name_color_input: form.querySelector('#user-name-color-input'),
        saveButton: form.querySelector('#save-button'),
        applyToAllCheckbox: form.querySelector('#apply-to-all-checkbox'),
        charThemeCheckbox: form.querySelector('#character-theme-checkbox'),
        deleteCurrentPageStyleButton: form.querySelector('#delete-current-page-style-button'),
        deleteAllCharacterStylesButton: form.querySelector('#delete-all-character-styles-button')
    };

    // Use event delegation for better performance
    form.addEventListener('input', async function (e) {
        const target = e.target;
        const id = target.id;

        switch (id) {
            case 'name-input':
                setCharacterAlias(target.value);
                updateTemp('character_alias', target.value);
                break;
            case 'character-image-url-input':
                if (target.value) {
                    const imageBase64 = await urlToBase64(target.value);
                    setCharacterImage(imageBase64);
                    updateTemp('character_image', target.value);
                }
                break;
            case 'bg-url-input':
                if (target.value) {
                    const bgBase64 = await urlToBase64(target.value);
                    setBackgroundImage(bgBase64);
                    updateTemp('background_image', target.value);
                }
                break;
        }
    });

    form.addEventListener('change', async function (e) {
        const target = e.target;
        const id = target.id;

        switch (id) {
            case 'name-color-input':
                setCharacterAliasColor(target.value);
                updateTemp('character_name_color', target.value);
                break;
            case 'character-image-file-input':
                if (target.files[0]) {
                    const imageBase64 = await fileToBase64(target.files[0]);
                    setCharacterImage(imageBase64);
                    updateTemp('character_image', imageBase64);
                }
                break;
            case 'bg-file-input':
                if (target.files[0]) {
                    const bgBase64 = await fileToBase64(target.files[0]);
                    setBackgroundImage(bgBase64);
                    updateTemp('background_image', bgBase64);
                }
                break;
            case 'character-narration-color-input':
                setCharacterNarrationColor(target.value);
                updateTemp('character_narration_color', target.value);
                break;
            case 'character-chat-color-input':
                setCharacterDialogueColor(target.value, character_dialogue);
                updateTemp('character_message_color', target.value);
                break;
            case 'user-chat-color-input':
                setUserChatColor(target.value, user_message);
                updateTemp('user_message_color', target.value);
                break;
            case 'character-chat-bg-color-input':
                setCharacterChatBgColor(target.value, character_chat_bubble_background);
                updateTemp('character_message_box_color', target.value);
                break;
            case 'user-chat-bg-color-input':
                setUserChatBgColor(target.value, user_chat_bubble_background);
                updateTemp('user_message_box_color', target.value);
                break;
            case 'user-name-color-input':
                setUserNameColor(target.value);
                updateTemp('username_color', target.value);
                break;
            case 'character-theme-checkbox':
                // Handle character theme checkbox toggle
                let anchor = document.querySelector(char_id_selector);
                let CHAR_ID = findCharacterID(anchor);
                if (!target.checked) {
                    CHAR_ID = CHAT_ID;
                }
                // Could repopulate form here if needed
                // populateCustomizerPopup(form, CHAR_ID);
                break;
        }
    });

    // Button event handlers
    if (formElements.saveButton) {
        formElements.saveButton.addEventListener('click', async function () {
            // Ensure we have the default background captured before saving

            let anchor = document.querySelector(char_id_selector);
            let CHAR_ID = findCharacterID(anchor) || CHAT_ID;
            if (formElements.charThemeCheckbox && !formElements.charThemeCheckbox.checked) {
                CHAR_ID = CHAT_ID;
            }
            // Use optimized batch save
            await saveCharacterDetailsToDBFromTemp(CHAR_ID);

            if (formElements.applyToAllCheckbox && formElements.applyToAllCheckbox.checked) {
                await saveCharacterDetailsToDBFromTemp('Universal');
            }
            showInjectionNotification(notification_resource_name, null, 'Settings saved successfully!');
            resetTempFormData();
        });
    }

    if (formElements.deleteCurrentPageStyleButton) {
        formElements.deleteCurrentPageStyleButton.addEventListener('click', async function () {
            let anchor = document.querySelector(char_id_selector);
            let CHAR_ID = findCharacterID(anchor) || CHAT_ID;
            await excludeChatIdForCharacter(CHAR_ID, CHAT_ID);
            location.reload();
            alert('Current chat style excluded for this character.');
        });
    }

    if (formElements.deleteAllCharacterStylesButton) {
        formElements.deleteAllCharacterStylesButton.addEventListener('click', async function () {
            let anchor = document.querySelector(char_id_selector);
            let CHAR_ID = findCharacterID(anchor) || CHAT_ID;
            await deleteCharacterRecord(CHAR_ID);
            location.reload();
            alert('All styles for this character have been deleted.');
        });
    }
}

// --- DATABASE INTEGRATION ---
// Assumes database_handler.js is loaded and provides saveCharacterImage, saveBackgroundImage, getCharacterImage, getBackgroundImage, CHAT_ID, findCharacterID

/**
 * Loads all customizer settings and applies them to the actual UI (not the popup form).
 * If CHAR_ID is not found, but Universal is, loads universal colors only.
 * If CHAR_ID is found, loads all fields from CHAR_ID, but falls back to Universal for missing color fields.
 * @param {string} CHAR_ID
 * @returns {Promise<void>}
 */
async function loadCustomizedUI(CHAR_ID) {
    // Try to load the character record
    const charRecord = await getCharacterRecord(CHAR_ID);
    let colorSource = null;
    let imageSource = null;
    let bgSource = null;
    let aliasSource = null;
    if (charRecord) {
        // If char record exists, use its images/bg/alias, and prefer its colors, but fallback to universal for missing colors
        imageSource = charRecord.character_image || null;
        bgSource = charRecord.background_image || null;
        aliasSource = charRecord.character_alias || null;
        // Get universal colors for fallback
        const universalColors = await getUniversalColorSettings();
        colorSource = {
            character_name_color: charRecord.character_name_color ?? (universalColors && universalColors.character_name_color),
            character_narration_color: charRecord.character_narration_color ?? (universalColors && universalColors.character_narration_color),
            character_message_color: charRecord.character_message_color ?? (universalColors && universalColors.character_message_color),
            character_message_box_color: charRecord.character_message_box_color ?? (universalColors && universalColors.character_message_box_color),
            username_color: charRecord.username_color ?? (universalColors && universalColors.username_color),
            user_message_color: charRecord.user_message_color ?? (universalColors && universalColors.user_message_color),
            user_message_box_color: charRecord.user_message_box_color ?? (universalColors && universalColors.user_message_box_color)
        };
    } else {
        // If no char record, try universal
        const universalColors = await getUniversalColorSettings();
        colorSource = universalColors || {};
    }
    // Set images/bg/alias if present
    if (imageSource) {
        // Check if it's a URL or base64 data
        const isImageUrl = imageSource.startsWith('http://') || imageSource.startsWith('https://');
        if (isImageUrl) {
            // Convert URL to base64 first
            try {
                const imageBase64 = await urlToBase64(imageSource);
                setCharacterImage(imageBase64);
            } catch (error) {
                console.error('Failed to load character image from URL:', error);
                // Fallback: set the URL directly
                setCharacterImage(imageSource);
            }
        } else {
            setCharacterImage(imageSource);
        }
    }
    
    if (bgSource) {
        // Check if it's a URL or base64 data
        const isBgUrl = bgSource.startsWith('http://') || bgSource.startsWith('https://');
        if (isBgUrl) {
            // Convert URL to base64 first
            try {
                const bgBase64 = await urlToBase64(bgSource);
                setBackgroundImage(bgBase64);
            } catch (error) {
                console.error('Failed to load background image from URL:', error);
                // Fallback: set the URL directly
                setBackgroundImage(bgSource);
            }
        } else {
            setBackgroundImage(bgSource);
        }
    }
    if (aliasSource !== null) setCharacterAlias(aliasSource);
    // Set colors if present
    if (colorSource.character_name_color) setCharacterAliasColor(colorSource.character_name_color);
    if (colorSource.character_narration_color) setCharacterNarrationColor(colorSource.character_narration_color);
    if (colorSource.character_message_color) setCharacterDialogueColor(colorSource.character_message_color);
    if (colorSource.username_color) setUserNameColor(colorSource.username_color);
    if (colorSource.user_message_color) setUserChatColor(colorSource.user_message_color, user_message);
    if (colorSource.character_message_box_color) setCharacterChatBgColor(colorSource.character_message_box_color, character_chat_bubble_background);
    if (colorSource.user_message_box_color) setUserChatBgColor(colorSource.user_message_box_color, user_chat_bubble_background);
}

/**
 * Loads the full character record from the database.
 * @param {string} CHAR_ID
 * @returns {Promise<CharacterRecord|null>}
 */
async function getCharacterRecord(CHAR_ID) {
    if (!db) await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHARACTER_OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(CHARACTER_OBJECT_STORE_NAME);
        const getRequest = objectStore.get(CHAR_ID);
        getRequest.onsuccess = function (event) {
            resolve(event.target.result || null);
        };
        getRequest.onerror = function (e) { reject(e.target.error); };
    });
}

/**
 * Populates the customizer popup form with values from the database.
 * @param {HTMLElement} form
 * @param {string} CHAR_ID
 * @returns {Promise<void>}
 */
async function populateCustomizerPopup(form, CHAR_ID) {
    // Cache DOM elements to avoid repeated queries
    const formElements = {
        nameInput: form.querySelector('#name-input'),
        nameColorInput: form.querySelector('#name-color-input'),
        narrationColorInput: form.querySelector('#character-narration-color-input'),
        chatColorInput: form.querySelector('#character-chat-color-input'),
        chatBgColorInput: form.querySelector('#character-chat-bg-color-input'),
        userNameColorInput: form.querySelector('#user-name-color-input'),
        userChatColorInput: form.querySelector('#user-chat-color-input'),
        userChatBgColorInput: form.querySelector('#user-chat-bg-color-input'),
        characterImageUrlInput: form.querySelector('#character-image-url-input'),
        bgUrlInput: form.querySelector('#bg-url-input')
    };

    // If temp_form_data is not empty, use it to populate the form
    if (temp_form_data && Object.keys(temp_form_data).length > 0) {
        // Helper function to set value and dispatch event if element exists
        const setValueAndDispatch = (element, value) => {
            if (element && value !== undefined) {
                element.value = value;
                element.dispatchEvent(new Event('input'));
            }
        };

        // Populate form fields from temp_form_data
        setValueAndDispatch(formElements.nameInput, temp_form_data.character_alias);
        setValueAndDispatch(formElements.nameColorInput, temp_form_data.character_name_color);
        setValueAndDispatch(formElements.narrationColorInput, temp_form_data.character_narration_color);
        setValueAndDispatch(formElements.chatColorInput, temp_form_data.character_message_color);
        setValueAndDispatch(formElements.chatBgColorInput, temp_form_data.character_message_box_color);
        setValueAndDispatch(formElements.userNameColorInput, temp_form_data.username_color);
        setValueAndDispatch(formElements.userChatColorInput, temp_form_data.user_message_color);
        setValueAndDispatch(formElements.userChatBgColorInput, temp_form_data.user_message_box_color);

        // Handle image URLs (only if they're URLs, not base64)
        if (formElements.characterImageUrlInput && typeof temp_form_data.character_image === 'string' && !temp_form_data.character_image.startsWith('data:image')) {
            formElements.characterImageUrlInput.value = temp_form_data.character_image;
        }
        if (formElements.bgUrlInput) {
            if (typeof temp_form_data.background_image === 'string' && !temp_form_data.background_image.startsWith('data:image')) {
                formElements.bgUrlInput.value = temp_form_data.background_image;
            } else if (!temp_form_data.background_image && typeof temp_form_data.default_background_image === 'string') {
                formElements.bgUrlInput.value = temp_form_data.default_background_image;
            }
        }
        return;
    }
    // Fallback to DB values if temp_form_data is empty
    const getField = async (field) => await getCharacterField(CHAR_ID, field);
    const [
        alias,
        nameColor,
        narrationColor,
        messageColor,
        messageBoxColor,
        usernameColor,
        userMessageColor,
        userMessageBoxColor,
        backgroundImage,
        defaultBackgroundImage
    ] = await Promise.all([
        getField('character_alias'),
        getField('character_name_color'),
        getField('character_narration_color'),
        getField('character_message_color'),
        getField('character_message_box_color'),
        getField('username_color'),
        getField('user_message_color'),
        getField('user_message_box_color'),
        getField('background_image'),
        getField('default_background_image')
    ]);

    // Helper function to set value and dispatch event if element exists
    const setValueAndDispatch = (element, value) => {
        if (element && value !== null) {
            element.value = value;
            element.dispatchEvent(new Event('input'));
        }
    };

    // Set values in form using cached elements
    setValueAndDispatch(formElements.nameInput, alias);
    setValueAndDispatch(formElements.nameColorInput, nameColor);
    setValueAndDispatch(formElements.narrationColorInput, narrationColor);
    setValueAndDispatch(formElements.chatColorInput, messageColor);
    setValueAndDispatch(formElements.chatBgColorInput, messageBoxColor);
    setValueAndDispatch(formElements.userNameColorInput, usernameColor);
    setValueAndDispatch(formElements.userChatColorInput, userMessageColor);
    setValueAndDispatch(formElements.userChatBgColorInput, userMessageBoxColor);

    // Handle background image URL
    if (formElements.bgUrlInput) {
        if (backgroundImage && typeof backgroundImage === 'string' && !backgroundImage.startsWith('data:image')) {
            // If there's a custom background image that's a URL, show it
            formElements.bgUrlInput.value = backgroundImage;
        } else if (!backgroundImage && defaultBackgroundImage && typeof defaultBackgroundImage === 'string' && defaultBackgroundImage.startsWith('url(')) {
            // If no custom background but there's a default background, extract and show the URL
            const urlMatch = defaultBackgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (urlMatch) {
                formElements.bgUrlInput.value = urlMatch[1];
            }
        }
    }
}

/**
 * Loads customizer data from the database and updates the form/UI.
 * @param {HTMLElement} form
 * @returns {Promise<void>}
 */
async function loadCustomizerData(form) {
    let anchor = document.querySelector(char_id_selector);
    let CHAR_ID = findCharacterID(anchor);
    if (!CHAR_ID) CHAR_ID = CHAT_ID;
    // await loadCustomizedUI(CHAR_ID);
    await populateCustomizerPopup(form, CHAR_ID);
}

/**
 * Handles the addition of the customizer form to the DOM and sets up observers and event handlers.
 * @param {MutationRecord[]} mutationsList
 * @param {MutationObserver} observer
 * @returns {void}
 */
function handleFormAdded(mutationsList, observer) {
    // Check if the form is added
    const form = document.querySelector('#chat-customizer-ui-popup');
    const formRoot = document.querySelector("#headlessui-portal-root");
    const formBody = document.querySelector('#chat-customizer-ui-popup > div');

    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            if (form) {
                console.log('Form Found.');

                // Capture original background image before any modifications
                captureOriginalBackgroundImage();

                // Add classes to existing elements
                addUserNameClass();

                // // Create an observer instance linked to the callback function
                let usernameObserver = new MutationObserver(handleMutations);

                // // Start observing the target node for configured mutations
                usernameObserver.observe(document.body, { childList: true, subtree: true });

                // Attach event listener to the close button
                initializeCloseButtonEventHandler(formRoot, formBody);

                // Attach event listener to all form parameters
                initializeCharacterSettingsEventHandlers(formRoot);

                // Load data from DB
                loadCustomizerData(formRoot);

                // Disconnect the observer once the form is found
                observer.disconnect();

                break;
            }
        }
    }
}

/**
 * Saves the current character defaults to the database for later reset.
 * @param {HTMLElement} form
 * @param {string} [overrideCharId] Optional CHAR_ID to override (for Universal save)
 * @returns {Promise<void>}
 */
async function saveCharacterDetailsToDB(form, overrideCharId) {
    let anchor = document.querySelector(char_id_selector);
    let CHAR_ID = overrideCharId || findCharacterID(anchor);
    if (!CHAR_ID) CHAR_ID = CHAT_ID;

    // Gather current values
    const char_name_input = form.querySelector('#name-input');
    const char_name_color_input = form.querySelector('#name-color-input');
    const char_narr_input = form.querySelector('#character-narration-color-input');
    const char_chat_input = form.querySelector('#character-chat-color-input');
    const char_chat_bg_input = form.querySelector('#character-chat-bg-color-input');
    const user_name_color_input = form.querySelector('#user-name-color-input');
    const user_chat_input = form.querySelector('#user-chat-color-input');
    const user_chat_bg_input = form.querySelector('#user-chat-bg-color-input');

    // Store null if input is missing or empty, otherwise store the value
    const getOrNull = (input) => (input && input.value !== '' ? input.value : null);

    await Promise.all([
        saveCharacterAlias(CHAR_ID, getOrNull(char_name_input)),
        saveCharacterNameColor(CHAR_ID, getOrNull(char_name_color_input)),
        saveCharacterNarrationColor(CHAR_ID, getOrNull(char_narr_input)),
        saveCharacterMessageColor(CHAR_ID, getOrNull(char_chat_input)),
        saveCharacterMessageBoxColor(CHAR_ID, getOrNull(char_chat_bg_input)),
        saveUsernameColor(CHAR_ID, getOrNull(user_name_color_input)),
        saveUserMessageColor(CHAR_ID, getOrNull(user_chat_input)),
        saveUserMessageBoxColor(CHAR_ID, getOrNull(user_chat_bg_input)),
        saveDefaultBackgroundImage(CHAR_ID, getOrNull(default_background_image)),
    ]);
}

// Helper to save from temp_form_data using batch operation
async function saveCharacterDetailsToDBFromTemp(overrideCharId) {
    let anchor = document.querySelector(char_id_selector);
    let CHAR_ID = overrideCharId || findCharacterID(anchor);
    if (!CHAR_ID) CHAR_ID = CHAT_ID;

    // Only include fields that actually exist in temp_form_data (have been modified)
    const fieldsToSave = {};

    // Only add fields that exist in temp_form_data
    if ('character_alias' in temp_form_data) fieldsToSave.character_alias = temp_form_data.character_alias;
    if ('character_name_color' in temp_form_data) fieldsToSave.character_name_color = temp_form_data.character_name_color;
    if ('character_narration_color' in temp_form_data) fieldsToSave.character_narration_color = temp_form_data.character_narration_color;
    if ('character_message_color' in temp_form_data) fieldsToSave.character_message_color = temp_form_data.character_message_color;
    if ('character_message_box_color' in temp_form_data) fieldsToSave.character_message_box_color = temp_form_data.character_message_box_color;
    if ('username_color' in temp_form_data) fieldsToSave.username_color = temp_form_data.username_color;
    if ('user_message_color' in temp_form_data) fieldsToSave.user_message_color = temp_form_data.user_message_color;
    if ('user_message_box_color' in temp_form_data) fieldsToSave.user_message_box_color = temp_form_data.user_message_box_color;
    if ('background_image' in temp_form_data) fieldsToSave.background_image = temp_form_data.background_image;
    if ('character_image' in temp_form_data) fieldsToSave.character_image = temp_form_data.character_image;
    if ('default_background_image' in temp_form_data) fieldsToSave.default_background_image = temp_form_data.default_background_image;

    // Only save if there are actually fields to update
    if (Object.keys(fieldsToSave).length > 0) {
        await saveCharacterFieldsBatch(CHAR_ID, fieldsToSave);
    }
}

// --- PERFORMANCE OPTIMIZATIONS ---
let cachedStyleSheets = null;
let dynamicStyleSheet = null;

/**
 * Gets filtered stylesheets, excluding Google Fonts for performance.
 * Uses caching to avoid repeated filtering.
 * @returns {CSSStyleSheet[]}
 */
function getCachedStyleSheets() {
    if (!cachedStyleSheets) {
        cachedStyleSheets = Array.from(document.styleSheets).filter(sheet =>
            !sheet.href || !sheet.href.includes('fonts.googleapis.com')
        );
    }
    return cachedStyleSheets;
}

/**
 * Gets or creates a dynamic stylesheet for custom CSS rules.
 * @returns {CSSStyleSheet}
 */
function getDynamicStyleSheet() {
    if (!dynamicStyleSheet) {
        let styleElement = document.getElementById('chat-customizer-dynamic-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'chat-customizer-dynamic-styles';
            document.head.appendChild(styleElement);
        }
        dynamicStyleSheet = styleElement.sheet;
    }
    return dynamicStyleSheet;
}

/**
 * Applies CSS rules using a dynamic stylesheet for better performance.
 * @param {string} selector
 * @param {Object} styles
 */
function applyDynamicStyle(selector, styles) {
    const sheet = getDynamicStyleSheet();
    const styleString = Object.entries(styles).map(([prop, value]) => `${prop}: ${value}`).join('; ');
    const rule = `${selector} { ${styleString} !important; }`;

    try {
        sheet.insertRule(rule, sheet.cssRules.length);
    } catch (e) {
        console.warn('Failed to insert CSS rule:', rule, e);
    }
}

/**
 * Clears cached data for performance optimization.
 * Call this when navigating away from pages or when major UI changes occur.
 */
function clearCaches() {
    cachedStyleSheets = null;
    dynamicStyleSheet = null;
    temp_form_data = {};
    // Note: we intentionally don't reset default_background_image here
    // as it should persist throughout the session
}

