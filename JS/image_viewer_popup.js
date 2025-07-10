// Cache for DOM elements and state
const ImageViewerCache = {
    observer: null,
    currentViewer: null,
    mainElement: null,
    isInitialized: false
};

// Initialize the image viewer observer
function initializeImageViewerObserver() {
    if (ImageViewerCache.observer) {
        ImageViewerCache.observer.disconnect();
    }

    ImageViewerCache.observer = new MutationObserver(handleImageViewerAdded);
    ImageViewerCache.observer.observe(document.body, { childList: true, subtree: true });
}

// Cache main element on first access
function getMainElement() {
    if (!ImageViewerCache.mainElement) {
        ImageViewerCache.mainElement = document.querySelector('body > main');
    }
    return ImageViewerCache.mainElement;
}

// Optimized close modal function
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
        const overlay = document.getElementById('image-viewer-overlay');
        const dialogContainer = document.getElementById('headlessui-dialog-:r1f:') ||
            ImageViewerCache.currentViewer.closest('[role="dialog"]');
        const portalRoot = document.getElementById('headlessui-portal-root');

        // Remove the entire modal structure - prefer the most specific container first
        if (dialogContainer) {
            dialogContainer.remove();
        } else if (portalRoot) {
            portalRoot.remove();
        } else if (overlay) {
            // Fallback: remove overlay and try to find parent container
            overlay.remove();
            const container = ImageViewerCache.currentViewer.closest('.fixed');
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

// Handle click outside modal
function handleClickOutside(event) {
    if (ImageViewerCache.currentViewer && !ImageViewerCache.currentViewer.contains(event.target)) {
        closeImageViewerModal();
    }
}

// Initialize event handlers for image viewer
function initializeImageViewerCloseButtonEventHandler(imageViewer) {
    ImageViewerCache.currentViewer = imageViewer;

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

// Function to handle when the image viewer is added
function handleImageViewerAdded(mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
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
 * Loads all character records from the db and renders a card for each in the #card div.
 * Each card uses the character's background, character image, and color settings from db.
 */
async function renderAllCardsInDiv() {
    const cardContainer = document.getElementById('cards');
    if (!cardContainer) {
        console.error('No element with id #card found.');
        return;
    }
    if (!window.db) await openDatabase();
    const tx = db.transaction('Characters', 'readonly');
    const store = tx.objectStore('Characters');
    const request = store.getAll();
    request.onsuccess = async function (event) {
        const records = event.target.result.filter(r => r.CHAR_ID !== 'Universal');
        cardContainer.innerHTML = '';
        for (const record of records) {
            const cardElement = await renderHTMLFromFile(card_layout_resource_name);
            // Set background image
            const bgImg = cardElement.querySelector('#card-bg-image');
            if (bgImg && record.background_image) {
                bgImg.src = record.background_image.startsWith('data:') ? record.background_image : `data:image/png;base64,${record.background_image}`;
            }
            // Set character image
            const charImg = cardElement.querySelector('#card-character-image');
            if (charImg && record.character_image) {
                charImg.src = record.character_image.startsWith('data:') ? record.character_image : `data:image/png;base64,${record.character_image}`;
            }
            // Set character name
            const charName = cardElement.querySelector('#card-character-name');
            if (charName && record.character_alias) {
                charName.textContent = record.character_alias;
            }
            // Set color pickers
            if (record.character_name_color) cardElement.querySelector('#color-char-name').value = record.character_name_color;
            if (record.character_message_color) cardElement.querySelector('#color-char-dialogues').value = record.character_message_color;
            if (record.character_narration_color) cardElement.querySelector('#color-char-narration').value = record.character_narration_color;
            if (record.character_message_box_color) cardElement.querySelector('#color-char-bubble-bg').value = record.character_message_box_color;
            if (record.username_color) cardElement.querySelector('#color-user-name').value = record.username_color;
            if (record.user_message_color) cardElement.querySelector('#color-user-dialogue').value = record.user_message_color;
            if (record.user_message_box_color) cardElement.querySelector('#color-user-bubble-bg').value = record.user_message_box_color;
            cardContainer.appendChild(cardElement);
        }
    };
    request.onerror = function (e) {
        console.error('Failed to load character records:', e.target.error);
    };
}
