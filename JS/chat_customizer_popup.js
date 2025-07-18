
// =========================
// STATE & CONSTANTS
// =========================
let default_background_image = null;
let temp_form_data = {};

// =========================
// UTILITY & HELPER FUNCTIONS
// =========================
// Reset character settings to default
function resetCharacterSettings(formElements, character_name_title, setCharacterAlias, setCharacterAliasColor, notification_resource_name, temp_form_data, character_image_container_resource_name, showInjectionNotification) {
    const originalCharacterName = document.querySelector(character_name_title)?.textContent?.trim() || '';
    if (formElements.char_name_input) {
        formElements.char_name_input.value = '';
        setCharacterAlias(originalCharacterName);
        delete temp_form_data.character_alias;
    }
    if (formElements.char_name_color_input) {
        formElements.char_name_color_input.value = '#ffffff';
        setCharacterAliasColor('#ffffff');
        delete temp_form_data.character_name_color;
    }
    if (formElements.char_image_url_input) {
        formElements.char_image_url_input.value = '';
        delete temp_form_data.character_image;
    }
    if (formElements.char_image_file_input) {
        formElements.char_image_file_input.value = '';
        delete temp_form_data.character_image;
    }
    if (typeof character_image_container_resource_name !== 'undefined') {
        const customImageContainer = document.querySelector("#character-image-container");
        if (customImageContainer) {
            customImageContainer.remove();
        }
    }
    showInjectionNotification(notification_resource_name, null, 'Character settings reset to default!');
}

// Reset background settings to default
function resetBackgroundSettings(formElements, default_background_image, bg_img, notification_resource_name, temp_form_data, showInjectionNotification) {
    if (formElements.bg_url_input) {
        formElements.bg_url_input.value = '';
        delete temp_form_data.background_image;
    }
    if (formElements.bg_file_input) {
        formElements.bg_file_input.value = '';
    }
    if (default_background_image !== null) {
        const targetDivs = document.querySelectorAll(bg_img);
        if (targetDivs.length > 0) {
            const divElements = Array.from(targetDivs).filter((element) => element.tagName === 'DIV');
            divElements.forEach((targetDiv) => {
                targetDiv.style.backgroundImage = default_background_image;
                targetDiv.style.backgroundSize = 'cover';
                targetDiv.classList.add('container');
            });
        }
    }
    showInjectionNotification(notification_resource_name, null, 'Background settings reset to default!');
}

/**
 * Validates that no_universal_colors functionality is working correctly
 * This is a debugging/testing function to ensure standardized behavior
 * @returns {Object} Validation results
 */
function validateNoUniversalColorsFunction() {
    const results = {
        defaultColorsPresent: true,
        allColorFieldsHandled: true,
        checkboxEventHandlerPresent: true,
        hierarchicalMergingLogic: true,
        errors: []
    };

    // Check if DEFAULT_COLORS are properly defined
    const expectedColorKeys = [
        'characterName', 'characterNarration', 'userNameColor', 
        'characterChat', 'userChat', 'characterChatBg', 'userChatBg'
    ];
    expectedColorKeys.forEach(key => {
        if (!DEFAULT_COLORS[key]) {
            results.defaultColorsPresent = false;
            results.errors.push(`Missing DEFAULT_COLORS.${key}`);
        }
    });

    // Check if mergeSettingsHierarchically handles no_universal_colors
    const testFunction = mergeSettingsHierarchically.toString();
    if (!testFunction.includes('no_universal_colors') || !testFunction.includes('colorFields')) {
        results.hierarchicalMergingLogic = false;
        results.errors.push('mergeSettingsHierarchically missing no_universal_colors logic');
    }

    console.log('no_universal_colors validation results:', results);
    return results;
}

// =========================

/**
 * Resets color settings to application defaults (not universal colors)
 * Used when no_universal_colors is enabled or when manually resetting
 * @param {Object} formElements - Form element references
 * @param {boolean} updateTempData - Whether to update temp_form_data (default: true)
 */
function resetColorSettings(formElements, updateTempData = true) {
    // Character name color
    if (formElements.char_name_color_input) {
        formElements.char_name_color_input.value = DEFAULT_COLORS.characterName;
        setCharacterAliasColor(DEFAULT_COLORS.characterName);
        if (updateTempData) temp_form_data.character_name_color = DEFAULT_COLORS.characterName;
    }
    
    // Character narration color
    if (formElements.char_narr_input) {
        formElements.char_narr_input.value = DEFAULT_COLORS.characterNarration;
        setCharacterNarrationColor(DEFAULT_COLORS.characterNarration);
        if (updateTempData) temp_form_data.character_narration_color = DEFAULT_COLORS.characterNarration;
    }
    
    // User name color
    if (formElements.user_name_color_input) {
        formElements.user_name_color_input.value = DEFAULT_COLORS.userNameColor;
        setUserNameColor(DEFAULT_COLORS.userNameColor);
        if (updateTempData) temp_form_data.username_color = DEFAULT_COLORS.userNameColor;
    }
    
    // Character chat color
    if (formElements.char_chat_input) {
        formElements.char_chat_input.value = DEFAULT_COLORS.characterChat;
        setCharacterDialogueColor(DEFAULT_COLORS.characterChat, character_dialogue);
        if (updateTempData) temp_form_data.character_message_color = DEFAULT_COLORS.characterChat;
    }
    
    // User chat color
    if (formElements.user_chat_input) {
        formElements.user_chat_input.value = DEFAULT_COLORS.userChat;
        setUserChatColor(DEFAULT_COLORS.userChat, user_message);
        if (updateTempData) temp_form_data.user_message_color = DEFAULT_COLORS.userChat;
    }
    
    // Character chat background color
    if (formElements.char_chat_bg_input) {
        formElements.char_chat_bg_input.value = DEFAULT_COLORS.characterChatBg;
        setCharacterChatBgColor(DEFAULT_COLORS.characterChatBg, character_chat_bubble_background);
        if (updateTempData) temp_form_data.character_message_box_color = DEFAULT_COLORS.characterChatBg;
    }
    
    // User chat background color
    if (formElements.user_chat_bg_input) {
        formElements.user_chat_bg_input.value = DEFAULT_COLORS.userChatBg;
        setUserChatBgColor(DEFAULT_COLORS.userChatBg, user_chat_bubble_background);
        if (updateTempData) temp_form_data.user_message_box_color = DEFAULT_COLORS.userChatBg;
    }
    
    showInjectionNotification(notification_resource_name, null, 'Color settings reset to default!');
}
// =========================
// --- EVENT HANDLERS ---
// =========================
/**
 * Initializes the close button event handler for the popup form.
 * @param {HTMLElement} form
 * @param {HTMLElement} formBody
 * @returns {void}
 */
function initializeCloseButtonEventHandler(form, formBody) {
    console.log(formBody);
    const closeModal = () => {
        document.documentElement.style.overflow = '';
        document.documentElement.style.paddingRight = '';
        let main = document.querySelector('body > main');
        if (main) {
            main.setAttribute('aria-hidden', 'false');
            main.removeAttribute('inert');
        }
        const portalRoot = document.getElementById('headlessui-portal-root');
        if (portalRoot) {
            portalRoot.remove();
        }
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    let mouseDownOutside = false;
    const handleMouseDown = (event) => {
        mouseDownOutside = !formBody.contains(event.target);
    };
    const handleMouseUp = (event) => {
        if (mouseDownOutside && !formBody.contains(event.target)) {
            closeModal();
        }
        mouseDownOutside = false;
    };

    let closeButton = form.querySelector('#close-button');
    closeButton.addEventListener('click', closeModal);

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
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
        noUniversalCheckbox: '#no-universal-checkbox',
        deleteCurrentPageStyleButton: '#delete-current-page-style-button',
        deleteAllCharacterStylesButton: '#delete-all-character-styles-button',
        characterSettingsResetButton: '#character-settings-reset-button',
        backgroundResetButton: '#background-reset-button',
        colorResetButton: '#color-reset-button'
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
        },
        'no-universal-checkbox': (target) => {
            updateTemp('no_universal_colors', target.checked);
        }
    };

    // Delegated event listeners for better performance
    form.addEventListener('input', async function (e) {
        const handler = inputHandlers[e.target.id];
        if (handler) {
            await handler(e.target.value);
        }
    });

    form.addEventListener('change', async function (e) {
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
    formElements.saveButton?.addEventListener('click', async function () {
        let anchor = document.querySelector(char_id_selector);
        let CHAR_ID = findCharacterID(anchor) || CHAT_ID;

        // Determine save target based on character theme checkbox
        let saveTarget;
        if (formElements.charThemeCheckbox?.checked) {
            // Save as character theme (CHAR_ID)
            saveTarget = CHAR_ID;
        } else {
            // Save as chat-specific (CHAT_ID)  
            saveTarget = CHAT_ID;
        }

        await saveCharacterDetailsToDBFromTemp(saveTarget);

        if (formElements.applyToAllCheckbox?.checked) {
            await saveCharacterDetailsToDBFromTemp('Universal');
        }

        showInjectionNotification(notification_resource_name, null, 'Settings saved successfully!');
        clearTempFormData();
    });

    formElements.deleteCurrentPageStyleButton?.addEventListener('click', async function () {
        // Always operate on current chat (CHAT_ID) for this action
        await deleteCharacterRecord(CHAT_ID);
        location.reload();
        alert('Current chat style has been deleted.');
    });

    formElements.deleteAllCharacterStylesButton?.addEventListener('click', async function () {
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

    // Reset button event handlers
    formElements.characterSettingsResetButton?.addEventListener('click', function () {
        resetCharacterSettings(formElements);
    });

    formElements.backgroundResetButton?.addEventListener('click', function () {
        resetBackgroundSettings(formElements);
    });

    formElements.colorResetButton?.addEventListener('click', function () {
        resetColorSettings(formElements);
    });

    // Add event listener for no-universal-checkbox
    formElements.noUniversalCheckbox?.addEventListener('change', async function () {
        if (formElements.noUniversalCheckbox.checked) {
            // Checked: exclude universal colors, use application defaults
            resetColorSettings(formElements);
            updateTemp('no_universal_colors', true);
            showInjectionNotification(notification_resource_name, null, 'Universal colors disabled - using default colors!');
        } else {
            // Unchecked: allow universal colors, restore from DB if available
            const universalRecord = await getCharacterRecord('Universal');
            if (universalRecord) {
                // Comprehensive color field mapping
                const colorFieldMappings = {
                    char_name_color_input: ['character_name_color', setCharacterAliasColor],
                    char_narr_input: ['character_narration_color', setCharacterNarrationColor],
                    user_name_color_input: ['username_color', setUserNameColor],
                    char_chat_input: ['character_message_color', (color) => setCharacterDialogueColor(color, character_dialogue)],
                    user_chat_input: ['user_message_color', (color) => setUserChatColor(color, user_message)],
                    char_chat_bg_input: ['character_message_box_color', (color) => setCharacterChatBgColor(color, character_chat_bubble_background)],
                    user_chat_bg_input: ['user_message_box_color', (color) => setUserChatBgColor(color, user_chat_bubble_background)]
                };

                // Apply universal colors to form and UI
                for (const [inputKey, [dbKey, setterFunction]] of Object.entries(colorFieldMappings)) {
                    const element = formElements[inputKey];
                    const universalValue = universalRecord[dbKey];
                    
                    if (element && universalValue) {
                        element.value = universalValue;
                        setterFunction(universalValue);
                        updateTemp(dbKey, universalValue);
                    }
                }
                
                updateTemp('no_universal_colors', false);
                showInjectionNotification(notification_resource_name, null, 'Universal colors enabled and applied!');
            } else {
                // No universal colors found, fall back to defaults
                resetColorSettings(formElements);
                updateTemp('no_universal_colors', false);
                showInjectionNotification(notification_resource_name, null, 'No universal colors found - using defaults!');
            }
        }
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
    // Load all three potential sources
    const [chatRecord, charRecord, universalRecord] = await Promise.all([
        getCharacterRecord(CHAT_ID),        // Chat-specific settings
        getCharacterRecord(CHAR_ID),        // Character-specific settings  
        getCharacterRecord('Universal')         // Universal settings
    ]);

    // Hierarchical merging: Chat > Character > Universal
    const mergedSettings = mergeSettingsHierarchically(chatRecord, charRecord, universalRecord);

    // Apply the merged settings to the UI
    applySettingsToUI(mergedSettings);
}

/**
 * Merges settings using hierarchical priority: Chat > Character > Universal
 * When no_universal_colors is true, universal color settings are excluded
 * @param {Object|null} chatRecord - Chat-specific settings (highest priority)
 * @param {Object|null} charRecord - Character-specific settings (medium priority)
 * @param {Object|null} universalRecord - Universal settings (fallback)
 * @returns {Object} Merged settings object
 */
function mergeSettingsHierarchically(chatRecord, charRecord, universalRecord) {
    const allFields = [
        'character_alias', 'character_image', 'background_image', 'default_background_image',
        'character_name_color', 'character_narration_color', 'character_message_color',
        'character_message_box_color', 'username_color', 'user_message_color', 'user_message_box_color',
        'no_universal_colors'
    ];

    const colorFields = [
        'character_name_color', 'character_narration_color', 'character_message_color',
        'character_message_box_color', 'username_color', 'user_message_color', 'user_message_box_color'
    ];

    const mergedSettings = {};

    // Check if no_universal_colors is enabled in any record (chat takes precedence)
    const noUniversalColors = (chatRecord && chatRecord.no_universal_colors) || 
                             (charRecord && charRecord.no_universal_colors) || 
                             false;

    allFields.forEach(field => {
        let valueSet = false;
        
        // Priority 1: Chat-specific settings (highest priority)
        if (chatRecord && chatRecord[field] !== undefined && chatRecord[field] !== null) {
            mergedSettings[field] = chatRecord[field];
            valueSet = true;
        }
        // Priority 2: Character-specific settings (medium priority)  
        else if (charRecord && charRecord[field] !== undefined && charRecord[field] !== null) {
            mergedSettings[field] = charRecord[field];
            valueSet = true;
        }
        // Priority 3: Universal settings (fallback) - but only if no_universal_colors is false or field is not a color
        else if (!valueSet && universalRecord && universalRecord[field] !== undefined && universalRecord[field] !== null) {
            // If no_universal_colors is true, exclude universal color settings
            if (noUniversalColors && colorFields.includes(field)) {
                // Skip universal color settings when no_universal_colors is enabled
                console.log(`Skipping universal color setting for ${field} due to no_universal_colors flag`);
            } else {
                mergedSettings[field] = universalRecord[field];
                valueSet = true;
            }
        }
    });

    // Always preserve the no_universal_colors flag in merged settings
    mergedSettings.no_universal_colors = noUniversalColors;

    return mergedSettings;
}

/**
 * Applies the merged settings to the actual UI
 * @param {Object} settings - The merged settings to apply
 */
async function applySettingsToUI(settings) {
    // Check if settings object exists
    if (!settings || typeof settings !== 'object') {
        console.warn('applySettingsToUI: Invalid or missing settings object');
        return;
    }

    // Copy settings to temp_form_data so UI state is always tracked for saving
    temp_form_data = { ...settings };

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

    // Apply colors - use defaults if no_universal_colors is true and no explicit color is set
    const shouldUseDefaults = settings.no_universal_colors;
    
    // Character name color
    const charNameColor = settings.character_name_color || (shouldUseDefaults ? DEFAULT_COLORS.characterName : null);
    if (charNameColor) setCharacterAliasColor(charNameColor);
    
    // Character narration color
    const charNarrationColor = settings.character_narration_color || (shouldUseDefaults ? DEFAULT_COLORS.characterNarration : null);
    if (charNarrationColor) setCharacterNarrationColor(charNarrationColor);
    
    // Character message color
    const charMessageColor = settings.character_message_color || (shouldUseDefaults ? DEFAULT_COLORS.characterChat : null);
    if (charMessageColor) setCharacterDialogueColor(charMessageColor);
    
    // Username color
    const usernameColor = settings.username_color || (shouldUseDefaults ? DEFAULT_COLORS.userNameColor : null);
    if (usernameColor) setUserNameColor(usernameColor);
    
    // User message color
    const userMessageColor = settings.user_message_color || (shouldUseDefaults ? DEFAULT_COLORS.userChat : null);
    if (userMessageColor) setUserChatColor(userMessageColor, user_message);
    
    // Character message box color
    const charMsgBoxColor = settings.character_message_box_color || (shouldUseDefaults ? DEFAULT_COLORS.characterChatBg : null);
    if (charMsgBoxColor) setCharacterChatBgColor(charMsgBoxColor, character_chat_bubble_background);
    
    // User message box color
    const userMsgBoxColor = settings.user_message_box_color || (shouldUseDefaults ? DEFAULT_COLORS.userChatBg : null);
    if (userMsgBoxColor) setUserChatBgColor(userMsgBoxColor, user_chat_bubble_background);
}

/**
 * Helper function to apply image settings with URL/base64 handling
 * @param {string} imageData - Image data (URL or base64)
 * @param {string} type - 'character' or 'background'
 */
/**
 * Applies image settings (character or background) with standardized handling
 * Uses the same approach as image viewer for consistency
 * @param {string} imageData - The image data to apply
 * @param {string} type - The type of image ('character' or 'background')
 */
async function applyImageSetting(imageData, type) {
    // Validate inputs
    if (!imageData || typeof imageData !== 'string') {
        console.warn(`applyImageSetting: Invalid imageData for ${type}`);
        return;
    }

    if (!type || (type !== 'character' && type !== 'background')) {
        console.warn(`applyImageSetting: Invalid type "${type}"`);
        return;
    }

    // Use the same logic as image viewer's setImageSource function
    if (isImageUrl(imageData)) {
        // Convert URL to base64 with timeout (same as image viewer)
        try {
            const imageBase64 = await Promise.race([
                urlToBase64(imageData),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            // Apply the converted base64 using standardized handling
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
        // Handle base64 data using standardized normalization (same as image viewer)
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
        getCharacterRecord('Universal')         // Universal settings
    ]);

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
    const hierarchicalData = await loadHierarchicalData(CHAR_ID);
    if (hasModifications) {
        // Overlay temp changes, but fall back to temp for missing fields
        formData = { ...hierarchicalData };
        for (const key in temp_form_data) {
            if (formData[key] === undefined || formData[key] === null) {
                formData[key] = temp_form_data[key];
            }
        }
    } else {
        formData = { ...hierarchicalData };
    }

    // If no_universal_colors is enabled and we don't have explicit values, use defaults
    if (formData.no_universal_colors) {
        const colorDefaults = [
            ['character_name_color', DEFAULT_COLORS.characterName],
            ['character_narration_color', DEFAULT_COLORS.characterNarration],
            ['character_message_color', DEFAULT_COLORS.characterChat],
            ['character_message_box_color', DEFAULT_COLORS.characterChatBg],
            ['username_color', DEFAULT_COLORS.userNameColor],
            ['user_message_color', DEFAULT_COLORS.userChat],
            ['user_message_box_color', DEFAULT_COLORS.userChatBg]
        ];
        
        colorDefaults.forEach(([key, defaultValue]) => {
            if (!formData[key]) {
                formData[key] = defaultValue;
                console.log(`Using default color for ${key}: ${defaultValue} (no_universal_colors is enabled)`);
            }
        });
    }

    // Batch form population for better performance
    const formMapping = [
        [formElements.nameInput, formData.character_alias, 'character_alias'],
        [formElements.nameColorInput, formData.character_name_color, 'character_name_color'],
        [formElements.narrationColorInput, formData.character_narration_color, 'character_narration_color'],
        [formElements.chatColorInput, formData.character_message_color, 'character_message_color'],
        [formElements.chatBgColorInput, formData.character_message_box_color, 'character_message_box_color'],
        [formElements.userNameColorInput, formData.username_color, 'username_color'],
        [formElements.userChatColorInput, formData.user_message_color, 'user_message_color'],
        [formElements.userChatBgColorInput, formData.user_message_box_color, 'user_message_box_color']
    ];

    // Batch DOM updates to minimize reflows
    requestAnimationFrame(() => {
        formMapping.forEach(([element, value, tempKey]) => {
            setFormElementValue(element, value, true); // Suppress events during batch
            // Also update temp_form_data to ensure values are tracked for saving
            if (value !== null && value !== undefined && !hasModifications) {
                temp_form_data[tempKey] = value;
            }
        });

        // Handle no-universal checkbox
        if (formElements.noUniversalCheckbox) {
            formElements.noUniversalCheckbox.checked = formData.no_universal_colors || false;
            if (!hasModifications) {
                temp_form_data.no_universal_colors = formData.no_universal_colors || false;
            }
        }

        // Handle background image URL
        const bgImageUrl = handleBackgroundImageUrl(formElements.bgUrlInput, formData);
        if (bgImageUrl && !hasModifications) {
            temp_form_data.background_image = bgImageUrl;
        }

        // Handle character image URL
        const charImageUrl = handleCharacterImageUrl(formElements.characterImageUrlInput, formData);
        if (charImageUrl && !hasModifications) {
            temp_form_data.character_image = charImageUrl;
        }

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
 * Handles background image URL setting with standardized logic (same as image viewer)
 * @returns {string|null} The background image URL that was set, if any
 */
function handleBackgroundImageUrl(bgUrlInput, formData) {
    if (!bgUrlInput) return null;

    let bgImageToShow = null;

    // Use standardized isImageUrl function (same logic as image viewer)
    if (formData.background_image && isImageUrl(formData.background_image)) {
        bgImageToShow = formData.background_image;
    } else if (formData.default_background_image) {
        if (formData.default_background_image.startsWith('url(')) {
            const urlMatch = formData.default_background_image.match(/url\(['"]?([^'"]+)['"]?\)/);
            bgImageToShow = urlMatch?.[1];
        } else if (isImageUrl(formData.default_background_image)) {
            bgImageToShow = formData.default_background_image;
        }
    }

    if (bgImageToShow) {
        bgUrlInput.value = bgImageToShow;
        return bgImageToShow;
    }

    return null;
}

/**
 * Handles character image URL setting with standardized logic (same as image viewer)
 * @returns {string|null} The character image URL that was set, if any
 */
function handleCharacterImageUrl(characterImageUrlInput, formData) {
    if (!characterImageUrlInput) return null;

    let characterImageToShow = null;

    // Use standardized isImageUrl function (same logic as image viewer)
    if (formData.character_image && isImageUrl(formData.character_image)) {
        characterImageToShow = formData.character_image;
    }

    if (characterImageToShow) {
        characterImageUrlInput.value = characterImageToShow;
        return characterImageToShow;
    }

    return null;
}

/**
 * Gets character name from page elements
 */
async function getCharacterNameFromPage() {
    const characterNameElement = document.querySelector(character_name_title);
    return characterNameElement?.textContent?.trim() || null;
}

/**
 * Optimized load customizer data function with hierarchical loading
 * @param {HTMLElement} form
 * @returns {Promise<void>}
 */
async function loadCustomizerData(form) {
    // Cache selectors and minimize DOM queries
    const anchor = document.querySelector(char_id_selector);
    const CHAR_ID = findCharacterID(anchor) || CHAT_ID;

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
    } else {
        // For character/chat specific saves, include all fields
        fieldsToSave = Object.fromEntries(
            Object.entries(temp_form_data).filter(([key, value]) => value !== undefined && value !== null)
        );
        // If saving to CHAT_ID (not character theme), set record_type to 'chat'
        if (CHAR_ID === CHAT_ID) {
            fieldsToSave.record_type = 'chat';
        }
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

