(async function () {
    'use strict';

    console.log('Chat Customizer script started.');

    function fetchResource(resource) {
        console.log(`Requesting resource: ${resource}`);

        return new Promise((resolve, reject) => {
            // Get the URL of the HTML file
            const htmlUrl = GM_getResourceURL(resource);

            // Fetch the HTML content using GM_xmlhttpRequest
            GM_xmlhttpRequest({
                method: 'GET',
                url: htmlUrl,
                responseType: 'text',
                onload: function (response) {
                    console.log(`Successfully fetched resource: ${resource}`);
                    resolve(response.responseText);
                },
                onerror: function (error) {
                    console.error('Error getting HTML:', error);
                    reject(error);
                }
            });
        });
    }

    async function renderHTMLFromFile(resource) {
        try {
            const html = await fetchResource(resource);
            const element = document.createElement('div');
            element.innerHTML = html;
            console.log('Element Generated.', element);
            return element;
        } catch (error) {
            console.error('Failed to render HTML from file:', error);
            throw error;
        }
    }

    function addMenuItem(menu, itemId, resourceName, clickHandler) {
        console.log(`Adding ${itemId} menu item.`);

        if (menu.querySelector(`#${itemId}`)) {
            console.log(`${itemId} menu item already exists. Skipping.`);
            return;
        }

        renderHTMLFromFile(resourceName).then(item => {
            const referenceElement = document.querySelector('[data-floating-ui-portal]');
            if (!referenceElement) {
                console.error('Reference element not found.');
                return;
            }

            menu.appendChild(item);
            console.log(`${itemId} menu item added:`, item);

            item.addEventListener('click', clickHandler);
        });
    }

    function addCustomizeMenuItems(menu) {
        addMenuItem(menu, 'headlessui-menu-item-chat-customizer', 'customize_chat_button', () => {
            console.log('Customize menu item clicked.');

            renderHTMLFromFile('chat_customizer_body').then(chatCustomizerForm => {
                const referenceElement = document.querySelector('[data-floating-ui-portal]');
                if (!referenceElement) {
                    console.error('Reference element not found.');
                    return;
                }

                referenceElement.insertAdjacentElement('afterend', chatCustomizerForm);
                console.log('Chat customizer form inserted:', chatCustomizerForm);
            });
        });

        addMenuItem(menu, 'headlessui-menu-item-db-explorer', 'db_connect', () => {
            console.log('DB Explorer menu item clicked.');
            const CHAT_ID = window.location.pathname.split('/').filter(Boolean).pop();
            const CHAR_ID = 'char_' + CHAT_ID;

            renderHTMLFromFile('image_viewer_popup').then(imageViewerPopup => {
                const referenceElement = document.querySelector('[data-floating-ui-portal]');
                if (!referenceElement) {
                    console.error('Reference element not found.');
                    return;
                }

                referenceElement.insertAdjacentElement('afterend', imageViewerPopup);
                console.log('Image viewer popup inserted:', imageViewerPopup);
            });
        });
    }

    function onLoad() {
        console.log('Page loaded');

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.id && node.id.startsWith('headlessui-menu-items-')) {
                            console.log('Menu appeared. Node:', node);
                            addCustomizeMenuItems(node);
                        }
                    });
                }
            }
        });

        const config = { childList: true, subtree: true };
        observer.observe(document.body, config);
        console.log('MutationObserver started.');
    }

    window.addEventListener('load', onLoad);
    console.log('Event listener for window load added.');
})();
