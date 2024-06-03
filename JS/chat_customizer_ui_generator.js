(async function () {
    'use strict';

    console.log('Chat Customizer script started.');

    function renderHTMLFromFile(resource, callback) {
        console.log(`Requesting resource: ${resource}`);

        // Get the URL of the HTML file
        const htmlUrl = GM_getResourceURL(resource);
        console.log(`Resource URL: ${htmlUrl}`);

        // Fetch the HTML content using GM_xmlhttpRequest
        GM_xmlhttpRequest({
            method: 'GET',
            url: htmlUrl,
            responseType: 'text',
            onload: function (response) {
                console.log(`Successfully fetched resource: ${resource}`);
                const html = response.responseText;

                // Create a modal element
                const element = document.createElement('div');
                element.innerHTML = html;

                console.log('Element Generated.', element);
                callback(element);
            },
            onerror: function (error) {
                console.error('Error loading HTML:', error);
            }
        });
    }

    function addCustomizeMenuItems(menu) {
        console.log('Adding Customize menu item.');

        if (menu.querySelector('#headlessui-menu-item-chat-customizer')) {
            console.log('Customize menu item already exists. Skipping.');
            
            return; // Avoid adding the menu item multiple times
        }

        if (menu.querySelector('#headlessui-menu-item-db-explorer')) {
            console.log('DB Explorer menu item already exists. Skipping.');

            return; // Avoid adding the menu item multiple times
        }

        renderHTMLFromFile('customize_chat_button', function (customizeMenuItem) {
            console.log('Customize menu item fetched and ready to be added.');

            // Find the reference element (floating div below which modals are loaded)
            const referenceElement = document.querySelector('[data-floating-ui-portal]');
            if (!referenceElement) {
                console.error('Reference element not found.');
                return;
            }

            menu.appendChild(customizeMenuItem);
            console.log('Customize menu item added:', customizeMenuItem);

            customizeMenuItem.addEventListener('click', () => {
                console.log('Customize menu item clicked.');

                renderHTMLFromFile('chat_customizer_body', function (chat_customizer_form) {
                    console.log('Chat customizer form fetched and ready to be inserted.');

                    // Insert the element after the reference element
                    referenceElement.insertAdjacentElement('afterend', chat_customizer_form);
                    console.log('Chat customizer form inserted:', chat_customizer_form);
                });
            });
        });

        renderHTMLFromFile('db_connect', function (dbConnectionItem) {
            console.log('Customize menu item fetched and ready to be added.');

            // Find the reference element (floating div below which modals are loaded)
            const referenceElement = document.querySelector('[data-floating-ui-portal]');
            if (!referenceElement) {
                console.error('Reference element not found.');
                return;
            }

            menu.appendChild(dbConnectionItem);
            console.log('Customize menu item added:', dbConnectionItem);

            dbConnectionItem.addEventListener('click', () => {
                console.log('DB Explorer menu item clicked.');
                const CHAT_ID = window.location.pathname.split('/').filter(Boolean).pop();
                const CHAR_ID = 'char_' + CHAT_ID;


                renderHTMLFromFile('image_viewer_popup', function (image_viewer_popup) {
                    console.log('Image Viewer fetched and ready to be inserted.');

                    // Insert the element after the reference element
                    referenceElement.insertAdjacentElement('afterend', image_viewer_popup);
                    console.log('Chat customizer form inserted:', image_viewer_popup);
                });
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
