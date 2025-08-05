
// =========================
// STATE & CONSTANTS
// =========================
let default_background_image = null;
let temp_form_data = {};
let pickrInstances = {}; // Store Pickr instances

// =========================
// UTILITY & HELPER FUNCTIONS
// =========================

/**
 * Creates a Pickr instance for a color input element
 * @param {string} elementId - The ID of the element to attach Pickr to
 * @param {string} defaultColor - The default color value
 * @param {Function} onChange - Callback function when color changes
 * @returns {Object} Pickr instance
 */
function createPickrInstance(elementId, defaultColor, onChange) {
    const element = document.querySelector(`#${elementId}`);
    if (!element) {
        console.warn(`Element with ID ${elementId} not found`);
        return null;
    }

    const pickr = Pickr.create({
        el: element,
        theme: 'nano',
        default: defaultColor || '#ffffff',
        
        swatches: [
            'rgba(244, 67, 54, 1)',
            'rgba(233, 30, 99, 1)',
            'rgba(156, 39, 176, 1)',
            'rgba(103, 58, 183, 1)',
            'rgba(63, 81, 181, 1)',
            'rgba(33, 150, 243, 1)',
            'rgba(3, 169, 244, 1)',
            'rgba(0, 188, 212, 1)',
            'rgba(0, 150, 136, 1)',
            'rgba(76, 175, 80, 1)',
            'rgba(139, 195, 74, 1)',
            'rgba(205, 220, 57, 1)',
            'rgba(255, 235, 59, 1)',
            'rgba(255, 193, 7, 1)'
        ],

        components: {
            // Main components
            preview: true,
            opacity: true,
            hue: true,

            // Input / output Options
            interaction: {
                hex: true,
                rgba: true,
                hsla: false,
                hsva: false,
                cmyk: false,
                input: true,
                clear: false,
                save: true
            }
        }
    });

    // Set up event handlers
    pickr.on('change', (color, source, instance) => {
        const colorString = color.toHEXA().toString();
        if (onChange) {
            onChange(colorString);
        }
    });

    pickr.on('save', (color, instance) => {
        if (color) {
            const colorString = color.toHEXA().toString();
            if (onChange) {
                onChange(colorString);
            }
        }
        instance.hide();
    });

    pickr.on('swatchselect', (color, instance) => {
        if (color) {
            const colorString = color.toHEXA().toString();
            if (onChange) {
                onChange(colorString);
            }
        }
    });

    return pickr;
}

/**
 * Initializes all Pickr instances for color inputs
 * @param {HTMLElement} form - The form element containing color inputs
 */
function initializePickrInstances(form) {
    const colorInputConfigs = [
        {
            id: 'name-color-input',
            key: 'char_name_color_input',
            handler: (value) => {
                setCharacterAliasColor(value);
                temp_form_data.character_name_color = value;
            }
        },
        {
            id: 'character-narration-color-input',
            key: 'char_narr_input',
            handler: (value) => {
                setCharacterNarrationColor(value);
                temp_form_data.character_narration_color = value;
            }
        },
        {
            id: 'character-chat-color-input',
            key: 'char_chat_input',
            handler: (value) => {
                setCharacterDialogueColor(value, character_dialogue);
                temp_form_data.character_message_color = value;
            }
        },
        {
            id: 'user-chat-color-input',
            key: 'user_chat_input',
            handler: (value) => {
                setUserChatColor(value, user_message);
                temp_form_data.user_message_color = value;
            }
        },
        {
            id: 'character-chat-bg-color-input',
            key: 'char_chat_bg_input',
            handler: (value) => {
                setCharacterChatBgColor(value, character_chat_bubble_background);
                temp_form_data.character_message_box_color = value;
            }
        },
        {
            id: 'user-chat-bg-color-input',
            key: 'user_chat_bg_input',
            handler: (value) => {
                setUserChatBgColor(value, user_chat_bubble_background);
                temp_form_data.user_message_box_color = value;
            }
        },
        {
            id: 'user-name-color-input',
            key: 'user_name_color_input',
            handler: (value) => {
                setUserNameColor(value);
                temp_form_data.username_color = value;
            }
        }
    ];

    // Create Pickr instances
    colorInputConfigs.forEach(config => {
        const pickr = createPickrInstance(config.id, '#ffffff', config.handler);
        if (pickr) {
            pickrInstances[config.key] = pickr;
        }
    });
}

/**
 * Sets a Pickr instance color without triggering events
 * @param {string} key - The key of the Pickr instance
 * @param {string} color - The color to set
 */
function setPickrColor(key, color) {
    if (pickrInstances[key] && color) {
        try {
            // Set color silently without triggering events
            pickrInstances[key].setColor(color, false);
        } catch (error) {
            console.warn(`Failed to set Pickr color for ${key}:`, error);
        }
    }
}

/**
 * Destroys all Pickr instances (cleanup)
 */
function destroyPickrInstances() {
    Object.values(pickrInstances).forEach(pickr => {
        if (pickr && pickr.destroy) {
            pickr.destroy();
        }
    });
    pickrInstances = {};
}

/**
 * Helper function to set form element value
 * @param {HTMLElement} element - The form element
 * @param {*} value - The value to set
 * @param {boolean} suppressEvents - Whether to suppress events
 */
function setFormElementValue(element, value, suppressEvents = false) {
    if (!element || value === null || value === undefined) return;
    
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        element.value = value;
    }
}

// Reset character settings to default
function resetCharacterSettings(formElements, character_name_title, setCharacterAlias, setCharacterAliasColor, notification_resource_name, temp_form_data, character_image_container_resource_name, showInjectionNotification) {
    const originalCharacterName = document.querySelector(character_name_title)?.textContent?.trim() || '';
    if (formElements.char_name_input) {
        formElements.char_name_input.value = '';
        setCharacterAlias(originalCharacterName);
        delete temp_form_data.character_alias;
    }
    if (pickrInstances.char_name_color_input) {
        setPickrColor('char_name_color_input', '#ffffff');
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
    if (pickrInstances.char_name_color_input) {
        setPickrColor('char_name_color_input', DEFAULT_COLORS.characterName);
        setCharacterAliasColor(DEFAULT_COLORS.characterName);
        if (updateTempData) temp_form_data.character_name_color = DEFAULT_COLORS.characterName;
    }
    
    // Character narration color
    if (pickrInstances.char_narr_input) {
        setPickrColor('char_narr_input', DEFAULT_COLORS.characterNarration);
        setCharacterNarrationColor(DEFAULT_COLORS.characterNarration);
        if (updateTempData) temp_form_data.character_narration_color = DEFAULT_COLORS.characterNarration;
    }
    
    // User name color
    if (pickrInstances.user_name_color_input) {
        setPickrColor('user_name_color_input', DEFAULT_COLORS.userNameColor);
        setUserNameColor(DEFAULT_COLORS.userNameColor);
        if (updateTempData) temp_form_data.username_color = DEFAULT_COLORS.userNameColor;
    }
    
    // Character chat color
    if (pickrInstances.char_chat_input) {
        setPickrColor('char_chat_input', DEFAULT_COLORS.characterChat);
        setCharacterDialogueColor(DEFAULT_COLORS.characterChat, character_dialogue);
        if (updateTempData) temp_form_data.character_message_color = DEFAULT_COLORS.characterChat;
    }
    
    // User chat color
    if (pickrInstances.user_chat_input) {
        setPickrColor('user_chat_input', DEFAULT_COLORS.userChat);
        setUserChatColor(DEFAULT_COLORS.userChat, user_message);
        if (updateTempData) temp_form_data.user_message_color = DEFAULT_COLORS.userChat;
    }
    
    // Character chat background color
    if (pickrInstances.char_chat_bg_input) {
        setPickrColor('char_chat_bg_input', DEFAULT_COLORS.characterChatBg);
        setCharacterChatBgColor(DEFAULT_COLORS.characterChatBg, character_chat_bubble_background);
        if (updateTempData) temp_form_data.character_message_box_color = DEFAULT_COLORS.characterChatBg;
    }
    
    // User chat background color
    if (pickrInstances.user_chat_bg_input) {
        setPickrColor('user_chat_bg_input', DEFAULT_COLORS.userChatBg);
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
        // Clean up Pickr instances before closing
        destroyPickrInstances();
        
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
        // Check if the click is on a Pickr color picker element
        const isPickrElement = event.target.closest('.pcr-app, .pcr-button, .pcr-palette, .pcr-slider, .pcr-interaction, .pcr-picker');
        mouseDownOutside = !formBody.contains(event.target) && !isPickrElement;
    };
    const handleMouseUp = (event) => {
        // Check if the click is on a Pickr color picker element
        const isPickrElement = event.target.closest('.pcr-app, .pcr-button, .pcr-palette, .pcr-slider, .pcr-interaction, .pcr-picker');
        if (mouseDownOutside && !formBody.contains(event.target) && !isPickrElement) {
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

    // Initialize Pickr instances first
    initializePickrInstances(form);

    // Cache all form elements once with error handling
    const formElements = {};
    const elementSelectors = {
        char_name_input: '#name-input',
        char_image_url_input: '#character-image-url-input',
        char_image_file_input: '#character-image-file-input',
        bg_url_input: '#bg-url-input',
        bg_file_input: '#bg-file-input',
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

    // Optimized event handler mapping (removed color inputs since they're handled by Pickr)
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
                // Comprehensive color field mapping with Pickr instances
                const colorFieldMappings = {
                    char_name_color_input: ['character_name_color', setCharacterAliasColor],
                    char_narr_input: ['character_narration_color', setCharacterNarrationColor],
                    user_name_color_input: ['username_color', setUserNameColor],
                    char_chat_input: ['character_message_color', (color) => setCharacterDialogueColor(color, character_dialogue)],
                    user_chat_input: ['user_message_color', (color) => setUserChatColor(color, user_message)],
                    char_chat_bg_input: ['character_message_box_color', (color) => setCharacterChatBgColor(color, character_chat_bubble_background)],
                    user_chat_bg_input: ['user_message_box_color', (color) => setUserChatBgColor(color, user_chat_bubble_background)]
                };

                // Apply universal colors to Pickr instances and UI
                for (const [pickrKey, [dbKey, setterFunction]] of Object.entries(colorFieldMappings)) {
                    const universalValue = universalRecord[dbKey];
                    
                    if (universalValue) {
                        setPickrColor(pickrKey, universalValue);
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

    // Import/Export event handlers
    setupImportExportHandlers();
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
    // Single DOM query with better caching (only for non-color inputs)
    const formElements = {
        nameInput: form.querySelector('#name-input'),
        characterImageUrlInput: form.querySelector('#character-image-url-input'),
        bgUrlInput: form.querySelector('#bg-url-input'),
        noUniversalCheckbox: form.querySelector('#no-universal-checkbox')
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

    // Batch form population for better performance (non-color inputs)
    const formMapping = [
        [formElements.nameInput, formData.character_alias, 'character_alias']
    ];

    // Color input mapping for Pickr instances
    const colorMapping = [
        ['char_name_color_input', formData.character_name_color, 'character_name_color'],
        ['char_narr_input', formData.character_narration_color, 'character_narration_color'],
        ['char_chat_input', formData.character_message_color, 'character_message_color'],
        ['char_chat_bg_input', formData.character_message_box_color, 'character_message_box_color'],
        ['user_name_color_input', formData.username_color, 'username_color'],
        ['user_chat_input', formData.user_message_color, 'user_message_color'],
        ['user_chat_bg_input', formData.user_message_box_color, 'user_message_box_color']
    ];

    // Batch DOM updates to minimize reflows
    requestAnimationFrame(() => {
        // Handle regular form inputs
        formMapping.forEach(([element, value, tempKey]) => {
            setFormElementValue(element, value, true); // Suppress events during batch
            // Also update temp_form_data to ensure values are tracked for saving
            if (value !== null && value !== undefined && !hasModifications) {
                temp_form_data[tempKey] = value;
            }
        });

        // Handle Pickr color inputs
        colorMapping.forEach(([pickrKey, value, tempKey]) => {
            if (value) {
                setPickrColor(pickrKey, value);
                // Also update temp_form_data to ensure values are tracked for saving
                if (!hasModifications) {
                    temp_form_data[tempKey] = value;
                }
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

        // Fire events after all DOM updates (only for non-color inputs)
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

                // Load data from DB (this will populate Pickr instances as well)
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

/**
 * Sets up import/export event handlers
 * @returns {void}
 */
function setupImportExportHandlers() {
    /** @type {HTMLElement|null} */
    const exportJsonBtn = document.getElementById('export-json-btn');
    /** @type {HTMLElement|null} */
    const exportPngBtn = document.getElementById('export-png-btn');
    /** @type {HTMLElement|null} */
    const importFileInput = document.getElementById('import-file-input');
    /** @type {HTMLElement|null} */
    const importUrlInput = document.getElementById('import-url-input');
    /** @type {HTMLElement|null} */
    const importUrlBtn = document.getElementById('import-url-btn');
    /** @type {HTMLElement|null} */
    const clearExistingCheckbox = document.getElementById('clear-existing-data');

    // Export as JSON
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', async () => {
            try {
                showImportExportStatus('Exporting database...', 'info');
                const dbData = await exportDatabase();
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                const filename = `yodayo-chat-customizer-export-${timestamp}.json`;
                downloadBlob(new Blob([dbData], { type: 'application/json' }), filename);
                showImportExportStatus('Database exported successfully!', 'success');
                setTimeout(clearImportExportStatus, 3000);
            } catch (error) {
                console.error('Export failed:', error);
                showImportExportStatus('Export failed: ' + error.message, 'error');
            }
        });
    }

    // Export as PNG
    if (exportPngBtn) {
        exportPngBtn.addEventListener('click', async () => {
            try {
                showImportExportStatus('Exporting database to PNG...', 'info');
                await exportDatabaseToPNG();
                showImportExportStatus('Database exported to PNG successfully!', 'success');
                setTimeout(clearImportExportStatus, 3000);
            } catch (error) {
                console.error('PNG export failed:', error);
                showImportExportStatus('PNG export failed: ' + error.message, 'error');
            }
        });
    }

    // Import from file
    if (importFileInput) {
        importFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const clearExisting = clearExistingCheckbox ? clearExistingCheckbox.checked : false;
                showImportExportStatus('Importing database...', 'info');
                
                let result;
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    const jsonData = await file.text();
                    result = await importDatabase(jsonData, clearExisting);
                } else if (file.type === 'image/png' || file.name.endsWith('.png')) {
                    result = await importDatabaseFromPNG(file, clearExisting);
                } else {
                    throw new Error('Unsupported file type. Please use JSON or PNG files.');
                }

                let message = `Import successful! ${result.imported} records imported.`;
                if (result.errors.length > 0) {
                    message += ` ${result.errors.length} errors occurred.`;
                }
                showImportExportStatus(message, result.errors.length > 0 ? 'warning' : 'success');
                
                // Refresh the current UI to show imported data
                setTimeout(() => {
                    location.reload(); // Simple way to refresh all data
                }, 2000);
                
            } catch (error) {
                console.error('Import failed:', error);
                showImportExportStatus('Import failed: ' + error.message, 'error');
            }
        });
    }

    // Import from URL
    if (importUrlBtn && importUrlInput) {
        const importFromUrl = async () => {
            const url = importUrlInput.value.trim();
            if (!url) {
                showImportExportStatus('Please enter a valid URL', 'error');
                return;
            }

            try {
                const clearExisting = clearExistingCheckbox ? clearExistingCheckbox.checked : false;
                showImportExportStatus('Downloading and importing...', 'info');

                // Fetch the image
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
                }

                const blob = await response.blob();
                if (!blob.type.startsWith('image/')) {
                    throw new Error('URL does not point to an image file');
                }

                const result = await importDatabaseFromPNG(new File([blob], 'import.png', { type: blob.type }), clearExisting);
                
                let message = `Import successful! ${result.imported} records imported.`;
                if (result.errors.length > 0) {
                    message += ` ${result.errors.length} errors occurred.`;
                }
                showImportExportStatus(message, result.errors.length > 0 ? 'warning' : 'success');
                
                // Clear the URL input
                importUrlInput.value = '';
                
                // Refresh the current UI to show imported data
                setTimeout(() => {
                    location.reload(); // Simple way to refresh all data
                }, 2000);
                
            } catch (error) {
                console.error('URL import failed:', error);
                showImportExportStatus('Import failed: ' + error.message, 'error');
            }
        };

        importUrlBtn.addEventListener('click', importFromUrl);
        
        // Allow Enter key to trigger import
        importUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                importFromUrl();
            }
        });
    }
}

/**
 * Show import/export status message
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'} type
 */
function showImportExportStatus(message, type) {
    /** @type {HTMLElement|null} */
    const statusDiv = document.getElementById('import-status');
    /** @type {HTMLElement|null} */
    const messageDiv = document.getElementById('import-message');
    
    if (!statusDiv || !messageDiv) return;

    const colors = {
        info: 'bg-blue-100 border-blue-400 text-blue-700',
        success: 'bg-green-100 border-green-400 text-green-700',
        warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
        error: 'bg-red-100 border-red-400 text-red-700'
    };

    statusDiv.className = `rounded-md p-2 text-xs border-l-4 ${colors[type] || colors.info}`;
    messageDiv.textContent = message;
    statusDiv.classList.remove('hidden');
}

/**
 * Clear import/export status message
 */
function clearImportExportStatus() {
    /** @type {HTMLElement|null} */
    const statusDiv = document.getElementById('import-status');
    if (statusDiv) {
        statusDiv.classList.add('hidden');
    }
}

/**
 * Download a blob as a file (utility function for JSON export)
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- INITIALIZATION AND OBSERVERS ---

