
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

        // Reset document styles that were set when opening the modal
        document.documentElement.style.overflow = '';
        document.documentElement.style.paddingRight = '';

        // Remove the modal by removing the portal root element
        /** @type {HTMLElement|null} */
        const portalRoot = document.getElementById('headlessui-portal-root');
        if (portalRoot) {
            portalRoot.remove();
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
    // Don't close if clicking on settings modal
    /** @type {HTMLElement|null} */
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
        return; // Settings modal is open, don't close main modal
    }
    
    if (ImageViewerCache.currentViewer && !ImageViewerCache.currentViewer.contains(/** @type {Node} */(event.target))) {
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

    // Initialize settings modal handlers
    initializeSettingsModal(imageViewer);

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

                // Inject custom CSS for card animations
                injectCardFlipCSS();

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
    
    // Show loading animation
    showLoadingAnimation(cardContainer);
    
    if (!window.db) await openDatabase();

    const tx = db.transaction('Characters', 'readonly');
    const store = tx.objectStore('Characters');
    const request = store.getAll();

    request.onsuccess = async function (event) {
        try {
            /** @type {CharacterRecord[]} */
            const records = event.target.result.filter(r => r.CHAR_ID !== 'Universal');
            
            // Create document fragment for batch DOM manipulation
            const fragment = document.createDocumentFragment();
            
            // Pre-load card template once
            const cardTemplate = await renderHTMLFromFile(card_layout_resource_name);
            
            // Process all cards in parallel
            const cardPromises = records.map(record => processCardData(record, cardTemplate.cloneNode(true)));
            const processedCards = await Promise.all(cardPromises);
            
            // Clear loading animation and add cards
            cardContainer.innerHTML = '';
            
            // Batch append all cards to fragment, then to container
            processedCards.forEach(cardElement => {
                if (cardElement) {
                    addCardFlipHandlers(cardElement);
                    fragment.appendChild(cardElement);
                }
            });
            
            cardContainer.appendChild(fragment);
        } catch (error) {
            console.error('Error loading cards:', error);
            showErrorMessage(cardContainer, 'Failed to load character cards');
        }
    };

    request.onerror = function (e) {
        console.error('Failed to load character records:', e.target.error);
        showErrorMessage(cardContainer, 'Database error occurred');
    };
}

/**
 * Shows a loading animation in the card container
 * @param {HTMLElement} container - The container to show loading in
 */
function showLoadingAnimation(container) {
    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">Loading character cards...</p>
        </div>
    `;
}

/**
 * Shows an error message in the card container
 * @param {HTMLElement} container - The container to show error in
 * @param {string} message - The error message to display
 */
function showErrorMessage(container, message) {
    container.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <p class="error-text">${message}</p>
            <button class="retry-button" onclick="renderAllCardsInDiv()">Retry</button>
        </div>
    `;
}

/**
 * Processes a single card's data and images
 * @param {CharacterRecord} record
 * @param {HTMLElement} cardElement
 * @returns {Promise<HTMLElement|null>}
 */
async function processCardData(record, cardElement) {
    try {
        // Set the card container ID to the character ID
        cardElement.id = record.CHAR_ID;

        // Cache DOM queries
        const elements = {
            bgImg: cardElement.querySelector('#card-bg-image'),
            charImg: cardElement.querySelector('#card-character-image'),
            charName: cardElement.querySelector('#card-character-name'),
            colorCharName: cardElement.querySelector('#color-char-name'),
            colorCharDialogues: cardElement.querySelector('#color-char-dialogues'),
            colorCharNarration: cardElement.querySelector('#color-char-narration'),
            colorCharBubbleBg: cardElement.querySelector('#color-char-bubble-bg'),
            colorUserName: cardElement.querySelector('#color-user-name'),
            colorUserDialogue: cardElement.querySelector('#color-user-dialogue'),
            colorUserBubbleBg: cardElement.querySelector('#color-user-bubble-bg'),
            cardTypeTag: cardElement.querySelector('#card-type-tag'),
            deleteButton: cardElement.querySelector('#card-delete-button'),
            sendButton: cardElement.querySelector('#card-send-button')
        };

        // Set card type tag based on record_type (manual CSS for color)
        if (elements.cardTypeTag) {
            if (record.record_type === 'chat') {
                elements.cardTypeTag.textContent = 'Chat';
                elements.cardTypeTag.style.backgroundColor = 'rgba(113, 251, 164, 0.6)'; // green-700 with opacity
                elements.cardTypeTag.style.borderColor = '#bbf7d0'; // green-300
            } else {
                elements.cardTypeTag.textContent = 'Char';
                elements.cardTypeTag.style.backgroundColor = 'rgba(64, 109, 233, 0.6)'; // blue-700 with opacity
                elements.cardTypeTag.style.borderColor = '#59a0f1ff'; // blue-300
            }
        }

        // Process images in parallel
        const imagePromises = [];
        if (elements.bgImg) {
            imagePromises.push(setCardBackgroundImage(elements.bgImg, record));
        }
        if (elements.charImg) {
            imagePromises.push(setCardCharacterImage(elements.charImg, record));
        }
        await Promise.all(imagePromises);

        // Set text content and colors (fast operations)
        if (elements.charName && record.character_alias) {
            // Only update the center span text, not the whole div
            const centerSpan = elements.charName.querySelector('#character-name-span');
            if (centerSpan) {
                centerSpan.textContent = record.character_alias;
            }
        }

        // Batch set color values
        const colorMappings = [
            [elements.colorCharName, record.character_name_color, '#ffffff'],
            [elements.colorCharDialogues, record.character_message_color, '#ffffff'],
            [elements.colorCharNarration, record.character_narration_color, '#b0d8fd'],
            [elements.colorCharBubbleBg, record.character_message_box_color, '#000000'],
            [elements.colorUserName, record.username_color, '#000000'],
            [elements.colorUserDialogue, record.user_message_color, '#000000'],
            [elements.colorUserBubbleBg, record.user_message_box_color, '#ffffff']
        ];
        colorMappings.forEach(([element, value, fallback]) => {
            if (element) element.value = value || fallback;
        });

        // Add event listeners for delete and send buttons
        if (elements.deleteButton) {
            elements.deleteButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                let typeLabel = (record.record_type === 'chat') ? 'chat' : 'character';
                const confirmDelete = window.confirm(`Are you sure you want to delete this ${typeLabel}? This action cannot be undone.`);
                if (!confirmDelete) return;
                try {
                    if (!window.db) await openDatabase();
                    const tx = db.transaction('Characters', 'readwrite');
                    const store = tx.objectStore('Characters');
                    store.delete(record.CHAR_ID);
                    tx.oncomplete = function () {
                        renderAllCardsInDiv();
                    };
                    tx.onerror = function (err) {
                        console.error('Error deleting character:', err);
                    };
                } catch (error) {
                    console.error('Error deleting character:', error);
                }
            });
        }

        if (elements.sendButton) {
            elements.sendButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const domain = window.location.origin;
                    let url;
                    if (record.record_type === 'chat') {
                        url = `${domain}/tavern/chat/${record.CHAR_ID}`;
                    } else {
                        url = `${domain}/tavern/characters/${record.CHAR_ID}`;
                    }
                    window.open(url, '_blank');
                } catch (error) {
                    console.error('Error opening chat/character:', error);
                }
            });
        }

        return cardElement;
    } catch (error) {
        console.error('Error processing card data:', error);
        return null;
    }
}

/**
 * Sets background image for a card element
 * @param {HTMLImageElement} bgImg
 * @param {CharacterRecord} record
 * @returns {Promise<void>}
 */
async function setCardBackgroundImage(bgImg, record) {
    if (record.background_image) {
        await setImageSource(bgImg, record.background_image);
    } else if (record.default_background_image) {
        let imageUrl = record.default_background_image;
        if (imageUrl.startsWith('url(')) {
            const urlMatch = imageUrl.match(/url\(['"]?([^'"]+)['"]?\)/);
            imageUrl = urlMatch ? urlMatch[1] : imageUrl;
        }
        await setImageSource(bgImg, imageUrl);
    }
}

/**
 * Sets character image for a card element
 * @param {HTMLImageElement} charImg
 * @param {CharacterRecord} record
 * @returns {Promise<void>}
 */
async function setCardCharacterImage(charImg, record) {
    if (record.character_image) {
        await setImageSource(charImg, record.character_image);
    } else {
        charImg.style.display = 'none';
    }
}

/**
 * Optimized image source setting with standardized data handling
 * @param {HTMLImageElement} imgElement
 * @param {string} imageData
 * @returns {Promise<void>}
 */
async function setImageSource(imgElement, imageData) {
    if (isImageUrl(imageData)) {
        // Convert URL to base64 with timeout
        try {
            const imageBase64 = await Promise.race([
                urlToBase64(imageData),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            imgElement.src = normalizeImageData(imageBase64);
        } catch (error) {
            // Fallback: set URL directly
            imgElement.src = imageData;
        }
    } else {
        // Use standardized image data handling for base64/data URLs
        imgElement.src = normalizeImageData(imageData);
    }
}

/**
 * Add flip animation event handlers to a card
 * @param {HTMLElement} cardElement
 * @returns {void}
 */
function addCardFlipHandlers(cardElement) {
    /** @type {HTMLElement|null} */
    const cardInner = cardElement.querySelector('.card-inner');
    /** @type {HTMLElement|null} */
    const cardFront = cardElement.querySelector('.card-front');
    /** @type {HTMLElement|null} */
    const backButton = cardElement.querySelector('#card-back-button');

    if (!cardInner || !cardFront || !backButton) {
        console.error('Required card elements not found for flip animation');
        return;
    }

    // Click handler for flipping to back (color pickers)
    cardFront.addEventListener('click', () => {
        cardInner.style.transform = 'rotateY(180deg)';
    });

    // Click handler for flipping back to front (character display)
    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        cardInner.style.transform = 'rotateY(0deg)';
    });
}

/**
 * Inject custom CSS for 3D card flip animations
 * @returns {void}
 */
function injectCardFlipCSS() {
    const styleId = 'card-flip-styles';
    
    // Don't inject if already exists
    if (document.getElementById(styleId)) {
        return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .card-container {
            perspective: 1000px;
        }
        
        .card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            transition: transform 0.7s ease-in-out;
        }
        
        .card-front, .card-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            -moz-backface-visibility: hidden;
        }
        #card-character-image {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            object-position: bottom;
            border-radius: 0.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 10;
            pointer-events: none;
        }
        
        .card-back {
            transform: rotateY(180deg);
        }
        
        .card-front:hover {
            transform: scale(1.02);
            transition: transform 0.3s ease-in-out;
        }
        
        .card-front:active {
            transform: scale(0.98);
            transition: transform 0.1s ease-in-out;
        }
        
        /* Ensure the card has a fixed aspect ratio */
        .card-container {
            aspect-ratio: 3/4;
            max-width: 320px;
            margin: 0 auto;
        }
        
        /* Loading Animation Styles */
        .loading-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #141820;
            z-index: 1000;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #141820;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: #666;
            font-size: 1rem;
            margin: 0;
            text-align: center;
        }
        
        /* Error Message Styles */
        .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            min-height: 200px;
            text-align: center;
        }
        
        .error-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        
        .error-text {
            color: #e74c3c;
            font-size: 1rem;
            margin: 0 0 1rem 0;
        }
        
        .retry-button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.3s ease;
        }
        
        .retry-button:hover {
            background-color: #2980b9;
        }
        
        .retry-button:active {
            transform: scale(0.98);
        }
    `;
    
    document.head.appendChild(style);
}

// Inject CSS for card flip animations
injectCardFlipCSS();

/**
 * Initialize settings modal event handlers
 * @param {HTMLElement} imageViewer
 * @returns {void}
 */
function initializeSettingsModal(imageViewer) {
    /** @type {HTMLElement|null} */
    const settingsButton = imageViewer.querySelector('#settings-button');
    /** @type {HTMLElement|null} */
    const settingsModal = imageViewer.querySelector('#settings-modal');
    /** @type {HTMLElement|null} */
    const settingsModalClose = imageViewer.querySelector('#settings-modal-close');
    /** @type {HTMLElement|null} */
    const exportJsonBtn = imageViewer.querySelector('#export-json-btn');
    /** @type {HTMLElement|null} */
    const exportPngBtn = imageViewer.querySelector('#export-png-btn');
    /** @type {HTMLElement|null} */
    const importFileInput = imageViewer.querySelector('#import-file-input');
    /** @type {HTMLElement|null} */
    const importUrlInput = imageViewer.querySelector('#import-url-input');
    /** @type {HTMLElement|null} */
    const importUrlBtn = imageViewer.querySelector('#import-url-btn');
    /** @type {HTMLElement|null} */
    const clearExistingCheckbox = imageViewer.querySelector('#clear-existing-data');

    if (!settingsButton || !settingsModal) {
        console.error('Settings modal elements not found');
        return;
    }

    // Open settings modal
    settingsButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        settingsModal.classList.remove('hidden');
    });

    // Close settings modal
    const closeModal = () => {
        settingsModal.classList.add('hidden');
        clearImportStatus();
    };

    if (settingsModalClose) {
        settingsModalClose.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeModal();
        }
    });

    // Export as JSON
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', async () => {
            try {
                showImportStatus('Exporting database...', 'info');
                const dbData = await exportDatabase();
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                const filename = `yodayo-chat-customizer-export-${timestamp}.json`;
                downloadBlob(new Blob([dbData], { type: 'application/json' }), filename);
                showImportStatus('Database exported successfully!', 'success');
                setTimeout(clearImportStatus, 3000);
            } catch (error) {
                console.error('Export failed:', error);
                showImportStatus('Export failed: ' + error.message, 'error');
            }
        });
    }

    // Export as PNG
    if (exportPngBtn) {
        exportPngBtn.addEventListener('click', async () => {
            try {
                showImportStatus('Exporting database to PNG...', 'info');
                await exportDatabaseToPNG();
                showImportStatus('Database exported to PNG successfully!', 'success');
                setTimeout(clearImportStatus, 3000);
            } catch (error) {
                console.error('PNG export failed:', error);
                showImportStatus('PNG export failed: ' + error.message, 'error');
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
                showImportStatus('Importing database...', 'info');
                
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
                showImportStatus(message, result.errors.length > 0 ? 'warning' : 'success');
                
                // Refresh the cards display
                setTimeout(() => {
                    renderAllCardsInDiv();
                    clearImportStatus();
                }, 2000);
                
            } catch (error) {
                console.error('Import failed:', error);
                showImportStatus('Import failed: ' + error.message, 'error');
            }
        });
    }

    // Import from URL
    if (importUrlBtn && importUrlInput) {
        const importFromUrl = async () => {
            const url = importUrlInput.value.trim();
            if (!url) {
                showImportStatus('Please enter a valid URL', 'error');
                return;
            }

            try {
                const clearExisting = clearExistingCheckbox ? clearExistingCheckbox.checked : false;
                showImportStatus('Downloading and importing...', 'info');

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
                showImportStatus(message, result.errors.length > 0 ? 'warning' : 'success');
                
                // Clear the URL input
                importUrlInput.value = '';
                
                // Refresh the cards display
                setTimeout(() => {
                    renderAllCardsInDiv();
                    clearImportStatus();
                }, 2000);
                
            } catch (error) {
                console.error('URL import failed:', error);
                showImportStatus('Import failed: ' + error.message, 'error');
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
function showImportStatus(message, type) {
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

    statusDiv.className = `rounded-md p-3 text-sm border-l-4 ${colors[type] || colors.info}`;
    messageDiv.textContent = message;
    statusDiv.classList.remove('hidden');
}

/**
 * Clear import/export status message
 */
function clearImportStatus() {
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
