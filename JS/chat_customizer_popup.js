// Chat Customizer Popup - Main popup functionality and form handling
// This module handles the customizer popup UI, form interactions, and data loading

// --- STATE MANAGEMENT ---
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
 * Optimized event handler initialization with better performance
 * @param {HTMLElement} form
 * @returns {void}
 */
function initializeCharacterSettingsEventHandlers(form) {
    // Helper to update temp_form_data
    const updateTemp = (key, value) => temp_form_data[key] = value;

    // Cache all form elements once with error handling
    const formElements = {};
    const elementSelectors = {
        char_name_input: '#name-input',
        char_name_color_input: '#name-color-input',
        char_image_url_input: '#character-image-url-input',
        char_image_file_input: '#character-image-file-input',
        bg_url_input: '#bg-url-input',
        bg_file_input: '#bg-file-input',
        char_narr_input: '#character-narration-color-input',
        char_chat_input: '#character-chat-color-input',
        user_chat_input: '#user-chat-color-input',
        char_chat_bg_input: '#character-chat-bg-color-input',
        user_chat_bg_input: '#user-chat-bg-color-input',
        user_name_color_input: '#user-name-color-input',
        saveButton: '#save-button',
        applyToAllCheckbox: '#apply-to-all-checkbox',
        charThemeCheckbox: '#character-theme-checkbox',
        deleteCurrentPageStyleButton: '#delete-current-page-style-button',
        deleteAllCharacterStylesButton: '#delete-all-character-styles-button'
    };

    // Batch DOM queries
    Object.entries(elementSelectors).forEach(([key, selector]) => {
        formElements[key] = form.querySelector(selector);
    });

    // Optimized event handler mapping
    const inputHandlers = {
        'name-input': (value) => {
            setCharacterAlias(value);
            updateTemp('character_alias', value);
        },
        'character-image-url-input': async (value) => {
            if (value) {
                const imageBase64 = await urlToBase64(value);
                setCharacterImage(imageBase64);
                updateTemp('character_image', value);
            }
        },
        'bg-url-input': async (value) => {
            if (value) {
                const bgBase64 = await urlToBase64(value);
                setBackgroundImage(bgBase64);
                updateTemp('background_image', value);
            }
        }
    };

    const changeHandlers = {
        'name-color-input': (value) => {
            setCharacterAliasColor(value);
            updateTemp('character_name_color', value);
        },
        'character-image-file-input': async (target) => {
            if (target.files[0]) {
                const imageBase64 = await fileToBase64(target.files[0]);
                setCharacterImage(imageBase64);
                updateTemp('character_image', imageBase64);
            }
        },
        'bg-file-input': async (target) => {
            if (target.files[0]) {
                const bgBase64 = await fileToBase64(target.files[0]);
                setBackgroundImage(bgBase64);
                updateTemp('background_image', bgBase64);
            }
        },
        'character-narration-color-input': (value) => {
            setCharacterNarrationColor(value);
            updateTemp('character_narration_color', value);
        },
        'character-chat-color-input': (value) => {
            setCharacterDialogueColor(value, character_dialogue);
            updateTemp('character_message_color', value);
        },
        'user-chat-color-input': (value) => {
            setUserChatColor(value, user_message);
            updateTemp('user_message_color', value);
        },
        'character-chat-bg-color-input': (value) => {
            setCharacterChatBgColor(value, character_chat_bubble_background);
            updateTemp('character_message_box_color', value);
        },
        'user-chat-bg-color-input': (value) => {
            setUserChatBgColor(value, user_chat_bubble_background);
            updateTemp('user_message_box_color', value);
        },
        'user-name-color-input': (value) => {
            setUserNameColor(value);
            updateTemp('username_color', value);
        },
        'character-theme-checkbox': (target) => {
            // This checkbox determines save target: checked = character theme, unchecked = chat-specific
            console.log('=== DEBUG: Character theme checkbox changed:', target.checked);
            console.log('  Will save to:', target.checked ? 'CHAR_ID (character theme)' : 'CHAT_ID (chat-specific)');
        }
    };

    // Delegated event listeners for better performance
    form.addEventListener('input', async function(e) {
        const handler = inputHandlers[e.target.id];
        if (handler) {
            await handler(e.target.value);
        }
    });

    form.addEventListener('change', async function(e) {
        const handler = changeHandlers[e.target.id];
        if (handler) {
            if (e.target.type === 'file') {
                await handler(e.target);
            } else {
                await handler(e.target.value);
            }
        }
    });

    // Button event handlers with null checks
    formElements.saveButton?.addEventListener('click', async function() {
        let anchor = document.querySelector(char_id_selector);
        let CHAR_ID = findCharacterID(anchor) || CHAT_ID;
        
        // Determine save target based on character theme checkbox
        let saveTarget;
        if (formElements.charThemeCheckbox?.checked) {
            // Save as character theme (CHAR_ID)
            saveTarget = CHAR_ID;
            console.log('=== DEBUG: Saving as character theme to CHAR_ID:', saveTarget);
        } else {
            // Save as chat-specific (CHAT_ID)  
            saveTarget = CHAT_ID;
            console.log('=== DEBUG: Saving as chat-specific to CHAT_ID:', saveTarget);
        }
        
        await saveCharacterDetailsToDBFromTemp(saveTarget);
        
        if (formElements.applyToAllCheckbox?.checked) {
            await saveCharacterDetailsToDBFromTemp('Universal');
            console.log('=== DEBUG: Also saved to Universal');
        }
        
        showInjectionNotification(notification_resource_name, null, 'Settings saved successfully!');
        clearTempFormData();
    });

    formElements.deleteCurrentPageStyleButton?.addEventListener('click', async function() {
        // Always operate on current chat (CHAT_ID) for this action
        await deleteCharacterRecord(CHAT_ID);
        location.reload();
        alert('Current chat style has been deleted.');
    });

    formElements.deleteAllCharacterStylesButton?.addEventListener('click', async function() {
        let anchor = document.querySelector(char_id_selector);
        let CHAR_ID = findCharacterID(anchor) || CHAT_ID;
        
        // Delete character theme and also exclude this chat from character themes  
        await Promise.all([
            deleteCharacterRecord(CHAR_ID),  // Delete character theme
            deleteCharacterRecord(CHAT_ID)   // Delete any chat-specific settings too
        ]);
        location.reload();
        alert('All styles for this character and chat have been deleted.');
    });
}

/**
 * Loads all customizer settings using hierarchical priority system:
 * 1. Chat-specific settings (CHAT_ID) - highest priority
 * 2. Character-specific settings (CHAR_ID) - medium priority  
 * 3. Universal settings - fallback
 * @param {string} CHAR_ID - Character ID
 * @returns {Promise<void>}
 */
async function loadCustomizedUI(CHAR_ID) {
    console.log('=== DEBUG: loadCustomizedUI called with CHAR_ID:', CHAR_ID, 'CHAT_ID:', CHAT_ID);
    
    // Load all three potential sources
    const [chatRecord, charRecord, universalRecord] = await Promise.all([
        getCharacterRecord(CHAT_ID),        // Chat-specific settings
        getCharacterRecord(CHAR_ID),        // Character-specific settings  
        getUniversalColorSettings()         // Universal settings
    ]);
    
    console.log('=== DEBUG: Chat record (CHAT_ID):', chatRecord);
    console.log('=== DEBUG: Character record (CHAR_ID):', charRecord);
    console.log('=== DEBUG: Universal record:', universalRecord);
    
    // Hierarchical merging: Chat > Character > Universal
    const mergedSettings = mergeSettingsHierarchically(chatRecord, charRecord, universalRecord);
    console.log('=== DEBUG: Final merged settings:', mergedSettings);
    
    // Apply the merged settings to the UI
    applySettingsToUI(mergedSettings);
}

/**
 * Merges settings using hierarchical priority: Chat > Character > Universal
 * @param {Object|null} chatRecord - Chat-specific settings (highest priority)
 * @param {Object|null} charRecord - Character-specific settings (medium priority)
 * @param {Object|null} universalRecord - Universal settings (fallback)
 * @returns {Object} Merged settings object
 */
function mergeSettingsHierarchically(chatRecord, charRecord, universalRecord) {
    const fields = [
        'character_alias', 'character_image', 'background_image', 'default_background_image',
        'character_name_color', 'character_narration_color', 'character_message_color',
        'character_message_box_color', 'username_color', 'user_message_color', 'user_message_box_color'
    ];
    
    const mergedSettings = {};
    
    fields.forEach(field => {
        // Priority: Chat > Character > Universal
        if (chatRecord && chatRecord[field] !== undefined && chatRecord[field] !== null) {
            mergedSettings[field] = chatRecord[field];
        } else if (charRecord && charRecord[field] !== undefined && charRecord[field] !== null) {
            mergedSettings[field] = charRecord[field];
        } else if (universalRecord && universalRecord[field] !== undefined && universalRecord[field] !== null) {
            mergedSettings[field] = universalRecord[field];
        }
    });
    
    return mergedSettings;
}

/**
 * Applies the merged settings to the actual UI
 * @param {Object} settings - The merged settings to apply
 */
async function applySettingsToUI(settings) {
    // Apply images/backgrounds/alias if present
    if (settings.character_image) {
        await applyImageSetting(settings.character_image, 'character');
    }
    
    if (settings.background_image) {
        await applyImageSetting(settings.background_image, 'background');
    }
    
    if (settings.character_alias) {
        setCharacterAlias(settings.character_alias);
    }
    
    // Apply colors if present
    if (settings.character_name_color) setCharacterAliasColor(settings.character_name_color);
    if (settings.character_narration_color) setCharacterNarrationColor(settings.character_narration_color);
    if (settings.character_message_color) setCharacterDialogueColor(settings.character_message_color);
    if (settings.username_color) setUserNameColor(settings.username_color);
    if (settings.user_message_color) setUserChatColor(settings.user_message_color, user_message);
    if (settings.character_message_box_color) setCharacterChatBgColor(settings.character_message_box_color, character_chat_bubble_background);
    if (settings.user_message_box_color) setUserChatBgColor(settings.user_message_box_color, user_chat_bubble_background);
}

/**
 * Helper function to apply image settings with URL/base64 handling
 * @param {string} imageData - Image data (URL or base64)
 * @param {string} type - 'character' or 'background'
 */
async function applyImageSetting(imageData, type) {
    const isUrl = imageData.startsWith('http://') || imageData.startsWith('https://');
    
    if (isUrl) {
        try {
            const imageBase64 = await urlToBase64(imageData);
            if (type === 'character') {
                setCharacterImage(imageBase64);
            } else {
                setBackgroundImage(imageBase64);
            }
        } catch (error) {
            console.error(`Failed to load ${type} image from URL:`, error);
            // Fallback: set the URL directly
            if (type === 'character') {
                setCharacterImage(imageData);
            } else {
                setBackgroundImage(imageData);
            }
        }
    } else {
        if (type === 'character') {
            setCharacterImage(imageData);
        } else {
            setBackgroundImage(imageData);
        }
    }
}

/**
 * Loads data using hierarchical priority: Chat ID > Character ID > Universal
 * @param {string} CHAR_ID - Character ID  
 * @returns {Promise<Object>} Merged data object
 */
async function loadHierarchicalData(CHAR_ID) {
    // Load all three potential sources in parallel
    const [chatRecord, charRecord, universalRecord] = await Promise.all([
        getCharacterRecord(CHAT_ID),        // Chat-specific settings
        getCharacterRecord(CHAR_ID),        // Character-specific settings  
        getUniversalColorSettings()         // Universal settings
    ]);
    
    console.log('=== DEBUG: Hierarchical data loading:');
    console.log('  Chat record (CHAT_ID):', chatRecord);
    console.log('  Character record (CHAR_ID):', charRecord);
    console.log('  Universal record:', universalRecord);
    
    // Merge with hierarchical priority and add character name from page if not found
    const mergedData = mergeSettingsHierarchically(chatRecord, charRecord, universalRecord);
    
    // If no character alias found, get it from the page
    if (!mergedData.character_alias) {
        mergedData.character_alias = await getCharacterNameFromPage();
    }
    
    return mergedData;
}

// --- FORM POPULATION AND DATA LOADING ---
/**
 * Optimized form population with hierarchical data loading and batching
 * Priority: Chat ID > Character ID > Universal > temp_form_data (for temporary overrides)
 * @param {HTMLElement} form - The form element
 * @param {string} CHAR_ID - Character ID
 * @returns {Promise<void>}
 */
async function populateCustomizerPopup(form, CHAR_ID) {
    console.log('=== DEBUG: populateCustomizerPopup called with CHAR_ID:', CHAR_ID, 'CHAT_ID:', CHAT_ID);
    
    // Single DOM query with better caching
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

    // Check for meaningful data in temp_form_data (user has made changes)
    const hasModifications = temp_form_data && Object.keys(temp_form_data).length > 0;
    
    let formData = {};
    
    if (hasModifications) {
        console.log('=== DEBUG: Using temp_form_data with modifications:', temp_form_data);
        // Start with database data and overlay temp changes
        const hierarchicalData = await loadHierarchicalData(CHAR_ID);
        formData = { ...hierarchicalData, ...temp_form_data }; // temp_form_data takes precedence
    } else {
        console.log('=== DEBUG: Loading fresh data from database hierarchy');
        formData = await loadHierarchicalData(CHAR_ID);
    }
    
    // Batch form population for better performance
    const formMapping = [
        [formElements.nameInput, formData.character_alias],
        [formElements.nameColorInput, formData.character_name_color],
        [formElements.narrationColorInput, formData.character_narration_color],
        [formElements.chatColorInput, formData.character_message_color],
        [formElements.chatBgColorInput, formData.character_message_box_color],
        [formElements.userNameColorInput, formData.username_color],
        [formElements.userChatColorInput, formData.user_message_color],
        [formElements.userChatBgColorInput, formData.user_message_box_color]
    ];
    
    // Batch DOM updates to minimize reflows
    requestAnimationFrame(() => {
        formMapping.forEach(([element, value]) => {
            setFormElementValue(element, value, true); // Suppress events during batch
        });
        
        // Handle background image URL
        handleBackgroundImageUrl(formElements.bgUrlInput, formData);
        
        // Fire events after all DOM updates
        formMapping.forEach(([element, value]) => {
            if (element && value !== null && value !== undefined) {
                const eventType = element.type === 'color' ? 'change' : 'input';
                element.dispatchEvent(new Event(eventType, { bubbles: true }));
            }
        });
    });
}

/**
 * Handles background image URL setting with optimized logic
 */
function handleBackgroundImageUrl(bgUrlInput, formData) {
    if (!bgUrlInput) return;
    
    let bgImageToShow = null;
    
    // Priority: non-base64 background_image, then default_background_image, then extracted URL
    if (formData.background_image && !formData.background_image.startsWith('data:image')) {
        bgImageToShow = formData.background_image;
    } else if (formData.default_background_image) {
        if (formData.default_background_image.startsWith('url(')) {
            const urlMatch = formData.default_background_image.match(/url\(['"]?([^'"]+)['"]?\)/);
            bgImageToShow = urlMatch?.[1];
        } else {
            bgImageToShow = formData.default_background_image;
        }
    }
    
    if (bgImageToShow) {
        bgUrlInput.value = bgImageToShow;
    }
}

/**
 * Gets character name from page elements
 */
async function getCharacterNameFromPage() {
    const characterNameElement = document.querySelector(character_name_selector);
    return characterNameElement?.textContent?.trim() || null;
}

/**
 * Optimized load customizer data function with hierarchical loading
 * @param {HTMLElement} form
 * @returns {Promise<void>}
 */
async function loadCustomizerData(form) {
    console.log('=== DEBUG: loadCustomizerData called');
    
    // Cache selectors and minimize DOM queries
    const anchor = document.querySelector(char_id_selector);
    const CHAR_ID = findCharacterID(anchor) || CHAT_ID;
    
    console.log('=== DEBUG: Using CHAR_ID:', CHAR_ID, 'CHAT_ID:', CHAT_ID);
    
    // Debug the hierarchy (can be disabled in production)
    await debugDataHierarchy(CHAR_ID);
    
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

// --- SAVE OPERATIONS ---
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

/**
 * Optimized save function using batch database operations
 * @param {string} [overrideCharId] Optional CHAR_ID to override (for Universal save)
 * @returns {Promise<void>}
 */
async function saveCharacterDetailsToDBFromTemp(overrideCharId) {
    const anchor = document.querySelector(char_id_selector);
    const CHAR_ID = overrideCharId || findCharacterID(anchor) || CHAT_ID;

    // Define color-only fields for universal saving
    const colorFields = [
        'character_name_color',
        'character_narration_color', 
        'character_message_color',
        'character_message_box_color',
        'username_color',
        'user_message_color',
        'user_message_box_color'
    ];

    let fieldsToSave;
    
    // If saving to Universal, only save color fields
    if (CHAR_ID === 'Universal') {
        fieldsToSave = Object.fromEntries(
            Object.entries(temp_form_data).filter(([key, value]) => 
                value !== undefined && value !== null && colorFields.includes(key)
            )
        );
        console.log('=== DEBUG: Universal save - only color fields:', fieldsToSave);
    } else {
        // For character/chat specific saves, include all fields
        fieldsToSave = Object.fromEntries(
            Object.entries(temp_form_data).filter(([key, value]) => value !== undefined && value !== null)
        );
    }

    // Only save if there are actually fields to update
    if (Object.keys(fieldsToSave).length > 0) {
        await saveCharacterFieldsBatch(CHAR_ID, fieldsToSave);
    }
}

// --- CACHE MANAGEMENT ---
/**
 * Clears temporary form data cache
 */
function clearTempFormData() {
    temp_form_data = {};
}

// --- INITIALIZATION AND OBSERVERS ---
/**
 * Debug function to log the current data loading hierarchy
 * @param {string} CHAR_ID - Character ID
 */
async function debugDataHierarchy(CHAR_ID) {
    console.log('=== DATA HIERARCHY DEBUG ===');
    console.log('Loading priority: CHAT_ID > CHAR_ID > Universal');
    console.log('CHAT_ID:', CHAT_ID);
    console.log('CHAR_ID:', CHAR_ID);
    
    const summary = await getDataSourceSummary(CHAR_ID, CHAT_ID);
    console.log('Data availability:', summary);
    
    const hierarchicalData = await loadHierarchicalData(CHAR_ID);
    console.log('Final merged data:', hierarchicalData);
    console.log('=== END HIERARCHY DEBUG ===');
}

// --- INITIALIZATION AND OBSERVERS ---

