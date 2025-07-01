// Style Browser
function initializeImageViewerCloseButtonEventHandler(image_viewer) {
    const closeButton = image_viewer.querySelector('#close-button');
    closeButton.addEventListener('click', () => {
        document.documentElement.style.cssText = '';

        const main = document.querySelector('body > main');
        main.removeAttribute('inert');

        image_viewer.style.display = 'none'; // or 'hidden' or 'unset' depending on your CSS
    });
}

// Function to handle when the image viewer is added
function handleImageViewerAdded(mutationsList, iv_observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // Check if the image viewer is added
            image_viewer = document.querySelector('#image-viewer-ui-popup')
            if (image_viewer) {
                console.log('Image Viewer found.');
                // Attach event listener to the close button
                initializeImageViewerCloseButtonEventHandler(image_viewer);
                // Render cards after initializing close button
                renderAllCardsInDiv();
                // Disconnect the observer once the form is found
                iv_observer.disconnect();
                break;
            }
        }
    }
}

/**
 * Loads all character records from the db and renders a card for each in the #card div.
 * Each card uses the character's background, character image, and color settings from db.
 */
async function renderAllCardsInDiv() {
    const cardContainer = document.getElementById('card');
    if (!cardContainer) {
        console.error('No element with id #card found.');
        return;
    }
    if (!window.db) await openDatabase();
    const tx = db.transaction('Characters', 'readonly');
    const store = tx.objectStore('Characters');
    const request = store.getAll();
    request.onsuccess = async function(event) {
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
    request.onerror = function(e) {
        console.error('Failed to load character records:', e.target.error);
    };
}

// Create a new observer
const iv_observer = new MutationObserver(handleImageViewerAdded);

// Start observing the body for changes
iv_observer.observe(document.body, { childList: true, subtree: true });

/**
 * Loads the card_layout.html template and renders it inside the div with id #card.
 * Uses renderHTMLFromFile from utils.js.
 */
async function renderCardLayoutInDiv() {
    const cardContainer = document.getElementById('card');
    if (!cardContainer) {
        console.error('No element with id #card found.');
        return;
    }
    try {
        const cardElement = await renderHTMLFromFile(card_layout_resource_name);
        cardContainer.innerHTML = '';
        cardContainer.appendChild(cardElement);
    } catch (error) {
        console.error('Failed to render card layout:', error);
    }
}
