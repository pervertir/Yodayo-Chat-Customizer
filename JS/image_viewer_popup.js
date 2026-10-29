
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
 * State for card display (sorting, filtering)
 * @typedef {Object} CardDisplayStateType
 * @property {'date_desc'|'date_asc'|'name_asc'|'name_desc'} sortBy
 * @property {string} searchTerm
 */

/** @type {CardDisplayStateType} */
const CardDisplayState = {
    sortBy: 'date_desc',
    searchTerm: ''
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
                createSearchSortToolbar();
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
 * Creates and injects the sort/search toolbar
 * @returns {void}
 */
function createSearchSortToolbar() {
    /** @type {HTMLElement|null} */
    const imageViewer = document.querySelector('#image-viewer-ui-popup');
    if (!imageViewer) return;

    // Find the header div and insert toolbar after it
    const headerDiv = imageViewer.querySelector('.relative.p-2.bg-secondaryBg');
    if (!headerDiv) return;

    // Check if toolbar already exists
    if (imageViewer.querySelector('#sort-search-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'sort-search-toolbar';
    toolbar.className = 'flex gap-4 p-4 bg-secondaryBg border-b border-[#22242b] items-center flex-wrap';
    toolbar.innerHTML = `
        <div class="flex gap-2 items-center flex-1">
            <label for="search-input" class="text-white text-sm whitespace-nowrap">Search:</label>
            <input
                type="text"
                id="search-input"
                placeholder="Search by name..."
                class="px-3 py-2 rounded bg-primaryBg text-white border border-[#22242b] text-sm flex-1 min-w-[200px]"
                value="${CardDisplayState.searchTerm}"
            />
        </div>
        <div class="flex gap-2 items-center">
            <label for="sort-select" class="text-white text-sm whitespace-nowrap">Sort by:</label>
            <select
                id="sort-select"
                class="px-3 py-2 rounded bg-primaryBg text-white border border-[#22242b] text-sm"
            >
                <option value="date_desc">Date (Latest First)</option>
                <option value="date_asc">Date (Oldest First)</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
            </select>
        </div>
    `;

    // Insert toolbar after header
    headerDiv.parentNode.insertBefore(toolbar, headerDiv.nextSibling);

    // Add event listeners
    const searchInput = toolbar.querySelector('#search-input');
    const sortSelect = toolbar.querySelector('#sort-select');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            CardDisplayState.searchTerm = e.target.value;
            renderAllCardsInDiv();
        });
    }

    if (sortSelect) {
        sortSelect.value = CardDisplayState.sortBy;
        sortSelect.addEventListener('change', (e) => {
            CardDisplayState.sortBy = e.target.value;
            renderAllCardsInDiv();
        });
    }
}

/**
 * Filters records by search term
 * @param {CharacterRecord[]} records
 * @returns {CharacterRecord[]}
 */
function filterRecordsBySearch(records) {
    if (!CardDisplayState.searchTerm.trim()) {
        return records;
    }
    const searchTerm = CardDisplayState.searchTerm.toLowerCase();
    return records.filter(record => {
        const info = cardSiteInfoNames.get(record.CHAR_ID) || '';
        return [record.chat_name, record.character_alias, record.character_name, info,
            ...Object.keys(record).filter(k => k.startsWith('character_alias@')).map(k => record[k])]
            .some(name => typeof name === 'string' && name.toLowerCase().includes(searchTerm));
    });
}

/**
 * Converts timestamp (ISO string or number) to milliseconds
 * @param {string|number|null|undefined} timestamp
 * @returns {number}
 */
function getTimestampMs(timestamp) {
    if (!timestamp) return 0;
    
    // If it's already a number, return it
    if (typeof timestamp === 'number') return timestamp;
    
    // If it's an ISO string, parse it to milliseconds
    if (typeof timestamp === 'string') {
        const ms = new Date(timestamp).getTime();
        return isNaN(ms) ? 0 : ms;
    }
    
    return 0;
}

/**
 * Sorts records based on current sort setting
 * @param {CharacterRecord[]} records
 * @returns {CharacterRecord[]}
 */
function sortRecords(records) {
    console.log('sortRecords called with', records.length, 'records');
    console.log('Current sort mode:', CardDisplayState.sortBy);
    console.log('Records before sort:', records.map(r => ({
        name: r.character_alias || r.character_name,
        timestamp: r.timestamp,
        timestampMs: getTimestampMs(r.timestamp)
    })));
    
    const sorted = [...records]; // Create a copy to avoid mutating original
    
    switch (CardDisplayState.sortBy) {
        case 'date_desc':
            // Latest first (descending)
            sorted.sort((a, b) => {
                const timeA = getTimestampMs(a.timestamp);
                const timeB = getTimestampMs(b.timestamp);
                const result = timeB - timeA;
                console.log('Comparing', a.character_alias || a.character_name, 'vs', b.character_alias || b.character_name, ':', timeB - timeA);
                return result;
            });
            break;
        case 'date_asc':
            // Oldest first (ascending)
            sorted.sort((a, b) => {
                const timeA = getTimestampMs(a.timestamp);
                const timeB = getTimestampMs(b.timestamp);
                return timeA - timeB;
            });
            break;
        case 'name_asc':
            // A-Z
            sorted.sort((a, b) => {
                const nameA = getCardSortName(a);
                const nameB = getCardSortName(b);
                return nameA.localeCompare(nameB);
            });
            break;
        case 'name_desc':
            // Z-A
            sorted.sort((a, b) => {
                const nameA = getCardSortName(a);
                const nameB = getCardSortName(b);
                return nameB.localeCompare(nameA);
            });
            break;
        default:
            // Default to date descending
            sorted.sort((a, b) => {
                const timeA = getTimestampMs(a.timestamp);
                const timeB = getTimestampMs(b.timestamp);
                return timeB - timeA;
            });
    }
    
    console.log('Records after sort:', sorted.map(r => ({
        name: r.character_alias || r.character_name,
        timestamp: r.timestamp,
        timestampMs: getTimestampMs(r.timestamp)
    })));
    
    return sorted;
}

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
    
    if (!db) await openDatabase();

    const tx = db.transaction('Characters', 'readonly');
    const store = tx.objectStore('Characters');
    const request = store.getAll();

    request.onsuccess = async function (event) {
        try {
            await resolveRecordImages(event.target.result);
            /** @type {CharacterRecord[]} */
            let records = await mergeNewChatLeftovers(event.target.result.filter(r => r.CHAR_ID !== 'Universal'));
            console.log('Raw records from DB:', records.length);
            console.log('First record full details:', records[0]);
            console.log('All records timestamps:', records.map(r => ({
                charId: r.CHAR_ID,
                name: r.character_alias || r.character_name,
                timestamp: r.timestamp,
                allFields: Object.keys(r)
            })));
            
            // Apply search filter
            records = filterRecordsBySearch(records);
            console.log('Records after search filter:', records.length);
            
            // Apply sorting
            records = sortRecords(records);
            console.log('Records after sorting:', records.length);
            
            // Create document fragment for batch DOM manipulation
            const fragment = document.createDocumentFragment();
            
            // Pre-load card template once
            const cardTemplate = await renderHTMLFromFile(card_layout_resource_name);
            
            // Chat cards fall back to their character's saved theme, as the chat itself does
            const recordsById = new Map(records.map(r => [r.CHAR_ID, r]));

            // Process all cards in parallel
            const cardPromises = records.map(record => processCardData(record, cardTemplate.cloneNode(true), recordsById));
            const processedCards = await Promise.all(cardPromises);
            
            // Clear loading animation and add cards
            cardContainer.innerHTML = '';
            
            // Show message if no results found
            if (processedCards.length === 0) {
                cardContainer.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">No cards found matching your search.</div>';
                return;
            }
            
            // Batch append all cards to fragment, then to container
            processedCards.forEach(cardElement => {
                if (cardElement) {
                    addCardFlipHandlers(cardElement);
                    fragment.appendChild(cardElement);
                }
            });
            
            cardContainer.appendChild(fragment);
            observeCardImages(cardContainer);
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
 * Versions before 1.13.1 set up a new chat by saving the cut-out on the character and the random
 * background on the chat, which showed as two cards. Such chat records (only a background, saved
 * within a minute of the character's cut-out) are moved onto the character, leaving one card.
 * @param {CharacterRecord[]} records
 * @returns {Promise<CharacterRecord[]>} the records left
 */
async function mergeNewChatLeftovers(records) {
    const byId = new Map(records.map(r => [r.CHAR_ID, r]));
    const leftovers = records.filter(r => r.record_type === 'chat' && r.background_image &&
        Object.keys(r).every(key => ['CHAR_ID', 'background_image', 'record_type', 'timestamp'].includes(key)));
    const merged = new Set();
    await Promise.all(leftovers.map(async chat => {
        const info = await getCardSiteInfo(chat);
        if (!info || info.characters.length !== 1) return;
        const character = byId.get(info.characters[0].uuid);
        if (!character?.character_image || character.background_image) return;
        const chatTime = getTimestampMs(chat.timestamp), characterTime = getTimestampMs(character.timestamp);
        if (!chatTime || !characterTime || Math.abs(chatTime - characterTime) > 60000) return;
        try {
            await saveCharacterFieldsBatch(character.CHAR_ID, { background_image: chat.background_image, record_type: 'character' });
            await deleteCharacterRecord(chat.CHAR_ID);
            character.background_image = chat.background_image;
            merged.add(chat.CHAR_ID);
        } catch (e) {
            console.error(`Could not merge chat ${chat.CHAR_ID} into its character:`, e);
        }
    }));
    return merged.size ? records.filter(r => !merged.has(r.CHAR_ID)) : records;
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
 * What the site knows about a card's chat or character: its name and the characters in it with
 * their full-body photo and background. Records don't store this, so it is looked up (once per page).
 * Chats need the user to be logged in; character pages are public.
 * @typedef {{name: string, characters: GroupCharacter[]}} CardSiteInfo
 * @type {Map<string, Promise<CardSiteInfo|null>>}
 */
const cardSiteInfoCache = new Map();
/** @type {Map<string, string>} site names of cards looked up so far, for search and sorting */
const cardSiteInfoNames = new Map();

/**
 * Name to sort a record by.
 * @param {CharacterRecord} record
 * @returns {string}
 */
function getCardSortName(record) {
    return (record.chat_name || record.character_alias || record.character_name || cardSiteInfoNames.get(record.CHAR_ID) || '').toLowerCase();
}

/**
 * @param {CharacterRecord} record
 * @returns {Promise<CardSiteInfo|null>}
 */
function getCardSiteInfo(record) {
    if (!cardSiteInfoCache.has(record.CHAR_ID)) {
        cardSiteInfoCache.set(record.CHAR_ID, (async () => {
            try {
                if (record.record_type === 'chat') {
                    const characters = await fetchChatCharacters(record.CHAR_ID);
                    if (!characters.length) return null;
                    return { name: characters.map(c => c.nickname).join(' & '), characters };
                }
                const url = `https://api.${location.hostname.replace(/^www\./, '')}/v1/characters/${record.CHAR_ID}`;
                // Private characters need the user's cookies, which the page's own fetch sends
                let response;
                try {
                    response = await fetch(url, { credentials: 'include' });
                } catch (e) { /* blocked: go through the userscript manager */ }
                if (response && !response.ok) throw new Error(`HTTP ${response.status}`);
                const c = response ? await response.json() : await bgRequest(url, 'json');
                const character = {
                    uuid: c.uuid, name: c.name || c.nickname || '', nickname: c.nickname || c.name || '',
                    image: c.photos?.[0]?.url || '', background: c.background_photos?.[0]?.url || '',
                };
                return { name: character.nickname, characters: [character] };
            } catch (e) {
                // 404: the chat or character no longer exists on the site
                if (/\b404\b/.test(e?.message || '')) {
                    return { name: record.record_type === 'chat' ? 'Deleted chat' : 'Deleted character', characters: [] };
                }
                console.warn(`Card ${record.CHAR_ID}: site details unavailable`, e);
                return null;
            }
        })());
    }
    return cardSiteInfoCache.get(record.CHAR_ID).then(info => {
        if (info) cardSiteInfoNames.set(record.CHAR_ID, info.name);
        return info;
    });
}

/**
 * Name shown on a card: the chat name, the alias(es), the stored name, else the site's name.
 * @param {CharacterRecord} record
 * @param {CardSiteInfo|null} info
 * @returns {string}
 */
function getCardName(record, info) {
    if (record.chat_name) return record.chat_name;
    if (info && info.characters.length > 1) {
        return info.characters.map(c => record[groupFieldKey('character_alias', c.uuid)] || c.nickname).join(' & ');
    }
    return record.character_alias || record.character_name || info?.name || 'Unknown';
}

/** @param {CardSiteInfo|null} info @returns {boolean} the chat or character was deleted from the site */
function isCardDeleted(info) {
    return !!info && !info.characters.length && /^Deleted /.test(info.name);
}

/**
 * Images of the characters on a card. Group chats: each character's custom image or cut-out,
 * else its site photo. Otherwise the saved character image, else the site photo.
 * @param {CharacterRecord} record
 * @param {CardSiteInfo|null} info
 * @returns {string[]} image data or URLs
 */
function getCardCharacterImages(record, info, characterRecord) {
    if (info && info.characters.length > 1) {
        return info.characters.map(c => record[groupFieldKey('character_image', c.uuid)] ||
            record[groupFieldKey(GROUP_CUTOUT_FIELD, c.uuid)] || c.image).filter(Boolean);
    }
    const image = record.character_image || characterRecord?.character_image || info?.characters[0]?.image;
    return image ? [image] : [];
}

/**
 * The saved character theme behind a single-character chat card, if any.
 * @param {CharacterRecord} record
 * @param {CardSiteInfo|null} info
 * @param {Map<string, CharacterRecord>} recordsById
 * @returns {CharacterRecord|null}
 */
function getCardCharacterRecord(record, info, recordsById) {
    if (record.record_type !== 'chat' || !info || info.characters.length !== 1) return null;
    return recordsById.get(info.characters[0].uuid) || null;
}

/**
 * Background of a card: the saved one, else the site's (preferring a character with a full-body
 * image, whose background doesn't show the character itself).
 * @param {CharacterRecord} record
 * @param {CardSiteInfo|null} info
 * @returns {string}
 */
function getCardBackground(record, info, characterRecord) {
    let background = record.background_image || record.default_background_image ||
        characterRecord?.background_image || characterRecord?.default_background_image || '';
    const urlMatch = background.match(/^url\(['"]?([^'"]+)['"]?\)$/);
    if (urlMatch) background = urlMatch[1];
    if (background) return background;
    const characters = info?.characters || [];
    return (characters.find(c => c.image && c.background) || characters.find(c => c.background))?.background || '';
}

/**
 * Processes a single card's data and images
 * @param {CharacterRecord} record
 * @param {HTMLElement} cardElement
 * @param {Map<string, CharacterRecord>} [recordsById] all records, for chat cards' character themes
 * @returns {Promise<HTMLElement|null>}
 */
async function processCardData(record, cardElement, recordsById = new Map()) {
    try {
        // Set the card container ID to the character ID
        cardElement.id = record.CHAR_ID;

        // Cache DOM queries
        const elements = {
            bgImg: cardElement.querySelector('#card-bg-image'),
            charImg: cardElement.querySelector('#card-character-image'),
            nameSpan: cardElement.querySelector('#character-name-span'),
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

        // Name and images come in once the site details are known; the card shows meanwhile
        if (elements.nameSpan) elements.nameSpan.textContent = getCardName(record, null);
        const infoReady = getCardSiteInfo(record).then(info => {
            const characterRecord = getCardCharacterRecord(record, info, recordsById);
            if (elements.nameSpan) {
                elements.nameSpan.textContent = getCardName(record, info);
                elements.nameSpan.title = elements.nameSpan.textContent;
            }
            if (elements.cardTypeTag) {
                if (isCardDeleted(info)) {
                    elements.cardTypeTag.textContent = 'Deleted';
                    elements.cardTypeTag.style.backgroundColor = 'rgba(220, 38, 38, 0.7)';
                    elements.cardTypeTag.style.borderColor = '#fca5a5';
                } else if (info && info.characters.length > 1) {
                    elements.cardTypeTag.textContent = 'Group';
                }
            }
            return {
                background: getCardBackground(record, info, characterRecord),
                characters: getCardCharacterImages(record, info, characterRecord),
            };
        });
        // Images load when the card comes into view (see observeCardImages)
        cardElement.loadCardImages = () => infoReady.then(async ({ background, characters }) => {
            const cardFront = cardElement.querySelector('.card-front');
            // A background without a character image usually shows the character itself: show it fully
            if (elements.bgImg && !characters.length) elements.bgImg.classList.remove('opacity-50');
            await Promise.all([
                elements.bgImg && setCardBackgroundImage(elements.bgImg, background),
                elements.charImg && setCardCharacterImages(elements.charImg, characters),
            ]);
            cardFront?.classList.remove('card-loading');
            if (!background && !characters.length && cardFront && !cardFront.querySelector('.card-no-image')) {
                const note = document.createElement('div');
                note.className = 'card-no-image';
                note.textContent = 'No image';
                cardFront.firstElementChild?.prepend(note);
            }
        }).catch(e => {
            console.error('Card images failed:', e);
            cardElement.querySelector('.card-front')?.classList.remove('card-loading');
        });

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
            if (element) element.value = (value || fallback).slice(0, 7); // <input type=color> takes #rrggbb
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
                    await deleteCharacterRecord(record.CHAR_ID);
                    // Remove just this card instead of rebuilding the whole viewer
                    cardElement.style.transition = 'opacity 0.25s, transform 0.25s';
                    cardElement.style.opacity = '0';
                    cardElement.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        const container = cardElement.parentElement;
                        cardElement.remove();
                        if (container && !container.children.length) {
                            container.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">No cards found matching your search.</div>';
                        }
                    }, 250);
                } catch (error) {
                    console.error('Error deleting character:', error);
                    alert('Delete failed: ' + error.message);
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
 * @param {string} background - image data or URL ('' for none)
 * @returns {Promise<void>}
 */
async function setCardBackgroundImage(bgImg, background) {
    if (background) await setImageSource(bgImg, background);
    else bgImg.style.display = 'none';
}

/**
 * Shows the card's character image(s); several (group chats) side by side, slightly overlapping.
 * @param {HTMLImageElement} charImg - the template's image, used for the first one
 * @param {string[]} images
 * @returns {Promise<void>}
 */
async function setCardCharacterImages(charImg, images) {
    if (!images.length) {
        charImg.style.display = 'none';
        return;
    }
    if (images.length === 1) {
        await setImageSource(charImg, images[0]);
        return;
    }
    const row = document.createElement('div');
    row.className = 'card-character-row';
    row.style.cssText = 'position:absolute; inset:0; display:flex; align-items:flex-end; justify-content:center; z-index:10; pointer-events:none;';
    const share = 100 / images.length;
    const imgs = images.map((_, i) => {
        const img = document.createElement('img');
        img.alt = '';
        img.style.cssText = `position:relative; height:100%; width:${share + 12}%; min-width:0; object-fit:contain; ` +
            `object-position:bottom; z-index:${images.length - i};` + (i ? ' margin-left:-12%;' : '');
        return img;
    });
    row.append(...imgs);
    charImg.replaceWith(row);
    await Promise.all(images.map((image, i) => setImageSource(imgs[i], image)));
}

/**
 * Loads each card's images once it comes near the visible part of the viewer, so the cards on
 * screen fill in first instead of waiting behind every other card's downloads.
 * @param {HTMLElement} cardContainer
 * @returns {void}
 */
function observeCardImages(cardContainer) {
    const cards = [...cardContainer.children].filter(card => card.loadCardImages);
    const load = card => {
        const loadImages = card.loadCardImages;
        delete card.loadCardImages;
        loadImages?.();
    };
    if (!('IntersectionObserver' in window)) {
        cards.forEach(load);
        return;
    }
    const observer = new IntersectionObserver(entries => {
        entries.filter(entry => entry.isIntersecting).forEach(entry => {
            observer.unobserve(entry.target);
            load(entry.target);
        });
    }, { rootMargin: '600px 0px' });
    cards.forEach(card => observer.observe(card));
}

/** Size of the downscaled copies shown on cards */
const CARD_THUMB_WIDTH = 640;

/**
 * Shows image data or a URL in an <img>. URLs are downloaded through the userscript manager
 * (the site blocks images from most other hosts), as a downscaled copy when possible so large
 * images load quickly, and shown as blob: URLs.
 * @param {HTMLImageElement} imgElement
 * @param {string} imageData
 * @returns {Promise<void>}
 */
async function setImageSource(imgElement, imageData) {
    // Hidden until it has loaded, so no broken-image icon shows meanwhile
    imgElement.classList.add('card-img-pending');
    imgElement.onload = () => imgElement.classList.remove('card-img-pending');
    imgElement.onerror = () => { imgElement.style.display = 'none'; };
    if (!isImageUrl(imageData)) {
        // Use standardized image data handling for base64/data URLs
        imgElement.src = normalizeImageData(imageData);
        return;
    }
    const thumb = `https://wsrv.nl/?w=${CARD_THUMB_WIDTH}&output=webp&q=80&url=${encodeURIComponent(imageData.replace(/^https:\/\//, ''))}`;
    for (const [url, timeout] of [[thumb, 20000], [imageData, 60000]]) {
        try {
            imgElement.src = URL.createObjectURL(await bgRequest(url, 'blob', timeout));
            return;
        } catch (e) { /* try the next way */ }
    }
    imgElement.src = imageData; // last resort: works where the site allows the host
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

        /* Cards whose images are still loading */
        .card-img-pending {
            visibility: hidden;
        }
        .card-front.card-loading {
            background-image: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%);
            background-size: 250% 100%;
            animation: card-shimmer 1.4s linear infinite;
        }
        @keyframes card-shimmer {
            from { background-position: 100% 0; }
            to { background-position: -150% 0; }
        }
        .card-no-image {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #71717a;
            font-size: 0.875rem;
            pointer-events: none;
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

        /* Sort/Search Toolbar Styles */
        #sort-search-toolbar {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background-color: #1a1d24;
            border-bottom: 1px solid #22242b;
            align-items: center;
            flex-wrap: wrap;
        }

        #sort-search-toolbar label {
            color: #ffffff;
            font-size: 0.875rem;
            white-space: nowrap;
        }

        #search-input,
        #sort-select {
            padding: 0.5rem 0.75rem;
            border-radius: 0.25rem;
            background-color: #141820;
            color: #ffffff;
            border: 1px solid #22242b;
            font-size: 0.875rem;
            transition: border-color 0.2s ease, background-color 0.2s ease;
        }

        #search-input:focus,
        #sort-select:focus {
            outline: none;
            border-color: #3498db;
            background-color: #1a1d24;
        }

        #search-input {
            flex: 1;
            min-width: 200px;
        }

        #search-input::placeholder {
            color: #666;
        }

        @media (max-width: 768px) {
            #sort-search-toolbar {
                flex-direction: column;
                gap: 0.75rem;
            }

            #search-input,
            #sort-select {
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Inject CSS for card flip animations
injectCardFlipCSS();
