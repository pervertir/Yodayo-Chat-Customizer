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

        const overlay = ImageViewerCache.currentViewer.closest('.fixed');
        if (overlay) {
            overlay.remove();
        }

        // Clean up event listeners
        document.removeEventListener('click', handleClickOutside);
        
        // Reset cache
        ImageViewerCache.currentViewer = null;
        
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

// Cache for card rendering
const CardRenderCache = {
    cardContainer: null,
    cardTemplate: null
};

// Helper function to set image source with fallback
function setImageSource(imgElement, imageData) {
    if (!imgElement || !imageData) return;
    
    try {
        imgElement.src = imageData.startsWith('data:') 
            ? imageData 
            : `data:image/png;base64,${imageData}`;
    } catch (error) {
        console.error('Error setting image source:', error);
    }
}

// Helper function to set color picker value
function setColorValue(element, color) {
    if (element && color) {
        element.value = color;
    }
}

// Helper function to populate a single card with character data
function populateCardWithCharacterData(cardElement, record) {
    try {
        // Set background image
        setImageSource(cardElement.querySelector('#card-bg-image'), record.background_image);
        
        // Set character image
        setImageSource(cardElement.querySelector('#card-character-image'), record.character_image);
        
        // Set character name
        const charName = cardElement.querySelector('#card-character-name');
        if (charName && record.character_alias) {
            charName.textContent = record.character_alias;
        }
        
        // Set color pickers using batch approach
        const colorMappings = [
            ['#color-char-name', record.character_name_color],
            ['#color-char-dialogues', record.character_message_color],
            ['#color-char-narration', record.character_narration_color],
            ['#color-char-bubble-bg', record.character_message_box_color],
            ['#color-user-name', record.username_color],
            ['#color-user-dialogue', record.user_message_color],
            ['#color-user-bubble-bg', record.user_message_box_color]
        ];
        
        colorMappings.forEach(([selector, color]) => {
            setColorValue(cardElement.querySelector(selector), color);
        });
        
    } catch (error) {
        console.error('Error populating card with character data:', error);
    }
}

// Get or cache card container
function getCardContainer() {
    if (!CardRenderCache.cardContainer) {
        CardRenderCache.cardContainer = document.getElementById('cards');
    }
    return CardRenderCache.cardContainer;
}

/**
 * Loads all character records from the db and renders a card for each in the #cards div.
 * Each card uses the character's background, character image, and color settings from db.
 * Optimized for performance with caching and batch operations.
 */
async function renderAllCardsInDiv() {
    const cardContainer = getCardContainer();
    if (!cardContainer) {
        console.error('No element with id #cards found.');
        return;
    }

    try {
        // Ensure database is open
        if (!window.db) {
            await openDatabase();
        }

        // Get all character records
        const records = await new Promise((resolve, reject) => {
            const tx = db.transaction('Characters', 'readonly');
            const store = tx.objectStore('Characters');
            const request = store.getAll();
            
            request.onsuccess = (event) => {
                const allRecords = event.target.result.filter(r => r.CHAR_ID !== 'Universal');
                resolve(allRecords);
            };
            
            request.onerror = (event) => {
                reject(new Error('Failed to load character records: ' + event.target.error));
            };
        });

        // Clear container once
        cardContainer.innerHTML = '';

        // Create document fragment for batch DOM insertion
        const fragment = document.createDocumentFragment();

        // Render all cards
        for (const record of records) {
            try {
                const cardElement = await renderHTMLFromFile(card_layout_resource_name);
                populateCardWithCharacterData(cardElement, record);
                fragment.appendChild(cardElement);
            } catch (error) {
                console.error('Error rendering card for character:', record.character_alias || record.CHAR_ID, error);
            }
        }

        // Single DOM operation to append all cards
        cardContainer.appendChild(fragment);

    } catch (error) {
        console.error('Failed to render cards:', error);
        // Show user-friendly error message
        const cardContainer = getCardContainer();
        if (cardContainer) {
            cardContainer.innerHTML = '<div class="text-red-500 p-4">Failed to load character cards. Please try refreshing.</div>';
        }
    }
}

/**
 * Loads the card_layout.html template and renders it inside the div with id #cards.
 * Uses renderHTMLFromFile from utils.js.
 * Optimized with error handling and caching.
 */
async function renderCardLayoutInDiv() {
    const cardContainer = getCardContainer();
    if (!cardContainer) {
        console.error('No element with id #cards found.');
        return;
    }

    try {
        const cardElement = await renderHTMLFromFile(card_layout_resource_name);
        
        // Clear and setup container
        cardContainer.innerHTML = '';
        cardContainer.className = 'flex flex-col items-center justify-center gap-4 min-h-[80vh] min-w-[80vw] w-full h-[80vh]';
        cardContainer.appendChild(cardElement);
        
    } catch (error) {
        console.error('Failed to render card layout:', error);
        cardContainer.innerHTML = '<div class="text-red-500 p-4">Failed to load card layout. Please try refreshing.</div>';
    }
}

