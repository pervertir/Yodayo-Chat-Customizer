(function () {
    'use strict';

    console.log('Chat Customizer script started.');

    function renderHTMLFromFile(resource) {

        // Get the URL of the HTML file
        const htmlUrl = GM_getResourceURL(resource);

        // Fetch the HTML content using GM_xmlhttpRequest
        GM_xmlhttpRequest({
            method: 'GET',
            url: htmlUrl,
            responseType: 'text',
            onload: function (response) {
                const html = response.responseText;

                // Create a modal element
                const element = document.createElement('div');
                element.innerHTML = html;

                console.log('Element Generated.', element);
                return element;
            },
            onerror: function (error) {
                console.error('Error loading HTML:', error);
            }
        });
    }

    function addCustomizeMenuItem(menu) {
        if (menu.querySelector('#headlessui-menu-item-chat-customizer')) {
            return; // Avoid adding the menu item multiple times
        }

        const customizeMenuItem = renderHTMLFromFile('customize_chat_button') 

        menu.appendChild(customizeMenuItem);
        // console.log('Customize menu item added:', customizeMenuItem);

        customizeMenuItem.addEventListener('click', () => {
            element = renderHTMLFromFile('chat_customizer_body');
            // Find the reference element
            const referenceElement = document.querySelector('[data-floating-ui-portal]');

            // Insert the modal after the reference element
            referenceElement.insertAdjacentElement('afterend', element);
        });
    }

    function onLoad() {
        console.log('Page loaded');

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.id && node.id.startsWith('headlessui-menu-items-')) {
                            console.log('Menu appeared.');
                            addCustomizeMenuItem(node);

                        }
                    });
                }
            }
        });

        const config = { childList: true, subtree: true };
        observer.observe(document.body, config);
    }

    window.addEventListener('load', onLoad);
})();