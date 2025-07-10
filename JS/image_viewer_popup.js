// Cache for DOM elements and state
/** @typedef {Object} ImageViewerCacheType
 * @property {MutationObserver|null} observer
 * @property {HTMLElement|null} currentViewer
 * @property {HTMLElement|null} mainElement
 * @property {boolean} isInitialized
 */

/** @type {ImageViewerCacheType} */
const ImageViewerCache = {
    observer: null,
    currentViewer: null,
    mainElement: null,
    isInitialized: false
};

/**
 * Initialize the image viewer observer
 * @returns {void}
 */
function initializeImageViewerObserver() {
    if (ImageViewerCache.observer) {
        ImageViewerCache.observer.disconnect();
    }

    ImageViewerCache.observer = new MutationObserver(handleImageViewerAdded);
    ImageViewerCache.observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Cache main element on first access
 * @returns {HTMLElement|null}
 */
function getMainElement() {
    if (!ImageViewerCache.mainElement) {
        ImageViewerCache.mainElement = document.querySelector('body > main');
    }
    return ImageViewerCache.mainElement;
}

/**
 * Optimized close modal function
 * @returns {void}
 */
function closeImageViewerModal() {
    if (!ImageViewerCache.currentViewer) return;

    try {
        const main = getMainElement();
        if (main) {
            main.setAttribute('aria-hidden', 'false');
            main.removeAttribute('inert');
        }

        // Target the correct overlay based on the actual DOM structure
        // The overlay has id="image-viewer-overlay" and is a sibling to our currentViewer
        /** @type {HTMLElement|null} */
        const overlay = document.getElementById('image-viewer-overlay');
        /** @type {HTMLElement|null} */
        const dialogContainer = document.getElementById('headlessui-dialog-:r1f:') ||
            (ImageViewerCache.currentViewer && ImageViewerCache.currentViewer.closest('[role="dialog"]'));
        /** @type {HTMLElement|null} */
        const portalRoot = document.getElementById('headlessui-portal-root');

        // Remove the entire modal structure - prefer the most specific container first
        if (dialogContainer) {
            dialogContainer.remove();
        } else if (portalRoot) {
            portalRoot.remove();
        } else if (overlay) {
            // Fallback: remove overlay and try to find parent container
            overlay.remove();
            /** @type {HTMLElement|null} */
            const container = ImageViewerCache.currentViewer && ImageViewerCache.currentViewer.closest('.fixed');
            if (container) {
                container.remove();
            }
        }

        // Clean up event listeners
        document.removeEventListener('click', handleClickOutside);

        // Reset cache - this is crucial for reopening
        ImageViewerCache.currentViewer = null;
        ImageViewerCache.isInitialized = false; // Reset this flag so it can be initialized again

        // Restart observer
        initializeImageViewerObserver();

    } catch (error) {
        console.error('Error closing image viewer modal:', error);
    }
}

/**
 * Handle click outside modal
 * @param {Event} event
 * @returns {void}
 */
function handleClickOutside(event) {
    if (ImageViewerCache.currentViewer && !ImageViewerCache.currentViewer.contains(/** @type {Node} */ (event.target))) {
        closeImageViewerModal();
    }
}

/**
 * Initialize event handlers for image viewer
 * @param {HTMLElement} imageViewer
 * @returns {void}
 */
function initializeImageViewerCloseButtonEventHandler(imageViewer) {
    ImageViewerCache.currentViewer = imageViewer;

    /** @type {HTMLElement|null} */
    const closeButton = imageViewer.querySelector('#close-button');
    if (!closeButton) {
        console.error('Close button not found in image viewer');
        return;
    }

    // Use event delegation for better performance
    closeButton.addEventListener('click', closeImageViewerModal);

    // Add click outside handler with a small delay to avoid immediate closing
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 100);
}

/**
 * Function to handle when the image viewer is added
 * @param {MutationRecord[]} mutationsList
 * @param {MutationObserver} observer
 * @returns {void}
 */
function handleImageViewerAdded(mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            /** @type {HTMLElement|null} */
            const imageViewer = document.querySelector('#image-viewer-ui-popup');
            if (imageViewer && !ImageViewerCache.isInitialized) {
                console.log('Image Viewer found.');
                ImageViewerCache.isInitialized = true;

                // Initialize handlers and render cards
                initializeImageViewerCloseButtonEventHandler(imageViewer);
                renderAllCardsInDiv();

                // Disconnect observer
                observer.disconnect();
                break;
            }
        }
    }
}

// Start observing on script load
initializeImageViewerObserver();

/**
 * Loads all character records from the db and renders a card for each in the #cards div.
 * Each card uses the character's background, character image, and color settings from db.
 * @returns {Promise<void>}
 */
async function renderAllCardsInDiv() {
    /** @type {HTMLElement|null} */
    const cardContainer = document.getElementById('cards');
    if (!cardContainer) {
        console.error('No element with id #cards found.');
        return;
    }
    if (!window.db) await openDatabase();
    
    const tx = db.transaction('Characters', 'readonly');
    const store = tx.objectStore('Characters');
    const request = store.getAll();
    
    request.onsuccess = async function (event) {
        /** @type {CharacterRecord[]} */
        const records = event.target.result.filter(r => r.CHAR_ID !== 'Universal');
        cardContainer.innerHTML = '';
        
        for (const record of records) {
            /** @type {HTMLElement} */
            const cardElement = await renderHTMLFromFile(card_layout_resource_name);
            
            // Set background image
            /** @type {HTMLImageElement|null} */
            const bgImg = cardElement.querySelector('#card-bg-image');
            if (bgImg) {
                if (record.background_image) {
                    bgImg.src = record.background_image.startsWith('data:') ? record.background_image : `data:image/png;base64,${record.background_image}`;
                } else if (record.default_background_image) {
                    // Use default background image if custom background is not available (always https:// URL)
                    bgImg.src = record.default_background_image;
                }
            }
            
            // Set character image
            /** @type {HTMLImageElement|null} */
            const charImg = cardElement.querySelector('#card-character-image');
            if (charImg) {
                if (record.character_image) {
                    charImg.src = record.character_image.startsWith('data:') ? record.character_image : `data:image/png;base64,${record.character_image}`;
                } else {
                    // Don't render the image if character image is not available
                    charImg.style.display = 'none';
                }
            }
            
            // Set character name
            /** @type {HTMLElement|null} */
            const charName = cardElement.querySelector('#card-character-name');
            if (charName && record.character_alias) {
                charName.textContent = record.character_alias;
            }
            
            // Set color pickers
            /** @type {HTMLInputElement|null} */
            const colorCharName = cardElement.querySelector('#color-char-name');
            if (record.character_name_color && colorCharName) colorCharName.value = record.character_name_color;
            
            /** @type {HTMLInputElement|null} */
            const colorCharDialogues = cardElement.querySelector('#color-char-dialogues');
            if (record.character_message_color && colorCharDialogues) colorCharDialogues.value = record.character_message_color;
            
            /** @type {HTMLInputElement|null} */
            const colorCharNarration = cardElement.querySelector('#color-char-narration');
            if (record.character_narration_color && colorCharNarration) colorCharNarration.value = record.character_narration_color;
            
            /** @type {HTMLInputElement|null} */
            const colorCharBubbleBg = cardElement.querySelector('#color-char-bubble-bg');
            if (record.character_message_box_color && colorCharBubbleBg) colorCharBubbleBg.value = record.character_message_box_color;
            
            /** @type {HTMLInputElement|null} */
            const colorUserName = cardElement.querySelector('#color-user-name');
            if (record.username_color && colorUserName) colorUserName.value = record.username_color;
            
            /** @type {HTMLInputElement|null} */
            const colorUserDialogue = cardElement.querySelector('#color-user-dialogue');
            if (record.user_message_color && colorUserDialogue) colorUserDialogue.value = record.user_message_color;
            
            /** @type {HTMLInputElement|null} */
            const colorUserBubbleBg = cardElement.querySelector('#color-user-bubble-bg');
            if (record.user_message_box_color && colorUserBubbleBg) colorUserBubbleBg.value = record.user_message_box_color;
            
            cardContainer.appendChild(cardElement);
        }
    };
    
    request.onerror = function (e) {
        console.error('Failed to load character records:', e.target.error);
    };
}
