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
                // Disconnect the observer once the form is found
                iv_observer.disconnect();
                break;
            }
        }
    }
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
