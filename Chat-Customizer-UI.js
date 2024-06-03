(function () {
    'use strict';

    console.log('Chat Customizer script started.');

    function renderHTMLAfterTarget(resource, target) {

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
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = html;

                // Find the reference element
                const referenceElement = document.querySelector(target);

                // Insert the modal after the reference element
                referenceElement.insertAdjacentElement('afterend', modal);

                console.log('Modal created and inserted after reference element.');
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

        // const customizeMenuItem = document.createElement('button');
        // customizeMenuItem.className = 'p-3 group flex w-full items-center gap-1 text-sm font-medium transition-colors text-primaryText';
        // customizeMenuItem.id = 'headlessui-menu-item-chat-customizer';
        // customizeMenuItem.role = 'menuitem';
        // customizeMenuItem.tabIndex = -1;
        // customizeMenuItem.dataset.headlessuiState = '';

        // const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        // svgIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        // svgIcon.setAttribute('height', '24px');
        // svgIcon.setAttribute('viewBox', '0 -960 960 960');
        // svgIcon.setAttribute('width', '24px');
        // svgIcon.setAttribute('fill', '#e8eaed');
        // svgIcon.classList.add('h-6', 'w-6');
        // svgIcon.innerHTML = '<path d="M580-40q-25 0-42.5-17.5T520-100v-280q0-25 17.5-42.5T580-440h280q25 0 42.5 17.5T920-380v280q0 25-17.5 42.5T860-40H580Zm0-60h280v-32q-25-31-61-49.5T720-200q-43 0-79 18.5T580-132v32Zm140-140q25 0 42.5-17.5T780-300q0-25-17.5-42.5T720-360q-25 0-42.5 17.5T660-300q0 25 17.5 42.5T720-240ZM480-480Zm2-140q-58 0-99 41t-41 99q0 48 27 84t71 50v-90q-8-8-13-20.5t-5-23.5q0-25 17.5-42.5T482-540q14 0 25 5.5t19 14.5h90q-13-44-49.5-72T482-620ZM370-80l-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-85 65H696q-1-5-2-10.5t-3-10.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q24 25 54 42t65 22v184h-70Z"/>';
        // customizeMenuItem.appendChild(svgIcon);

        // const menuItemText = document.createElement('p');
        // menuItemText.className = 'whitespace-nowrap';
        // menuItemText.textContent = 'Customize Chat';
        // customizeMenuItem.appendChild(menuItemText);

        // const badgeDiv = document.createElement('div');
        // badgeDiv.className = 'h-3 w-3 rounded-full bg-badge';
        // customizeMenuItem.appendChild(badgeDiv);
        renderHTMLAfterTarget('customize_chat_button', '#headlessui-menu-item-\\:r18\\:') 
        // menu.appendChild(customizeMenuItem);
        // console.log('Customize menu item added:', customizeMenuItem);

        customizeMenuItem.addEventListener('click', () => {
            renderHTMLAfterTarget('chat_customizer_body', '[data-floating-ui-portal]');
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