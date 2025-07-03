// chat customizer popup
let default_background_image = null;
// --- UI SETTERS ---
/**
 * Sets the background image for target divs.
 * @param {string} imageBase64 - The base64-encoded image string.
 * @returns {Promise<void>}
 */
async function setBackgroundImage(imageBase64) {
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
    divElements.forEach((targetDiv) => {
        default_background_image = targetDiv.style.backgroundImage;
        console.log(default_background_image);
        targetDiv.style.backgroundImage = `url('data:image;base64,${imageBase64}')`;
        targetDiv.style.backgroundSize = 'cover';
        targetDiv.classList.remove('container');
    });
}

/**
 * Sets the character image in the character container.
 * @param {string} imageBase64 - The base64-encoded image string.
 * @returns {Promise<void>}
 */
async function setCharacterImage(imageBase64) {
    /** @type {HTMLElement|null} */
    let characterContainer = document.querySelector('.pointer-events-none.absolute.inset-0.mt-16.overflow-hidden.landscape\\:inset-y-0.landscape\\:left-0.landscape\\:right-auto.landscape\\:w-1\\/2');
    if (characterContainer) {
        /** @type {HTMLImageElement|null} */
        let existingImage = characterContainer.querySelector('div > div > img');
        let imageHeight = "90vh";
        if (existingImage) {
            existingImage.src = `data:image;base64,${imageBase64}`;
            existingImage.style.height = imageHeight;
            console.log('Changed Character Image.');
        } else {
            let innerDiv = characterContainer.querySelector('div > div');
            if (!innerDiv) {
                renderHTMLFromFile(character_image_container_resource_name).then(character_image_container => {
                    /** @type {HTMLImageElement} */
                    let image = character_image_container.querySelector('img');
                    image.src = `data:image;base64,${imageBase64}`;
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
 * Sets the character chat color in the UI.
 * @param {string} color
 * @returns {void}
 */
function setCharacterDialogueColor(color, regex) {
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
                    rule.style.color = color;
                }
            });
        } catch (e) {
            console.warn('Cannot access stylesheet:', styleSheet.href);
            console.warn(e);
        }
    });
}

/**
 * Sets the user chat color in the UI.
 * @param {string} color
 * @param {RegExp} regex
 * @returns {void}
 */
function setUserChatColor(color, regex) {
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
                    rule.style.color = color;
                }
            });
        } catch (e) {
            console.warn('Cannot access stylesheet:', styleSheet.href);
            console.warn(e);
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
        // document.documentElement.style.cssText = '';

        let main = document.querySelector('body > main');
        main.setAttribute('aria-hidden', 'false');
        main.removeAttribute('inert');

        // form.style.display = 'none'; // or 'hidden' or 'unset' depending on your CSS
        form.remove();
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
 * Initializes event handlers for character settings form.
 * @param {HTMLElement} form
 * @returns {void}
 */
function initializeCharacterSettingsEventHandlers(form) {
    let char_name_input = form.querySelector('#name-input');
    if (!char_name_input) {
        console.log('#name-input element not found');
    } else {
        char_name_input.addEventListener('input', function () {
            setCharacterAlias(char_name_input.value);
        });
    }

    let char_name_color_input = form.querySelector('#name-color-input');
    if (!char_name_color_input) {
        console.log('#name-color-input element not found');
    } else {
        char_name_color_input.addEventListener('input', function () {
            setCharacterAliasColor(char_name_color_input.value);
        });
    }

    let char_image_url_input = form.querySelector('#character-image-url-input');
    if (!char_image_url_input) {
        console.log('#character-image-url-input element not found');
    } else {
        char_image_url_input.addEventListener('input', async function () {
            let url = char_image_url_input.value;
            let imageBase64 = await urlToBase64(url);
            setCharacterImage(imageBase64);
        });
    }

    let char_image_file_input = form.querySelector('#character-image-file-input');
    if (!char_image_file_input) {
        console.log('#character-image-file-input element not found');
    } else {
        char_image_file_input.addEventListener('change', async function () {
            let url = char_image_file_input.files[0];
            let imageBase64 = await fileToBase64(url);
            setCharacterImage(imageBase64);
        });
    }

    let bg_url_input = form.querySelector('#bg-url-input');
    if (!bg_url_input) {
        console.log('#bg-url-input element not found');
    } else {
        bg_url_input.addEventListener('input', async function () {
            let url = bg_url_input.value;
            let imageBase64 = await urlToBase64(url);
            setBackgroundImage(imageBase64);
        });
    }

    let bg_file_input = form.querySelector('#bg-file-input');
    if (!bg_file_input) {
        console.log('#bg-file-input element not found');
    } else {
        bg_file_input.addEventListener('change', async function () {
            let url = bg_file_input.files[0];
            let imageBase64 = await fileToBase64(url);
            setBackgroundImage(imageBase64);
        });
    }

    let char_narr_input = form.querySelector('#character-narration-color-input');
    if (!char_narr_input) {
        console.log('#character-narration-color-input element not found');
    } else {
        char_narr_input.addEventListener('input', function () {
            setCharacterNarrationColor(char_narr_input.value);
        });
    }


    let char_chat_input = form.querySelector('#character-chat-color-input');
    if (!char_chat_input) {
        console.log('#character-chat-color-input element not found');
    } else {
        char_chat_input.addEventListener('input', function () {
            setCharacterDialogueColor(char_chat_input.value, character_dialogue);
        });
    }

    let user_chat_input = form.querySelector('#user-chat-color-input');
    if (!user_chat_input) {
        console.log('#user-chat-color-input element not found');
    } else {
        user_chat_input.addEventListener('input', function () {
            // Define the regex to match selectors starting with 'bg-black' and containing '85'
            const regex = user_message;

            setUserChatColor(user_chat_input.value, regex);
        });
    }


    let char_chat_bg_input = form.querySelector('#character-chat-bg-color-input');
    if (!char_chat_bg_input) {
        console.log('#character-chat-bg-color-input element not found');
    } else {
        char_chat_bg_input.addEventListener('input', function () {
            // Define the regex to match selectors starting with 'bg-black' and containing '85'
            const regex = character_chat_bubble_background;

            setCharacterChatBgColor(char_chat_bg_input.value, regex);
        });
    }


    let user_chat_bg_input = form.querySelector('#user-chat-bg-color-input');
    if (!user_chat_bg_input) {
        console.log('#user-chat-bg-color-input element not found');
    } else {
        user_chat_bg_input.addEventListener('input', function () {
            // Define the regex to match selectors starting with 'bg-black' and containing '85'
            const regex = user_chat_bubble_background;

            setUserChatBgColor(user_chat_bg_input.value, regex);
        });
    }


    let char_settings_reset = form.querySelector('#character-settings-reset-button');
    if (!char_settings_reset) {
        console.log('#character-settings-reset-button element not found');
    } else {
        char_settings_reset.addEventListener('click', function () {
            // Reset character name
            char_name_input.value = '';
            setCharacterAlias('');

            // Reset character name color
            char_name_color_input.value = '#ffffff';
            setCharacterAliasColor('#ffffff');

            // Reset character image URL and file
            char_image_url_input.value = '';
            char_image_file_input.value = '';
            // Optionally, reset the character image in the UI if needed
            // ... (custom logic if you want to remove/reset the image)
        });
    }

    let background_settings_reset = form.querySelector('#background-reset-button');
    if (!background_settings_reset) {
        console.log('#background-reset-button element not found');
    } else {
        background_settings_reset.addEventListener('click', function () {
            // Reset background URL and file
            bg_url_input.value = '';
            bg_file_input.value = '';
            // Optionally, reset the background image in the UI if needed
            // ... (custom logic if you want to remove/reset the background)
        });
    }

    let colors_reset = form.querySelector('#color-reset-button');
    if (!colors_reset) {
        console.log('#color-reset-button element not found');
    } else {
        colors_reset.addEventListener('click', function () {
            // Reset character narration color
            char_narr_input.value = '#b0d8fB';
            setCharacterNarrationColor('#b0d8fB');
            // Reset character chat color
            char_chat_input.value = '#ffffff';
            setCharacterDialogueColor('#ffffff');
            // Reset character chat background
            char_chat_bg_input.value = '#000000';
            setCharacterChatBgColor('#000000', character_chat_bubble_background);
            // Reset user name color
            user_name_color_input.value = '#000000';
            setUserNameColor('#000000');
            // Reset user chat color
            user_chat_input.value = '#000000';
            setUserChatColor('#000000', user_message);
            // Reset user chat background
            user_chat_bg_input.value = '#ffffff';
            setUserChatBgColor('#ffffff', user_chat_bubble_background);

            // Optionally, update the UI to reflect these resets
            // Trigger input events to update the UI
            char_narr_input.dispatchEvent(new Event('input'));
            char_chat_input.dispatchEvent(new Event('input'));
            char_chat_bg_input.dispatchEvent(new Event('input'));
            user_name_color_input.dispatchEvent(new Event('input'));
            user_chat_input.dispatchEvent(new Event('input'));
            user_chat_bg_input.dispatchEvent(new Event('input'));
        });
    }

    // Add Save button event handler
    let saveButton = form.querySelector('#save-button');
    let applyToAllCheckbox = form.querySelector('#apply-to-all-checkbox');
    let charThemeCheckbox = form.querySelector('#character-theme-checkbox');
    if (saveButton) {
        saveButton.addEventListener('click', async function () {
            let anchor = document.querySelector(char_id_selector);
            let CHAR_ID = findCharacterID(anchor) || CHAT_ID;
            // If character-theme-checkbox is unchecked, use CHAT_ID
            if (charThemeCheckbox && !charThemeCheckbox.checked) {
                CHAR_ID = CHAT_ID;
            }
            await saveCharacterDetailsToDB(form, CHAR_ID);
            // Save character image
            let char_image_url = form.querySelector('#character-image-url-input').value;
            let char_image_file = form.querySelector('#character-image-file-input').files[0];
            let charImageBase64 = null;
            if (char_image_file) {
                charImageBase64 = await fileToBase64(char_image_file);
            } else if (char_image_url) {
                charImageBase64 = await urlToBase64(char_image_url);
            }
            if (charImageBase64) {
                saveCharacterImage(CHAR_ID, charImageBase64);
            }
            // Save background image
            let bg_url = form.querySelector('#bg-url-input').value;
            let bg_file = form.querySelector('#bg-file-input').files[0];
            let bgImageBase64 = null;
            if (bg_file) {
                bgImageBase64 = await fileToBase64(bg_file);
            } else if (bg_url) {
                bgImageBase64 = await urlToBase64(bg_url);
            }
            if (bgImageBase64) {
                saveBackgroundImage(CHAR_ID, bgImageBase64);
            }
            // --- Apply to All (Universal) functionality ---
            if (applyToAllCheckbox && applyToAllCheckbox.checked) {
                await saveCharacterDetailsToDB(form, 'Universal');
            }
        });
    }

    // Add Delete Current Page Style button event handler
    let deleteCurrentPageStyleButton = form.querySelector('#delete-current-page-style-button');
    if (deleteCurrentPageStyleButton) {
        deleteCurrentPageStyleButton.addEventListener('click', async function () {
            let anchor = document.querySelector(char_id_selector);
            let CHAR_ID = findCharacterID(anchor) || CHAT_ID;
            await excludeChatIdForCharacter(CHAR_ID, CHAT_ID);
            alert('Current chat style excluded for this character.');
            location.reload();
        });
    }

    // Add Delete All Character Styles button event handler
    let deleteAllCharacterStylesButton = form.querySelector('#delete-all-character-styles-button');
    if (deleteAllCharacterStylesButton) {
        deleteAllCharacterStylesButton.addEventListener('click', async function () {
            let anchor = document.querySelector(char_id_selector);
            let CHAR_ID = findCharacterID(anchor) || CHAT_ID;
            await deleteCharacterRecord(CHAR_ID);
            alert('All styles for this character have been deleted.');
            location.reload();
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
    if (imageSource) setCharacterImage(imageSource);
    if (bgSource) setBackgroundImage(bgSource);
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
    // Use getCharacterField for each field
    const getField = async (field) => await getCharacterField(CHAR_ID, field);
    const [
        alias,
        nameColor,
        narrationColor,
        messageColor,
        messageBoxColor,
        usernameColor,
        userMessageColor,
        userMessageBoxColor
    ] = await Promise.all([
        getField('character_alias'),
        getField('character_name_color'),
        getField('character_narration_color'),
        getField('character_message_color'),
        getField('character_message_box_color'),
        getField('username_color'),
        getField('user_message_color'),
        getField('user_message_box_color')
    ]);
    // Set values in form if present
    if (form.querySelector('#name-input') && alias !== null) form.querySelector('#name-input').value = alias;
    if (form.querySelector('#name-color-input') && nameColor !== null) form.querySelector('#name-color-input').value = nameColor;
    if (form.querySelector('#character-narration-color-input') && narrationColor !== null) form.querySelector('#character-narration-color-input').value = narrationColor;
    if (form.querySelector('#character-chat-color-input') && messageColor !== null) form.querySelector('#character-chat-color-input').value = messageColor;
    if (form.querySelector('#character-chat-bg-color-input') && messageBoxColor !== null) form.querySelector('#character-chat-bg-color-input').value = messageBoxColor;
    if (form.querySelector('#user-name-color-input') && usernameColor !== null) form.querySelector('#user-name-color-input').value = usernameColor;
    if (form.querySelector('#user-chat-color-input') && userMessageColor !== null) form.querySelector('#user-chat-color-input').value = userMessageColor;
    if (form.querySelector('#user-chat-bg-color-input') && userMessageBoxColor !== null) form.querySelector('#user-chat-bg-color-input').value = userMessageBoxColor;
    // Optionally, trigger input events to update the UI with loaded values
    if (form.querySelector('#name-input')) form.querySelector('#name-input').dispatchEvent(new Event('input'));
    if (form.querySelector('#name-color-input')) form.querySelector('#name-color-input').dispatchEvent(new Event('input'));
    if (form.querySelector('#character-narration-color-input')) form.querySelector('#character-narration-color-input').dispatchEvent(new Event('input'));
    if (form.querySelector('#character-chat-color-input')) form.querySelector('#character-chat-color-input').dispatchEvent(new Event('input'));
    if (form.querySelector('#character-chat-bg-color-input')) form.querySelector('#character-chat-bg-color-input').dispatchEvent(new Event('input'));
    if (form.querySelector('#user-name-color-input')) form.querySelector('#user-name-color-input').dispatchEvent(new Event('input'));
    if (form.querySelector('#user-chat-color-input')) form.querySelector('#user-chat-color-input').dispatchEvent(new Event('input'));
    if (form.querySelector('#user-chat-bg-color-input')) form.querySelector('#user-chat-bg-color-input').dispatchEvent(new Event('input'));

    // Add event listener for character-theme-checkbox
    const charThemeCheckbox = form.querySelector('#character-theme-checkbox');
    if (charThemeCheckbox) {
        charThemeCheckbox.addEventListener('change', function () {
            let anchor = document.querySelector(char_id_selector);
            let CHAR_ID = findCharacterID(anchor);
            if (!charThemeCheckbox.checked) {
                // Replace char id with chat id
                CHAR_ID = CHAT_ID;
            }
            // populateCustomizerPopup(form, CHAR_ID);
        });
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

